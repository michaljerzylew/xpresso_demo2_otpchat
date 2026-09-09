"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { MetricPoint, MetricSegment, MetricTone, MetricVisual } from "./metric-model";

const colors: Record<MetricTone, string> = {
  positive: "#16835b",
  negative: "#c34343",
  warning: "#c27616",
  info: "#3478d4",
  neutral: "#68707c",
  critical: "#a8263f",
};

const chartRows = (visual: Extract<MetricVisual, { points: MetricPoint[] }>) => visual.points.map((point) => ({ pointId: point.id, label: point.label, ...point.values }));
const segmentRows = (segments: MetricSegment[]) => segments.map((segment) => ({ ...segment, fill: colors[segment.tone] }));

function SegmentPlot({ visual, activeSegmentId, onSegmentActivate }: { visual: Extract<MetricVisual, { segments: MetricSegment[] }>; activeSegmentId?: string; onSegmentActivate?: (id: string) => void }) {
  if (visual.kind === "rank" || visual.kind === "distribution") {
    const max = Math.max(...visual.segments.map(({ value }) => value), 1);
    return <ol className="xp-metric-plot__rank">{visual.segments.map((segment) => <li key={segment.id} data-selected={segment.id === activeSegmentId || undefined}>{onSegmentActivate ? <button type="button" aria-pressed={segment.id === activeSegmentId} onClick={() => onSegmentActivate(segment.id)} data-xp-control><span>{segment.label}</span><i><b style={{ "--xp-metric-share": `${segment.value / max * 100}%`, background: colors[segment.tone] } as CSSProperties}/></i><strong>{segment.displayValue}</strong></button> : <><span>{segment.label}</span><i><b style={{ "--xp-metric-share": `${segment.value / max * 100}%`, background: colors[segment.tone] } as CSSProperties}/></i><strong>{segment.displayValue}</strong></>}</li>)}</ol>;
  }
  const data = segmentRows(visual.segments);
  if (visual.kind === "radial") return <ResponsiveContainer width="100%" height="100%"><RadialBarChart data={data} innerRadius="58%" outerRadius="94%" startAngle={90} endAngle={-270}><PolarAngleAxis type="number" domain={[0, Math.max(...visual.segments.map(({ value }) => value), 1)]} tick={false}/><RadialBar dataKey="value" background>{data.map((segment) => <Cell fill={segment.fill} key={segment.id}/>)}</RadialBar></RadialBarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="88%" paddingAngle={2}>{data.map((segment) => <Cell fill={segment.fill} key={segment.id}/>)}</Pie></PieChart></ResponsiveContainer>;
}

function CartesianPlot({ visual }: { visual: Extract<MetricVisual, { points: MetricPoint[] }> }) {
  const data = chartRows(visual);
  const common = <><CartesianGrid strokeDasharray="3 5" vertical={false}/><XAxis dataKey="label" interval="preserveStartEnd" tickLine={false}/><YAxis hide/></>;
  if (visual.kind === "bar" && visual.series.some(({ geometry }) => geometry && geometry !== "bar")) return <ResponsiveContainer width="100%" height="100%"><ComposedChart data={data}>{common}{visual.series.map((series) => series.geometry === "line" ? <Line dataKey={series.id} stroke={colors[series.tone]} strokeWidth={2} dot={false} isAnimationActive={false} key={series.id}/> : series.geometry === "area" ? <Area dataKey={series.id} stroke={colors[series.tone]} fill={colors[series.tone]} fillOpacity={.12} isAnimationActive={false} key={series.id}/> : <Bar dataKey={series.id} fill={colors[series.tone]} stackId={series.stackId ?? (visual.grouping === "stacked" ? "stack" : undefined)} radius={[4, 4, 0, 0]} key={series.id}/>)}</ComposedChart></ResponsiveContainer>;
  if (visual.kind === "bar") return <ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout={visual.orientation === "horizontal" ? "vertical" : "horizontal"}>{common}{visual.series.map((series) => <Bar dataKey={series.id} fill={colors[series.tone]} stackId={series.stackId ?? (visual.grouping === "stacked" ? "stack" : undefined)} radius={[4, 4, 0, 0]} key={series.id}/>)}</BarChart></ResponsiveContainer>;
  if (visual.kind === "area") return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data}>{common}{visual.series.map((series) => <Area dataKey={series.id} type={visual.curve ?? "monotone"} stroke={colors[series.tone]} fill={colors[series.tone]} fillOpacity={0.14} strokeWidth={2} stackId={series.stackId} isAnimationActive={false} key={series.id}/>)}</AreaChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={data}>{common}{visual.series.map((series) => <Line dataKey={series.id} type={visual.kind === "threshold" ? "linear" : visual.curve ?? "monotone"} stroke={colors[series.tone]} strokeWidth={2} strokeDasharray={series.style === "dashed" ? "6 5" : undefined} dot={false} isAnimationActive={false} key={series.id}/>)}</LineChart></ResponsiveContainer>;
}

function RangePlot({ visual }: { visual: Extract<MetricVisual, { kind: "range-timeline" }> }) {
  const max = Math.max(...visual.ranges.map(({ end }) => end), 1);
  return <ol className="xp-metric-plot__ranges">{visual.ranges.map((range) => <li key={range.id}><span>{range.label}</span><i><b style={{ "--xp-range-start": `${range.start / max * 100}%`, "--xp-range-size": `${(range.end - range.start) / max * 100}%` } as CSSProperties}/></i><small>{range.displayStart} to {range.displayEnd}</small></li>)}</ol>;
}

type MetricPlotProperties = {
  visual: MetricVisual;
  label: string;
  instructions: string;
  onActivePointChange?: (point: MetricPoint | undefined) => void;
  compact?: boolean;
  activeSegmentId?: string;
  onSegmentActivate?: (id: string) => void;
};

export function MetricPlot({ visual, label, instructions, onActivePointChange, compact = false, activeSegmentId, onSegmentActivate }: MetricPlotProperties) {
  const points = "points" in visual ? visual.points : [];
  const [activeIndex, setActiveIndex] = useState(points.length ? points.length - 1 : -1);
  const active = activeIndex >= 0 ? points[activeIndex] : undefined;
  const summary = useMemo(() => {
    if ("segments" in visual) return visual.segments.map((segment) => `${segment.label}: ${segment.displayValue}`).join(", ");
    if (visual.kind === "range-timeline") return visual.ranges.map((range) => `${range.label}: ${range.displayStart} to ${range.displayEnd}`).join(", ");
    if (visual.kind === "scalar") return visual.value;
    return visual.series.map((series) => `${series.label}: ${active?.values[series.id] ?? ""}`).join(", ");
  }, [active, visual]);
  const move = (next: number) => {
    if (!points.length) return;
    const bounded = Math.max(0, Math.min(points.length - 1, next));
    setActiveIndex(bounded);
    onActivePointChange?.(points[bounded]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); move(activeIndex - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(activeIndex + 1); }
    if (event.key === "Home") { event.preventDefault(); move(0); }
    if (event.key === "End") { event.preventDefault(); move(points.length - 1); }
  };
  const activateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!points.length || (event.type === "pointermove" && event.pointerType !== "mouse")) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1)));
    move(Math.round(ratio * (points.length - 1)));
  };
  const descriptionId = `${label.replace(/[^a-z0-9]/gi, "-")}-instructions`;
  return (
    <div className="xp-metric-plot" data-visual-kind={visual.kind} data-series-count={"series" in visual ? visual.series.length : 0} data-point-count={points.length} data-segment-count={"segments" in visual ? visual.segments.length : 0} data-range-count={visual.kind === "range-timeline" ? visual.ranges.length : 0} data-compact={compact || undefined} role="group" aria-label={label} aria-describedby={descriptionId} tabIndex={points.length ? 0 : undefined} onKeyDown={onKeyDown} onPointerMove={activateFromPointer} onPointerDown={activateFromPointer} data-xp-control={points.length ? "" : undefined}>
      <span className="xp-visually-hidden" id={descriptionId}>{instructions}</span>
      <span className="xp-visually-hidden" aria-live="polite">{summary}</span>
      <div className="xp-metric-plot__canvas" aria-hidden="true">
        {visual.kind === "scalar" ? <strong className="xp-metric-plot__scalar">{visual.value}</strong> : null}
        {"segments" in visual ? <SegmentPlot visual={visual} activeSegmentId={activeSegmentId} onSegmentActivate={onSegmentActivate}/> : null}
        {visual.kind === "range-timeline" ? <RangePlot visual={visual}/> : null}
        {"points" in visual ? <CartesianPlot visual={visual}/> : null}
      </div>
    </div>
  );
}
