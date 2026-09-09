"use client";

import React, { type UIEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDeviceClass } from "@xp/primitives";
import { Bento } from "./bento";
import {
  resolveFeatureFixture,
  type CapabilityFixture,
  type FeatureFixture,
  type FeatureMediaRecord,
  type ResolvedFeatureFixture,
  type StoryFixture,
} from "./feature-model";
import {
  distributeSurfaces, FeatureActions, FeatureError, FeatureIntroView, FeatureMediaView,
  FeaturePagerControls, FeatureSelector, FeatureSurfaceView,
} from "./feature-shared";

type FeatureProperties = { fixture:FeatureFixture; media?:FeatureMediaRecord[]; stress?:string; className?:string };

function useSynchronizedRail(activeId:string|undefined,onActiveChange:(id:string)=>void) {
  const reference=useRef<HTMLDivElement|HTMLOListElement>(null);
  useEffect(()=>{
    const rail=reference.current;
    if(!rail||!activeId||rail.scrollWidth<=rail.clientWidth+1)return;
    const active=[...rail.querySelectorAll<HTMLElement>("[data-feature-item-id],[data-feature-step-id]")].find((entry)=>(entry.dataset.featureItemId??entry.dataset.featureStepId)===activeId);
    if(active)rail.scrollTo({left:active.offsetLeft-rail.offsetLeft,behavior:"auto"});
  },[activeId]);
  const onScroll=(event:UIEvent<HTMLDivElement|HTMLOListElement>)=>{
    const rail=event.currentTarget;
    if(rail.scrollWidth<=rail.clientWidth+1)return;
    const entries=[...rail.querySelectorAll<HTMLElement>("[data-feature-item-id],[data-feature-step-id]")];
    const railStart=rail.getBoundingClientRect().left;
    const nearest=entries.reduce<HTMLElement|undefined>((current,entry)=>!current||Math.abs(entry.getBoundingClientRect().left-railStart)<Math.abs(current.getBoundingClientRect().left-railStart)?entry:current,undefined);
    const nearestId=nearest?.dataset.featureItemId??nearest?.dataset.featureStepId;
    if(nearestId&&nearestId!==activeId)onActiveChange(nearestId);
  };
  return {reference,onScroll};
}

function EntryMetrics({entry,model}:{entry:{metricIds?:string[]};model:ResolvedFeatureFixture}) {
  const metrics=(entry.metricIds??[]).map((id)=>model.metrics.find((metric)=>metric.id===id)).filter(Boolean);
  if(!metrics.length)return null;
  return <dl className="xp-feature__metrics">{metrics.map((metric)=><div data-feature-metric-id={metric!.id} key={metric!.id}><dt>{metric!.label}</dt><dd>{metric!.value}{metric!.unit}</dd></div>)}</dl>;
}

export function CapabilityDeck({model,className}:{model:ResolvedFeatureFixture;className?:string}) {
  if(model.owner!=="CapabilityDeck")throw new Error(`${model.sourceKey} is not owned by CapabilityDeck.`);
  const device=useDeviceClass();
  const initial=model.initialSelectionId??model.items[0]?.id;
  const [activeId,setActiveId]=useState(initial);
  const [paused,setPaused]=useState(false);
  useEffect(()=>setActiveId(initial),[initial,model.sourceKey]);
  const activeIndex=Math.max(0,model.items.findIndex(({id})=>id===activeId));
  const rail=useSynchronizedRail(activeId,setActiveId);
  const interactive=model.controls.some(({kind})=>kind==="select"||kind==="open-detail");
  const controlLabel=model.intro?.title??model.sourceKey;
  const ownedMediaIds=new Set(model.items.flatMap((item)=>item.mediaSeatIds??[]));
  const supportingMedia=model.media.filter(({id})=>!ownedMediaIds.has(id));
  const hasSharedProof=model.surfaces.length>0&&(model.preset==="split-proof"||model.preset==="device-orbit");
  const sharedSurfaceIds=new Set(hasSharedProof?model.surfaces.map(({id})=>id):[]);
  const sharedSurfaces=model.surfaces.filter(({id})=>sharedSurfaceIds.has(id));
  const renderItem=(item:typeof model.items[number],index:number)=>{
    const surfaces=distributeSurfaces(model,item.id,index,model.items.length).filter(({id})=>!sharedSurfaceIds.has(id));
    const media=(item.mediaSeatIds??[]).map((id)=>model.media.find((seat)=>seat.id===id)).filter(Boolean);
    return <article className="xp-feature__item" data-feature-item-id={item.id} data-active={item.id===activeId||undefined} aria-current={item.id===activeId?"true":undefined} key={item.id}>
      <header><span className="xp-feature__icon" data-icon-key={item.iconKey??item.id} aria-hidden="true"><i/><i/></span><small>{String(index+1).padStart(2,"0")}</small><h2>{item.title}</h2></header>
      {item.body.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}
      <EntryMetrics entry={item} model={model}/>
      {media.map((seat)=><FeatureMediaView seat={seat!} model={model} key={seat!.id}/>)}
      {surfaces.map((surface)=><FeatureSurfaceView surface={surface} ownerLabel={item.title} key={surface.id}/>)}
      <FeatureActions ownerId={item.id} model={model} onOwnerActivate={setActiveId}/>
    </article>;
  };
  return <section className={["xp-feature","xp-feature--capability",className].filter(Boolean).join(" ")} data-xp-owner="CapabilityDeck" data-feature-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={device} data-paused={paused||undefined} data-stress={model.activeStress}>
    <FeatureIntroView model={model}/>
    <FeatureError model={model}/>
    {interactive?<FeatureSelector controls={model.controls} activeId={activeId} onSelect={setActiveId} label={controlLabel}/>:null}
    {model.controls.some(({kind})=>kind==="pause")?<div className="xp-feature__pause-group">{model.controls.filter(({kind})=>kind==="pause").map((control)=><button className="xp-feature__pause" type="button" aria-pressed={paused} data-feature-control-id={control.id} data-xp-control onClick={()=>setPaused((current)=>!current)} key={control.id}>{paused?model.copy.pauseLabel:control.label||model.copy.pauseLabel}</button>)}</div>:null}
    <div className="xp-feature__capability-stage">
      <div className="xp-feature__capability-layout" data-feature-item-count={model.items.length} ref={rail.reference as React.Ref<HTMLDivElement>} onScroll={rail.onScroll}>
        {model.preset==="integration-map"?<div className="xp-feature__integration-hub" role="img" aria-label="XPRESSO integration hub"><span aria-hidden="true">XP</span><small>Integration hub</small></div>:null}
        {model.items.map(renderItem)}
      </div>
      {sharedSurfaces.length?<div className="xp-feature__shared-proof" data-shared-proof>{sharedSurfaces.map((surface)=><FeatureSurfaceView surface={surface} ownerLabel={model.intro?.title??model.sourceKey} key={surface.id}/>)}</div>:null}
    </div>
    {["product-spec","globe-split"].includes(model.preset)?<EntryMetrics entry={{metricIds:model.metrics.map(({id})=>id)}} model={model}/>:null}
    {supportingMedia.length?<div className="xp-feature__supporting-media" data-supporting-media-count={supportingMedia.length}>{supportingMedia.map((seat)=><FeatureMediaView seat={seat} model={model} key={seat.id}/>)}</div>:null}
    {interactive||model.preset==="report-stack"?<FeaturePagerControls model={model} activeIndex={activeIndex} count={model.items.length} onMove={(next)=>setActiveId(model.items[next].id)}/>:null}
  </section>;
}

export function StoryPager({model,className}:{model:ResolvedFeatureFixture;className?:string}) {
  if(model.owner!=="StoryPager")throw new Error(`${model.sourceKey} is not owned by StoryPager.`);
  const device=useDeviceClass();
  const initial=model.initialSelectionId??model.steps[0].id;
  const [activeId,setActiveId]=useState(initial);
  useEffect(()=>setActiveId(initial),[initial,model.sourceKey]);
  const activeIndex=Math.max(0,model.steps.findIndex(({id})=>id===activeId));
  const rail=useSynchronizedRail(activeId,setActiveId);
  const selectors=model.controls.filter(({kind})=>kind==="select");
  return <section className={["xp-feature","xp-feature--story",className].filter(Boolean).join(" ")} data-xp-owner="StoryPager" data-feature-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={device} data-stress={model.activeStress}>
    <FeatureIntroView model={model}/>
    <FeatureError model={model}/>
    {selectors.length?<FeatureSelector controls={selectors} activeId={activeId} onSelect={setActiveId} label={model.intro?.title??model.sourceKey}/>:null}
    <ol className="xp-feature__story" data-feature-step-count={model.steps.length} ref={rail.reference as React.Ref<HTMLOListElement>} onScroll={rail.onScroll}>{model.steps.map((step,index)=>{
      const surfaces=distributeSurfaces(model,step.id,index,model.steps.length);
      const media=(step.mediaSeatIds??[]).map((id)=>model.media.find((seat)=>seat.id===id)).filter(Boolean);
      return <li className="xp-feature__step" data-feature-step-id={step.id} data-active={step.id===activeId||undefined} key={step.id}>
        <button className="xp-feature__step-select" type="button" data-xp-control aria-current={step.id===activeId?"step":undefined} onClick={()=>setActiveId(step.id)}><small>{step.progressLabel}</small><strong>{step.title}</strong></button>
        <div className="xp-feature__step-detail">{step.body.map((line,lineIndex)=><p key={lineIndex}>{line}</p>)}{surfaces.map((surface)=><FeatureSurfaceView surface={surface} ownerLabel={step.title} key={surface.id}/>)}{media.map((seat)=><FeatureMediaView seat={seat!} model={model} key={seat!.id}/>)}</div>
      </li>;
    })}</ol>
    <FeaturePagerControls model={model} activeIndex={activeIndex} count={model.steps.length} onMove={(next)=>setActiveId(model.steps[next].id)}/>
  </section>;
}

export function FeatureSection({fixture,media=[],stress,className}:FeatureProperties) {
  const model=useMemo(()=>resolveFeatureFixture(fixture,stress,media),[fixture,media,stress]);
  if(model.owner==="Bento")return <Bento featureModel={model} className={className}/>;
  if(model.owner==="StoryPager")return <StoryPager model={model as ResolvedFeatureFixture & StoryFixture} className={className}/>;
  return <CapabilityDeck model={model as ResolvedFeatureFixture & CapabilityFixture} className={className}/>;
}
