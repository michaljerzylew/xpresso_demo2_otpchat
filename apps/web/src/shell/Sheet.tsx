// A shell-owned modal sheet: @xp/motion supplies the physics, the dialog supplies the semantics.
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { sheet, type MotionOptions } from "@xp/motion";
import { useDeviceClassLock } from "@xp/runtime";
import { currentInput, inputFor, intensityOptions, useMotionIntensity, usePressSurface } from "./motion";

type SheetHost = { acquire: () => () => void };
const SheetHostContext = createContext<SheetHost | null>(null);

/** The shell keeps its background inert while any sheet owns the screen. */
export function useSheetHost() {
  const [count, setCount] = useState(0);
  const host = useMemo<SheetHost>(() => ({
    acquire() {
      setCount(open => open + 1);
      let released = false;
      return () => {
        if (released) return;
        released = true;
        setCount(open => open - 1);
      };
    },
  }), []);
  return { anyOpen: count > 0, host };
}

export function SheetHostProvider({ host, children }: { host: SheetHost; children: ReactNode }) {
  return <SheetHostContext.Provider value={host}>{children}</SheetHostContext.Provider>;
}

type SheetProperties = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  returnFocus?: RefObject<HTMLElement | null>;
  /** Controls that belong beside the heading rather than in a band of their own. */
  actions?: ReactNode;
  /** "y" is a bottom sheet, "x" a side drawer; both use the same gesture physics. */
  axis?: "x" | "y";
  className?: string;
  children: ReactNode;
};

export function Sheet({ open, onClose, title, description, closeLabel, returnFocus, actions, axis = "y", className, children }: SheetProperties) {
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const grip = useRef<HTMLButtonElement>(null);
  const binding = useRef<ReturnType<typeof sheet> | undefined>(undefined);
  const closedPoint = useRef(0);
  const closing = useRef(false);
  const host = useContext(SheetHostContext);
  const intensity = useMotionIntensity();
  // The lifetime effect must not restart when a parent re-renders with a new callback.
  const close = useRef(onClose);
  close.current = onClose;
  useDeviceClassLock(open);
  usePressSurface(surface, open && mounted);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open || !host) return;
    return host.acquire();
  }, [open, host]);

  useEffect(() => {
    const element = dialog.current, panel = surface.current, handle = grip.current;
    if (!open || !element || !panel || !handle) return;
    const restoreFocus = returnFocus?.current ?? document.activeElement as HTMLElement | null;
    closing.current = false;
    element.showModal();
    const box = panel.getBoundingClientRect();
    const travel = Math.max(1, axis === "x" ? box.width : box.height);
    closedPoint.current = travel;
    const bound = sheet(panel, {
      ...intensityOptions(intensity),
      handle, axis, snapPoints: [0, travel], initial: travel,
      onSnap(position) { if (position === travel) close.current(); },
    });
    binding.current = bound;
    const opening = bound.snapTo(0, { input: currentInput() });
    return () => {
      opening.cancel();
      bound.dispose();
      binding.current = undefined;
      if (element.open) element.close();
      // The tab bar loses inert in the host's following commit. Restore after that commit,
      // without stealing focus from a replacement modal opened in the meantime.
      requestAnimationFrame(() => {
        if (restoreFocus?.isConnected && !document.querySelector('dialog[open]')) restoreFocus.focus();
      });
    };
  // `mounted` gates the portal, so on the first paint of a sheet that is already open the dialog
  // ref is still null and this effect returns early. It has to run again when the portal lands,
  // or a pane opened by the URL never opens at all (#59, #101).
  }, [open, axis, intensity, returnFocus, mounted]);

  // A modal dialog blocks the page, but Tab still walks out into the browser chrome; wrap it.
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;
      // `details > summary` is natively tabbable and matches none of the usual control selectors, so
      // leaving it out let Tab walk off the last disclosure and straight out of the modal.
      const focusable = Array.from(element.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), details > summary:first-of-type, [tabindex]:not([tabindex="-1"])'))
        .filter(node => node.checkVisibility());
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey ? active === first || !element.contains(active) : active === last || !element.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    element.addEventListener("keydown", onKeyDown);
    return () => element.removeEventListener("keydown", onKeyDown);
  }, [open, mounted]);

  const requestClose = useCallback((input: MotionOptions["input"]) => {
    const bound = binding.current;
    if (!bound) {
      close.current();
      return;
    }
    if (closing.current) return;
    closing.current = true;
    const handle = bound.snapTo(closedPoint.current, { input });
    void handle.finished.then(completed => {
      if (completed) close.current();
      else closing.current = false;
    });
  }, []);

  if (!mounted) return null;
  return createPortal(
    <dialog
      ref={dialog}
      className={["workspace-sheet", className].filter(Boolean).join(" ")}
      data-axis={axis}
      aria-label={title}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); requestClose("keyboard"); }}
      onClick={event => { if (event.target === dialog.current) requestClose("pointer"); }}
    >
      <div ref={surface} className="sheet-surface" data-sheet-surface="">
        <button
          ref={grip}
          type="button"
          data-sheet-grip=""
          className="sheet-grip"
          aria-label={"Drag to move this panel, or press Enter to " + closeLabel.toLowerCase()}
          onClick={event => { if (event.detail === 0) requestClose("keyboard"); }}
        ><span aria-hidden="true" /></button>
        <header className="sheet-header">
          <h2>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
          <div className="sheet-actions">
            {actions}
            <button type="button" className="icon-button sheet-close" aria-label={closeLabel} onClick={event => requestClose(inputFor(event.detail))}>
              <X aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}
