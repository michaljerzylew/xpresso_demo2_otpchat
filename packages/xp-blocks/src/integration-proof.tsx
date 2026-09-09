"use client";

import { MorphSlot, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  resolveIntegrationProofFixture,
  type IntegrationAction,
  type IntegrationMediaMap,
  type IntegrationProofFixture,
  type IntegrationRecord,
  type IntegrationStressKey,
  type ResolvedIntegrationMark,
  type ResolvedIntegrationProof,
} from "./integration-proof-model";

export type IntegrationProofScenario={mediaFallback?:boolean;connectErrorRecordId?:string;holdPending?:boolean;paused?:boolean};
type ConnectionState="disconnected"|"pending"|"connected"|"error";
type View={model:ResolvedIntegrationProof;deviceClass:DeviceClass;connections:Readonly<Record<string,ConnectionState>>;connect:(record:IntegrationRecord)=>void;tooltip?:string;setTooltip:(id:string|undefined)=>void;paused:boolean;manualPaused:boolean;togglePaused:()=>void;setFocusPaused:(value:boolean)=>void;setHoverPaused:(value:boolean)=>void;lanePositions:Readonly<Record<string,number>>;moveLane:(groupId:string,direction:-1|1)=>void;mediaFallback:boolean};
type Properties={fixture:IntegrationProofFixture;media:IntegrationMediaMap;stress?:IntegrationStressKey;scenario?:IntegrationProofScenario;className?:string};
const ladder:Record<DeviceClass,string>={M:"mobile",TP:"tablet-portrait",TL:"tablet-landscape",DS:"desktop-standard",DW:"desktop-wide"};
const message=(template:string|undefined,name:string,fallback:string)=> (template??fallback).replace("{name}",name);

function Mark({mark,fallback,className}:{mark:ResolvedIntegrationMark;fallback:boolean;className?:string}){
  const initials=mark.identityName.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase();
  if(fallback)return <span className={["xp-integration__mark","xp-integration__mark--fallback",className].filter(Boolean).join(" ")} data-media-seat-id={mark.id} data-media-state="fallback" role="img" aria-label={`${mark.alt}. ${initials}`}><span aria-hidden="true">{initials}</span></span>;
  return <picture className={["xp-integration__mark",className].filter(Boolean).join(" ")} data-media-seat-id={mark.id} data-media-state="resolved"><source media="(prefers-color-scheme: dark)" srcSet={mark.darkSrc}/><img src={mark.lightSrc} alt={mark.alt}/></picture>;
}

function LinkAction({action,className,children}:{action?:IntegrationAction;className?:string;children?:ReactNode}){
  if(!action||action.kind==="connect"||!action.href)return null;
  return <a href={action.href} className={className} data-action-id={action.id}>{children??action.label}</a>;
}

function Intro({view,utility=true}:{view:View;utility?:boolean}){
  const {model}=view;const attached=new Set(model.records.flatMap(({actionId})=>actionId?[actionId]:[]));if(model.summary)attached.add(model.summary.actionId);
  const actions=utility?model.actions.filter(({id,kind})=>kind!=="connect"&&!attached.has(id)):[];
  return <header className="xp-integration__intro">{model.eyebrow?<p className="xp-integration__eyebrow">{model.eyebrow}</p>:null}<h2 id={`${model.sourceKey}-title`}>{model.heading}</h2><p>{model.body}</p>{actions.length?<div className="xp-integration__actions">{actions.map((action)=><LinkAction action={action} key={action.id}/>)}</div>:null}</header>;
}

function ConnectControl({view,record}:{view:View;record:IntegrationRecord}){
  const action=view.model.actions.find(({id})=>id===record.actionId);if(!action||action.kind!=="connect")return null;
  const state=view.connections[record.id]??"disconnected";const stress=view.model.stress;
  const label=state==="pending"?message(stress.connectPending,record.name,`Connecting ${record.name}...`):state==="connected"?message(stress.connectSuccess,record.name,`${record.name} connected`):state==="error"?message(stress.connectRetry,record.name,`Retry ${record.name}`):action.label;
  return <div className="xp-integration__connect"><button type="button" data-action-id={action.id} data-connection-state={state} aria-pressed={state==="connected"} disabled={state==="pending"} onClick={()=>view.connect(record)}>{label}</button><span role={state==="error"?"alert":"status"} aria-live="polite">{state==="error"?message(stress.connectError,record.name,`Could not connect ${record.name}`):state==="connected"?message(stress.connectSuccess,record.name,`${record.name} connected`):""}</span></div>;
}

function BasicCard({view,record,linked=false,tooltip=false}:{view:View;record:IntegrationRecord;linked?:boolean;tooltip?:boolean}){
  const mark=view.model.marksById.get(record.markId)!;const action=record.actionId?view.model.actions.find(({id})=>id===record.actionId):undefined;
  const content=<><Mark mark={mark} fallback={view.mediaFallback}/><div><h3>{record.name}</h3>{record.description?<p>{record.description}</p>:null}</div>{linked?<span className="xp-integration__arrow" aria-hidden="true">↗</span>:null}</>;
  if(linked)return <article className="xp-integration__card xp-integration__card--linked" data-record-id={record.id}><LinkAction action={action}>{content}<span className="xp-integration__link-label">{action?.label}</span></LinkAction></article>;
  const tooltipId=`${record.id}-tip`;const active=view.tooltip===record.id;
  return <article className="xp-integration__card" data-record-id={record.id} data-tooltip-active={active||undefined} tabIndex={tooltip?0:undefined} aria-describedby={tooltip?tooltipId:undefined} onMouseEnter={tooltip?()=>view.setTooltip(record.id):undefined} onMouseLeave={tooltip?()=>view.setTooltip(undefined):undefined} onFocus={tooltip?()=>view.setTooltip(record.id):undefined} onBlur={tooltip?()=>view.setTooltip(undefined):undefined} onKeyDown={tooltip?(event:KeyboardEvent)=>{if(event.key==="Escape")view.setTooltip(undefined)}:undefined}>{content}{tooltip?<span className="xp-integration__tooltip" id={tooltipId} role="tooltip">{record.name} is available for this workspace.</span>:null}<ConnectControl view={view} record={record}/></article>;
}

function SplitList({view}:{view:View}){return <div className="xp-integration__split"><Intro view={view}/><div className="xp-integration__list">{view.model.records.map((record)=><BasicCard view={view} record={record} key={record.id}/>)}</div></div>}
function IdentityCluster({view}:{view:View}){const tooltip=view.model.preset==="overlap-identity-cluster";return <><Intro view={view}/><div className="xp-integration__cluster" role="list" aria-label="Available integrations">{view.model.records.map((record)=><div role="listitem" key={record.id}><BasicCard view={view} record={record} tooltip={tooltip}/></div>)}</div></>}

function Directory({view}:{view:View}){
  const linked=view.model.preset==="linked-accent-cards";return <><Intro view={view}/><div className="xp-integration__directory">{view.model.records.map((record)=><BasicCard view={view} record={record} linked={linked} key={record.id}/>)}{view.model.summary?<article className="xp-integration__summary" data-summary-id={view.model.summary.id}><span aria-hidden="true">+</span><h3>{view.model.summary.title}</h3><p>{view.model.summary.body}</p><LinkAction action={view.model.actions.find(({id})=>id===view.model.summary?.actionId)}/></article>:null}</div></>;
}

function Marquee({view}:{view:View}){const motion=view.model.motion;return <><Intro view={view}/><div className="xp-integration__marquee" data-motion-state={view.paused?"paused":"running"} onMouseEnter={()=>view.setHoverPaused(true)} onMouseLeave={()=>view.setHoverPaused(false)} onFocusCapture={()=>view.setFocusPaused(true)} onBlurCapture={(event)=>{if(!event.currentTarget.contains(event.relatedTarget))view.setFocusPaused(false)}}><div className="xp-integration__marquee-track"><ul>{view.model.records.map((record)=>{const mark=view.model.marksById.get(record.markId)!;return <li key={record.id} data-record-id={record.id}><Mark mark={mark} fallback={view.mediaFallback}/><span>{record.name}</span></li>})}</ul></div><button type="button" aria-pressed={view.manualPaused} onClick={view.togglePaused}>{view.manualPaused?motion.resumeLabel:motion.pauseLabel}</button></div></>}

function Lanes({view}:{view:View}){return <><Intro view={view}/><div className="xp-integration__lanes">{view.model.groups.map((group,index)=>{const position=view.lanePositions[group.id]??0;const records=group.recordIds.map((id)=>view.model.records.find((record)=>record.id===id)!);return <section key={group.id} data-group-id={group.id} data-active-index={position} aria-label={`Connection lane ${index+1}`}><header><span>Lane {String(index+1).padStart(2,"0")}</span><div><button type="button" aria-label={`Previous item in lane ${index+1}`} disabled={position===0} onClick={()=>view.moveLane(group.id,-1)}>←</button><button type="button" aria-label={`Next item in lane ${index+1}`} disabled={position===records.length-1} onClick={()=>view.moveLane(group.id,1)}>→</button></div></header><div className="xp-integration__lane-track" tabIndex={0}>{records.map((record,itemIndex)=><div data-lane-index={itemIndex} data-current={position===itemIndex||undefined} key={record.id}><BasicCard view={view} record={record}/></div>)}</div></section>})}</div></>}

function Wall({view}:{view:View}){const wall=<div className="xp-integration__wall">{view.model.groups.map((group,index)=><div className="xp-integration__wall-row" data-row-size={group.recordIds.length} key={group.id}>{group.recordIds.map((id)=>{const record=view.model.records.find((item)=>item.id===id)!;return <BasicCard view={view} record={record} key={id}/>})}<span aria-hidden="true">0{index+1}</span></div>)}</div>;return <div className="xp-integration__wall-layout">{wall}<Intro view={view}/></div>}

function Hub({view}:{view:View}){const {model}=view;const hub=model.hub!;const hubMark=model.marksById.get(hub.markId)!;return <><Intro view={view}/><div className="xp-integration__hub" data-motion-state={view.paused?"paused":"running"}><div className="xp-integration__hub-center" data-hub-id={hub.id}><Mark mark={hubMark} fallback={view.mediaFallback}/><strong>{hub.name}</strong></div><div className="xp-integration__hub-nodes">{hub.nodeIds.map((id,index)=>{const record=model.records.find((entry)=>entry.id===id)!;const mark=model.marksById.get(record.markId)!;return <div className="xp-integration__hub-node" style={{"--node-index":index} as React.CSSProperties} data-record-id={record.id} key={id}><i aria-hidden="true"/><Mark mark={mark} fallback={view.mediaFallback}/><span>{record.name}</span></div>})}</div><button type="button" aria-pressed={view.manualPaused} onClick={view.togglePaused}>{view.manualPaused?model.motion.resumeLabel:model.motion.pauseLabel}</button></div></>}

function Preset({view}:{view:View}){switch(view.model.composition){case"split-list":return <SplitList view={view}/>;case"identity-cluster":return <IdentityCluster view={view}/>;case"card-directory":return <Directory view={view}/>;case"proof-marquee":return <Marquee view={view}/>;case"action-lanes":return <Lanes view={view}/>;case"grouped-wall":return <Wall view={view}/>;case"hub-orbit":return <Hub view={view}/>}}
const renderForm=({core,form}:{core:View;form:string})=><div className="xp-integration__form" data-native-form={form}><Preset view={core}/></div>;
const renderers={mobile:renderForm,"tablet-portrait":renderForm,"tablet-landscape":renderForm,"desktop-standard":renderForm,"desktop-wide":renderForm};

export function IntegrationProof({fixture,media,stress,scenario,className}:Properties){
  const deviceClass=useDeviceClass();const model=resolveIntegrationProofFixture(fixture,media,stress);const [connections,setConnections]=useState<Record<string,ConnectionState>>({});const [tooltip,setTooltip]=useState<string>();const [motionReady,setMotionReady]=useState(false);const [manualPaused,setManualPaused]=useState(scenario?.paused??false);const [focusPaused,setFocusPaused]=useState(false);const [hoverPaused,setHoverPaused]=useState(false);const [lanePositions,setLanePositions]=useState<Record<string,number>>({});
  useEffect(()=>setMotionReady(true),[]);
  const connect=(record:IntegrationRecord)=>{setConnections((current)=>({...current,[record.id]:"pending"}));if(scenario?.holdPending)return;globalThis.setTimeout(()=>setConnections((current)=>({...current,[record.id]:scenario?.connectErrorRecordId===record.id?"error":"connected"})),180)};
  const moveLane=(groupId:string,direction:-1|1)=>{const group=model.groups.find(({id})=>id===groupId);if(!group)return;setLanePositions((current)=>{const next=Math.max(0,Math.min(group.recordIds.length-1,(current[groupId]??0)+direction));globalThis.requestAnimationFrame(()=>{const target=document.querySelector<HTMLElement>(`[data-group-id="${groupId}"] [data-lane-index="${next}"]`);const track=target?.parentElement;if(!target||!track)return;const delta=target.getBoundingClientRect().left-track.getBoundingClientRect().left;track.scrollBy({left:delta,behavior:"auto"})});return{...current,[groupId]:next}})};
  const paused=!motionReady||manualPaused||focusPaused||hoverPaused;
  const view:View={model,deviceClass,connections,connect,tooltip,setTooltip,paused,manualPaused,togglePaused:()=>setManualPaused((current)=>!current),setFocusPaused,setHoverPaused,lanePositions,moveLane,mediaFallback:Boolean(scenario?.mediaFallback||stress==="error")};
  return <section className={["xp-integration",className].filter(Boolean).join(" ")} data-xp-owner="IntegrationProof" data-integration-state-owner data-motion-ready={motionReady||undefined} data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.composition} data-device-class={deviceClass} data-stress={stress??"base"} aria-labelledby={`${model.sourceKey}-title`}><MorphSlot className="xp-integration__morph" ladder={ladder} core={view} renderers={renderers}/><p className="xp-integration__live" aria-live="polite">{Object.entries(connections).map(([id,state])=>`${id} ${state}`).join(". ")}</p></section>;
}
