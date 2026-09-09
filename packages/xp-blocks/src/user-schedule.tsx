"use client";

import { AdaptiveOverlay, SegmentedControl, useDeviceClass } from "@xp/primitives";
import { useMemo, useState, type ChangeEvent } from "react";
import type {
  EventDiscoveryEvent,
  ResolvedEventDiscoveryFixture,
  ResolvedSchedulePanelFixture,
  ScheduleCreateModel,
  ScheduleMeeting,
  ScheduleParticipant,
} from "./user-schedule-model";

const Icon = ({ name }: { name: "calendar" | "filter" | "search" | "sort" | "plus" | "video" }) => {
  const paths = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    filter: <path d="M4 5h16l-6 7v5l-4 2v-7z"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    sort: <><path d="M8 6h12M8 12h9M8 18h6"/><path d="m4 4-2 2 2 2M2 6v12"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/></>,
  }[name];
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>;
};

function ScheduleEditor({ model, participantPool = [] }: { model: ScheduleCreateModel; participantPool?: ScheduleParticipant[] }) {
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [participants, setParticipants] = useState(model.people?.initialParticipantIds ?? []);
  const change = () => setDirty(true);
  return (
    <AdaptiveOverlay intent="edit" dirty={dirty} onDismissRequest={() => setDiscard(true)} why="Creation is a long, stateful form whose physical surface must follow the device class.">
      <AdaptiveOverlay.Trigger className="xp-user-schedule__create" data-xp-control><Icon name="plus"/><span>{model.triggerLabel}</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-user-schedule__editor" data-user-schedule-editor>
        <AdaptiveOverlay.Header title={model.title} description={model.description} closeLabel={model.actions[0].label}/>
        <AdaptiveOverlay.Body>
          {discard ? <section className="xp-user-schedule__discard" role="alertdialog" aria-label={model.dirtyTitle ?? "Discard changes"}><h3>{model.dirtyTitle ?? "Discard changes"}</h3><p>{model.dirtyDescription ?? "Your unsaved changes will be removed."}</p><div><button type="button" onClick={() => { setDirty(false); setDiscard(false); }}>{model.discardLabel ?? "Discard"}</button><button type="button" onClick={() => setDiscard(false)}>{model.keepEditingLabel ?? "Keep editing"}</button></div></section> : null}
          <div className="xp-user-schedule__form-grid" onChange={change}>
            {model.fields.map((field) => {
              if (field.kind === "upload") return <label className="xp-user-schedule__upload" key={field.id}><span>{field.label}</span><input type="file" multiple aria-describedby={`${field.id}-constraint`}/><small id={`${field.id}-constraint`}>{model.upload.acceptLabel}</small></label>;
              if (field.kind === "people") return <fieldset className="xp-user-schedule__people-editor" key={field.id}><legend>{field.label}</legend><div>{participants.map((id) => { const person = participantPool.find((candidate) => candidate.id === id); return <span key={id}>{person?.name ?? id}<button type="button" aria-label={`${model.people?.removeLabel ?? "Remove"} ${person?.name ?? id}`} onClick={() => { setParticipants((items) => items.filter((item) => item !== id)); change(); }}>×</button></span>; })}</div><button type="button" onClick={() => { const next = participantPool.find((person) => !participants.includes(person.id)); if (next) { setParticipants((items) => [...items, next.id]); change(); } }}>{model.people?.addLabel ?? "Add person"}</button></fieldset>;
              if (field.kind === "select") return <label key={field.id}><span>{field.label}</span><select defaultValue={field.options?.[0]?.id} onChange={change}>{field.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
              if (field.kind === "textarea") return <label className="xp-user-schedule__field-wide" key={field.id}><span>{field.label}</span><textarea rows={3} placeholder={field.placeholder}/></label>;
              return <label key={field.id}><span>{field.label}</span><input type={field.kind === "money" ? "number" : field.kind} placeholder={field.placeholder}/></label>;
            })}
          </div>
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close className="xp-user-schedule__cancel">{model.actions[0].label}</AdaptiveOverlay.Close><AdaptiveOverlay.Close className="xp-user-schedule__commit" onClick={() => setDirty(false)}>{model.actions[1].label}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function EventPicture({ event, model }: { event: EventDiscoveryEvent; model: ResolvedEventDiscoveryFixture }) {
  const asset = model.resolvedMedia.find((candidate) => candidate.key === event.media.key);
  return asset?.src ? <img src={asset.src} alt={asset.alt} style={{ objectPosition: event.media.focalPoint }}/> : <span aria-hidden="true"/>;
}

function EventCard({ event, model }: { event: EventDiscoveryEvent; model: ResolvedEventDiscoveryFixture }) {
  const date = new Date(event.date.includes("T") ? event.date : `${event.date}T12:00:00`);
  return <article className="xp-event-discovery__card" data-event-id={event.id}><a href={event.href}><figure><EventPicture event={event} model={model}/></figure><div><time dateTime={event.date}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date)}</time><h3>{event.title}</h3><p>{event.description}</p><dl><div><dt className="xp-visually-hidden">Location</dt><dd>{event.location}</dd></div><div><dt className="xp-visually-hidden">Price</dt><dd>{event.price.amount === 0 ? event.price.label : `${event.price.currency ?? "$"}${event.price.amount}`}</dd></div></dl></div></a></article>;
}

export function EventDiscovery({ model }: { model: ResolvedEventDiscoveryFixture }) {
  const deviceClass = useDeviceClass();
  const [categories, setCategories] = useState<string[]>(model.initiallyApplied.filter((item) => item.facetId === "category").map((item) => item.optionId));
  const [dateOption, setDateOption] = useState(model.initiallyApplied.find((item) => item.facetId === "date")?.optionId ?? "today");
  const [empty, setEmpty] = useState(false);
  const categoryFacet = model.facets.find((facet) => facet.id === "category" && facet.kind === "multi");
  const dateFacet = model.facets.find((facet) => facet.id === "date" && facet.kind === "date");
  const filtered = empty ? [] : model.events.filter((event) => !categories.length || categories.includes("all") || event.categoryIds.some((id) => categories.includes(id)));
  const featured = model.events.find((event) => event.featured);
  const visibleFeatured = featured && filtered.some((event) => event.id === featured.id) ? featured : undefined;
  const deckEvents = deviceClass === "M" && visibleFeatured ? filtered.filter((event) => event.id !== visibleFeatured.id) : filtered;
  const toggleCategory = (id: string) => setCategories((current) => id === "all" ? ["all"] : current.includes(id) ? (current.filter((value) => value !== id).length ? current.filter((value) => value !== id) : ["all"]) : [...current.filter((value) => value !== "all"), id]);
  return (
    <section className="xp-event-discovery" data-xp-event-discovery-renderer data-source-key={model.sourceKey} data-device-class={deviceClass}>
      <header className="xp-event-discovery__header"><div><p>{model.resultLabel.replace("{count}", String(filtered.length))}</p><h1>{model.title}</h1></div><ScheduleEditor model={model.create}/></header>
      <div className="xp-event-discovery__quick" aria-label={dateFacet?.label}>{dateFacet?.kind === "date" ? dateFacet.quickOptions.map((option) => <button type="button" key={option.id} aria-pressed={dateOption === option.id} onClick={() => { setDateOption(option.id); setEmpty(false); }}>{option.label}</button>) : null}</div>
      <div className="xp-event-discovery__category-chips" aria-label={categoryFacet?.label}>{categoryFacet?.kind === "multi" ? categoryFacet.options.slice(0, deviceClass === "M" ? 4 : 6).map((option) => <button type="button" key={option.id} aria-pressed={categories.includes(option.id)} onClick={() => toggleCategory(option.id)}>{option.label}</button>) : null}</div>
      <AdaptiveOverlay intent="pick" why="Complete faceted filtering needs a compact sheet and a bounded wide popover without duplicating the collection.">
        <AdaptiveOverlay.Trigger className="xp-event-discovery__filter" data-xp-control><Icon name="filter"/>{model.filterLabel}<span>{categories.filter((id) => id !== "all").length}</span></AdaptiveOverlay.Trigger>
        <AdaptiveOverlay.Content className="xp-event-discovery__filters" data-user-schedule-filter>
          <AdaptiveOverlay.Header title={model.filterLabel}/><AdaptiveOverlay.Body>{model.facets.map((facet) => <fieldset key={facet.id}><legend>{facet.label}</legend>{facet.kind === "date" ? facet.quickOptions.map((option) => <label key={option.id}><input type="radio" name="date-filter" checked={dateOption === option.id} onChange={() => setDateOption(option.id)}/>{option.label}</label>) : facet.options.map((option) => <label key={option.id}><input type="checkbox" checked={facet.id === "category" ? categories.includes(option.id) : false} onChange={() => facet.id === "category" && toggleCategory(option.id)}/>{option.label}</label>)}</fieldset>)}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer><button type="button" onClick={() => { setCategories(["all"]); setEmpty(false); }}>{model.clearLabel}</button><AdaptiveOverlay.Close>{model.showResultsLabel.replace("{count}", String(filtered.length))}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
        </AdaptiveOverlay.Content>
      </AdaptiveOverlay>
      <aside className="xp-event-discovery__rail" aria-label={model.filterLabel}>{model.facets.map((facet) => <fieldset key={facet.id}><legend>{facet.label}</legend>{facet.kind === "date" ? facet.quickOptions.map((option) => <label key={option.id}><input type="radio" name="rail-date" checked={dateOption === option.id} onChange={() => setDateOption(option.id)}/>{option.label}</label>) : facet.options.map((option) => <label key={option.id}><input type="checkbox" checked={facet.id === "category" ? categories.includes(option.id) : false} onChange={() => facet.id === "category" && toggleCategory(option.id)}/>{option.label}</label>)}</fieldset>)}</aside>
      {visibleFeatured ? <div className="xp-event-discovery__featured"><EventCard event={visibleFeatured} model={model}/></div> : null}
      {filtered.length ? <div className="xp-event-discovery__deck" aria-live="polite">{deckEvents.map((event) => <EventCard key={event.id} event={event} model={model}/>)}</div> : <div className="xp-event-discovery__empty"><h2>{model.emptyTitle}</h2><p>{model.emptyDescription}</p><button type="button" onClick={() => { setEmpty(false); setCategories(["all"]); }}>{model.clearLabel}</button></div>}
    </section>
  );
}

function ParticipantStack({ ids, people, media }: { ids: string[]; people: ScheduleParticipant[]; media: ResolvedSchedulePanelFixture["resolvedMedia"] }) {
  return <div className="xp-schedule-panel__participants" aria-label={`${ids.length} participants`}>{ids.slice(0, 3).map((id) => { const person = people.find((candidate) => candidate.id === id); const asset = media.find((candidate) => candidate.key === person?.avatarKey); return <span key={id} title={person?.name}>{asset?.src ? <img src={asset.src} alt=""/> : person?.initials}</span>; })}{ids.length > 3 ? <span>+{ids.length - 3}</span> : null}</div>;
}

function MeetingRow({ meeting, model }: { meeting: ScheduleMeeting; model: ResolvedSchedulePanelFixture }) {
  const time = (value: string) => new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  return <article className="xp-schedule-panel__meeting" data-meeting-id={meeting.id}><div className="xp-schedule-panel__time"><time dateTime={meeting.start}>{time(meeting.start)}</time><span>{time(meeting.end)}</span></div><div className="xp-schedule-panel__meeting-copy"><span data-status={meeting.status}>{meeting.status}</span><h3>{meeting.title}</h3><p>{meeting.description}</p><small><Icon name="video"/>{meeting.platform.label}</small><ParticipantStack ids={meeting.participants.map((person) => person.id)} people={model.participantPool} media={model.resolvedMedia}/></div><a className="xp-schedule-panel__join" href={meeting.join.href}>{meeting.join.label}</a></article>;
}

export function SchedulePanel({ model }: { model: ResolvedSchedulePanelFixture }) {
  const deviceClass = useDeviceClass();
  const initialIndex = Math.max(0, model.days.findIndex((day) => day.date === model.selectedDate));
  const [weekStart, setWeekStart] = useState(initialIndex > 6 ? 7 : 0);
  const [selectedDate, setSelectedDate] = useState(model.selectedDate);
  const [tab, setTab] = useState<"upcoming" | "all" | "completed">("upcoming");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"default" | "time" | "name">("default");
  const week = model.days.slice(weekStart, weekStart + 7);
  const selectedDay = model.days.find((day) => day.date === selectedDate) ?? week[0];
  const meetings = useMemo(() => {
    let rows = selectedDay.meetings.filter((meeting) => tab === "all" || meeting.status === tab).filter((meeting) => meeting.title.toLowerCase().includes(query.toLowerCase()));
    if (sort === "name") rows = [...rows].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "time") rows = [...rows].sort((a, b) => a.start.localeCompare(b.start));
    return rows;
  }, [query, selectedDay, sort, tab]);
  const selectDay = (date: string) => setSelectedDate(date);
  const changeWeek = (next: number) => { const start = Math.max(0, Math.min(7, next)); setWeekStart(start); setSelectedDate(model.days[start].date); };
  return (
    <section className="xp-schedule-panel" data-xp-schedule-panel-renderer data-source-key={model.sourceKey} data-device-class={deviceClass}>
      <header><div><Icon name="calendar"/><div><p>{model.monthLabel}</p><h1>{model.title}</h1></div></div><ScheduleEditor model={model.create} participantPool={model.participantPool}/></header>
      <div className="xp-schedule-panel__week-control"><button type="button" onClick={() => changeWeek(weekStart - 7)} disabled={weekStart === 0} aria-label="Previous week">‹</button><div className="xp-schedule-panel__week" role="grid" aria-label={model.monthLabel}>{week.map((day) => <button type="button" role="gridcell" key={day.date} data-today={day.isToday || undefined} aria-selected={selectedDate === day.date} onClick={() => selectDay(day.date)}><span>{day.dayLabel}</span><strong>{day.dayNumber}</strong><i>{day.meetings.length}</i></button>)}</div><button type="button" onClick={() => changeWeek(weekStart + 7)} disabled={weekStart === 7} aria-label="Next week">›</button></div>
      <div className="xp-schedule-panel__tools"><label><span className="xp-visually-hidden">{model.searchLabel}</span><Icon name="search"/><input type="search" placeholder={model.searchLabel} value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.currentTarget.value)}/></label><label><span className="xp-visually-hidden">{model.sortLabel}</span><Icon name="sort"/><select value={sort} onChange={(event) => setSort(event.currentTarget.value as typeof sort)}>{model.sortOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label></div>
      <SegmentedControl label="Meeting status" items={model.tabs.map((item) => ({ value: item.id, label: item.label }))} value={tab} onChange={(value) => setTab(value as typeof tab)}/>
      {deviceClass === "DW" ? <div className="xp-schedule-panel__week-grid">{week.map((day) => <section key={day.date} data-selected={day.date === selectedDate || undefined}><h2>{day.dayLabel} {day.dayNumber}</h2>{day.meetings.map((meeting) => <article key={meeting.id} data-meeting-id={meeting.id}><button type="button" onClick={() => selectDay(day.date)}><time>{new Intl.DateTimeFormat("en", { hour:"numeric", minute:"2-digit" }).format(new Date(meeting.start))}</time>{meeting.title}</button><a href={meeting.join.href}>{meeting.join.label}</a></article>)}</section>)}</div> : <div className="xp-schedule-panel__agenda" aria-live="polite">{meetings.length ? meetings.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} model={model}/>) : <div className="xp-schedule-panel__empty"><h2>{model.emptyTitle}</h2></div>}</div>}
    </section>
  );
}
