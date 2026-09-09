export const EMPTY_SURFACE_PRESETS = [
  "metric-message",
  "onboarding",
  "quota-summary",
  "quota-collection",
  "chart-tabs",
  "chart-kpis",
  "dashboard-skeleton",
  "finance-split",
  "report-skeleton",
  "project-browser",
] as const;

export type EmptySurfacePreset = (typeof EMPTY_SURFACE_PRESETS)[number];
export type EmptyAction = { id: string; label: string; href: string; tone: "primary" | "secondary" | "quiet"; icon?: "add" | "arrow" | "report" | "settings" };
export type EmptyChoice = { id: string; label: string };
export type EmptyRegion = { id: string; kind: string };
export type EmptyQuota = { id: string; label: string; value: string; limit: string };
export type EmptySeries = { id: string; label: string };
export type EmptySummary = { id: string; label: string; value: string };
export type EmptyProject = { id: string; name: string; description: string };

export type EmptyProof =
  | { kind: "message" }
  | { kind: "quotas"; items: EmptyQuota[]; resetTitle?: string; resetDescription?: string }
  | { kind: "chart"; tabs?: EmptyChoice[]; status?: string; series: EmptySeries[]; ticks: string[] }
  | { kind: "dashboard"; tabs: EmptyChoice[]; regions: EmptyRegion[] }
  | { kind: "finance"; chartDescription: string; chartUtilityLabel: string; summaryTitle: string; summaryDescription: string; summaryUtilityLabel: string; ticks: string[]; summaries: EmptySummary[] }
  | { kind: "report"; filters: Array<{ id: string; label: string; choices: EmptyChoice[] }>; regions: EmptyRegion[] }
  | { kind: "projects"; groups: Array<{ id: string; label: string; count: number; projects: EmptyProject[] }> };

export type EmptySurfaceFixture = {
  sourceKey: `empty-state-${string}`;
  preset: EmptySurfacePreset;
  appearance: EmptySurfacePreset;
  title: string;
  description?: string;
  metric?: { label: string; value: string };
  message?: { icon: string; title: string; description: string };
  actions: EmptyAction[];
  proof: EmptyProof;
  stress?: Record<string, Partial<Omit<EmptySurfaceFixture, "stress">>>;
};

const contracts: Record<EmptySurfacePreset, { proof: EmptyProof["kind"]; actions: number; count?: number }> = {
  "metric-message": { proof: "message", actions: 0 },
  onboarding: { proof: "message", actions: 1 },
  "quota-summary": { proof: "quotas", actions: 1, count: 3 },
  "quota-collection": { proof: "quotas", actions: 1, count: 4 },
  "chart-tabs": { proof: "chart", actions: 1, count: 2 },
  "chart-kpis": { proof: "chart", actions: 1, count: 3 },
  "dashboard-skeleton": { proof: "dashboard", actions: 1, count: 4 },
  "finance-split": { proof: "finance", actions: 1, count: 3 },
  "report-skeleton": { proof: "report", actions: 0, count: 2 },
  "project-browser": { proof: "projects", actions: 0, count: 3 },
};

const presetBySource = Object.fromEntries(EMPTY_SURFACE_PRESETS.map((preset, index) => [`empty-state-${String(index + 1).padStart(2, "0")}`, preset])) as Record<string, EmptySurfacePreset>;
const requireText = (value: unknown, label: string, sourceKey: string) => { if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`); };
const unique = (values: string[], label: string, sourceKey: string) => { if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`); };
const proofCount = (proof: EmptyProof) => proof.kind === "quotas" ? proof.items.length : proof.kind === "chart" ? proof.series.length : proof.kind === "dashboard" ? proof.regions.length : proof.kind === "finance" ? proof.summaries.length : proof.kind === "report" ? proof.filters.length : proof.kind === "projects" ? proof.groups.length : 0;

export function resolveEmptySurfaceFixture(fixture: EmptySurfaceFixture): EmptySurfaceFixture {
  if (!/^empty-state-(0[1-9]|10)$/.test(fixture.sourceKey)) throw new Error(`Invalid empty-state source key: ${fixture.sourceKey}`);
  if (!EMPTY_SURFACE_PRESETS.includes(fixture.preset) || fixture.appearance !== fixture.preset) throw new Error(`${fixture.sourceKey} has an invalid EmptySurface preset.`);
  if (presetBySource[fixture.sourceKey] !== fixture.preset) throw new Error(`${fixture.sourceKey} must resolve to ${presetBySource[fixture.sourceKey]}.`);
  requireText(fixture.title, "title", fixture.sourceKey);
  const contract = contracts[fixture.preset];
  if (fixture.proof.kind !== contract.proof) throw new Error(`${fixture.sourceKey} requires ${contract.proof} proof.`);
  if (fixture.actions.length !== contract.actions) throw new Error(`${fixture.sourceKey} requires ${contract.actions} actions.`);
  if (contract.count !== undefined && proofCount(fixture.proof) !== contract.count) throw new Error(`${fixture.sourceKey} requires ${contract.count} proof items.`);
  unique(fixture.actions.map(({ id }) => id), "action IDs", fixture.sourceKey);
  for (const action of fixture.actions) {
    requireText(action.label, "action label", fixture.sourceKey);
    if (!action.href.startsWith("/demo/") || action.href === "#") throw new Error(`${fixture.sourceKey} requires local action destinations.`);
  }
  if (fixture.preset === "metric-message" && (!fixture.metric || !fixture.message)) throw new Error(`${fixture.sourceKey} requires metric and message copy.`);
  if ((fixture.preset === "onboarding" || fixture.preset === "dashboard-skeleton") && !fixture.message) throw new Error(`${fixture.sourceKey} requires message copy.`);
  if (fixture.proof.kind === "quotas") {
    unique(fixture.proof.items.map(({ id }) => id), "quota IDs", fixture.sourceKey);
    for (const item of fixture.proof.items) for (const [label, value] of Object.entries(item)) requireText(value, `quota ${label}`, fixture.sourceKey);
  }
  if (fixture.proof.kind === "chart") {
    unique(fixture.proof.series.map(({ id }) => id), "series IDs", fixture.sourceKey);
    if (fixture.preset === "chart-tabs" && fixture.proof.tabs?.length !== 2) throw new Error(`${fixture.sourceKey} requires two chart tabs.`);
    if (fixture.preset === "chart-kpis" && fixture.proof.ticks.length !== 12) throw new Error(`${fixture.sourceKey} requires twelve month ticks.`);
  }
  if (fixture.proof.kind === "dashboard" && fixture.proof.tabs.length !== 2) throw new Error(`${fixture.sourceKey} requires two dashboard tabs.`);
  if (fixture.proof.kind === "finance") {
    if (fixture.proof.ticks.length !== 7) throw new Error(`${fixture.sourceKey} requires seven finance ticks.`);
    for (const key of ["chartDescription", "chartUtilityLabel", "summaryTitle", "summaryDescription", "summaryUtilityLabel"] as const) requireText(fixture.proof[key], `finance ${key}`, fixture.sourceKey);
  }
  if (fixture.proof.kind === "report") for (const filter of fixture.proof.filters) if (filter.choices.length < 2) throw new Error(`${fixture.sourceKey} filter ${filter.id} requires choices.`);
  if (fixture.proof.kind === "projects") {
    const counts = fixture.proof.groups.map(({ count }) => count).join("|");
    if (counts !== "6|3|2" || fixture.proof.groups.some((group) => group.projects.length !== group.count)) throw new Error(`${fixture.sourceKey} requires project groups 6, 3 and 2.`);
  }
  return fixture;
}
