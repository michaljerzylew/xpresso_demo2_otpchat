export const KPI_DECK_PRESETS = [
  "icon-strip",
  "period-strip",
  "period-badge-strip",
  "illustrated-strip",
  "finance-strip",
  "comparison-panel",
  "area-pair",
  "mixed-chart-strip",
  "chart-six",
  "report-grid",
  "instrument-overview",
  "status-strip",
  "goal-strip",
  "score-strip",
  "quota-strip",
  "trend-strip",
  "latency-strip",
  "segment-strip",
  "distribution-panel",
  "gauge-strip",
  "comparison-trends",
  "health-panel",
] as const;

export type KpiDeckPreset = (typeof KPI_DECK_PRESETS)[number];
export type MetricTone = "positive" | "negative" | "warning" | "info" | "neutral";
export type MetricDelta = { direction: "up" | "down" | "flat"; display: string; context?: string; tone: MetricTone };
export type MetricAction =
  | { id: string; label: string; kind: "navigate"; href: string }
  | { id: string; label: string; kind: "open-detail" }
  | { id: string; label: string; kind: "select-period"; selectedId: string; options: Array<{ id: string; label: string }> }
  | { id: string; label: string; kind: "menu"; commands: Array<{ id: string; label: string }> };
export type MetricSegment = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  detail?: string;
  tone: MetricTone;
  href?: string;
};
export type MetricSeries = {
  id: string;
  label: string;
  displayValue?: string;
  points: number[];
  tone: MetricTone;
};
export type MetricAccent =
  | { kind: "none" }
  | { kind: "icon"; iconKey: string }
  | { kind: "illustration"; illustrationKey: string; alt: string }
  | { kind: "spark"; chart: "line" | "area" | "bars"; variant?: "plain" | "curved" | "step" | "point" | "grouped" | "stacked"; series: MetricSeries[] }
  | { kind: "radial"; value: number; max: number; centerLabel?: string }
  | { kind: "donut"; segments: MetricSegment[]; centerLabel?: string }
  | { kind: "progress"; value: number; max: number }
  | { kind: "ticks"; value: number; max: number; tickCount: 10 }
  | { kind: "segments"; segments: MetricSegment[] }
  | { kind: "comparison"; series: MetricSeries[] };
export type MetricSupportingRow = { id: string; label: string; value: string; detail?: string; tone?: MetricTone };
export type MetricTileModel = {
  id: string;
  label: string;
  value: string;
  description?: string;
  period?: string;
  iconKey?: string;
  delta?: MetricDelta;
  status?: { label: string; tone: MetricTone };
  accent: MetricAccent;
  segments?: MetricSegment[];
  supportingRows?: MetricSupportingRow[];
  action?: MetricAction;
};
export type KpiDeckStress = {
  title?: string;
  description?: string;
  summary?: Array<{ id: string; label: string; value: string; tone?: MetricTone }>;
  metrics: MetricTileModel[];
  actions?: MetricAction[];
  heroMetricId?: string;
};
export type KpiDeckFixture = {
  sourceKey: `statistics-component-${string}`;
  preset: KpiDeckPreset;
  title?: string;
  description?: string;
  summary?: Array<{ id: string; label: string; value: string; tone?: MetricTone }>;
  metrics: MetricTileModel[];
  actions?: MetricAction[];
  heroMetricId?: string;
  stress: { short: KpiDeckStress; longLocale: KpiDeckStress };
};

type PresetContract = { preset: KpiDeckPreset; metrics: number; accents: MetricAccent["kind"][] };
const contracts: Record<string, PresetContract> = {
  "statistics-component-01": { preset: "icon-strip", metrics: 4, accents: ["icon", "icon", "icon", "icon"] },
  "statistics-component-02": { preset: "period-strip", metrics: 4, accents: ["icon", "icon", "icon", "icon"] },
  "statistics-component-03": { preset: "period-badge-strip", metrics: 5, accents: ["icon", "icon", "icon", "icon", "icon"] },
  "statistics-component-04": { preset: "illustrated-strip", metrics: 4, accents: ["illustration", "illustration", "illustration", "illustration"] },
  "statistics-component-05": { preset: "finance-strip", metrics: 6, accents: ["icon", "icon", "icon", "icon", "icon", "icon"] },
  "statistics-component-06": { preset: "comparison-panel", metrics: 2, accents: ["comparison", "progress"] },
  "statistics-component-07": { preset: "area-pair", metrics: 2, accents: ["spark", "spark"] },
  "statistics-component-08": { preset: "mixed-chart-strip", metrics: 5, accents: ["spark", "spark", "spark", "spark", "radial"] },
  "statistics-component-09": { preset: "chart-six", metrics: 6, accents: ["spark", "spark", "spark", "radial", "donut", "spark"] },
  "statistics-component-10": { preset: "report-grid", metrics: 4, accents: ["spark", "donut", "spark", "spark"] },
  "statistics-component-11": { preset: "instrument-overview", metrics: 6, accents: ["spark", "spark", "spark", "spark", "spark", "spark"] },
  "statistics-component-12": { preset: "status-strip", metrics: 4, accents: ["icon", "icon", "icon", "icon"] },
  "statistics-component-13": { preset: "goal-strip", metrics: 4, accents: ["icon", "icon", "icon", "icon"] },
  "statistics-component-14": { preset: "score-strip", metrics: 4, accents: ["radial", "radial", "radial", "radial"] },
  "statistics-component-15": { preset: "quota-strip", metrics: 4, accents: ["progress", "progress", "progress", "progress"] },
  "statistics-component-16": { preset: "trend-strip", metrics: 3, accents: ["spark", "spark", "spark"] },
  "statistics-component-17": { preset: "latency-strip", metrics: 3, accents: ["none", "none", "none"] },
  "statistics-component-18": { preset: "segment-strip", metrics: 3, accents: ["segments", "segments", "segments"] },
  "statistics-component-19": { preset: "distribution-panel", metrics: 5, accents: ["segments", "none", "none", "none", "none"] },
  "statistics-component-20": { preset: "gauge-strip", metrics: 4, accents: ["radial", "radial", "radial", "radial"] },
  "statistics-component-21": { preset: "comparison-trends", metrics: 3, accents: ["comparison", "comparison", "comparison"] },
  "statistics-component-22": { preset: "health-panel", metrics: 3, accents: ["ticks", "ticks", "ticks"] },
};

const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const metricActions = (fixture: Omit<KpiDeckFixture, "stress">) => [...(fixture.actions ?? []), ...fixture.metrics.flatMap((metric) => metric.action ? [metric.action] : [])];
const detailSources = new Set([
  "statistics-component-07",
  "statistics-component-08",
  "statistics-component-09",
  "statistics-component-10",
  "statistics-component-11",
  "statistics-component-16",
  "statistics-component-21",
]);

function validateAction(action: MetricAction, sourceKey: string) {
  text(action.label, "action label", sourceKey);
  if (action.kind === "navigate" && (!action.href.startsWith("/demo/") || action.href.includes("#"))) throw new Error(`${sourceKey} navigation actions require safe local demo destinations.`);
  if (action.kind === "select-period") {
    if (action.options.length !== 4 || !action.options.some(({ id }) => id === action.selectedId)) throw new Error(`${sourceKey} period actions require four choices and a valid selection.`);
    unique(action.options.map(({ id }) => id), "period option IDs", sourceKey);
    action.options.forEach((option) => text(option.label, "period option", sourceKey));
  }
  if (action.kind === "menu") {
    if (action.commands.length !== 3) throw new Error(`${sourceKey} menu actions require three commands.`);
    unique(action.commands.map(({ id }) => id), "menu command IDs", sourceKey);
    action.commands.forEach((command) => text(command.label, "menu command", sourceKey));
  }
}

function validateAccent(accent: MetricAccent, sourceKey: string, metricId: string) {
  if (accent.kind === "spark" || accent.kind === "comparison") {
    if (!accent.series.length || accent.series.some((series) => series.points.length < 2)) throw new Error(`${sourceKey} metric ${metricId} requires complete series.`);
    unique(accent.series.map(({ id }) => id), `series IDs in ${metricId}`, sourceKey);
  }
  if (accent.kind === "segments" || accent.kind === "donut") {
    if (!accent.segments.length) throw new Error(`${sourceKey} metric ${metricId} requires segments.`);
    unique(accent.segments.map(({ id }) => id), `segment IDs in ${metricId}`, sourceKey);
  }
  if (accent.kind === "progress" || accent.kind === "radial" || accent.kind === "ticks") {
    if (!(accent.max > 0) || accent.value < 0 || accent.value > accent.max) throw new Error(`${sourceKey} metric ${metricId} has an invalid bounded accent.`);
  }
}

function validateResolved(fixture: Omit<KpiDeckFixture, "stress">) {
  const { sourceKey, preset, metrics } = fixture;
  const contract = contracts[sourceKey];
  if (!contract) throw new Error(`Invalid statistics source key: ${sourceKey}`);
  if (preset !== contract.preset) throw new Error(`${sourceKey} requires preset ${contract.preset}.`);
  if (metrics.length !== contract.metrics) throw new Error(`${sourceKey} requires ${contract.metrics} metrics.`);
  if (metrics.map(({ accent }) => accent.kind).join("|") !== contract.accents.join("|")) throw new Error(`${sourceKey} requires accent order ${contract.accents.join(", ")}.`);
  unique(metrics.map(({ id }) => id), "metric IDs", sourceKey);
  for (const metric of metrics) {
    text(metric.label, "metric label", sourceKey);
    text(metric.value, "metric value", sourceKey);
    if (metric.description !== undefined) text(metric.description, "metric description", sourceKey);
    if (metric.period !== undefined) text(metric.period, "metric period", sourceKey);
    if (metric.status) text(metric.status.label, "metric status", sourceKey);
    unique((metric.supportingRows ?? []).map(({ id }) => id), `supporting row IDs in ${metric.id}`, sourceKey);
    unique((metric.segments ?? []).map(({ id }) => id), `metric segment IDs in ${metric.id}`, sourceKey);
    validateAccent(metric.accent, sourceKey, metric.id);
  }
  const actions = metricActions(fixture);
  unique(actions.map(({ id }) => id), "action IDs", sourceKey);
  actions.forEach((action) => validateAction(action, sourceKey));
  if (detailSources.has(sourceKey) && (actions.length !== metrics.length || metrics.some(({ action }) => action?.kind !== "open-detail"))) throw new Error(`${sourceKey} requires one fixture-owned detail action per metric.`);
  if (sourceKey === "statistics-component-02" && (actions.length !== 4 || actions.some(({ kind }) => kind !== "select-period"))) throw new Error(`${sourceKey} requires four independent period selectors.`);
  if (sourceKey === "statistics-component-04" && metrics.map(({ accent }) => accent.kind === "illustration" ? accent.illustrationKey : "").join("|") !== "illustration_route_density|illustration_shift_load|illustration_queue_balance|illustration_service_window") throw new Error(`${sourceKey} requires four approved original illustration keys.`);
  if (sourceKey === "statistics-component-06" && (metrics[0].supportingRows?.length !== 2 || metrics[1].supportingRows?.length !== 2 || actions.length !== 1 || actions[0].kind !== "menu")) throw new Error(`${sourceKey} requires two comparison peers, two statistics rows and one menu.`);
  if (sourceKey === "statistics-component-11" && ((fixture.summary?.length ?? 0) !== 2 || metrics.some(({ accent }) => accent.kind !== "spark" || accent.series[0]?.points.length < 2))) throw new Error(`${sourceKey} requires two summary states and six instrument trends.`);
  if (sourceKey === "statistics-component-13" && (actions.length !== 4 || actions.some(({ kind }) => kind !== "open-detail"))) throw new Error(`${sourceKey} requires four goal-detail actions.`);
  if (sourceKey === "statistics-component-17" && metrics.some(({ supportingRows }) => supportingRows?.length !== 4)) throw new Error(`${sourceKey} requires four ordered latency zones per metric.`);
  if (sourceKey === "statistics-component-18" && metrics.some(({ accent }) => accent.kind !== "segments" || accent.segments.length !== 3)) throw new Error(`${sourceKey} requires three segments per metric.`);
  if (sourceKey === "statistics-component-19" && (actions.length !== 4 || actions.some(({ kind }) => kind !== "navigate") || metrics[0].accent.kind !== "segments" || metrics[0].accent.segments.length !== 4 || metrics.slice(1).some(({ action }) => action?.kind !== "navigate"))) throw new Error(`${sourceKey} requires one total, four revenue segments and four channel navigation rows.`);
  if (sourceKey === "statistics-component-20" && metrics.some(({ supportingRows }) => supportingRows?.length !== 2)) throw new Error(`${sourceKey} requires two supporting rows per gauge.`);
  if (sourceKey === "statistics-component-21" && metrics.some(({ accent }) => accent.kind !== "comparison" || accent.series.length !== 2 || accent.series.some(({ points }) => points.length !== 7))) throw new Error(`${sourceKey} requires two seven-point series per metric.`);
  if (sourceKey === "statistics-component-22" && metrics.some(({ accent }) => accent.kind !== "ticks" || accent.tickCount !== 10)) throw new Error(`${sourceKey} requires three ten-tick meters.`);
}

export function resolveKpiDeckFixture(fixture: KpiDeckFixture, stress?: keyof KpiDeckFixture["stress"]): KpiDeckFixture {
  if (!/^statistics-component-(0[1-9]|1[0-9]|2[0-2])$/.test(fixture.sourceKey)) throw new Error(`Invalid statistics source key: ${fixture.sourceKey}`);
  if (!KPI_DECK_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an invalid KpiDeck preset.`);
  if (Object.keys(fixture.stress).sort().join("|") !== "longLocale|short") throw new Error(`${fixture.sourceKey} requires short and longLocale stress fixtures.`);
  const resolved = stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture;
  validateResolved(resolved as Omit<KpiDeckFixture, "stress">);
  return resolved;
}
