"use client";

import { useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { resolveStageFixture, type ResolvedStageFixture, type StageFixture, type StageMediaAsset } from "./stage-model";

type StageStatus = "idle" | "invalid" | "pending" | "success" | "error";
type StageScenario = {
  status?: StageStatus;
  selectedId?: string;
  tabId?: string;
  paused?: boolean;
  quantity?: number;
};
type Properties = { fixture: StageFixture; media?: StageMediaAsset[]; stress?: string; scenario?: StageScenario; className?: string };
type ContentItem = ResolvedStageFixture["content"]["fields"][number];

const fieldType = (inputMode: string) => inputMode === "email" ? "email" : inputMode === "search" ? "search" : "text";
const safeIndex = (items: string[], selected?: string) => Math.max(0, items.indexOf(selected ?? items[0]));

function StageVector({ id, alt }: { id: string; alt: string }) {
  const seed = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
  const variant = seed % 4;
  return <svg className="xp-stage__vector" viewBox="0 0 160 64" role="img" aria-label={alt} data-stage-vector={id}>
    {variant === 0 ? <><path d="M18 45 42 18l24 27 24-27 24 27 28-25"/><circle cx="42" cy="18" r="5"/><circle cx="90" cy="18" r="5"/></> : null}
    {variant === 1 ? <><rect x="16" y="15" width="42" height="34" rx="17"/><path d="M74 18h69M74 32h52M74 46h63"/></> : null}
    {variant === 2 ? <><path d="M21 32c15-24 36-24 51 0s36 24 51 0 22-17 27-14"/><path d="M21 47c15-24 36-24 51 0"/></> : null}
    {variant === 3 ? <><path d="m23 43 18-27 18 27 18-27 18 27"/><rect x="110" y="17" width="34" height="30" rx="7"/></> : null}
  </svg>;
}

function StageCodeSurface({ seat, index }: { seat: ResolvedStageFixture["media"][number]; index: number }) {
  if (seat.role === "chart") {
    const points = index % 3 === 0 ? "0,76 32,54 64,62 96,30 128,41 160,16 192,28 224,8" : index % 3 === 1 ? "0,63 32,68 64,42 96,48 128,22 160,34 192,17 224,25" : "0,70 32,45 64,53 96,38 128,44 160,19 192,31 224,12";
    return <div className="xp-stage__code-card xp-stage__code-card--chart" role="img" aria-label={seat.alt} data-stage-code-seat={seat.id}>
      <span>Signal {String(index + 1).padStart(2, "0")}</span><strong>{72 + ((index * 7) % 25)}%</strong>
      <svg viewBox="0 0 224 84" aria-hidden="true"><polyline points={points}/><path d="M0 82h224"/></svg>
      <div aria-hidden="true">{[42, 67, 51, 79, 64].map((value, item) => <i key={item} style={{ "--stage-bar": `${value}%` } as React.CSSProperties}/>)}</div>
    </div>;
  }
  if (seat.role === "icon") return <div className="xp-stage__code-icon" role="img" aria-label={seat.alt} data-stage-code-seat={seat.id}><i/><i/><i/></div>;
  return <div className="xp-stage__system" role="img" aria-label={seat.alt} data-stage-code-seat={seat.id}>
    <header><i/><i/><i/><span>Workspace {String(index + 1).padStart(2, "0")}</span></header>
    <div className="xp-stage__system-body"><aside><i/><i/><i/><i/></aside><main><span/><strong/><span/><div><i/><i/><i/></div></main></div>
  </div>;
}

function StageMedia({ model, selectedIndex, deckOpen, setDeckOpen }: { model: ResolvedStageFixture; selectedIndex: number; deckOpen: boolean; setDeckOpen: (value: boolean) => void }) {
  const deckToggle = model.preset === "metric-montage" && model.media.length > 2;
  return <div className="xp-stage__media" data-stage-media-count={model.media.length} data-deck-open={deckOpen || undefined} aria-label="Stage media inventory">
    {model.media.map((seat, index) => <figure key={seat.id} className="xp-stage__media-seat" data-media-seat={seat.id} data-media-role={seat.role} data-media-state={seat.status} data-selected={index === selectedIndex || undefined}>
      {seat.status === "ready" && seat.asset ? <picture>
        {seat.asset.darkSrc ? <source media="(prefers-color-scheme: dark)" srcSet={seat.asset.darkSrc}/> : null}
        <img src={seat.asset.src} width={seat.asset.width} height={seat.asset.height} alt={seat.alt}/>
      </picture> : null}
      {seat.status === "hold" ? <div className="xp-stage__media-hold" role="img" aria-label={`${seat.alt}. Media production held.`}><span aria-hidden="true">{seat.role}</span><strong>Media seat held</strong><small>{seat.id}</small></div> : null}
      {seat.status === "vector" ? <StageVector id={seat.id} alt={seat.alt}/> : null}
      {seat.status === "code" ? <StageCodeSurface seat={seat} index={index}/> : null}
      <figcaption>{seat.alt}</figcaption>
    </figure>)}
    {deckToggle ? <button className="xp-stage__deck-toggle" type="button" aria-expanded={deckOpen} onClick={() => setDeckOpen(!deckOpen)}>{deckOpen ? "Close visual deck" : `View all ${model.media.length} visuals`}</button> : null}
  </div>;
}

function StatusLine({ status, message }: { status: StageStatus; message?: string }) {
  if (status === "idle" && !message) return <p className="xp-stage__status" aria-live="polite"/>;
  const copy = status === "invalid" ? "Complete the required field." : status === "pending" ? "Working…" : status === "success" ? "Done. Your request is ready." : status === "error" ? (message || "The request could not be completed.") : message;
  return <p className="xp-stage__status" role={status === "error" || status === "invalid" ? "alert" : "status"} aria-live="polite" data-status={status}>{copy}</p>;
}

function InputField({ item, inputMode, value, invalid, onChange }: { item: ContentItem; inputMode: string; value: string; invalid: boolean; onChange: (value: string) => void }) {
  const errorId = `${item.id}-error`;
  return <label className="xp-stage__field" data-field-id={item.id}><span>{item.label}</span><input id={item.id} name={item.id} type={fieldType(inputMode)} inputMode={inputMode === "prompt" ? "text" : inputMode as "email" | "search"} value={value} required aria-invalid={invalid || undefined} aria-describedby={invalid ? errorId : undefined} onChange={(event) => onChange(event.currentTarget.value)}/>{invalid ? <small id={errorId}>Enter a valid value.</small> : null}</label>;
}

function StageAttachmentView({ model, status, setStatus, selectedId, setSelectedId, activeTab, setActiveTab, paused, setPaused, quantity, setQuantity }: {
  model: ResolvedStageFixture; status: StageStatus; setStatus: (status: StageStatus) => void;
  selectedId: string; setSelectedId: (id: string) => void; activeTab: string; setActiveTab: (id: string) => void;
  paused: boolean; setPaused: (value: boolean) => void; quantity: number; setQuantity: (value: number) => void;
}) {
  const attachment = model.attachment;
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const submit = (event: FormEvent, fieldIds: string[], email = false) => {
    event.preventDefault();
    const invalid = fieldIds.some((id) => !values[id]?.trim()) || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values[fieldIds[0]] ?? ""));
    if (invalid) { setStatus("invalid"); return; }
    setStatus("pending"); window.setTimeout(() => setStatus("success"), 180);
  };
  const keyChoice = (event: KeyboardEvent<HTMLDivElement>, ids: string[]) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault(); const current = Math.max(0, ids.indexOf(selectedId)); const direction = event.key === "ArrowRight" ? 1 : -1;
    setSelectedId(ids[(current + direction + ids.length) % ids.length]);
  };
  if (attachment.kind === "none") return null;
  if (attachment.kind === "capture") {
    const item = model.content.fields.find(({ id }) => id === attachment.fieldId)!;
    const action = model.actions.find(({ id }) => id === attachment.submitActionId)!;
    return <form className="xp-stage__attachment xp-stage__capture" onSubmit={(event) => submit(event, [item.id], attachment.inputMode === "email")} noValidate>
      <InputField item={item} inputMode={attachment.inputMode} value={values[item.id] ?? ""} invalid={status === "invalid"} onChange={(value) => { setValues((current) => ({ ...current, [item.id]: value })); setStatus("idle"); }}/>
      <button type="submit" disabled={status === "pending"} data-emphasis={action.emphasis}>{action.label}</button><StatusLine status={status} message={model.content.status}/>
    </form>;
  }
  if (attachment.kind === "search") {
    const fields = attachment.fieldIds.map((id) => model.content.fields.find((item) => item.id === id)!);
    const tabs = (attachment.tabIds ?? []).map((id) => model.content.tabs.find((item) => item.id === id)!);
    const action = model.actions.find(({ id }) => id === attachment.submitActionId)!;
    return <form className="xp-stage__attachment xp-stage__search" onSubmit={(event) => submit(event, attachment.fieldIds)} noValidate>
      {tabs.length ? <div className="xp-stage__tabs" role="tablist" aria-label="Search mode">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div> : null}
      <div className="xp-stage__field-grid">{fields.map((item) => <InputField key={item.id} item={item} inputMode="search" value={values[item.id] ?? ""} invalid={status === "invalid" && !(values[item.id] ?? "").trim()} onChange={(value) => { setValues((current) => ({ ...current, [item.id]: value })); setStatus("idle"); }}/>)}</div>
      <button type="submit" disabled={status === "pending"} data-emphasis={action.emphasis}>{action.label}</button><StatusLine status={status} message={model.content.status}/>
    </form>;
  }
  if (attachment.kind === "copy-command") {
    const command = model.content.specs.find(({ id }) => id === attachment.valueId)!;
    const action = model.actions.find(({ id }) => id === attachment.copyActionId)!;
    const copy = async () => { try { await navigator.clipboard?.writeText(command.label); setStatus("success"); } catch { setStatus("error"); } };
    return <div className="xp-stage__attachment xp-stage__command"><code>{command.label}</code><button type="button" onClick={copy}>{action.label}</button><StatusLine status={status} message={model.content.status}/></div>;
  }
  if (attachment.kind === "choice-gallery") return <div className="xp-stage__attachment xp-stage__choices" role="radiogroup" aria-label="Choose a featured item" onKeyDown={(event) => keyChoice(event, attachment.choiceIds)}>
    {attachment.choiceIds.map((id) => { const choice = model.content.choices.find((item) => item.id === id)!; return <button type="button" role="radio" aria-checked={selectedId === id} tabIndex={selectedId === id ? 0 : -1} data-selected={selectedId === id || undefined} onClick={() => setSelectedId(id)} key={id}>{choice.label}</button>; })}
    {model.sourceKey === "hero-section-41" ? <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Resume Gallery" : "Pause Gallery"}</button> : null}
  </div>;
  if (attachment.kind === "commerce") return <div className="xp-stage__attachment xp-stage__commerce" data-stage-buy-box={attachment.buyBoxFixtureId}>
    <fieldset><legend>Choose a flavor</legend>{model.actions.filter(({ kind }) => kind === "select").map((action, index) => <button key={action.id} type="button" aria-pressed={selectedId === action.id || (!selectedId && index === 0)} onClick={() => setSelectedId(action.id)}>{action.label}</button>)}</fieldset>
    <div className="xp-stage__quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><label><span>Quantity</span><input type="number" min="1" max="12" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(12, event.currentTarget.valueAsNumber || 1)))}/></label><button type="button" aria-label="Increase quantity" disabled={quantity >= 12} onClick={() => setQuantity(Math.min(12, quantity + 1))}>+</button></div>
    <StatusLine status={status} message={model.content.status}/>
  </div>;
  if (attachment.kind === "rail") return <div className="xp-stage__attachment xp-stage__rail" role="region" aria-label={attachment.labelledBy}>{attachment.itemIds.map((id) => { const item = [...model.content.continuationItems, ...model.content.ornamentItems].find((candidate) => candidate.id === id); return <button type="button" key={id} onClick={() => setSelectedId(id)} aria-pressed={selectedId === id}>{item?.label ?? id}</button>; })}</div>;
  if (attachment.kind === "tabs-canvas") return <div className="xp-stage__attachment xp-stage__canvas-tabs"><div className="xp-stage__tabs" role="tablist" aria-label="Workflow canvas">{attachment.tabIds.map((id) => { const tab = model.content.tabs.find((item) => item.id === id)!; return <button key={id} type="button" role="tab" aria-selected={activeTab === id} tabIndex={activeTab === id ? 0 : -1} onClick={() => setActiveTab(id)}>{tab.label}</button>; })}</div><div role="tabpanel" tabIndex={0}><strong>{model.content.tabs.find(({ id }) => id === activeTab)?.label}</strong><span>Active workflow step</span></div></div>;
  const send = (event: FormEvent) => { event.preventDefault(); if (!draft.trim()) { setStatus("invalid"); return; } setStatus("pending"); window.setTimeout(() => { setStatus("success"); setDraft(""); }, 180); };
  return <form className="xp-stage__attachment xp-stage__chat" onSubmit={send} noValidate><div className="xp-stage__messages">{model.content.messages.map((message) => <p key={message.id} data-role={message.role}><span>{message.role}</span>{message.label}</p>)}{status === "success" ? <p data-role="user"><span>user</span>Command sent.</p> : null}</div><label><span>{model.content.fields.find(({ id }) => id === attachment.fieldId)?.label}</span><textarea value={draft} aria-invalid={status === "invalid" || undefined} onChange={(event) => { setDraft(event.currentTarget.value); setStatus("idle"); }}/></label><button type="submit" disabled={status === "pending"}>{model.actions.find(({ id }) => id === attachment.sendActionId)?.label}</button><StatusLine status={status} message={model.content.status}/></form>;
}

function ItemList({ label, items, className }: { label: string; items: ContentItem[]; className: string }) {
  if (!items.length) return null;
  return <section className={className} aria-label={label}>{items.map((item) => <article key={item.id} data-content-id={item.id}><strong>{item.title ?? item.label}</strong>{item.title ? <p>{item.label}</p> : null}{item.body ? <p>{item.body}</p> : null}{item.value ? <span>{item.value}</span> : null}</article>)}</section>;
}

export function Stage({ fixture, media = [], stress, scenario, className }: Properties) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => resolveStageFixture(fixture, stress, media), [fixture, stress, media]);
  const attachment = model.attachment;
  const choiceIds = attachment.kind === "choice-gallery" ? attachment.choiceIds : [];
  const initialSelected = scenario?.selectedId ?? (attachment.kind === "choice-gallery" ? attachment.selectedId : attachment.kind === "tabs-canvas" ? attachment.selectedId : "");
  const initialTab = scenario?.tabId ?? (attachment.kind === "search" ? attachment.tabIds?.[0] : attachment.kind === "tabs-canvas" ? attachment.selectedId : "") ?? "";
  const [status, setStatus] = useState<StageStatus>(scenario?.status ?? "idle");
  const [selectedId, setSelectedId] = useState(initialSelected);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [paused, setPaused] = useState(Boolean(scenario?.paused));
  const [quantity, setQuantity] = useState(scenario?.quantity ?? 1);
  const [deckOpen, setDeckOpen] = useState(false);
  const stageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (model.sourceKey !== "hero-section-41" || paused || choiceIds.length < 2) return;
    const timer = window.setInterval(() => setSelectedId((current) => choiceIds[(safeIndex(choiceIds, current) + 1) % choiceIds.length]), 5000);
    return () => window.clearInterval(timer);
  }, [choiceIds, model.sourceKey, paused]);
  const selectedIndex = attachment.kind === "choice-gallery" ? safeIndex(attachment.choiceIds, selectedId) : attachment.kind === "commerce" ? Math.max(0, model.actions.filter(({ kind }) => kind === "select").findIndex(({ id }) => id === selectedId)) : 0;
  const form = model.forms[deviceClass];
  const genericActions = model.actions.filter(({ kind }) => !["submit", "copy", "select", "pause"].includes(kind));
  const action = (item: ResolvedStageFixture["actions"][number]) => item.kind === "link" ? <a key={item.id} href={item.href} data-emphasis={item.emphasis}>{item.label}</a> : <button key={item.id} type="button" data-emphasis={item.emphasis} onClick={() => item.kind === "scroll" ? stageRef.current?.querySelector(".xp-stage__continuation")?.scrollIntoView({ block: "nearest" }) : setStatus("success")}>{item.label}</button>;
  return <section ref={stageRef} className={["xp-stage", className].filter(Boolean).join(" ")} data-xp-stage data-xp-owner="Stage" data-stage-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-composition={form.composition} data-media-form={form.media} data-proof-form={form.proof} data-fold-mode={model.foldMode} data-tone={model.tone} data-device-class={deviceClass} data-stage-form={deviceClass} data-stress={stress ?? "base"} data-terminal-eligible={model.terminalEligible || undefined} aria-labelledby={`${model.sourceKey}-title`}>
    <div className="xp-stage__launch">
      <header className="xp-stage__claim">{model.claim.eyebrow ? <p className="xp-stage__eyebrow">{model.claim.eyebrow}</p> : null}<h1 id={`${model.sourceKey}-title`}>{deviceClass === "M" || deviceClass === "TP" ? model.claim.headline.compact : model.claim.headline.standard}</h1>{model.claim.lede ? <p className="xp-stage__lede">{deviceClass === "M" ? model.claim.lede.compact : model.claim.lede.standard}</p> : null}{genericActions.length ? <div className="xp-stage__actions">{genericActions.map(action)}</div> : null}</header>
      <StageAttachmentView model={model} status={status} setStatus={setStatus} selectedId={selectedId} setSelectedId={setSelectedId} activeTab={activeTab} setActiveTab={setActiveTab} paused={paused} setPaused={setPaused} quantity={quantity} setQuantity={setQuantity}/>
      <StageMedia model={model} selectedIndex={selectedIndex} deckOpen={deckOpen} setDeckOpen={setDeckOpen}/>
      <ItemList label="Proof" items={model.content.proofItems} className="xp-stage__proof"/>
    </div>
    <div className="xp-stage__continuation" data-stage-continuation={model.foldMode !== "launch" || undefined}>
      <ItemList label="Continuation" items={model.content.continuationItems} className="xp-stage__content-rail"/>
      <ItemList label="Specifications" items={model.content.specs} className="xp-stage__specs"/>
      <ItemList label="Statistics" items={model.content.stats} className="xp-stage__stats"/>
      <ItemList label="Ornaments" items={model.content.ornamentItems} className="xp-stage__ornaments"/>
    </div>
  </section>;
}
