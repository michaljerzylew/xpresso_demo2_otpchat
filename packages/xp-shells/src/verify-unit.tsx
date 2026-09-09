"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type FormEvent } from "react";
import { AuthShell, type AuthShellScenario } from "./auth-shell";
import type { ResolvedAuthShellModel } from "./auth-model";
import type { ResolvedVerifyFixture, VerifyPhase } from "./verify-model";

export const verifyHostForms: Record<DeviceClass, "focused-screen" | "portrait-card" | "compact-split" | "balanced-split" | "wide-guided-split"> = {
  M: "focused-screen",
  TP: "portrait-card",
  TL: "compact-split",
  DS: "balanced-split",
  DW: "wide-guided-split",
};

export type VerifyStatusResult = { phase: "waiting" | "verified" | "expired" | "error" };
export type VerifyScenario = {
  phase?: VerifyPhase;
  resendReady?: boolean;
  mediaFallback?: boolean;
  reducedData?: boolean;
  autoContinue?: boolean;
  now?: number;
};
export type VerifyCheckReason = "poll" | "visible" | "manual" | "push";

export type VerifyState = {
  phase: VerifyPhase;
  requestId: number;
  inFlight: boolean;
  transientFailures: number;
  resendDeadline: number;
  resendInFlight: boolean;
  announcement: string;
  actionError: string;
};

export type VerifyEvent =
  | { type: "check-start"; requestId: number; explicit: boolean; announcement: string }
  | { type: "check-result"; requestId: number; phase: VerifyStatusResult["phase"]; announcement: string }
  | { type: "check-failed"; requestId: number; message: string }
  | { type: "resend-start" }
  | { type: "resend-success"; deadline: number; announcement: string }
  | { type: "action-failed"; message: string }
  | { type: "announce"; message: string }
  | { type: "invalidate" };

export function createVerifyState(model: ResolvedVerifyFixture, scenario?: VerifyScenario): VerifyState {
  const phase = scenario?.phase ?? "waiting";
  const terminal = phase === "verified" ? model.labels.verified.announcement : phase === "expired" ? model.labels.expired.announcement : phase === "error" ? model.labels.error.announcement : phase === "checking" ? model.labels.checkingAnnouncement : "";
  return {
    phase,
    requestId: 0,
    inFlight: phase === "checking",
    transientFailures: 0,
    resendDeadline: scenario?.resendReady ? 0 : model.resend.serverDeadline,
    resendInFlight: false,
    announcement: terminal,
    actionError: "",
  };
}

export function reduceVerifyState(state: VerifyState, event: VerifyEvent): VerifyState {
  if (event.type === "check-start") {
    if (state.inFlight || state.phase === "verified" || (!event.explicit && (state.phase === "expired" || state.phase === "error"))) return state;
    return { ...state, phase: event.explicit ? "checking" : state.phase, requestId: event.requestId, inFlight: true, announcement: event.explicit ? event.announcement : "", actionError: "" };
  }
  if (event.type === "check-result") {
    if (event.requestId !== state.requestId) return state;
    return { ...state, phase: event.phase, inFlight: false, transientFailures: 0, announcement: event.announcement, actionError: "" };
  }
  if (event.type === "check-failed") {
    if (event.requestId !== state.requestId) return state;
    const failures = state.transientFailures + 1;
    return { ...state, phase: "waiting", inFlight: false, transientFailures: failures, announcement: failures === 3 ? event.message : "", actionError: failures >= 3 ? event.message : "" };
  }
  if (event.type === "resend-start") {
    if (state.resendInFlight) return state;
    return { ...state, resendInFlight: true, actionError: "" };
  }
  if (event.type === "resend-success") return { ...state, phase: "waiting", resendInFlight: false, resendDeadline: event.deadline, announcement: event.announcement, actionError: "" };
  if (event.type === "action-failed") return { ...state, resendInFlight: false, actionError: event.message, announcement: event.message };
  if (event.type === "announce") return { ...state, announcement: event.message };
  return { ...state, requestId: state.requestId + 1, inFlight: false, transientFailures: 0, actionError: "", announcement: "" };
}

export function verifyPollDelay(baseMs: number, capMs: number, transientFailures: number) {
  return Math.min(capMs, baseMs * (2 ** Math.min(6, Math.max(0, transientFailures))));
}

export function verifyRemainingSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export type VerifyUnitProperties = {
  model: ResolvedVerifyFixture;
  shellModel: ResolvedAuthShellModel;
  deviceClass?: DeviceClass;
  scenario?: VerifyScenario;
  shellScenario?: AuthShellScenario;
  onCheck?: (requestId: number, reason: VerifyCheckReason) => VerifyStatusResult | Promise<VerifyStatusResult>;
  onResend?: () => { serverDeadline: string } | Promise<{ serverDeadline: string }>;
  onEditEmail?: () => HTMLElement | null | void | Promise<HTMLElement | null | void>;
  onContinue?: (role: "defer" | "acknowledge") => void | Promise<void>;
  onNavigate?: (href: string) => void;
};

function announcementFor(model: ResolvedVerifyFixture, phase: VerifyStatusResult["phase"]) {
  return phase === "verified" ? model.labels.verified.announcement : phase === "expired" ? model.labels.expired.announcement : phase === "error" ? model.labels.error.announcement : "";
}

function isVerifyStatusResult(value: unknown): value is VerifyStatusResult {
  if (!value || typeof value !== "object" || !("phase" in value)) return false;
  return value.phase === "waiting" || value.phase === "verified" || value.phase === "expired" || value.phase === "error";
}

async function responseJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Request failed with ${response.status}.`);
  return response.json() as Promise<T>;
}

function InboxActions({ targets }: { targets: ResolvedVerifyFixture["mailTargets"] }) {
  if (!targets.length) return null;
  if (targets.length === 1) return <a className="xp-verify__mail xp-verify__primary" href={targets[0]!.href} target="_blank" rel="noreferrer" data-verify-action={targets[0]!.id}>{targets[0]!.label}</a>;
  return <details className="xp-verify__mail-chooser">
    <summary className="xp-verify__primary">{targets[0]!.label}</summary>
    <ul>{targets.map((target) => <li key={target.id}><a href={target.href} target="_blank" rel="noreferrer" data-verify-action={target.id}>{target.host}</a></li>)}</ul>
  </details>;
}

export function VerifyUnit({ model, shellModel, deviceClass: explicitClass, scenario, shellScenario, onCheck, onResend, onEditEmail, onContinue, onNavigate }: VerifyUnitProperties) {
  const contextClass = useDeviceClass();
  const deviceClass = explicitClass ?? contextClass;
  const [state, dispatch] = useReducer(reduceVerifyState, undefined, () => createVerifyState(model, scenario));
  const [now, setNow] = useState(() => scenario?.now ?? Date.now());
  const stateRef = useRef(state);
  const requestCounterRef = useRef(0);
  const identityRevisionRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const checkRef = useRef<(reason: VerifyCheckReason) => void>(() => undefined);
  const navigationRef = useRef(false);
  const verifiedHeadingRef = useRef<HTMLHeadingElement>(null);
  const liveId = `${model.sourceKey}-verify-live`;
  const actionErrorId = `${model.sourceKey}-verify-action-error`;
  const resendSeconds = verifyRemainingSeconds(state.resendDeadline, now);
  stateRef.current = state;

  const navigate = useCallback((href: string) => {
    if (onNavigate) onNavigate(href);
    else window.location.assign(href);
  }, [onNavigate]);

  const check = useCallback(async (reason: VerifyCheckReason) => {
    const current = stateRef.current;
    if (current.inFlight || current.phase === "verified" || (reason !== "manual" && (current.phase === "expired" || current.phase === "error"))) return;
    const requestId = ++requestCounterRef.current;
    const revision = identityRevisionRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "check-start", requestId, explicit: reason === "manual", announcement: model.labels.checkingAnnouncement });
    try {
      const result = onCheck
        ? await onCheck(requestId, reason)
        : await fetch(model.verification.statusEndpoint, { cache: "no-store", headers: { accept: "application/json" }, signal: controller.signal }).then((response) => responseJson<VerifyStatusResult>(response));
      if (!isVerifyStatusResult(result)) throw new Error("The host returned an invalid verification state.");
      if (revision !== identityRevisionRef.current || requestId !== requestCounterRef.current) return;
      dispatch({ type: "check-result", requestId, phase: result.phase, announcement: announcementFor(model, result.phase) });
    } catch (error) {
      if (controller.signal.aborted || revision !== identityRevisionRef.current || requestId !== requestCounterRef.current) return;
      dispatch({ type: "check-failed", requestId, message: model.labels.error.body });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [model, onCheck]);
  checkRef.current = (reason) => void check(reason);

  useEffect(() => {
    if (state.phase !== "waiting" || state.inFlight || document.visibilityState !== "visible") return;
    const delay = verifyPollDelay(model.verification.pollBaseMs, model.verification.pollBackoffMaxMs, state.transientFailures);
    const timer = window.setTimeout(() => checkRef.current("poll"), delay);
    return () => window.clearTimeout(timer);
  }, [model.verification.pollBackoffMaxMs, model.verification.pollBaseMs, state.inFlight, state.phase, state.transientFailures]);

  useEffect(() => {
    const visible = () => { if (document.visibilityState === "visible") checkRef.current("visible"); };
    const pageShow = () => checkRef.current("visible");
    const push = () => checkRef.current("push");
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pageshow", pageShow);
    window.addEventListener("xp:verify-status", push);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pageshow", pageShow);
      window.removeEventListener("xp:verify-status", push);
    };
  }, []);

  useEffect(() => {
    if (!state.resendDeadline || resendSeconds === 0) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(1000, Math.max(100, state.resendDeadline - Date.now())));
    return () => window.clearTimeout(timer);
  }, [resendSeconds, state.resendDeadline]);

  useEffect(() => {
    if (resendSeconds !== 0 || state.resendDeadline === 0 || state.resendInFlight) return;
    dispatch({ type: "announce", message: model.resend.availableLabel });
  }, [model.resend.availableLabel, resendSeconds, state.resendDeadline, state.resendInFlight]);

  useEffect(() => {
    if (state.phase !== "verified" || navigationRef.current) return;
    navigationRef.current = true;
    verifiedHeadingRef.current?.focus();
    if (scenario?.autoContinue === false) return;
    const timer = window.setTimeout(() => {
      void Promise.resolve(onContinue?.(model.continueAction.role)).then(() => {
        if (!onContinue) navigate(model.continueAction.href);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [model.continueAction.href, model.continueAction.role, navigate, onContinue, scenario?.autoContinue, state.phase]);

  const resend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (resendSeconds > 0 || state.resendInFlight) return;
    dispatch({ type: "resend-start" });
    try {
      const result = onResend
        ? await onResend()
        : await fetch(model.resend.action, { method: model.resend.method, headers: { accept: "application/json" } }).then((response) => responseJson<{ serverDeadline: string }>(response));
      const deadline = Date.parse(result.serverDeadline);
      if (!Number.isFinite(deadline)) throw new Error("The host did not return an absolute deadline.");
      dispatch({ type: "resend-success", deadline, announcement: model.resend.announcement });
      setNow(Date.now());
    } catch {
      dispatch({ type: "action-failed", message: model.labels.error.body });
    }
  };

  const editEmail = async () => {
    identityRevisionRef.current += 1;
    requestCounterRef.current += 1;
    abortRef.current?.abort();
    dispatch({ type: "invalidate" });
    if (onEditEmail) {
      const focusTarget = await onEditEmail();
      focusTarget?.focus();
    } else navigate(model.editEmail.href);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(model.intro.maskedAddress);
      dispatch({ type: "announce", message: model.copyAddress.announcement });
    } catch {
      dispatch({ type: "action-failed", message: model.labels.error.body });
    }
  };

  const statusContent = useMemo(() => {
    if (state.phase === "verified") return model.labels.verified;
    if (state.phase === "expired") return model.labels.expired;
    if (state.phase === "error") return model.labels.error;
    return null;
  }, [model.labels.error, model.labels.expired, model.labels.verified, state.phase]);

  const verifiedResult = state.phase === "verified" && statusContent ? <section className="xp-verify__result" data-verify-result={state.phase} aria-describedby={liveId}>
    <h2 ref={state.phase === "verified" ? verifiedHeadingRef : undefined} tabIndex={-1}>{statusContent.heading}</h2>
    <p>{statusContent.body}</p>
    <a className="xp-verify__secondary" href={model.continueAction.href} data-verify-action={model.continueAction.id}>{model.continueAction.label}</a>
  </section> : null;
  const actionForm = state.phase === "verified" ? null : <form className="xp-verify__form" action={model.resend.action} method={model.resend.method} aria-label={model.labels.formAria} aria-busy={state.phase === "checking" || state.inFlight || undefined} aria-describedby={[statusContent ? liveId : "", state.actionError ? actionErrorId : ""].filter(Boolean).join(" ") || undefined} onSubmit={resend} data-verify-form-owner="">
    {statusContent ? <section className="xp-verify__result" data-verify-result={state.phase}><h2 tabIndex={-1}>{statusContent.heading}</h2><p>{statusContent.body}</p></section> : null}
    <div className="xp-verify__address-row">
      <code>{model.intro.maskedAddress}</code>
      <button type="button" onClick={() => void copyAddress()} data-verify-action={model.copyAddress.id}>{model.copyAddress.label}</button>
    </div>
    <InboxActions targets={model.mailTargets}/>
    <a className={model.mailTargets.length ? "xp-verify__secondary" : "xp-verify__primary"} href={model.continueAction.href} data-verify-action={model.continueAction.id}>{model.continueAction.label}</a>
    <div className="xp-verify__utility">
      <button type="submit" disabled={resendSeconds > 0 || state.resendInFlight} data-verify-action={model.resend.id}>{resendSeconds > 0 ? `${model.resend.waitingLabel} ${resendSeconds}s` : model.resend.label}</button>
      <a href={model.editEmail.href} onClick={(event) => { event.preventDefault(); void editEmail(); }} data-verify-action={model.editEmail.id}>{model.editEmail.label}</a>
      {statusContent || state.transientFailures >= 3 ? <button type="button" onClick={() => checkRef.current("manual")}>{model.labels.retry}</button> : null}
    </div>
    {state.actionError ? <p className="xp-verify__error" id={actionErrorId}>{state.actionError}</p> : null}
  </form>;
  const content = verifiedResult ?? actionForm;

  return <section className="xp-verify-unit" data-xp-owner="VerifyUnit" data-source-key={model.sourceKey} data-device-class={deviceClass} data-verify-form={verifyHostForms[deviceClass]} data-verify-preset={model.verifyPreset} data-verify-state={state.phase} data-media-status={model.mediaStatus}>
    <AuthShell model={shellModel} deviceClass={deviceClass} scenario={{ ...shellScenario, mediaFallback: scenario?.mediaFallback ?? shellScenario?.mediaFallback, reducedData: scenario?.reducedData ?? shellScenario?.reducedData }}>
      <div className="xp-verify__surface">{content}<p className="xp-verify__live" id={liveId} aria-live="polite" role="status">{state.announcement}</p></div>
    </AuthShell>
  </section>;
}
