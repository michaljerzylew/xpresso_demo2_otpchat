"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { AdaptiveOverlay, DisclosureGroup, MorphSlot, SnapRail } from "@xp/primitives";
import {
  ANSWER_FORM_LADDER,
  resolveAnswersFixture,
  type AnswerAction,
  type AnswerDeviceForm,
  type AnswerMedia,
  type AnswerProof,
  type AnswerRecord,
  type AnswerStressKey,
  type AnswersFixture,
  type AnswersMediaMap,
  type ResolvedAnswersFixture,
} from "./answers-model";

export type AnswersProperties = { fixture: AnswersFixture; mediaMap: AnswersMediaMap; stress?: AnswerStressKey; className?: string };
type AnswersView = {
  model: ResolvedAnswersFixture;
  query: string;
  setQuery: (value: string) => void;
  activeCategoryId?: string;
  setActiveCategoryId: (value: string) => void;
  filteredAnswers: AnswerRecord[];
  openIds: string[];
  setOpenIds: (value: string[]) => void;
  activeAnswerId: string;
  setActiveAnswerId: (value: string) => void;
  detailAnswerId?: string;
  setDetailAnswerId: (value: string | undefined) => void;
  wideSlot: boolean;
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

function AnswerLink({ action, autoFocus = false }: { action: AnswerAction; autoFocus?: boolean }) {
  return (
    <a className="xp-answers__action" data-action-id={action.id} data-action-kind={action.kind} data-xp-control href={action.href} autoFocus={autoFocus || undefined} rel={action.external ? "noreferrer" : undefined} target={action.external ? "_blank" : undefined}>
      {action.label}{action.external ? <span className="xp-answers__sr-only">, opens in a new tab</span> : null}<span aria-hidden="true">↗</span>
    </a>
  );
}

function AnswersIntro({ model }: { model: ResolvedAnswersFixture }) {
  return (
    <header className="xp-answers__intro" data-answers-intro>
      {model.intro.eyebrow ? <p className="xp-answers__eyebrow">{model.intro.eyebrow}</p> : null}
      <h1 id={`${model.sourceKey}-title`}>{model.intro.heading}</h1>
      {model.intro.description ? <p className="xp-answers__description">{model.intro.description}</p> : null}
    </header>
  );
}

function Search({ view }: { view: AnswersView }) {
  if (!view.model.behavior.searchable) return null;
  return (
    <div className="xp-answers__search" role="search">
      <label htmlFor={`${view.model.sourceKey}-search`}>Search answers</label>
      <div><span aria-hidden="true">⌕</span><input id={`${view.model.sourceKey}-search`} type="search" value={view.query} onChange={(event) => view.setQuery(event.currentTarget.value)} /></div>
      <p aria-live="polite">{view.filteredAnswers.length ? `${view.filteredAnswers.length} ${view.model.announcements.resultCount}` : view.model.announcements.emptySearch}</p>
    </div>
  );
}

function focusSibling(event: KeyboardEvent<HTMLElement>, selector: string) {
  if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
  const controls = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(selector)].filter((button) => !button.disabled);
  const current = controls.indexOf(event.target as HTMLButtonElement);
  if (current < 0 || controls.length < 2) return;
  event.preventDefault();
  const next = event.key === "Home" ? 0 : event.key === "End" ? controls.length - 1 : (current + (["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1) + controls.length) % controls.length;
  controls[next]?.focus();
}

function Categories({ view }: { view: AnswersView }) {
  const categories = view.model.categories ?? [];
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (view.model.sourceKey !== "faq-component-13") return;
    const rail = railRef.current;
    const selected = rail?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
    if (!rail || !selected || rail.scrollWidth <= rail.clientWidth) return;
    const centeredLeft = selected.offsetLeft - (rail.clientWidth - selected.offsetWidth) / 2;
    const targetLeft = Math.max(0, Math.min(centeredLeft, rail.scrollWidth - rail.clientWidth));
    rail.scrollTo({ left: targetLeft, behavior: "auto" });
  }, [view.activeCategoryId, view.model.sourceKey]);
  if (!categories.length) return null;
  return (
    <div className="xp-answers__categories" role="tablist" aria-label={view.model.intro.heading} onKeyDown={(event) => focusSibling(event, "[role=tab]")} ref={railRef}>
      {categories.map((category) => {
        const selected = category.id === view.activeCategoryId;
        return <button type="button" role="tab" aria-selected={selected} tabIndex={selected ? 0 : -1} data-category-id={category.id} data-xp-control key={category.id} onClick={() => view.setActiveCategoryId(category.id)}>{category.icon ? <span aria-hidden="true" data-icon={category.icon} /> : null}{category.label}</button>;
      })}
    </div>
  );
}

function ownedActions(model: ResolvedAnswersFixture, answer: AnswerRecord) {
  const ids = new Set(answer.actionIds ?? []);
  return model.actions.filter(({ id }) => ids.has(id));
}

function AnswerContents({ answer, model }: { answer: AnswerRecord; model: ResolvedAnswersFixture }) {
  const proof = answer.proofId ? model.proofs?.find(({ id }) => id === answer.proofId) : undefined;
  return (
    <div className="xp-answers__answer-body">
      {answer.qualifier ? <p className="xp-answers__qualifier">{answer.qualifier}</p> : null}
      <p>{answer.answer}</p>
      {proof ? <ProofScene model={model} proof={proof} /> : null}
      {ownedActions(model, answer).map((action) => <AnswerLink action={action} autoFocus={model.activeStress === "contextActionFocus"} key={action.id} />)}
    </div>
  );
}

function AnswerBody({ answer, view, compact = false }: { answer: AnswerRecord; view: AnswersView; compact?: boolean }) {
  const long = compact && answer.answer.length > 180;
  if (!long) return <AnswerContents answer={answer} model={view.model} />;
  return <div className="xp-answers__answer-body"><p>{answer.answer.slice(0, 160).trimEnd()}…</p><AdaptiveOverlay intent="detail" open={view.detailAnswerId === answer.id} onOpenChange={(open) => view.setDetailAnswerId(open ? answer.id : undefined)}><AdaptiveOverlay.Trigger>Read complete answer</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-answers__detail-overlay"><AdaptiveOverlay.Header title={answer.question} description={answer.qualifier} closeLabel="Close answer" /><AdaptiveOverlay.Body><AnswerContents answer={answer} model={view.model} /></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay></div>;
}

function DisclosureAnswers({ view, form, className }: { view: AnswersView; form: AnswerDeviceForm; className?: string }) {
  const compact = form === "M" || form === "TP" || !view.wideSlot;
  const expandedWall = view.model.behavior.wideWall && view.model.wideWallEligible && !compact;
  const multiple = !compact || view.model.preset === "dual-lane-disclosure" || view.model.preset === "category-tile-disclosure";
  return (
    <div className={["xp-answers__disclosures", className].filter(Boolean).join(" ")} data-wide-wall={expandedWall ? "true" : "false"} data-answer-count={view.filteredAnswers.length} onKeyDown={(event) => focusSibling(event, ".xp-disclosure__trigger")}>
      <DisclosureGroup
        label={view.model.intro.heading}
        items={view.filteredAnswers.map((answer) => ({
          id: answer.id,
          title: <span data-answer-id={answer.id}><span className="xp-answers__question-text">{answer.question}</span>{answer.qualifier ? <small className="xp-answers__question-qualifier">{answer.qualifier}</small> : null}</span>,
          content: <AnswerBody answer={answer} view={view} compact={compact} />,
        }))}
        multiple={multiple}
        openIds={expandedWall ? view.filteredAnswers.map(({ id }) => id) : view.openIds}
        onOpenChange={(ids) => view.setOpenIds(compact && ids.length > 1 ? ids.slice(-1) : ids)}
        wallBehavior={expandedWall ? "expanded" : "interactive"}
      />
    </div>
  );
}

function MediaSeat({ model, seat, form }: { model: ResolvedAnswersFixture; seat: AnswerMedia; form: AnswerDeviceForm }) {
  const record = model.mediaBySeatId.get(seat.id);
  const held = record?.status === "MISSING-SEAT";
  const failed = model.failedMediaIds.has(seat.id);
  if (!record || held || failed) {
    const decorativeHold = held && !failed && !seat.alt;
    const fallbackAlt = record?.alt || seat.alt;
    return (
      <div className="xp-answers__media-fallback" data-media-seat-id={seat.id} data-media-status={held && !failed ? "hold" : "error"} role={decorativeHold ? undefined : fallbackAlt ? "img" : "status"} aria-hidden={decorativeHold ? "true" : undefined} aria-label={!decorativeHold && fallbackAlt ? `${fallbackAlt}. ${model.announcements.mediaError}` : undefined} aria-live={!decorativeHold && !fallbackAlt ? "polite" : undefined}>
        <span aria-hidden="true" />
        <p>{model.announcements.mediaError}</p>
      </div>
    );
  }
  const position = record.crops?.[form]?.objectPosition ?? `${seat.focalPoint?.x ?? 50}% ${seat.focalPoint?.y ?? 50}%`;
  if (record.disposition === "deterministic-vector" && record.src) {
    return (
      <span className="xp-answers__picture" data-media-kind="art-3d" data-media-seat-id={seat.id} data-media-status="resolved">
        <img src={record.src} alt={record.alt} loading="eager" decoding="async" />
      </span>
    );
  }
  return (
    <picture className="xp-answers__picture" data-media-kind="photo" data-media-seat-id={seat.id} data-media-status="resolved" style={{ "--xp-answers-focal": position } as CSSProperties}>
      <source type="image/avif" srcSet={`${record.publicBase}-640.avif 640w, ${record.publicBase}-1280.avif 1280w, ${record.publicBase}-1920.avif 1920w`} />
      <source type="image/webp" srcSet={`${record.publicBase}-640.webp 640w, ${record.publicBase}-1280.webp 1280w, ${record.publicBase}-1920.webp 1920w`} />
      <img src={`${record.publicBase}-1280.jpg`} alt={record.alt} loading="lazy" decoding="async" />
    </picture>
  );
}

function AnalyticsScene() {
  return <div className="xp-answers__proof-ui" data-proof-scene="analytics"><header><div><strong>Northline Field Ops</strong><small>Last 14 days</small></div><span>Live</span></header><dl><div><dt>Active runs</dt><dd>184</dd></div><div><dt>Completed</dt><dd>96.4%</dd></div><div><dt>Median review</dt><dd>18 min</dd></div></dl><div className="xp-answers__chart" aria-label="Series: 72, 81, 77, 89, 93, 91, 96">{[72,81,77,89,93,91,96].map((value) => <i key={value} style={{ "--value": value } as CSSProperties} />)}</div><div className="xp-answers__segments"><b>All</b><span>Field</span><span>Review</span></div></div>;
}

function ProfileScene() {
  return <div className="xp-answers__proof-ui" data-proof-scene="profile-editor"><header><div><strong>Mara Venn</strong><small>usr_avalon_204</small></div><span>Saved locally</span></header><dl><div><dt>Role</dt><dd>Operations reviewer</dd></div><div><dt>Timezone</dt><dd>Europe/Warsaw</dd></div><div><dt>Language</dt><dd>English (UK)</dd></div></dl><p><span aria-hidden="true">✓</span> Digest enabled</p></div>;
}

function OrdersScene() {
  const rows = [["NX-2048","Ready","12 units"],["NX-2049","Review","4 units"],["NX-2050","Held","18 units"]];
  return <div className="xp-answers__proof-ui" data-proof-scene="order-operations"><header><div><strong>Needs attention</strong><small>14:30–16:00 · Ivo Chen</small></div><span>NX-2049</span></header><div className="xp-answers__proof-table">{rows.map(([id,state,units]) => <div data-selected={id === "NX-2049" ? "true" : undefined} key={id}><b>{id}</b><span>{state}</span><small>{units}</small></div>)}</div></div>;
}

function ProofScene({ model, proof }: { model: ResolvedAnswersFixture; proof: AnswerProof }) {
  if (model.failedProofIds.has(proof.id)) return <div className="xp-answers__proof-fallback" data-proof-id={proof.id} data-proof-status="error" role="status"><strong>{proof.title}</strong><p>{model.announcements.proofError}</p></div>;
  return <section className="xp-answers__proof" data-proof-id={proof.id} data-proof-status="live" aria-label={proof.title}>{proof.scene === "analytics" ? <AnalyticsScene /> : proof.scene === "profile-editor" ? <ProfileScene /> : <OrdersScene />}</section>;
}

function GuidedAnswers({ view }: { view: AnswersView }) {
  const activeIndex = Math.max(0, view.model.answers.findIndex(({ id }) => id === view.activeAnswerId));
  const active = view.model.answers[activeIndex] ?? view.model.answers[0];
  const select = (index: number) => view.setActiveAnswerId(view.model.answers[Math.max(0, Math.min(index, view.model.answers.length - 1))]?.id ?? active.id);
  return (
    <div className="xp-answers__guided" onKeyDown={(event) => { if (["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) { event.preventDefault(); select(event.key === "Home" ? 0 : event.key === "End" ? view.model.answers.length - 1 : activeIndex + (event.key === "ArrowRight" ? 1 : -1)); } }}>
      <SnapRail label={view.model.intro.heading} paginationLabel="Answer positions" markerLabel={(index) => `Go to answer ${index}`} markers="none">
        {view.model.answers.map((answer, index) => <article data-xp-rail-item data-answer-id={answer.id} data-selected={answer.id === active.id ? "true" : undefined} key={answer.id}><button type="button" aria-pressed={answer.id === active.id} onClick={() => select(index)}><span className="xp-answers__guided-ordinal">{String(index + 1).padStart(2,"0")}</span><span className="xp-answers__guided-question">{answer.question}</span></button>{ownedActions(view.model, answer).map((action) => <AnswerLink action={action} key={action.id} />)}</article>)}
      </SnapRail>
      <article className="xp-answers__guided-detail" data-active-answer-id={active.id}><small>{activeIndex + 1} / {view.model.answers.length}</small><h2>{active.question}</h2><AnswerBody answer={{ ...active, actionIds: [] }} view={view} /><div className="xp-answers__guided-controls"><button type="button" data-xp-control disabled={activeIndex === 0} onClick={() => select(activeIndex - 1)}>← Previous</button><button type="button" data-xp-control disabled={activeIndex === view.model.answers.length - 1} onClick={() => select(activeIndex + 1)}>Next →</button></div></article>
    </div>
  );
}

function SupportPanel({ view, form }: { view: AnswersView; form: AnswerDeviceForm }) {
  const actions = view.model.actions.filter(({ kind }) => kind === "promotion" || kind === "escape");
  const escape = actions.find(({ kind }) => kind === "escape");
  const seat = view.model.media?.[0];
  return <aside className="xp-answers__support-panel" aria-label={escape?.label}>{seat ? <MediaSeat model={view.model} seat={seat} form={form} /> : <span className="xp-answers__support-orbit" aria-hidden="true" />}<div>{actions.map((action) => <AnswerLink action={action} autoFocus={view.model.activeStress === (action.kind === "promotion" ? "promotionFocus" : "escapeFocus")} key={action.id} />)}</div></aside>;
}

function TeaserAnswers({ view }: { view: AnswersView }) {
  return <div className="xp-answers__teaser">{view.model.answers.map((answer) => <article data-answer-id={answer.id} key={answer.id}><h2>{answer.question}</h2><AnswerContents answer={answer} model={view.model} /></article>)}</div>;
}

function AnswersComposition({ view, form }: { view: AnswersView; form: AnswerDeviceForm }) {
  const model = view.model;
  if (model.composition === "guided-rail") return <GuidedAnswers view={view} />;
  if (model.composition === "support-split") return <div className="xp-answers__split"><DisclosureAnswers view={view} form={form} /><SupportPanel view={view} form={form} /></div>;
  if (model.composition === "media-split") return <div className="xp-answers__split xp-answers__split--media"><DisclosureAnswers view={view} form={form} /><div className="xp-answers__media-panel">{model.media?.map((seat) => <MediaSeat model={model} seat={seat} form={form} key={seat.id} />)}</div></div>;
  if (model.composition === "categorized") return <><Categories view={view} /><DisclosureAnswers view={view} form={form} /></>;
  if (model.composition === "teaser") return <TeaserAnswers view={view} />;
  return <DisclosureAnswers view={view} form={form} className={model.composition === "wall" || model.composition === "proof-wall" ? "xp-answers__wall" : undefined} />;
}

const nativeForm = (core: AnswersView, form: AnswerDeviceForm) => <div className="xp-answers__form" data-native-form={form} data-device={form}><AnswersComposition view={core} form={form} /></div>;
const renderers = {
  M: ({ core }: { core: AnswersView }) => nativeForm(core, "M"),
  TP: ({ core }: { core: AnswersView }) => nativeForm(core, "TP"),
  TL: ({ core }: { core: AnswersView }) => nativeForm(core, "TL"),
  DS: ({ core }: { core: AnswersView }) => nativeForm(core, "DS"),
  DW: ({ core }: { core: AnswersView }) => nativeForm(core, "DW"),
};

function initialOpen(model: ResolvedAnswersFixture) {
  const last = model.answers.at(-1)?.id;
  if (model.activeStress === "allOpen") return model.answers.map(({ id }) => id);
  if (model.activeStress === "twoOpen") return model.answers.slice(0, 2).map(({ id }) => id);
  if (["lastOpen","lastQuestion","answerLast","bottom"].includes(model.activeStress ?? "") && last) return [last];
  return [model.behavior.initialAnswerId ?? model.answers[0]?.id].filter(Boolean) as string[];
}

function searchNeedle(model: ResolvedAnswersFixture) {
  for (const answer of model.answers) for (const token of answer.question.split(/\W+/).filter((value) => value.length >= 5)) {
    const needle = normalize(token);
    const matches = model.answers.filter((candidate) => normalize([candidate.question,candidate.qualifier,candidate.answer].filter(Boolean).join(" ")).includes(needle)).length;
    if (matches > 0 && matches < model.answers.length) return token;
  }
  return model.answers[0]?.question ?? "";
}

function initialCategory(model: ResolvedAnswersFixture, stress?: AnswerStressKey) {
  if (stress === "categoryLast") return model.categories?.at(-1)?.id;
  if (stress === "answerLast") return model.answers.at(-1)?.categoryId ?? model.behavior.initialCategoryId ?? model.categories?.[0]?.id;
  return model.behavior.initialCategoryId ?? model.categories?.[0]?.id;
}

export function Answers({ fixture, mediaMap, stress, className }: AnswersProperties) {
  const model = useMemo(() => resolveAnswersFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [slotWidth, setSlotWidth] = useState(0);
  const [query, setQuery] = useState(() => stress === "searchEmpty" ? "zz-no-answer" : stress === "searchFiltered" ? searchNeedle(model) : "");
  const [activeCategoryId, setActiveCategoryId] = useState(() => initialCategory(model,stress));
  const [openIds, setOpenIds] = useState(() => initialOpen(model));
  const [activeAnswerId, setActiveAnswerId] = useState(() => ["last","selectedLast","proofLast"].includes(stress ?? "") ? model.answers.at(-1)?.id ?? model.answers[0].id : stress === "next" ? model.answers[1]?.id ?? model.answers[0].id : model.behavior.initialAnswerId ?? model.answers[0].id);
  const [detailAnswerId, setDetailAnswerId] = useState<string>();
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setSlotWidth(entry?.contentRect.width ?? 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setQuery(stress === "searchEmpty" ? "zz-no-answer" : stress === "searchFiltered" ? searchNeedle(model) : "");
    setActiveCategoryId(initialCategory(model,stress));
    setOpenIds(initialOpen(model));
    setActiveAnswerId(["last","selectedLast","proofLast"].includes(stress ?? "") ? model.answers.at(-1)?.id ?? model.answers[0].id : stress === "next" ? model.answers[1]?.id ?? model.answers[0].id : model.behavior.initialAnswerId ?? model.answers[0].id);
    setDetailAnswerId(undefined);
  }, [model, stress]);
  const filteredAnswers = useMemo(() => {
    const needle = normalize(query.trim());
    return model.answers.filter((answer) => (!needle ? !activeCategoryId || answer.categoryId === activeCategoryId : normalize([answer.question,answer.qualifier,answer.answer].filter(Boolean).join(" ")).includes(needle)));
  }, [activeCategoryId, model.answers, query]);
  const view: AnswersView = { model,query,setQuery,activeCategoryId,setActiveCategoryId,filteredAnswers,openIds,setOpenIds,activeAnswerId,setActiveAnswerId,detailAnswerId,setDetailAnswerId,wideSlot:slotWidth >= 720 };
  const escape = model.actions.find(({ id }) => id === model.escapeHatchActionId)!;
  return (
    <section className={["xp-answers", className].filter(Boolean).join(" ")} data-xp-answers data-answers-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-composition={model.composition} data-stress={stress ?? "base"} aria-labelledby={`${model.sourceKey}-title`}>
      <div className="xp-answers__container" ref={containerRef}>
        <AnswersIntro model={model} />
        <Search view={view} />
        <MorphSlot className="xp-answers__morph" ladder={ANSWER_FORM_LADDER} core={view} renderers={renderers} />
        {model.composition === "support-split" ? null : <footer className="xp-answers__escape"><AnswerLink action={escape} autoFocus={stress === "escapeFocus"} /></footer>}
        <p className="xp-answers__sr-only" aria-live="assertive">{stress === "error" ? model.announcements.error : ""}</p>
      </div>
    </section>
  );
}
