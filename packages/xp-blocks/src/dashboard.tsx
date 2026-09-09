"use client";

import {
  AdaptiveOverlay,
  classForWidth,
  DataCollection,
  MetricTile,
  SegmentedControl,
  useDeviceClass,
  type DataColumn,
  type DataColumnMeta,
  type DeviceClass,
} from "@xp/primitives";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type {
  DashboardChart,
  DashboardChartModule,
  DashboardCollectionModule,
  DashboardKpiModule,
  DashboardMediaAsset,
  DashboardMetric,
  DashboardModule,
  DashboardRow,
  DashboardTimelineModule,
  DashboardTone,
  DashboardWidgetModule,
  ResolvedDashboardFixture,
} from "./dashboard-model";

const toneColor: Record<DashboardTone, string> = {
  positive: "#17835b",
  negative: "#bd4040",
  warning: "#b66b12",
  info: "#3478d4",
  neutral: "#68707c",
};

const compactGroups = [
  { value: "records", label: "Records" },
  { value: "analysis", label: "Analysis" },
  { value: "today", label: "Today" },
] as const;

function Media({ mediaKey, media, className = "" }: { mediaKey?: string; media: DashboardMediaAsset[]; className?: string }) {
  const asset = media.find(({ key }) => key === mediaKey);
  if (!asset) return null;
  if (!asset.src) return <span className={`xp-dashboard__media-fallback ${className}`} role="img" aria-label={asset.alt}>{asset.alt.slice(0, 2).toUpperCase()}</span>;
  return <img className={`xp-dashboard__media ${className}`} src={asset.src} srcSet={asset.srcSet} alt={asset.alt} data-media-key={asset.key}/>;
}

function MetricDetail({ metric }: { metric: DashboardMetric }) {
  return <AdaptiveOverlay intent="detail">
    <AdaptiveOverlay.Trigger className="xp-dashboard__metric-trigger" data-metric-id={metric.id}>
      <MetricTile value={metric.value} label={metric.label} delta={metric.delta?.display ?? metric.detail} trend={metric.delta?.direction ?? "flat"} data-tone={metric.tone}/>
    </AdaptiveOverlay.Trigger>
    <AdaptiveOverlay.Content className="xp-dashboard__overlay" data-dashboard-overlay="metric">
      <AdaptiveOverlay.Header title={metric.label} description={metric.detail ?? metric.value}/>
      <AdaptiveOverlay.Body><dl className="xp-dashboard__detail-list"><div><dt>{metric.label}</dt><dd>{metric.value}</dd></div>{metric.delta ? <div><dt>Change</dt><dd>{metric.delta.display}</dd></div> : null}</dl></AdaptiveOverlay.Body>
      <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
    </AdaptiveOverlay.Content>
  </AdaptiveOverlay>;
}

function KpiModule({ module }: { module: DashboardKpiModule }) {
  return <section className="xp-dashboard__module xp-dashboard__kpis" data-module-id={module.id} data-module-kind={module.kind} aria-labelledby={`${module.id}-title`}>
    <header className="xp-dashboard__module-header"><h2 id={`${module.id}-title`}>{module.label}</h2><span>{module.metrics.length} measures</span></header>
    <div className="xp-dashboard__kpi-grid" data-count={module.metrics.length}>{module.metrics.map((metric) => <MetricDetail metric={metric} key={metric.id}/>)}</div>
  </section>;
}

function chartPoints(points: number[], width = 520, height = 188) {
  const low = Math.min(...points);
  const high = Math.max(...points);
  const span = Math.max(1, high - low);
  return points.map((value, index) => `${(index / Math.max(1, points.length - 1)) * width},${height - ((value - low) / span) * (height - 24) - 12}`).join(" ");
}

function ChartGraphic({ chart }: { chart: DashboardChart }) {
  if (chart.chart === "donut" || chart.chart === "radial") {
    const values = chart.series.map(({ points }) => points.at(-1) ?? 0);
    const total = Math.max(1, values.reduce((sum, value) => sum + value, 0));
    let offset = 0;
    return <div className="xp-dashboard__radial"><svg viewBox="0 0 120 120" role="img" aria-label={chart.label}>{chart.series.map((series, index) => { const length = values[index] / total * 251.2; const dashOffset = -offset; offset += length; return <circle key={series.id} cx="60" cy="60" r="40" pathLength="251.2" stroke={toneColor[series.tone]} strokeDasharray={`${length} ${251.2 - length}`} strokeDashoffset={dashOffset}/>; })}</svg><strong>{chart.series[0]?.currentValue}</strong></div>;
  }
  if (chart.chart === "bars" || chart.chart === "stacked-bars") {
    const values = chart.series.flatMap(({ points }) => points);
    const max = Math.max(...values, 1);
    return <div className="xp-dashboard__bars" role="img" aria-label={chart.label}>{chart.series.map((series) => <div key={series.id} data-series-id={series.id}>{series.points.map((value, index) => <i key={index} style={{ "--xp-dashboard-bar": `${Math.max(6, value / max * 100)}%`, "--xp-dashboard-tone": toneColor[series.tone] } as CSSProperties}/>)}</div>)}</div>;
  }
  return <svg className="xp-dashboard__chart-svg" viewBox="0 0 520 188" preserveAspectRatio="none" role="img" aria-label={chart.label}><path d="M0 176H520" className="xp-dashboard__chart-axis"/>{chart.series.map((series) => <polyline key={series.id} points={chartPoints(series.points)} stroke={toneColor[series.tone]} data-series-id={series.id}/>)}</svg>;
}

function ChartWell({ module }: { module: DashboardChartModule }) {
  const [selected, setSelected] = useState(module.activeChartId);
  const active = module.charts.find(({ id }) => id === selected) ?? module.charts[0];
  return <section className="xp-dashboard__module xp-dashboard__chart-well" data-module-id={module.id} data-module-kind={module.kind} aria-labelledby={`${module.id}-title`}>
    <header className="xp-dashboard__module-header"><div><h2 id={`${module.id}-title`}>{module.label}</h2><p>{active.description}</p></div>{module.charts.length > 1 ? <SegmentedControl label={`${module.label} views`} value={active.id} onChange={setSelected} items={module.charts.map(({ id, label }) => ({ value: id, label }))}/> : null}</header>
    <div className="xp-dashboard__chart-panel" role="tabpanel" data-chart-id={active.id}>
      <ChartGraphic chart={active}/>
      <ul className="xp-dashboard__legend">{active.series.map((series) => <li key={series.id}><i style={{ background: toneColor[series.tone] }}/><span>{series.label}</span><strong>{series.currentValue}</strong></li>)}</ul>
      {active.summaries?.length ? <dl className="xp-dashboard__chart-summary">{active.summaries.map((summary) => <div key={summary.id}><dt>{summary.label}</dt><dd>{summary.value}</dd>{summary.detail ? <small>{summary.detail}</small> : null}</div>)}</dl> : null}
    </div>
  </section>;
}

function Progress({ row }: { row: DashboardRow }) {
  if (!row.progress) return null;
  return <span className="xp-dashboard__progress"><progress value={row.progress.value} max={row.progress.max}/><small>{row.progress.display ?? `${row.progress.value} of ${row.progress.max}`}</small></span>;
}

function Row({ row, media }: { row: DashboardRow; media: DashboardMediaAsset[] }) {
  return <div className="xp-dashboard__row" data-row-id={row.id}>
    <Media mediaKey={row.mediaKey} media={media} className="xp-dashboard__row-media"/>
    {row.iconKey ? <span className="xp-dashboard__row-icon" data-icon-key={row.iconKey} aria-hidden="true">◇</span> : null}
    <span className="xp-dashboard__row-copy"><strong>{row.label}</strong>{row.detail ? <small>{row.detail}</small> : null}</span>
    <span className="xp-dashboard__row-value">{row.value ? <strong>{row.value}</strong> : null}{row.status ? <small data-tone={row.status.tone}>{row.status.label}</small> : null}</span>
    <Progress row={row}/>
  </div>;
}

function WidgetModule({ module, media }: { module: DashboardWidgetModule; media: DashboardMediaAsset[] }) {
  const [choice, setChoice] = useState(module.selectedChoiceId);
  const rows = [...(module.rows ?? []), ...(module.groups?.flatMap((group) => group.rows) ?? [])];
  return <section className="xp-dashboard__module xp-dashboard__widget" data-module-id={module.id} data-module-kind={module.kind} data-presentation={module.presentation} aria-labelledby={`${module.id}-title`}>
    <header className="xp-dashboard__module-header"><h2 id={`${module.id}-title`}>{module.label}</h2>{module.action?.kind === "navigate" ? <a href={module.action.href}>{module.action.label}</a> : module.action ? <button type="button">{module.action.label}</button> : null}</header>
    {module.summary?.length ? <dl className="xp-dashboard__widget-summary">{module.summary.map((item) => <div key={item.id}><dt>{item.label}</dt><dd>{item.value}</dd>{item.detail ? <small>{item.detail}</small> : null}</div>)}</dl> : null}
    {module.choices?.length ? <fieldset className="xp-dashboard__choices"><legend>{module.label}</legend>{module.choices.map((item) => <label key={item.id} data-selected={choice === item.id || undefined}><input type="radio" name={`${module.id}-choice`} value={item.id} checked={choice === item.id} onChange={() => setChoice(item.id)}/><span><strong>{item.label}</strong>{item.detail ? <small>{item.detail}</small> : null}</span>{item.value ? <b>{item.value}</b> : null}</label>)}</fieldset> : null}
    {module.groups?.length ? <div className="xp-dashboard__widget-groups">{module.groups.map((group) => <section key={group.id}><h3>{group.label}</h3>{group.rows.map((row) => <Row row={row} media={media} key={row.id}/>)}</section>)}</div> : rows.length ? <div className="xp-dashboard__rows">{(module.rows ?? []).map((row) => <Row row={row} media={media} key={row.id}/>)}</div> : null}
  </section>;
}

type CollectionRecord = DashboardCollectionModule["rows"][number];

function CollectionModule({ module, media, deviceClass }: { module: DashboardCollectionModule; media: DashboardMediaAsset[]; deviceClass: DeviceClass }) {
  const columns: DataColumn<CollectionRecord>[] = module.columns.map((column, index) => ({
    id: column.id,
    header: column.label,
    accessorFn: (record) => record.cells[column.id]?.label ?? "",
    cell: ({ row }) => <Row row={row.original.cells[column.id]} media={media}/>,
    meta: {
      priority: column.priority,
      role: column.summary === "primary" ? "title" : column.summary === "trailing" ? "status" : "detail",
      summary: column.summary !== "detail-only" && index < 3,
    } satisfies DataColumnMeta,
  }));
  const primaryId = module.columns.find(({ summary }) => summary === "primary")?.id ?? module.columns[0].id;
  return <section className="xp-dashboard__module xp-dashboard__collection" data-module-id={module.id} data-module-kind={module.kind} aria-labelledby={`${module.id}-title`}>
    <header className="xp-dashboard__module-header"><h2 id={`${module.id}-title`}>{module.label}</h2><span>{module.rows.length} records</span></header>
    <DataCollection data={module.rows} columns={columns} label={module.label} empty={<p>No records</p>} detailsLabel={module.detailLabel} showDetailsLabel={module.detailLabel} closeDetailsLabel={module.closeDetailLabel} rowLabel={(record) => record.cells[primaryId]?.label ?? module.label} getRowId={(record) => record.id} deviceClass={deviceClass}/>
  </section>;
}

function TimelineModule({ module }: { module: DashboardTimelineModule }) {
  return <section className="xp-dashboard__module xp-dashboard__timeline" data-module-id={module.id} data-module-kind={module.kind} aria-labelledby={`${module.id}-title`}>
    <header className="xp-dashboard__module-header"><h2 id={`${module.id}-title`}>{module.label}</h2><span>{module.timeline.length} tasks</span></header>
    <ol>{module.timeline.map((item) => <li key={item.id}><span className="xp-dashboard__timeline-track"/><div><strong>{item.label}</strong><small>{item.owner}</small></div><time>{item.start} to {item.end}</time><span data-tone={item.status.tone}>{item.status.label}</span></li>)}</ol>
    <div className="xp-dashboard__projects">{module.projects.map((project) => <div key={project.id}><strong>{project.label}</strong><span>{project.value}</span>{project.status ? <small data-tone={project.status.tone}>{project.status.label}</small> : null}</div>)}</div>
  </section>;
}

function Module({ module, media, deviceClass }: { module: DashboardModule; media: DashboardMediaAsset[]; deviceClass: DeviceClass }) {
  if (module.kind === "kpi-deck") return <KpiModule module={module}/>;
  if (module.kind === "chart-well") return <ChartWell module={module}/>;
  if (module.kind === "widget") return <WidgetModule module={module} media={media}/>;
  if (module.kind === "data-collection") return <CollectionModule module={module} media={media} deviceClass={deviceClass}/>;
  return <TimelineModule module={module}/>;
}

function SelectControl({ label, selectedId, choices }: { label: string; selectedId: string; choices: Array<{ id: string; label: string }> }) {
  const [selected, setSelected] = useState(selectedId);
  return <label className="xp-dashboard__select"><span>{label}</span><select value={selected} onChange={(event) => setSelected(event.currentTarget.value)}>{choices.map((choice) => <option value={choice.id} key={choice.id}>{choice.label}</option>)}</select></label>;
}

export function Dashboard({ model }: { model: ResolvedDashboardFixture }) {
  const ambientDeviceClass = useDeviceClass();
  const rootRef = useRef<HTMLElement>(null);
  const [slotDeviceClass, setSlotDeviceClass] = useState<DeviceClass | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const measure = () => {
      const width = root.getBoundingClientRect().width;
      setSlotDeviceClass(width < 840 ? classForWidth(width) : null);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const deviceClass = slotDeviceClass ?? ambientDeviceClass;
  const compact = deviceClass === "M" || deviceClass === "TP";
  const initialGroup = model.modules[1]?.priority.compactGroup ?? "analysis";
  const [compactGroup, setCompactGroup] = useState(initialGroup);
  const visibleModules = useMemo(() => compact
    ? model.modules.filter((module, index) => index === 0 || module.priority.compactGroup === compactGroup)
    : model.modules,
  [compact, compactGroup, model.modules]);
  const availableGroups = compactGroups.filter((group) => model.modules.some(({ priority }) => priority.compactGroup === group.value));
  return <main ref={rootRef} className="xp-dashboard" data-xp-dashboard-renderer data-source-key={model.sourceKey} data-appearance={model.shell.appearance} data-device-class={deviceClass} aria-labelledby={`${model.sourceKey}-title`}>
    <header className="xp-dashboard__header">
      <div><p>{model.shell.identityLabel}</p><h1 id={`${model.sourceKey}-title`}>{model.title}</h1>{model.description ? <span>{model.description}</span> : null}</div>
      <div className="xp-dashboard__controls">{model.timeframe ? <SelectControl label="Timeframe" selectedId={model.timeframe.selectedId} choices={model.timeframe.choices}/> : null}{model.filters?.map((filter) => <SelectControl label={filter.label} selectedId={filter.selectedId} choices={filter.choices} key={filter.id}/>)}</div>
    </header>
    {compact && availableGroups.length > 1 ? <div className="xp-dashboard__compact-switch"><SegmentedControl label="Dashboard section" value={compactGroup} onChange={(value) => setCompactGroup(value as typeof compactGroup)} items={availableGroups}/></div> : null}
    <div className="xp-dashboard__canvas" data-visible-modules={visibleModules.length}>{visibleModules.map((module) => <div className="xp-dashboard__slot" data-priority={module.priority.value} data-job={module.priority.job} data-group={module.priority.compactGroup} style={{ "--xp-dashboard-tl": module.spanHint.TL === "full" ? 2 : 1, "--xp-dashboard-ds": module.spanHint.DS, "--xp-dashboard-dw": module.spanHint.DW } as CSSProperties} key={module.id}><Module module={module} media={model.resolvedMedia} deviceClass={deviceClass}/></div>)}</div>
  </main>;
}
