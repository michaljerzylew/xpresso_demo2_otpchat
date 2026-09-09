import {
  requireMetricText,
  requireUniqueMetricIds,
  validateMetricVisual,
  type MetricAction,
  type MetricControl,
  type MetricMediaReference,
  type MetricSegment,
  type MetricTone,
  type MetricValue,
  type MetricVisual,
} from "./metric-model";

export const METRIC_SURFACE_PRESETS = ["single-stat", "ranked", "split", "composite", "interactive", "detail-rich", "full-panel"] as const;
export type MetricSurfacePreset = (typeof METRIC_SURFACE_PRESETS)[number];

export type MetricRow = { id: string; label: string; value?: string; meta?: string; tone?: MetricTone; href?: string };
export type MetricPerson = { id: string; label: string; secondaryText?: string; portraitKey: MetricMediaReference["key"] };
export type MetricProgress = { id: string; label: string; value: number; max: number; displayValue: string; tone: MetricTone; presentation?: "bar" | "radial" };
export type MetricRecordCollection = {
  id: string;
  label: string;
  columns: Array<{ id: string; label: string }>;
  records: Array<{ id: string; label: string; values: Record<string, string> }>;
};

export type MetricBreakdown =
  | { kind: "metric-deck"; id: string; label: string; items: MetricValue[] }
  | { kind: "ranked-rows" | "value-rows" | "news" | "records"; id: string; label: string; rows: MetricRow[] }
  | { kind: "progress"; id: string; label: string; items: MetricProgress[] }
  | { kind: "people"; id: string; label: string; countLabel: string; people: MetricPerson[] }
  | { kind: "record-collection"; id: string; collection: MetricRecordCollection }
  | { kind: "alert"; id: string; label: string; description: string; tone: MetricTone }
  | { kind: "help-contact"; id: string; label: string; identity: string; description: string; actionId: string }
  | { kind: "segments"; id: string; label: string; value?: string; segments: MetricSegment[] };

export type MetricDetail =
  | { kind: "none" }
  | { kind: "series-values"; title: string; valueHeading: string; shareHeading?: string }
  | { kind: "summary"; title: string; fields: Array<{ id: string; label: string }> }
  | { kind: "nested-distribution"; title: string; segments: MetricSegment[] };

export type MetricView = {
  id: string;
  label: string;
  metric: MetricValue;
  visual?: MetricVisual;
  breakdowns: MetricBreakdown[];
  detail: MetricDetail;
};

export type MetricSurfaceStress = Partial<Omit<MetricSurfaceFixture, "sourceKey" | "preset" | "stress">>;

export type MetricSurfaceFixture = {
  sourceKey: `chart-component-${string}`;
  preset: MetricSurfacePreset;
  title: string;
  description?: string;
  controls: MetricControl[];
  views: MetricView[];
  activeViewId: string;
  actions: MetricAction[];
  media?: MetricMediaReference[];
  copy: {
    openChartLabel: string;
    closeChartLabel: string;
    dismissDetailLabel: string;
    chartInstructions: string;
    emptyCollectionLabel: string;
    openRecordLabel: string;
    closeRecordLabel: string;
    announcements: { viewChanged: string; pointChanged: string; detailOpened: string; detailClosed: string };
  };
  stress: { short: MetricSurfaceStress; longLocale: MetricSurfaceStress };
};

type SurfaceContract = { preset: MetricSurfacePreset; views: number; visualKinds: Array<MetricVisual["kind"] | "none">; controls: number; actions: number };

const contracts: Record<string, SurfaceContract> = {
  "chart-component-01": { preset: "composite", views: 1, visualKinds: ["bar"], controls: 0, actions: 0 },
  "chart-component-02": { preset: "single-stat", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-03": { preset: "split", views: 1, visualKinds: ["donut"], controls: 0, actions: 1 },
  "chart-component-04": { preset: "split", views: 1, visualKinds: ["line"], controls: 0, actions: 1 },
  "chart-component-05": { preset: "split", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-06": { preset: "ranked", views: 1, visualKinds: ["rank"], controls: 0, actions: 1 },
  "chart-component-07": { preset: "split", views: 1, visualKinds: ["area"], controls: 2, actions: 0 },
  "chart-component-08": { preset: "split", views: 1, visualKinds: ["bar"], controls: 0, actions: 2 },
  "chart-component-09": { preset: "split", views: 1, visualKinds: ["area"], controls: 0, actions: 1 },
  "chart-component-10": { preset: "ranked", views: 1, visualKinds: ["rank"], controls: 0, actions: 1 },
  "chart-component-11": { preset: "split", views: 1, visualKinds: ["bar"], controls: 2, actions: 1 },
  "chart-component-12": { preset: "split", views: 1, visualKinds: ["area"], controls: 0, actions: 1 },
  "chart-component-13": { preset: "interactive", views: 3, visualKinds: ["none", "area", "bar"], controls: 1, actions: 1 },
  "chart-component-14": { preset: "composite", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-15": { preset: "single-stat", views: 1, visualKinds: ["bar"], controls: 0, actions: 2 },
  "chart-component-16": { preset: "split", views: 1, visualKinds: ["bar"], controls: 0, actions: 2 },
  "chart-component-17": { preset: "split", views: 1, visualKinds: ["distribution"], controls: 0, actions: 1 },
  "chart-component-18": { preset: "interactive", views: 1, visualKinds: ["line"], controls: 1, actions: 1 },
  "chart-component-19": { preset: "split", views: 1, visualKinds: ["distribution"], controls: 0, actions: 0 },
  "chart-component-20": { preset: "full-panel", views: 1, visualKinds: ["range-timeline"], controls: 0, actions: 1 },
  "chart-component-21": { preset: "composite", views: 1, visualKinds: ["bar"], controls: 1, actions: 1 },
  "chart-component-22": { preset: "composite", views: 1, visualKinds: ["bar"], controls: 2, actions: 1 },
  "chart-component-23": { preset: "ranked", views: 1, visualKinds: ["distribution"], controls: 0, actions: 1 },
  "chart-component-24": { preset: "interactive", views: 3, visualKinds: ["area", "area", "area"], controls: 1, actions: 1 },
  "chart-component-25": { preset: "interactive", views: 2, visualKinds: ["area", "area"], controls: 1, actions: 0 },
  "chart-component-26": { preset: "split", views: 1, visualKinds: ["area"], controls: 0, actions: 1 },
  "chart-component-27": { preset: "interactive", views: 4, visualKinds: ["area", "area", "area", "area"], controls: 1, actions: 0 },
  "chart-component-28": { preset: "interactive", views: 2, visualKinds: ["area", "area"], controls: 1, actions: 1 },
  "chart-component-29": { preset: "interactive", views: 2, visualKinds: ["bar", "bar"], controls: 1, actions: 1 },
  "chart-component-30": { preset: "interactive", views: 3, visualKinds: ["bar", "bar", "bar"], controls: 1, actions: 1 },
  "chart-component-31": { preset: "interactive", views: 3, visualKinds: ["bar", "bar", "bar"], controls: 1, actions: 1 },
  "chart-component-32": { preset: "interactive", views: 1, visualKinds: ["rank"], controls: 1, actions: 0 },
  "chart-component-33": { preset: "interactive", views: 2, visualKinds: ["rank", "rank"], controls: 1, actions: 0 },
  "chart-component-34": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-35": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-36": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-37": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-38": { preset: "detail-rich", views: 1, visualKinds: ["threshold"], controls: 0, actions: 1 },
  "chart-component-39": { preset: "composite", views: 3, visualKinds: ["line", "line", "line"], controls: 1, actions: 0 },
  "chart-component-40": { preset: "composite", views: 1, visualKinds: ["line"], controls: 0, actions: 1 },
  "chart-component-41": { preset: "interactive", views: 1, visualKinds: ["line"], controls: 1, actions: 0 },
  "chart-component-42": { preset: "interactive", views: 2, visualKinds: ["donut", "donut"], controls: 1, actions: 0 },
  "chart-component-43": { preset: "split", views: 1, visualKinds: ["donut"], controls: 0, actions: 0 },
  "chart-component-44": { preset: "interactive", views: 2, visualKinds: ["line", "line"], controls: 1, actions: 0 },
  "chart-component-45": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-46": { preset: "detail-rich", views: 1, visualKinds: ["bar"], controls: 0, actions: 1 },
  "chart-component-47": { preset: "full-panel", views: 1, visualKinds: ["line"], controls: 0, actions: 0 },
  "chart-component-48": { preset: "full-panel", views: 1, visualKinds: ["bar"], controls: 1, actions: 0 },
  "chart-component-49": { preset: "full-panel", views: 2, visualKinds: ["distribution", "distribution"], controls: 1, actions: 3 },
  "chart-component-50": { preset: "full-panel", views: 2, visualKinds: ["area", "area"], controls: 1, actions: 3 },
  "chart-component-51": { preset: "full-panel", views: 1, visualKinds: ["bar"], controls: 1, actions: 0 },
};

const validateAction = (action: MetricAction, sourceKey: string) => {
  requireMetricText(action.label, "action label", sourceKey);
  if (action.kind === "navigate" && (!action.href?.startsWith("/demo/") || action.href.includes("#"))) throw new Error(`${sourceKey} navigation actions require safe local demo destinations.`);
  if (action.kind !== "navigate" && action.href) throw new Error(`${sourceKey} non-navigation actions cannot carry hrefs.`);
  if (action.kind === "menu") {
    if (action.commands?.length !== 3) throw new Error(`${sourceKey} menu actions require three fixture-owned commands.`);
    requireUniqueMetricIds(action.commands.map(({ id }) => id), `command IDs in ${action.id}`, sourceKey);
    action.commands.forEach((command) => requireMetricText(command.label, "menu command label", sourceKey));
  } else if (action.commands) throw new Error(`${sourceKey} non-menu actions cannot carry commands.`);
  if (action.kind === "open-detail") {
    requireMetricText(action.targetId, "detail target ID", sourceKey);
    requireMetricText(action.searchLabel, "detail search label", sourceKey);
    requireMetricText(action.emptyLabel, "detail empty label", sourceKey);
    requireMetricText(action.closeLabel, "detail close label", sourceKey);
  } else if (action.targetId || action.searchLabel || action.emptyLabel || action.closeLabel) throw new Error(`${sourceKey} non-detail actions cannot carry detail ownership.`);
};

function validateResolvedMetricSurface(fixture: Omit<MetricSurfaceFixture, "stress">) {
  const contract = contracts[fixture.sourceKey];
  if (!contract) throw new Error(`Invalid chart source key: ${fixture.sourceKey}`);
  if (fixture.preset !== contract.preset) throw new Error(`${fixture.sourceKey} requires preset ${contract.preset}.`);
  if (fixture.views.length !== contract.views) throw new Error(`${fixture.sourceKey} requires ${contract.views} views.`);
  if (fixture.views.map((view) => view.visual?.kind ?? "none").join("|") !== contract.visualKinds.join("|")) throw new Error(`${fixture.sourceKey} requires visual order ${contract.visualKinds.join(", ")}.`);
  if (fixture.controls.length !== contract.controls) throw new Error(`${fixture.sourceKey} requires ${contract.controls} controls.`);
  if (fixture.actions.length !== contract.actions) throw new Error(`${fixture.sourceKey} requires ${contract.actions} actions.`);
  requireMetricText(fixture.title, "title", fixture.sourceKey);
  requireMetricText(fixture.copy.openChartLabel, "open chart label", fixture.sourceKey);
  requireMetricText(fixture.copy.closeChartLabel, "close chart label", fixture.sourceKey);
  requireMetricText(fixture.copy.dismissDetailLabel, "dismiss detail label", fixture.sourceKey);
  requireMetricText(fixture.copy.chartInstructions, "chart instructions", fixture.sourceKey);
  requireMetricText(fixture.copy.emptyCollectionLabel, "empty collection label", fixture.sourceKey);
  requireMetricText(fixture.copy.openRecordLabel, "open record label", fixture.sourceKey);
  requireMetricText(fixture.copy.closeRecordLabel, "close record label", fixture.sourceKey);
  Object.entries(fixture.copy.announcements).forEach(([key, value]) => requireMetricText(value, `${key} announcement`, fixture.sourceKey));
  requireUniqueMetricIds(fixture.views.map(({ id }) => id), "view IDs", fixture.sourceKey);
  requireUniqueMetricIds(fixture.controls.map(({ id }) => id), "control IDs", fixture.sourceKey);
  requireUniqueMetricIds(fixture.actions.map(({ id }) => id), "action IDs", fixture.sourceKey);
  if (!fixture.views.some(({ id }) => id === fixture.activeViewId)) throw new Error(`${fixture.sourceKey} active view is unresolved.`);
  for (const view of fixture.views) {
    requireMetricText(view.label, "view label", fixture.sourceKey);
    requireMetricText(view.metric.label, "metric label", fixture.sourceKey);
    requireMetricText(view.metric.value, "metric value", fixture.sourceKey);
    requireUniqueMetricIds(view.breakdowns.map(({ id }) => id), `breakdown IDs in ${view.id}`, fixture.sourceKey);
    if (view.visual) validateMetricVisual(view.visual, fixture.sourceKey);
    if ((view.detail.kind === "summary" || view.detail.kind === "nested-distribution") && view.visual && "points" in view.visual) {
      const expectedIds = (view.detail.kind === "summary" ? view.detail.fields : view.detail.segments).map(({ id }) => id).join("|");
      for (const point of view.visual.points) if (point.detail?.map(({ id }) => id).join("|") !== expectedIds) throw new Error(`${fixture.sourceKey} point ${point.id} requires complete period detail ${expectedIds}.`);
    }
  }
  for (const control of fixture.controls) {
    requireMetricText(control.label, "control label", fixture.sourceKey);
    if ("options" in control) {
      if (control.options.length < 2 || control.options.length > 5) throw new Error(`${fixture.sourceKey} control ${control.id} requires 2-5 options.`);
      requireUniqueMetricIds(control.options.map(({ id }) => id), `option IDs in ${control.id}`, fixture.sourceKey);
      if (!control.options.some(({ id }) => id === control.selectedId)) throw new Error(`${fixture.sourceKey} control ${control.id} has an unresolved selection.`);
    }
    if (control.kind === "date-range") {
      requireMetricText(control.startLabel, "date range start label", fixture.sourceKey);
      requireMetricText(control.endLabel, "date range end label", fixture.sourceKey);
      requireMetricText(control.applyLabel, "date range apply label", fixture.sourceKey);
      requireMetricText(control.resetLabel, "date range reset label", fixture.sourceKey);
      requireMetricText(control.closeLabel, "date range close label", fixture.sourceKey);
    }
  }
  if (fixture.views.length > 1) {
    const viewSelector = fixture.controls.find((control) => "options" in control && control.options.length === fixture.views.length);
    if (!viewSelector || !("options" in viewSelector) || viewSelector.options.map(({ id }) => id).join("|") !== fixture.views.map(({ id }) => id).join("|")) throw new Error(`${fixture.sourceKey} requires one view selector matching view IDs in order.`);
  }
  if (fixture.sourceKey === "chart-component-17") {
    const peer = fixture.views[0].breakdowns.find((breakdown) => breakdown.kind === "segments");
    if (!peer || peer.kind !== "segments" || !peer.value) throw new Error(`${fixture.sourceKey} requires a visible total for both peer distributions.`);
  }
  if (["chart-component-15", "chart-component-16"].includes(fixture.sourceKey)) {
    const geometry = fixture.views[0].visual && "series" in fixture.views[0].visual ? fixture.views[0].visual.series.map(({ geometry }) => geometry).sort().join("|") : "";
    if (geometry !== "bar|line") throw new Error(`${fixture.sourceKey} requires one bar and one line series.`);
  }
  if (fixture.sourceKey === "chart-component-21" && !fixture.views[0].breakdowns.some((breakdown) => breakdown.kind === "progress" && breakdown.items.length === 1 && breakdown.items[0].presentation === "radial")) throw new Error(`${fixture.sourceKey} requires one radial-gauge progress owner.`);
  if (fixture.sourceKey === "chart-component-20" && !fixture.views[0].breakdowns.some((breakdown) => breakdown.kind === "records" && breakdown.rows.length === 4)) throw new Error(`${fixture.sourceKey} requires four parallel timeline records.`);
  if (fixture.sourceKey === "chart-component-29" && !fixture.views.every((view) => view.breakdowns.some((breakdown) => breakdown.kind === "metric-deck" && breakdown.items.length === 1))) throw new Error(`${fixture.sourceKey} requires a second headline value in every tab.`);
  if (fixture.sourceKey === "chart-component-49" && fixture.actions.map(({ kind }) => kind).sort().join("|") !== "menu|navigate|navigate") throw new Error(`${fixture.sourceKey} requires one utility menu, invoice navigation, and contact navigation.`);
  if (fixture.sourceKey === "chart-component-50") {
    if (fixture.actions.map(({ kind }) => kind).sort().join("|") !== "menu|open-detail|open-detail") throw new Error(`${fixture.sourceKey} requires one utility menu and two rank-list detail actions.`);
    const targets = fixture.actions.filter(({ kind }) => kind === "open-detail").map(({ targetId }) => targetId).sort().join("|");
    const lists = fixture.views.flatMap(({ breakdowns }) => breakdowns.filter((breakdown) => breakdown.kind === "ranked-rows").map(({ id }) => id)).sort().join("|");
    if (targets !== lists) throw new Error(`${fixture.sourceKey} detail actions must own both ranked lists exactly once.`);
  }
  if (fixture.sourceKey === "chart-component-51") {
    const deck = fixture.views[0].breakdowns.find((breakdown) => breakdown.kind === "metric-deck");
    const metadata = fixture.views[0].breakdowns.find((breakdown) => breakdown.kind === "value-rows" && breakdown.id === "brk-db-meta");
    if (!deck || deck.kind !== "metric-deck" || deck.items.length !== 3 || !metadata || metadata.kind !== "value-rows" || metadata.rows.length < 2) throw new Error(`${fixture.sourceKey} requires three database summaries plus disclosed health and analysis metadata.`);
  }
  if (fixture.sourceKey === "chart-component-31") {
    const selector = fixture.controls.find((control) => "options" in control);
    if (!selector || !("options" in selector) || selector.options.length !== 3 || selector.options.some(({ value, description }) => !value || !description)) throw new Error(`${fixture.sourceKey} requires three complete service-summary selectors.`);
  }
  if (fixture.sourceKey === "chart-component-13") {
    const people = fixture.views[0].breakdowns.find((breakdown) => breakdown.kind === "people");
    if (!people || people.kind !== "people" || people.people.length !== 4 || new Set(people.people.map(({ portraitKey }) => portraitKey)).size !== 4) throw new Error(`${fixture.sourceKey} requires four distinct approved client identities.`);
  }
  fixture.actions.forEach((action) => validateAction(action, fixture.sourceKey));
  const mediaKeys = fixture.media?.map(({ key }) => key) ?? [];
  requireUniqueMetricIds(mediaKeys, "media keys", fixture.sourceKey);
  if (fixture.sourceKey === "chart-component-01" && mediaKeys.join("|") !== "mark_company") throw new Error(`${fixture.sourceKey} requires the approved company mark.`);
  if (fixture.sourceKey === "chart-component-13" && mediaKeys.sort().join("|") !== ["port_aarav", "port_aisha", "port_beatriz", "port_darius"].sort().join("|")) throw new Error(`${fixture.sourceKey} requires four approved portrait identities.`);
  if (!["chart-component-01", "chart-component-13"].includes(fixture.sourceKey) && mediaKeys.length) throw new Error(`${fixture.sourceKey} must remain system-only.`);
  const visibleCopy = JSON.stringify(fixture);
  if (/\b(?:Title chart-component|Metric \d+|Series \d+|Point \d+|Row \d+|Seg \d+|Act \d+|Ctrl \d+|Tick \d+|Srv \d+|D\d+|V\d+|O\d+)\b/i.test(visibleCopy)) throw new Error(`${fixture.sourceKey} contains placeholder copy.`);
}

export function resolveMetricSurfaceFixture(fixture: MetricSurfaceFixture, stress?: keyof MetricSurfaceFixture["stress"]): MetricSurfaceFixture {
  if (!/^chart-component-(0[1-9]|[1-4]\d|5[01])$/.test(fixture.sourceKey)) throw new Error(`Invalid MetricSurface source key: ${fixture.sourceKey}`);
  if (!METRIC_SURFACE_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an invalid MetricSurface preset.`);
  if (Object.keys(fixture.stress).sort().join("|") !== "longLocale|short") throw new Error(`${fixture.sourceKey} requires short and longLocale stress fixtures.`);
  const resolved = stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture;
  validateResolvedMetricSurface(resolved as Omit<MetricSurfaceFixture, "stress">);
  return resolved;
}
