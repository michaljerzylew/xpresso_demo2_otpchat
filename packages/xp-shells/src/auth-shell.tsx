"use client";

import { DisclosureGroup, MetricTile, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { ResolvedAuthPerson, ResolvedAuthPhoto, ResolvedAuthProof, ResolvedAuthShellModel, ResolvedDashboardProof, ResolvedTrustProof } from "./auth-model";

export const authShellForms: Record<DeviceClass, "compact-pane" | "portrait-card" | "compact-split" | "balanced-split" | "wide-split"> = {
  M:"compact-pane",TP:"portrait-card",TL:"compact-split",DS:"balanced-split",DW:"wide-split",
};

export type AuthShellScenario = { mediaFallback?: boolean; ambientPaused?: boolean; reducedData?: boolean };
export type AuthShellProperties = {
  model: ResolvedAuthShellModel;
  children: ReactNode;
  reassurance?: ReactNode;
  deviceClass?: DeviceClass;
  scenario?: AuthShellScenario;
};

function Identity({ model }: { model:ResolvedAuthShellModel }) {
  if(!model.identity)return null;
  const home=model.shellActions.find(({role})=>role==="home");
  const content=<><picture><source media="(prefers-color-scheme: dark)" srcSet={model.identity.inverseSrc}/><img src={model.identity.src} alt="" aria-hidden="true"/></picture><span>{model.identity.name}</span></>;
  return home?.href?<a className="xp-auth-shell__identity" href={home.href} aria-label={home.label} data-auth-shell-action={home.id}>{content}</a>:<div className="xp-auth-shell__identity">{content}</div>;
}

function Avatar({ person }: { person:ResolvedAuthPerson }) {
  const [failed,setFailed]=useState(false);
  const fallback=failed||person.status!=="delivered";
  const mediaStatus=person.status==="code"?"code":fallback?person.status==="pending"?"pending":"error":"delivered";
  return <span className="xp-auth-person" data-person-id={person.id} data-asset-id={person.assetId} data-media-status={mediaStatus}>
    {fallback?<span className="xp-auth-person__fallback" role={person.alt?"img":undefined} aria-label={person.alt||undefined} aria-hidden={person.alt?undefined:true}>{person.initials}</span>:<picture><source srcSet={person.avif} type="image/avif"/><source srcSet={person.webp} type="image/webp"/><img src={person.jpg} alt={person.alt} onError={()=>setFailed(true)}/></picture>}
  </span>;
}

function DashboardProof({ proof, fallback, onRetry }: { proof:ResolvedDashboardProof;fallback:boolean;onRetry:()=>void }) {
  if(fallback) return <section className="xp-auth-proof__fallback" role="status" data-proof-id={proof.proofId} data-proof-state="error"><h2>{proof.fallback.heading}</h2><p>{proof.fallback.message}</p><button type="button" onClick={onRetry}>{proof.fallback.action}</button></section>;
  return <section className="xp-auth-dashboard" aria-label={proof.alt} data-proof-id={proof.proofId} data-proof-kind="code-owned" data-proof-state="live">
    <header><span>{proof.title}</span><i aria-hidden="true"/></header>
    <div className="xp-auth-dashboard__metrics">{proof.records.map((record)=><MetricTile value={record.value} label={record.label} delta={record.detail} trend="flat" key={record.id}/>)}</div>
    <div className="xp-auth-dashboard__progress">{proof.records.map((record)=><div key={record.id}><span>{record.label}</span><progress value={record.progress} max="100"/><strong>{record.progress}%</strong></div>)}</div>
  </section>;
}

function TrustProof({ proof }: { proof:ResolvedTrustProof }) {
  return <div className="xp-auth-trust" data-auth-trust-owner="">
    <div className="xp-auth-trust__statement"><h2>{proof.reassurance.heading}</h2><p>{proof.reassurance.body}</p></div>
    <section className="xp-auth-trust__card">{proof.mark?<img className="xp-auth-trust__mark" src={proof.mark.inverseSrc} alt="" aria-hidden="true"/>:null}<div><h3>{proof.card.heading}</h3><p>{proof.card.body}</p></div><div className="xp-auth-trust__people" aria-label={proof.aggregateLabel}>{proof.people.map((person)=><Avatar person={person} key={person.id}/>)}</div><strong>{proof.aggregateLabel}</strong></section>
  </div>;
}

function PhotoSeat({ photo, fallback, reducedData, onError }: { photo:ResolvedAuthPhoto;fallback:boolean;reducedData:boolean;onError:()=>void }) {
  if(photo.kind==="dark-wave")return <div className="xp-auth-photo xp-auth-dark-wave" role="img" aria-label={photo.alt} data-photo-asset={photo.assetId} data-photo-kind="dark-wave" data-media-status="ready">
    <svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="xp-auth-wave-pearl" cx="50%" cy="50%" r="68%"><stop offset="0" stopColor="#c7c1cf" stopOpacity=".74"/><stop offset=".46" stopColor="#77717f" stopOpacity=".34"/><stop offset="1" stopColor="#17151b" stopOpacity="0"/></radialGradient>
        <radialGradient id="xp-auth-wave-slate" cx="50%" cy="50%" r="72%"><stop offset="0" stopColor="#827c8a" stopOpacity=".62"/><stop offset=".58" stopColor="#393640" stopOpacity=".26"/><stop offset="1" stopColor="#111015" stopOpacity="0"/></radialGradient>
        <filter id="xp-auth-wave-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="34"/></filter>
      </defs>
      <rect width="1200" height="720" fill="#111015"/>
      <g className="xp-auth-dark-wave__back" fill="none" filter="url(#xp-auth-wave-soft)" strokeLinecap="round">
        <path d="M-120 20 C 120 250, 290 170, 510 360 S 850 520, 1320 770" stroke="url(#xp-auth-wave-slate)" strokeWidth="170"/>
        <path d="M160 -110 C 350 110, 470 80, 650 260 S 920 390, 1250 620" stroke="url(#xp-auth-wave-pearl)" strokeWidth="124"/>
      </g>
      <g className="xp-auth-dark-wave__front" fill="none" filter="url(#xp-auth-wave-soft)" strokeLinecap="round">
        <path d="M-180 520 C 80 320, 250 370, 430 500 S 760 770, 1120 560 S 1310 420, 1390 390" stroke="url(#xp-auth-wave-pearl)" strokeWidth="142"/>
        <path d="M-120 760 C 150 530, 320 600, 510 700 S 840 790, 1260 610" stroke="url(#xp-auth-wave-slate)" strokeWidth="188"/>
      </g>
    </svg>
  </div>;
  const unavailable=photo.status!=="ready"||fallback||reducedData||!photo.jpg;
  if(unavailable)return <section className="xp-auth-photo xp-auth-photo--fallback" role="img" aria-label={photo.alt} data-photo-asset={photo.assetId} data-media-status={photo.status==="hold"?"hold":reducedData?"reduced-data":"error"}><h2>{photo.fallback.heading}</h2><p>{reducedData?photo.fallback.reducedData:photo.fallback.body}</p></section>;
  return <picture className="xp-auth-photo" data-photo-asset={photo.assetId} data-media-status="ready"><source srcSet={photo.avif} type="image/avif"/><source srcSet={photo.webp} type="image/webp"/><img src={photo.jpg} alt={photo.alt} onError={onError}/></picture>;
}

function ProofContent({ proof, photo, fallback, reducedData, onRetry, onMediaError }: { proof:ResolvedAuthProof;photo?:ResolvedAuthPhoto;fallback:boolean;reducedData:boolean;onRetry:()=>void;onMediaError:()=>void }) {
  return <div className="xp-auth-proof__content">{photo?<PhotoSeat photo={photo} fallback={fallback} reducedData={reducedData} onError={onMediaError}/>:null}{proof.kind==="trust"?<TrustProof proof={proof}/>:<div className="xp-auth-proof__dashboard-wrap">
    {proof.kind==="editorial"?<div className="xp-auth-proof__editorial"><h2>{proof.heading}</h2><p>{proof.body}</p></div>:null}
    <DashboardProof proof={proof} fallback={fallback} onRetry={onRetry}/>
    {proof.badges.length?<ul className="xp-auth-proof__badges" aria-label={proof.heading??proof.title}>{proof.badges.map((badge)=><li data-badge-id={badge.id} data-mark-id={badge.markId} key={badge.id}><picture><source media="(prefers-color-scheme: dark)" srcSet={badge.darkSrc}/><img src={badge.src} alt="" aria-hidden="true"/></picture><span>{badge.label}</span></li>)}</ul>:null}
  </div>}</div>;
}

function CompactProof({ proof, photo, fallback, reducedData, onRetry, onMediaError }: { proof:ResolvedAuthProof;photo?:ResolvedAuthPhoto;fallback:boolean;reducedData:boolean;onRetry:()=>void;onMediaError:()=>void }) {
  const noJsVisible=photo?.kind==="dark-wave";
  const [open,setOpen]=useState<string[]>(noJsVisible?["auth-proof"]:[]);
  useLayoutEffect(()=>{if(noJsVisible)setOpen([]);},[noJsVisible]);
  const labels=proof.kind==="trust"?proof.disclosure:proof.disclosure;
  return <DisclosureGroup className="xp-auth-shell__disclosure" label={labels.open} multiple={false} openIds={open} onOpenChange={setOpen} wallBehavior="interactive" items={[{id:"auth-proof",title:open.length?labels.close:labels.open,content:<ProofContent proof={proof} photo={photo} fallback={fallback} reducedData={reducedData} onRetry={onRetry} onMediaError={onMediaError}/>}]} />;
}

function useAmbientMotion(model:ResolvedAuthShellModel, paused:boolean) {
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>setHydrated(true),[]);
  return !model.ambient.motion||!hydrated?"static":paused?"paused":"running";
}

function useTextScale() {
  const [scale,setScale]=useState<"normal"|"large"|"extreme">("normal");
  useEffect(()=>{const root=document.documentElement;const read=()=>{const size=parseFloat(getComputedStyle(root).fontSize);setScale(size>=48?"extreme":size>=24?"large":"normal");};read();const observer=new MutationObserver(read);observer.observe(root,{attributes:true,attributeFilter:["class","style"]});return()=>observer.disconnect();},[]);
  return scale;
}

export function AuthShell({ model, children, reassurance, deviceClass:explicitClass, scenario }:AuthShellProperties) {
  const contextClass=useDeviceClass();
  const deviceClass=explicitClass??contextClass;
  const form=authShellForms[deviceClass];
  const compact=deviceClass==="M"||deviceClass==="TP";
  const [ambientPaused,setAmbientPaused]=useState(Boolean(scenario?.ambientPaused));
  const [proofFailed,setProofFailed]=useState(Boolean(scenario?.mediaFallback));
  const motion=useAmbientMotion(model,ambientPaused);
  const textScale=useTextScale();
  const back=model.shellActions.find(({role})=>role==="back");
  const proof=model.proof;
  const photo=model.photo;
  const split=Boolean(proof)&&!compact;
  const motionLabel=motion==="static"?model.labels.motionStatic:motion==="paused"?model.labels.motionResume:model.labels.motionPause;
  return <main className={`xp-auth-shell xp-auth-shell--${model.shellPreset}`} data-xp-auth-renderer="" data-xp-auth-owner="AuthShell" data-source-key={model.sourceKey} data-shell-preset={model.shellPreset} data-device-class={deviceClass} data-variant={form} data-layout={split?"split":"centered"} data-ambient={model.ambient.treatment} data-motion={motion} data-photo-kind={photo?.kind} data-text-scale={textScale}>
    <div className="xp-auth-shell__ambient" aria-hidden="true"><i/><i/><i/></div>
    <section className="xp-auth-shell__form-pane" data-xp-region="content">
      <div className="xp-auth-shell__form-frame">
        {back?.href?<a className="xp-auth-shell__back" href={back.href} data-auth-shell-action={back.id}>← <span>{back.label}</span></a>:null}
        <Identity model={model}/>
        <header className="xp-auth-shell__intro"><h1 id={`${model.sourceKey}-title`}>{model.intro.heading}</h1><p>{model.intro.body}</p></header>
        {compact&&proof?<aside className="xp-auth-shell__compact-proof" data-xp-region="support"><CompactProof proof={proof} photo={photo} fallback={proofFailed} reducedData={Boolean(scenario?.reducedData)} onRetry={()=>setProofFailed(false)} onMediaError={()=>setProofFailed(true)}/></aside>:null}
        <div className="xp-auth-shell__slot" data-auth-form-slot="">{children}</div>
      </div>
    </section>
    {split&&proof?<aside className="xp-auth-shell__proof-pane" data-xp-region="support" style={photo?{"--xp-auth-photo-position":photo.focalPoint[deviceClass]} as CSSProperties:undefined}>{model.identity?<div className="xp-auth-shell__proof-mark" aria-hidden="true"><img src={model.identity.inverseSrc} alt=""/></div>:null}<ProofContent proof={proof} photo={photo} fallback={proofFailed} reducedData={Boolean(scenario?.reducedData)} onRetry={()=>setProofFailed(false)} onMediaError={()=>setProofFailed(true)}/>{reassurance?<div className="xp-auth-shell__reassurance-slot" data-auth-reassurance-slot="">{reassurance}</div>:null}{model.ambient.motion&&motionLabel?<><button className="xp-auth-shell__motion" type="button" disabled={motion==="static"} aria-pressed={motion==="paused"} onClick={()=>setAmbientPaused((value)=>!value)}>{motionLabel}</button><p className="xp-auth-shell__motion-static">{model.labels.motionStatic}</p></>:null}</aside>:null}
  </main>;
}
