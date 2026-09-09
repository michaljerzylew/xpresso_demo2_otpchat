"use client";

import { useDeviceClass } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type TouchEvent } from "react";
import { resolveLaunchHeroFixture, type LaunchHeroCopyMode, type LaunchHeroFixture, type LaunchHeroMediaMap, type LaunchHeroStatus, type ResolvedLaunchHeroFixture, type ResolvedLaunchHeroMedia } from "./launch-hero-model";

export type LaunchHeroScenario = {
  status?: LaunchHeroStatus;
  selectedStoryId?: string;
  nowIso?: string;
  menuOpen?: boolean;
  reducedMotion?: boolean;
  proofMotion?: "running" | "paused" | "static";
  storyMode?: "auto" | "selected" | "paused" | "reduced";
};

type Properties = { fixture: LaunchHeroFixture; media: LaunchHeroMediaMap; copyMode?: LaunchHeroCopyMode; scenario?: LaunchHeroScenario; className?: string };
type View = { model: ResolvedLaunchHeroFixture; status: LaunchHeroStatus; setStatus: (status: LaunchHeroStatus) => void; selectedStoryId: string; selectStory: (id: string) => void; storyMode: "auto" | "selected" | "paused" | "reduced"; pauseStory: () => void; proofMotion: "running" | "paused" | "reduced" | "static"; pauseProof: () => void; email: string; setEmail: (value: string) => void; nowIso: string };
const forms = { M: "mobile-focus-cover", TP: "tablet-portrait-proof-stack", TL: "tablet-landscape-split", DS: "desktop-standard-proof-stage", DW: "desktop-wide-proof-stage" } as const;
const record = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const list = (value: unknown) => Array.isArray(value) ? value.map(record) : [];
const key = (value: unknown) => typeof value === "string" ? value : "";
const text = (view: View, value: unknown) => view.model.activeCopy[key(value)] ?? key(value);

function Picture({ media, alt, className }: { media?: ResolvedLaunchHeroMedia; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const node = image.current;
    if (!node) return;
    let frame = 0;
    const reconcile = () => {
      if (!node.complete) { frame = window.requestAnimationFrame(reconcile); return; }
      if (node.naturalWidth === 0) setFailed(true);
    };
    reconcile();
    return () => window.cancelAnimationFrame(frame);
  }, [media]);
  if (!media || media.status !== "ready" || !media.sources?.jpg || !media.fallback) return <span className={["xp-launch-hero__media-hold", className].filter(Boolean).join(" ")} data-media-status={media?.status ?? "missing"} aria-label="Original media pending"/>;
  if (failed) return <span className={["xp-launch-hero__media-hold", "xp-launch-hero__media-fallback", className].filter(Boolean).join(" ")} data-media-seat={media.seatId} data-media-status="fallback" aria-label={alt ? `${alt} image unavailable` : "Image unavailable"}/>;
  return <picture className={className} data-media-seat={media.seatId}>{media.sources.avif ? <source type="image/avif" srcSet={media.sources.avif}/> : null}{media.sources.webp ? <source type="image/webp" srcSet={media.sources.webp}/> : null}<img ref={image} src={media.fallback} srcSet={media.sources.jpg} sizes="(max-width: 48rem) 100vw, 50vw" alt={alt} onError={() => setFailed(true)}/></picture>;
}

function AvatarRail({ view, ids, labelKey }: { view: View; ids: string[]; labelKey?: unknown }) {
  return <div className="xp-launch-hero__avatars" aria-label={labelKey ? text(view, labelKey) : "Community members"}>{ids.map((id) => <Picture key={id} media={view.model.mediaBySeat[id]} alt=""/>)}</div>;
}

function Capture({ view }: { view: View }) {
  const { capture, sourceKey } = view.model;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) { view.setStatus("invalid"); return; }
    view.setStatus("pending");
    window.setTimeout(() => view.setStatus("success"), 450);
  };
  if (view.status === "success") return <div className="xp-launch-hero__capture-result" role="status"><strong>{text(view, capture.states.success)}</strong></div>;
  const stateKey = view.status === "idle" ? undefined : capture.states[view.status];
  return <form className="xp-launch-hero__capture" action={capture.action} method="post" onSubmit={submit} data-capture-owner={sourceKey}>
    <label htmlFor={`${sourceKey}-email`}>{text(view, capture.email.labelKey)}</label>
    <div className="xp-launch-hero__capture-row"><input id={`${sourceKey}-email`} name="email" type="email" inputMode="email" autoComplete="email" required value={view.email} placeholder={text(view, capture.email.placeholderKey)} aria-invalid={view.status === "invalid" || view.status === "error" || undefined} aria-describedby={stateKey ? `${sourceKey}-capture-status` : undefined} onInvalid={() => view.setStatus("invalid")} onChange={(event) => { view.setEmail(event.target.value); if (view.status !== "idle") view.setStatus("idle"); }}/><button type="submit" disabled={view.status === "pending"}>{text(view, view.status === "pending" ? capture.states.pending : capture.submitLabelKey)}</button></div>
    {stateKey ? <p id={`${sourceKey}-capture-status`} className="xp-launch-hero__capture-status" role={view.status === "error" || view.status === "invalid" ? "alert" : "status"}>{text(view, stateKey)}</p> : null}
  </form>;
}

function Header({ view, open }: { view: View; open?: boolean }) {
  const navigation = view.model.navigation ?? [];
  return <header className="xp-launch-hero__header">
    {view.model.identity ? <a className="xp-launch-hero__identity" href={view.model.identity.homeHref}>{text(view, view.model.identity.nameKey)}</a> : <span className="xp-launch-hero__identity">{text(view, "badge")}</span>}
    {navigation.length ? <details className="xp-launch-hero__navigation" open={open} onKeyDown={(event) => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}><summary>Menu</summary><nav aria-label="Launch navigation">{navigation.map((item) => <a key={item.href} href={item.href}>{text(view, item.labelKey)}</a>)}</nav></details> : null}
    {view.model.headerAction ? <a className="xp-launch-hero__header-action" href={view.model.headerAction.href}>{text(view, view.model.headerAction.labelKey)}</a> : null}
  </header>;
}

function Pitch({ view, children, capture = true }: { view: View; children?: ReactNode; capture?: boolean }) {
  return <div className="xp-launch-hero__pitch"><h1 id={`${view.model.sourceKey}-title`}>{text(view, "headline")}</h1><p>{text(view, "body")}</p>{capture ? <Capture view={view}/> : null}{children}</div>;
}

function Testimonials({ view }: { view: View }) {
  const items = list(view.model.proof.testimonials);
  return <section className="xp-launch-hero__testimonials" aria-label={text(view, view.model.proof.countKey)} data-proof-motion={view.proofMotion} onMouseEnter={view.pauseProof} onFocus={view.pauseProof} onPointerDown={view.pauseProof}><div className="xp-launch-hero__testimonial-track">{items.map((item) => <article key={key(item.id)}><Picture media={view.model.mediaBySeat[key(item.mediaSeatId)]} alt={text(view, item.authorKey)}/><div><blockquote>{text(view, item.bodyKey)}</blockquote><footer><strong>{text(view, item.authorKey)}</strong><time>{text(view, item.dateKey)}</time></footer></div></article>)}</div></section>;
}

function StoryProof({ view }: { view: View }) {
  const stories = view.model.stories ?? [], active = stories.find(({ id }) => id === view.selectedStoryId) ?? stories[0]!;
  const touchStart = useRef(0);
  const move = (offset: number) => { const index = stories.findIndex(({ id }) => id === active.id); view.selectStory(stories[(index + offset + stories.length) % stories.length]!.id); };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") { event.preventDefault(); const target = event.key === "Home" ? stories[0] : event.key === "End" ? stories.at(-1) : stories[(stories.findIndex(({ id }) => id === active.id) + (event.key === "ArrowRight" ? 1 : -1) + stories.length) % stories.length]; if (target) view.selectStory(target.id); } };
  const endTouch = (event: TouchEvent<HTMLElement>) => { const delta = event.changedTouches[0]!.clientX - touchStart.current; if (Math.abs(delta) >= 42) move(delta < 0 ? 1 : -1); };
  return <section className="xp-launch-hero__story" data-story-mode={view.storyMode} onMouseEnter={view.pauseStory} onFocus={view.pauseStory} onTouchStart={(event) => { touchStart.current = event.touches[0]!.clientX; view.pauseStory(); }} onTouchEnd={endTouch}><Picture media={view.model.mediaBySeat[key(view.model.proof.teamMediaSeatId)]} alt={text(view, view.model.proof.countKey)}/><div className="xp-launch-hero__story-copy"><span className="xp-launch-hero__story-symbol" aria-hidden="true">{String(stories.findIndex(({ id }) => id === active.id) + 1).padStart(2, "0")}</span><h2>{text(view, active.titleKey)}</h2><p>{text(view, active.bodyKey)}</p><div className="xp-launch-hero__story-controls" aria-label="Select launch story" onKeyDown={keyboard}>{stories.map((story) => <button type="button" key={story.id} aria-pressed={story.id === active.id} onClick={() => view.selectStory(story.id)}>{text(view, story.selectorLabelKey)}</button>)}</div></div></section>;
}

const money = (minor: number, currency = "USD") => new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(minor / 100);
function FinanceProof({ view }: { view: View }) {
  const phone = record(view.model.proof.phone), data = record(phone.data), panels = list(view.model.proof.panels);
  return <section className="xp-launch-hero__finance" data-background-status={view.model.mediaBySeat[key(view.model.proof.backgroundSeatId)]?.status}>
    <article className="xp-launch-hero__phone" data-runtime-ui-seat={phone.mediaSeatId}><span>{text(view, phone.labelKey)}</span><strong>{money(Number(data.availableMinor ?? 0), key(data.currency) || "USD")}</strong><div className="xp-launch-hero__spark" aria-label="Seven point balance trend">{(Array.isArray(data.series) ? data.series : []).map((point, index) => <i key={index} style={{ blockSize: `${Math.max(18, Number(point))}%` }}/>)}</div></article>
    <div className="xp-launch-hero__finance-panels">{panels.map((panel) => <article key={key(panel.id)} data-runtime-ui-seat={panel.mediaSeatId}><h2>{text(view, panel.titleKey)}</h2><p>{text(view, panel.bodyKey)}</p><span>{key(panel.id) === "accounts" ? "3 balances" : key(panel.id) === "transactions" ? "3 movements" : key(panel.id) === "savings" ? "67% funded" : "3 notices"}</span></article>)}</div>
  </section>;
}

function CommunityProof({ view }: { view: View }) {
  const ids = Array.isArray(view.model.proof.avatarSeatIds) ? view.model.proof.avatarSeatIds.map(String) : [];
  return <section className="xp-launch-hero__community"><div className="xp-launch-hero__grid-field" aria-hidden="true"/><span className="xp-launch-hero__badge">{text(view, view.model.proof.badgeKey)}</span><AvatarRail view={view} ids={ids} labelKey={view.model.proof.countKey}/><p>{text(view, view.model.proof.noteKey)}</p><Social view={view}/></section>;
}

function countdown(targetIso: string, nowIso: string) {
  const seconds = Math.max(0, Math.floor((Date.parse(targetIso) - Date.parse(nowIso)) / 1000));
  const days = Math.floor(seconds / 86400), hours = Math.floor(seconds % 86400 / 3600), minutes = Math.floor(seconds % 3600 / 60), rest = seconds % 60;
  return [[days, "Days"], [hours, "Hours"], [minutes, "Minutes"], [rest, "Seconds"]] as const;
}
function Countdown({ view }: { view: View }) {
  if (!view.model.countdown) return null;
  const parts = countdown(view.model.countdown.targetIso, view.nowIso), ended = parts.every(([value]) => value === 0);
  return <div className="xp-launch-hero__countdown" role="timer" aria-label={text(view, ended ? view.model.countdown.endedKey : view.model.countdown.accessibleDateKey)}>{parts.map(([value, label]) => <span key={label}><strong>{String(value).padStart(2, "0")}</strong><small>{label}</small></span>)}</div>;
}

function PartnerMark({ id }: { id: string }) {
  const index = Number(id.split("-").at(-1) ?? 1);
  return <svg viewBox="0 0 160 64" aria-hidden="true" focusable="false" data-partner-mark={id}><g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">{index === 1 ? <><path d="M22 44C38 15 58 15 72 44"/><path d="M72 44C88 15 108 15 122 44"/></> : index === 2 ? <><path d="m24 42 28-24 28 24"/><path d="m76 42 24-18 30 18"/></> : index === 3 ? <><path d="M28 48a24 24 0 0 1 24-24"/><path d="M60 48a24 24 0 0 1 24-24"/><path d="M92 48a24 24 0 0 1 24-24"/></> : index === 4 ? <><path d="m34 32 18-18h28l18 18-18 18H52Z"/><path d="M80 14v36"/></> : index === 5 ? <><path d="M28 48V36M58 48V26M88 48V16"/><circle cx="122" cy="18" r="5"/></> : <><path d="m34 32 24-20 24 20-24 20Z"/><path d="M82 32h42"/></>}</g></svg>;
}

function PartnerProof({ view }: { view: View }) {
  const partners = list(view.model.proof.partners);
  return <section className="xp-launch-hero__partner-proof"><Countdown view={view}/><div className="xp-launch-hero__partners" aria-label="Launch partners">{partners.map((partner) => <div key={key(partner.id)}><PartnerMark id={key(partner.mediaSeatId)}/><span>{text(view, partner.nameKey)}</span></div>)}</div></section>;
}

function LaunchCountdown({ view }: { view: View }) {
  const background = view.model.mediaBySeat[key(view.model.proof.backgroundSeatId)];
  return <div className="xp-launch-hero__countdown-scene" data-background-status={background?.status}><Picture media={background} alt="" className="xp-launch-hero__background"/><Pitch view={view}/><PartnerProof view={view}/></div>;
}

function Social({ view }: { view: View }) { return view.model.social?.length ? <nav className="xp-launch-hero__social" aria-label="Community destinations">{view.model.social.map((item) => <a key={item.href} href={item.href}>{text(view, item.labelKey)}</a>)}</nav> : null; }

function CommunityCard({ view }: { view: View }) {
  const card = record(view.model.proof.card), ids = Array.isArray(card.avatarSeatIds) ? card.avatarSeatIds.map(String) : [];
  return <section className="xp-launch-hero__orbit" data-background-status={view.model.mediaBySeat[key(view.model.proof.backgroundSeatId)]?.status}><div className="xp-launch-hero__rings" aria-hidden="true"><i/><i/><i/></div><article><span className="xp-launch-hero__badge">{text(view, "badge")}</span><h2>{text(view, card.titleKey)}</h2><p>{text(view, card.bodyKey)}</p><Capture view={view}/><AvatarRail view={view} ids={ids}/><Countdown view={view}/><Social view={view}/></article></section>;
}

function Preset({ view }: { view: View }) {
  switch (view.model.preset) {
    case "testimonial-marquee": return <><Pitch view={view}><AvatarRail view={view} ids={(view.model.proof.avatarSeatIds as string[]) ?? []} labelKey={view.model.proof.countKey}/></Pitch><Testimonials view={view}/></>;
    case "media-story-split": return <><Pitch view={view}/><StoryProof view={view}/></>;
    case "finance-proof-field": return <><Pitch view={view}/><FinanceProof view={view}/></>;
    case "community-grid": return <><Pitch view={view}/><CommunityProof view={view}/></>;
    case "launch-countdown": return <LaunchCountdown view={view}/>;
    case "community-countdown-card": return <><Pitch view={view} capture={false}/><CommunityCard view={view}/></>;
  }
}

export function LaunchHero({ fixture, media, copyMode, scenario, className }: Properties) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => resolveLaunchHeroFixture(fixture, media, copyMode), [fixture, media, copyMode]);
  const [status, setStatus] = useState<LaunchHeroStatus>(scenario?.status ?? "idle"), [selectedStoryId, setSelectedStoryId] = useState(scenario?.selectedStoryId ?? model.stories?.[0]?.id ?? ""), [storyMode, setStoryMode] = useState<"auto" | "selected" | "paused" | "reduced">(scenario?.reducedMotion ? "reduced" : scenario?.storyMode ?? "auto"), [proofMotion, setProofMotion] = useState<"running" | "paused" | "reduced" | "static">(scenario?.reducedMotion ? "reduced" : scenario?.proofMotion ?? "running"), [email, setEmail] = useState("");
  useEffect(() => { if (storyMode !== "auto" || !model.stories?.length) return; const timer = window.setInterval(() => setSelectedStoryId((current) => { const index = model.stories!.findIndex(({ id }) => id === current); return model.stories![(index + 1) % model.stories!.length]!.id; }), 6000); return () => window.clearInterval(timer); }, [model.stories, storyMode]);
  const view: View = { model, status, setStatus, selectedStoryId, selectStory: (id) => { setSelectedStoryId(id); setStoryMode("selected"); }, storyMode, pauseStory: () => setStoryMode((current) => current === "auto" ? "paused" : current), proofMotion, pauseProof: () => setProofMotion((current) => current === "running" ? "paused" : current), email, setEmail, nowIso: scenario?.nowIso ?? "2026-08-23T06:00:00Z" };
  return <section className={["xp-launch-hero", className].filter(Boolean).join(" ")} data-xp-owner="LaunchHero" data-launch-hero-state-owner data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-native-form={forms[deviceClass]} data-copy-mode={model.activeCopyMode} data-media-holds={model.heldSeatIds.join(",")} aria-labelledby={`${model.sourceKey}-title`}><Header view={view} open={scenario?.menuOpen}/><div className="xp-launch-hero__composition"><Preset view={view}/></div></section>;
}
