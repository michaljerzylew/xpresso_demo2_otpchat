// The shell owns every motion binding. Routes stay declarative; @xp/motion owns the physics.
import { createContext, useContext, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useLocation, useOutlet, UNSAFE_LocationContext } from "react-router";
import { useDeviceClass, useDeviceClassLock } from "@xp/runtime";
import { flipLayout, enter, kineticHeadline, press, routeTransition, sheet, stagger, type Direction, type MotionHandle, type MotionOptions } from "@xp/motion";

/**
 * The configurator's motion switch (#41). It is a root attribute so a preview document can be
 * reconfigured by writing into it, and the shell reads it here because the shell owns every
 * motion binding: `none` bypasses the tween, `reduced` takes the package's gentle path, and the
 * OS preference still applies on top of `fluid`. shell.css covers the declarative half.
 */
export type MotionIntensity = "off" | "reduced" | "fluid";
export function motionIntensity(): MotionIntensity {
  const value = typeof document === "undefined" ? undefined : document.documentElement.dataset.xpMotion;
  return value === "off" || value === "reduced" ? value : "fluid";
}
export function intensityOptions(intensity: MotionIntensity): MotionOptions {
  if (intensity === "off") return { frequency: "constant" };
  if (intensity === "reduced") return { reduced: true };
  return {};
}

/** Re-renders the caller when the operator moves the switch, so bindings can be replaced. */
export function useMotionIntensity(): MotionIntensity {
  const [intensity, setIntensity] = useState(motionIntensity);
  useEffect(() => {
    setIntensity(motionIntensity());
    const observer = new MutationObserver(() => setIntensity(motionIntensity()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-xp-motion"] });
    return () => observer.disconnect();
  }, []);
  return intensity;
}

let lastInput: "pointer" | "keyboard" = "pointer";
let lastInputAt = -Infinity;

/** One document-level record of the modality that started the current interaction. */
function observeInput() {
  if (typeof window === "undefined") return;
  const remember = (kind: "pointer" | "keyboard") => () => { lastInput = kind; lastInputAt = performance.now(); };
  const pointer = remember("pointer"), keyboard = remember("keyboard");
  window.addEventListener("pointerdown", pointer, true);
  window.addEventListener("keydown", keyboard, true);
  return () => {
    window.removeEventListener("pointerdown", pointer, true);
    window.removeEventListener("keydown", keyboard, true);
  };
}

/** Keyboard initiation bypasses choreography; the record expires so idle time cannot mislabel later work. */
export function currentInput(): MotionOptions["input"] {
  if (typeof performance === "undefined") return "programmatic";
  return lastInput === "keyboard" && performance.now() - lastInputAt < 1000 ? "keyboard" : "pointer";
}

/** A click carries detail 0 when the keyboard activated it. */
export const inputFor = (detail: number): MotionOptions["input"] => (detail === 0 ? "keyboard" : "pointer");

export function useInputObserver() {
  useEffect(observeInput, []);
}

const pressable = 'button, a[href], [role="button"]';
const excluded = "[data-no-press], [data-sheet-grip], :disabled, [aria-disabled=true]";

/** Binds press feedback to every control inside a container and follows its mutations. */
export function usePressSurface(root: RefObject<HTMLElement | null>, active = true) {
  const intensity = useMotionIntensity();
  useEffect(() => {
    const node = root.current;
    if (!active || !node) return;
    const options = intensityOptions(intensity);
    const bound = new Map<HTMLElement, () => void>();
    const sync = () => {
      const found = new Set(Array.from(node.querySelectorAll<HTMLElement>(pressable)).filter(element => !element.matches(excluded)));
      for (const [element, dispose] of bound) {
        if (found.has(element) && element.isConnected) continue;
        dispose();
        bound.delete(element);
      }
      for (const element of found) if (!bound.has(element)) bound.set(element, press(element, options));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-disabled"] });
    return () => {
      observer.disconnect();
      for (const dispose of bound.values()) dispose();
      bound.clear();
    };
  }, [root, active, intensity]);
}

const staggered = new Set<string>();

/**
 * Direct-load data paint only: an arriving route pane already supplies the entrance (#78). The
 * selector lets a collection name its own rows, so the kit staggers table rows and record-deck
 * cards rather than only list items (#53).
 */
export function useFirstPaintStagger(root: RefObject<HTMLElement | null>, key: string, enabled: boolean, selector = "li") {
  // Freeze the pane's initial arrival intent. Completion must not launch a
  // second entrance, nor replay rows when a filter or detail pane changes.
  const paneOwnsArrival = useRef(!useRouteSettled()).current;
  const intensity = useMotionIntensity();
  useEffect(() => {
    if (paneOwnsArrival || !enabled || staggered.has(key)) return;
    const rows = Array.from(root.current?.querySelectorAll<HTMLElement>(selector) ?? []).filter(row => {
      // A kit collection owns its rows. An enclosing list pane must not take
      // another style snapshot after that collection has already hidden them.
      const collection = row.closest(".kit-collection-arrival");
      return !collection || collection === root.current;
    });
    if (!rows.length) return;
    const handle = stagger(rows, { ...intensityOptions(intensity), input: currentInput() });
    // Return settled rows to native painting. Even a zero translate retains a
    // transformed paint context, which can leave table cells or transcripts blank.
    void handle.finished.then(completed => {
      if (completed) {
        staggered.add(key);
        handle.revert();
      }
    });
    return () => handle.revert();
  }, [root, key, enabled, selector, paneOwnsArrival, intensity]);
}

/**
 * A collection whose arrival belongs to the screen rather than to the pane (issue 101).
 *
 * `useFirstPaintStagger` declines whenever a pane owns the arrival, which is every client-side
 * navigation, and spends one module-global key per session. That is right for a list the reader
 * navigates back to: restaging it under their hands would be noise. It is wrong for a transcript,
 * which is the one thing on the screen the reader came for, and which arrives fresh every time a
 * conversation is opened from the queue beside it. This stages its rows from their first painted
 * frame, inside the same window as the pane's own entrance, so the two read as one arrival rather
 * than as a second one after it. `paneOwnsArrival` and the shared `staggered` set are untouched, so
 * every other module's route transition behaves exactly as it did.
 *
 * The key is the record: opening another conversation stages again, and re-rendering the same one
 * (a sent reply, a refiltered queue, a docked inspector) does not.
 */
export function useOwnArrival(root: RefObject<HTMLElement | null>, key: string, selector = "li") {
  const intensity = useMotionIntensity();
  const spent = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (spent.current === key) return;
    const rows = Array.from(root.current?.querySelectorAll<HTMLElement>(selector) ?? []).filter(row => {
      const collection = row.closest(".kit-collection-arrival");
      return !collection || collection === root.current;
    });
    if (!rows.length) return;
    spent.current = key;
    const handle = stagger(rows, { ...intensityOptions(intensity), input: currentInput() });
    // Settled rows go back to native painting: a retained transform context blanks a transcript.
    void handle.finished.then(completed => { if (completed) handle.revert(); });
    return () => handle.revert();
  }, [root, key, selector, intensity]);
}

/** The transcript's own arrival, keyed to the record it shows. */
export function ThreadArrival({ arrivalKey, selector = "li", children }: { arrivalKey: string; selector?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useOwnArrival(root, arrivalKey, selector);
  return <div ref={root} className="kit-collection-arrival">{children}</div>;
}

/**
 * The entrance of one row that has just joined a collection the reader is already reading (issue 101):
 * a sent reply landing at the end of a transcript. The first painted set belongs to the arrival
 * above, so nothing enters until the key has changed at least once under this instance.
 */
export function useAppendedArrival(root: RefObject<HTMLElement | null>, key: string, selector: string) {
  const known = useRef<string | undefined>(undefined);
  useEffect(() => {
    const previous = known.current;
    known.current = key;
    if (previous === undefined || previous === key || !key) return;
    const node = root.current?.querySelector<HTMLElement>(selector);
    if (!node) return;
    const handle = enter(node, { ...intensityOptions(motionIntensity()), input: currentInput() });
    void handle.finished.then(completed => { if (completed) handle.revert(); });
    return () => handle.revert();
  }, [root, key, selector]);
}

/**
 * A card deck the finger can throw sideways: one record on screen, the next one a flick away.
 * The shell owns the binding because the shell owns every gesture; `@xp/motion`'s sheet supplies
 * the house physics, so a swiped card tracks 1:1, projects its own momentum, rubber-bands at the
 * ends of the deck and settles critically damped, exactly as a bottom sheet does.
 *
 * The available snap points are the moves that exist: no previous card at the first record and no
 * next card at the last, so a flick past the end returns instead of sailing off an empty deck.
 * Every move has a visible, keyboard-operable twin in the deck's own pagination.
 */
export function useSwipeDeck(surface: RefObject<HTMLElement | null>, { index, count, onIndexChange, enabled = true }: { index: number; count: number; onIndexChange: (index: number) => void; enabled?: boolean }) {
  const intensity = useMotionIntensity();
  const [dragging, setDragging] = useState(false);
  useDeviceClassLock(dragging);
  const change = useRef(onIndexChange);
  change.current = onIndexChange;
  useEffect(() => {
    const element = surface.current;
    if (!enabled || !element || count < 2) return;
    const travel = Math.max(1, element.getBoundingClientRect().width);
    const points = [...(index < count - 1 ? [-travel] : []), 0, ...(index > 0 ? [travel] : [])];
    const bound = sheet(element, {
      ...intensityOptions(intensity),
      handle: element, axis: "x", snapPoints: points, initial: 0,
      onSnap(position) {
        if (position === 0) return;
        change.current(position < 0 ? index + 1 : index - 1);
      },
    });
    const down = () => setDragging(true);
    const up = () => setDragging(false);
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      setDragging(false);
      bound.dispose();
    };
  }, [surface, index, count, enabled, intensity]);
}

/**
 * Direction-aware arrival for paging inside one route, added for the calendar's day and range
 * pagers (#57). `RouteStage` keys on the pathname, so a pager that moves a search parameter alone
 * gets no travel from it; this gives that move the same distance, easing, keyboard bypass and
 * reduced-motion behaviour, and keeps the shell the only owner of movement.
 *
 * `order` is the page's position on its own axis - days since the epoch for a date range - so the
 * direction is derived from data rather than passed in as a motion instruction. An unchanged order
 * (switching view over the same dates) resolves to `none`, which the package renders as a crossfade
 * with no travel. Paging again mid-flight retargets the arriving pane from its current presentation
 * and drops the pane that was still leaving.
 */
export function PagerStage({ pageKey, order, className, children }: { pageKey: string; order: number; className?: string; children: ReactNode }) {
  const deviceClass = useDeviceClass();
  const [outgoing, setOutgoing] = useState<{ key: string; node: ReactNode } | null>(null);
  const snapshot = useRef<ReactNode>(children);
  const active = useRef({ key: pageKey, order });
  const incoming = useRef<HTMLDivElement | null>(null);
  const leaving = useRef<HTMLDivElement | null>(null);
  const pending = useRef<{ direction: Direction; input: MotionOptions["input"] } | null>(null);
  const running = useRef<MotionHandle | undefined>(undefined);

  // Layout effects run before paint, so the outgoing pane is mounted and positioned in the same
  // frame the new page appears: the swap is never visible on its own.
  useLayoutEffect(() => {
    if (active.current.key === pageKey) {
      snapshot.current = children;
      return;
    }
    const previous = { key: active.current.key, node: snapshot.current };
    const direction: Direction = order === active.current.order ? "none" : order > active.current.order ? "forward" : "back";
    active.current = { key: pageKey, order };
    snapshot.current = children;
    pending.current = { direction, input: currentInput() };
    setOutgoing(previous);
  });

  useLayoutEffect(() => {
    const request = pending.current;
    if (!request || !outgoing || !leaving.current || !incoming.current) return;
    pending.current = null;
    running.current?.cancel();
    const handle = routeTransition(leaving.current, incoming.current, {
      ...intensityOptions(motionIntensity()), device: deviceClass, direction: request.direction, input: request.input,
    });
    running.current = handle;
    void handle.finished.then(completed => {
      if (!completed || running.current !== handle) return;
      running.current = undefined;
      setOutgoing(null);
    });
  }, [outgoing, deviceClass]);

  useEffect(() => () => running.current?.cancel(), []);

  return <div className={["pager-stage", className].filter(Boolean).join(" ")}>
    {outgoing && <div key={outgoing.key} className="pager-pane" ref={leaving} inert aria-hidden="true">{outgoing.node}</div>}
    <div key={pageKey} className="pager-pane" data-active="true" ref={incoming}>{children}</div>
  </div>;
}

/** Kit collections share first-paint ownership with the shell, including keyboard bypass. */
export function CollectionArrival({ children, arrivalKey, selector = "tbody tr, .xp-record-deck__record, .offers-grid > li" }: { children: ReactNode; arrivalKey?: string; selector?: string }) {
  const root = useRef<HTMLDivElement>(null);
  // useLocation() throws outside a Router, while kit Table also renders standalone in tests.
  // The optional context preserves route-owned arrivals there without requiring a test Router.
  const location = useContext(UNSAFE_LocationContext);
  const collectionRoute = useRef(location?.location.pathname ?? "standalone").current;
  const settled = useRouteSettled();
  useFirstPaintStagger(root, arrivalKey ?? "collection:" + collectionRoute, settled, selector);
  return <div ref={root} className="kit-collection-arrival">{children}</div>;
}

/** Auth first paint belongs to the settled route, including compact full-screen forms. */
export function AuthArrival({ children, screen }: { children: ReactNode; screen: string }) {
  const root = useRef<HTMLDivElement>(null);
  const settled = useRouteSettled();
  useFirstPaintStagger(root, "auth-" + screen, settled, ".auth-heading, .auth-fields > .kit-field");
  return <div ref={root} className="auth-arrival">{children}</div>;
}

/**
 * First-paint stagger for any module collection (#57). One `id` per collection, spent once per
 * session, so paging, filtering or selecting a row never restages a list the reader is already using.
 */
export function ListArrival({ id, selector = "li", children }: { id: string; selector?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const settled = useRouteSettled();
  useFirstPaintStagger(root, id, settled, selector);
  return <div ref={root} className="list-arrival">{children}</div>;
}

export function StatusArrival({ children }: { children: ReactNode }) {
  const intensity = useMotionIntensity();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const handle = enter(root.current, { ...intensityOptions(intensity), input: currentInput() });
    return () => handle.revert();
  }, [intensity]);
  return <div ref={root} className="kit-status-arrival">{children}</div>;
}

const launched = new Set<string>();

/** Rare tier: static clips, one arrival per session, and the full string stays in the accessible name. */
export function KineticHeadline({ text, className }: { text: string; className?: string }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (launched.has(text) || motionIntensity() === "off") return;
    const words = Array.from(heading.current?.querySelectorAll<HTMLElement>("[data-word]") ?? []);
    if (!words.length) return;
    // The rare tier is a required argument, so the switch selects the gentle path or nothing.
    const handle = kineticHeadline(words, { frequency: "rare", ...(motionIntensity() === "reduced" ? { reduced: true } : {}) });
    void handle.finished.then(completed => { if (completed) launched.add(text); });
    return () => handle.revert();
  }, [text]);
  return <h1 ref={heading} className={className} aria-label={text}>
    {text.split(" ").map((word, index) => <span key={index}>{index ? " " : null}<span className="headline-clip" aria-hidden="true"><span data-word>{word}</span></span></span>)}
  </h1>;
}

/** Flip needs the mutation to land synchronously between the two layout reads. */
export function useLayoutFlip() {
  return useCallback((targets: (HTMLElement | null | undefined)[], mutate: () => void, options: MotionOptions = {}) => {
    const elements = targets.filter((element): element is HTMLElement => Boolean(element?.isConnected));
    if (!elements.length) {
      mutate();
      return;
    }
    flipLayout(elements, () => flushSync(mutate), { ...intensityOptions(motionIntensity()), ...options });
  }, []);
}

/** Flip targets for a layout change: the panes that survive it, never the arriving surface. */
export function routePaneTargets(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const active = root.querySelector<HTMLElement>('.route-pane[data-active="true"]') ?? root;
  const panes = Array.from(active.querySelectorAll<HTMLElement>(".route-list, .route-detail, .route-inspector"));
  return panes.length ? panes : [active];
}

/** Anchored arrival for a surface that has just taken a place in the layout. */
export function enterSurface(element: HTMLElement | null, trigger: HTMLElement | null, options: MotionOptions = {}) {
  if (element) enter(element, { ...intensityOptions(motionIntensity()), ...options, trigger: trigger ?? undefined });
}

function historyIndex() {
  const state = typeof window === "undefined" ? null : (window.history.state as { idx?: number } | null);
  return typeof state?.idx === "number" ? state.idx : 0;
}

const RouteSettled = createContext(true);

/** Non-critical route content waits for its own pane's completed arrival. */
export function useRouteSettled() {
  return useContext(RouteSettled);
}

type Pane = { key: string; outlet: ReactNode; settled: boolean };
type Pending = { outgoing: string; incoming: string; direction: Direction; input: MotionOptions["input"] };

/**
 * Route transitions keep the outgoing tree mounted until its transition completes.
 * A new navigation retargets from the current presentation instead of restarting.
 */
export function RouteStage() {
  const outlet = useOutlet();
  const location = useLocation();
  const deviceClass = useDeviceClass();
  const [panes, setPanes] = useState<Pane[]>(() => [{ key: "pane-0", outlet, settled: true }]);
  const elements = useRef(new Map<string, HTMLElement>());
  const counter = useRef(0);
  const current = useRef({ pathname: location.pathname, index: historyIndex(), key: "pane-0" });
  const pending = useRef<Pending | null>(null);
  const running = useRef<MotionHandle | undefined>(undefined);
  const focusKeys = useRef(new Map<string, string>());
  const focusRequest = useRef<{ pane: string; key?: string } | null>(null);

  useLayoutEffect(() => {
    if (current.current.pathname === location.pathname) return;
    const index = historyIndex();
    const direction: Direction = index < current.current.index ? "back" : "forward";
    const outgoing = current.current.key;
    const focusKey = document.activeElement?.getAttribute("data-route-focus-key");
    if (focusKey) focusKeys.current.set(current.current.pathname, focusKey);
    counter.current += 1;
    const incoming = "pane-" + counter.current;
    pending.current = { outgoing, incoming, direction, input: currentInput() };
    current.current = { pathname: location.pathname, index, key: incoming };
    setPanes(existing => [...existing.filter(pane => pane.key === outgoing), { key: incoming, outlet, settled: false }]);
    // The outlet element is frozen with its pane; only the new pane reads the new match.
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const request = pending.current;
    if (!request) return;
    const outgoing = elements.current.get(request.outgoing);
    const incoming = elements.current.get(request.incoming);
    if (!outgoing || !incoming) return;
    pending.current = null;
    const handle = routeTransition(outgoing, incoming, {
      ...intensityOptions(motionIntensity()),
      device: deviceClass, direction: request.direction, input: request.input,
    });
    running.current = handle;
    void handle.finished.then(completed => {
      if (!completed || running.current !== handle) return;
      running.current = undefined;
      focusRequest.current = { pane: request.incoming, key: request.direction === "back" ? focusKeys.current.get(current.current.pathname) : undefined };
      setPanes(existing => existing.filter(pane => pane.key === request.incoming).map(pane => ({ ...pane, settled: true })));
    });
  }, [panes, deviceClass]);

  // Focus after the outgoing tree (including any modal sheet) has unmounted.
  useEffect(() => {
    const request = focusRequest.current;
    if (!request || !panes.some(pane => pane.key === request.pane && pane.settled)) return;
    focusRequest.current = null;
    const incoming = elements.current.get(request.pane);
    // A reader may already be typing in the incoming pane or its portal by the time the
    // deferred route focus runs. Moving focus to the heading would dismiss that open picker.
    const active = document.activeElement;
    if (active instanceof HTMLElement && (incoming?.contains(active) || active.closest('dialog[open], [role="dialog"]'))) return;
    const target = (request.key ? Array.from(incoming?.querySelectorAll<HTMLElement>("[data-route-focus-key]") ?? []).find(node => node.dataset.routeFocusKey === request.key) : undefined)
      ?? incoming?.querySelector<HTMLElement>("h1");
    if (target) { if (target.matches("h1")) target.tabIndex = -1; target.focus({ preventScroll: true }); }
  }, [panes]);

  useEffect(() => () => running.current?.cancel(), []);

  return <div className="route-stage">
    {panes.map((pane, index) => {
      const active = index === panes.length - 1;
      return <div
        key={pane.key}
        className="route-pane"
        data-active={active}
        data-settled={pane.settled}
        inert={!active}
        aria-hidden={active ? undefined : true}
        ref={element => {
          if (element) elements.current.set(pane.key, element);
          else elements.current.delete(pane.key);
        }}
      ><RouteSettled.Provider value={pane.settled}>{pane.outlet}</RouteSettled.Provider></div>;
    })}
  </div>;
}
