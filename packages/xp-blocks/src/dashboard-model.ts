export type DashboardJob = "glance" | "browse" | "act";
export type DashboardTone = "positive" | "negative" | "warning" | "info" | "neutral";
export type DashboardModuleKind = "kpi-deck" | "chart-well" | "widget" | "data-collection" | "timeline";

export type DashboardPriority = {
  value: number;
  job: DashboardJob;
  compactGroup: "kpis" | "today" | "analysis" | "records";
};

export type DashboardSpanHint = {
  TL: "full" | "half";
  DS: 2 | 3 | 4 | 6;
  DW: 3 | 4 | 6 | 8 | 12;
};

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: DashboardTone;
  delta?: { display: string; direction: "up" | "down" | "flat" };
};

export type DashboardChart = {
  id: string;
  label: string;
  description?: string;
  chart: "line" | "area" | "bars" | "stacked-bars" | "radial" | "donut" | "timeline";
  series: Array<{
    id: string;
    label: string;
    currentValue: string;
    points: number[];
    tone: DashboardTone;
  }>;
  summaries?: Array<{ id: string; label: string; value: string; detail?: string }>;
};

export type DashboardRow = {
  id: string;
  label: string;
  value?: string;
  detail?: string;
  status?: { label: string; tone: DashboardTone };
  progress?: { value: number; max: number; display?: string };
  mediaKey?: string;
  iconKey?: string;
};

type DashboardModuleBase = {
  id: string;
  label: string;
  priority: DashboardPriority;
  spanHint: DashboardSpanHint;
};

export type DashboardKpiModule = DashboardModuleBase & {
  kind: "kpi-deck";
  metrics: DashboardMetric[];
};

export type DashboardChartModule = DashboardModuleBase & {
  kind: "chart-well";
  charts: DashboardChart[];
  activeChartId: string;
};

export type DashboardWidgetModule = DashboardModuleBase & {
  kind: "widget";
  presentation: "rows" | "progress" | "choices" | "twin-lists" | "promotion" | "context";
  summary?: DashboardMetric[];
  rows?: DashboardRow[];
  groups?: Array<{ id: string; label: string; rows: DashboardRow[] }>;
  choices?: Array<{ id: string; label: string; value?: string; detail?: string }>;
  selectedChoiceId?: string;
  action?: { id: string; label: string; kind: "button" | "open-detail" | "navigate"; href?: string };
};

export type DashboardCollectionModule = DashboardModuleBase & {
  kind: "data-collection";
  columns: Array<{ id: string; label: string; priority: number; summary: "primary" | "secondary" | "trailing" | "detail-only" }>;
  rows: Array<{ id: string; cells: Record<string, DashboardRow> }>;
  detailLabel: string;
  closeDetailLabel: string;
};

export type DashboardTimelineModule = DashboardModuleBase & {
  kind: "timeline";
  timeline: Array<{
    id: string;
    label: string;
    owner: string;
    start: string;
    end: string;
    status: { label: string; tone: DashboardTone };
  }>;
  projects: DashboardRow[];
};

export type DashboardModule =
  | DashboardKpiModule
  | DashboardChartModule
  | DashboardWidgetModule
  | DashboardCollectionModule
  | DashboardTimelineModule;

export type DashboardStress = {
  title?: string;
  description?: string;
  labels: Record<string, string>;
};

export type DashboardMediaReference = {
  key: string;
  role: "avatar" | "thumbnail" | "cover";
  alt: string;
};

export type DashboardMediaAsset = DashboardMediaReference & {
  kind: "raster" | "system";
  src?: string;
  srcSet?: string;
};

export type DashboardFixture = {
  sourceKey: `dashboard-shell-${string}`;
  title: string;
  description?: string;
  shell: {
    appearance: string;
    identityLabel: string;
    destinations: Array<{
      id: string;
      label: string;
      href?: string;
      children?: Array<{ id: string; label: string; href: string }>;
    }>;
    utilities: Array<{
      id: string;
      label: string;
      kind: "search" | "language" | "activity" | "notice" | "account" | "command";
    }>;
  };
  timeframe?: {
    selectedId: string;
    choices: Array<{ id: string; label: string }>;
  };
  filters?: Array<{
    id: string;
    label: string;
    selectedId: string;
    choices: Array<{ id: string; label: string }>;
  }>;
  modules: DashboardModule[];
  retiredSourceJobs?: Array<{ id: string; why: string }>;
  media?: DashboardMediaReference[];
  stress: {
    short: DashboardStress;
    longLocale: DashboardStress;
  };
};

export type ResolvedDashboardFixture = DashboardFixture & {
  resolvedMedia: DashboardMediaAsset[];
};

type DashboardContract = {
  modules: DashboardModuleKind[];
  kpis: number;
  charts: number;
  widgetRows: number;
  collectionRows: number;
  timelineRows: number;
  projectRows: number;
  media: number;
  retired: number;
};

const contracts: Record<string, DashboardContract> = {
  "dashboard-shell-01": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget"], kpis: 3, charts: 1, widgetRows: 4, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 9, retired: 0 },
  "dashboard-shell-02": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget", "widget", "widget"], kpis: 5, charts: 2, widgetRows: 18, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 8, retired: 0 },
  "dashboard-shell-03": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget", "widget"], kpis: 6, charts: 2, widgetRows: 4, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 9, retired: 0 },
  "dashboard-shell-04": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget", "widget"], kpis: 8, charts: 1, widgetRows: 10, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 6, retired: 0 },
  "dashboard-shell-05": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget", "widget", "widget"], kpis: 3, charts: 2, widgetRows: 18, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 8, retired: 0 },
  "dashboard-shell-06": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget"], kpis: 6, charts: 3, widgetRows: 9, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 8, retired: 1 },
  "dashboard-shell-07": { modules: ["kpi-deck", "data-collection", "chart-well", "widget", "widget"], kpis: 4, charts: 1, widgetRows: 13, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 8, retired: 0 },
  "dashboard-shell-08": { modules: ["widget", "data-collection", "chart-well", "widget"], kpis: 0, charts: 3, widgetRows: 7, collectionRows: 5, timelineRows: 0, projectRows: 0, media: 1, retired: 0 },
  "dashboard-shell-09": { modules: ["timeline", "data-collection", "chart-well", "widget", "widget"], kpis: 0, charts: 2, widgetRows: 2, collectionRows: 5, timelineRows: 5, projectRows: 4, media: 8, retired: 0 },
};

const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};

const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

const moduleRows = (module: DashboardModule) => {
  if (module.kind !== "widget") return [];
  return [...(module.rows ?? []), ...(module.groups?.flatMap((group) => group.rows) ?? [])];
};

const labelIds = (fixture: DashboardFixture) => {
  const ids = new Set<string>();
  fixture.shell.destinations.forEach((item) => { ids.add(item.id); item.children?.forEach((child) => ids.add(child.id)); });
  fixture.shell.utilities.forEach((item) => ids.add(item.id));
  fixture.timeframe?.choices.forEach((item) => ids.add(item.id));
  fixture.filters?.forEach((filter) => { ids.add(filter.id); filter.choices.forEach((item) => ids.add(item.id)); });
  fixture.modules.forEach((module) => {
    ids.add(module.id);
    if (module.kind === "kpi-deck") module.metrics.forEach((item) => ids.add(item.id));
    if (module.kind === "chart-well") module.charts.forEach((chart) => { ids.add(chart.id); chart.series.forEach((item) => ids.add(item.id)); chart.summaries?.forEach((item) => ids.add(item.id)); });
    if (module.kind === "widget") {
      moduleRows(module).forEach((item) => ids.add(item.id));
      module.summary?.forEach((item) => ids.add(item.id));
      module.groups?.forEach((item) => ids.add(item.id));
      module.choices?.forEach((item) => ids.add(item.id));
      if (module.action) ids.add(module.action.id);
    }
    if (module.kind === "data-collection") { module.columns.forEach((item) => ids.add(item.id)); module.rows.forEach((item) => ids.add(item.id)); }
    if (module.kind === "timeline") { module.timeline.forEach((item) => ids.add(item.id)); module.projects.forEach((item) => ids.add(item.id)); }
  });
  return ids;
};

function validateHref(href: string, sourceKey: string) {
  if (!href.startsWith("/demo/") || href.includes("#")) throw new Error(`${sourceKey} navigation requires safe local demo destinations.`);
}

function validateRow(row: DashboardRow, sourceKey: string) {
  text(row.label, `row ${row.id} label`, sourceKey);
  if (row.value !== undefined) text(row.value, `row ${row.id} value`, sourceKey);
  if (row.progress && (!(row.progress.max > 0) || row.progress.value < 0 || row.progress.value > row.progress.max)) throw new Error(`${sourceKey} row ${row.id} has invalid progress.`);
}

function validateFixture(fixture: DashboardFixture) {
  const { sourceKey } = fixture;
  const contract = contracts[sourceKey];
  if (!contract) throw new Error(`Invalid dashboard source key: ${sourceKey}`);
  text(fixture.title, "title", sourceKey);
  text(fixture.shell.identityLabel, "shell identity", sourceKey);
  if (fixture.modules.map(({ kind }) => kind).join("|") !== contract.modules.join("|")) throw new Error(`${sourceKey} requires module order ${contract.modules.join(", ")}.`);
  if (fixture.modules.some((module, index) => module.priority.value !== index + 1)) throw new Error(`${sourceKey} requires contiguous manifest priorities.`);
  unique(fixture.modules.map(({ id }) => id), "module IDs", sourceKey);
  unique(fixture.shell.destinations.map(({ id }) => id), "destination IDs", sourceKey);
  unique(fixture.shell.utilities.map(({ id }) => id), "utility IDs", sourceKey);
  fixture.shell.destinations.forEach((item) => {
    text(item.label, `destination ${item.id}`, sourceKey);
    if (item.href) validateHref(item.href, sourceKey);
    if (!item.href && !item.children?.length) throw new Error(`${sourceKey} destination ${item.id} needs a href or children.`);
    item.children?.forEach((child) => { text(child.label, `destination ${child.id}`, sourceKey); validateHref(child.href, sourceKey); });
  });
  fixture.shell.utilities.forEach((item) => text(item.label, `utility ${item.id}`, sourceKey));

  let kpis = 0;
  let charts = 0;
  let widgetRows = 0;
  let collectionRows = 0;
  let timelineRows = 0;
  let projectRows = 0;
  const usedMediaKeys = new Set<string>();
  for (const module of fixture.modules) {
    text(module.label, `module ${module.id}`, sourceKey);
    if (module.kind === "kpi-deck") {
      kpis += module.metrics.length;
      unique(module.metrics.map(({ id }) => id), `metric IDs in ${module.id}`, sourceKey);
      module.metrics.forEach((item) => { text(item.label, `metric ${item.id}`, sourceKey); text(item.value, `metric ${item.id} value`, sourceKey); });
    }
    if (module.kind === "chart-well") {
      charts += module.charts.length;
      if (!module.charts.some(({ id }) => id === module.activeChartId)) throw new Error(`${sourceKey} chart well ${module.id} has no valid active chart.`);
      unique(module.charts.map(({ id }) => id), `chart IDs in ${module.id}`, sourceKey);
      module.charts.forEach((chart) => {
        text(chart.label, `chart ${chart.id}`, sourceKey);
        if (!chart.series.length || chart.series.some((series) => series.points.length < 2)) throw new Error(`${sourceKey} chart ${chart.id} requires complete series.`);
        unique(chart.series.map(({ id }) => id), `series IDs in ${chart.id}`, sourceKey);
      });
    }
    if (module.kind === "widget") {
      widgetRows += moduleRows(module).length;
      moduleRows(module).forEach((row) => {
        validateRow(row, sourceKey);
        if (row.mediaKey) usedMediaKeys.add(row.mediaKey);
      });
      module.summary?.forEach((metric) => {
        text(metric.label, `summary ${metric.id}`, sourceKey);
        text(metric.value, `summary ${metric.id} value`, sourceKey);
      });
      if (module.presentation === "choices" && (!module.choices?.length || !module.choices.some(({ id }) => id === module.selectedChoiceId))) throw new Error(`${sourceKey} widget ${module.id} requires valid choices.`);
      if (module.action?.kind === "navigate") validateHref(module.action.href ?? "", sourceKey);
    }
    if (module.kind === "data-collection") {
      collectionRows += module.rows.length;
      if (module.columns.length < 3) throw new Error(`${sourceKey} collection ${module.id} requires at least three meaningful columns.`);
      unique(module.columns.map(({ id }) => id), `column IDs in ${module.id}`, sourceKey);
      unique(module.rows.map(({ id }) => id), `record IDs in ${module.id}`, sourceKey);
      module.rows.forEach((row) => module.columns.forEach((column) => {
        const cell = row.cells[column.id];
        if (!cell) throw new Error(`${sourceKey} record ${row.id} is missing ${column.id}.`);
        validateRow(cell, sourceKey);
        if (cell.mediaKey) usedMediaKeys.add(cell.mediaKey);
      }));
      text(module.detailLabel, `detail label in ${module.id}`, sourceKey);
      text(module.closeDetailLabel, `close detail label in ${module.id}`, sourceKey);
    }
    if (module.kind === "timeline") {
      timelineRows += module.timeline.length;
      projectRows += module.projects.length;
      module.timeline.forEach((item) => { text(item.label, `timeline item ${item.id}`, sourceKey); text(item.owner, `timeline owner ${item.id}`, sourceKey); });
      module.projects.forEach((item) => { validateRow(item, sourceKey); if (item.mediaKey) usedMediaKeys.add(item.mediaKey); });
    }
  }
  const actual = { kpis, charts, widgetRows, collectionRows, timelineRows, projectRows, media: fixture.media?.length ?? 0, retired: fixture.retiredSourceJobs?.length ?? 0 };
  for (const [key, value] of Object.entries(contract)) {
    if (key === "modules") continue;
    if (actual[key as keyof typeof actual] !== value) throw new Error(`${sourceKey} requires ${value} ${key}, got ${actual[key as keyof typeof actual]}.`);
  }
  unique((fixture.media ?? []).map(({ key }) => key), "media keys", sourceKey);
  fixture.media?.forEach((item) => { text(item.alt, `media ${item.key} alt`, sourceKey); });
  const declaredMediaKeys = new Set((fixture.media ?? []).map(({ key }) => key));
  for (const key of usedMediaKeys) if (!declaredMediaKeys.has(key)) throw new Error(`${sourceKey} uses undeclared media ${key}.`);
  for (const key of declaredMediaKeys) if (!usedMediaKeys.has(key)) throw new Error(`${sourceKey} declares unused media ${key}.`);
  if (sourceKey === "dashboard-shell-04" && fixture.shell.appearance !== "commerce-kpi") throw new Error(`${sourceKey} requires the dark commerce shell appearance.`);
  if (sourceKey === "dashboard-shell-06") {
    const retired = fixture.retiredSourceJobs?.[0];
    if (retired?.id !== "get-app-promotion" || !retired.why.trim()) throw new Error(`${sourceKey} must explicitly retire the Get App promotion.`);
    if (JSON.stringify(fixture).match(/phone|mobile app|Get App/i)) throw new Error(`${sourceKey} may not retain the retired phone promotion.`);
  }
  const validLabels = labelIds(fixture);
  for (const [stressName, stress] of Object.entries(fixture.stress)) {
    if (!Object.keys(stress.labels).length) throw new Error(`${sourceKey} stress ${stressName} requires label extremes.`);
    for (const [id, value] of Object.entries(stress.labels)) {
      if (!validLabels.has(id)) throw new Error(`${sourceKey} stress ${stressName} targets unknown label ${id}.`);
      text(value, `stress ${stressName} label ${id}`, sourceKey);
    }
  }
}

function replaceLabels<T>(value: T, labels: Record<string, string>): T {
  if (Array.isArray(value)) return value.map((item) => replaceLabels(item, labels)) as T;
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(record)) next[key] = replaceLabels(nested, labels);
  if (typeof record.id === "string" && labels[record.id] && typeof record.label === "string") next.label = labels[record.id];
  return next as T;
}

export function resolveDashboardFixture(
  fixture: DashboardFixture,
  media: DashboardMediaAsset[] = [],
  stress?: keyof DashboardFixture["stress"],
): ResolvedDashboardFixture {
  if (!/^dashboard-shell-0[1-9]$/.test(fixture.sourceKey)) throw new Error(`Invalid dashboard source key: ${fixture.sourceKey}`);
  if (Object.keys(fixture.stress).sort().join("|") !== "longLocale|short") throw new Error(`${fixture.sourceKey} requires short and longLocale stress fixtures.`);
  validateFixture(fixture);
  const declared = new Set((fixture.media ?? []).map(({ key }) => key));
  const resolved = new Map(media.map((item) => [item.key, item]));
  for (const key of declared) if (!resolved.has(key)) throw new Error(`${fixture.sourceKey} cannot resolve media ${key}.`);
  const selected = stress ? fixture.stress[stress] : undefined;
  const stressed = selected ? replaceLabels({ ...fixture, title: selected.title ?? fixture.title, description: selected.description ?? fixture.description }, selected.labels) : fixture;
  return { ...stressed, stress: fixture.stress, resolvedMedia: media.filter(({ key }) => declared.has(key)) };
}
