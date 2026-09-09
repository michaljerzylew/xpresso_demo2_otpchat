"use client";

import { OTPInput, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useCallback, useEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { AuthShell, type AuthShellScenario } from "./auth-shell";
import type { ResolvedAuthShellModel } from "./auth-model";
import type { ResolvedOtpFixture } from "./otp-model";

export const otpHostForms: Record<DeviceClass, "focused-screen" | "portrait-card" | "compact-split" | "balanced-split" | "wide-guided-split"> = {
  M: "focused-screen",
  TP: "portrait-card",
  TL: "compact-split",
  DS: "balanced-split",
  DW: "wide-guided-split",
};

export type OtpPhase = "entry" | "verifying" | "error" | "done";
export type OtpScenario = {
  phase?: OtpPhase;
  value?: string;
  recoveryOpen?: boolean;
  recoveryInvalid?: boolean;
  resendReady?: boolean;
  mediaFallback?: boolean;
  reducedData?: boolean;
  autoSubmit?: boolean;
};
export type OtpUnitProperties = {
  model: ResolvedOtpFixture;
  shellModel: ResolvedAuthShellModel;
  deviceClass?: DeviceClass;
  scenario?: OtpScenario;
  shellScenario?: AuthShellScenario;
  onVerify?: (value: string, token: number) => "done" | "error" | Promise<"done" | "error">;
  onRecoveryVerify?: (value: string) => boolean | Promise<boolean>;
  onResend?: () => void | Promise<void>;
};

export function normalizeOtpPaste(raw: string, length = 6) {
  if (!/^[\d\s-]+$/.test(raw)) return null;
  const value = raw.replace(/[\s-]+/g, "");
  return value.length === length ? value : null;
}

export function otpRemainingSeconds(deadline: number, now = Date.now()) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function useRootTextScale() {
  const [scale, setScale] = useState<"normal" | "large" | "extreme">("normal");
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const size = Number.parseFloat(getComputedStyle(root).fontSize);
      setScale(size >= 48 ? "extreme" : size >= 24 ? "large" : "normal");
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, []);
  return scale;
}

export function OtpUnit({ model, shellModel, deviceClass: explicitClass, scenario, shellScenario, onVerify, onRecoveryVerify, onResend }: OtpUnitProperties) {
  const contextClass = useDeviceClass();
  const deviceClass = explicitClass ?? contextClass;
  const textScale = useRootTextScale();
  const [value, setValue] = useState((scenario?.value ?? "").replace(/\D/g, "").slice(0, model.length));
  const [phase, setPhase] = useState<OtpPhase>(scenario?.phase ?? "entry");
  const [error, setError] = useState(scenario?.phase === "error" ? model.code.invalidError : "");
  const [announcement, setAnnouncement] = useState(scenario?.phase === "verifying" ? model.labels.verifyingAnnouncement : scenario?.phase === "done" ? model.labels.doneAnnouncement : scenario?.phase === "error" ? model.labels.errorAnnouncement : "");
  const [recoveryOpen, setRecoveryOpen] = useState(Boolean(scenario?.recoveryOpen));
  const [recoveryValue, setRecoveryValue] = useState("");
  const [recoveryError, setRecoveryError] = useState(Boolean(scenario?.recoveryInvalid));
  const initialDeadline = useMemo(() => model.resend && !scenario?.resendReady ? Date.now() + model.resend.cooldownSeconds * 1000 : 0, [model.resend, scenario?.resendReady]);
  const [resendDeadline, setResendDeadline] = useState(initialDeadline);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const recoveryTriggerRef = useRef<HTMLButtonElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<number | null>(null);
  const submissionTokenRef = useRef(0);
  const activeTokenRef = useRef(0);
  const autoSubmit = scenario?.autoSubmit ?? model.commit.autoSubmit;
  const inputId = `${model.sourceKey}-otp`;
  const errorId = `${model.sourceKey}-otp-error`;
  const statusId = `${model.sourceKey}-otp-status`;
  const resendSeconds = otpRemainingSeconds(resendDeadline, now);

  useEffect(() => {
    if (!model.resend || resendDeadline <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [model.resend, resendDeadline]);

  useEffect(() => {
    if (phase === "done") doneHeadingRef.current?.focus();
  }, [phase]);

  const verify = useCallback(async (code: string) => {
    if (phase === "verifying" || phase === "done" || code.length !== model.length) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const token = ++submissionTokenRef.current;
    activeTokenRef.current = token;
    setPhase("verifying");
    setError("");
    setAnnouncement(model.labels.verifyingAnnouncement);
    try {
      const result = await (onVerify?.(code, token) ?? Promise.resolve("done" as const));
      if (activeTokenRef.current !== token) return;
      if (result === "done") {
        setPhase("done");
        setAnnouncement(model.labels.doneAnnouncement);
      } else {
        setPhase("error");
        setError(model.code.invalidError);
        setAnnouncement(model.labels.errorAnnouncement);
        setValue("");
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    } catch {
      if (activeTokenRef.current !== token) return;
      setPhase("error");
      setError(model.code.invalidError);
      setAnnouncement(model.labels.errorAnnouncement);
      setValue("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [model, onVerify, phase]);

  useEffect(() => {
    if (!autoSubmit || value.length !== model.length || phase !== "entry") return;
    timerRef.current = window.setTimeout(() => void verify(value), 250);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [autoSubmit, model.length, phase, value, verify]);

  const changeValue = (next: string) => {
    if (phase === "verifying" || phase === "done") return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    setValue(next.replace(/\D/g, "").slice(0, model.length));
    if (phase === "error") setPhase("entry");
    setError("");
    setAnnouncement("");
  };

  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    const normalized = normalizeOtpPaste(event.clipboardData.getData("text"), model.length);
    if (normalized) {
      event.preventDefault();
      changeValue(normalized);
      return;
    }
    event.preventDefault();
    setPhase("error");
    setError(model.code.invalidError);
    setAnnouncement(model.labels.errorAnnouncement);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value.length !== model.length) {
      setPhase("error");
      setError(value ? model.code.invalidError : model.code.requiredError);
      setAnnouncement(model.labels.errorAnnouncement);
      inputRef.current?.focus();
      return;
    }
    void verify(value);
  };

  const keyboardCommit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && value.length === model.length) {
      event.preventDefault();
      void verify(value);
    }
  };

  const openRecovery = () => {
    setRecoveryOpen(true);
    setRecoveryError(false);
    setAnnouncement("");
  };
  const closeRecovery = () => {
    setRecoveryOpen(false);
    setRecoveryError(false);
    requestAnimationFrame(() => recoveryTriggerRef.current?.focus());
  };
  const submitRecovery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valid = recoveryValue.trim().length >= 8 && (await (onRecoveryVerify?.(recoveryValue.trim()) ?? true));
    if (!valid) {
      setRecoveryError(true);
      return;
    }
    setPhase("done");
    setAnnouncement(model.labels.doneAnnouncement);
  };
  const resend = async () => {
    if (!model.resend || resendSeconds > 0 || phase === "verifying") return;
    await onResend?.();
    setResendDeadline(Date.now() + model.resend.cooldownSeconds * 1000);
    setNow(Date.now());
    setAnnouncement(model.resend.announcement);
  };

  const recovery = model.recovery;
  const resendWaitingLabel = model.resend && resendSeconds > 0
    ? model.resend.waitingLabel.includes("{{time}}")
      ? model.resend.waitingLabel.replace("{{time}}", `${resendSeconds}s`)
      : `${model.resend.waitingLabel} ${resendSeconds}s`
    : "";
  const content = phase === "done" ? (
    <section className="xp-otp__result" data-otp-result="done">
      <h2 ref={doneHeadingRef} tabIndex={-1}>{model.done.heading}</h2>
      <p>{model.done.body}</p>
      <a href={model.done.href}>{model.done.action}</a>
    </section>
  ) : recoveryOpen && recovery ? (
    <form className="xp-otp__recovery" onSubmit={submitRecovery} noValidate aria-label={recovery.heading}>
      <header><h2>{recovery.heading}</h2><p>{recovery.body}</p></header>
      <label htmlFor={`${inputId}-recovery`}>{recovery.codeLabel}</label>
      <input id={`${inputId}-recovery`} value={recoveryValue} placeholder={recovery.placeholder} autoComplete="one-time-code" onChange={(event) => { setRecoveryValue(event.currentTarget.value); setRecoveryError(false); }} aria-invalid={recoveryError || undefined} aria-describedby={recoveryError ? `${errorId}-recovery` : undefined}/>
      {recoveryError ? <p id={`${errorId}-recovery`} className="xp-otp__error" role="alert">{recovery.invalid}</p> : null}
      <div className="xp-otp__recovery-actions"><button type="submit">{recovery.submit}</button><button type="button" onClick={closeRecovery}>{recovery.cancel}</button></div>
    </form>
  ) : (
    <form className="xp-otp__form" action={model.commit.action} method={model.commit.method} noValidate aria-label={model.labels.formAria} aria-busy={phase === "verifying" || undefined} onSubmit={submit} data-otp-form-owner="">
      <input type="hidden" name="sourceKey" value={model.sourceKey}/>
      {model.maskedTarget ? <p className="xp-otp__target">{model.maskedTarget}</p> : null}
      <label className="xp-otp__label" htmlFor={inputId}>{model.code.label}</label>
      <div className="xp-otp__control" data-otp-state={phase}>
        <OTPInput
          ref={inputRef}
          id={inputId}
          name="code"
          maxLength={model.length}
          value={value}
          onChange={changeValue}
          onPaste={paste}
          onKeyDown={keyboardCommit}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern={"^[0-9]+$"}
          disabled={phase === "verifying"}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${statusId}${error ? ` ${errorId}` : ""}`}
          pushPasswordManagerStrategy="none"
          pasteTransformer={(pasted) => pasted.replace(/[\s-]+/g, "")}
          render={({ slots }) => <div className="xp-otp__slots" aria-hidden="true">{slots.map((slot, index) => <span className="xp-otp__slot" data-active={slot.isActive || undefined} data-filled={Boolean(slot.char) || undefined} key={index}>{slot.char ?? ""}{slot.hasFakeCaret ? <i/> : null}</span>)}</div>}
        />
      </div>
      <p id={statusId} className="xp-otp__status">{phase === "verifying" ? model.labels.verifyingAnnouncement : ""}</p>
      {error ? <p id={errorId} className="xp-otp__error" role="alert">{error}</p> : null}
      {model.resend ? <div className="xp-otp__meta"><button type="button" disabled={resendSeconds > 0 || phase === "verifying"} onClick={() => void resend()}>{resendSeconds > 0 ? resendWaitingLabel : model.resend.label}</button><span>{resendSeconds > 0 ? "" : model.resend.availableLabel}</span></div> : null}
      {recovery ? <button ref={recoveryTriggerRef} className="xp-otp__recovery-trigger" type="button" disabled={phase === "verifying"} onClick={openRecovery}>{recovery.label}</button> : null}
      <button className="xp-otp__commit" type="submit" disabled={phase === "verifying"}>{phase === "verifying" ? model.labels.verifyingAnnouncement : model.commit.label}</button>
    </form>
  );

  return <section className="xp-otp-unit" data-xp-owner="OtpUnit" data-source-key={model.sourceKey} data-device-class={deviceClass} data-otp-form={otpHostForms[deviceClass]} data-otp-preset={model.otpPreset} data-otp-state={phase} data-media-status={model.mediaStatus} data-text-scale={textScale}>
    <AuthShell model={shellModel} deviceClass={deviceClass} scenario={{ ...shellScenario, mediaFallback: scenario?.mediaFallback ?? shellScenario?.mediaFallback, reducedData: scenario?.reducedData ?? shellScenario?.reducedData }}>
      <div className="xp-otp__surface">{content}<p className="xp-otp__announcement" aria-live="polite" role="status">{announcement}</p></div>
    </AuthShell>
  </section>;
}
