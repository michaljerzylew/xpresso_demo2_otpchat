"use client";

import { AdaptiveOverlay, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  resolveProductReviewsFixture,
  type ProductReviewField,
  type ProductReviewFixture,
  type ProductReviewMediaStatus,
  type ProductReviewOverlayMode,
  type ProductReviewRailFixture,
  type ProductReviewsMediaMap,
  type ProductReviewStress,
  type ResolvedProductReviewMedia,
} from "./product-reviews-model";
import { UploadUnit } from "./upload-unit";
import type { ResolvedUpload, UploadMediaMap } from "./upload-model";

export type ProductReviewsScenario = {
  overlay?: "review" | "question" | "report";
  activeReviewId?: string;
  page?: 1 | 2;
  loadMore?: boolean;
  photoIndex?: number;
  railIndex?: number;
  filterOpen?: boolean;
  periodOpen?: boolean;
  mediaFallback?: boolean;
};

type SharedProperties = { media: ProductReviewsMediaMap; stress?: ProductReviewStress; scenario?: ProductReviewsScenario; className?: string };
type ReviewCenterProperties = SharedProperties & { fixture: ProductReviewFixture; uploadModel?: ResolvedUpload; uploadMedia?: UploadMediaMap };
type ProductReviewRailProperties = SharedProperties & { fixture: ProductReviewRailFixture };
type ReviewRecord = ProductReviewFixture["reviews"][number];

const nativeForm: Record<DeviceClass, string> = {
  M: "mobile-register",
  TP: "tablet-portrait-register",
  TL: "tablet-landscape-split",
  DS: "desktop-standard-split",
  DW: "desktop-wide-console",
};

const template = (value: string | undefined, replacements: Record<string, string | number>) =>
  Object.entries(replacements).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)), value ?? "");
const money = ({ currency, amountMinor }: { currency: string; amountMinor: number }) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
const date = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));
const month = (value: string) => new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T12:00:00Z`));
const stepMonth = (value: string, direction: -1 | 1) => { const valueDate=new Date(`${value}-01T12:00:00Z`); valueDate.setUTCMonth(valueDate.getUTCMonth()+direction); return valueDate.toISOString().slice(0,7) };
const pendingAnnouncement = (state: Record<string, unknown> | undefined) => Object.values(state ?? {}).flatMap((value)=>value&&typeof value==="object"?[String((value as Record<string,unknown>).announcement??"")]:[]).find(Boolean);

function Rating({ value, maximum, label }: { value: number; maximum: number; label: string }) {
  return <span className="xp-review-rating" role="img" aria-label={template(label, { value, maximum })} data-rating={value} style={{"--rating":value} as React.CSSProperties}><span aria-hidden="true">★★★★★</span><b>{value.toFixed(1)}</b></span>;
}

function Media({ media, statusOverride, className }: { media: ResolvedProductReviewMedia; statusOverride?: ProductReviewMediaStatus; className?: string }) {
  const status = statusOverride ?? media.status;
  if (status !== "resolved") return <span className={["xp-review-media", "xp-review-media--unavailable", className].filter(Boolean).join(" ")} data-media-seat-id={media.seatId} data-media-state={status} role="img" aria-label={media.alt}><i aria-hidden="true">⌁</i></span>;
  if (media.variants) return <picture className={["xp-review-media", className].filter(Boolean).join(" ")} data-media-seat-id={media.seatId} data-media-state="resolved"><source media="(prefers-color-scheme: dark)" srcSet={media.variants.dark}/><img src={media.variants.light} alt={media.alt}/></picture>;
  return <picture className={["xp-review-media", className].filter(Boolean).join(" ")} data-media-seat-id={media.seatId} data-media-state="resolved">{media.sources?.avif?<source type="image/avif" srcSet={media.sources.avif}/>:null}{media.sources?.webp?<source type="image/webp" srcSet={media.sources.webp}/>:null}<img src={media.sources?.jpg} alt={media.alt}/></picture>;
}

function Aggregate({ model, compact, periodOpen, setPeriodOpen, periodValue, onPeriodStep }: { model: ProductReviewFixture & { mediaById: Map<string, ResolvedProductReviewMedia> }; compact: boolean; periodOpen: boolean; setPeriodOpen: (open: boolean) => void; periodValue?: string; onPeriodStep: (direction:-1|1)=>void }) {
  const { aggregate, announcements } = model;
  const periodControl = model.state.controls?.find(({ id }) => id.includes("period"));
  return <aside className="xp-review-center__aggregate" aria-label={model.copy.histogramLabel ?? model.intro.eyebrow}>
    <div className="xp-review-center__score"><Rating {...aggregate.rating} label={announcements.ratingEquivalent}/><span>{aggregate.reviewCount}</span></div>
    {aggregate.volume !== undefined?<dl className="xp-review-center__metrics"><div><dt>{model.copy.volumeLabel}</dt><dd>{aggregate.volume}</dd></div><div><dt>{model.copy.trendLabel}</dt><dd>+{aggregate.trendPercent}%</dd></div></dl>:null}
    {periodControl?<AdaptiveOverlay intent="pick" open={periodOpen} onOpenChange={setPeriodOpen}><AdaptiveOverlay.Trigger className="xp-review-center__period">{periodValue?month(periodValue):periodControl.selectedLabel}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content><AdaptiveOverlay.Header title={periodControl.label} closeLabel={periodControl.closeLabel}/><AdaptiveOverlay.Body className="xp-review-center__month"><button type="button" aria-label={periodControl.previousLabel} onClick={()=>onPeriodStep(-1)}>←</button><strong>{periodValue?month(periodValue):periodControl.selectedLabel}</strong><button type="button" aria-label={periodControl.nextLabel} onClick={()=>onPeriodStep(1)}>→</button></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>:null}
    {aggregate.histogram?<details className="xp-review-center__histogram-disclosure" open={!compact}><summary>{model.copy.histogramLabel}</summary><ol className="xp-review-center__histogram" aria-label={model.copy.histogramLabel}>{aggregate.histogram.map((bin)=><li key={bin.stars}><span>{bin.stars}</span><i style={{"--xp-review-value":`${bin.value / Math.max(...aggregate.histogram!.map(({value})=>value)) * 100}%`} as React.CSSProperties}/><b>{bin.value}</b></li>)}</ol></details>:null}
    {aggregate.verifiedCount!==undefined?<p className="xp-review-center__verified">✓ {aggregate.verifiedCount}</p>:null}
    {aggregate.trustMetric?<div className="xp-review-center__trust" aria-label={aggregate.trustMetric.label}>{aggregate.trustMetric.markMediaIds.map((id)=><Media media={model.mediaById.get(id)!} key={id}/>)}</div>:null}
    {periodValue?<p className="xp-review-live" role="status" aria-live="polite">{month(periodValue)}</p>:null}
  </aside>;
}

function ReviewCard({ model, review, mediaFallback, selectedVotes, setSelectedVotes, onReport, mutationState, onMutationMessage }: {
  model: ProductReviewFixture & { mediaById: Map<string, ResolvedProductReviewMedia> };
  review: ReviewRecord;
  mediaFallback: boolean;
  selectedVotes: Record<string, string>;
  setSelectedVotes: (next: Record<string, string>) => void;
  onReport: (id: string, trigger: HTMLButtonElement) => void;
  mutationState?: Record<string, unknown>;
  onMutationMessage: (message: string) => void;
}) {
  const avatar = model.mediaById.get(review.author.avatarMediaId)!;
  const vote = selectedVotes[review.id] ?? String(review.votes?.selected ?? "");
  const pending = Boolean(mutationState && !mutationState.actionError);
  const chooseVote = (kind: string) => {
    if (typeof mutationState?.actionError === "string") { onMutationMessage(mutationState.actionError); return; }
    if (pending) return;
    setSelectedVotes({ ...selectedVotes, [review.id]: vote === kind ? "" : kind });
  };
  return <article className="xp-review-card" data-review-id={review.id}>
    <header><Media media={avatar} statusOverride={mediaFallback ? "error" : undefined} className="xp-review-card__avatar"/><div><h3>{review.title ?? review.author.name}</h3>{review.title?<p>{review.author.name}</p>:null}<p>{review.verified?<span>{model.announcements.verifiedStatus} · </span>:null}<time dateTime={`${review.dateIso}${review.time24h?`T${review.time24h}`:""}`}>{date(review.dateIso)}{review.time24h?` · ${review.time24h}`:""}</time></p></div><Rating {...review.rating} label={model.announcements.ratingEquivalent}/></header>
    <p className="xp-review-card__body">{review.body}</p>
    {review.spend||review.priorReviewCount!==undefined?<dl className="xp-review-card__facts">{review.spend?<div><dt>{model.copy.spendLabel}</dt><dd>{money(review.spend)}</dd></div>:null}{review.priorReviewCount!==undefined?<div><dt>{model.copy.priorReviewLabel}</dt><dd>{review.priorReviewCount}</dd></div>:null}</dl>:null}
    <footer>
      {review.actions.map((action)=>action.kind==="report"?<button type="button" data-action-id={action.id} key={action.id} onClick={(event)=>onReport(review.id,event.currentTarget)}>{action.label}</button>:action.href?<a href={action.href} data-action-id={action.id} key={action.id}>{action.label}</a>:null)}
      {review.votes?.positive!==undefined?<div className="xp-review-card__votes"><button type="button" aria-pressed={vote==="positive"} aria-busy={pending||undefined} data-state={pending?"pending":undefined} onClick={()=>chooseVote("positive")}>↑ {review.votes.positive + (vote==="positive"?1:0)}</button><button type="button" aria-pressed={vote==="negative"} aria-busy={pending||undefined} data-state={pending?"pending":undefined} onClick={()=>chooseVote("negative")}>↓ {(review.votes.negative??0) + (vote==="negative"?1:0)}</button></div>:null}
      {review.votes?.helpful!==undefined?<button type="button" aria-pressed={vote==="helpful"} aria-busy={pending||undefined} data-state={pending?"pending":undefined} onClick={()=>chooseVote("helpful")}>+ {review.votes.helpful + (vote==="helpful"?1:0)}</button>:null}
    </footer>
  </article>;
}

function ratingKeyDown(event: KeyboardEvent<HTMLFieldSetElement>) {
  if (!["ArrowLeft","ArrowDown","ArrowRight","ArrowUp","Home","End"].includes(event.key)) return;
  const inputs=[...event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
  const current=Math.max(0,inputs.findIndex((input)=>input===document.activeElement));
  const next=event.key==="Home"?0:event.key==="End"?inputs.length-1:event.key==="ArrowLeft"||event.key==="ArrowDown"?Math.max(0,current-1):Math.min(inputs.length-1,current+1);
  event.preventDefault(); inputs[next]?.click(); inputs[next]?.focus();
}

function EditorField({ field, model, uploadModel, uploadMedia, invalid, onUploadRemoved }: { field: ProductReviewField; model: ProductReviewFixture; uploadModel?: ResolvedUpload; uploadMedia?: UploadMediaMap; invalid: boolean; onUploadRemoved: (name:string)=>void }) {
  const errorId=`${field.id}-error`;
  const describedBy=invalid&&field.error?errorId:undefined;
  if (field.kind === "upload") {
    if (!uploadModel || !uploadMedia) throw new Error(`${model.sourceKey} requires canonical UploadUnit dependencies.`);
    return <div className="xp-review-editor__upload" data-field-id={field.id}><UploadUnit model={uploadModel} mediaMap={uploadMedia} onFileRemoved={(file)=>onUploadRemoved(file.name)}/>{invalid&&field.error?<small id={errorId} role="alert">{field.error}</small>:null}</div>;
  }
  if (field.kind === "rating") return <fieldset className="xp-review-editor__rating" onKeyDown={ratingKeyDown}><legend>{field.label}</legend>{Array.from({length:10},(_,index)=>(index+1)/2).map((value)=><label key={value}><input type="radio" name={field.id} value={value} required={field.required} aria-invalid={invalid||undefined} aria-describedby={describedBy}/><span>{value}</span></label>)}{invalid&&field.error?<small id={errorId} role="alert">{field.error}</small>:null}</fieldset>;
  if (field.kind === "radio") return <fieldset><legend>{field.label}</legend>{field.options?.map((option)=><label key={option.id}><input type="radio" name={field.id} value={option.id} required={field.required} aria-invalid={invalid||undefined} aria-describedby={describedBy}/><span>{option.label}</span></label>)}{invalid&&field.error?<small id={errorId} role="alert">{field.error}</small>:null}</fieldset>;
  if (field.kind === "checkbox") return <label className="xp-review-editor__check"><input type="checkbox" name={field.id} required={field.required} aria-invalid={invalid||undefined} aria-describedby={describedBy}/><span>{field.label}</span>{invalid&&field.error?<small id={errorId} role="alert">{field.error}</small>:null}</label>;
  return <label><span>{field.label}</span>{field.kind === "textarea"?<textarea name={field.id} placeholder={field.placeholder} required={field.required} aria-invalid={invalid||undefined} aria-describedby={describedBy}/>:<input name={field.id} type="text" placeholder={field.placeholder} required={field.required} aria-invalid={invalid||undefined} aria-describedby={describedBy}/>} {invalid&&field.error?<small id={errorId} role="alert">{field.error}</small>:null}</label>;
}

function Editor({ model, mode, open, setOpen, activeReviewId, uploadModel, uploadMedia }: {
  model: ProductReviewFixture;
  mode?: ProductReviewOverlayMode["mode"];
  open: boolean;
  setOpen: (open: boolean) => void;
  activeReviewId?: string;
  uploadModel?: ResolvedUpload;
  uploadMedia?: UploadMediaMap;
}) {
  const [dirty,setDirty]=useState(false); const [message,setMessage]=useState(""); const [invalidFields,setInvalidFields]=useState<string[]>([]);
  const copy=model.overlayCopy.modes.find((entry)=>entry.mode===mode); if(!copy)return null;
  const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();setInvalidFields([]);setMessage(model.announcements.submitSuccess);setDirty(false)};
  return <AdaptiveOverlay intent="edit" open={open} onOpenChange={setOpen} dirty={dirty} onDismissRequest={(close)=>{if(globalThis.confirm(model.announcements.overlayDiscardConfirm))close()}} presentation={{M:"bottom-sheet",TP:"sheet",TL:"dialog",DS:"dialog",DW:"dialog"}} why="Editing uses compact sheets and bounded wide dialogs while preserving one draft owner."><AdaptiveOverlay.Content className="xp-review-editor"><AdaptiveOverlay.Header title={copy.title} description={copy.description} closeLabel={model.announcements.overlayClosed}/><AdaptiveOverlay.Body><form onSubmit={submit} onInvalid={(event)=>{const target=event.target as unknown as HTMLInputElement;const name=target.name;if(name)setInvalidFields((fields)=>fields.includes(name)?fields:[...fields,name]);setMessage(copy.errorSummary)}} onChange={(event)=>{setDirty(true);const name=(event.target as unknown as HTMLInputElement).name;if(name)setInvalidFields((fields)=>fields.filter((field)=>field!==name))}} data-overlay-mode={copy.mode} data-review-target={activeReviewId}>{copy.fields.map((field)=><EditorField field={field} model={model} uploadModel={uploadModel} uploadMedia={uploadMedia} invalid={invalidFields.includes(field.id)} onUploadRemoved={(name)=>setMessage(template(model.announcements.uploadRemove,{file:name}))} key={field.id}/>)}</form>{message?<p role={message===copy.errorSummary?"alert":"status"}>{message}</p>:null}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer>{copy.actions.map((action)=>action.kind==="submit"?<button type="button" key={action.id} onClick={(event)=>{const form=event.currentTarget.closest("[data-xp-overlay]")?.querySelector<HTMLFormElement>("form");form?.requestSubmit();globalThis.requestAnimationFrame(()=>form?.querySelector<HTMLElement>(":invalid")?.focus())}}>{action.label}</button>:action.kind==="reset"?<button type="button" key={action.id} onClick={(event)=>{event.currentTarget.closest("[data-xp-overlay]")?.querySelector<HTMLFormElement>("form")?.reset();setDirty(false);setInvalidFields([]);setMessage("")}}>{action.label}</button>:<AdaptiveOverlay.Close key={action.id}>{action.label}</AdaptiveOverlay.Close>)}</AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function Filters({ model, open, setOpen, values, setValues, resultCount }: { model: ProductReviewFixture; open: boolean; setOpen:(open:boolean)=>void; values:Record<string,string>; setValues:(values:Record<string,string>)=>void; resultCount:number }) {
  const [draft,setDraft]=useState(values);
  if (!model.filters.length) return null;
  const changeOpen=(next:boolean)=>{if(next)setDraft(values);setOpen(next)};
  const apply=()=>{setValues(draft);setOpen(false)};
  const committed=model.filters.map((filter)=>filter.options.find(({id})=>id===(values[filter.id]??filter.selectedId))!.label);
  return <div className="xp-review-center__filters" data-filter-values={committed.join("|")}><AdaptiveOverlay intent="pick" open={open} onOpenChange={changeOpen}><AdaptiveOverlay.Trigger className="xp-review-center__filter-trigger">{model.copy.resultCountLabel ? template(model.copy.resultCountLabel,{count:resultCount}) : model.intro.eyebrow}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-review-filters"><AdaptiveOverlay.Header title={model.intro.eyebrow} closeLabel={model.announcements.filterCancel}/><AdaptiveOverlay.Body>{model.filters.map((filter)=><fieldset data-filter-axis={filter.id} key={filter.id}><legend>{filter.label}</legend>{filter.options.map((option)=><label key={option.id}><input type="radio" name={filter.id} value={option.id} checked={(draft[filter.id]??filter.selectedId)===option.id} onChange={()=>setDraft({...draft,[filter.id]:option.id})}/><span>{option.label}</span></label>)}</fieldset>)}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer><button className="xp-review-center__filter-apply" type="button" onClick={apply}>{model.announcements.filterApply}</button></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay><p aria-live="polite">{template(model.announcements.filterResultCount,{count:resultCount})}<span>{committed.join(" · ")}</span></p></div>;
}

export function ReviewCenter({ fixture, media, stress, scenario, className, uploadModel, uploadMedia }: ReviewCenterProperties) {
  const deviceClass=useDeviceClass();
  const model=useMemo(()=>resolveProductReviewsFixture(fixture,media,stress) as ProductReviewFixture & {mediaById:Map<string,ResolvedProductReviewMedia>;activeStressState?:Record<string,unknown>},[fixture,media,stress]);
  const [overlayMode,setOverlayMode]=useState<ProductReviewOverlayMode["mode"]|undefined>(scenario?.overlay);
  const [activeReviewId,setActiveReviewId]=useState(scenario?.activeReviewId);
  const [selectedVotes,setSelectedVotes]=useState<Record<string,string>>({});
  const [page,setPage]=useState<number>(scenario?.page??1); const [loadedPages,setLoadedPages]=useState<number>(scenario?.loadMore?2:1);
  const [photoIndex,setPhotoIndex]=useState(Math.max(0,Math.min(model.customerPhotoMediaIds.length-1,scenario?.photoIndex??0))); const photoRail=useRef<HTMLDivElement>(null); const photoCells=useRef<Array<HTMLDivElement|null>>([]);
  const [filtersOpen,setFiltersOpen]=useState(Boolean(scenario?.filterOpen)); const [filterValues,setFilterValues]=useState<Record<string,string>>({}); const [periodOpen,setPeriodOpen]=useState(Boolean(scenario?.periodOpen)); const [periodValue,setPeriodValue]=useState(model.aggregate.period?.value);
  const [mutationMessage,setMutationMessage]=useState("");
  const editorTrigger=useRef<HTMLElement|null>(null);
  const compact=deviceClass==="M"||deviceClass==="TP"; const pagination=model.pagination;
  const declaredIds=Array.isArray(model.activeStressState?.visibleReviewIds)?new Set(model.activeStressState.visibleReviewIds as string[]):undefined;
  const unfilteredReviews=declaredIds?model.reviews.filter(({id})=>declaredIds.has(id)):model.reviews;
  const sentiment=filterValues["filter-group-sentiment"];
  const availableReviews=unfilteredReviews.filter((review)=>sentiment==="opt-sent-2"?review.rating.value>=4.5:sentiment==="opt-sent-3"?review.rating.value<4.5:sentiment==="opt-sent-4"?review.verified:true);
  const visibleReviews=pagination?(compact?availableReviews.slice(0,pagination.pageSize*loadedPages):availableReviews.slice((page-1)*pagination.pageSize,page*pagination.pageSize)):availableReviews;
  const openMode=(mode:ProductReviewOverlayMode["mode"],reviewId?:string,trigger?:HTMLElement)=>{if(trigger)editorTrigger.current=trigger;setActiveReviewId(reviewId);setOverlayMode(mode)};
  const revealPhoto=(next:number)=>{const bounded=Math.max(0,Math.min(model.customerPhotoMediaIds.length-1,next));setPhotoIndex(bounded);globalThis.requestAnimationFrame(()=>{const host=photoRail.current;const target=photoCells.current[bounded];if(host&&target)host.scrollTo({left:target.offsetLeft,behavior:"auto"})})};
  const syncPhoto=()=>{const host=photoRail.current;if(!host)return;if(host.scrollLeft>=host.scrollWidth-host.clientWidth-1){setPhotoIndex(model.customerPhotoMediaIds.length-1);return}let nearest=0;let distance=Number.POSITIVE_INFINITY;photoCells.current.forEach((node,index)=>{if(!node)return;const next=Math.abs(node.offsetLeft-host.scrollLeft);if(next<distance){nearest=index;distance=next}});setPhotoIndex(nearest)};
  useEffect(()=>{if(model.customerPhotoMediaIds.length)revealPhoto(photoIndex)},[]);
  return <section className={["xp-review-center",`xp-review-center--${model.preset}`,className].filter(Boolean).join(" ")} data-xp-owner="ReviewCenter" data-review-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-native-form={nativeForm[deviceClass]} data-stress={stress??"base"}>
    <header className="xp-review-center__intro"><p>{model.intro.eyebrow}</p><h2>{model.intro.heading}</h2><p>{model.intro.description}</p><div>{model.actions.map((action)=>action.href?<a href={action.href} data-action-id={action.id} key={action.id}><span>{action.label}</span></a>:<button type="button" data-action-id={action.id} key={action.id} onClick={(event)=>openMode(action.kind==="ask-question"?"question":"review",undefined,event.currentTarget)}><span>{action.label}</span></button>)}</div></header>
    <Aggregate model={model} compact={compact} periodOpen={periodOpen} setPeriodOpen={setPeriodOpen} periodValue={periodValue} onPeriodStep={(direction)=>setPeriodValue((value)=>value?stepMonth(value,direction):value)}/>
    {model.customerPhotoMediaIds.length?<section className="xp-review-center__evidence" aria-label={model.intro.eyebrow}><div className="xp-review-center__evidence-track" ref={photoRail} onScroll={syncPhoto}>{model.customerPhotoMediaIds.map((id,index)=><div ref={(node)=>{photoCells.current[index]=node}} data-current={photoIndex===index||undefined} key={id}><Media media={model.mediaById.get(id)!} statusOverride={scenario?.mediaFallback?"error":undefined}/></div>)}</div><div><button type="button" aria-label={model.state.controls?.[0]?.label} disabled={photoIndex===0} onClick={()=>revealPhoto(photoIndex-1)}>←</button><span>{template(model.announcements.position,{current:photoIndex+1,total:model.customerPhotoMediaIds.length})}</span><button type="button" aria-label={model.state.controls?.[1]?.label} disabled={photoIndex===model.customerPhotoMediaIds.length-1} onClick={()=>revealPhoto(photoIndex+1)}>→</button></div></section>:null}
    {model.filters.length||pagination?<div className="xp-review-center__toolbar"><Filters model={model} open={filtersOpen} setOpen={setFiltersOpen} values={filterValues} setValues={(values)=>{setFilterValues(values);setPage(1);setLoadedPages(1)}} resultCount={availableReviews.length}/>{pagination?<span>{template(model.copy.rangeLabel,{start:availableReviews.length?compact?1:(page-1)*pagination.pageSize+1:0,end:compact?visibleReviews.length:Math.min(page*pagination.pageSize,availableReviews.length),total:availableReviews.length})}</span>:null}</div>:null}
    {typeof model.activeStressState?.loadError==="string"?<div className="xp-review-state" role="alert"><strong>{model.activeStressState.loadError}</strong><button type="button">{String(model.activeStressState.retryLabel)}</button></div>:null}
    {stress==="pending"?<p className="xp-review-state" role="status">{pendingAnnouncement(model.activeStressState)}</p>:null}
    <div className="xp-review-center__stream" aria-label={model.copy.reviewListLabel??model.intro.heading}>{visibleReviews.length?visibleReviews.map((review)=><ReviewCard model={model} review={review} mediaFallback={Boolean(scenario?.mediaFallback)} selectedVotes={selectedVotes} setSelectedVotes={setSelectedVotes} onReport={(id,trigger)=>openMode("report",id,trigger)} mutationState={stress==="error"||stress==="pending"?model.activeStressState:undefined} onMutationMessage={setMutationMessage} key={review.id}/>):<div className="xp-review-state"><h3>{String(model.activeStressState?.heading??model.intro.heading)}</h3><p>{String(model.activeStressState?.body??model.intro.description)}</p>{model.activeStressState?.recoveryLabel?<button type="button">{String(model.activeStressState.recoveryLabel)}</button>:null}</div>}</div>
    {mutationMessage?<p className="xp-review-state" role="status">{mutationMessage}</p>:null}
    {(stress==="error"||scenario?.mediaFallback)&&model.activeStressState?.mediaError?<p className="xp-review-state" role="alert">{String(model.activeStressState.mediaError)}</p>:scenario?.mediaFallback?<p className="xp-review-state" role="alert">{model.announcements.mediaError}</p>:null}
    {pagination?<nav className="xp-review-center__pagination" aria-label={model.copy.rangeLabel}>{compact?<button type="button" disabled={loadedPages>=pagination.pageCount} onClick={()=>setLoadedPages((value)=>{const next=Math.min(pagination.pageCount,value+1);setPage(next);return next})}>{model.copy.loadMoreLabel}</button>:<><button type="button" aria-label={model.copy.previousPageLabel} disabled={page===1} onClick={()=>setPage((value)=>Math.max(1,value-1))}>←</button><span>{template(model.copy.pageLabel,{page})}</span><button type="button" aria-label={model.copy.nextPageLabel} disabled={page===pagination.pageCount} onClick={()=>setPage((value)=>Math.min(pagination.pageCount,value+1))}>→</button></>}</nav>:null}
    <Editor model={model} mode={overlayMode} open={Boolean(overlayMode)} setOpen={(open)=>{if(!open){setOverlayMode(undefined);globalThis.requestAnimationFrame(()=>editorTrigger.current?.focus())}}} activeReviewId={activeReviewId} uploadModel={uploadModel} uploadMedia={uploadMedia}/>
  </section>;
}

export function ProductReviewRail({ fixture, media, stress, scenario, className }: ProductReviewRailProperties) {
  const deviceClass=useDeviceClass(); const model=useMemo(()=>resolveProductReviewsFixture(fixture,media,stress) as ProductReviewRailFixture & {mediaById:Map<string,ResolvedProductReviewMedia>;activeStressState?:Record<string,unknown>},[fixture,media,stress]);
  const initial=Math.max(0,model.records.findIndex(({id})=>id===model.initialRecordId)); const [index,setIndex]=useState(Math.max(0,Math.min(model.records.length-1,scenario?.railIndex??initial))); const rail=useRef<HTMLDivElement>(null); const records=useRef<Array<HTMLElement|null>>([]);
  const reveal=(position:number)=>{const host=rail.current;const target=records.current[position];if(host&&target)host.scrollTo({left:target.offsetLeft,behavior:"auto"})};
  useEffect(()=>reveal(index),[]);
  const select=(position:number)=>{const next=Math.max(0,Math.min(model.records.length-1,position));setIndex(next);globalThis.requestAnimationFrame(()=>reveal(next))};
  const syncPosition=()=>{const host=rail.current;if(!host)return;if(host.scrollLeft>=host.scrollWidth-host.clientWidth-1){setIndex(model.records.length-1);return}let nearest=0;let distance=Number.POSITIVE_INFINITY;records.current.forEach((node,position)=>{if(!node)return;const next=Math.abs(node.offsetLeft-host.scrollLeft);if(next<distance){nearest=position;distance=next}});setIndex(nearest)};
  return <section className={["xp-product-review-rail",className].filter(Boolean).join(" ")} data-xp-owner="ProductReviewRail" data-review-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-native-form={nativeForm[deviceClass]} data-active-index={index}>
    <header><p>{model.eyebrow}</p><h2>{model.heading}</h2><p>{model.description}</p></header>
    <div className="xp-product-review-rail__window" ref={rail} onScroll={syncPosition}><div className="xp-product-review-rail__track">{model.records.map((record,position)=>{const product=model.mediaById.get(record.productMediaId)!;const mark=model.mediaById.get(record.maker.markMediaId)!;return <article ref={(node)=>{records.current[position]=node}} className="xp-product-review-rail__record" data-record-id={record.id} data-current={index===position||undefined} key={record.id}><Media media={product} statusOverride={scenario?.mediaFallback?"error":undefined} className="xp-product-review-rail__product"/><div><Media media={mark} statusOverride={scenario?.mediaFallback?"error":undefined} className="xp-product-review-rail__mark"/><p>{record.maker.name}</p><h3>{record.productName}</h3><Rating {...record.rating} label={model.announcements.ratingEquivalent}/><blockquote>{record.reviewExcerpt}</blockquote><time dateTime={record.dateIso}>{date(record.dateIso)}</time><p className="xp-product-review-rail__price"><strong>{money(record.price)}</strong><s>{money(record.compareAt)}</s></p></div></article>})}</div></div>
    {typeof model.activeStressState?.loadError==="string"?<div className="xp-review-state" role="alert"><strong>{model.activeStressState.loadError}</strong><p>{String(model.activeStressState.mediaError)}</p><button type="button">{String(model.activeStressState.retryLabel)}</button></div>:scenario?.mediaFallback?<p className="xp-review-state" role="alert">{model.announcements.mediaError}</p>:null}
    <nav aria-label={model.heading}><button type="button" data-control-id={model.controls[0].id} aria-label={model.controls[0].label} disabled={index===0} onClick={()=>select(index-1)}>←</button><div>{model.controls.slice(2).map((control,dot)=><button type="button" data-control-id={control.id} aria-label={control.label} aria-current={index===dot?"true":undefined} onClick={()=>select(dot)} key={control.id}><span/></button>)}</div><button type="button" data-control-id={model.controls[1].id} aria-label={model.controls[1].label} disabled={index===model.records.length-1} onClick={()=>select(index+1)}>→</button></nav>
    <p className="xp-review-live" role="status" aria-live="polite">{template(model.announcements.position,{current:index+1,total:model.records.length})}</p>
  </section>;
}
