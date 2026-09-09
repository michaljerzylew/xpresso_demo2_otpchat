"use client";

import { MorphSlot, SegmentedControl, useDeviceClass, type DeviceClass } from "@xp/primitives";
import { useMemo, useRef, useState, type FormEvent, type ReactNode, type UIEvent } from "react";
import { resolveArticleFeedFixture, type ArticleAction, type ArticleFeedFixture, type ArticleRecord, type BlogMediaRecord, type ResolvedArticleFeedFixture, type ResolvedArticleMedia } from "./article-feed-model";

type ArticleFeedProperties = { fixture: ArticleFeedFixture; media: BlogMediaRecord[]; stress?: string; className?: string };
const ladder:Record<DeviceClass,string>={M:"mobile",TP:"tablet-portrait",TL:"tablet-landscape",DS:"desktop-standard",DW:"desktop-wide"};

const actionFor=(model:ResolvedArticleFeedFixture,id:string)=>model.actions.find((action)=>action.id===id);
function Action({action,className,children}:{action?:ArticleAction;className?:string;children?:ReactNode}) {
  if(!action||action.kind!=="navigate"||!action.href)return null;
  return <a className={className} href={action.href} data-action-id={action.id}>{children??action.label}</a>;
}

function RuntimeProof({media,error}:{media:ResolvedArticleMedia;error:boolean}) {
  const identity=media.runtimeSpecId?.replace("spec-med-","")??media.seat.id;
  const proofKind=identity.includes("11-ui-1")?"release-log":identity.includes("11-ui-2")?"growth-chart":identity.includes("11-ui-3")?"architecture-map":"field-state";
  return <div className="xp-article-feed__runtime" data-media-seat-id={media.seat.id} data-runtime-spec-id={media.runtimeSpecId} data-runtime-ui-identity={identity} data-runtime-proof-kind={proofKind} data-runtime-state={error?"error":"live"} role="img" aria-label={media.seat.alt}>
    <header><span/><span/><span/><small>{error?"Renderer offline":"XPRESSO field report"}</small></header>
    <div className="xp-article-feed__runtime-body"><strong>{identity.includes("11-ui-1")?"42 releases":identity.includes("11-ui-2")?"18 modules":identity.includes("11-ui-3")?"7 checks":identity.includes("13-dev")?"Review ready":"99.8% stable"}</strong><div><i/><i/><i/></div><code>{error?"static recovery view":"local deterministic state"}</code></div>
  </div>;
}

function Media({model,id}:{model:ResolvedArticleFeedFixture;id?:string}) {
  if(!id)return null;
  const media=model.mediaById.get(id); if(!media)return null;
  if(model.heldMediaIds.has(id))return <div className="xp-article-feed__media xp-article-feed__media--pending" data-media-seat-id={id} data-media-state="pending" aria-busy="true" role="status"><span>Media production pending</span><small>{media.seat.alt}</small></div>;
  if(model.failedMediaIds.has(id))return <div className="xp-article-feed__media xp-article-feed__media--error" data-media-seat-id={id} data-media-state="error" role="img" aria-label={`${media.seat.alt}. Media unavailable.`}><span>Media unavailable</span></div>;
  if(media.disposition==="runtime-code-spec")return <RuntimeProof media={media} error={model.failedRuntimeSpecIds.has(media.runtimeSpecId??"")}/>;
  if(media.disposition==="deterministic-export")return <div className="xp-article-feed__poster" data-media-seat-id={id} data-media-state="code-static" role="img" aria-label={media.seat.alt}><b>Server</b><b>rendering</b><span>Field notes / 2026</span></div>;
  if(media.src)return <div className="xp-article-feed__media" data-media-seat-id={id} data-media-state="resolved"><img src={media.src} alt={media.seat.alt}/></div>;
  throw new Error(`${model.sourceKey} resolved media ${id} has no valid presentation.`);
}

function AuthorLine({model,article}:{model:ResolvedArticleFeedFixture;article:ArticleRecord}) {
  if(!article.authorIds.length)return null;
  return <div className="xp-article-feed__authors">{article.authorIds.map((id)=>{const author=model.authors.find((entry)=>entry.id===id);if(!author)return null;const action=author.actionId?actionFor(model,author.actionId):undefined;return <span key={id} data-author-id={id}>{author.avatarSeatId?<Media model={model} id={author.avatarSeatId}/>:null}<span><Action action={action}>{author.name}</Action>{!action?<b>{author.name}</b>:null}{author.role?<small>{author.role}</small>:null}</span></span>})}</div>;
}

function CategoryLine({model,article}:{model:ResolvedArticleFeedFixture;article:ArticleRecord}) {
  if(!article.categoryIds.length&&!article.tags.length)return null;
  const suffix=article.id.split("-").at(-1);
  return <div className="xp-article-feed__taxonomy">{article.categoryIds.map((id)=>{const category=model.categories.find((entry)=>entry.id===id);if(!category)return null;const inferred=actionFor(model,`act-${model.sourceKey.slice(-2)}-cat-${suffix}`);const explicit=category.actionId?actionFor(model,category.actionId):undefined;const action=inferred??explicit;return action?<Action key={id} action={action} className="xp-article-feed__chip">{category.label}</Action>:<span className="xp-article-feed__chip" key={id}>{category.label}</span>})}{article.tags.map((tag)=><span className="xp-article-feed__chip" key={tag}>{tag}</span>)}</div>;
}

function ArticleCard({model,article,kind}:{model:ResolvedArticleFeedFixture;article:ArticleRecord;kind?:string}) {
  const action=actionFor(model,article.articleActionId);
  return <article className="xp-article-feed__card" data-article-id={article.id} data-card-kind={kind} data-rank={article.rank}>
    {article.mediaSeatId?<Action action={action} className="xp-article-feed__media-link"><Media model={model} id={article.mediaSeatId}/></Action>:null}
    <div className="xp-article-feed__card-copy"><CategoryLine model={model} article={article}/>{article.date||article.readTime?<p className="xp-article-feed__meta">{[article.date,article.readTime].filter(Boolean).join(" · ")}</p>:null}<h3><Action action={action}>{article.title}</Action></h3>{article.summary?<p>{article.summary}</p>:null}<AuthorLine model={model} article={article}/><Action action={action} className="xp-article-feed__read">{action?.label}<span aria-hidden="true">→</span></Action></div>
  </article>;
}

function Intro({model}:{model:ResolvedArticleFeedFixture}) {
  if(!model.intro)return null;
  const referenced=new Set([...model.articles.map(({articleActionId})=>articleActionId),...model.authors.flatMap(({actionId})=>actionId?[actionId]:[]),...model.categories.flatMap(({actionId})=>actionId?[actionId]:[]),...(model.newsletter?[model.newsletter.submitActionId]:[])]);
  const utilities=model.actions.filter((action)=>action.kind==="navigate"&&!referenced.has(action.id)&&!/-cat-\d+$/.test(action.id));
  return <header className="xp-article-feed__intro">{model.intro.eyebrow?<p className="xp-article-feed__eyebrow">{model.intro.eyebrow}</p>:null}<h2>{model.intro.title}</h2>{model.intro.body?<p>{model.intro.body}</p>:null}{utilities.length?<div className="xp-article-feed__utility-actions">{utilities.map((action)=><Action action={action} key={action.id}/>)}</div>:null}</header>;
}

function Newsletter({model}:{model:ResolvedArticleFeedFixture}) {
  const newsletter=model.newsletter!; const forced=model.stressNewsletterOutcome; const [email,setEmail]=useState(""); const [status,setStatus]=useState<"idle"|"invalid"|"submitting"|"success"|"error">(forced??"idle");
  const submit=(event:FormEvent)=>{event.preventDefault();if(!/^\S+@\S+\.\S+$/.test(email)){setStatus("invalid");return}setStatus("submitting");globalThis.setTimeout(()=>setStatus("success"),180)};
  const message=status==="idle"?newsletter.field.help:newsletter.messages[status];
  return <form className="xp-article-feed__newsletter" onSubmit={submit} data-newsletter-state={status} noValidate><span className="xp-article-feed__newsletter-icon" aria-hidden="true"/><h3>Editorial digest</h3><label htmlFor={`${model.sourceKey}-email`}>{newsletter.field.label}</label><div><input id={`${model.sourceKey}-email`} name="email" type="email" inputMode="email" required value={email} placeholder={newsletter.field.placeholder} aria-invalid={status==="invalid"||status==="error"} aria-describedby={`${model.sourceKey}-email-message`} onChange={(event)=>{setEmail(event.target.value);if(status!=="idle")setStatus("idle")}}/><button type="submit" disabled={status==="submitting"} data-action-id={newsletter.submitActionId}>{status==="submitting"?newsletter.messages.submitting:actionFor(model,newsletter.submitActionId)?.label}</button></div><p id={`${model.sourceKey}-email-message`} role={status==="invalid"||status==="error"?"alert":"status"}>{message}</p></form>;
}

function Carousel({model}:{model:ResolvedArticleFeedFixture}) {
  const carousel=model.carousel!; const [index,setIndex]=useState(Math.max(0,carousel.articleIds.indexOf(carousel.initialArticleId))); const track=useRef<HTMLDivElement>(null);
  const move=(next:number)=>{const bounded=Math.max(0,Math.min(carousel.articleIds.length-1,next));setIndex(bounded);track.current?.querySelector<HTMLElement>(`[data-carousel-index="${bounded}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"})};
  const sync=(event:UIEvent<HTMLDivElement>)=>{const viewport=event.currentTarget;const items=[...viewport.querySelectorAll<HTMLElement>("[data-carousel-index]")];const nearest=items.reduce((best,item,position)=>Math.abs(item.offsetLeft-viewport.scrollLeft)<Math.abs(items[best]?.offsetLeft-viewport.scrollLeft)?position:best,0);setIndex(nearest)};
  return <div className="xp-article-feed__carousel"><div className="xp-article-feed__carousel-controls"><button type="button" onClick={()=>move(index-1)} disabled={index===0}>{carousel.previousLabel}</button><p aria-live="polite">{carousel.positionTemplate.replace("{current}",String(index+1)).replace("{total}",String(carousel.articleIds.length))}</p><button type="button" onClick={()=>move(index+1)} disabled={index===carousel.articleIds.length-1}>{carousel.nextLabel}</button></div><div className="xp-article-feed__carousel-track" ref={track} tabIndex={0} onScroll={sync} aria-label="Article carousel">{carousel.articleIds.map((id,position)=>{const article=model.articles.find((entry)=>entry.id===id)!;return <div data-carousel-index={position} data-active={position===index?"true":undefined} key={id}><ArticleCard model={model} article={article}/></div>})}</div></div>;
}

function RuntimeCollection({model}:{model:ResolvedArticleFeedFixture}) {
  const editorialRail=model.preset==="editorial-bento";
  return <div className="xp-article-feed__collection-shell">{editorialRail?<span className="xp-article-feed__rail-cue" aria-hidden="true"><span>←</span><span>→</span></span>:null}<div className="xp-article-feed__collection" data-editorial-rail={editorialRail?"true":undefined} tabIndex={editorialRail?0:undefined}>{model.articles.map((article)=><ArticleCard model={model} article={article} key={article.id}/>)}</div></div>
}

function Archive({model}:{model:ResolvedArticleFeedFixture}) {
  const archive=model.archive!; const [category,setCategory]=useState(archive.initialCategoryId); const [query,setQuery]=useState(model.stressSearchQuery??"");
  const results=useMemo(()=>{const needle=query.trim().toLocaleLowerCase();return model.articles.filter((article)=>{const categoryMatch=category===archive.categoryIds[0]||article.categoryIds.includes(category);const authors=article.authorIds.map((id)=>model.authors.find((author)=>author.id===id)?.name??"").join(" ");const categories=article.categoryIds.map((id)=>model.categories.find((item)=>item.id===id)?.label??"").join(" ");const haystack=[article.title,article.summary??"",authors,categories].join(" ").toLocaleLowerCase();return categoryMatch&&(!needle||haystack.includes(needle))})},[archive.categoryIds,category,model.articles,model.authors,model.categories,query]);
  return <div className="xp-article-feed__archive"><div className="xp-article-feed__archive-controls"><SegmentedControl label="Filter articles by category" value={category} onChange={setCategory} items={archive.categoryIds.map((id)=>({value:id,label:model.categories.find((item)=>item.id===id)?.label??id}))}/><label><span>{archive.search.label}</span><input type="search" value={query} placeholder={archive.search.placeholder} onChange={(event)=>setQuery(event.target.value)}/></label>{query?<button type="button" onClick={()=>setQuery("")}>{archive.search.clearLabel}</button>:null}</div><p className="xp-article-feed__result-status" aria-live="polite">{results.length?`${results.length} article${results.length===1?"":"s"}`:archive.search.noResults}</p>{results.length?<div className="xp-article-feed__collection">{results.map((article)=><ArticleCard model={model} article={article} key={article.id}/>)}</div>:<div className="xp-article-feed__no-results" role="status"><strong>{archive.search.noResults}</strong><button type="button" onClick={()=>{setCategory(archive.initialCategoryId);setQuery("")}}>Reset filters</button></div>}</div>;
}

function Ticker({model}:{model:ResolvedArticleFeedFixture}) {const [paused,setPaused]=useState(false);const ticker=model.ticker!;return <div className="xp-article-feed__ticker" data-ticker-state={paused?"paused":"running"}><div className="xp-article-feed__ticker-viewport"><div className="xp-article-feed__ticker-track" aria-hidden="true">{ticker.labels.map((label)=><span key={label}>{label}</span>)}</div></div><button type="button" aria-pressed={paused} onClick={()=>setPaused((value)=>!value)}>{paused?ticker.resumeLabel:ticker.pauseLabel}</button></div>}

function Preset({model}:{model:ResolvedArticleFeedFixture}) {
  if(model.preset==="subscription-grid")return <><Intro model={model}/><Newsletter model={model}/><RuntimeCollection model={model}/></>;
  if(model.preset==="article-carousel")return <><Intro model={model}/><Carousel model={model}/></>;
  if(model.preset==="searchable-archive")return <><Intro model={model}/><Archive model={model}/></>;
  if(model.preset==="editorial-bento"&&model.facet==="mixed-media")return <><Intro model={model}/><Ticker model={model}/><RuntimeCollection model={model}/></>;
  if(model.preset==="feature-stack") {const lead=new Set(model.leadIds??[]);return <><Intro model={model}/><div className="xp-article-feed__feature-stack"><div>{model.articles.filter((article)=>lead.has(article.id)).map((article)=><ArticleCard model={model} article={article} kind="lead" key={article.id}/>)}</div><div>{model.articles.filter((article)=>!lead.has(article.id)).map((article)=><ArticleCard model={model} article={article} kind="supporting" key={article.id}/>)}</div></div></>}
  if(model.preset==="ranked-mosaic") {const featured=new Set(model.featuredIds??[]);return <><Intro model={model}/><div className="xp-article-feed__ranked-mosaic"><div className="xp-article-feed__featured">{model.articles.filter((article)=>featured.has(article.id)).map((article)=><ArticleCard model={model} article={article} kind="featured" key={article.id}/>)}</div><div className="xp-article-feed__ranked">{model.articles.filter((article)=>!featured.has(article.id)).map((article)=><ArticleCard model={model} article={article} kind="ranked" key={article.id}/>)}</div></div></>}
  return <><Intro model={model}/><RuntimeCollection model={model}/></>;
}

const renderForm=({core,form}:{core:ResolvedArticleFeedFixture;form:string})=><div className="xp-article-feed__form" data-native-form={form}><Preset model={core}/></div>;
const renderers={mobile:renderForm,"tablet-portrait":renderForm,"tablet-landscape":renderForm,"desktop-standard":renderForm,"desktop-wide":renderForm};

export function ArticleFeed({fixture,media,stress,className}:ArticleFeedProperties) {
  const deviceClass=useDeviceClass(); const model=resolveArticleFeedFixture(fixture,stress,media);
  return <section className={["xp-article-feed",className].filter(Boolean).join(" ")} data-xp-owner="ArticleFeed" data-article-feed-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-facet={model.facet} data-device-class={deviceClass} data-stress={model.activeStress} data-build-state={model.heldMediaIds.size?"held-media":"runnable"}><MorphSlot className="xp-article-feed__morph" ladder={ladder} core={model} renderers={renderers}/></section>;
}
