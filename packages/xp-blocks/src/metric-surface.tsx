"use client";

import { AdaptiveOverlay, DataCollection, SegmentedControl, useDeviceClass, type DataColumn } from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { MetricPlot } from "./metric-plot";
import type { MetricAction, MetricControl, MetricMediaReference, MetricPoint } from "./metric-model";
import type { MetricBreakdown, MetricRecordCollection, MetricSurfaceFixture, MetricView } from "./metric-surface-model";

type CollectionRecord = MetricRecordCollection["records"][number];

function DynamicCollection({ model, copy }: { model: MetricRecordCollection; copy: MetricSurfaceFixture["copy"] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [compactCollection, setCompactCollection] = useState(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => setCompactCollection(container.getBoundingClientRect().width < 544);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  const columns = useMemo(() => model.columns.map((column, index) => ({
    id: column.id,
    header: column.label,
    accessorFn: (row: CollectionRecord) => row.values[column.id] ?? (index === 0 ? row.label : ""),
    cell: ({ getValue }: { getValue: () => unknown }) => String(getValue() ?? ""),
    meta: { priority: index + 1, role: index === 0 ? "title" : "detail", summary: index < 3 },
  })) as DataColumn<CollectionRecord>[], [model.columns]);
  return <div className="xp-metric-surface__collection" ref={containerRef}><DataCollection data={model.records} columns={columns} label={model.label} empty={copy.emptyCollectionLabel} detailsLabel={model.label} showDetailsLabel={copy.openRecordLabel} closeDetailsLabel={copy.closeRecordLabel} rowLabel={(row) => row.label} getRowId={(row) => row.id} deviceClass={compactCollection ? "M" : undefined}/></div>;
}

function Breakdown({ breakdown, copy, media }: { breakdown: MetricBreakdown; copy: MetricSurfaceFixture["copy"]; media: MetricMediaReference[] }) {
  if (breakdown.kind === "metric-deck") return <section className="xp-metric-surface__deck" data-breakdown-id={breakdown.id} aria-label={breakdown.label}>{breakdown.items.map((item) => <article key={item.id}><span>{item.label}</span><strong>{item.value}</strong>{item.delta ? <small data-tone={item.delta.tone}>{item.delta.display}</small> : null}</article>)}</section>;
  if ("rows" in breakdown) {
    return <section className="xp-metric-surface__rows" data-breakdown-id={breakdown.id} aria-label={breakdown.label}>{breakdown.rows.map((row) => <div key={row.id} data-tone={row.tone}><span>{row.label}{row.meta ? <small>{row.meta}</small> : null}</span>{row.value ? <strong>{row.value}</strong> : null}</div>)}</section>;
  }
  if (breakdown.kind === "progress") return <section className="xp-metric-surface__progress" data-breakdown-id={breakdown.id} aria-label={breakdown.label}>{breakdown.items.map((item) => <label key={item.id} data-presentation={item.presentation}>{item.presentation === "radial" ? <><span>{item.label}</span><i className="xp-metric-surface__radial" style={{ "--xp-progress": `${item.value / Math.max(item.max, 1) * 100}%` } as CSSProperties}><strong>{item.displayValue}</strong></i></> : <><span>{item.label}</span><progress value={item.value} max={item.max}>{item.displayValue}</progress><strong>{item.displayValue}</strong></>}</label>)}</section>;
  if (breakdown.kind === "people") return <section className="xp-metric-surface__people" data-breakdown-id={breakdown.id} aria-label={breakdown.label}><strong>{breakdown.countLabel}</strong><ul>{breakdown.people.map((person) => { const portrait = media.find(({ key }) => key === person.portraitKey); return <li key={person.id}>{portrait?.src ? <img src={portrait.src} alt={portrait.alt} data-media-key={person.portraitKey}/> : <span data-media-key={person.portraitKey}>{person.label.slice(0, 1)}</span>}<b>{person.label}</b>{person.secondaryText ? <small>{person.secondaryText}</small> : null}</li>; })}</ul></section>;
  if (breakdown.kind === "record-collection") return <div data-breakdown-id={breakdown.id}><DynamicCollection model={breakdown.collection} copy={copy}/></div>;
  if (breakdown.kind === "alert") return <aside className="xp-metric-surface__alert" data-breakdown-id={breakdown.id} data-tone={breakdown.tone}><strong>{breakdown.label}</strong><p>{breakdown.description}</p></aside>;
  if (breakdown.kind === "help-contact") return <aside className="xp-metric-surface__contact" data-breakdown-id={breakdown.id}><strong>{breakdown.label}</strong><span>{breakdown.identity}</span><p>{breakdown.description}</p></aside>;
  return <section className="xp-metric-surface__segments" data-breakdown-id={breakdown.id} aria-label={breakdown.label}><header><span>{breakdown.label}</span>{breakdown.value ? <strong>{breakdown.value}</strong> : null}</header>{breakdown.segments.map((segment) => <span key={segment.id} data-tone={segment.tone}><b>{segment.label}</b><strong>{segment.displayValue}</strong></span>)}</section>;
}

function Action({ action, target }: { action: MetricAction; target?: MetricBreakdown }) {
  const [query, setQuery] = useState("");
  if (action.kind === "navigate") return <a className="xp-control xp-metric-surface__action" data-emphasis={action.emphasis} href={action.href} data-xp-control>{action.label}</a>;
  if (action.kind === "menu") return <AdaptiveOverlay intent="menu"><AdaptiveOverlay.Trigger className="xp-metric-surface__action" data-emphasis={action.emphasis}>{action.label}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content><AdaptiveOverlay.Header title={action.label}/><AdaptiveOverlay.Body>{action.commands?.map((command) => <button type="button" data-xp-control key={command.id}>{command.label}</button>)}</AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>;
  if (action.kind === "open-detail" && target && "rows" in target) {
    const rows = target.rows.filter(({ label, value, meta }) => `${label} ${value ?? ""} ${meta ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
    return <AdaptiveOverlay intent="search" why="Long ranked collections need one searchable compact takeover and one bounded wide dialog."><AdaptiveOverlay.Trigger className="xp-metric-surface__action" data-emphasis={action.emphasis}>{action.label}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-metric-surface__rank-dialog"><AdaptiveOverlay.Header title={target.label} closeLabel={action.closeLabel}/><AdaptiveOverlay.Body><label className="xp-metric-surface__rank-search"><span>{action.searchLabel}</span><input type="search" value={query} onChange={(event) => setQuery(event.currentTarget.value)}/></label>{rows.length ? <ol>{rows.map((row) => <li key={row.id}><span>{row.label}</span><strong>{row.value}</strong></li>)}</ol> : <p>{action.emptyLabel}</p>}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>{action.closeLabel}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
  }
  return <button className="xp-control xp-metric-surface__action" data-emphasis={action.emphasis} type="button" data-xp-control>{action.label}</button>;
}

function DateRangeControl({ control }: { control: Extract<MetricControl, { kind: "date-range" }> }) {
  const [applied, setApplied] = useState({ start: control.start, end: control.end });
  const [draft, setDraft] = useState(applied);
  const changed = applied.start !== control.start || applied.end !== control.end;
  return <div className="xp-metric-surface__date-control"><AdaptiveOverlay intent="edit" why="Date range editing needs a bounded calendar form and focus return."><AdaptiveOverlay.Trigger data-xp-control>{control.label}: {applied.start} to {applied.end}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content><AdaptiveOverlay.Header title={control.label} closeLabel={control.closeLabel}/><AdaptiveOverlay.Body><label><span>{control.startLabel}</span><input type="date" value={draft.start} onChange={(event) => setDraft((current) => ({ ...current, start: event.currentTarget.value }))}/></label><label><span>{control.endLabel}</span><input type="date" value={draft.end} onChange={(event) => setDraft((current) => ({ ...current, end: event.currentTarget.value }))}/></label></AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close onClick={() => setApplied(draft)}>{control.applyLabel}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>{changed ? <button type="button" onClick={() => { const defaults = { start: control.start, end: control.end }; setApplied(defaults); setDraft(defaults); }} data-xp-control>{control.resetLabel}</button> : null}</div>;
}

function Controls({ controls, activeViewId, activeFilterId, expandedControls, onViewChange, onFilterChange, onDisclosureChange }: { controls: MetricControl[]; activeViewId: string; activeFilterId?: string; expandedControls: Set<string>; onViewChange: (id: string) => void; onFilterChange: (id?: string) => void; onDisclosureChange: (id: string) => void }) {
  return <div className="xp-metric-surface__controls">{controls.map((control) => {
    if (["tabs", "segments", "radio"].includes(control.kind) && "options" in control && control.options.some(({ value }) => value)) return <fieldset className="xp-metric-surface__summary-selector" key={control.id}><legend>{control.label}</legend>{control.options.map((option) => <button type="button" role="radio" aria-checked={option.id === activeViewId} data-tone={option.tone} onClick={() => onViewChange(option.id)} data-xp-control key={option.id}><span>{option.label}</span><strong>{option.value}</strong>{option.description ? <small>{option.description}</small> : null}</button>)}</fieldset>;
    if (["tabs", "segments", "radio"].includes(control.kind) && "options" in control) return <SegmentedControl label={control.label} items={control.options.map(({ id, label }) => ({ value: id, label }))} value={control.options.some(({ id }) => id === activeViewId) ? activeViewId : control.selectedId} onChange={onViewChange} key={control.id}/>;
    if (control.kind === "select") return <label key={control.id}><span>{control.label}</span><select defaultValue={control.selectedId} onChange={(event) => onViewChange(event.currentTarget.value)} data-xp-control>{control.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>;
    if (control.kind === "date-range") return <DateRangeControl control={control} key={control.id}/>;
    if (control.kind === "rating") return <fieldset key={control.id}><legend>{control.label}</legend>{Array.from({ length: control.max - control.min + 1 }, (_, index) => control.min + index).map((value) => <label key={value}><input type="radio" name={control.id} value={value} defaultChecked={value === control.value}/><span>{value}</span></label>)}</fieldset>;
    if (control.kind === "filter") return <button type="button" aria-pressed={Boolean(activeFilterId)} onClick={() => onFilterChange(activeFilterId ? undefined : control.activeId)} key={control.id} data-xp-control>{activeFilterId ? control.clearLabel : control.label}</button>;
    if (control.kind === "disclosure") return <button type="button" aria-expanded={expandedControls.has(control.id)} onClick={() => onDisclosureChange(control.id)} key={control.id} data-xp-control>{control.label}</button>;
    return null;
  })}</div>;
}

function MetricViewContent({ view, fixture, compact, onPoint, activeFilterId, onFilterChange, detailsExpanded }: { view: MetricView; fixture: MetricSurfaceFixture; compact: boolean; onPoint: (point?: MetricPoint) => void; activeFilterId?: string; onFilterChange?: (id: string) => void; detailsExpanded: boolean }) {
  const breakdowns = compact && view.visual?.kind === "rank"
    ? view.breakdowns.filter((breakdown) => breakdown.kind !== "ranked-rows")
    : view.breakdowns;
  return <><div className="xp-metric-surface__headline"><span>{view.metric.label}</span><strong>{view.metric.value}</strong>{view.metric.delta ? <small data-tone={view.metric.delta.tone}>{view.metric.delta.display} {view.metric.delta.context}</small> : null}{view.metric.status ? <small data-tone={view.metric.status.tone}>{view.metric.status.label}</small> : null}</div>{view.visual ? <MetricPlot visual={view.visual} label={view.label} instructions={fixture.copy.chartInstructions} compact={compact} onActivePointChange={onPoint} activeSegmentId={activeFilterId} onSegmentActivate={onFilterChange}/> : null}<div className="xp-metric-surface__breakdowns" data-details-expanded={detailsExpanded || undefined}>{breakdowns.map((breakdown) => <Breakdown breakdown={breakdown} copy={fixture.copy} media={fixture.media ?? []} key={breakdown.id}/>)}</div></>;
}

function ActivePointDetail({ view, point }: { view: MetricView; point: MetricPoint }) {
  if (view.detail.kind === "none") return <output className="xp-metric-surface__active-detail"><strong>{point.label}</strong><span>{Object.values(point.values).join(", ")}</span></output>;
  if (view.detail.kind === "nested-distribution") return <aside className="xp-metric-surface__point-card"><header><strong>{view.detail.title}</strong><span>{point.label}</span></header><dl>{view.detail.segments.map((segment) => <div key={segment.id}><dt>{segment.label}</dt><dd>{point.detail?.find(({ id }) => id === segment.id)?.value ?? segment.displayValue}</dd></div>)}</dl></aside>;
  if (view.detail.kind === "summary") return <aside className="xp-metric-surface__point-card"><header><strong>{view.detail.title}</strong><span>{point.label}</span></header><dl>{view.detail.fields.map((field) => <div key={field.id}><dt>{field.label}</dt><dd>{point.detail?.find(({ id }) => id === field.id)?.value}</dd></div>)}</dl></aside>;
  const total = Object.values(point.values).reduce((sum, value) => sum + value, 0);
  const series = view.visual && "series" in view.visual ? view.visual.series : [];
  return <aside className="xp-metric-surface__point-card"><header><strong>{view.detail.title}</strong><span>{point.label}</span></header><dl>{series.map((item) => { const value = point.values[item.id] ?? 0; return <div key={item.id}><dt>{item.label}</dt><dd>{value}{view.detail.kind === "series-values" && view.detail.shareHeading ? ` (${Math.round(value / Math.max(total, 1) * 100)}%)` : ""}</dd></div>; })}</dl></aside>;
}

export function MetricSurface({ fixture, stress }: { fixture: MetricSurfaceFixture; stress?: keyof MetricSurfaceFixture["stress"] }) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture, [fixture, stress]);
  const [activeViewId, setActiveViewId] = useState(model.activeViewId);
  const [activePoint, setActivePoint] = useState<MetricPoint>();
  const initialFilter = model.controls.find((control) => control.kind === "filter");
  const [activeFilterId, setActiveFilterId] = useState(initialFilter?.kind === "filter" ? initialFilter.activeId : undefined);
  const [expandedControls, setExpandedControls] = useState(() => new Set(model.controls.filter((control) => control.kind === "disclosure" && control.expanded).map(({ id }) => id)));
  const activeView = model.views.find(({ id }) => id === activeViewId) ?? model.views[0];
  const visibleActions = model.actions.filter(({ targetId }) => !targetId || activeView.breakdowns.some(({ id }) => id === targetId));
  const compact = deviceClass === "M";
  return <section className="xp-metric-surface" data-xp-metric-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} data-form={compact ? "stat-spark" : deviceClass === "TP" ? "rail-card" : deviceClass === "TL" ? "reduced-card" : deviceClass === "DS" ? "card" : "pane"} style={{ "--xp-metric-view-count": model.views.length } as CSSProperties} aria-labelledby={`${model.sourceKey}-title`}>
    <header className="xp-metric-surface__header"><div>{model.media?.find(({ key }) => key === "mark_company")?.src ? <img className="xp-metric-surface__mark" data-media-key="mark_company" src={model.media.find(({ key }) => key === "mark_company")?.src} alt={model.media.find(({ key }) => key === "mark_company")?.alt}/> : model.media?.some(({ key }) => key === "mark_company") ? <span className="xp-metric-surface__mark" data-media-key="mark_company" aria-hidden="true">A</span> : null}<h2 id={`${model.sourceKey}-title`}>{model.title}</h2>{model.description ? <p>{model.description}</p> : null}</div><div className="xp-metric-surface__actions">{visibleActions.map((action) => <Action action={action} target={activeView.breakdowns.find(({ id }) => id === action.targetId)} key={action.id}/>)}</div></header>
    <Controls controls={model.controls} activeViewId={activeViewId} activeFilterId={activeFilterId} expandedControls={expandedControls} onViewChange={(id) => { if (model.views.some((view) => view.id === id)) setActiveViewId(id); }} onFilterChange={setActiveFilterId} onDisclosureChange={(id) => setExpandedControls((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })}/>
    <div className="xp-metric-surface__workspace"><MetricViewContent view={activeView} fixture={model} compact={compact} onPoint={setActivePoint} activeFilterId={activeFilterId} onFilterChange={model.sourceKey === "chart-component-32" ? setActiveFilterId : undefined} detailsExpanded={expandedControls.size > 0}/></div>
    {activePoint ? <ActivePointDetail view={activeView} point={activePoint}/> : null}
    {compact && activeView.visual ? <AdaptiveOverlay intent="detail" presentation={{ M: "full-screen" }} why="Compact chart inspection requires a full-screen scrub surface."><AdaptiveOverlay.Trigger className="xp-metric-surface__open-chart">{model.copy.openChartLabel}</AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-metric-surface__takeover"><AdaptiveOverlay.Header title={activeView.label} closeLabel={model.copy.closeChartLabel}/><AdaptiveOverlay.Body><MetricPlot visual={activeView.visual} label={activeView.label} instructions={model.copy.chartInstructions} onActivePointChange={setActivePoint}/>{activePoint ? <ActivePointDetail view={activeView} point={activePoint}/> : null}</AdaptiveOverlay.Body><AdaptiveOverlay.Footer><AdaptiveOverlay.Close>{model.copy.closeChartLabel}</AdaptiveOverlay.Close></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay> : null}
  </section>;
}
