"use client";

import { useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ResolvedAuthShellModel, ResolvedLoginFixture } from "./auth-model";
import { AuthShell, type AuthShellScenario } from "./auth-shell";
import { CredentialsUnit, type CredentialsScenario, type CredentialsUnitProperties } from "./credentials-unit";
import type { ResolvedRecoverFixture } from "./recover-model";
import { RecoverUnit, type RecoverScenario, type RecoverUnitProperties } from "./recover-unit";

const HISTORY_KEY = "xpRecoverSource";

export type AuthFlowControllerProperties = {
  shellModel:ResolvedAuthShellModel;
  loginModel:ResolvedLoginFixture;
  recoverModel:ResolvedRecoverFixture;
  deviceClass?:DeviceClass;
  initialRecoveryOpen?:boolean;
  credentialsScenario?:CredentialsScenario;
  recoverScenario?:RecoverScenario;
  shellScenario?:AuthShellScenario;
  onAuthenticate?:CredentialsUnitProperties["onAuthenticate"];
  onRecover?:RecoverUnitProperties["onRecover"];
  onOpenMail?:RecoverUnitProperties["onOpenMail"];
};

export function AuthFlowController({
  shellModel,
  loginModel,
  recoverModel,
  deviceClass:explicitClass,
  initialRecoveryOpen=false,
  credentialsScenario,
  recoverScenario,
  shellScenario,
  onAuthenticate,
  onRecover,
  onOpenMail,
}:AuthFlowControllerProperties) {
  const contextClass=useDeviceClass();
  const deviceClass=explicitClass??contextClass;
  const compact=deviceClass === "M" || deviceClass === "TP";
  const [recoveryOpen,setRecoveryOpen]=useState(initialRecoveryOpen);
  const triggerRef=useRef<HTMLElement>(null);

  const clearMarker=useCallback(()=>{
    if (history.state?.[HISTORY_KEY] !== recoverModel.sourceKey) return;
    const next={...history.state};
    delete next[HISTORY_KEY];
    history.replaceState(next,"");
  },[recoverModel.sourceKey]);

  const closeRecovery=useCallback(()=>{
    const ownsMarker = history.state?.[HISTORY_KEY] === recoverModel.sourceKey;
    setRecoveryOpen(false);
    if (ownsMarker) history.back();
    requestAnimationFrame(()=>triggerRef.current?.focus());
  },[recoverModel.sourceKey]);

  const changeRecoveryOpen=useCallback((next:boolean)=>{
    if (!next) {
      closeRecovery();
      return;
    }
    if (history.state?.[HISTORY_KEY] !== recoverModel.sourceKey) {
      history.pushState({...history.state,[HISTORY_KEY]:recoverModel.sourceKey},"");
    }
    setRecoveryOpen(true);
  },[closeRecovery,recoverModel.sourceKey]);

  useEffect(()=>{
    const onPopState=()=>{
      if (history.state?.[HISTORY_KEY] !== recoverModel.sourceKey) setRecoveryOpen(false);
    };
    addEventListener("popstate",onPopState);
    return ()=>removeEventListener("popstate",onPopState);
  },[recoverModel.sourceKey]);

  useEffect(()=>()=>clearMarker(),[clearMarker]);

  const credentials=(compact || !recoveryOpen) ? <CredentialsUnit
    key="credentials"
    model={loginModel}
    deviceClass={deviceClass}
    scenario={credentialsScenario}
    onAuthenticate={onAuthenticate}
    recoveryManaged
    recoveryOpen={recoveryOpen}
    onRecoveryOpenChange={changeRecoveryOpen}
    recoveryTriggerRef={triggerRef}
    recoveryHref={`/gates/forgot-password?slug=${recoverModel.sourceKey}&recovery=standalone`}
  /> : null;
  const recovery=<RecoverUnit
    key="recovery"
    model={recoverModel}
    deviceClass={deviceClass}
    scenario={recoverScenario}
    mode="contextual"
    open={recoveryOpen}
    onOpenChange={changeRecoveryOpen}
    returnFocusRef={triggerRef}
    onRecover={onRecover}
    onOpenMail={onOpenMail}
    onBackToLogin={closeRecovery}
  />;

  return <AuthShell model={recoveryOpen?shellModel:loginModel} deviceClass={deviceClass} scenario={shellScenario}>
    <div
      className="xp-auth-flow"
      data-xp-owner="AuthFlowController"
      data-device-class={deviceClass}
      data-recovery-open={recoveryOpen ? "true" : "false"}
      data-recovery-host={compact ? "contextual" : "inline"}
    >
      {credentials}
      {recovery}
    </div>
  </AuthShell>;
}
