import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { getThemePreference, setThemePreference, themeModeEvent } from "@xp/theme";
import { defaultState, type ConfiguratorState } from "./config";
import { measurePairs } from "./guard";
import { normalizeState, readHash, readStorage, writeHash, writeStorage } from "./codec";
import { canRedo, canUndo, historyReducer, initialHistory } from "./history";
import { applyConfiguration } from "./apply";

function initialState(): ConfiguratorState {
  if (typeof window === "undefined") return defaultState();
  // A shared link is an explicit instruction; storage is only the fallback for a return visit.
  const state = readHash(window.location.hash) ?? readStorage(window.localStorage) ?? defaultState();
  // Colour mode is read back from the theme runtime rather than from this configuration, because
  // that preference is shared with Settings and the header menu and either may be newer. `boot.ts`
  // has already pushed a shared link's mode into the runtime, so this reads one source of truth.
  return { ...state, mode: getThemePreference() };
}

const editableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement
  && (target.isContentEditable || target instanceof HTMLTextAreaElement
    || (target instanceof HTMLInputElement && !["range", "radio", "checkbox", "button"].includes(target.type)));

export function useConfigurator() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => initialHistory(initialState()));
  const state = history.present;
  const persisted = useRef(0);

  /** `continuous` marks a slider drag, the only edit that may merge into the previous step. */
  const update = useCallback((key: string, next: ConfiguratorState, continuous = false) => {
    dispatch({ type: "edit", state: next, key, at: Date.now(), continuous });
  }, []);
  const replace = useCallback((next: ConfiguratorState) => dispatch({ type: "replace", state: normalizeState(next) }), []);
  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const reset = useCallback(() => dispatch({ type: "replace", state: defaultState() }), []);

  useEffect(() => {
    applyConfiguration(state, document, { host: true });
    // The panel writes the shared preference only when its own value has actually diverged, which
    // happens on an edit here or on undo/redo, never when the change arrived from elsewhere.
    if (state.mode !== getThemePreference()) setThemePreference(state.mode);
  }, [state]);

  // Follow the shared preference when Settings, the header menu or another tab changes it.
  useEffect(() => {
    const sync = () => dispatch({ type: "mode", mode: getThemePreference() });
    sync();
    window.addEventListener(themeModeEvent, sync);
    return () => window.removeEventListener(themeModeEvent, sync);
  }, []);

  useEffect(() => {
    // Coalesce link and storage writes: a dragged slider must not queue a hundred of them.
    window.clearTimeout(persisted.current);
    persisted.current = window.setTimeout(() => {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + writeHash(window.location.hash, state));
      writeStorage(window.localStorage, state);
    }, 150);
    return () => window.clearTimeout(persisted.current);
  }, [state]);

  // The link and storage writes are debounced, so a navigation or a closing tab inside that
  // window would drop the last change. Flush on the way out; pagehide is the one event that
  // fires for a real navigation and for a discarded tab alike.
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    const flush = () => {
      window.clearTimeout(persisted.current);
      writeStorage(window.localStorage, latest.current);
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z" || editableTarget(event.target)) return;
      event.preventDefault();
      dispatch({ type: event.shiftKey ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Every intended pairing with its ratio, so the panel can report headroom, not just failures.
  const contrast = useMemo(() => measurePairs(state), [state]);

  return { state, update, replace, undo, redo, reset, contrast, canUndo: canUndo(history), canRedo: canRedo(history) };
}

export type Configurator = ReturnType<typeof useConfigurator>;
