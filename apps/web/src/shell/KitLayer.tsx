import { useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, Popover } from "@xp/primitives/base";
import { Control } from "@xp/primitives";
import { enter, exit, type MotionHandle } from "@xp/motion";
import { useDeviceClassLock, type DeviceClass } from "@xp/runtime";
import { X } from "lucide-react";
import { Sheet } from "./Sheet";
import { currentInput, intensityOptions, motionIntensity, usePressSurface } from "./motion";

/**
 * Shell owns floating geometry and motion; consumers supply semantic content and class only.
 *
 * A layer normally owns its own open state and its own trigger button. A route that opens one from a
 * gesture rather than from a button - the calendar's drag-to-create - passes `open`/`onOpenChange`
 * and turns the trigger off; the surface, its motion and its focus contract are unchanged.
 * `primaryAction` styles the trigger, so the two options are independent.
 */
export function KitLayer({ kind, deviceClass, label, title, children, primaryAction = false, open: openProp, onOpenChange, showTrigger = true, triggerIcon }: { kind: "dialog" | "sheet" | "popover" | "menu"; deviceClass: DeviceClass; label: string; title: string; children: ReactNode | ((close: () => void) => ReactNode); primaryAction?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void; showTrigger?: boolean; triggerIcon?: ReactNode }) {
  const [selfOpen, setSelfOpen] = useState(false);
  const open = openProp ?? selfOpen;
  const setOpen = (value: boolean) => { if (openProp === undefined) setSelfOpen(value); onOpenChange?.(value); };
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const running = useRef<MotionHandle | undefined>(undefined);
  const sheetForm = kind === "sheet" || deviceClass === "M" || (kind === "dialog" && deviceClass === "TP");
  const floating = kind === "popover" || kind === "menu";
  useDeviceClassLock(open);
  usePressSurface(panel, open);
  const close = () => {
    if (sheetForm) { setOpen(false); return; }
    running.current?.cancel();
    if (!panel.current) { setOpen(false); setVisible(false); return; }
    const handle = exit(panel.current, { ...intensityOptions(motionIntensity()), input: currentInput(), trigger: trigger.current ?? undefined });
    running.current = handle;
    void handle.finished.then(done => { if (done) { setOpen(false); setVisible(false); } });
  };
  // A controlled layer is opened by whatever handled the gesture, so the portal has to mount from
  // the state rather than from the trigger's click.
  useEffect(() => { if (open) setVisible(true); }, [open]);
  useEffect(() => {
    if (!open || sheetForm || !panel.current) return;
    running.current = enter(panel.current, { ...intensityOptions(motionIntensity()), input: currentInput(), trigger: trigger.current ?? undefined });
    return () => running.current?.cancel();
  }, [open, sheetForm]);
  const body = typeof children === "function" ? children(close) : children;
  const button = <Control ref={trigger} type="button" data-route-focus-key={"layer:" + label} className="kit-button" data-tone={primaryAction ? "primary" : "neutral"} data-variant={primaryAction ? "solid" : "outline"} onClick={() => { setVisible(true); setOpen(true); }} aria-expanded={open} aria-label={triggerIcon ? label : undefined} title={triggerIcon ? label : undefined}>{triggerIcon ?? label}</Control>;
  if (sheetForm) return <>{showTrigger && button}<Sheet open={open} onClose={() => setOpen(false)} title={title} description={kind === "dialog" ? "Changes stay in this demo session." : undefined} closeLabel={"Close " + title.toLowerCase()} axis={deviceClass === "M" || deviceClass === "TP" ? "y" : "x"}><div className="kit-layer-body">{body}</div></Sheet></>;
  if (floating) return <Popover.Root open={open} onOpenChange={value => { if (!value) close(); }}>{showTrigger && <Popover.Anchor asChild>{button}</Popover.Anchor>}{visible && <Popover.Portal forceMount><Popover.Content forceMount ref={panel} className="kit-floating" data-kind={kind} sideOffset={8} collisionPadding={16} aria-label={title} onEscapeKeyDown={event => { event.preventDefault(); close(); }} onInteractOutside={event => { event.preventDefault(); close(); }} onCloseAutoFocus={event => { if (!trigger.current) return; event.preventDefault(); trigger.current.focus(); }}>{kind === "menu" ? <header><h2>{title}</h2><Control className="kit-button kit-floating-dismiss" data-variant="quiet" aria-label={"Close " + title.toLowerCase()} onClick={close}><X aria-hidden="true" /></Control></header> : <h2>{title}</h2>}{body}{kind !== "menu" && <Control className="kit-button kit-floating-dismiss" onClick={close}>Close</Control>}</Popover.Content></Popover.Portal>}</Popover.Root>;
  return <Dialog.Root open={open} onOpenChange={value => { if (!value) close(); }}>{showTrigger && button}{visible && <Dialog.Portal forceMount><Dialog.Overlay className="kit-scrim" /><Dialog.Content forceMount ref={panel} className="kit-dialog" onEscapeKeyDown={event => { event.preventDefault(); close(); }} onInteractOutside={event => { event.preventDefault(); close(); }} onCloseAutoFocus={event => { if (!trigger.current) return; event.preventDefault(); trigger.current.focus(); }}><Dialog.Title>{title}</Dialog.Title><Dialog.Description>Changes stay in this demo session.</Dialog.Description>{body}<Control className="kit-button kit-layer-close" aria-label={"Close " + title.toLowerCase()} onClick={close}><X aria-hidden="true" /></Control></Dialog.Content></Dialog.Portal>}</Dialog.Root>;
}
