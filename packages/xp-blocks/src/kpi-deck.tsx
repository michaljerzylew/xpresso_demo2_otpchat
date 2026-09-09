"use client";

import { AdaptiveOverlay, MetricTile, useDeviceClass } from "@xp/primitives";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type {
  KpiDeckFixture,
  MetricAccent,
  MetricAction,
  MetricSegment,
  MetricSeries,
  MetricTileModel,
} from "./kpi-deck-model";

const toneColor: Record<string, string> = {
  positive: "#16835b",
  negative: "#c34343",
  warning: "#c27616",
  info: "#3478d4",
  neutral: "#68707c",
};

function points(series: MetricSeries, width = 240, height = 72) {
  const low = Math.min(...series.points);
  const high = Math.max(...series.points);
  const span = Math.max(1, high - low);
  return series.points.map((value, index) => `${(index / Math.max(1, series.points.length - 1)) * width},${height - ((value - low) / span) * (height - 10) - 5}`).join(" ");
}

function Icon({ iconKey }: { iconKey: string }) {
  const seed = [...iconKey].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 4;
  return (
    <svg className="xp-kpi-deck__icon" viewBox="0 0 24 24" role="img" aria-label={iconKey.replaceAll("_", " ")}>
      {seed === 0 ? <><path d="M5 18V9m7 9V5m7 13v-6"/><path d="M3 20h18"/></> : null}
      {seed === 1 ? <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></> : null}
      {seed === 2 ? <><path d="M4 7h16v11H4z"/><path d="M8 7V4h8v3M7 12h10"/></> : null}
      {seed === 3 ? <><path d="M4 17l5-5 3 3 7-8"/><path d="M15 7h4v4"/></> : null}
    </svg>
  );
}

function Illustration({ illustrationKey, alt }: { illustrationKey: string; alt: string }) {
  const variant = illustrationKey.split("_").at(-1);
  return (
    <svg className="xp-kpi-deck__illustration" viewBox="0 0 160 88" role="img" aria-label={alt} data-illustration-key={illustrationKey}>
      <rect x="8" y="10" width="144" height="68" rx="14"/>
      {variant === "density" ? <><path d="M25 57l25-25 21 16 27-27 36 33"/><circle cx="50" cy="32" r="5"/><circle cx="98" cy="21" r="5"/></> : null}
      {variant === "load" ? <><path d="M27 59h106M38 59V39h17v20m14 0V24h17v35m14 0V33h17v26"/></> : null}
      {variant === "balance" ? <><path d="M80 22v42M46 64h68M55 33h50"/><circle cx="55" cy="46" r="12"/><circle cx="105" cy="46" r="12"/></> : null}
      {variant === "window" ? <><circle cx="80" cy="44" r="24"/><path d="M80 31v14l10 6M42 44h10m56 0h10"/></> : null}
    </svg>
  );
}

function SeriesChart({ accent }: { accent: Extract<MetricAccent, { kind: "spark" | "comparison" }> }) {
  if (accent.kind === "spark" && accent.chart === "bars") {
    const values = accent.series.flatMap((series) => series.points);
    const max = Math.max(...values, 1);
    return <span className="xp-kpi-deck__bars">{values.map((value, index) => <i key={index} style={{ "--xp-bar": `${Math.max(8, value / max * 100)}%` } as CSSProperties}/>)}</span>;
  }
  return (
    <svg className="xp-kpi-deck__chart" viewBox="0 0 240 72" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 66H240" className="xp-kpi-deck__axis"/>
      {accent.series.map((series) => <polyline key={series.id} points={points(series)} style={{ stroke: toneColor[series.tone] }} data-series-id={series.id}/>) }
    </svg>
  );
}

function SegmentLegend({ segments }: { segments: MetricSegment[] }) {
  const total = Math.max(1, segments.reduce((sum, segment) => sum + segment.value, 0));
  const summary = segments.map((segment) => `${segment.label}: ${segment.displayValue}`).join(", ");
  return (
    <div className="xp-kpi-deck__segments" role="group" tabIndex={0} aria-label={summary}>
      <span className="xp-kpi-deck__segment-bar" aria-hidden="true">{segments.map((segment) => <i key={segment.id} style={{ flexGrow: segment.value, background: toneColor[segment.tone] }}/>)}</span>
      <div>{segments.map((segment) => <span key={segment.id}><i style={{ background: toneColor[segment.tone] }}/><span>{segment.label}</span><strong>{segment.displayValue}</strong><small>{Math.round(segment.value / total * 100)}%</small></span>)}</div>
    </div>
  );
}

function Accent({ accent }: { accent: MetricAccent }) {
  if (accent.kind === "none") return null;
  if (accent.kind === "icon") return <Icon iconKey={accent.iconKey}/>;
  if (accent.kind === "illustration") return <Illustration illustrationKey={accent.illustrationKey} alt={accent.alt}/>;
  if (accent.kind === "spark" || accent.kind === "comparison") return <SeriesChart accent={accent}/>;
  if (accent.kind === "progress") return <progress className="xp-kpi-deck__progress" value={accent.value} max={accent.max}>{accent.value} / {accent.max}</progress>;
  if (accent.kind === "ticks") return <span className="xp-kpi-deck__ticks" role="img" aria-label={`${accent.value} of ${accent.max}`}>{Array.from({ length: accent.tickCount }, (_, index) => <i key={index} data-active={(index + 1) / accent.tickCount <= accent.value / accent.max || undefined}/>)}</span>;
  if (accent.kind === "radial") {
    const ratio = Math.max(0, Math.min(1, accent.value / accent.max));
    return <span className="xp-kpi-deck__radial" style={{ "--xp-ratio": `${ratio * 360}deg` } as CSSProperties} role="img" aria-label={`${accent.value} of ${accent.max}`}><strong>{accent.centerLabel ?? `${Math.round(ratio * 100)}%`}</strong></span>;
  }
  if (accent.kind === "donut" || accent.kind === "segments") return <SegmentLegend segments={accent.segments}/>;
  return null;
}

function DetailContent({ metric }: { metric: MetricTileModel }) {
  const series = metric.accent.kind === "spark" || metric.accent.kind === "comparison" ? metric.accent.series : [];
  return (
    <div className="xp-kpi-deck__detail">
      <div className="xp-kpi-deck__detail-value"><strong>{metric.value}</strong>{metric.delta ? <span data-tone={metric.delta.tone}>{metric.delta.display} {metric.delta.context}</span> : null}</div>
      <Accent accent={metric.accent}/>
      {series.length ? <ul>{series.map((item) => <li key={item.id}><span><i style={{ background: toneColor[item.tone] }}/>{item.label}</span><strong>{item.displayValue ?? item.points.at(-1)}</strong></li>)}</ul> : null}
      {metric.description ? <p>{metric.description}</p> : null}
    </div>
  );
}

function OverlayAction({ action, metric }: { action: Extract<MetricAction, { kind: "open-detail" | "menu" }>; metric: MetricTileModel }) {
  const isMenu = action.kind === "menu";
  return (
    <AdaptiveOverlay intent={isMenu ? "menu" : "detail"}>
      <AdaptiveOverlay.Trigger className="xp-kpi-deck__action" data-action-kind={action.kind} aria-label={action.label}><span>{action.label}</span><span aria-hidden="true">{isMenu ? "•••" : "↗"}</span></AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-kpi-deck__overlay" data-source-metric={metric.id}>
        <AdaptiveOverlay.Header title={metric.label} description={metric.period ?? metric.description} closeLabel={`Close ${metric.label}`}/>
        <AdaptiveOverlay.Body>
          {isMenu ? <div className="xp-kpi-deck__commands">{action.commands.map((command) => <button type="button" key={command.id}>{command.label}</button>)}</div> : <DetailContent metric={metric}/>}
        </AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer><AdaptiveOverlay.Close>Close</AdaptiveOverlay.Close></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
  );
}

function Action({ action, metric }: { action: MetricAction; metric: MetricTileModel }) {
  const [selected, setSelected] = useState(action.kind === "select-period" ? action.selectedId : "");
  if (action.kind === "navigate") return <a className="xp-kpi-deck__action" data-action-kind={action.kind} href={action.href}><span>{action.label}</span><span aria-hidden="true">→</span></a>;
  if (action.kind === "select-period") return <label className="xp-kpi-deck__period"><span className="xp-visually-hidden">{action.label}</span><select value={selected} onChange={(event) => setSelected(event.currentTarget.value)}>{action.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>;
  return <OverlayAction action={action} metric={metric}/>;
}

function MetricCard({ metric, hero }: { metric: MetricTileModel; hero: boolean }) {
  const delta = metric.delta ? <><span>{metric.delta.display}</span>{metric.delta.context ? <small>{metric.delta.context}</small> : null}</> : metric.status ? metric.status.label : undefined;
  const series = metric.accent.kind === "spark" || metric.accent.kind === "comparison" ? metric.accent.series : [];
  return (
    <div className="xp-kpi-deck__card" data-metric-id={metric.id} data-accent={metric.accent.kind} data-hero={hero || undefined}>
      <MetricTile value={metric.value} label={metric.label} delta={delta} trend={metric.delta?.direction ?? "flat"} data-tone={metric.delta?.tone ?? metric.status?.tone ?? "neutral"}/>
      {metric.period ? <span className="xp-kpi-deck__period-label">{metric.period}</span> : null}
      <div className="xp-kpi-deck__accent"><Accent accent={metric.accent}/></div>
      {series.length ? <ul className="xp-kpi-deck__series-summary">{series.map((item) => <li key={item.id}><span><i style={{ background: toneColor[item.tone] }}/>{item.label}</span><strong>{item.displayValue ?? item.points.at(-1)}</strong></li>)}</ul> : null}
      {metric.description ? <p className="xp-kpi-deck__description">{metric.description}</p> : null}
      {metric.supportingRows?.length ? <dl className="xp-kpi-deck__rows">{metric.supportingRows.map((row) => <div key={row.id} data-tone={row.tone}><dt>{row.label}{row.detail ? <small>{row.detail}</small> : null}</dt><dd>{row.value}</dd></div>)}</dl> : null}
      {metric.segments?.length && metric.accent.kind !== "segments" && metric.accent.kind !== "donut" ? <SegmentLegend segments={metric.segments}/> : null}
      {metric.action ? <Action action={metric.action} metric={metric}/> : null}
    </div>
  );
}

export function KpiDeck({ fixture, stress }: { fixture: KpiDeckFixture; stress?: keyof KpiDeckFixture["stress"] }) {
  const deviceClass = useDeviceClass();
  const model = useMemo(() => stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture, [fixture, stress]);
  const heroMetricId = model.heroMetricId;
  return (
    <section className="xp-kpi-deck" data-xp-kpi-renderer data-source-key={model.sourceKey} data-preset={model.preset} data-device-class={deviceClass} aria-labelledby={model.title ? `${model.sourceKey}-title` : undefined}>
      {model.title || model.description ? <header className="xp-kpi-deck__header">{model.title ? <h2 id={`${model.sourceKey}-title`}>{model.title}</h2> : null}{model.description ? <p>{model.description}</p> : null}</header> : null}
      {model.summary?.length ? <dl className="xp-kpi-deck__summary">{model.summary.map((item) => <div key={item.id} data-tone={item.tone}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : null}
      <div className="xp-kpi-deck__grid" data-count={model.metrics.length}>{model.metrics.map((metric) => <MetricCard metric={metric} hero={metric.id === heroMetricId} key={metric.id}/>)}</div>
      {model.actions?.length ? <div className="xp-kpi-deck__global-actions">{model.actions.map((action) => <Action action={action} metric={model.metrics[0]} key={action.id}/>)}</div> : null}
    </section>
  );
}
