"use client";

import { AdaptiveOverlay, Control, Field, MorphSlot, useDeviceClass, type DeviceClass } from "@xp/primitives";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  resolveAnnounceFixture,
  type AnnounceAction,
  type AnnounceFixture,
  type AnnounceMediaRecord,
  type AnnounceStressKey,
  type CaptureStatus,
  type ConsentStatus,
  type CopyStatus,
  type ResolvedAnnounceFixture,
  type TickerStatus,
  type TrialStatus,
} from "./announce-model";

export type AnnounceScenario = {
  expanded?: boolean;
  clock?: "live" | "expired";
  capture?: CaptureStatus;
  copy?: CopyStatus;
  ticker?: TickerStatus;
  consent?: ConsentStatus;
  trial?: TrialStatus;
};

export type AnnounceProperties = {
  fixture: AnnounceFixture;
  media: AnnounceMediaRecord[];
  stress?: AnnounceStressKey;
  scenario?: AnnounceScenario;
  className?: string;
  onAction?: (action: AnnounceAction) => void | Promise<void>;
};

type AnnounceForm = "compact-band" | "portrait-band" | "landscape-band" | "desktop-bar" | "wide-bar";
const ladder: Record<DeviceClass, AnnounceForm> = { M: "compact-band", TP: "portrait-band", TL: "landscape-band", DS: "desktop-bar", DW: "wide-bar" };
const topHeight: Record<DeviceClass, number> = { M: 64, TP: 112, TL: 72, DS: 96, DW: 120 };
const densePresets = new Set(["promo-art", "promo-deadline", "promo-capture", "coupon", "capture"]);

function actionFor(model: ResolvedAnnounceFixture, id?: string) {
  return id ? model.actions.find((action) => action.id === id) : undefined;
}

function Glyph({ name }: { name: "close" | "info" | "pause" | "play" | "copy" | "cookie" }) {
  if (name === "close") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.5 6.5 11 11m0-11-11 11" /></svg>;
  if (name === "pause") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12M16 6v12" /></svg>;
  if (name === "play") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 9 6-9 6Z" /></svg>;
  if (name === "copy") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="10" height="10" rx="2" /><path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" /></svg>;
  if (name === "cookie") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13.1A8.5 8.5 0 1 1 10.9 4a4.2 4.2 0 0 0 5.2 5.2A4.2 4.2 0 0 0 20 13.1Z" /><circle cx="8.3" cy="9.6" r=".8" /><circle cx="10" cy="15.2" r=".8" /><circle cx="15" cy="16" r=".8" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 10v6m0-9h.01" /></svg>;
}

function Media({ model }: { model: ResolvedAnnounceFixture }) {
  if (!model.media.length) return null;
  return <div className="xp-announce__media" data-media-count={model.media.length}>{model.media.map((seat) => {
    const record = model.mediaById.get(seat.id);
    if (!record) return null;
    if (model.failedMediaIds.has(seat.id)) return <div key={seat.id} className="xp-announce__media-fallback" data-media-seat-id={seat.id} data-media-role={seat.role} data-media-state="error" role="img" aria-label={`${seat.alt}. Artwork unavailable.`}><span aria-hidden="true"><Glyph name="info" /></span><small>Artwork unavailable</small></div>;
    return <img key={seat.id} src={record.src} alt={seat.alt} data-media-seat-id={seat.id} data-media-role={seat.role} data-media-state="resolved" data-crop={seat.compactCrop} />;
  })}</div>;
}

function Countdown({ model }: { model: ResolvedAnnounceFixture }) {
  if (!model.deadline) return null;
  const target = Date.parse(model.deadline.instant);
  const frozen = model.clockMode === "expired" ? target + 1_000 : Date.parse(model.frozenNow);
  const remaining = Math.max(0, target - frozen);
  if (!remaining) return <p className="xp-announce__expired" data-deadline-state="expired" role="status">{model.deadline.expiredLabel}</p>;
  const values = {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
  return <dl className="xp-announce__deadline" data-deadline-state="live" data-frozen-now={model.frozenNow}>{model.deadline.visibleUnits.map((unit) => <div key={unit} data-deadline-unit={unit}><dt>{unit.slice(0, 1).toUpperCase()}</dt><dd>{String(values[unit]).padStart(2, "0")}</dd></div>)}</dl>;
}

function TextBlock({ model }: { model: ResolvedAnnounceFixture }) {
  return <div className="xp-announce__copy">{model.badge ? <span className="xp-announce__badge">{model.badge}</span> : null}{model.title ? <h2>{model.title}</h2> : null}{model.body ? <p>{model.body}</p> : null}</div>;
}

type Interactions = {
  captureStatus: CaptureStatus;
  email: string;
  copyStatus: CopyStatus;
  tickerStatus: TickerStatus;
  consentStatus: ConsentStatus;
  trialStatus: TrialStatus;
  settingsOpen: boolean;
  setEmail: (value: string) => void;
  submitCapture: (event: FormEvent<HTMLFormElement>) => void;
  copyCoupon: () => void;
  invokeAction: (action?: AnnounceAction) => void;
  chooseConsent: (action?: AnnounceAction) => void;
  startTrial: (action?: AnnounceAction) => void;
  setTickerStatus: (status: TickerStatus) => void;
  setSettingsOpen: (open: boolean) => void;
};

function CaptureForm({ model, interactions }: { model: ResolvedAnnounceFixture; interactions: Interactions }) {
  const capture = model.capture;
  if (!capture) return null;
  const invalid = interactions.captureStatus === "invalid";
  const message = interactions.captureStatus === "idle" ? "" : capture.messages[interactions.captureStatus];
  const submit = actionFor(model, capture.submitActionId);
  return <form className="xp-announce__capture" data-capture-state={interactions.captureStatus} onSubmit={interactions.submitCapture} noValidate>
    <Field id={`${model.sourceKey}-email`} invalid={invalid} hasHelp hasError={invalid}>
      <Field.Label>{capture.field.label}</Field.Label>
      <Field.Input type="email" inputMode="email" enterKeyHint="send" autoComplete="email" placeholder={capture.field.placeholder} required value={interactions.email} onChange={(event) => interactions.setEmail(event.currentTarget.value)} disabled={interactions.captureStatus === "submitting"} />
      <Field.Help>{capture.field.help}</Field.Help>
      {invalid ? <Field.Error>{capture.messages.invalid}</Field.Error> : null}
    </Field>
    <button type="submit" className="xp-announce__action xp-announce__action--primary" data-xp-control data-action-id={submit?.id} disabled={interactions.captureStatus === "submitting"}>{interactions.captureStatus === "submitting" ? capture.messages.submitting : submit?.label}</button>
    {message && !invalid ? <p className="xp-announce__feedback" role="status" aria-live="polite">{message}</p> : null}
  </form>;
}

function LinkAction({ action, className }: { action?: AnnounceAction; className?: string }) {
  if (!action || action.kind !== "navigate" || !action.href) return null;
  return <a className={["xp-announce__action", className].filter(Boolean).join(" ")} href={action.href} data-xp-control data-action-id={action.id}>{action.label}</a>;
}

function Actions({ model, interactions, includeDismiss = false }: { model: ResolvedAnnounceFixture; interactions: Interactions; includeDismiss?: boolean }) {
  const actions = model.actions.filter((action) => includeDismiss || action.kind !== "dismiss");
  return <div className="xp-announce__actions">{actions.map((action) => {
    if (action.kind === "navigate") return <LinkAction key={action.id} action={action} className={action.id === model.primaryActionId ? "xp-announce__action--primary" : "xp-announce__action--secondary"} />;
    if (action.kind === "submit") return null;
    if (action.kind === "copy") return <button key={action.id} type="button" className="xp-announce__action xp-announce__coupon" data-xp-control data-action-id={action.id} data-copy-state={interactions.copyStatus} onClick={interactions.copyCoupon}><Glyph name="copy" /><span>{model.coupon?.value}</span><small>{interactions.copyStatus === "copied" ? model.coupon?.copiedLabel : interactions.copyStatus === "error" ? model.coupon?.errorLabel : action.label}</small></button>;
    if (action.kind === "consent-decision") return <button key={action.id} type="button" className={`xp-announce__action ${action.choice === "accept" ? "xp-announce__action--primary" : "xp-announce__action--secondary"}`} data-xp-control data-action-id={action.id} onClick={() => interactions.chooseConsent(action)}>{action.label}</button>;
    if (action.kind === "activate") return <button key={action.id} type="button" className="xp-announce__action xp-announce__action--secondary" data-xp-control data-action-id={action.id} disabled={interactions.trialStatus === "trial-pending"} onClick={() => interactions.startTrial(action)}>{interactions.trialStatus === "trial-pending" ? "Starting extension..." : action.label}</button>;
    if (action.kind === "open-settings") return null;
    return <button key={action.id} type="button" className="xp-announce__action xp-announce__action--secondary" data-xp-control data-action-id={action.id} onClick={() => interactions.invokeAction(action)}>{action.label}</button>;
  })}</div>;
}

function ConsentSettings({ model, interactions }: { model: ResolvedAnnounceFixture; interactions: Interactions }) {
  if (model.preset !== "consent-detailed") return null;
  const settings = actionFor(model, model.settingsActionId);
  return <AdaptiveOverlay intent="pick" open={interactions.settingsOpen} onOpenChange={interactions.setSettingsOpen} presentation={{ M: "bottom-sheet", TP: "sheet", TL: "popover" }} why="Consent settings keep one state owner while using native touch sheets and a bounded landscape popover.">
    <AdaptiveOverlay.Trigger className="xp-announce__action xp-announce__action--secondary" data-action-id={settings?.id}>{settings?.label}</AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-announce__overlay" data-announce-settings>
      <AdaptiveOverlay.Header title="Diagnostic settings" description="Choose whether optional performance diagnostics may run." closeLabel="Close settings" />
      <AdaptiveOverlay.Body><fieldset className="xp-announce__settings"><legend>Data use</legend><label><input type="checkbox" checked readOnly disabled /> Essential preference storage</label><label><input type="checkbox" defaultChecked={interactions.consentStatus === "accepted"} /> Optional performance diagnostics</label></fieldset></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer><AdaptiveOverlay.Close className="xp-announce__action xp-announce__action--primary">Save settings</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function Ticker({ model, interactions }: { model: ResolvedAnnounceFixture; interactions: Interactions }) {
  if (model.preset !== "ticker" || !model.messages) return null;
  const paused = interactions.tickerStatus !== "running";
  const onFocus = () => interactions.setTickerStatus("paused-focus");
  const onBlur = (event: FocusEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget)) interactions.setTickerStatus("running"); };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => { if (event.pointerType === "touch") interactions.setTickerStatus("paused-touch"); };
  return <div className="xp-announce__ticker" data-ticker-state={interactions.tickerStatus} onMouseEnter={() => interactions.setTickerStatus("paused-pointer")} onMouseLeave={() => interactions.setTickerStatus("running")} onFocus={onFocus} onBlur={onBlur} onPointerDown={onPointerDown}>
    <div className="xp-announce__ticker-lane"><ul aria-label="System updates">{model.messages.map((message, index) => <li key={message} data-ticker-record-id={`ab05-message-${index + 1}`} data-ticker-record-active={index === 0 ? "true" : undefined}><span aria-hidden="true">◆</span><span className="xp-announce__ticker-message" data-ticker-record-text>{message}</span></li>)}</ul></div>
    <Control className="xp-announce__ticker-control" aria-pressed={paused} onClick={() => interactions.setTickerStatus(paused ? "running" : "paused-touch")}><Glyph name={paused ? "play" : "pause"} /><span data-ticker-control-label>{paused ? model.resumeLabel : model.pauseLabel}</span></Control>
  </div>;
}

function CompactArtChip({ model }: { model: ResolvedAnnounceFixture }) {
  if (model.sourceKey !== "announcement-banner-01") return null;
  const seat = model.media.find(({ role }) => role === "character-group") ?? model.media.find(({ role }) => role !== "scene-backdrop");
  const record = seat ? model.mediaById.get(seat.id) : undefined;
  if (!seat || !record) return null;
  return <span className="xp-announce__art-chip" data-announce-art-chip data-art-role={seat.role} data-art-state={model.failedMediaIds.has(seat.id) ? "error" : "resolved"} aria-hidden="true">
    {model.failedMediaIds.has(seat.id) ? <Glyph name="info" /> : <img src={record.src} alt="" />}
  </span>;
}

function FullContent({ model, interactions, includeText = true }: { model: ResolvedAnnounceFixture; interactions: Interactions; includeText?: boolean }) {
  if (model.preset === "ticker") return <Ticker model={model} interactions={interactions} />;
  return <div className="xp-announce__content">
    {model.preset.startsWith("consent") ? <span className="xp-announce__emblem"><Glyph name="cookie" /></span> : null}
    <Media model={model} />
    {includeText ? <TextBlock model={model} /> : null}
    <Countdown model={model} />
    <CaptureForm model={model} interactions={interactions} />
    {model.preset === "consent-detailed" ? <ConsentSettings model={model} interactions={interactions} /> : null}
    <Actions model={model} interactions={interactions} />
    {model.preset.startsWith("consent") && interactions.consentStatus !== "unresolved" ? <p className="xp-announce__feedback" role="status" aria-live="polite">Preference saved: {interactions.consentStatus.replace("-", " ")}.</p> : null}
    {model.preset === "upsell" && interactions.trialStatus !== "open" ? <p className="xp-announce__feedback" role="status" aria-live="polite">{interactions.trialStatus === "trial-error" ? "Temporary extension failed. Try again." : interactions.trialStatus === "trial-started" ? "Temporary extension started." : "Starting temporary extension..."}</p> : null}
  </div>;
}

function CompactContent({ model, interactions, overlayOpen, setOverlayOpen }: { model: ResolvedAnnounceFixture; interactions: Interactions; overlayOpen: boolean; setOverlayOpen: (open: boolean) => void }) {
  const dismiss = actionFor(model, model.dismissActionId);
  return <div className="xp-announce__summary">
    <CompactArtChip model={model} />
    <TextBlock model={model} />
    <AdaptiveOverlay intent="detail" open={overlayOpen} onOpenChange={setOverlayOpen} presentation={{ M: "bottom-sheet", TP: "sheet", TL: "popover" }} why="Dense announcements preserve every action in a touch-native sheet or a compact landscape popover.">
      <AdaptiveOverlay.Trigger className="xp-announce__disclosure" data-announce-disclosure>{model.capture ? "Open form" : model.coupon ? "Open offer" : "View details"}</AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-announce__overlay" data-announce-detail>
        <AdaptiveOverlay.Header title={model.title ?? model.badge ?? "Announcement details"} description={model.body} closeLabel="Close details" />
        <AdaptiveOverlay.Body><FullContent model={model} interactions={interactions} includeText={false} /></AdaptiveOverlay.Body>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
    {dismiss ? <Control className="xp-announce__dismiss" aria-label={dismiss.label} data-action-id={dismiss.id} onClick={() => interactions.invokeAction(dismiss)}><Glyph name="close" /></Control> : null}
  </div>;
}

function AnnounceSurface({ model, form, interactions, overlayOpen, setOverlayOpen }: { model: ResolvedAnnounceFixture; form: AnnounceForm; interactions: Interactions; overlayOpen: boolean; setOverlayOpen: (open: boolean) => void }) {
  const compact = form === "compact-band" || form === "portrait-band" || form === "landscape-band";
  const useOverlay = compact && (densePresets.has(model.preset) || (form === "compact-band" && model.preset === "notice" && model.placement === "top-dock"));
  const dismiss = actionFor(model, model.dismissActionId);
  return <div className="xp-announce__surface" data-announce-form={form}>{useOverlay ? <CompactContent model={model} interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} /> : <><FullContent model={model} interactions={interactions} />{dismiss ? <Control className="xp-announce__dismiss" aria-label={dismiss.label} data-action-id={dismiss.id} onClick={() => interactions.invokeAction(dismiss)}><Glyph name="close" /></Control> : null}</>}</div>;
}

export function Announce({ fixture, media, stress, scenario, className, onAction }: AnnounceProperties) {
  const model = useMemo(() => {
    const resolved = resolveAnnounceFixture(fixture, media, stress);
    return scenario?.clock ? { ...resolved, clockMode: scenario.clock } : resolved;
  }, [fixture, media, scenario?.clock, stress]);
  const deviceClass = useDeviceClass();
  const [visible, setVisible] = useState(true);
  const [overlayOpen, setOverlayOpen] = useState(Boolean(scenario?.expanded));
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus>(scenario?.capture ?? model.captureOutcome ?? "idle");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(scenario?.copy ?? model.copyOutcome ?? "idle");
  const [tickerStatus, setTickerStatus] = useState<TickerStatus>(scenario?.ticker ?? "running");
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(scenario?.consent ?? "unresolved");
  const [trialStatus, setTrialStatus] = useState<TrialStatus>(scenario?.trial ?? (stress === "error" && model.preset === "upsell" ? "trial-error" : "open"));
  const [settingsOpen, setSettingsOpen] = useState(scenario?.consent === "settings-open");
  const [email, setEmail] = useState(scenario?.capture && scenario.capture !== "invalid" ? "studio@example.com" : "");
  const [bottomHeight, setBottomHeight] = useState(0);
  const surfaceRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!model.persistenceKey) return;
    const saved = localStorage.getItem(model.persistenceKey);
    if (model.dismissActionId && saved === "dismissed") setVisible(false);
    if (model.preset.startsWith("consent") && ["accepted", "rejected", "declined"].includes(saved ?? "")) setConsentStatus(saved as ConsentStatus);
    if (model.preset === "upsell" && saved === "trial-started") { setTrialStatus("trial-started"); setVisible(false); }
  }, [model.dismissActionId, model.persistenceKey, model.preset]);

  useEffect(() => {
    if (model.placement !== "floating-bottom" || !visible || !surfaceRef.current) { setBottomHeight(0); return; }
    const surface = surfaceRef.current;
    const update = () => setBottomHeight(Math.ceil(surface.getBoundingClientRect().height));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(surface);
    return () => observer.disconnect();
  }, [deviceClass, model.placement, visible]);

  useEffect(() => {
    const selector = settingsOpen ? "[data-announce-settings]" : overlayOpen ? "[data-announce-detail]" : null;
    if (!selector) return;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const overlay = document.querySelector<HTMLElement>(selector);
        if (!overlay || overlay.contains(document.activeElement)) return;
        overlay.querySelector<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), [tabindex='0']")?.focus();
      });
    });
    return () => { cancelAnimationFrame(outerFrame); cancelAnimationFrame(innerFrame); };
  }, [overlayOpen, settingsOpen]);

  const call = (action?: AnnounceAction) => action ? Promise.resolve(onAction?.(action)).then(() => undefined) : Promise.resolve();
  const invokeAction = (action?: AnnounceAction) => {
    if (!action) return;
    void call(action);
    if (action.kind === "dismiss" && model.persistenceKey) { localStorage.setItem(model.persistenceKey, "dismissed"); setVisible(false); setOverlayOpen(false); }
  };
  const submitCapture = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submit = actionFor(model, model.capture?.submitActionId);
    if (!/^\S+@\S+\.\S+$/.test(email)) { setCaptureStatus("invalid"); return; }
    setCaptureStatus("submitting");
    void call(submit).then(() => setCaptureStatus("success"), () => setCaptureStatus("error"));
  };
  const copyCoupon = () => {
    const action = actionFor(model, model.coupon?.copyActionId);
    if (!action || !model.coupon) return;
    setCopyStatus("copying"); void call(action);
    void navigator.clipboard.writeText(model.coupon.value).then(() => setCopyStatus("copied"), () => setCopyStatus("error"));
  };
  const chooseConsent = (action?: AnnounceAction) => {
    if (!action?.choice || !model.persistenceKey) return;
    const status = action.choice === "accept" ? "accepted" : action.choice === "reject" ? "rejected" : "declined";
    localStorage.setItem(model.persistenceKey, status); setConsentStatus(status); void call(action);
  };
  const startTrial = (action?: AnnounceAction) => {
    if (!action || trialStatus === "trial-pending") return;
    setTrialStatus("trial-pending");
    void call(action).then(() => {
      setTrialStatus("trial-started");
      if (action.effect === "dismiss-on-success") { if (model.persistenceKey) localStorage.setItem(model.persistenceKey, "trial-started"); setVisible(false); }
    }, () => setTrialStatus("trial-error"));
  };
  const interactions: Interactions = { captureStatus, email, copyStatus, tickerStatus, consentStatus, trialStatus, settingsOpen, setEmail, submitCapture, copyCoupon, invokeAction, chooseConsent, startTrial, setTickerStatus, setSettingsOpen };
  const renderers = {
    "compact-band": ({ core }: { core: ResolvedAnnounceFixture }) => <AnnounceSurface model={core} form="compact-band" interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} />,
    "portrait-band": ({ core }: { core: ResolvedAnnounceFixture }) => <AnnounceSurface model={core} form="portrait-band" interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} />,
    "landscape-band": ({ core }: { core: ResolvedAnnounceFixture }) => <AnnounceSurface model={core} form="landscape-band" interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} />,
    "desktop-bar": ({ core }: { core: ResolvedAnnounceFixture }) => <AnnounceSurface model={core} form="desktop-bar" interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} />,
    "wide-bar": ({ core }: { core: ResolvedAnnounceFixture }) => <AnnounceSurface model={core} form="wide-bar" interactions={interactions} overlayOpen={overlayOpen} setOverlayOpen={setOverlayOpen} />,
  };
  const heightStyle = model.placement === "top-dock" ? { "--xp-announce-height": visible ? `${topHeight[deviceClass]}px` : "0px" } : { "--xp-bottom-owner-height": `${bottomHeight}px` };

  return <section ref={surfaceRef} className={["xp-announce", className].filter(Boolean).join(" ")} style={heightStyle as CSSProperties} data-xp-owner="Announce" data-announce-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-placement={model.placement} data-device-class={deviceClass} data-stress={model.activeStress} data-visible={visible ? "true" : "false"} data-xp-region={model.placement === "top-dock" ? "top" : model.placement === "floating-bottom" ? "bottom" : undefined} data-bottom-owner={model.placement === "floating-bottom" && visible ? "announce" : undefined}>
    {visible ? <MorphSlot className="xp-announce__morph" ladder={ladder} core={model} renderers={renderers} /> : <p className="xp-announce__dismissed" role="status">Announcement dismissed.</p>}
  </section>;
}
