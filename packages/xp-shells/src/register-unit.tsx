"use client";

import { Field, StickyActionBar, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { RegisterFieldId, RegisterStep, ResolvedRegisterAction, ResolvedRegisterField, ResolvedRegisterFixture } from "./register-model";

export type RegisterStatus = "idle" | "pending" | "error" | "success";
export type RegisterScenario = {
  status?: RegisterStatus;
  invalid?: "required" | "email" | "mismatch";
  step?: RegisterStep;
  passwordVisible?: boolean;
  confirmVisible?: boolean;
  consent?: boolean;
};
export type RegisterValues = Partial<Record<RegisterFieldId,string>> & { consent:boolean };
export type RegisterUnitProperties = {
  model:ResolvedRegisterFixture;
  deviceClass?:DeviceClass;
  scenario?:RegisterScenario;
  onRegister?:(values:RegisterValues)=>"success"|"error"|Promise<"success"|"error">;
  onContinue?:()=>void;
};

const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HISTORY_KEY="xpRegisterStep";

export function passwordStrength(value:string):"start"|"growing"|"ready" {
  if(value.length<8)return "start";
  const variety=[/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9]/].filter((rule)=>rule.test(value)).length;
  return value.length>=12&&variety>=3?"ready":"growing";
}

export function validateRegisterField(field:ResolvedRegisterField,value:string,values:Record<string,string>):string|undefined {
  if(!value.trim())return field.requiredError;
  if(field.id==="email"&&!EMAIL.test(value))return field.invalidError;
  if(field.confirms&&value!==values[field.confirms])return field.invalidError;
  return undefined;
}

function initialErrors(model:ResolvedRegisterFixture,invalid:RegisterScenario["invalid"]):Record<string,string|undefined>{
  if(invalid==="required")return Object.fromEntries(model.fields.map((field)=>[field.id,field.requiredError]));
  if(invalid==="email")return {email:model.fields.find(({id})=>id==="email")?.invalidError};
  if(invalid==="mismatch")return {confirmPassword:model.fields.find(({id})=>id==="confirmPassword")?.invalidError};
  return {};
}

function ProviderGroup({model,pending,inactive=false}:{model:ResolvedRegisterFixture;pending:boolean;inactive?:boolean}){
  return <nav className="xp-register__providers" aria-label={model.labels.providerGroup} data-provider-count={model.providerActions.length} data-provider-placement={model.providerPlacement} hidden={inactive} inert={inactive} aria-hidden={inactive||undefined}>{model.providerActions.map((action)=><a href={action.href} aria-label={action.provider?.accessibleName} data-register-action={action.id} data-action-role="provider" key={action.id} aria-disabled={pending||undefined}>{action.provider?<picture><source media="(prefers-color-scheme: dark)" srcSet={action.provider.darkSrc}/><img src={action.provider.src} alt="" aria-hidden="true"/></picture>:null}<span>{action.label}</span></a>)}</nav>;
}

function Reveal({visible,label,onClick,disabled}:{visible:boolean;label:string;onClick:()=>void;disabled:boolean}){
  return <button className="xp-register__reveal" type="button" aria-label={label} aria-pressed={visible} disabled={disabled} onClick={onClick}>{label}</button>;
}

export function RegisterUnit({model,deviceClass:explicitClass,scenario,onRegister,onContinue}:RegisterUnitProperties){
  const contextClass=useDeviceClass();const deviceClass=explicitClass??contextClass;
  const [hydrated,setHydrated]=useState(false);
  const [step,setStep]=useState<RegisterStep>(scenario?.step??"identity");
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(model.fields.map(({id})=>[id,""])));
  const [errors,setErrors]=useState<Record<string,string|undefined>>(()=>initialErrors(model,scenario?.invalid));
  const [consent,setConsent]=useState(Boolean(scenario?.consent));
  const [consentError,setConsentError]=useState(scenario?.invalid==="required"?model.consent.requiredError:"");
  const [visible,setVisible]=useState<Record<string,boolean>>({password:Boolean(scenario?.passwordVisible),confirmPassword:Boolean(scenario?.confirmVisible)});
  const [status,setStatus]=useState<RegisterStatus>(scenario?.status??"idle");
  const [announcement,setAnnouncement]=useState(scenario?.status==="pending"?model.labels.pendingAnnouncement:"");
  const formRef=useRef<HTMLFormElement>(null);const identityHeadingRef=useRef<HTMLLegendElement>(null);const secretHeadingRef=useRef<HTMLLegendElement>(null);
  const enhancedMobile=hydrated&&deviceClass==="M";
  const pending=status==="pending";
  const strength=passwordStrength(values.password??"");
  const strengthLabel=strength==="ready"?model.labels.strengthReady:strength==="growing"?model.labels.strengthGrowing:model.labels.strengthStart;
  const action=`/api/register-fixture?slug=${model.sourceKey}`;
  const fieldsByStep=useMemo(()=>({identity:model.fields.filter((field)=>field.step==="identity"),secret:model.fields.filter((field)=>field.step==="secret")}),[model.fields]);

  useEffect(()=>setHydrated(true),[]);
  useEffect(()=>{
    const onPop=()=>{if(step==="secret"){setStep("identity");requestAnimationFrame(()=>identityHeadingRef.current?.focus());}};
    addEventListener("popstate",onPop);return()=>removeEventListener("popstate",onPop);
  },[step]);
  useEffect(()=>{
    if(deviceClass!=="M"&&history.state?.[HISTORY_KEY]===model.sourceKey){const next={...history.state};delete next[HISTORY_KEY];history.replaceState(next,"");}
  },[deviceClass,model.sourceKey]);

  const update=(id:string,value:string)=>{setValues((current)=>({...current,[id]:value}));if(errors[id])setErrors((current)=>({...current,[id]:undefined}));};
  const focusField=(id:string)=>requestAnimationFrame(()=>formRef.current?.querySelector<HTMLInputElement>(`#${model.sourceKey}-${id}`)?.focus());
  const validateFields=(fields:ResolvedRegisterField[])=>{
    const next={...errors};for(const field of fields)next[field.id]=validateRegisterField(field,values[field.id]??"",values);
    setErrors(next);const first=fields.find(({id})=>Boolean(next[id]));if(first)focusField(first.id);
    return !first;
  };
  const goSecret=()=>{
    if(!validateFields(fieldsByStep.identity))return false;
    setStep("secret");
    if(history.state?.[HISTORY_KEY]!==model.sourceKey)history.pushState({...history.state,[HISTORY_KEY]:model.sourceKey},"");
    requestAnimationFrame(()=>secretHeadingRef.current?.focus());return true;
  };
  const goIdentity=()=>{
    if(history.state?.[HISTORY_KEY]===model.sourceKey)history.back();
    else{setStep("identity");requestAnimationFrame(()=>identityHeadingRef.current?.focus());}
  };
  const validateAll=()=>{
    const fieldsValid=validateFields(model.fields);
    const nextConsent=consent?"":model.consent.requiredError;setConsentError(nextConsent);
    if(!fieldsValid)return false;if(nextConsent){requestAnimationFrame(()=>formRef.current?.querySelector<HTMLInputElement>("#register-consent")?.focus());return false;}return true;
  };
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    if(!hydrated)return;
    event.preventDefault();if(pending)return;
    if(enhancedMobile&&step==="identity"){goSecret();return;}
    if(!validateAll())return;
    setStatus("pending");setAnnouncement(model.labels.pendingAnnouncement);
    try{const outcome=await(onRegister?.({...values,consent})??Promise.resolve("success" as const));setStatus(outcome);setAnnouncement(outcome==="success"?model.labels.successMessage:model.labels.errorMessage);if(outcome==="success"&&history.state?.[HISTORY_KEY]===model.sourceKey){const next={...history.state};delete next[HISTORY_KEY];history.replaceState(next,"");}}
    catch{setStatus("error");setAnnouncement(model.labels.errorMessage);}
  };
  const keyDown=(event:KeyboardEvent<HTMLFormElement>)=>{
    if(!enhancedMobile||step!=="identity"||event.key!=="Enter"||!(event.target instanceof HTMLInputElement)||event.target.type==="checkbox")return;
    event.preventDefault();goSecret();
  };

  if(status==="success")return <section className="xp-register-unit xp-register-unit--result" data-xp-owner="RegisterUnit" data-register-preset={model.registerPreset} data-device-class={deviceClass} data-register-state="success" role="status"><h2>{model.labels.successHeading}</h2><p>{model.labels.successMessage}</p><button type="button" onClick={()=>{onContinue?.();if(!onContinue)setStatus("idle");}}>{model.labels.successContinue}</button></section>;

  const renderFields=(stepId:RegisterStep)=><fieldset className={`xp-register__fieldset xp-register__fieldset--${stepId}`} data-register-step={stepId} hidden={enhancedMobile&&step!==stepId} inert={enhancedMobile&&step!==stepId} aria-hidden={enhancedMobile&&step!==stepId||undefined}>
    <legend className="xp-register__step-heading" tabIndex={-1} ref={stepId==="identity"?identityHeadingRef:secretHeadingRef}><span className="xp-register__progress">{stepId==="identity"?model.labels.identityProgress:model.labels.secretProgress}</span>{stepId==="identity"?model.labels.identityTitle:model.labels.secretTitle}</legend>
    <div className="xp-register__fields">{fieldsByStep[stepId].map((field)=>{const error=errors[field.id];const password=field.type==="password";const shown=Boolean(visible[field.id]);return <Field id={`${model.sourceKey}-${field.id}`} invalid={Boolean(error)} hasError={Boolean(error)} key={field.id}><Field.Label>{field.label}</Field.Label><div className={password?"xp-register__password":"xp-register__input"}><Field.Input name={field.id} type={password?(shown?"text":"password"):field.type} inputMode={field.inputMode??"text"} enterKeyHint={stepId==="identity"?"next":"done"} autoComplete={field.autoComplete} autoCapitalize={field.id==="email"||field.id==="username"?"none":undefined} spellCheck={field.id==="email"||field.id==="username"?false:undefined} required placeholder={field.placeholder} disabled={pending} value={values[field.id]??""} onChange={(event)=>update(field.id,event.currentTarget.value)} onBlur={()=>setErrors((current)=>({...current,[field.id]:validateRegisterField(field,values[field.id]??"",values)}))}/>{password?<Reveal visible={shown} label={shown?model.labels.revealHide:model.labels.revealShow} disabled={pending} onClick={()=>setVisible((current)=>({...current,[field.id]:!shown}))}/>:null}</div>{error?<Field.Error>{error}</Field.Error>:null}{field.id==="password"?<div className="xp-register__strength" aria-live="polite" data-strength={strength}><span>{model.labels.passwordGuidance}</span><strong>{strengthLabel}</strong></div>:null}</Field>;})}</div>
  </fieldset>;

  return <section className="xp-register-unit" data-xp-owner="RegisterUnit" data-register-preset={model.registerPreset} data-device-class={deviceClass} data-register-state={status} data-register-step-active={step} data-progressive={enhancedMobile?"active":"baseline"} data-provider-placement={model.providerPlacement} data-account-glyph={model.accountGlyph||undefined} data-stress={model.activeStress}>
    {model.accountGlyph?<span className="xp-register__account-glyph" aria-hidden="true"><i/><i/></span>:null}
    <form ref={formRef} action={action} method="post" aria-label={model.labels.formAria} aria-busy={pending||undefined} data-register-form-owner="" onKeyDown={keyDown} onSubmit={(event)=>void submit(event)}>
      <input type="hidden" name="sourceKey" value={model.sourceKey}/>
      {model.providerPlacement==="before-fields"?<ProviderGroup model={model} pending={pending} inactive={enhancedMobile&&step==="secret"}/>:null}
      {renderFields("identity")}
      {renderFields("secret")}
      <div className="xp-register__consent" hidden={enhancedMobile&&step!=="secret"} inert={enhancedMobile&&step!=="secret"} aria-hidden={enhancedMobile&&step!=="secret"||undefined}>
        <label htmlFor="register-consent"><input id="register-consent" name="consent" type="checkbox" required checked={consent} disabled={pending} onChange={(event)=>{setConsent(event.currentTarget.checked);if(event.currentTarget.checked)setConsentError("");}}/><span>{model.consent.label}</span></label><a href={model.consent.policyAction.href} data-register-action={model.consent.policyAction.id}>{model.consent.policyAction.label}</a>{consentError?<p id="register-consent-error" role="alert">{consentError}</p>:null}
      </div>
      {status==="error"?<div className="xp-register__error" role="alert"><h2>{model.labels.errorHeading}</h2><p>{model.labels.errorMessage}</p><button type="button" onClick={()=>{setStatus("idle");setAnnouncement("");}}>{model.labels.errorRetry}</button></div>:null}
      {model.providerPlacement==="after-form"?<ProviderGroup model={model} pending={pending} inactive={enhancedMobile&&step==="secret"}/>:null}
      <StickyActionBar className="xp-register__actions" placement={deviceClass==="M"?"page":"local"} secondary={enhancedMobile&&step==="secret"?<button type="button" disabled={pending} onClick={goIdentity}>{model.labels.stepBack}</button>:undefined} primary={enhancedMobile&&step==="identity"?<button type="button" disabled={pending} onClick={goSecret}>{model.labels.stepContinue}</button>:<button type="submit" disabled={pending}>{pending?model.labels.pending:model.submitAction.label}</button>}/>
      <p className="xp-register__sign-in"><a href={model.signInAction.href} data-register-action={model.signInAction.id}>{model.signInAction.label}</a></p>
      <p className="xp-register__announcement" role="status" aria-live="polite">{announcement}</p>
    </form>
  </section>;
}
