"use client";

import { AdaptiveOverlay, Field, StickyActionBar, useDeviceClass } from "@xp/primitives";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import type { DeviceClass } from "@xp/primitives";
import type { ResolvedCredentialField, ResolvedLoginFixture } from "./auth-model";

export type CredentialsStatus = "idle" | "pending" | "error" | "success";
export type CredentialsScenario = {
  status?: CredentialsStatus;
  invalid?: "required" | "email";
  passwordVisible?: boolean;
  remember?: boolean;
  recoveryOpen?: boolean;
};
export type CredentialsValues = { name?: string; email: string; password: string; remember: boolean };
export type CredentialsUnitProperties = {
  model: ResolvedLoginFixture;
  scenario?: CredentialsScenario;
  deviceClass?: DeviceClass;
  onAuthenticate?: (values:CredentialsValues)=>"success"|"error"|Promise<"success"|"error">;
  onRecover?: (email:string)=>void|Promise<void>;
  onContinue?: ()=>void;
  recoveryManaged?: boolean;
  recoveryOpen?: boolean;
  onRecoveryOpenChange?: (open:boolean)=>void;
  recoveryTriggerRef?: RefObject<HTMLElement | null>;
  recoveryHref?: string;
};

function initialErrors(model:ResolvedLoginFixture, invalid:CredentialsScenario["invalid"]) {
  if(invalid==="email") return {email:model.fields.find(({id})=>id==="email")?.invalidError??"Invalid email"};
  if(invalid==="required") return Object.fromEntries(model.fields.map((field)=>[field.id,field.requiredError]));
  return {};
}
function validateField(field:ResolvedCredentialField,value:string) {
  if(!value.trim()) return field.requiredError;
  if(field.id==="email"&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return field.invalidError;
  return undefined;
}

function RecoveryForm({ model, onCancel, onRecover }: { model:ResolvedLoginFixture;onCancel:()=>void;onRecover?:CredentialsUnitProperties["onRecover"] }) {
  const [email,setEmail]=useState("");
  const [error,setError]=useState("");
  const [pending,setPending]=useState(false);
  const [sent,setSent]=useState(false);
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(pending)return;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError(model.fields.find(({id})=>id==="email")?.invalidError??model.labels.authErrorMessage);return;}
    setError("");setPending(true);
    try{await onRecover?.(email);setSent(true);}finally{setPending(false);}
  };
  return <form className="xp-credentials__recovery" aria-label={model.labels.recoveryHeading} data-auth-recovery-form="" onSubmit={(event)=>void submit(event)}>
    <header><h2>{model.labels.recoveryHeading}</h2><p>{model.labels.recoveryBody}</p></header>
    <Field id={`${model.sourceKey}-recovery-email`} invalid={Boolean(error)} hasError={Boolean(error)}><Field.Label>{model.labels.recoveryEmailLabel}</Field.Label><Field.Input type="email" inputMode="email" enterKeyHint="send" autoComplete="email" placeholder={model.labels.recoveryEmailPlaceholder} value={email} disabled={pending||sent} onChange={(event)=>setEmail(event.currentTarget.value)}/>{error?<Field.Error>{error}</Field.Error>:null}</Field>
    {sent?<p className="xp-credentials__recovery-sent" role="status">{model.labels.recoverySentAnnouncement}</p>:null}
    <div className="xp-credentials__recovery-actions"><button type="submit" disabled={pending||sent}>{pending?model.labels.pending:model.labels.recoverySubmit}</button><button type="button" onClick={onCancel}>{model.labels.recoveryCancel}</button></div>
  </form>;
}

export function CredentialsUnit({ model, scenario, deviceClass:explicitClass, onAuthenticate, onRecover, onContinue, recoveryManaged=false, recoveryOpen:controlledRecoveryOpen, onRecoveryOpenChange, recoveryTriggerRef, recoveryHref }:CredentialsUnitProperties) {
  const contextClass=useDeviceClass();const deviceClass=explicitClass??contextClass;
  const overlayRecovery=deviceClass==="M"||deviceClass==="TP"||deviceClass==="TL";
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(model.fields.map(({id})=>[id,""])));
  const [errors,setErrors]=useState<Record<string,string|undefined>>(()=>initialErrors(model,scenario?.invalid));
  const [passwordVisible,setPasswordVisible]=useState(Boolean(scenario?.passwordVisible));
  const [remember,setRemember]=useState(Boolean(scenario?.remember));
  const [status,setStatus]=useState<CredentialsStatus>(scenario?.status??"idle");
  const [announcement,setAnnouncement]=useState(scenario?.status==="pending"?model.labels.pendingAnnouncement:"");
  const [internalRecoveryOpen,setInternalRecoveryOpen]=useState(Boolean(scenario?.recoveryOpen));
  const recoveryOpen=recoveryManaged?Boolean(controlledRecoveryOpen):internalRecoveryOpen;
  const internalRecoverRef=useRef<HTMLButtonElement>(null);
  const recoverRef=recoveryTriggerRef??internalRecoverRef;
  const formRef=useRef<HTMLFormElement>(null);
  const submitAction=model.credentialActions.find(({role})=>role==="submit")!;
  const recoverAction=model.credentialActions.find(({role})=>role==="recover")!;
  const registerAction=model.credentialActions.find(({role})=>role==="register")!;
  const pending=status==="pending";
  const changeRecoveryOpen=(open:boolean)=>{if(recoveryManaged)onRecoveryOpenChange?.(open);else setInternalRecoveryOpen(open);if(!open)requestAnimationFrame(()=>formRef.current?.querySelector<HTMLButtonElement>(".xp-credentials__recover")?.focus());};

  const update=(id:string,value:string)=>{setValues((current)=>({...current,[id]:value}));if(errors[id])setErrors((current)=>({...current,[id]:undefined}));};
  const validate=()=>{
    const next=Object.fromEntries(model.fields.map((field)=>[field.id,validateField(field,values[field.id]??"")]));
    setErrors(next);
    const first=model.fields.find(({id})=>Boolean(next[id]));if(first)requestAnimationFrame(()=>formRef.current?.querySelector<HTMLInputElement>(`#${model.sourceKey}-${first.id}`)?.focus());
    return !Object.values(next).some(Boolean);
  };
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(pending||!validate())return;
    setStatus("pending");setAnnouncement(model.labels.pendingAnnouncement);
    try{
      const outcome=await (onAuthenticate?.({name:values.name,email:values.email,password:values.password,remember})??Promise.resolve("success" as const));
      setStatus(outcome);setAnnouncement(outcome==="success"?model.labels.successMessage:model.labels.authErrorMessage);
    }catch{setStatus("error");setAnnouncement(model.labels.authErrorMessage);}
  };
  const closeInlineRecovery=()=>{changeRecoveryOpen(false);requestAnimationFrame(()=>recoverRef.current?.focus());};

  if(!recoveryManaged&&recoveryOpen&&!overlayRecovery) return <section className="xp-credentials-unit" data-xp-owner="CredentialsUnit" data-credentials-preset={model.credentialsPreset} data-device-class={deviceClass} data-credentials-state="recovery"><RecoveryForm model={model} onRecover={onRecover} onCancel={closeInlineRecovery}/></section>;
  if(status==="success") return <section className="xp-credentials-unit xp-credentials-unit--result" data-xp-owner="CredentialsUnit" data-credentials-preset={model.credentialsPreset} data-device-class={deviceClass} data-credentials-state="success" role="status"><h2>{model.labels.successHeading}</h2><p>{model.labels.successMessage}</p><button type="button" onClick={()=>{onContinue?.();if(!onContinue)setStatus("idle")}}>{model.labels.successContinue}</button></section>;

  return <section className="xp-credentials-unit" data-xp-owner="CredentialsUnit" data-credentials-preset={model.credentialsPreset} data-device-class={deviceClass} data-credentials-state={status}>
    <form ref={formRef} aria-label={model.labels.formAria} aria-busy={pending||undefined} data-auth-form-owner="" noValidate onSubmit={(event)=>void submit(event)}>
      <nav className="xp-credentials__alternatives" aria-label={model.labels.alternativesAria} data-alternative-count={model.alternativeActions.length}>{model.alternativeActions.map((action)=><a href={action.href} data-auth-action={action.id} data-action-role={action.role} aria-label={action.provider?.accessibleName} key={action.id}>{action.provider?<picture><source media="(prefers-color-scheme: dark)" srcSet={action.provider.darkSrc}/><img src={action.provider.src} alt="" aria-hidden="true"/></picture>:null}<span>{action.label}</span></a>)}</nav>
      <p className="xp-credentials__divider"><span>{model.labels.divider}</span></p>
      <div className="xp-credentials__fields">{model.fields.map((field)=>{
        const error=errors[field.id];
        const password=field.id==="password";
        return <Field id={`${model.sourceKey}-${field.id}`} invalid={Boolean(error)} hasError={Boolean(error)} key={field.id}><Field.Label>{field.label}</Field.Label><div className={password?"xp-credentials__password":"xp-credentials__input"}><Field.Input type={password?(passwordVisible?"text":"password"):field.type} inputMode={field.inputMode??"text"} enterKeyHint="go" autoComplete={field.autoComplete} required={field.required} placeholder={field.placeholder} disabled={pending} value={values[field.id]??""} onChange={(event)=>update(field.id,event.currentTarget.value)} onBlur={()=>setErrors((current)=>({...current,[field.id]:validateField(field,values[field.id]??"")}))}/>{password?<button type="button" aria-label={passwordVisible?model.labels.revealHide:model.labels.revealShow} aria-pressed={passwordVisible} disabled={pending} onClick={()=>setPasswordVisible((value)=>!value)}>{passwordVisible?model.labels.revealHide:model.labels.revealShow}</button>:null}</div>{error?<Field.Error>{error}</Field.Error>:null}</Field>;
      })}</div>
      {status==="error"?<div className="xp-credentials__auth-error" role="alert"><h2>{model.labels.authErrorHeading}</h2><p>{model.labels.authErrorMessage}</p><button type="button" onClick={()=>{setStatus("idle");setAnnouncement("");}}>{model.labels.authErrorRetry}</button></div>:null}
      <div className="xp-credentials__utility"><label><input type="checkbox" checked={remember} disabled={pending} onChange={(event)=>setRemember(event.currentTarget.checked)}/><span>{model.labels.remember}</span></label>{!recoveryManaged&&overlayRecovery?<AdaptiveOverlay open={recoveryOpen} onOpenChange={changeRecoveryOpen} intent="edit"><AdaptiveOverlay.Trigger className="xp-credentials__recover" data-auth-action={recoverAction.id}>{recoverAction.label}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-credentials__recovery-overlay" data-auth-recovery-owner=""><AdaptiveOverlay.Header title={model.labels.recoveryHeading} description={model.labels.recoveryBody} closeLabel={model.labels.recoveryCancel}/><AdaptiveOverlay.Body><RecoveryForm model={model} onRecover={onRecover} onCancel={()=>changeRecoveryOpen(false)}/></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>:recoveryManaged?<a className="xp-credentials__recover" data-auth-action={recoverAction.id} ref={recoveryTriggerRef as RefObject<HTMLAnchorElement | null>} href={recoveryHref} aria-expanded={recoveryOpen} onClick={(event)=>{event.preventDefault();changeRecoveryOpen(true);}}>{recoverAction.label}</a>:<button className="xp-credentials__recover" data-auth-action={recoverAction.id} ref={internalRecoverRef} type="button" onClick={()=>changeRecoveryOpen(true)}>{recoverAction.label}</button>}</div>
      <StickyActionBar className="xp-credentials__submit-bar" placement={deviceClass==="M"?"page":"local"} primary={<button type="submit" disabled={pending}>{pending?model.labels.pending:submitAction.label}</button>}/>
      {registerAction.href?<p className="xp-credentials__register"><a href={registerAction.href} data-auth-action={registerAction.id}>{registerAction.label}</a></p>:null}
      <p className="xp-credentials__announcement" role="status" aria-live="polite">{announcement}</p>
    </form>
  </section>;
}
