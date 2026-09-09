"use client";

import { AdaptiveOverlay, SnapRail, useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ResolvedShowcaseFixture,
  ShowcaseAction,
  ShowcaseFeature,
  ShowcaseFixture,
  ShowcaseMediaRecord,
  ShowcaseProject,
  ShowcaseVisualRef,
} from "./showcase-model";
import { resolveShowcaseFixture } from "./showcase-model";

export type ShowcaseActionEvent = { action: ShowcaseAction; ownerId: string };
export type ShowcaseActionHandler = (event: ShowcaseActionEvent) => void;

const compactDevice = (device: ReturnType<typeof useDeviceClass>) => device === "M" || device === "TP";

function actionFor(model: ResolvedShowcaseFixture, id: string) {
  const action = model.actions.find((candidate)=>candidate.id===id);
  if (!action) throw new Error(`${model.sourceKey} cannot render missing action ${id}.`);
  return action;
}

function ShowcaseActionControl({ model, id, ownerId, onAction }: {
  model: ResolvedShowcaseFixture;
  id: string;
  ownerId?: string;
  onAction?: ShowcaseActionHandler;
}) {
  const action=actionFor(model,id);
  return <a className="xp-showcase__action" data-action-id={id} data-action-owner={ownerId??action.ownerId} data-emphasis={action.emphasis} data-xp-control href={action.href} onClick={()=>onAction?.({action,ownerId:ownerId??action.ownerId})}>{action.label}</a>;
}

function mediaFor(model: ResolvedShowcaseFixture, seatId: string) {
  const resolved=model.mediaBySeatId.get(seatId);
  if (!resolved) throw new Error(`${model.sourceKey} cannot render missing media ${seatId}.`);
  return resolved;
}

function SystemProof({ visual }: { visual: ShowcaseVisualRef }) {
  if (visual.role === "system-icon") return <span className="xp-showcase-media__icon" data-system-icon-key={visual.systemIconKey} aria-hidden="true">{visual.systemIconKey.split("-").map((word)=>word[0]).join("").slice(0,2).toUpperCase()}</span>;
  if (visual.role !== "system-ui") return null;
  return <div className="xp-showcase-media__system" role="img" aria-label={visual.alt}><span /><span /><span /><strong>{visual.surfaceId.replaceAll("-"," ")}</strong><i /><i /></div>;
}

function ShowcaseMedia({ model, seatId, interactive=false, onSelect }: {
  model: ResolvedShowcaseFixture;
  seatId: string;
  interactive?: boolean;
  onSelect?: (seatId: string, trigger: HTMLButtonElement) => void;
}) {
  const {seat,media}=mediaFor(model,seatId);
  let content: ReactNode;
  if (seat.role === "system-ui" || seat.role === "system-icon") content=<SystemProof visual={seat}/>;
  else {
    const image=<img src={media.src} alt={seat.alt} data-media-asset-id={media.assetId}/>;
    content=media.darkSrc?<picture><source media="(prefers-color-scheme: dark)" srcSet={media.darkSrc}/>{image}</picture>:image;
  }
  const figure=<figure className="xp-showcase-media" data-media-role={seat.role} data-media-seat-id={seat.id}>{content}</figure>;
  if (!interactive) return figure;
  return <AdaptiveOverlay.Trigger className="xp-showcase-media__trigger" aria-label={`${model.copy.openMedia}: ${seat.alt}`} onClick={(event)=>onSelect?.(seatId,event.currentTarget)}>{figure}</AdaptiveOverlay.Trigger>;
}

function Meta({ project }: { project: ShowcaseProject }) {
  if (!project.meta.length && !project.tags.length) return null;
  return <div className="xp-showcase-card__meta">
    {project.meta.map((item)=><span key={item.id}><small>{item.label}</small><strong>{item.value}</strong></span>)}
    {project.tags.map((tag)=><em key={tag.id}>{tag.label}</em>)}
  </div>;
}

function ProjectCard({ model, project, featured=false, active=false, weight, mediaInteractive=false, onMediaSelect, onAction }: {
  model: ResolvedShowcaseFixture;
  project: ShowcaseProject;
  featured?: boolean;
  active?: boolean;
  weight?: "standard" | "wide" | "tall" | "feature";
  mediaInteractive?: boolean;
  onMediaSelect?: (seatId: string, trigger: HTMLButtonElement)=>void;
  onAction?: ShowcaseActionHandler;
}) {
  return <article className="xp-showcase-card" data-project-id={project.id} data-featured={featured||undefined} data-active={active||undefined} data-weight={weight} aria-current={active?"true":undefined}>
    {project.mediaSeatIds[0]?<ShowcaseMedia model={model} seatId={project.mediaSeatIds[0]} interactive={mediaInteractive} onSelect={onMediaSelect}/>:null}
    {project.mediaSeatIds.length>1?<div className="xp-showcase-card__supporting-media">{project.mediaSeatIds.slice(1).map((seatId)=><ShowcaseMedia model={model} seatId={seatId} key={seatId}/>)}</div>:null}
    <div className="xp-showcase-card__copy">
      <h2>{project.title}</h2>
      {project.summary?<p>{project.summary}</p>:null}
      <Meta project={project}/>
      {project.actionIds.length?<div className="xp-showcase-card__actions">{project.actionIds.filter((id)=>actionFor(model,id).kind!=="open-tool").map((id)=><ShowcaseActionControl key={id} model={model} id={id} ownerId={project.id} onAction={onAction}/>)}</div>:null}
    </div>
  </article>;
}

function ProjectRail({ model, projects, activeProjectId, onSelect, onMediaSelect, onAction }: {
  model:ResolvedShowcaseFixture;
  projects:ShowcaseProject[];
  activeProjectId?:string;
  onSelect?:(id:string)=>void;
  onMediaSelect?:(id:string,trigger:HTMLButtonElement)=>void;
  onAction?:ShowcaseActionHandler;
}) {
  const host=useRef<HTMLDivElement>(null);
  const activeIndex=Math.max(0,projects.findIndex(({id})=>id===activeProjectId));
  useEffect(()=>{
    const item=host.current?.querySelectorAll<HTMLElement>("[data-xp-rail-item]")[activeIndex];
    const viewport=host.current?.querySelector<HTMLElement>("[data-xp-rail]");
    if(!item||!viewport)return;
    const left=item.offsetLeft-viewport.offsetLeft;
    viewport.scrollTo({left,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  },[activeIndex]);
  const select=(index:number)=>{const project=projects[index];if(project)onSelect?.(project.id)};
  return <div className="xp-showcase-project-rail" ref={host} data-active-project-id={projects[activeIndex]?.id}>
    <div className="xp-showcase-project-rail__controls" aria-label={model.copy.resultCount}>
      <button type="button" data-xp-control disabled={activeIndex===0} aria-label={model.copy.previousProject} onClick={()=>select(activeIndex-1)}>←</button>
      <span>{activeIndex+1} / {projects.length}</span>
      <button type="button" data-xp-control disabled={activeIndex===projects.length-1} aria-label={model.copy.nextProject} onClick={()=>select(activeIndex+1)}>→</button>
    </div>
    <SnapRail className="xp-showcase-rail" label={model.intro.title} paginationLabel={model.copy.resultCount} markerLabel={(index)=>`${model.copy.resultCount} ${index}`} peek="12%">
      {projects.map((project)=><SnapRail.Item key={project.id} data-active={project.id===activeProjectId||undefined}><ProjectCard model={model} project={project} active={project.id===activeProjectId} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/></SnapRail.Item>)}
    </SnapRail>
  </div>;
}

function CompactCollection({model,projects,activeProjectId,gridEnabled,gridOpen,onGridChange,onSelect,onMediaSelect,onAction}:{model:ResolvedShowcaseFixture;projects:ShowcaseProject[];activeProjectId?:string;gridEnabled:boolean;gridOpen:boolean;onGridChange:(open:boolean,trigger?:HTMLButtonElement)=>void;onSelect:(id:string)=>void;onMediaSelect:(id:string,trigger:HTMLButtonElement)=>void;onAction?:ShowcaseActionHandler}) {
  if(!gridEnabled) return <ProjectRail model={model} projects={projects} activeProjectId={activeProjectId} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>;
  return <div className="xp-showcase-compact-collection" data-grid-open={gridOpen||undefined}>
    <AdaptiveOverlay.Trigger className="xp-showcase-compact-collection__toggle" data-xp-control data-grid-toggle aria-expanded={gridOpen} onClick={(event)=>onGridChange(true,event.currentTarget)}>{model.copy.openGrid}</AdaptiveOverlay.Trigger>
    {!gridOpen?<ProjectRail model={model} projects={projects} activeProjectId={activeProjectId} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>:null}
    {gridOpen?<AdaptiveOverlay.Content className="xp-showcase-grid-overlay"><AdaptiveOverlay.Header title={model.copy.openGrid} closeLabel={model.copy.closeGrid}/><AdaptiveOverlay.Body><div className="xp-showcase-grid-sheet">{projects.map((project)=><ProjectCard key={project.id} model={model} project={project} active={project.id===activeProjectId} onAction={onAction}/>)}</div></AdaptiveOverlay.Body></AdaptiveOverlay.Content>:null}
  </div>;
}

function FeatureList({ model, features }: { model:ResolvedShowcaseFixture; features:ShowcaseFeature[] }) {
  return <div className="xp-showcase-features">{features.map((feature)=><article key={feature.id} data-feature-id={feature.id}>
    {feature.systemIconSeatId?<ShowcaseMedia model={model} seatId={feature.systemIconSeatId}/>:null}
    <div><h3>{feature.title}</h3><p>{feature.description}</p></div>
  </article>)}</div>;
}

function Filters({ model, activeId, onChange }: { model:ResolvedShowcaseFixture; activeId?:string; onChange:(id:string)=>void }) {
  const extension=model.extension;
  const taxonomy=extension.kind==="wall"||extension.kind==="rail"||extension.kind==="case"?extension.taxonomy:undefined;
  if (!taxonomy) return null;
  const move=(event:React.KeyboardEvent<HTMLButtonElement>,index:number)=>{
    const delta=event.key==="ArrowRight"||event.key==="ArrowDown"?1:event.key==="ArrowLeft"||event.key==="ArrowUp"?-1:0;
    if(!delta)return;
    event.preventDefault();
    const next=(index+delta+taxonomy.categories.length)%taxonomy.categories.length;
    onChange(taxonomy.categories[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  };
  return <div className="xp-showcase-filters" role="radiogroup" aria-label={model.copy.resultCount}>
    {taxonomy.categories.map((category,index)=><button type="button" role="radio" aria-checked={activeId===category.id} tabIndex={activeId===category.id?0:-1} data-xp-control key={category.id} onClick={()=>onChange(category.id)} onKeyDown={(event)=>move(event,index)}>{category.label}</button>)}
  </div>;
}

function projectSet(model:ResolvedShowcaseFixture, activeCategoryId?:string) {
  const extension=model.extension;
  const taxonomy=extension.kind==="wall"||extension.kind==="rail"||extension.kind==="case"?extension.taxonomy:undefined;
  if (!taxonomy||!activeCategoryId||activeCategoryId===taxonomy.allCategoryId) return model.projects;
  return model.projects.filter((project)=>project.categoryIds.includes(activeCategoryId));
}

function Wall({model,projects,compact,activeProjectId,gridOpen,onGridChange,onSelect,onMediaSelect,onAction}:{model:ResolvedShowcaseFixture;projects:ShowcaseProject[];compact:boolean;activeProjectId?:string;gridOpen:boolean;onGridChange:(open:boolean,trigger?:HTMLButtonElement)=>void;onSelect:(id:string)=>void;onMediaSelect:(id:string,trigger:HTMLButtonElement)=>void;onAction?:ShowcaseActionHandler}) {
  if (compact) return <CompactCollection model={model} projects={projects} activeProjectId={activeProjectId} gridEnabled={model.extension.kind==="wall"&&model.extension.compactPresentation==="bounded-grid-sheet"} gridOpen={gridOpen} onGridChange={onGridChange} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>;
  if(model.extension.kind!=="wall")return null;
  const extension=model.extension;
  return <div className="xp-showcase-wall" data-columns={extension.wideColumns}>{projects.map((project)=><ProjectCard key={project.id} model={model} project={project} active={project.id===activeProjectId} weight={extension.weightByProjectId?.[project.id]} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/>)}</div>;
}

function Case({model,projects,compact,activeProjectId,activeGallerySeatId,gridOpen,onGridChange,onSelect,onGallerySelect,onMediaSelect,onAction}:{model:ResolvedShowcaseFixture;projects:ShowcaseProject[];compact:boolean;activeProjectId?:string;activeGallerySeatId?:string;gridOpen:boolean;onGridChange:(open:boolean,trigger?:HTMLButtonElement)=>void;onSelect:(id:string)=>void;onGallerySelect:(id:string)=>void;onMediaSelect:(id:string,trigger:HTMLButtonElement)=>void;onAction?:ShowcaseActionHandler}) {
  if (projects.length>1&&compact) return <CompactCollection model={model} projects={projects} activeProjectId={activeProjectId} gridEnabled={model.extension.kind==="case"&&model.extension.presentation==="category-browser"} gridOpen={gridOpen} onGridChange={onGridChange} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>;
  if (model.extension.kind==="case"&&model.extension.presentation==="gallery-detail"&&projects[0]) {
    const project=projects[0];
    const selectedSeatId=project.mediaSeatIds.includes(activeGallerySeatId??"")?activeGallerySeatId!:project.mediaSeatIds[0];
    return <div className="xp-showcase-case xp-showcase-case--gallery">
      <div className="xp-showcase-case__gallery"><ShowcaseMedia model={model} seatId={selectedSeatId} interactive onSelect={onMediaSelect}/><div className="xp-showcase-case__thumbs" aria-label={model.intro.title}>{project.mediaSeatIds.map((id)=><button type="button" data-xp-control data-gallery-seat-id={id} aria-pressed={id===selectedSeatId} aria-label={mediaFor(model,id).seat.alt} onClick={()=>onGallerySelect(id)} key={id}><ShowcaseMedia model={model} seatId={id}/></button>)}</div></div>
      <div className="xp-showcase-case__detail"><ProjectCard model={model} project={{...project,mediaSeatIds:[]}} onAction={onAction}/><dl>{model.facts.map((fact)=><div key={fact.id}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl></div>
    </div>;
  }
  return <div className="xp-showcase-case">{projects.map((project)=><ProjectCard key={project.id} model={model} project={project} active={project.id===activeProjectId} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/>)}</div>;
}

function Capability({model,compact,activeProjectId,onSelect,onMediaSelect,onAction}:{model:ResolvedShowcaseFixture;compact:boolean;activeProjectId?:string;onSelect:(id:string)=>void;onMediaSelect:(id:string,trigger:HTMLButtonElement)=>void;onAction?:ShowcaseActionHandler}) {
  return <div className="xp-showcase-capability"><FeatureList model={model} features={model.features}/>{compact?<ProjectRail model={model} projects={model.projects} activeProjectId={activeProjectId} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>:<div className="xp-showcase-capability__proof">{model.projects.map((project)=><ProjectCard key={project.id} model={model} project={project} active={project.id===activeProjectId} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/>)}</div>}</div>;
}

function Featured({model,compact,activeProjectId,onSelect,onMediaSelect,onAction}:{model:ResolvedShowcaseFixture;compact:boolean;activeProjectId?:string;onSelect:(id:string)=>void;onMediaSelect:(id:string,trigger:HTMLButtonElement)=>void;onAction?:ShowcaseActionHandler}) {
  if(model.extension.kind!=="featured") return null;
  const extension=model.extension;
  const featured=model.projects.find(({id})=>id===extension.featuredProjectId)!;
  const related=extension.relatedProjectIds.map((id)=>model.projects.find((project)=>project.id===id)!);
  return <div className="xp-showcase-featured"><ProjectCard model={model} project={featured} featured active={featured.id===activeProjectId} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/><FeatureList model={model} features={model.features}/>{compact?<ProjectRail model={model} projects={related} activeProjectId={activeProjectId} onSelect={onSelect} onMediaSelect={onMediaSelect} onAction={onAction}/>:<div className="xp-showcase-featured__related">{related.map((project)=><ProjectCard key={project.id} model={model} project={project} active={project.id===activeProjectId} mediaInteractive onMediaSelect={onMediaSelect} onAction={onAction}/>)}</div>}</div>;
}

function Accordion({model,expandedId,onExpand,revealed,onReveal,onAction}:{model:ResolvedShowcaseFixture;expandedId?:string;onExpand:(id?:string)=>void;revealed:boolean;onReveal:()=>void;onAction?:ShowcaseActionHandler}) {
  if(model.extension.kind!=="accordion") return null;
  const host=useRef<HTMLDivElement>(null);
  const ids=revealed?[...model.extension.initialProjectIds,...model.extension.deferredProjectIds]:model.extension.initialProjectIds;
  const escape=(event:React.KeyboardEvent<HTMLDivElement>)=>{if(event.key!=="Escape"||!expandedId)return;event.preventDefault();onExpand(undefined);host.current?.querySelector<HTMLElement>(`[data-project-id="${expandedId}"]>button`)?.focus()};
  return <div className="xp-showcase-accordion" ref={host} onKeyDown={escape}>{ids.map((id)=>{const project=model.projects.find((item)=>item.id===id)!;const open=expandedId===id;return <article key={id} data-project-id={id} data-expanded={open||undefined}>
    <button type="button" data-xp-control aria-expanded={open} aria-controls={`${id}-panel`} onClick={()=>onExpand(open?undefined:id)}>{project.mediaSeatIds[0]?<ShowcaseMedia model={model} seatId={project.mediaSeatIds[0]}/>:null}<span><strong>{project.title}</strong>{project.summary?<small>{project.summary}</small>:null}</span><span aria-hidden="true">{open?"−":"+"}</span></button>
    {open?<div id={`${id}-panel`} className="xp-showcase-accordion__panel"><div className="xp-showcase-accordion__marks">{project.mediaSeatIds.slice(1).map((seatId)=><ShowcaseMedia model={model} seatId={seatId} key={seatId}/>)}</div><Meta project={project}/>{project.detail?.body.map((line,index)=><p key={index}>{line}</p>)}<FeatureList model={model} features={(project.detail?.featureIds??[]).map((featureId)=>model.features.find(({id})=>id===featureId)!)} /><div className="xp-showcase-card__actions">{project.detail?.toolActionIds.map((actionId)=><ShowcaseActionControl key={actionId} model={model} id={actionId} ownerId={project.id} onAction={onAction}/>)}</div></div>:null}
  </article>})}<button className="xp-showcase-accordion__reveal" type="button" data-xp-control onClick={onReveal}>{revealed?model.extension.concealLabel:model.extension.revealLabel}</button></div>;
}

function ShowcaseResolved({ model, onAction }: { model:ResolvedShowcaseFixture; onAction?:ShowcaseActionHandler }) {
  const device=useDeviceClass();
  const lastOverlayTriggerRef=useRef<HTMLButtonElement>(null);
  const hadOverlayOpenRef=useRef(false);
  const compact=compactDevice(device);
  const taxonomy=model.extension.kind==="wall"||model.extension.kind==="rail"||model.extension.kind==="case"?model.extension.taxonomy:undefined;
  const [activeCategoryId,setActiveCategoryId]=useState(model.state.activeCategoryId??taxonomy?.initialCategoryId);
  const [activeProjectId,setActiveProjectId]=useState(model.state.activeProjectId??(model.extension.kind==="rail"?model.extension.initialProjectId:model.projects[0]?.id));
  const [activeGallerySeatId,setActiveGallerySeatId]=useState(model.projects[0]?.mediaSeatIds[0]);
  const [gridOpen,setGridOpen]=useState(false);
  const [expandedId,setExpandedId]=useState(model.state.expandedProjectId??(model.extension.kind==="accordion"?model.extension.defaultExpandedProjectId:undefined));
  const [revealed,setRevealed]=useState(Boolean(model.state.revealedProjectIds?.length));
  const [overlayOpen,setOverlayOpen]=useState(Boolean(model.state.openMediaSeatId));
  const [openSeatId,setOpenSeatId]=useState(model.state.openMediaSeatId);
  useEffect(()=>{
    if(overlayOpen||gridOpen){hadOverlayOpenRef.current=true;return;}
    if(!hadOverlayOpenRef.current)return;
    hadOverlayOpenRef.current=false;
    const returnFocus=[50,250,500,750].map((delay)=>window.setTimeout(()=>lastOverlayTriggerRef.current?.focus(),delay));
    return()=>returnFocus.forEach((timer)=>window.clearTimeout(timer));
  },[gridOpen,overlayOpen]);
  const projects=useMemo(()=>projectSet(model,activeCategoryId),[model,activeCategoryId]);
  const projectMediaIds=new Set(model.projects.flatMap(({mediaSeatIds})=>mediaSeatIds));
  const featureMediaIds=new Set(model.features.flatMap(({systemIconSeatId})=>systemIconSeatId?[systemIconSeatId]:[]));
  const ambientVisuals=model.visuals.filter(({id})=>!projectMediaIds.has(id)&&!featureMediaIds.has(id));
  const openMedia=(id:string,trigger:HTMLButtonElement)=>{lastOverlayTriggerRef.current=trigger;setOpenSeatId(id);setOverlayOpen(true)};
  const changeGrid=(open:boolean,trigger?:HTMLButtonElement)=>{if(open&&trigger)lastOverlayTriggerRef.current=trigger;setGridOpen(open)};
  const changeCategory=(id:string)=>{setActiveCategoryId(id);setGridOpen(false);const next=projectSet(model,id)[0];if(next)setActiveProjectId(next.id)};
  let content:ReactNode;
  if(model.extension.kind==="wall") content=<Wall model={model} projects={projects} compact={compact} activeProjectId={activeProjectId} gridOpen={gridOpen} onGridChange={changeGrid} onSelect={setActiveProjectId} onMediaSelect={openMedia} onAction={onAction}/>;
  else if(model.extension.kind==="rail") content=<ProjectRail model={model} projects={projects} activeProjectId={activeProjectId} onSelect={setActiveProjectId} onMediaSelect={openMedia} onAction={onAction}/>;
  else if(model.extension.kind==="case") content=<Case model={model} projects={projects} compact={compact} activeProjectId={activeProjectId} activeGallerySeatId={activeGallerySeatId} gridOpen={gridOpen} onGridChange={changeGrid} onSelect={setActiveProjectId} onGallerySelect={setActiveGallerySeatId} onMediaSelect={openMedia} onAction={onAction}/>;
  else if(model.extension.kind==="capability") content=<Capability model={model} compact={compact} activeProjectId={activeProjectId} onSelect={setActiveProjectId} onMediaSelect={openMedia} onAction={onAction}/>;
  else if(model.extension.kind==="featured") content=<Featured model={model} compact={compact} activeProjectId={activeProjectId} onSelect={setActiveProjectId} onMediaSelect={openMedia} onAction={onAction}/>;
  else content=<Accordion model={model} expandedId={expandedId} onExpand={setExpandedId} revealed={revealed} onReveal={()=>setRevealed((value)=>!value)} onAction={onAction}/>;

  const selectedSeat=openSeatId?mediaFor(model,openSeatId).seat:undefined;
  return <AdaptiveOverlay intent="detail" open={overlayOpen||gridOpen} onOpenChange={(open)=>{if(!open){setOverlayOpen(false);setGridOpen(false)}}}>
    <section className="xp-showcase" data-xp-block="showcase" data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.extension.kind} data-device-class={device} data-stress={model.activeStress}>
      <header className="xp-showcase__header"><div>{model.intro.eyebrow?<p className="xp-showcase__eyebrow">{model.intro.eyebrow}</p>:null}<h1>{model.intro.title}</h1>{model.intro.description?.map((line,index)=><p key={index}>{line}</p>)}</div>{model.intro.actionIds.length?<div className="xp-showcase__intro-actions">{model.intro.actionIds.map((id)=><ShowcaseActionControl key={id} model={model} id={id} ownerId="intro" onAction={onAction}/>)}</div>:null}</header>
      {ambientVisuals.length?<aside className="xp-showcase__ambient" data-ambient-count={ambientVisuals.length}>{ambientVisuals.map((visual)=><ShowcaseMedia model={model} seatId={visual.id} key={visual.id}/>)}{model.actions.filter(({ownerId})=>ownerId==="contact").map(({id})=><ShowcaseActionControl model={model} id={id} ownerId="contact" onAction={onAction} key={id}/>)}</aside>:null}
      <Filters model={model} activeId={activeCategoryId} onChange={changeCategory}/>
      <p className="xp-showcase__result" aria-live="polite">{model.copy.resultCount.replace("{count}",String(projects.length))}</p>
      <div className="xp-showcase__body">{content}</div>
    </section>
    {selectedSeat?<AdaptiveOverlay.Content className="xp-showcase-overlay"><AdaptiveOverlay.Header title={selectedSeat.alt} closeLabel={model.copy.closeMedia}/><AdaptiveOverlay.Body><ShowcaseMedia model={model} seatId={selectedSeat.id}/></AdaptiveOverlay.Body></AdaptiveOverlay.Content>:null}
  </AdaptiveOverlay>;
}

export type ShowcaseProperties = {
  fixture: ShowcaseFixture;
  media: ShowcaseMediaRecord[];
  stress?: string;
  onAction?: ShowcaseActionHandler;
  className?: string;
};

export function Showcase({ fixture, media, stress, onAction, className }: ShowcaseProperties) {
  const model=useMemo(()=>resolveShowcaseFixture(fixture,stress,media),[fixture,media,stress]);
  const surface=<ShowcaseResolved model={model} onAction={onAction}/>;
  return className?<div className={className}>{surface}</div>:surface;
}
