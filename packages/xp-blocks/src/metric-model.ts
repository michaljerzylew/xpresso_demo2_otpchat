export type MetricTone = "positive" | "negative" | "warning" | "info" | "neutral" | "critical";

export type MetricDelta = {
  direction: "up" | "down" | "flat";
  display: string;
  context?: string;
  tone: MetricTone;
};

export type MetricValue = {
  id: string;
  label: string;
  value: string;
  description?: string;
  delta?: MetricDelta;
  status?: { label: string; tone: MetricTone };
};

export type MetricSeries = {
  id: string;
  label: string;
  tone: MetricTone;
  style?: "solid" | "dashed";
  stackId?: string;
  geometry?: "bar" | "line" | "area";
};

export type MetricPoint = {
  id: string;
  label: string;
  x: string | number;
  values: Record<string, number>;
  preserve?: "first" | "last" | "minimum" | "maximum" | "incident";
  detail?: Array<{ id: string; label: string; value: string }>;
};

export type MetricSegment = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  share?: number;
  tone: MetricTone;
};

export type MetricControlOption = {
  id: string;
  label: string;
  value?: string;
  description?: string;
  tone?: MetricTone;
};

export type MetricVisual =
  | { kind: "scalar"; value: string; delta?: string; spark?: { series: MetricSeries[]; points: MetricPoint[] } }
  | { kind: "line" | "area"; series: MetricSeries[]; points: MetricPoint[]; curve?: "linear" | "monotone" | "step" }
  | { kind: "bar"; series: MetricSeries[]; points: MetricPoint[]; orientation?: "horizontal" | "vertical"; grouping?: "single" | "grouped" | "stacked" | "diverging" | "floating" }
  | { kind: "donut" | "radial"; segments: MetricSegment[]; centerValue?: string; centerLabel?: string }
  | { kind: "rank" | "distribution"; segments: MetricSegment[] }
  | { kind: "range-timeline"; ranges: Array<{ id: string; label: string; start: number; end: number; displayStart: string; displayEnd: string; tone: MetricTone }> }
  | { kind: "threshold"; series: MetricSeries[]; points: MetricPoint[]; limit: { value: number; label: string } };

export type MetricControl =
  | { kind: "tabs" | "segments" | "radio"; id: string; label: string; selectedId: string; options: MetricControlOption[] }
  | { kind: "select"; id: string; label: string; selectedId: string; options: MetricControlOption[] }
  | { kind: "date-range"; id: string; label: string; start: string; end: string; startLabel: string; endLabel: string; applyLabel: string; resetLabel: string; closeLabel: string }
  | { kind: "rating"; id: string; label: string; min: number; max: number; value: number }
  | { kind: "filter"; id: string; label: string; activeId?: string; clearLabel: string }
  | { kind: "disclosure"; id: string; label: string; expanded: boolean };

export type MetricAction = {
  id: string;
  label: string;
  kind: "menu" | "navigate" | "mutate" | "open-detail";
  emphasis: "primary" | "secondary" | "utility";
  href?: string;
  commands?: Array<{ id: string; label: string }>;
  targetId?: string;
  searchLabel?: string;
  emptyLabel?: string;
  closeLabel?: string;
};

export type MetricMediaReference = {
  key: "mark_company" | "port_aarav" | "port_aisha" | "port_beatriz" | "port_darius";
  role: "mark" | "portrait";
  alt: string;
  src?: string;
};

export const requireMetricText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};

export const requireUniqueMetricIds = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

export function validateMetricVisual(visual: MetricVisual, sourceKey: string) {
  if (visual.kind === "scalar") return;
  if ("segments" in visual) {
    if (!visual.segments.length) throw new Error(`${sourceKey} requires visual segments.`);
    requireUniqueMetricIds(visual.segments.map(({ id }) => id), "visual segment IDs", sourceKey);
    if (visual.segments.some(({ value }) => !Number.isFinite(value))) throw new Error(`${sourceKey} contains a non-finite segment value.`);
    return;
  }
  if (visual.kind === "range-timeline") {
    if (!visual.ranges.length || visual.ranges.some(({ start, end }) => !Number.isFinite(start) || !Number.isFinite(end) || end < start)) throw new Error(`${sourceKey} contains an invalid range timeline.`);
    requireUniqueMetricIds(visual.ranges.map(({ id }) => id), "timeline range IDs", sourceKey);
    return;
  }
  if (!visual.series.length || !visual.points.length) throw new Error(`${sourceKey} requires chart series and points.`);
  requireUniqueMetricIds(visual.series.map(({ id }) => id), "series IDs", sourceKey);
  requireUniqueMetricIds(visual.points.map(({ id }) => id), "point IDs", sourceKey);
  const seriesIds = visual.series.map(({ id }) => id).sort();
  for (const point of visual.points) {
    const pointKeys = Object.keys(point.values).sort();
    if (pointKeys.join("|") !== seriesIds.join("|")) throw new Error(`${sourceKey} point ${point.id} does not match declared series.`);
    if (Object.values(point.values).some((value) => !Number.isFinite(value))) throw new Error(`${sourceKey} point ${point.id} contains a non-finite value.`);
  }
}
