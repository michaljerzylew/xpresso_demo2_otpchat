"use client";

import { AdaptiveOverlay, Field, StickyActionBar, useDeviceClass, type DeviceClass } from "@xp/primitives";
import {
  useEffect,
  useReducer,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import type { ResolvedRecoverFixture } from "./recover-model";

export const recoverHostForms: Record<DeviceClass, "contextual-sheet" | "contextual-card" | "inline-swap"> = {
  M:"contextual-sheet",
  TP:"contextual-card",
  TL:"inline-swap",
  DS:"inline-swap",
  DW:"inline-swap",
};

export type RecoverPhase = "idle" | "invalid" | "pending" | "error" | "sent" | "cooldown" | "resend-ready";
export type RecoverRuntimeState = {
  phase: RecoverPhase;
  email: string;
  error?: string;
  secondsRemaining: number;
  announcement: string;
};
export type RecoverRuntimeEvent =
  | { type:"change";email:string }
  | { type:"blur" }
  | { type:"submit" }
  | { type:"resolve-error" }
  | { type:"resolve-sent" }
  | { type:"begin-cooldown" }
  | { type:"tick" }
  | { type:"resend" }
  | { type:"edit-email" };
export type RecoverScenario = {
  phase?: RecoverPhase;
  invalid?: "required" | "email";
  email?: string;
  secondsRemaining?: number;
  reassuranceOpen?: boolean;
};
export type RecoverUnitProperties = {
  model: ResolvedRecoverFixture;
  deviceClass?: DeviceClass;
  scenario?: RecoverScenario;
  mode?: "contextual" | "standalone";
  open?: boolean;
  onOpenChange?: (open:boolean)=>void;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onDismiss?: ()=>void;
  onRecover?: (email:string,reason:"initial"|"resend")=>"sent"|"error"|Promise<"sent"|"error">;
  onOpenMail?: ()=>void;
  onBackToLogin?: ()=>void;
  showIntro?: boolean;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useRecoverTextScale() {
  const [scale,setScale] = useState<"normal"|"extreme">("normal");
  useEffect(()=>{
    const root=document.documentElement;
    const read=()=>setScale(parseFloat(getComputedStyle(root).fontSize)>=48?"extreme":"normal");
    read();
    const observer=new MutationObserver(read);
    observer.observe(root,{attributes:true,attributeFilter:["class","style"]});
    return()=>observer.disconnect();
  },[]);
  return scale;
}

export function validateRecoverEmail(model:ResolvedRecoverFixture,email:string) {
  if (!email.trim()) return model.field.requiredError;
  if (!EMAIL.test(email)) return model.field.invalidError;
  return undefined;
}

export function recoverCooldownLabel(model:ResolvedRecoverFixture,secondsRemaining:number) {
  return model.labels.cooldown.replace(/\b30\b/u,String(Math.max(0,secondsRemaining)));
}

export function createRecoverState(model:ResolvedRecoverFixture,scenario?:RecoverScenario):RecoverRuntimeState {
  const email = scenario?.email ?? "";
  const error = scenario?.invalid === "required"
    ? model.field.requiredError
    : scenario?.invalid === "email"
      ? model.field.invalidError
      : undefined;
  const phase = scenario?.invalid ? "invalid" : scenario?.phase ?? "idle";
  return {
    phase,
    email,
    error,
    secondsRemaining:scenario?.secondsRemaining ?? (phase === "sent" || phase === "cooldown" ? model.cooldownSeconds : 0),
    announcement:phase === "pending"
      ? model.labels.pending
      : phase === "error"
        ? model.labels.error
        : phase === "sent"
          ? model.labels.sentBody
          : phase === "cooldown"
            ? ""
            : phase === "resend-ready"
              ? model.labels.resendReady
              : "",
  };
}

export function reduceRecoverState(state:RecoverRuntimeState,event:RecoverRuntimeEvent,model:ResolvedRecoverFixture):RecoverRuntimeState {
  if (event.type === "change") {
    if (state.phase === "pending") return state;
    return {...state,email:event.email,error:undefined,phase:state.phase === "invalid" || state.phase === "error" ? "idle" : state.phase,announcement:""};
  }
  if (event.type === "blur") {
    if (state.phase === "pending") return state;
    const error = validateRecoverEmail(model,state.email);
    return error ? {...state,phase:"invalid",error,announcement:""} : {...state,error:undefined,phase:state.phase === "invalid" ? "idle" : state.phase};
  }
  if (event.type === "submit") {
    if (state.phase === "pending" || state.phase === "cooldown" || state.phase === "sent") return state;
    const error = validateRecoverEmail(model,state.email);
    return error
      ? {...state,phase:"invalid",error,announcement:""}
      : {...state,phase:"pending",error:undefined,announcement:model.labels.pending};
  }
  if (event.type === "resolve-error") {
    if (state.phase !== "pending") return state;
    return {...state,phase:"error",error:undefined,announcement:model.labels.error};
  }
  if (event.type === "resolve-sent") {
    if (state.phase !== "pending") return state;
    return {...state,phase:"sent",error:undefined,secondsRemaining:model.cooldownSeconds,announcement:model.labels.sentBody};
  }
  if (event.type === "begin-cooldown") {
    if (state.phase !== "sent") return state;
    return {...state,phase:"cooldown",secondsRemaining:model.cooldownSeconds};
  }
  if (event.type === "tick") {
    if (state.phase !== "cooldown") return state;
    if (state.secondsRemaining <= 1) return {...state,phase:"resend-ready",secondsRemaining:0,announcement:model.labels.resendReady};
    return {...state,secondsRemaining:state.secondsRemaining - 1};
  }
  if (event.type === "resend") {
    if (state.phase !== "resend-ready") return state;
    return {...state,phase:"pending",error:undefined,announcement:model.labels.pending};
  }
  if (state.phase === "pending") return state;
  return {...state,phase:"idle",error:undefined,secondsRemaining:0,announcement:""};
}

function Reassurance({
  model,
  compact,
  initialOpen,
}:{
  model:ResolvedRecoverFixture;
  compact:boolean;
  initialOpen:boolean;
}) {
  const [open,setOpen] = useState(initialOpen);
  const content = <>
    <p>{model.reassurance.body}</p>
    <ol>{model.reassurance.steps.map((step)=><li key={step.id}><strong>{step.heading}</strong><span>{step.body}</span></li>)}</ol>
  </>;
  if (compact) {
    return <details className="xp-recover__reassurance xp-recover__reassurance--disclosure" data-recover-reassurance="" open={open} onToggle={(event)=>setOpen(event.currentTarget.open)}>
      <summary>{model.reassurance.heading}</summary>
      <div>{content}</div>
    </details>;
  }
  return <section className="xp-recover__reassurance" data-recover-reassurance="" aria-labelledby={`${model.sourceKey}-reassurance`}>
    <h2 id={`${model.sourceKey}-reassurance`}>{model.reassurance.heading}</h2>
    {content}
  </section>;
}

export function RecoverUnit({
  model,
  deviceClass:explicitClass,
  scenario,
  mode="contextual",
  open=true,
  onOpenChange,
  returnFocusRef,
  onDismiss,
  onRecover,
  onOpenMail,
  onBackToLogin,
  showIntro=true,
}:RecoverUnitProperties) {
  const contextClass = useDeviceClass();
  const deviceClass = explicitClass ?? contextClass;
  const textScale = useRecoverTextScale();
  const [hydrated,setHydrated] = useState(false);
  const [state,dispatch] = useReducer(
    (current:RecoverRuntimeState,event:RecoverRuntimeEvent)=>reduceRecoverState(current,event,model),
    undefined,
    ()=>createRecoverState(model,scenario),
  );
  const compactReassurance = deviceClass === "M" || deviceClass === "TP" || deviceClass === "TL";
  const contextualOverlay = hydrated && mode === "contextual" && (deviceClass === "M" || deviceClass === "TP");
  const pending = state.phase === "pending";
  const sent = state.phase === "sent" || state.phase === "cooldown" || state.phase === "resend-ready";
  const resendReady = state.phase === "resend-ready";
  const formId = `${model.sourceKey}-recover-form`;

  useEffect(()=>setHydrated(true),[]);
  useEffect(()=>{
    if (state.phase !== "sent") return;
    if (scenario?.phase === "sent") return;
    dispatch({type:"begin-cooldown"});
  },[scenario?.phase,state.phase]);
  useEffect(()=>{
    if (state.phase !== "cooldown") return;
    const timer = setInterval(()=>dispatch({type:"tick"}),1000);
    return ()=>clearInterval(timer);
  },[state.phase]);

  const focusEmail = () => requestAnimationFrame(()=>document.getElementById(`${model.sourceKey}-email`)?.focus());
  const request = async(reason:"initial"|"resend") => {
    try {
      const outcome = await (onRecover?.(state.email,reason) ?? Promise.resolve("sent" as const));
      dispatch({type:outcome === "sent" ? "resolve-sent" : "resolve-error"});
    } catch {
      dispatch({type:"resolve-error"});
    }
  };
  const submit = (event:FormEvent<HTMLFormElement>) => {
    if (!hydrated) return;
    event.preventDefault();
    if (pending) return;
    const error = validateRecoverEmail(model,state.email);
    dispatch({type:"submit"});
    if (error) {
      focusEmail();
      return;
    }
    void request("initial");
  };
  const resend = () => {
    if (!resendReady) return;
    dispatch({type:"resend"});
    void request("resend");
  };
  const editEmail = () => {
    dispatch({type:"edit-email"});
    focusEmail();
  };
  const changeOpen = (next:boolean) => {
    onOpenChange?.(next);
    if (!next) {
      onDismiss?.();
      requestAnimationFrame(()=>returnFocusRef?.current?.focus());
    }
  };

  const reassurance = <Reassurance model={model} compact={compactReassurance} initialOpen={Boolean(scenario?.reassuranceOpen)}/>;
  const form = <div className="xp-recover__surface" data-recover-surface="">
    {mode === "standalone" && showIntro ? <header className="xp-recover__intro"><h1>{model.intro.heading}</h1><p>{model.intro.body}</p></header> : null}
    {sent ? <section className="xp-recover__sent" aria-labelledby={`${model.sourceKey}-sent-title`}>
      <header><h2 id={`${model.sourceKey}-sent-title`}>{model.labels.sentHeading}</h2><p>{model.labels.sentBody}</p><strong>{model.labels.sentMasked}</strong></header>
      <div className="xp-recover__sent-actions" data-sent-action-order="open-mail,resend,edit-email">
        {onOpenMail
          ? <button type="button" data-recover-action={model.sentActions[0].id} onClick={onOpenMail}>{model.sentActions[0].label}</button>
          : <p className="xp-recover__mail-unavailable" role="status">{model.labels.mailUnavailable}</p>}
        <button type="button" data-recover-action={model.sentActions[1].id} disabled={!resendReady} aria-describedby={`${model.sourceKey}-cooldown-status`} onClick={resend}>{model.sentActions[1].label}</button>
        <button type="button" data-recover-action={model.sentActions[2].id} onClick={editEmail}>{model.sentActions[2].label}</button>
      </div>
      <p id={`${model.sourceKey}-cooldown-status`} className="xp-recover__cooldown">{resendReady ? model.labels.resendReady : recoverCooldownLabel(model,state.secondsRemaining)}</p>
    </section> : <><form
      id={formId}
      action={model.submit.action}
      method="post"
      aria-label={model.intro.heading}
      aria-busy={pending || undefined}
      data-recover-form-owner=""
      onSubmit={submit}
    >
      <input type="hidden" name="sourceKey" value={model.sourceKey}/>
      <Field id={`${model.sourceKey}-email`} invalid={Boolean(state.error)} hasError={Boolean(state.error)}>
        <Field.Label>{model.field.label}</Field.Label>
        <Field.Input
          name={model.field.name}
          type={model.field.type}
          inputMode={model.field.inputMode}
          enterKeyHint={model.field.enterKeyHint}
          autoComplete={model.field.autoComplete}
          autoCapitalize={model.field.autoCapitalize}
          spellCheck={model.field.spellCheck}
          required={model.field.required}
          placeholder={model.field.placeholder}
          disabled={pending}
          value={state.email}
          onChange={(event)=>dispatch({type:"change",email:event.currentTarget.value})}
          onBlur={()=>dispatch({type:"blur"})}
        />
        {state.error ? <Field.Error>{state.error}</Field.Error> : null}
      </Field>
      {state.phase === "error" ? <div className="xp-recover__service-error" role="alert"><p>{model.labels.error}</p></div> : null}
    </form><StickyActionBar
      className="xp-recover__submit"
      style={{gridRow:"auto"}}
      placement={contextualOverlay ? "overlay" : "local"}
      primary={<button type="submit" form={formId} disabled={pending}>{pending ? model.labels.pending : model.submit.label}</button>}
    /></>}
    {reassurance}
    <p className="xp-recover__back">{onBackToLogin?<button type="button" data-recover-action={model.backToLogin.id} onClick={onBackToLogin}>{model.backToLogin.label}</button>:<a href={model.backToLogin.href} data-recover-action={model.backToLogin.id}>{model.backToLogin.label}</a>}</p>
    <p className="xp-recover__announcement" role="status" aria-live="polite">{state.announcement}</p>
  </div>;

  const owner = <section
    className="xp-recover-unit"
    data-xp-owner="RecoverUnit"
    data-recover-preset={model.recoverPreset}
    data-source-key={model.sourceKey}
    data-device-class={deviceClass}
    data-recover-form={recoverHostForms[deviceClass]}
    data-recover-state={state.phase}
    data-media-status={model.mediaStatus}
    data-recover-host={contextualOverlay ? "overlay" : mode === "standalone" ? "standalone" : "inline-baseline"}
    data-text-scale={textScale}
  >{form}</section>;

  if (!open) return null;
  if (!contextualOverlay) return owner;
  return <AdaptiveOverlay
    intent="edit"
    presentation={{M:"bottom-sheet",TP:"sheet",TL:"dialog",DS:"dialog",DW:"dialog"}}
    why="Recovery preserves the mounted login context on compact device classes."
    open={open}
    onOpenChange={changeOpen}
    modal
  >
    <AdaptiveOverlay.Content className="xp-recover__overlay" data-recover-overlay-owner="" data-text-scale={textScale}>
      <AdaptiveOverlay.Header title={model.intro.heading} description={model.intro.body} closeLabel={model.backToLogin.label}/>
      <AdaptiveOverlay.Body>{owner}</AdaptiveOverlay.Body>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}
