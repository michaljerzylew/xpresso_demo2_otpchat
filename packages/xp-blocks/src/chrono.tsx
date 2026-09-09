"use client";

import { MorphSlot, SnapRail } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  resolveChronoFixture,
  type CareerEvent,
  type ChangelogFixture,
  type ChronoCodeProof,
  type ChronoDeviceForm,
  type ChronoFixture,
  type ChronoMediaRef,
  type ChronoStressKey,
  type HistoryEvent,
  type HistorySupport,
  type ProcessEvent,
  type ReleaseEvent,
  type ResolvedChronoFixture,
  type TimelineMediaMap,
  type TrackingFixture,
} from "./chrono-model";

export const CHRONO_FORM_LADDER = { M:"M",TP:"TP",TL:"TL",DS:"DS",DW:"DW" } as const;

export type ChronoProperties = { fixture:ChronoFixture;mediaMap:TimelineMediaMap;stress?:ChronoStressKey;className?:string };
type ChronoView = {
  model:ResolvedChronoFixture;saved:boolean;setSaved:(value:boolean)=>void;activeEventId?:string;selectEvent:(id:string)=>void;
  openEventId?:string;setOpenEventId:(id:string|undefined)=>void;paused:boolean;setPaused:(value:boolean)=>void;
  activeReleaseId?:string;openReleaseId?:string|null;selectRelease:(id:string)=>void;toggleRelease:(id:string)=>void;
  openGroupIds:Set<string>;toggleGroup:(id:string)=>void;copyState:"idle"|"success"|"error";copyProof:(proof:ChronoCodeProof)=>void;
  announcement:string;setInteractionSuspended:(value:boolean)=>void;ownerRef:React.RefObject<HTMLElement|null>;
};

const ICONS:Record<string,string>={
  "icon-terrain":"M4 17 9 9l3 4 3-6 5 10M4 20h16",
  "icon-canopy":"M12 20v-7M7 13c-2-4 1-8 5-8 4 0 7 4 5 8H7Z",
  "icon-survey":"M5 19 9 6l4 13M7 13h8M16 5l3 14",
  "icon-mount":"M6 5h12v8H6V5Zm3 8v6m6-6v6M5 19h14",
  "icon-link":"M9 15 7 17a3 3 0 0 1-4-4l3-3a3 3 0 0 1 4 0m5-1 2-2a3 3 0 0 1 4 4l-3 3a3 3 0 0 1-4 0m-5-2h6",
  "icon-check":"m5 12 4 4L19 6",
};

function Glyph({name}:{name:string}){return <svg className="xp-chrono__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[name]??"M6 12h12M12 6v12"}/></svg>}

function MediaSeat({model,seat}:{model:ResolvedChronoFixture;seat:ChronoMediaRef}){
  const media=model.mediaById.get(seat.id);if(!media)return null;
  if(media.status!=="resolved")return <div className="xp-chrono__media-fallback" data-media-seat-id={seat.id} data-media-status={media.status} data-media-role={seat.role} data-media-aspect={seat.aspect} role="img" aria-label={`${seat.alt}. ${media.status==="hold"?"Original media pending":"Media unavailable"}.`}><span aria-hidden="true">◇</span><strong>{media.status==="hold"?"Original media pending":"Media unavailable"}</strong><small>{seat.alt}</small></div>;
  if(media.src)return <div className="xp-chrono__vector" data-media-seat-id={seat.id} data-media-status="resolved" data-media-role={seat.role} data-media-aspect={seat.aspect} role="img" aria-label={seat.alt} style={{"--xp-chrono-vector":`url("${media.src}")`} as CSSProperties}/>
  return <picture className="xp-chrono__picture" data-media-seat-id={seat.id} data-media-status="resolved" data-media-role={seat.role} data-media-aspect={seat.aspect}><source type="image/avif" srcSet={`${media.publicBase}.avif`}/><source type="image/webp" srcSet={`${media.publicBase}.webp`}/><img src={`${media.publicBase}.jpg`} alt={seat.alt} loading="lazy" decoding="async"/></picture>;
}

function mediaSeat(model:ResolvedChronoFixture,id:string){return model.media.find((seat)=>seat.id===id)}
function supportMediaIds(support:HistorySupport){return support.kind==="service-rows"?[]:support.mediaIds}

function HistorySupportView({model,support}:{model:ResolvedChronoFixture;support:HistorySupport}){
  if(support.kind==="service-rows")return <div className="xp-chrono__services">{support.rows.map((row)=><div key={row.id} data-support-row-id={row.id}><Glyph name={row.iconKey}/><span><strong>{row.name}</strong><small>{row.description}</small></span></div>)}</div>;
  if(support.kind==="photo-strip")return <SnapRail label="Historical workplace photographs" paginationLabel="Photograph positions" markerLabel={(index)=>`Go to photograph ${index}`} markers="none">{support.mediaIds.map((id)=>{const seat=mediaSeat(model,id);return seat?<SnapRail.Item key={id}><MediaSeat model={model} seat={seat}/></SnapRail.Item>:null})}</SnapRail>;
  if(support.kind==="avatar-group")return <div className="xp-chrono__avatar-group">{support.mediaIds.map((id,index)=>{const seat=mediaSeat(model,id);return seat?<div key={id}><MediaSeat model={model} seat={seat}/><strong>{support.names[index]}</strong><small>{support.roles[index]}</small></div>:null})}</div>;
  return <div className="xp-chrono__paired-media">{support.mediaIds.map((id,index)=>{const seat=mediaSeat(model,id);return seat?<div key={id}><MediaSeat model={model} seat={seat}/><strong>{support.labels[index]}</strong></div>:null})}</div>;
}

function TrackingForm({view,form}:{view:ChronoView;form:ChronoDeviceForm}){
  const model=view.model as ResolvedChronoFixture&TrackingFixture;const save=model.actions.find(({intent})=>intent==="toggle-save")!;const details=model.actions.find(({intent})=>intent==="navigate-details")!;const seat=mediaSeat(model,model.order.mediaId)!;
  return <div className="xp-chrono__tracking" data-native-form={form}>
    <article className="xp-chrono__order-summary"><MediaSeat model={model} seat={seat}/><div className="xp-chrono__order-copy"><span className="xp-chrono__verified">{model.order.verificationLabel}</span><small>{model.order.id}</small><h2>{model.order.productName}</h2><p>{model.order.productDescription}</p><p className="xp-chrono__price"><strong>{model.order.currentPrice}</strong>{model.order.priorPrice?<del>{model.order.priorPrice}</del>:null}{model.order.discountLabel?<span>{model.order.discountLabel}</span>:null}</p><strong className="xp-chrono__arrival">{model.order.arrivalHeading}</strong><div className="xp-chrono__actions"><button type="button" data-action-id={save.id} aria-pressed={view.saved} aria-label={view.saved?model.labels.unsave:model.labels.save} onClick={()=>view.setSaved(!view.saved)}>{view.saved?model.labels.unsave:save.label}</button><a data-action-id={details.id} href={details.href}>{details.label}</a></div></div></article>
    <ol className="xp-chrono__status-list" aria-label="Order progress">{model.events.map((event)=><li key={event.id} data-event-id={event.id} data-state={event.state} aria-current={event.state==="current"?"step":undefined}><span className="xp-chrono__status-marker" aria-hidden="true">{event.state==="complete"?"✓":event.state==="current"?"●":"○"}</span><div><strong>{event.title}</strong><small>{event.state==="complete"?model.labels.statusComplete:event.state==="current"?model.labels.statusCurrent:model.labels.statusPending}</small></div><time>{event.time}<span>{event.date}</span></time></li>)}</ol>
  </div>;
}

function HistoryRow({view,event,compact}:{view:ChronoView;event:HistoryEvent;compact:boolean}){
  const open=!compact||view.openEventId===event.id;const control=view.model.controls.find(({targetId})=>targetId===event.id);const held=supportMediaIds(event.support).filter((id)=>view.model.mediaById.get(id)?.status==="hold").length;
  return <li className="xp-chrono__history-row" data-event-id={event.id} data-open={open?"true":"false"} aria-current={view.model.initial.currentEventId===event.id?"true":undefined}><div className="xp-chrono__history-copy"><time>{event.date}</time>{compact?<button type="button" aria-expanded={open} aria-controls={`${event.id}-detail`} onClick={()=>view.setOpenEventId(open?undefined:event.id)}><span><strong>{event.title}</strong>{held?<small>{held} original media {held===1?"seat":"seats"} pending</small>:null}</span><span aria-hidden="true">{open?"−":"+"}</span></button>:<><h2>{event.title}</h2><p>{event.body}</p></>}</div><div id={`${event.id}-detail`} className="xp-chrono__history-detail" hidden={compact&&!open}>{compact?<p>{event.body}</p>:null}<div className="xp-chrono__history-support" data-support-kind={event.support.kind}><HistorySupportView model={view.model} support={event.support}/></div></div>{control?<span className="xp-chrono__sr-only" data-control-id={control.id}>{control.label}</span>:null}</li>;
}

function HistoryForm({view,form}:{view:ChronoView;form:ChronoDeviceForm}){const model=view.model as ResolvedChronoFixture&{events:HistoryEvent[]};const compact=form==="M"||form==="TP"||form==="TL";return <ol className="xp-chrono__history" data-native-form={form} data-history-density={compact?"compact":"full"}>{model.events.map((event)=><HistoryRow compact={compact} event={event} view={view} key={event.id}/>)}</ol>}

function axisKeyboard(event:KeyboardEvent<HTMLButtonElement>,view:ChronoView,events:Array<ProcessEvent|CareerEvent>,index:number){if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?events.length-1:Math.max(0,Math.min(events.length-1,index+(["ArrowRight","ArrowDown"].includes(event.key)?1:-1)));view.selectEvent(events[next].id);view.ownerRef.current?.querySelectorAll<HTMLButtonElement>("[data-axis-selector]")[next]?.focus()}

function AxisSelectors({view,events,form}:{view:ChronoView;events:Array<ProcessEvent|CareerEvent>;form:ChronoDeviceForm}){return <ol className="xp-chrono__axis-selectors" role="tablist" aria-label={view.model.intro.heading}>{events.map((event,index)=>{const selected=view.activeEventId===event.id;const control=view.model.controls.find(({targetId})=>targetId===event.id)!;return <li key={event.id} data-event-id={event.id}><button type="button" role="tab" id={`${event.id}-tab`} aria-selected={selected} aria-controls="xp-chrono-axis-detail" tabIndex={selected?0:-1} data-axis-selector data-control-id={control.id} onKeyDown={(keyEvent)=>axisKeyboard(keyEvent,view,events,index)} onClick={()=>view.selectEvent(event.id)}>{"iconKey" in event?<Glyph name={event.iconKey}/>:<span className="xp-chrono__axis-index">{String(index+1).padStart(2,"0")}</span>}<span><strong>{event.title}</strong><small>{"duration" in event?event.duration:event.date}</small></span></button></li>})}</ol>}

function ProcessDetail({view,event}:{view:ChronoView;event:ProcessEvent}){const progress=view.model.initial.progressOverrides[event.id]??event.targetProgress;return <article className="xp-chrono__axis-detail" id="xp-chrono-axis-detail" role="tabpanel" aria-labelledby={`${event.id}-tab`} data-active-event-id={event.id}><small>{event.duration}</small><h2>{event.title}</h2><p>{event.body}</p><div className="xp-chrono__progress"><span style={{"--xp-chrono-progress":`${progress}%`} as CSSProperties}/><strong>{progress}%</strong></div></article>}
function CareerDetail({view,event}:{view:ChronoView;event:CareerEvent}){const action=view.model.actions[0];return <article className="xp-chrono__axis-detail xp-chrono__career-detail" id="xp-chrono-axis-detail" role="tabpanel" aria-labelledby={`${event.id}-tab`} data-active-event-id={event.id}><div className="xp-chrono__career-meta"><span>{event.date}</span><span>{event.employmentType}</span><span>{event.period}</span></div><h2>{event.title}</h2><div className="xp-chrono__career-columns"><section><h3>Skills</h3><ul>{event.skills.map((skill)=><li key={skill}>{skill}</li>)}</ul></section><section><h3>Responsibilities</h3><ul>{event.responsibilities.map((item)=><li key={item}>{item}</li>)}</ul></section></div>{action?<a data-action-id={action.id} href={action.href} autoFocus={view.model.activeStress==="actionFocus"||undefined}>{action.label}<span aria-hidden="true"> →</span></a>:null}</article>}

function AxisForm({view,form}:{view:ChronoView;form:ChronoDeviceForm}){const process=view.model.sourceKey==="timeline-component-03";const events=view.model.events as Array<ProcessEvent|CareerEvent>;const active=events.find(({id})=>id===view.activeEventId)??events[0];const pauseControl=view.model.controls.find(({targetId})=>targetId==="pause-resume")!;return <div className="xp-chrono__axis" data-native-form={form} data-axis-orientation={form==="M"?"vertical":"horizontal"}><AxisSelectors events={events} form={form} view={view}/><div className="xp-chrono__axis-toolbar"><button type="button" data-control-id={pauseControl.id} aria-pressed={view.paused} onClick={()=>view.setPaused(!view.paused)}>{view.paused?view.model.labels.resume:view.model.labels.pause}</button><span aria-live="polite">{view.announcement}</span></div>{process?<ProcessDetail event={active as ProcessEvent} view={view}/>:<CareerDetail event={active as CareerEvent} view={view}/>}</div>}

function CodeProof({view,proof}:{view:ChronoView;proof:ChronoCodeProof}){const control=view.model.controls.find(({targetId})=>targetId===proof.id)!;if(view.model.failedCodeProofIds.has(proof.id))return <section className="xp-chrono__code-fallback" data-code-proof-id={proof.id} data-code-proof-status="error" role="status" aria-label={proof.title}><header><strong>{proof.title}</strong><button type="button" data-control-id={control.id} onClick={()=>view.copyProof(proof)}>{view.model.labels.copy}</button></header><p>{view.model.announcements.codeError}</p></section>;return <section className="xp-chrono__code-proof" data-code-proof-id={proof.id} data-code-proof-status="live" aria-label={proof.title}><header><div><strong>{proof.title}</strong><small>{proof.language}</small></div><button type="button" data-control-id={control.id} onClick={()=>view.copyProof(proof)}>{view.copyState==="success"?view.model.labels.copied:view.model.labels.copy}</button></header><pre><code>{proof.lines.join("\n")}</code></pre></section>}

function ReleaseBody({view,event}:{view:ChronoView;event:ReleaseEvent}){return <div className="xp-chrono__release-body">{event.summary.length?<ul className="xp-chrono__release-summary">{event.summary.map((fact)=><li key={fact}>{fact}</li>)}</ul>:null}{event.mediaIds.length?<div className="xp-chrono__release-media">{event.mediaIds.map((id)=>{const seat=mediaSeat(view.model,id);return seat?<MediaSeat model={view.model} seat={seat} key={id}/>:null})}</div>:null}{event.codeProofId?view.model.codeProofs.filter(({id})=>id===event.codeProofId).map((proof)=><CodeProof proof={proof} view={view} key={proof.id}/>):null}<div className="xp-chrono__release-groups">{event.groups.map((group)=>{const open=view.openGroupIds.has(group.id);const control=view.model.controls.find(({targetId})=>targetId===group.id)!;return <section key={group.id} data-group-id={group.id} data-kind={group.kind}><button type="button" data-control-id={control.id} aria-expanded={open} aria-controls={`${group.id}-facts`} onClick={()=>view.toggleGroup(group.id)}><span>{group.label}</span><span aria-hidden="true">{open?"−":"+"}</span></button><ul id={`${group.id}-facts`} hidden={!open}>{group.facts.map((fact)=><li key={fact}>{fact}</li>)}</ul></section>})}</div></div>}

function ReleaseNavigator({view,form}:{view:ChronoView;form:ChronoDeviceForm}){const target=form==="M"||form==="TP"||form==="TL"?"appbar-context":"context-pane";return <nav className="xp-chrono__release-nav" aria-label="Release versions" data-xp-relocation-request="groupNavigator" data-relocation-target={target}>{(view.model as ResolvedChronoFixture&ChangelogFixture).events.map((event)=>{const control=view.model.controls.find(({targetId})=>targetId===event.id)!;return <a key={event.id} data-control-id={control.id} href={control.href} aria-current={view.activeReleaseId===event.id?"page":undefined} onClick={(clickEvent)=>{clickEvent.preventDefault();view.selectRelease(event.id)}}><strong>{event.version}</strong><small>{event.date}</small></a>})}</nav>}

function ChangelogForm({view,form}:{view:ChronoView;form:ChronoDeviceForm}){
  const model=view.model as ResolvedChronoFixture&ChangelogFixture;
  const compact=form==="M"||form==="TP"||form==="TL";
  return <div className="xp-chrono__changelog" data-native-form={form}>
    <ReleaseNavigator form={form} view={view}/>
    <ol className="xp-chrono__releases">{model.events.map((event)=>{
      const selected=view.activeReleaseId===event.id;
      const open=!compact||view.openReleaseId===event.id;
      return <li key={event.id} id={event.id} data-event-id={event.id} data-open={open?"true":"false"} hidden={!compact&&!selected}><article><header><div><small>{event.version} · {event.date}</small><h2>{event.title}</h2></div>{compact?<button type="button" aria-expanded={open} aria-controls={`${event.id}-body`} onClick={()=>view.toggleRelease(event.id)}>{open?"Collapse release":"Open release"}</button>:null}</header><div id={`${event.id}-body`} hidden={compact&&!open}><ReleaseBody event={event} view={view}/></div></article></li>;
    })}</ol>
  </div>;
}

function ChronoForm({view,form}:{view:ChronoView;form:ChronoDeviceForm}){if(view.model.mode==="tracking")return <TrackingForm form={form} view={view}/>;if(view.model.mode==="history")return <HistoryForm form={form} view={view}/>;if(view.model.mode==="axis")return <AxisForm form={form} view={view}/>;return <ChangelogForm form={form} view={view}/>}
const renderers=Object.fromEntries(Object.keys(CHRONO_FORM_LADDER).map((form)=>[form,({core}:{core:ChronoView})=><ChronoForm form={form as ChronoDeviceForm} view={core}/>])) as Record<ChronoDeviceForm,({core}:{core:ChronoView})=>ReactNode>;

export function Chrono({fixture,mediaMap,stress,className}:ChronoProperties){
  const model=useMemo(()=>resolveChronoFixture(fixture,mediaMap,stress),[fixture,mediaMap,stress]);const ownerRef=useRef<HTMLElement>(null);
  const [saved,setSavedState]=useState(model.initial.saved);const [activeEventId,setActiveEventId]=useState(model.initial.activeEventId);const [openEventId,setOpenEventId]=useState(model.initial.openEventId);const [paused,setPausedState]=useState(model.initial.paused);const [interactionSuspended,setInteractionSuspended]=useState(false);const [activeReleaseId,setActiveReleaseId]=useState(model.initial.activeReleaseId);const [openReleaseId,setOpenReleaseId]=useState(model.initial.openReleaseId);const [openGroupIds,setOpenGroupIds]=useState(()=>new Set(model.initial.openGroupIds));const [copyState,setCopyState]=useState(model.initial.copyState);const [announcement,setAnnouncement]=useState("");
  useEffect(()=>{setSavedState(model.initial.saved);setActiveEventId(model.initial.activeEventId);setOpenEventId(model.initial.openEventId);setPausedState(model.initial.paused);setActiveReleaseId(model.initial.activeReleaseId);setOpenReleaseId(model.initial.openReleaseId);setOpenGroupIds(new Set(model.initial.openGroupIds));setCopyState(model.initial.copyState);setAnnouncement("")},[model]);
  useEffect(()=>{if(model.mode!=="axis"||model.initialState.timedAdvance!==true||paused||interactionSuspended)return;const query=globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");if(query?.matches)return;const events=model.events as Array<ProcessEvent|CareerEvent>;const index=events.findIndex(({id})=>id===activeEventId);if(index<0||index>=events.length-1)return;const timer=globalThis.setTimeout(()=>setActiveEventId(events[index+1].id),model.sourceKey==="timeline-component-03"?2500:5000);return()=>globalThis.clearTimeout(timer)},[activeEventId,interactionSuspended,model,paused]);
  const setSaved=(value:boolean)=>{setSavedState(value);setAnnouncement(value?model.announcements.saved:model.announcements.unsaved)};
  const setPaused=(value:boolean)=>{setPausedState(value);setAnnouncement(value?model.announcements.paused:model.announcements.resumed)};
  const selectEvent=(id:string)=>{setActiveEventId(id);setPausedState(true);setAnnouncement(model.announcements.selection)};
  const selectRelease=(id:string)=>{setActiveReleaseId(id);setOpenReleaseId(id);setAnnouncement(model.announcements.releaseNavigation);globalThis.document?.getElementById(id)?.scrollIntoView({block:"start",behavior:"smooth"})};
  const toggleRelease=(id:string)=>setOpenReleaseId((current)=>current===id?null:id);
  const toggleGroup=(id:string)=>setOpenGroupIds((current)=>{const next=new Set(current);if(next.has(id)){next.delete(id);setAnnouncement(model.announcements.closeGroup)}else{next.add(id);setAnnouncement(model.announcements.openGroup)}return next});
  const copyProof=(proof:ChronoCodeProof)=>{if(!globalThis.navigator?.clipboard){setCopyState("error");setAnnouncement(model.announcements.copyFailure);return}void globalThis.navigator.clipboard.writeText(proof.lines.join("\n")).then(()=>{setCopyState("success");setAnnouncement(model.announcements.copySuccess)},()=>{setCopyState("error");setAnnouncement(model.announcements.copyFailure)})};
  const view:ChronoView={model,saved,setSaved,activeEventId,selectEvent,openEventId,setOpenEventId,paused,setPaused,activeReleaseId,openReleaseId,selectRelease,toggleRelease,openGroupIds,toggleGroup,copyState,copyProof,announcement,setInteractionSuspended,ownerRef};
  return <section ref={ownerRef} className={["xp-chrono",className].filter(Boolean).join(" ")} data-chrono-owner data-chrono-state-owner data-source-key={model.sourceKey} data-mode={model.mode} data-preset={model.preset} data-terminal-eligible={model.terminalEligible?"true":"false"} data-stress={stress??"base"} aria-labelledby={`${model.sourceKey}-title`} onMouseEnter={()=>setInteractionSuspended(true)} onMouseLeave={()=>setInteractionSuspended(false)} onFocusCapture={()=>setInteractionSuspended(true)} onBlurCapture={(event)=>{if(!event.currentTarget.contains(event.relatedTarget))setInteractionSuspended(false)}}><header className="xp-chrono__intro">{model.intro.eyebrow?<p>{model.intro.eyebrow}</p>:null}<h1 id={`${model.sourceKey}-title`}>{model.intro.heading}</h1>{model.intro.description?<p>{model.intro.description}</p>:null}</header><MorphSlot className="xp-chrono__morph" ladder={CHRONO_FORM_LADDER} core={view} renderers={renderers}/><p className="xp-chrono__sr-only" aria-live="polite">{announcement}</p>{stress==="error"?<p className="xp-chrono__error" role="status">{model.announcements.genericError}</p>:null}</section>;
}
