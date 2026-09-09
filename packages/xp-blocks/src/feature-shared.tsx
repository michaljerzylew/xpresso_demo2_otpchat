import React, { type CSSProperties, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";
import { featurePosterSpecForSeat } from "./feature-posters";
import type {
  FeatureAction, FeatureControl, FeatureMediaSeat, FeatureMetric, FeatureSurface,
  ResolvedFeatureFixture,
} from "./feature-model";

export function FeatureIntroView({model}:{model:ResolvedFeatureFixture}) {
  if (!model.intro) return null;
  return <header className="xp-feature__intro" data-feature-intro>
    {model.intro.eyebrow?<p className="xp-feature__eyebrow">{model.intro.eyebrow}</p>:null}
    <h1>{model.intro.title}</h1>
    {model.intro.body.map((line,index)=><p key={index}>{line}</p>)}
    <FeatureActions ownerId="intro" model={model}/>
  </header>;
}

export function FeatureActions({ownerId,model,onOwnerActivate}:{ownerId:string;model:ResolvedFeatureFixture;onOwnerActivate?:(ownerId:string)=>void}) {
  const actions=model.actions.filter((action)=>action.ownerId===ownerId);
  if (!actions.length) return null;
  return <div className="xp-feature__actions" data-feature-action-owner={ownerId}>{actions.map((action)=><FeatureActionView action={action} onOwnerActivate={onOwnerActivate?()=>onOwnerActivate(ownerId):undefined} key={action.id}/>)}</div>;
}

function FeatureActionView({action,onOwnerActivate}:{action:FeatureAction;onOwnerActivate?:()=>void}) {
  const onFocus=(event:FocusEvent<HTMLElement>)=>{
    onOwnerActivate?.();
    event.currentTarget.closest<HTMLElement>("[data-feature-item-id],[data-feature-step-id],[data-feature-tile-id]")?.scrollIntoView({behavior:"auto",block:"nearest",inline:"start"});
  };
  if (action.kind === "navigate") return <a className="xp-feature__action" data-action-id={action.id} data-emphasis={action.emphasis??"secondary"} data-xp-control href={action.href} onFocus={onFocus}>{action.label}</a>;
  return <button className="xp-feature__action" data-action-id={action.id} data-xp-control type="button" onFocus={onFocus}>{action.label}</button>;
}

export function FeatureSelector({controls,activeId,onSelect,label}:{controls:FeatureControl[];activeId?:string;onSelect:(id:string)=>void;label:string}) {
  const selectable=controls.filter((control)=>control.kind==="select"||control.kind==="open-detail");
  if (!selectable.length) return null;
  const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return;
    event.preventDefault();
    const current=Math.max(0,selectable.findIndex(({targetId})=>targetId===activeId));
    const next=event.key==="Home"?0:event.key==="End"?selectable.length-1:event.key==="ArrowLeft"||event.key==="ArrowUp"?(current-1+selectable.length)%selectable.length:(current+1)%selectable.length;
    const target=selectable[next].targetId;
    if(target)onSelect(target);
    (event.currentTarget.querySelectorAll("button")[next] as HTMLButtonElement|undefined)?.focus();
  };
  return <div className="xp-feature__selector" role="tablist" aria-label={label} onKeyDown={onKeyDown}>{selectable.map((control)=><button type="button" role="tab" aria-selected={control.targetId===activeId} data-feature-control-id={control.id} data-xp-control onClick={()=>control.targetId&&onSelect(control.targetId)} key={control.id}>{control.label}</button>)}</div>;
}

export function FeaturePagerControls({model,activeIndex,count,onMove}:{model:ResolvedFeatureFixture;activeIndex:number;count:number;onMove:(next:number)=>void}) {
  if(count<2)return null;
  const previousControl=model.controls.find(({kind})=>kind==="previous");
  const nextControl=model.controls.find(({kind})=>kind==="next");
  return <div className="xp-feature__pager-controls">
    <button type="button" data-feature-previous data-feature-control-id={previousControl?.id} data-xp-control disabled={activeIndex===0} onClick={()=>onMove(Math.max(0,activeIndex-1))}>{model.copy.previousLabel}</button>
    <span aria-live="polite">{model.copy.progressTemplate.replace("{current}",String(activeIndex+1)).replace("{total}",String(count))}</span>
    <button type="button" data-feature-next data-feature-control-id={nextControl?.id} data-xp-control disabled={activeIndex===count-1} onClick={()=>onMove(Math.min(count-1,activeIndex+1))}>{model.copy.nextLabel}</button>
  </div>;
}

const surfaceKindLabel:Record<FeatureSurface["kind"],string>={
  "system-ui":"system interface",
  chart:"data chart",
  workflow:"process flow",
  process:"process flow",
  device:"device preview",
  globe:"network globe",
};

export function FeatureSurfaceView({surface,ownerLabel}:{surface:FeatureSurface;ownerLabel:string}) {
  const seed=[...surface.id].reduce((sum,character)=>sum+character.charCodeAt(0),0);
  const bars=Array.from({length:6},(_,index)=>22+((seed*(index+3))%68));
  const title=surface.title?.trim()||`${ownerLabel} ${surfaceKindLabel[surface.kind]}`;
  const titleId=`xp-feature-proof-title-${surface.id}`;
  return <section className="xp-feature__proof" data-feature-surface-id={surface.id} data-surface-kind={surface.kind} tabIndex={0} aria-labelledby={titleId}>
    <header><span data-feature-decoration aria-hidden="true"/><strong id={titleId}>{title}</strong><small>XP</small></header>
    {surface.kind==="chart"?<div className="xp-feature__chart" role="img" aria-label={title}>{bars.map((height,index)=><i style={{"--feature-bar":`${height}%`} as CSSProperties} key={index}/>)}</div>:null}
    {surface.kind==="globe"?<div className="xp-feature__globe" role="img" aria-label={title}><i/><i/><i/><i/></div>:null}
    {surface.kind==="device"?<div className="xp-feature__device" role="img" aria-label={title}><i/><i/><i/></div>:null}
    {surface.kind==="workflow"||surface.kind==="process"?<div className="xp-feature__workflow" role="img" aria-label={title}>{bars.slice(0,4).map((_,index)=><i key={index}/>)}</div>:null}
    {surface.kind==="system-ui"?<div className="xp-feature__system-ui" role="img" aria-label={title}><i/><i/><i/><i/><i/></div>:null}
  </section>;
}

export function FeaturePoster({seat,metrics}:{seat:FeatureMediaSeat;metrics:FeatureMetric[]}) {
  const spec=featurePosterSpecForSeat(seat.id);
  if(!spec)throw new Error(`Missing deterministic poster spec for ${seat.id}.`);
  const owned=spec.metricIds.map((id)=>metrics.find((metric)=>metric.id===id)).filter(Boolean) as FeatureMetric[];
  if(owned.length!==spec.metricIds.length)throw new Error(`${spec.exportId} is missing metrics.`);
  return <figure className="xp-feature__poster" data-feature-media-seat-id={seat.id} data-feature-poster-export={spec.exportId} data-runtime-owner={spec.runtimeOwner} aria-label={seat.alt}>
    <div className="xp-feature__poster-art" data-poster-kind={spec.kind}>{Array.from({length:spec.kind==="process"?12:6},(_,index)=><i key={index}/>)}</div>
    <figcaption>{owned.map((metric)=><span key={metric.id}><small>{metric.label}</small><strong>{metric.value}{metric.unit}</strong></span>)}</figcaption>
  </figure>;
}

export function FeatureMediaView({seat,model}:{seat:FeatureMediaSeat;model:ResolvedFeatureFixture}) {
  const resolved=model.mediaBySeatId.get(seat.id);
  if(!resolved)return null;
  if(resolved.runtimeOwner==="xp-code-art"){
    const spec=featurePosterSpecForSeat(seat.id);
    if(!spec)throw new Error(`Missing deterministic poster spec for ${seat.id}.`);
    return <figure className="xp-feature__media xp-feature__poster" data-feature-media-seat-id={seat.id} data-feature-poster-export={spec.exportId} data-runtime-owner="xp-code-art" aria-label={seat.alt}><picture><source type="image/avif" srcSet={`${resolved.record.publicBase}-640.avif 640w, ${resolved.record.publicBase}-1280.avif 1280w, ${resolved.record.publicBase}-1920.avif 1920w`}/><source type="image/webp" srcSet={`${resolved.record.publicBase}-640.webp 640w, ${resolved.record.publicBase}-1280.webp 1280w, ${resolved.record.publicBase}-1920.webp 1920w`}/><img src={`${resolved.record.publicBase}-1280.jpg`} alt={seat.alt}/></picture></figure>;
  }
  if(resolved.runtimeOwner==="xp-media")return <figure className="xp-feature__media" data-feature-media-seat-id={seat.id} data-media-role={seat.role} data-media-aspect={seat.aspect}><picture><source type="image/avif" srcSet={`${resolved.record.publicBase}-640.avif 640w, ${resolved.record.publicBase}-1280.avif 1280w, ${resolved.record.publicBase}-1920.avif 1920w`}/><source type="image/webp" srcSet={`${resolved.record.publicBase}-640.webp 640w, ${resolved.record.publicBase}-1280.webp 1280w, ${resolved.record.publicBase}-1920.webp 1920w`}/><img src={`${resolved.record.publicBase}-1280.jpg`} alt={seat.alt}/></picture></figure>;
  return <figure className="xp-feature__media" data-feature-media-seat-id={seat.id}><img src={resolved.record.src} alt={seat.alt}/></figure>;
}

export function distributeSurfaces(model:ResolvedFeatureFixture,entryId:string,index:number,total:number) {
  const entries=model.owner==="StoryPager"?model.steps:model.owner==="Bento"?model.tiles:model.items;
  const entry=entries.find(({id})=>id===entryId);
  if(entry?.surfaceIds?.length)return entry.surfaceIds.filter((id)=>entries.findIndex((candidate)=>candidate.surfaceIds?.includes(id))===index).map((id)=>model.surfaces.find((surface)=>surface.id===id)).filter(Boolean) as FeatureSurface[];
  if(model.surfaces.length===1)return index===0?model.surfaces:[];
  if(model.surfaces.length===total)return [model.surfaces[index]].filter(Boolean);
  return model.surfaces.filter((_,surfaceIndex)=>surfaceIndex%Math.max(1,total)===index);
}

export function FeatureError({model}:{model:ResolvedFeatureFixture}) {
  if(model.activeStress!=="error")return null;
  return <p className="xp-feature__error" role="alert">{model.announcements.error??model.intro?.title}</p>;
}

export function FeatureCollection({children}:{children:ReactNode}) { return <div className="xp-feature__collection">{children}</div>; }
