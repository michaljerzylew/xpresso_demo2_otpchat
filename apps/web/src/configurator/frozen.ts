import { useMemo, useSyncExternalStore } from "react";
import { defaultState } from "./config";
import { readHash, readStorage } from "./codec";
import { readPreviewState, subscribePreviewState } from "./preview";
import { measurePairs } from "./guard";
import type { Configurator } from "./useConfigurator";

const noop = () => {};

/**
 * Inside a preview frame the panel is a live mirror, not a controller: the host owns the state and
 * publishes every change into this document, so the frame's own sliders, ramps and readouts show
 * the current configuration. Edits are inert here; a second live controller would fight the host.
 */
export function useFrozenConfigurator(): Configurator {
  const published = useSyncExternalStore(subscribePreviewState, readPreviewState, () => null);
  // Until the host's first publish lands, show whatever this document can read on its own.
  const booted = useMemo(
    () => (typeof window === "undefined" ? null : readHash(window.location.hash) ?? readStorage(window.localStorage)) ?? defaultState(),
    [],
  );
  const state = published ?? booted;
  const contrast = useMemo(() => measurePairs(state), [state]);
  return { state, update: noop, replace: noop, undo: noop, redo: noop, reset: noop, contrast, canUndo: false, canRedo: false };
}
