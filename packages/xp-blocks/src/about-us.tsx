"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AdaptiveOverlay, useDeviceClass } from "@xp/primitives";
import {
  resolveAboutUsFixture,
  type AboutUsFixture,
  type AboutUsMediaRecord,
  type ResolvedAboutUsFixture,
  type ResolvedAboutUsMedia,
  type StoryAction,
  type StoryFeature,
  type StoryPanel,
  type StorySystemSurface,
  type StorySystemView,
} from "./about-us-model";

export type AboutUsSurfaceProperties = {
  fixture: AboutUsFixture;
  media: AboutUsMediaRecord[];
  stress?: string;
  className?: string;
};
type OwnerProperties = { model: ResolvedAboutUsFixture };

type OpenAction = (action: StoryAction, trigger: HTMLButtonElement) => void;

function ActionControl({ action, onOpen }: { action: StoryAction; onOpen?: OpenAction }) {
  const properties = {
    className: "xp-about__action",
    "data-action-id": action.id,
    "data-action-owner": action.ownerId,
    "data-emphasis": action.emphasis,
    "data-xp-control": "",
  };
  if (action.kind === "navigate") return <a {...properties} href={action.href}>{action.label}</a>;
  return <button {...properties} type="button" onClick={(event)=>onOpen?.(action,event.currentTarget)}>{action.label}</button>;
}

function ActionSet({ model, ownerId, onOpen }: { model: ResolvedAboutUsFixture; ownerId: string; onOpen?: OpenAction }) {
  const actions = model.actions.filter((action)=>action.ownerId===ownerId);
  if (!actions.length) return null;
  return <div className="xp-about__actions" data-action-owner-set={ownerId}>{actions.map((action)=><ActionControl action={action} onOpen={onOpen} key={action.id}/>)}</div>;
}

function Intro({ model, onOpen }: { model: ResolvedAboutUsFixture; onOpen?: OpenAction }) {
  return <header className="xp-about__intro" data-story-intro>
    {model.intro.eyebrow ? <p className="xp-about__eyebrow">{model.intro.eyebrow}</p> : null}
    <h1>{model.intro.title}</h1>
    {model.intro.body?.map((body,index)=><p key={index}>{body}</p>)}
    <ActionSet model={model} ownerId="intro" onOpen={onOpen}/>
  </header>;
}

function FailedMedia({ asset, label }: { asset:ResolvedAboutUsMedia;label:string }) {
  return <div className="xp-about__failed-media" role="img" aria-label={`${asset.alt}. ${label}`} data-media-seat-id={asset.seatId} data-media-key={asset.key} data-media-kind={asset.kind} data-media-status="error">
    <span aria-hidden="true">!</span><strong>{label}</strong><small>{asset.alt}</small>
  </div>;
}

function MediaView({ asset, className, errorLabel, model, feature }: { asset?: ResolvedAboutUsMedia; className?: string;errorLabel?:string;model?:ResolvedAboutUsFixture;feature?:StoryFeature }) {
  if (!asset) return null;
  if (errorLabel) return <FailedMedia asset={asset} label={errorLabel}/>;
  const data = { "data-media-seat-id": asset.seatId, "data-media-key": asset.key, "data-media-kind": asset.kind };
  if (asset.kind === "system-ui") return <SystemIllustration asset={asset} model={model} feature={feature}/>;
  const image = asset.kind === "avatar"
    ? <img {...data} className={className} src={`${asset.publicBase}.webp`} alt={asset.alt} loading="lazy" decoding="async"/>
    : asset.kind === "vector"
      ? <picture {...data} className={className}>{asset.darkSrc ? <source media="(prefers-color-scheme: dark)" srcSet={asset.darkSrc}/> : null}<img src={asset.src} alt={asset.alt} loading="lazy" decoding="async"/></picture>
      : <picture {...data} className={className}><source type="image/avif" srcSet={`${asset.publicBase}-640.avif 640w, ${asset.publicBase}-1280.avif 1280w, ${asset.publicBase}-1920.avif 1920w`}/><source type="image/webp" srcSet={`${asset.publicBase}-640.webp 640w, ${asset.publicBase}-1280.webp 1280w, ${asset.publicBase}-1920.webp 1920w`}/><img src={`${asset.publicBase}-1280.jpg`} alt={asset.alt} loading="lazy" decoding="async"/></picture>;
  return image;
}

const capabilityPreview:Record<string,{state:string;rows:Array<[string,string]>}>={
  ui_sync_dashboard:{state:"Syncing 84%",rows:[["Matched records","2,418"],["Pending review","12"]]},
  ui_access_control:{state:"Policy active",rows:[["Administrators","8"],["Security profiles","4"]]},
  ui_export_tool:{state:"Ready to export",rows:[["Query rows","12,480"],["Output format","PDF"]]},
};

function SystemIllustration({ asset, model, feature }: { asset: ResolvedAboutUsMedia;model?:ResolvedAboutUsFixture;feature?:StoryFeature }) {
  const capability=capabilityPreview[asset.key];
  if(capability&&feature) return <section className="xp-about__mini-ui" aria-label={asset.alt} data-system-preview={asset.key} data-media-seat-id={asset.seatId} data-media-key={asset.key} data-media-kind="system-ui">
    <header><strong>{feature.title}</strong><span data-ui-state>{capability.state}</span></header>
    <dl>{capability.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="xp-about__mini-progress" aria-label={capability.state}><i/></div>
  </section>;
  if(asset.key==="ui_community_proof"&&model) {
    const identity=model.identities.find(({mediaSeatId})=>mediaSeatId===asset.seatId);
    return <section className="xp-about__mini-ui xp-about__mini-ui--community" aria-label={asset.alt} data-system-preview="community-verification" data-media-seat-id={asset.seatId} data-media-key={asset.key} data-media-kind="system-ui">
      <header><strong>{identity?.name}</strong><span data-ui-state>Verified</span></header>
      <dl>{model.metrics.map((metric)=><div key={metric.id}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
      <div className="xp-about__mini-tag-list">{model.tags.slice(0,4).map((tag)=><span key={tag.id}>{tag.label}</span>)}</div>
    </section>;
  }
  return <div className="xp-about__system-illustration" role="img" aria-label={asset.alt} data-media-seat-id={asset.seatId} data-media-key={asset.key} data-media-kind="system-ui">
    <span/><span/><span/><span/><span/><span/>
  </div>;
}

function Metrics({ model, ids = model.metrics.map(({id})=>id) }: { model: ResolvedAboutUsFixture; ids?: string[] }) {
  const metrics = ids.map((id)=>model.metrics.find((metric)=>metric.id===id)).filter(Boolean) as ResolvedAboutUsFixture["metrics"];
  if (!metrics.length) return null;
  return <dl className="xp-about__metrics">{metrics.map((metric)=><div data-metric-id={metric.id} key={metric.id}><dt>{metric.label}</dt><dd>{metric.value}</dd>{metric.detail ? <small>{metric.detail}</small> : null}</div>)}</dl>;
}

function IdentityMedia({ model, ids = model.identities.map(({id})=>id) }: { model: ResolvedAboutUsFixture; ids?: string[] }) {
  const identities = ids.map((id)=>model.identities.find((identity)=>identity.id===id)).filter(Boolean) as ResolvedAboutUsFixture["identities"];
  if (!identities.length) return null;
  return <div className="xp-about__identity-field" data-identity-count={identities.length}>{identities.map((identity)=><figure data-identity-id={identity.id} key={identity.id}>
    <MediaView asset={model.mediaBySeatId.get(identity.mediaSeatId)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model}/>
    <figcaption><strong>{identity.name}</strong><span>{identity.role}</span></figcaption>
  </figure>)}</div>;
}

function unprojectedIdentityIds(model:ResolvedAboutUsFixture) {
  const projected=new Set([
    ...model.features.flatMap(({mediaSeatIds=[]})=>mediaSeatIds),
    ...(model.owner==="StorySplit"?model.panels.flatMap(({mediaSeatIds=[]})=>mediaSeatIds):[]),
    ...(model.owner==="StorySplit"&&model.extension.kind==="tabbed-principles"?model.extension.panels.flatMap(({mediaSeatIds=[]})=>mediaSeatIds):[]),
  ]);
  return model.identities.filter(({mediaSeatId})=>!projected.has(mediaSeatId)).map(({id})=>id);
}

function unprojectedFeatures(model:ResolvedAboutUsFixture) {
  const projected=new Set([
    ...model.panels.flatMap(({featureIds=[]})=>featureIds),
    ...(model.extension.kind==="tabbed-principles"?model.extension.panels.flatMap(({featureIds=[]})=>featureIds):[]),
  ]);
  return model.features.filter(({id})=>!projected.has(id));
}

function unprojectedMetricIds(model:ResolvedAboutUsFixture) {
  const projected=new Set([
    ...model.panels.flatMap(({metricIds=[]})=>metricIds),
    ...(model.extension.kind==="tabbed-principles"?model.extension.panels.flatMap(({metricIds=[]})=>metricIds):[]),
  ]);
  return model.metrics.filter(({id})=>!projected.has(id)).map(({id})=>id);
}

function unprojectedTags(model:ResolvedAboutUsFixture) {
  const projected=new Set(model.features.flatMap(({tagIds=[]})=>tagIds));
  return model.tags.filter(({id})=>!projected.has(id));
}

function Feature({ feature, model, onOpen }: { feature: StoryFeature; model: ResolvedAboutUsFixture; onOpen?: OpenAction }) {
  return <article className="xp-about__feature" data-feature-id={feature.id}>
    {feature.iconKey ? <span className="xp-about__feature-icon" aria-hidden="true">{feature.iconKey.slice(0,2).toUpperCase()}</span> : null}
    {feature.mediaSeatIds?.map((id)=><MediaView asset={model.mediaBySeatId.get(id)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model} feature={feature} key={id}/>) }
    <div className="xp-about__feature-copy"><h2>{feature.title}</h2>{feature.description ? <p>{feature.description}</p> : null}{feature.bullets?.length ? <ul>{feature.bullets.map((bullet,index)=><li key={index}>{bullet}</li>)}</ul> : null}</div>
    {feature.tagIds?.length ? <div className="xp-about__tags">{feature.tagIds.map((id)=>{const tag=model.tags.find((item)=>item.id===id);return tag?<span data-tag-id={id} key={id}>{tag.label}</span>:null;})}</div> : null}
    <ActionSet model={model} ownerId={feature.id} onOpen={onOpen}/>
  </article>;
}

function FeatureCollection({ model, features=model.features, rail=false, onOpen }: { model:ResolvedAboutUsFixture;features?:StoryFeature[];rail?:boolean;onOpen?:OpenAction }) {
  if (!features.length) return null;
  return <div className={rail?"xp-about__feature-rail":"xp-about__features"} data-feature-collection data-xp-scroll={rail?"":undefined}>{features.map((feature)=><Feature feature={feature} model={model} onOpen={onOpen} key={feature.id}/>)}</div>;
}

function Panel({ panel, model, onOpen }: { panel:StoryPanel;model:ResolvedAboutUsFixture;onOpen?:OpenAction }) {
  const panelMedia=new Set(panel.mediaSeatIds??[]);
  const features=(panel.featureIds??[]).map((id)=>model.features.find((feature)=>feature.id===id)).filter(Boolean).map((feature)=>({...feature,mediaSeatIds:feature!.mediaSeatIds?.filter((id)=>!panelMedia.has(id))})) as StoryFeature[];
  const trustStory=model.preset==="trust-story";
  const trustMedia=trustStory?{
    photo:(panel.mediaSeatIds??[]).filter((id)=>model.mediaBySeatId.get(id)?.kind==="responsive-image"),
    portraits:(panel.mediaSeatIds??[]).filter((id)=>model.mediaBySeatId.get(id)?.kind==="avatar"),
    partners:(panel.mediaSeatIds??[]).filter((id)=>model.mediaBySeatId.get(id)?.kind==="vector"),
  }:undefined;
  return <section className="xp-about__panel" data-panel-id={panel.id}>
    {panel.title || panel.body?.length ? <div>{panel.title?<h2>{panel.title}</h2>:null}{panel.body?.map((line,index)=><p key={index}>{line}</p>)}</div> : null}
    {trustMedia?<>
      <div className="xp-about__trust-photo">{trustMedia.photo.map((id)=><MediaView asset={model.mediaBySeatId.get(id)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model} key={id}/>)}</div>
      <div className="xp-about__trust-collection xp-about__trust-portraits" data-trust-collection="portraits" data-xp-scroll>{trustMedia.portraits.map((id)=><MediaView asset={model.mediaBySeatId.get(id)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model} key={id}/>)}</div>
      <div className="xp-about__trust-collection xp-about__trust-partners" data-trust-collection="partners" data-xp-scroll>{trustMedia.partners.map((id)=><MediaView asset={model.mediaBySeatId.get(id)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model} key={id}/>)}</div>
    </>:panel.mediaSeatIds?.map((id)=><MediaView asset={model.mediaBySeatId.get(id)} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model} key={id}/>) }
    {panel.metricIds ? <Metrics model={model} ids={panel.metricIds}/> : null}
    {features.length ? <FeatureCollection model={model} features={features} onOpen={onOpen}/> : null}
    <ActionSet model={model} ownerId={panel.id} onOpen={onOpen}/>
  </section>;
}

function useActionOverlay(model: ResolvedAboutUsFixture) {
  const autoOpen = new Set(["compactMockOpen","mockOpen","metricDetailOpen","firstMockOpen","secondMockOpen","compactInspectOpen"]).has(model.activeStress ?? "");
  const [open,setOpen] = useState(autoOpen);
  const [action,setAction] = useState<StoryAction|undefined>();
  const trigger=useRef<HTMLButtonElement|null>(null);
  useEffect(()=>{setOpen(autoOpen);setAction(undefined);trigger.current=null;},[autoOpen,model.sourceKey,model.activeStress]);
  const onOpenChange=(next:boolean)=>{setOpen(next);if(!next&&trigger.current)requestAnimationFrame(()=>trigger.current?.focus());};
  return { open,action,onOpenChange,onOpen:(next:StoryAction,element:HTMLButtonElement)=>{trigger.current=element;setAction(next);setOpen(true);} };
}

function ActionDetail({ model, action }: { model:ResolvedAboutUsFixture;action?:StoryAction }) {
  if(action?.resultTitle || action?.resultBody) return <section className="xp-about__action-result" data-about-action-result={action.id} data-action-result-title={action.resultTitle}>
    {action.resultTitle?<h3>{action.resultTitle}</h3>:null}
    {action.resultBody?<p>{action.resultBody}</p>:null}
  </section>;
  if(model.extension.kind==="community-proof"){
    const accuracy=model.metrics.find(({id})=>id==="met-13-ro")??model.metrics.at(-1);
    return <section className="xp-about__community-report" data-about-action-result={action?.id??"stress-preview"} data-community-report>
      <div className="xp-about__community-rating" data-community-star-value={accuracy?.value}><span aria-hidden="true">★</span><div><strong>{accuracy?.value}</strong><small>{accuracy?.label}</small></div></div>
      <Metrics model={model}/>
      <div className="xp-about__tags">{model.extension.tagIds.map((id)=>{const tag=model.tags.find((item)=>item.id===id);return tag?<span data-tag-id={id} key={id}>{tag.label}</span>:null;})}</div>
    </section>;
  }
  const panel=action?model.panels.find(({id})=>id===action.ownerId):undefined;
  return <section className="xp-about__action-result" data-about-action-result={action?.id??"stress-preview"}>{panel?.body?.map((line,index)=><p key={index}>{line}</p>)??model.intro.body?.map((line,index)=><p key={index}>{line}</p>)}</section>;
}

function DetailOverlay({ model, state, children }: { model:ResolvedAboutUsFixture;state:ReturnType<typeof useActionOverlay>;children?:ReactNode }) {
  const title = state.action?.label ?? model.intro.title;
  return <AdaptiveOverlay intent="detail" open={state.open} onOpenChange={state.onOpenChange}>
    <AdaptiveOverlay.Content className={`xp-about__overlay xp-about__overlay--${model.preset}`}><AdaptiveOverlay.Header title={title} description={model.intro.body?.[0]} closeLabel="Close details"/><AdaptiveOverlay.Body>{state.action?.resultBody?<ActionDetail model={model} action={state.action}/>:children ?? <ActionDetail model={model} action={state.action}/>}</AdaptiveOverlay.Body></AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function SystemSurface({ surface, model, onOpen }: { surface:StorySystemSurface;model:ResolvedAboutUsFixture;onOpen?:OpenAction }) {
  const records = surface.recordIds.map((id)=>model.systemRecords.find((record)=>record.id===id) ?? model.metrics.find((record)=>record.id===id)).filter(Boolean) as ResolvedAboutUsFixture["systemRecords"];
  return <section className="xp-about__system-surface" data-system-surface={surface.kind} data-surface-id={surface.id}>
    <h3>{surface.title}</h3>
    {surface.kind==="chart" ? <div className="xp-about__chart" aria-label={surface.title}>{records.map((record,index)=>{const numeric=record.values?Math.max(...Object.values(record.values)):Number.parseFloat(record.value??"")||index+1;const displayed=record.value??(record.values?Object.values(record.values)[0]:undefined);return <span key={record.id} style={{"--bar":`${Math.max(18,Math.min(100,numeric/20))}%`} as React.CSSProperties}><i/><strong>{displayed}{record.values?.Latency!==undefined?" ms":""}</strong><small>{record.label}</small></span>;})}</div> : null}
    {surface.kind==="progress-list" ? <div className="xp-about__progress-list">{records.map((record)=><div key={record.id}><span>{record.label}</span><progress value={record.progress} max="100"/><strong>{record.value}</strong></div>)}</div> : null}
    {surface.kind==="table" ? <div className="xp-about__system-table" role="table">{records.map((record)=><div role="row" key={record.id}><span role="cell">{record.label}</span><strong role="cell">{record.value}</strong>{record.detail?<small role="cell">{record.detail}</small>:null}</div>)}</div> : null}
    {surface.kind==="metric" || surface.kind==="business-card" ? <dl className="xp-about__system-metrics">{records.map((record)=><div key={record.id}><dt>{record.label}</dt><dd>{record.value}</dd>{record.detail?<small>{record.detail}</small>:null}</div>)}</dl> : null}
    {surface.kind==="plan-picker" ? <div className="xp-about__plan-placeholder"><span>Plan</span><strong>Configured</strong></div> : null}
    <ActionSet model={model} ownerId={surface.id} onOpen={onOpen}/>
  </section>;
}

function SystemControls({ view }: { view:StorySystemView }) {
  return <div className="xp-about__system-controls">{view.controls.map((control)=>{
    if(control.kind==="menu") return <details data-control-id={control.id} key={control.id}><summary data-xp-control>{control.label}</summary><ul>{control.commands.map((command)=><li key={command}><button type="button" data-xp-control>{command}</button></li>)}</ul></details>;
    if(control.kind==="select") return <label key={control.id}>{control.label}<select defaultValue={control.selectedId} data-control-id={control.id} data-xp-control>{control.optionIds.map((id)=><option value={id} key={id}>{id.replaceAll("-"," ")}</option>)}</select></label>;
    return <fieldset data-control-id={control.id} key={control.id}><legend>{control.label}</legend>{control.optionIds.map((id)=><label key={id}><input type="checkbox" defaultChecked={control.selectedIds.includes(id)}/>{id.replaceAll("-"," ")}</label>)}</fieldset>;
  })}</div>;
}

function SystemWorkspace({ model, forcedViewId, onOpen, standalone=false }: { model:ResolvedAboutUsFixture;forcedViewId?:string;onOpen?:OpenAction;standalone?:boolean }) {
  if(model.extension.kind!=="system-ui") {
    const asset=[...model.mediaBySeatId.values()].find(({kind})=>kind==="system-ui")!;
    return model.activeStress==="error"?<FailedMedia asset={asset} label={model.announcements.error}/>:<SystemIllustration asset={asset} model={model}/>;
  }
  const extension = model.extension;
  const initial = forcedViewId ?? extension.initialViewId;
  const [viewId,setViewId]=useState(initial);
  useEffect(()=>setViewId(initial),[initial,model.activeStress]);
  const view=extension.views.find(({id})=>id===viewId) ?? extension.views[0];
  const viewIndex=extension.views.indexOf(view);
  const runtimeSeats=[...model.mediaBySeatId.values()].filter(({kind})=>kind==="system-ui");
  const runtimeSeat=runtimeSeats[Math.min(viewIndex,runtimeSeats.length-1)];
  const failed=model.activeStress==="error";
  const tabs=extension.views.length>1&&!standalone;
  const onKeys=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?extension.views.length-1:event.key==="ArrowRight"?(index+1)%extension.views.length:(index-1+extension.views.length)%extension.views.length;setViewId(extension.views[next].id);};
  return <div className="xp-about__workspace" data-active-view={view.id}>
    {tabs?<div className="xp-about__tabs" role="tablist" aria-label={model.intro.title}>{extension.views.map((item,index)=><button type="button" role="tab" aria-selected={item.id===view.id} tabIndex={item.id===view.id?0:-1} data-xp-control onKeyDown={(event)=>onKeys(event,index)} onClick={()=>setViewId(item.id)} key={item.id}>{item.label}</button>)}</div>:null}
    <div role={tabs?"tabpanel":failed?undefined:"img"} aria-label={failed?undefined:runtimeSeat?.alt} data-media-seat-id={failed?undefined:runtimeSeat?.seatId} data-media-key={failed?undefined:runtimeSeat?.key} data-media-kind={failed?undefined:runtimeSeat?"system-ui":undefined} className="xp-about__workspace-view"><SystemControls view={view}/>{failed&&runtimeSeat?<><FailedMedia asset={runtimeSeat} label={model.announcements.error}/>{view.surfaces.map((surface)=><ActionSet model={model} ownerId={surface.id} onOpen={onOpen} key={surface.id}/>)}</>:view.surfaces.map((surface)=><SystemSurface surface={surface} model={model} onOpen={onOpen} key={surface.id}/>)}<ActionSet model={model} ownerId={view.id} onOpen={onOpen}/></div>
    <p className="xp-about__live" aria-live="polite">{view.label}</p>
  </div>;
}

function Root({ model, kind, children }: { model:ResolvedAboutUsFixture;kind:string;children:ReactNode }) {
  const device=useDeviceClass();
  return <section className={`xp-about xp-about--${kind}`} data-xp-about-surface data-xp-about-owner={model.owner} data-about-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device={device} data-stress={model.activeStress}>{model.activeStress==="error"?<p className="xp-about__error-notice" role="alert">{model.announcements.error}</p>:null}{children}<p className="xp-about__live" aria-live="polite">{model.announcements.railPosition ?? model.announcements.tabChanged ?? ""}</p></section>;
}

export function ProofBand({ model }: OwnerProperties) {
  return <Root model={model} kind="proof-band"><div className="xp-about__proof-layout"><Intro model={model}/><div className="xp-about__proof-visual"><IdentityMedia model={model} ids={unprojectedIdentityIds(model)}/></div><Metrics model={model}/><FeatureCollection model={model}/></div></Root>;
}

export function BentoGrid({ model }: OwnerProperties) {
  return <Root model={model} kind="bento-grid"><Intro model={model}/><div className="xp-about__bento"><FeatureCollection model={model}/><IdentityMedia model={model} ids={unprojectedIdentityIds(model)}/><Metrics model={model}/></div></Root>;
}

function AboutCapabilityDeck({ model }: OwnerProperties) {
  const [active,setActive]=useState(model.features.length-1);
  const rail=useRef<HTMLDivElement>(null);
  const move=(step:number)=>{const next=Math.max(0,Math.min(model.features.length-1,active+step));setActive(next);rail.current?.children[next]?.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"});};
  return <Root model={model} kind="capability-deck"><Intro model={model}/><div className="xp-about__deck-controls">{model.controls.map((control)=><button type="button" aria-label={control.label} disabled={control.kind==="rail-previous"?active===0:active===model.features.length-1} onClick={()=>move(control.kind==="rail-previous"?-1:1)} data-xp-control key={control.id}>{control.kind==="rail-previous"?"←":"→"}</button>)}</div><div className="xp-about__capability-rail" ref={rail} data-xp-scroll>{model.features.map((feature)=><Feature feature={feature} model={model} key={feature.id}/>)}</div></Root>;
}

function TabbedStory({ model, onOpen }: { model:ResolvedAboutUsFixture;onOpen:OpenAction }) {
  if(model.extension.kind!=="tabbed-principles") return null;
  const extension=model.extension;
  const [active,setActive]=useState(extension.initialPanelId);
  useEffect(()=>setActive(extension.initialPanelId),[extension,model.activeStress]);
  const panel=extension.panels.find(({id})=>id===active)!;
  const onKeys=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?extension.tabs.length-1:event.key==="ArrowRight"?(index+1)%extension.tabs.length:(index-1+extension.tabs.length)%extension.tabs.length;setActive(extension.tabs[next].panelId);};
  return <div className="xp-about__tabbed-story"><div className="xp-about__tabs" role="tablist" aria-label={model.intro.title}>{extension.tabs.map((tab,index)=><button type="button" role="tab" aria-selected={tab.panelId===active} tabIndex={tab.panelId===active?0:-1} onClick={()=>setActive(tab.panelId)} onKeyDown={(event)=>onKeys(event,index)} data-xp-control key={tab.id}>{tab.label}</button>)}</div><div role="tabpanel"><Panel panel={panel} model={model} onOpen={onOpen}/></div></div>;
}

function GroupPager({ model, onOpen }: { model:ResolvedAboutUsFixture;onOpen:OpenAction }) {
  if(model.extension.kind!=="group-pager") return null;
  const initialGroup=model.extension.initialGroupId;
  const initialItem=model.extension.initialItemId;
  const [groupId,setGroupId]=useState(initialGroup);const [itemId,setItemId]=useState(initialItem);
  useEffect(()=>{setGroupId(initialGroup);setItemId(initialItem);},[initialGroup,initialItem,model.activeStress]);
  const group=model.extension.groups.find(({id})=>id===groupId)!;const panel=model.panels.find(({id})=>id===groupId)!;const feature=model.features.find(({id})=>id===itemId)!;
  const move=(step:number)=>{const index=group.itemIds.indexOf(itemId),next=Math.max(0,Math.min(group.itemIds.length-1,index+step));setItemId(group.itemIds[next]);};
  return <div className="xp-about__group-pager"><div className="xp-about__group-tabs" role="tablist">{model.extension.groups.map((item)=><button type="button" role="tab" aria-selected={item.id===groupId} onClick={()=>{setGroupId(item.id);setItemId(item.itemIds[0]);}} data-xp-control key={item.id}>{model.panels.find(({id})=>id===item.id)?.title}</button>)}</div><Panel panel={panel} model={model} onOpen={onOpen}/><Feature feature={feature} model={model} onOpen={onOpen}/><div className="xp-about__deck-controls">{model.controls.map((control)=><button type="button" aria-label={control.label} onClick={()=>move(control.kind==="rail-previous"?-1:1)} data-xp-control key={control.id}>{control.kind==="rail-previous"?"←":"→"}</button>)}</div></div>;
}

function CollectionControls({ model, host }: { model:ResolvedAboutUsFixture;host:React.RefObject<HTMLDivElement|null> }) {
  if(!model.controls.length) return null;
  const [active,setActive]=useState(0);
  useEffect(()=>setActive(0),[model.sourceKey,model.activeStress]);
  const move=(kind:"rail-previous"|"rail-next")=>{const viewport=host.current?.querySelector<HTMLElement>("[data-xp-scroll]");if(!viewport)return;const next=Math.max(0,Math.min(viewport.children.length-1,active+(kind==="rail-previous"?-1:1)));setActive(next);(viewport.children[next] as HTMLElement|undefined)?.scrollIntoView({behavior:"auto",inline:"start",block:"nearest"});};
  return <div className="xp-about__deck-controls" data-story-controls data-active-item={active}>{model.controls.map((control)=><button type="button" aria-label={control.label} disabled={control.kind==="rail-previous"?active===0:active>=model.features.length-1} onClick={()=>move(control.kind)} data-control-id={control.id} data-xp-control key={control.id}>{control.kind==="rail-previous"?"←":"→"}</button>)}</div>;
}

function ProductDialogue({ model, feature, view, onOpen }: { model:ResolvedAboutUsFixture;feature:StoryFeature;view:StorySystemView;onOpen:OpenAction }) {
  return <article className="xp-about__dialogue" data-feature-id={feature.id}>
    <div className="xp-about__dialogue-copy"><h2>{feature.title}</h2>{feature.description?<p>{feature.description}</p>:null}{feature.bullets?.length?<ul>{feature.bullets.map((bullet,index)=><li key={index}>{bullet}</li>)}</ul>:null}<ActionSet model={model} ownerId={feature.id} onOpen={onOpen}/></div>
    <SystemWorkspace model={model} forcedViewId={view.id} standalone/>
  </article>;
}

function ProductDialogues({ model, onOpen }: OwnerProperties & { onOpen:OpenAction }) {
  if(model.extension.kind!=="system-ui") return null;
  const views=model.extension.views;
  return <div className="xp-about__dialogues">{model.features.map((feature,index)=><ProductDialogue model={model} feature={feature} view={views[index]??views[0]} onOpen={onOpen} key={feature.id}/>)}</div>;
}

function ReliabilityProof({ model, onOpen }: OwnerProperties & { onOpen?:OpenAction }) {
  if(model.extension.kind!=="system-ui") return null;
  const view=model.extension.views[0];
  const seats=[...model.mediaBySeatId.values()].filter(({kind})=>kind==="system-ui");
  return <div className="xp-about__reliability-proof">{view.surfaces.map((surface,index)=>{const failed=model.activeStress==="error";return <div className="xp-about__reliability-surface" role={failed?undefined:"img"} aria-label={failed?undefined:seats[index]?.alt} data-media-seat-id={failed?undefined:seats[index]?.seatId} data-media-key={failed?undefined:seats[index]?.key} data-media-kind={failed?undefined:"system-ui"} key={surface.id}>{failed&&seats[index]?<><FailedMedia asset={seats[index]} label={model.announcements.error}/><ActionSet model={model} ownerId={surface.id} onOpen={onOpen}/></>:<SystemSurface surface={surface} model={model} onOpen={onOpen}/>}</div>;})}</div>;
}

function KineticSelfie({ model }: OwnerProperties) {
  const seat=model.media[0];
  return <figure className="xp-about__kinetic-selfie" data-kinetic-selfie>
    <div className="xp-about__kinetic-decor xp-about__kinetic-decor--start" aria-hidden="true">{Array.from({length:3},(_,index)=><span key={index}/>)}</div>
    <MediaView asset={seat?model.mediaBySeatId.get(seat.id):undefined} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model}/>
    <div className="xp-about__kinetic-decor xp-about__kinetic-decor--end" aria-hidden="true">{Array.from({length:3},(_,index)=><span key={index}/>)}</div>
  </figure>;
}

export function StorySplit({ model }: OwnerProperties) {
  const overlay=useActionOverlay(model);
  const extension=model.extension;
  const remainingFeatures=unprojectedFeatures(model);
  const remainingMetricIds=unprojectedMetricIds(model);
  const storyBody=useRef<HTMLDivElement>(null);
  return <Root model={model} kind="story-split"><div className="xp-about__story-layout"><Intro model={model} onOpen={overlay.onOpen}/><div className="xp-about__story-body" ref={storyBody}>
    {extension.kind==="tabbed-principles"?<TabbedStory model={model} onOpen={overlay.onOpen}/>:null}
    {extension.kind==="group-pager"?<GroupPager model={model} onOpen={overlay.onOpen}/>:null}
    {extension.kind==="system-ui"?<>{model.preset==="ratings-metrics"?<ReliabilityProof model={model} onOpen={overlay.onOpen}/>:<SystemWorkspace model={model} onOpen={overlay.onOpen}/>} {model.preset==="ratings-metrics"?<IdentityMedia model={model} ids={model.identities.filter(({mediaSeatId})=>model.mediaBySeatId.get(mediaSeatId)?.kind==="vector").map(({id})=>id)}/>:null}{model.panels.map((panel)=><Panel panel={panel} model={model} onOpen={overlay.onOpen} key={panel.id}/>)}</>:null}
    {extension.kind==="portrait-field"?<IdentityMedia model={model} ids={extension.identityIds}/>:null}
    {extension.kind==="profile-toolkit"?<><IdentityMedia model={model} ids={[extension.profileIdentityId]}/><div className="xp-about__profile-signature"><IdentityMedia model={model} ids={model.identities.filter(({id})=>id!==extension.profileIdentityId&&!extension.toolIdentityIds.includes(id)).map(({id})=>id)}/></div><FeatureCollection model={model} onOpen={overlay.onOpen}/><IdentityMedia model={model} ids={extension.toolIdentityIds}/></>:null}
    {extension.kind==="manual-story-rail"?<FeatureCollection model={model} features={extension.itemIds.map((id)=>model.features.find((feature)=>feature.id===id)).filter(Boolean) as StoryFeature[]} rail onOpen={overlay.onOpen}/>:null}
    {extension.kind==="none"?model.preset==="kinetic-selfie"?<KineticSelfie model={model}/>:<><IdentityMedia model={model} ids={unprojectedIdentityIds(model)}/>{model.panels.map((panel)=><Panel panel={panel} model={model} onOpen={overlay.onOpen} key={panel.id}/>)}<FeatureCollection model={model} features={remainingFeatures} rail={remainingFeatures.length>3} onOpen={overlay.onOpen}/><Metrics model={model} ids={remainingMetricIds}/></>:null}
    {extension.kind!=="group-pager"?<CollectionControls model={model} host={storyBody}/>:null}
  </div></div>{model.actions.some(({kind})=>kind!=="navigate")?<DetailOverlay model={model} state={overlay}>{extension.kind==="system-ui"?(model.preset==="ratings-metrics"?<ReliabilityProof model={model}/>:<SystemWorkspace model={model}/>):undefined}</DetailOverlay>:null}</Root>;
}

export function MockShowcase({ model }: OwnerProperties) {
  const overlay=useActionOverlay(model);
  const system=model.extension.kind==="system-ui";
  const community=model.extension.kind==="community-proof";
  const dialogues=model.preset==="paired-product-dialogues";
  const remaining=new Set(unprojectedIdentityIds(model));
  const remainingTags=unprojectedTags(model);
  const nonSystemIdentities=model.identities.filter(({id,mediaSeatId})=>remaining.has(id)&&model.mediaBySeatId.get(mediaSeatId)?.kind!=="system-ui").map(({id})=>id);
  const communityAsset=community?[...model.mediaBySeatId.values()].find(({kind})=>kind==="system-ui"):undefined;
  const overlayViewId=model.extension.kind==="system-ui"?(overlay.action?.targetId??(model.activeStress?.startsWith("secondMock")?model.extension.views[1]?.id:undefined)):undefined;
  return <Root model={model} kind="mock-showcase"><Intro model={model} onOpen={overlay.onOpen}/>{dialogues?<ProductDialogues model={model} onOpen={overlay.onOpen}/>:<div className="xp-about__showcase"><div className="xp-about__showcase-stage">{system?<SystemWorkspace model={model} onOpen={overlay.onOpen}/>:community?<MediaView asset={communityAsset} errorLabel={model.activeStress==="error"?model.announcements.error:undefined} model={model}/>:<IdentityMedia model={model}/>}</div><aside>{nonSystemIdentities.length?<IdentityMedia model={model} ids={nonSystemIdentities}/>:null}<FeatureCollection model={model} onOpen={overlay.onOpen}/><Metrics model={model}/>{remainingTags.length?<div className="xp-about__tags">{remainingTags.map((tag)=><span data-tag-id={tag.id} key={tag.id}>{tag.label}</span>)}</div>:null}</aside></div>}{model.actions.some(({kind})=>kind!=="navigate")?<DetailOverlay model={model} state={overlay}>{system?<SystemWorkspace model={model} forcedViewId={overlayViewId}/>:undefined}</DetailOverlay>:null}</Root>;
}

export function AboutUsSurface({ fixture, media, stress, className }: AboutUsSurfaceProperties) {
  const model=useMemo(()=>resolveAboutUsFixture(fixture,stress,media),[fixture,media,stress]);
  const surface=model.owner==="ProofBand"?<ProofBand model={model}/>:model.owner==="StorySplit"?<StorySplit model={model}/>:model.owner==="MockShowcase"?<MockShowcase model={model}/>:model.owner==="BentoGrid"?<BentoGrid model={model}/>:<AboutCapabilityDeck model={model}/>;
  return className?<div className={className}>{surface}</div>:surface;
}
