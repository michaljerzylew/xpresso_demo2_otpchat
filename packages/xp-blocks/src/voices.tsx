"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useDeviceClass } from "@xp/primitives";
import {
  resolveVoicesFixture,
  type ResolvedVoicesFixture,
  type VoiceAction,
  type VoiceIdentity,
  type VoiceMediaSeat,
  type VoiceRecord,
  type VoiceStressKey,
  type VoiceSubject,
  type VoicesFixture,
  type VoicesMediaMap,
} from "./voices-model";

export type VoicesProperties = {
  fixture: VoicesFixture;
  mediaMap: VoicesMediaMap;
  stress?: VoiceStressKey;
  className?: string;
};

function Action({ action }: { action: VoiceAction }) {
  return (
    <a
      className="xp-voices__action"
      data-action-id={action.id}
      data-action-owner={action.ownerId}
      data-emphasis={action.emphasis}
      data-xp-control
      href={action.href}
      rel={action.external ? "noreferrer" : undefined}
      target={action.external ? "_blank" : undefined}
    >
      {action.label}
      {action.external ? <span className="xp-voices__sr-only">, opens in a new tab</span> : null}
    </a>
  );
}

function Intro({ model }: { model: ResolvedVoicesFixture }) {
  const actions = model.intro.actionIds.map((id) => model.actions.find((action) => action.id === id)).filter(Boolean) as VoiceAction[];
  return (
    <header className="xp-voices__intro">
      {model.intro.eyebrow ? <p className="xp-voices__eyebrow">{model.intro.eyebrow}</p> : null}
      <h1 id={`${model.sourceKey}-title`}>{model.intro.heading}</h1>
      {model.intro.description ? <p className="xp-voices__description">{model.intro.description}</p> : null}
      {actions.length ? <div className="xp-voices__actions">{actions.map((action) => <Action action={action} key={action.id} />)}</div> : null}
    </header>
  );
}

function Initials({ identity }: { identity?: VoiceIdentity }) {
  const label = identity?.name ?? "Proof author";
  const initials = label.split(/\s+/).slice(0, 2).map((part) => part[0]).join("");
  return <span className="xp-voices__initials" role="img" aria-label={`${label} portrait unavailable`}>{initials}</span>;
}

function Media({ model, seat, identity, decorative = false }: { model: ResolvedVoicesFixture; seat?: VoiceMediaSeat; identity?: VoiceIdentity; decorative?: boolean }) {
  if (!seat) return <Initials identity={identity} />;
  const record = model.mediaBySeatId.get(seat.id);
  const failed = model.activeStress === "error";
  if (!record || failed) {
    return (
      <div
        className="xp-voices__media-fallback"
        data-media-seat-id={seat.id}
        data-media-status="error"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative ? "true" : undefined}
        aria-label={decorative ? undefined : `${seat.alt}. ${model.announcements.mediaError}`}
      >
        <Initials identity={identity} />
      </div>
    );
  }
  const common = {
    "data-media-seat-id": seat.id,
    "data-media-key": record.assetKey,
    "data-media-role": seat.kind,
  };
  if (record.kind === "avatar") {
    return <img {...common} className="xp-voices__avatar" src={`${record.avatarBase ?? record.publicBase}.webp`} alt={decorative ? "" : seat.alt} aria-hidden={decorative ? "true" : undefined} loading="lazy" decoding="async" />;
  }
  return (
    <picture {...common} className="xp-voices__picture">
      <source type="image/avif" srcSet={`${record.publicBase}-640.avif 640w, ${record.publicBase}-1280.avif 1280w, ${record.publicBase}-1920.avif 1920w`} />
      <source type="image/webp" srcSet={`${record.publicBase}-640.webp 640w, ${record.publicBase}-1280.webp 1280w, ${record.publicBase}-1920.webp 1920w`} />
      <img src={`${record.publicBase}-1280.jpg`} alt={decorative ? "" : seat.alt} aria-hidden={decorative ? "true" : undefined} loading="lazy" decoding="async" />
    </picture>
  );
}

function IdentityMark({ model, id }: { model: ResolvedVoicesFixture; id?: string }) {
  if (!id) return null;
  const seat = model.identityMarks.find((mark) => mark.id === id);
  const record = model.marksBySeatId.get(id);
  if (!seat) return null;
  if (!record || model.activeStress === "error") return <span className="xp-voices__mark-fallback" data-mark-seat-id={id}>{seat.name}</span>;
  return (
    <picture className="xp-voices__mark" data-mark-seat-id={id} data-mark-identity={record.identityId}>
      <source media="(prefers-color-scheme: dark)" srcSet={record.darkPath} />
      <img src={record.lightPath} alt={`${seat.name} mark`} loading="lazy" decoding="async" />
    </picture>
  );
}

function Rating({ record }: { record: VoiceRecord }) {
  if (!record.rating) return null;
  return <span className="xp-voices__rating" role="img" aria-label={`${record.rating.value} out of ${record.rating.maximum} stars`}><span aria-hidden="true">★★★★★</span><b>{record.rating.value}</b></span>;
}

function Quote({ record }: { record: VoiceRecord }) {
  if (!record.emphasis?.length) return <>{record.quote}</>;
  const ranges = [...record.emphasis].sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, index) => {
    if (range.start > cursor) nodes.push(record.quote.slice(cursor, range.start));
    nodes.push(<strong key={`${record.id}-emphasis-${index}`}>{record.quote.slice(range.start, range.end)}</strong>);
    cursor = range.end;
  });
  if (cursor < record.quote.length) nodes.push(record.quote.slice(cursor));
  return <>{nodes}</>;
}

function Identity({ identity }: { identity?: VoiceIdentity }) {
  if (!identity) return null;
  return (
    <cite className="xp-voices__identity">
      <strong>{identity.name}</strong>
      {identity.role || identity.organization ? <span>{[identity.role, identity.organization].filter(Boolean).join(" · ")}</span> : null}
      {identity.handle ? <small>@{identity.handle}</small> : null}
    </cite>
  );
}

function dateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString().slice(0, 10);
}

function RecordCard({
  model,
  record,
  expanded,
  selected,
  playing,
  showMedia = true,
  showMark = true,
  onExpand,
  onPlay,
}: {
  model: ResolvedVoicesFixture;
  record: VoiceRecord;
  expanded: boolean;
  selected: boolean;
  playing: boolean;
  showMedia?: boolean;
  showMark?: boolean;
  onExpand: () => void;
  onPlay: () => void;
}) {
  const seat = record.mediaId ? model.media.find(({ id }) => id === record.mediaId) : undefined;
  const hasDisclosure = record.quote.length > 132;
  return (
    <article className="xp-voices__card" data-record-id={record.id} data-selected={selected || undefined} data-playing={playing || undefined}>
      {showMedia && seat ? <div className="xp-voices__media"><Media model={model} seat={seat} identity={record.identity} />{seat.kind === "video-poster" ? <button type="button" className="xp-voices__poster-control" aria-label={playing ? `Pause ${record.identity?.name ?? "testimonial"}` : `Play ${record.identity?.name ?? "testimonial"}`} aria-pressed={playing} data-xp-control onClick={onPlay}><span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span></button> : null}</div> : null}
      <div className="xp-voices__card-copy">
        {showMark ? <IdentityMark model={model} id={record.identityMarkId} /> : null}
        <Rating record={record} />
        {record.title ? <h2>{record.title}</h2> : null}
        <blockquote><p data-expanded={expanded || undefined}><Quote record={record} /></p><footer><Identity identity={record.identity} />{record.dateLabel ? <time dateTime={dateTime(record.dateLabel)}>{record.dateLabel}</time> : null}</footer></blockquote>
        {record.metric ? <dl className="xp-voices__record-metric"><div><dt>{record.metric.label}</dt><dd>{record.metric.value}</dd></div></dl> : null}
        {hasDisclosure ? <button type="button" className="xp-voices__disclosure" aria-expanded={expanded} data-xp-control onClick={onExpand}>{expanded ? "Show less" : "Show full quote"}</button> : null}
      </div>
    </article>
  );
}

function Metrics({ model }: { model: ResolvedVoicesFixture }) {
  if (!model.aggregateMetrics.length) return null;
  return <dl className="xp-voices__metrics">{model.aggregateMetrics.map((metric) => <div data-metric-id={metric.id} key={metric.id}><dd>{metric.value}</dd><dt>{metric.label}</dt></div>)}</dl>;
}

function Spotlights({ model }: { model: ResolvedVoicesFixture }) {
  if (!model.spotlights.length) return null;
  return <div className="xp-voices__spotlights">{model.spotlights.map((spotlight) => <blockquote data-spotlight-id={spotlight.id} key={spotlight.id}><IdentityMark model={model} id={spotlight.identityMarkId} /><p>{spotlight.statement}</p></blockquote>)}</div>;
}

function DecorativeField({ model }: { model: ResolvedVoicesFixture }) {
  if (!model.decorativeAvatarIds.length) return null;
  return <div className="xp-voices__constellation" aria-hidden="true">{model.decorativeAvatarIds.map((id) => {
    const seat = model.media.find((media) => media.id === id);
    return <Media model={model} seat={seat} decorative key={id} />;
  })}</div>;
}

function Selector({
  model,
  activeId,
  expandedIds,
  playingVideoId,
  onSelect,
  onExpand,
  onPlay,
}: {
  model: ResolvedVoicesFixture;
  activeId: string;
  expandedIds: string[];
  playingVideoId: string | null;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onPlay: (id: string) => void;
}) {
  const subjects: Array<VoiceRecord | VoiceSubject> = model.subjects.length ? model.subjects : model.records;
  const active = subjects.find(({ id }) => id === activeId) ?? subjects[0];
  const onKeys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? subjects.length - 1 : event.key === "ArrowRight" ? (index + 1) % subjects.length : (index - 1 + subjects.length) % subjects.length;
    const choiceId = subjects[next].id;
    const choiceSet = event.currentTarget.parentElement;
    onSelect(choiceId);
    requestAnimationFrame(() => choiceSet?.querySelector<HTMLElement>(`[data-choice-id="${choiceId}"]`)?.focus());
  };
  return (
    <div className="xp-voices__selector">
      <div className="xp-voices__choices" role="tablist" aria-label={`${model.intro.heading} choices`}>
        {subjects.map((item, index) => {
          const identity = item.identity;
          const mediaId = item.mediaId;
          const markId = "identityMarkId" in item ? item.identityMarkId : undefined;
          const seat = mediaId ? model.media.find(({ id }) => id === mediaId) : undefined;
          return <button type="button" role="tab" aria-selected={item.id === active.id} tabIndex={item.id === active.id ? 0 : -1} data-choice-id={item.id} data-xp-control onClick={() => onSelect(item.id)} onKeyDown={(event) => onKeys(event, index)} key={item.id}>{seat ? <Media model={model} seat={seat} identity={identity} /> : null}<IdentityMark model={model} id={markId} /><span>{identity?.name ?? `Proof ${index + 1}`}</span></button>;
        })}
      </div>
      <div className="xp-voices__selection" role="tabpanel">
        {"quote" in active ? <RecordCard model={model} record={active} expanded={expandedIds.includes(active.id)} selected playing={playingVideoId === active.id} showMedia={false} showMark={false} onExpand={() => onExpand(active.id)} onPlay={() => onPlay(active.id)} /> : <SubjectProof model={model} subject={active} />}
      </div>
      {model.subjects.length ? null : <Metrics model={model} />}
    </div>
  );
}

function SubjectProof({ model, subject }: { model: ResolvedVoicesFixture; subject: VoiceSubject }) {
  return <article className="xp-voices__subject" data-subject-id={subject.id}><div><Identity identity={subject.identity} />{model.spotlights.map((spotlight) => <blockquote data-spotlight-id={spotlight.id} key={spotlight.id}><p>{spotlight.statement}</p></blockquote>)}<Metrics model={model} /></div></article>;
}

export function Voices({ fixture, mediaMap, stress, className }: VoicesProperties) {
  const model = useMemo(() => resolveVoicesFixture(fixture, mediaMap, stress), [fixture, mediaMap, stress]);
  const device = useDeviceClass();
  const [state, setState] = useState(model.state);
  const [announcement, setAnnouncement] = useState("");
  const collection = useRef<HTMLDivElement>(null);
  useEffect(() => { setState(model.state); setAnnouncement(""); }, [model.sourceKey, model.activeStress, model.state]);
  const selectable = model.sourceKey === "testimonials-component-16" ? model.subjects : model.records;
  const activeIndex = Math.max(0, selectable.findIndex(({ id }) => id === state.activeId));
  const select = (id: string, announce = true) => {
    setState((current) => ({ ...current, activeId: id, playingVideoId: current.playingVideoId === id ? current.playingVideoId : null }));
    if (announce) setAnnouncement(model.announcements.selectionChanged);
    requestAnimationFrame(() => collection.current?.querySelector<HTMLElement>(`[data-record-id="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" }));
  };
  const move = (delta: number) => {
    if (!selectable.length) return;
    const next = Math.max(0, Math.min(selectable.length - 1, activeIndex + delta));
    select(selectable[next].id);
  };
  const setBoundary = (index: number) => selectable[index] && select(selectable[index].id);
  const expand = (id: string, forced?: boolean) => setState((current) => {
    const expanded = new Set(current.expandedIds);
    const next = forced ?? !expanded.has(id);
    if (next) expanded.add(id); else expanded.delete(id);
    return { ...current, expandedIds: [...expanded] };
  });
  const togglePlay = (id: string) => setState((current) => ({ ...current, activeId: id, paused: false, playingVideoId: current.playingVideoId === id ? null : id }));
  const togglePause = () => setState((current) => {
    const paused = !current.paused;
    setAnnouncement(paused ? model.announcements.paused : model.announcements.resumed);
    return { ...current, paused, playingVideoId: paused ? null : current.playingVideoId };
  });
  const pauseAmbient = () => {
    if (!model.behavior.ambientOnFinePointer) return;
    setState((current) => current.paused ? current : { ...current, paused: true, playingVideoId: null });
    setAnnouncement(model.announcements.paused);
  };
  const pauseFromInteraction = (target: EventTarget | null) => {
    if (target instanceof Element && target.closest('[data-control-kind="pause"]')) return;
    pauseAmbient();
  };
  const activeRecord = model.records.find(({ id }) => id === state.activeId) ?? model.records[0];
  const handleControl = (kind: string) => {
    if (kind === "previous") move(-1);
    else if (kind === "next") move(1);
    else if (kind === "pause") togglePause();
    else if (kind === "play" && activeRecord) togglePlay(activeRecord.id);
    else if (kind === "retry" && activeRecord) setState((current) => ({ ...current, playingVideoId: activeRecord.id, paused: false }));
    else if (kind === "transcript" && activeRecord) expand(activeRecord.id, true);
    else if (kind === "expand" && activeRecord) expand(activeRecord.id, true);
    else if (kind === "collapse" && activeRecord) expand(activeRecord.id, false);
  };
  const onCollectionKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "Home") { event.preventDefault(); setBoundary(0); }
    if (event.key === "End") { event.preventDefault(); setBoundary(selectable.length - 1); }
  };
  const selector = model.composition === "selector";
  return (
    <section
      className={["xp-voices", className].filter(Boolean).join(" ")}
      aria-labelledby={`${model.sourceKey}-title`}
      data-xp-voices
      data-voices-state-owner
      data-source-key={model.sourceKey}
      data-preset={model.preset}
      data-composition={model.composition}
      data-device={device}
      data-native-form={device}
      data-paused={state.paused || undefined}
      data-stress={model.activeStress}
      onPointerDown={(event) => pauseFromInteraction(event.target)}
      onFocusCapture={(event) => pauseFromInteraction(event.target)}
    >
      {model.activeStress === "error" ? <p className="xp-voices__error" role="alert">{model.announcements.error}</p> : null}
      <div className="xp-voices__shell">
        <Intro model={model} />
        {!selector ? <Spotlights model={model} /> : null}
        <DecorativeField model={model} />
        {selector ? <Selector model={model} activeId={state.activeId} expandedIds={state.expandedIds} playingVideoId={state.playingVideoId} onSelect={select} onExpand={expand} onPlay={togglePlay} /> : (
          <div className="xp-voices__browser">
            <div className="xp-voices__collection" ref={collection} tabIndex={model.records.length > 1 ? 0 : undefined} aria-label={`${model.intro.heading} proof collection`} onKeyDown={onCollectionKeys} data-xp-scroll>
              {model.records.map((record) => <RecordCard model={model} record={record} expanded={state.expandedIds.includes(record.id)} selected={record.id === state.activeId} playing={record.id === state.playingVideoId} onExpand={() => expand(record.id)} onPlay={() => togglePlay(record.id)} key={record.id} />)}
            </div>
            {model.records.length > 1 ? <div className="xp-voices__markers" aria-label="Choose proof item">{model.records.map((record, index) => <button type="button" aria-label={`Show proof ${index + 1} of ${model.records.length}`} aria-current={record.id === state.activeId ? "true" : undefined} data-xp-control onClick={() => select(record.id)} key={record.id} />)}</div> : null}
          </div>
        )}
        {!selector ? <Metrics model={model} /> : null}
        {model.controls.length ? <div className="xp-voices__controls">{model.controls.map((control) => control.kind === "position" ? <output data-control-id={control.id} aria-label={control.label} key={control.id}>{Math.min(activeIndex + 1, selectable.length)} / {selectable.length}</output> : <button type="button" data-control-id={control.id} data-control-kind={control.kind} data-xp-control aria-pressed={control.kind === "pause" ? state.paused : control.kind === "play" ? Boolean(state.playingVideoId) : undefined} disabled={control.kind === "previous" ? activeIndex === 0 : control.kind === "next" ? activeIndex >= selectable.length - 1 : undefined} onClick={() => handleControl(control.kind)} key={control.id}>{control.label}</button>)}</div> : null}
      </div>
      <p className="xp-voices__live" aria-live="polite">{announcement}</p>
    </section>
  );
}
