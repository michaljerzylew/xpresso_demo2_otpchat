"use client";

import { AdaptiveOverlay, Field, useDeviceClass, type DeviceClass, type OverlayDismissReason } from "@xp/primitives";
import { useEffect, useReducer, useRef, type CSSProperties, type FormEvent, type ReactNode, type RefObject } from "react";
import { projectOfferDeadline, type ResolvedCaptureOffer, type ResolvedDeadlineOffer, type ResolvedOfferAction, type ResolvedOfferRaster, type ResolvedOfferSurface, type ResolvedWheelOffer, type ResolvedWheelSector } from "./offer-surface-model";

export type OfferMutationPhase = "idle" | "invalid" | "pending" | "success" | "error";
export type OfferSurfaceState = {
  open: boolean;
  email: string;
  suppressed: boolean;
  capturePhase: OfferMutationPhase;
  copyPhase: OfferMutationPhase;
  spinPhase: OfferMutationPhase;
  reminderPhase: OfferMutationPhase;
  suppressionPhase: OfferMutationPhase;
  lastDismissReason?: OverlayDismissReason;
  spinRequestId: number;
  resolvedSectorId?: string;
  announcement: string;
  error: string;
  now: number;
};

export type OfferSurfaceEvent =
  | { type: "open"; open: boolean; now?: number }
  | { type: "email"; value: string }
  | { type: "suppression"; checked: boolean }
  | { type: "invalid"; message: string }
  | { type: "capture-start" }
  | { type: "capture-success"; announcement: string }
  | { type: "capture-error"; message: string }
  | { type: "suppression-start" }
  | { type: "suppression-success" }
  | { type: "suppression-error"; message: string }
  | { type: "copy-start" }
  | { type: "copy-success"; announcement: string }
  | { type: "copy-error"; message: string }
  | { type: "spin-start"; requestId: number }
  | { type: "spin-resolve"; requestId: number; sectorId: string; validSectorIds: string[]; announcement: string }
  | { type: "spin-error"; requestId: number; message: string }
  | { type: "reminder-start" }
  | { type: "reminder-success"; announcement: string }
  | { type: "reminder-error"; message: string }
  | { type: "dismiss"; reason: OverlayDismissReason }
  | { type: "tick"; now: number };

export function createOfferSurfaceState(defaultOpen: boolean, now: number): OfferSurfaceState {
  return { open: defaultOpen, email: "", suppressed: false, capturePhase: "idle", copyPhase: "idle", spinPhase: "idle", reminderPhase: "idle", suppressionPhase: "idle", spinRequestId: 0, announcement: "", error: "", now };
}

export function reduceOfferSurface(state: OfferSurfaceState, event: OfferSurfaceEvent): OfferSurfaceState {
  if (event.type === "open") return { ...state, open: event.open, now: event.now ?? state.now };
  if (event.type === "email") return { ...state, email: event.value, capturePhase: state.capturePhase === "invalid" ? "idle" : state.capturePhase, spinPhase: state.spinPhase === "invalid" ? "idle" : state.spinPhase, error: "" };
  if (event.type === "suppression") return { ...state, suppressed: event.checked, suppressionPhase: "idle", error: "" };
  if (event.type === "invalid") return { ...state, capturePhase: "invalid", spinPhase: "invalid", error: event.message, announcement: event.message };
  if (event.type === "capture-start") return state.capturePhase === "pending" ? state : { ...state, capturePhase: "pending", error: "", announcement: "" };
  if (event.type === "capture-success") return { ...state, capturePhase: "success", announcement: event.announcement, error: "" };
  if (event.type === "capture-error") return { ...state, capturePhase: "error", announcement: event.message, error: event.message };
  if (event.type === "suppression-start") return { ...state, suppressionPhase: "pending" };
  if (event.type === "suppression-success") return { ...state, suppressionPhase: "success" };
  if (event.type === "suppression-error") return { ...state, suppressionPhase: "error", announcement: event.message, error: event.message };
  if (event.type === "copy-start") return state.copyPhase === "pending" ? state : { ...state, copyPhase: "pending", error: "", announcement: "" };
  if (event.type === "copy-success") return { ...state, copyPhase: "success", announcement: event.announcement, error: "" };
  if (event.type === "copy-error") return { ...state, copyPhase: "error", announcement: event.message, error: event.message };
  if (event.type === "spin-start") return state.spinPhase === "pending" ? state : { ...state, spinPhase: "pending", spinRequestId: event.requestId, error: "", announcement: "" };
  if (event.type === "spin-resolve") {
    if (state.spinPhase !== "pending" || event.requestId !== state.spinRequestId || !event.validSectorIds.includes(event.sectorId)) return state;
    return { ...state, spinPhase: "success", resolvedSectorId: event.sectorId, announcement: event.announcement, error: "" };
  }
  if (event.type === "spin-error") {
    if (state.spinPhase !== "pending" || event.requestId !== state.spinRequestId) return state;
    return { ...state, spinPhase: "error", announcement: event.message, error: event.message };
  }
  if (event.type === "reminder-start") return state.reminderPhase === "pending" ? state : { ...state, reminderPhase: "pending", error: "", announcement: "" };
  if (event.type === "reminder-success") return { ...state, reminderPhase: "success", announcement: event.announcement, error: "" };
  if (event.type === "reminder-error") return { ...state, reminderPhase: "error", announcement: event.message, error: event.message };
  if (event.type === "dismiss") return { ...state, lastDismissReason: event.reason };
  return { ...state, now: event.now };
}

export function isOfferEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.trim());
}

export type OfferSurfaceScenario = {
  open?: boolean;
  state?: "idle" | "invalid" | "pending" | "success" | "error" | "copied" | "copy-error" | "spinning" | "win" | "no-win" | "reminder-success" | "suppression-error" | "expired";
  suppressed?: boolean;
  email?: string;
  reducedMotion?: boolean;
  mediaFallback?: boolean;
  sectorId?: string;
  slotWidth?: number;
};

export type OfferSurfaceProperties = {
  model: ResolvedOfferSurface;
  open?: boolean;
  defaultOpen?: boolean;
  scenario?: OfferSurfaceScenario;
  now: () => number;
  onOpenChange?: (open: boolean) => void;
  onDismiss?: (reason: OverlayDismissReason) => void;
  onCapture?: (input: { email: string; suppressionRequested: boolean }) => void | Promise<void>;
  onCopy?: (value: string) => void | Promise<void>;
  onSpin?: (input: { email: string; requestId: number }) => string | Promise<string>;
  onRemindLater?: (sourceKey: string) => void | Promise<void>;
  onSuppress?: (input: { sourceKey: string; suppressed: true }) => void | Promise<void>;
};

const toneColors: Record<ResolvedWheelSector["tone"], string> = {
  cobalt: "oklch(0.46 0.16 258)", clay: "oklch(0.58 0.12 36)", moss: "oklch(0.5 0.11 145)", stone: "oklch(0.62 0.02 255)", amber: "oklch(0.7 0.14 82)", iris: "oklch(0.54 0.14 305)", coral: "oklch(0.62 0.16 28)",
};
const point = (angle: number, radius: number) => ({ x: 50 + Math.cos((angle * Math.PI) / 180) * radius, y: 50 + Math.sin((angle * Math.PI) / 180) * radius });
const sectorPath = (index: number) => {
  const step = 360 / 7;
  const start = point(-90 + index * step, 47);
  const end = point(-90 + (index + 1) * step, 47);
  return `M 50 50 L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A 47 47 0 0 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
};

function CompassHub() {
  return <g className="xp-offer-wheel__hub" aria-hidden="true">
    <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="31 8"/>
    {Array.from({ length: 7 }, (_, index) => {
      const angle = -80 + index * (360 / 7);
      const outer = point(angle, 7.2);
      const inner = point(angle, index % 2 ? 4.5 : 5.2);
      return <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="currentColor" strokeWidth="1" key={index}/>;
    })}
    <circle cx="52.2" cy="48.4" r="1.35" fill="currentColor"/>
  </g>;
}

export type IntrinsicWheelProperties = {
  sectors: ResolvedWheelSector[];
  possibleOutcomesLabel: string;
  phase: OfferMutationPhase;
  resolvedSectorId?: string;
  reducedMotion?: boolean;
};

export function IntrinsicWheel({ sectors, possibleOutcomesLabel, phase, resolvedSectorId, reducedMotion }: IntrinsicWheelProperties) {
  if (sectors.length !== 7) throw new Error("IntrinsicWheel requires exactly seven sectors.");
  const resolvedIndex = Math.max(0, sectors.findIndex(({ id }) => id === resolvedSectorId));
  const resolveTurn = `${720 - (resolvedIndex + 0.5) * (360 / 7)}deg`;
  return <figure className="xp-offer-wheel" data-wheel-phase={phase} data-wheel-result={resolvedSectorId} data-reduced-motion={reducedMotion || undefined}>
    <svg className="xp-offer-wheel__svg" viewBox="0 0 100 100" role="group" aria-label={possibleOutcomesLabel} style={{ "--xp-wheel-resolve": resolveTurn } as CSSProperties}>
      <g className="xp-offer-wheel__disc" role="list">
        {sectors.map((sector, index) => {
          const angle = -90 + (index + 0.5) * (360 / 7);
          const labelPoint = point(angle, 30);
          const words = sector.label.split(" ");
          return <g role="listitem" aria-label={sector.label} data-sector-id={sector.id} data-outcome-id={sector.outcomeId} key={sector.id}>
            <path d={sectorPath(index)} fill={toneColors[sector.tone]} stroke="oklch(0.97 0.006 255)" strokeWidth="0.65"/>
            <text x={labelPoint.x} y={labelPoint.y} textAnchor="middle" aria-hidden="true" transform={`rotate(${angle + 90} ${labelPoint.x} ${labelPoint.y})`}>
              <tspan x={labelPoint.x} dy={words.length > 1 ? "-0.5em" : "0.3em"}>{words[0]}</tspan>
              {words.length > 1 ? <tspan x={labelPoint.x} dy="1.1em">{words.slice(1).join(" ")}</tspan> : null}
            </text>
          </g>;
        })}
        <CompassHub/>
      </g>
      <path className="xp-offer-wheel__pointer" d="M 50 1 L 45 10 L 55 10 Z" fill="currentColor" aria-hidden="true"/>
    </svg>
  </figure>;
}

function OfferMedia({ media, deviceClass, forceFallback }: { media: ResolvedOfferRaster; deviceClass: DeviceClass; forceFallback?: boolean }) {
  const presentation = media.presentations[deviceClass];
  if (media.status === "hold" || forceFallback || !media.sources) return <section className="xp-offer-media xp-offer-media--fallback" role="img" aria-label={media.alt} data-seat-id={media.seatId} data-media-status={media.status === "hold" ? "hold" : "error"} data-media-presentation={presentation} data-fallback-tone={media.fallbackTone}><span>Media unavailable</span></section>;
  return <picture className="xp-offer-media" data-seat-id={media.seatId} data-media-status="ready" data-media-presentation={presentation} data-crop-id={media.cropIds[deviceClass]}>
    <source srcSet={media.sources.avif} type="image/avif"/><source srcSet={media.sources.webp} type="image/webp"/><img src={media.sources.jpg} alt={media.decorative ? "" : media.alt}/>
  </picture>;
}

type OfferEmailModel = ResolvedCaptureOffer["email"] | ResolvedWheelOffer["email"];

function EmailControl({ model, value, invalid, disabled, inputRef, onChange }: { model: { email: OfferEmailModel }; value: string; invalid: boolean; disabled: boolean; inputRef: RefObject<HTMLInputElement | null>; onChange: (value: string) => void }) {
  return <Field id={model.email.id} invalid={invalid} hasError={invalid}>
    <Field.Label>{model.email.label}</Field.Label>
    <Field.Input ref={inputRef} name="email" type="email" required={model.email.required} inputMode={model.email.inputMode} enterKeyHint={model.email.enterKeyHint} autoComplete={model.email.autocomplete} placeholder={model.email.placeholder} value={value} disabled={disabled} onChange={(event) => onChange(event.currentTarget.value)}/>
    {invalid ? <Field.Error>{model.email.invalidError}</Field.Error> : null}
  </Field>;
}

function CouponOutput({ value, instruction }: { value: string; instruction: string }) {
  return <section className="xp-offer-coupon"><p>{instruction}</p><output><code>{value}</code></output></section>;
}

function actionLabel(action: ResolvedOfferAction, phase: OfferMutationPhase) {
  return phase === "pending" ? action.pendingLabel ?? action.label : action.label;
}

function scenarioState(model: ResolvedOfferSurface, scenario: OfferSurfaceScenario | undefined, defaultOpen: boolean, now: number) {
  let state = createOfferSurfaceState(scenario?.open ?? defaultOpen, now);
  state = { ...state, email: scenario?.email ?? "reader@example.com", suppressed: Boolean(scenario?.suppressed) };
  const mode = scenario?.state;
  if (mode === "invalid") {
    const error = model.preset === "capture-side" || model.preset === "capture-background" || model.preset === "chance-wheel" ? model.email.invalidError : "";
    state = { ...state, capturePhase: "invalid", spinPhase: "invalid", error, announcement: error };
  }
  if (mode === "pending") state = model.preset === "chance-wheel" ? { ...state, spinPhase: "pending", spinRequestId: 1 } : { ...state, capturePhase: "pending" };
  if (mode === "success") state = { ...state, capturePhase: "success", announcement: model.actions.find(({ kind }) => kind === "submit-capture")?.successLabel ?? "" };
  if (mode === "error") {
    const action = model.preset === "chance-wheel" ? model.spinAction : model.actions.find(({ kind }) => kind === "submit-capture");
    const error = action?.errorLabel ?? "";
    state = model.preset === "chance-wheel" ? { ...state, spinPhase: "error", error, announcement: error } : { ...state, capturePhase: "error", error, announcement: error };
  }
  if (mode === "copied") state = { ...state, copyPhase: "success", announcement: model.actions.find(({ kind }) => kind === "copy-code")?.successLabel ?? "" };
  if (mode === "copy-error") {
    const error = model.actions.find(({ kind }) => kind === "copy-code")?.errorLabel ?? "";
    state = { ...state, copyPhase: "error", error, announcement: error };
  }
  if (mode === "spinning") state = { ...state, spinPhase: "pending", spinRequestId: 1 };
  if ((mode === "win" || mode === "no-win") && model.preset === "chance-wheel") {
    const requestedId = scenario?.sectorId ?? (mode === "win" ? "sector-01" : "sector-04");
    const sector = model.wheel.sectors.find(({ id }) => id === requestedId) ?? model.wheel.sectors[mode === "win" ? 0 : 3];
    const outcome = model.wheel.outcomes.find(({ id }) => id === sector.outcomeId)!;
    const template = outcome.kind === "no-award" ? model.wheel.resultAnnouncements.noWin : model.wheel.resultAnnouncements.win;
    state = { ...state, spinPhase: "success", resolvedSectorId: sector.id, announcement: template.includes("{outcome}") ? template.replace("{outcome}", sector.label) : template };
  }
  if (mode === "reminder-success") state = { ...state, reminderPhase: "success", announcement: model.actions.find(({ kind }) => kind === "remind-later")?.successLabel ?? "" };
  if (mode === "suppression-error") state = { ...state, suppressionPhase: "error", error: model.preset === "capture-side" || model.preset === "capture-background" ? model.suppression.persistenceError : "" };
  if (mode === "expired" && model.preset === "deadline-coupon") state = { ...state, now: model.deadlineMs + 1000 };
  return state;
}

export function OfferSurface({ model, open: controlledOpen, defaultOpen = false, scenario, now, onOpenChange, onDismiss, onCapture, onCopy, onSpin, onRemindLater, onSuppress }: OfferSurfaceProperties) {
  const deviceClass = useDeviceClass();
  const [state, dispatch] = useReducer(reduceOfferSurface, undefined, () => scenarioState(model, scenario, defaultOpen, now()));
  const effectiveOpen = controlledOpen ?? state.open;
  const spinCounter = useRef(state.spinRequestId);
  const spinInFlight = useRef(false);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const presentation = model.overlayPresentation;
  const countdown = model.preset === "deadline-coupon" ? projectOfferDeadline(model.deadlineMs, state.now) : undefined;
  const invalid = state.capturePhase === "invalid" || state.spinPhase === "invalid";
  const pending = state.capturePhase === "pending" || state.spinPhase === "pending";
  const feedback = invalid ? "" : state.announcement || state.error;
  const overlayStyle = scenario?.slotWidth ? { inlineSize: `${scenario.slotWidth}px`, maxInlineSize: "calc(100% - 2rem)" } as CSSProperties : undefined;

  useEffect(() => {
    if (!effectiveOpen || model.preset !== "deadline-coupon") return;
    dispatch({ type: "tick", now: now() });
    const timer = window.setInterval(() => dispatch({ type: "tick", now: now() }), 1000);
    return () => window.clearInterval(timer);
  }, [effectiveOpen, model.preset, now]);

  const commitOpen = (next: boolean) => {
    dispatch({ type: "open", open: next, now: next ? now() : undefined });
    onOpenChange?.(next);
  };
  const commitDismiss = (reason: OverlayDismissReason) => {
    dispatch({ type: "dismiss", reason });
    onDismiss?.(reason);
  };

  const submitCapture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if ((model.preset !== "capture-side" && model.preset !== "capture-background") || state.capturePhase === "pending") return;
    if (!isOfferEmail(state.email)) { dispatch({ type: "invalid", message: model.email.invalidError }); emailRef.current?.focus(); return; }
    dispatch({ type: "capture-start" });
    try {
      await onCapture?.({ email: state.email.trim(), suppressionRequested: state.suppressed });
      dispatch({ type: "capture-success", announcement: model.submitAction.successLabel ?? "" });
      if (state.suppressed) {
        dispatch({ type: "suppression-start" });
        try { await onSuppress?.({ sourceKey: model.sourceKey, suppressed: true }); dispatch({ type: "suppression-success" }); }
        catch { dispatch({ type: "suppression-error", message: model.suppression.persistenceError }); }
      }
    } catch { dispatch({ type: "capture-error", message: model.submitAction.errorLabel ?? "" }); emailRef.current?.focus(); }
  };

  const copyCoupon = async () => {
    if ((model.preset !== "coupon-band" && model.preset !== "deadline-coupon") || state.copyPhase === "pending") return;
    if (model.preset === "deadline-coupon" && countdown?.expired && !model.coupon.validAfterExpiry) return;
    dispatch({ type: "copy-start" });
    try {
      if (onCopy) await onCopy(model.coupon.value);
      else await navigator.clipboard.writeText(model.coupon.value);
      dispatch({ type: "copy-success", announcement: model.coupon.copyAction.successLabel ?? "" });
    } catch { dispatch({ type: "copy-error", message: model.coupon.copyAction.errorLabel ?? "" }); }
  };

  const spin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (model.preset !== "chance-wheel" || state.spinPhase === "pending" || spinInFlight.current) return;
    if (!isOfferEmail(state.email)) { dispatch({ type: "invalid", message: model.email.invalidError }); emailRef.current?.focus(); return; }
    spinInFlight.current = true;
    const requestId = ++spinCounter.current;
    dispatch({ type: "spin-start", requestId });
    try {
      const sectorId = await onSpin?.({ email: state.email.trim(), requestId });
      if (!sectorId) throw new Error("Missing host result.");
      const sector = model.wheel.sectors.find(({ id }) => id === sectorId);
      if (!sector) { dispatch({ type: "spin-error", requestId, message: model.spinAction.errorLabel ?? "" }); return; }
      const outcome = model.wheel.outcomes.find(({ id }) => id === sector.outcomeId)!;
      const announcement = outcome.kind === "no-award" ? model.wheel.resultAnnouncements.noWin : model.wheel.resultAnnouncements.win;
      const resolvedAnnouncement = announcement.includes("{outcome}") ? announcement.replace("{outcome}", sector.label) : announcement;
      dispatch({ type: "spin-resolve", requestId, sectorId, validSectorIds: model.wheel.sectors.map(({ id }) => id), announcement: resolvedAnnouncement });
    } catch { dispatch({ type: "spin-error", requestId, message: model.spinAction.errorLabel ?? "" }); }
    finally { spinInFlight.current = false; }
  };

  const remind = async () => {
    if (state.reminderPhase === "pending") return;
    if (model.preset === "deadline-coupon" && countdown?.expired && !model.reminderValidAfterExpiry) return;
    if (model.preset !== "chance-wheel" && model.preset !== "deadline-coupon") return;
    dispatch({ type: "reminder-start" });
    try { await onRemindLater?.(model.sourceKey); dispatch({ type: "reminder-success", announcement: model.remindAction.successLabel ?? "" }); }
    catch { dispatch({ type: "reminder-error", message: model.remindAction.errorLabel ?? "" }); }
  };

  const captureFormId = `${model.sourceKey}-capture`;
  const wheelFormId = `${model.sourceKey}-spin`;
  const media = "media" in model ? <OfferMedia media={model.media} deviceClass={deviceClass} forceFallback={scenario?.mediaFallback}/> : null;
  let task: ReactNode = null;
  let footerActions: ReactNode = null;

  if (model.preset === "capture-side" || model.preset === "capture-background") {
    task = state.capturePhase === "success" ? <section className="xp-offer-result" role="status"><strong>{model.submitAction.successLabel}</strong>{state.suppressionPhase === "error" ? <p className="xp-offer-error">{model.suppression.persistenceError}</p> : null}</section> : <form id={captureFormId} className="xp-offer-capture" onSubmit={submitCapture} noValidate>
      <EmailControl model={model} value={state.email} invalid={invalid} disabled={pending} inputRef={emailRef} onChange={(value) => dispatch({ type: "email", value })}/>
      <label className="xp-offer-suppression"><input type="checkbox" checked={state.suppressed} disabled={pending} onChange={(event) => dispatch({ type: "suppression", checked: event.currentTarget.checked })}/><span>{model.suppression.label}</span></label>
      {model.privacy ? <p className="xp-offer-privacy">{model.privacy}</p> : null}
      {state.error ? <p className="xp-offer-error">{state.error}</p> : null}
    </form>;
    footerActions = state.capturePhase === "success" ? null : <button className="xp-control xp-offer-primary" type="submit" form={captureFormId} disabled={pending} data-offer-action={model.submitAction.id}>{actionLabel(model.submitAction, state.capturePhase)}</button>;
  } else if (model.preset === "coupon-band") {
    task = <CouponOutput value={model.coupon.value} instruction={model.coupon.instruction}/>;
    footerActions = <button className="xp-control xp-offer-primary" type="button" disabled={state.copyPhase === "pending"} onClick={() => void copyCoupon()} data-offer-action={model.coupon.copyAction.id}>{actionLabel(model.coupon.copyAction, state.copyPhase)}</button>;
  } else if (model.preset === "chance-wheel") {
    task = <><IntrinsicWheel sectors={model.wheel.sectors} possibleOutcomesLabel={model.wheel.possibleOutcomesLabel} phase={state.spinPhase} resolvedSectorId={state.resolvedSectorId} reducedMotion={scenario?.reducedMotion}/><form id={wheelFormId} className="xp-offer-wheel-form" onSubmit={spin} noValidate><EmailControl model={model} value={state.email} invalid={invalid} disabled={state.spinPhase === "pending"} inputRef={emailRef} onChange={(value) => dispatch({ type: "email", value })}/></form></>;
    footerActions = <><button className="xp-control xp-offer-secondary" type="button" disabled={state.reminderPhase === "pending"} onClick={() => void remind()} data-offer-action={model.remindAction.id}>{actionLabel(model.remindAction, state.reminderPhase)}</button><button className="xp-control xp-offer-primary" type="submit" form={wheelFormId} disabled={state.spinPhase === "pending"} data-offer-action={model.spinAction.id}>{actionLabel(model.spinAction, state.spinPhase)}</button></>;
  } else {
    const deadlineModel = model as ResolvedDeadlineOffer;
    task = <>{countdown?.expired ? <h3 className="xp-offer-expired">{deadlineModel.expiredHeading}</h3> : <dl className="xp-offer-countdown">{deadlineModel.units.map((label, index) => <div key={label}><dd>{countdown?.values[index] ?? 0}</dd><dt>{label}</dt></div>)}</dl>}<CouponOutput value={deadlineModel.coupon.value} instruction={deadlineModel.coupon.instruction}/></>;
    const expired = Boolean(countdown?.expired);
    footerActions = <><button className="xp-control xp-offer-secondary" type="button" disabled={state.reminderPhase === "pending" || (expired && !deadlineModel.reminderValidAfterExpiry)} onClick={() => void remind()} data-offer-action={deadlineModel.remindAction.id}>{actionLabel(deadlineModel.remindAction, state.reminderPhase)}</button><button className="xp-control xp-offer-primary" type="button" disabled={state.copyPhase === "pending" || (expired && !deadlineModel.coupon.validAfterExpiry)} onClick={() => void copyCoupon()} data-offer-action={deadlineModel.coupon.copyAction.id}>{actionLabel(deadlineModel.coupon.copyAction, state.copyPhase)}</button></>;
  }

  return <div className="xp-offer-host" data-xp-owner="OfferSurface" data-source-key={model.sourceKey} data-terminal-candidate={model.terminalCandidate} data-media-status={model.mediaStatus} data-capture-phase={state.capturePhase} data-copy-phase={state.copyPhase} data-spin-phase={state.spinPhase} data-reminder-phase={state.reminderPhase} data-suppression-phase={state.suppressionPhase} data-last-dismiss-reason={state.lastDismissReason}>
    <AdaptiveOverlay intent="edit" presentation={presentation} why="Offer contract requires M bottom sheet, TP sheet and bounded TL through DW dialog." open={effectiveOpen} onOpenChange={commitOpen} onDismissReason={commitDismiss} modal>
      <AdaptiveOverlay.Trigger data-offer-action={model.openAction.id}>{model.openAction.label}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-offer-overlay" style={overlayStyle} data-offer-overlay data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-media-status={model.mediaStatus}>
        <AdaptiveOverlay.Body className="xp-offer-body">
          <AdaptiveOverlay.Header title={model.heading} description={model.body.map((paragraph, index) => <span key={index}>{paragraph}</span>)} closeLabel={model.dismissAction.label}/>
          <section className="xp-offer-surface" data-offer-surface data-preset={model.preset}>{media}<div className="xp-offer-task">{task}</div></section>
          <AdaptiveOverlay.Footer className="xp-offer-actions">{footerActions}<p className={["xp-offer-live", feedback ? "xp-offer-feedback" : ""].filter(Boolean).join(" ")} data-feedback-tone={state.error ? "error" : "success"} aria-live="polite" role="status">{feedback}</p></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Body>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  </div>;
}
