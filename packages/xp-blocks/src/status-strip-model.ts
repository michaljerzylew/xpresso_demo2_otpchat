import { requireMetricText, requireUniqueMetricIds, type MetricTone } from "./metric-model";

export type StatusTone = "operational" | "degraded" | "downtime" | "inactive";
export type StatusTick = { id: string; label: string; tone: StatusTone; detail: Array<{ id: string; label: string; value: string }> };
export type StatusService = {
  id: string;
  label: string;
  statusLabel: string;
  statusTone: StatusTone;
  uptimeLabel: string;
  ticks: StatusTick[];
  meta?: Array<{ id: string; label: string; value: string }>;
  incidents?: Array<{ id: string; label: string; description: string; statusLabel: string }>;
};
export type StatusStripStress = Partial<Omit<StatusStripFixture, "sourceKey" | "preset" | "stress">>;
export type StatusStripFixture = {
  sourceKey: `chart-component-${string}`;
  preset: "single-service" | "service-incidents" | "pipeline-run" | "monitor-accordion" | "system-services";
  title: string;
  summary: Array<{ id: string; label: string; value: string; tone?: MetricTone }>;
  services: StatusService[];
  legend: Array<{ tone: StatusTone; label: string }>;
  expandedServiceId?: string;
  copy: {
    expandLabel: string;
    collapseLabel: string;
    stripInstructions: string;
    dismissDetailLabel: string;
    legendLabel: string;
    announcements: { dayChanged: string; serviceExpanded: string; serviceCollapsed: string };
  };
  stress: { short: StatusStripStress; longLocale: StatusStripStress };
};

const contracts = {
  "chart-component-52": { preset: "single-service", services: 1, ticks: [90] },
  "chart-component-53": { preset: "service-incidents", services: 1, ticks: [90] },
  "chart-component-54": { preset: "pipeline-run", services: 1, ticks: [60] },
  "chart-component-55": { preset: "monitor-accordion", services: 4, ticks: [60, 60, 60, 60] },
  "chart-component-56": { preset: "system-services", services: 2, ticks: [60, 60] },
} as const;

function validateResolvedStatusStrip(fixture: Omit<StatusStripFixture, "stress">) {
  const contract = contracts[fixture.sourceKey as keyof typeof contracts];
  if (!contract) throw new Error(`Invalid StatusStrip source key: ${fixture.sourceKey}`);
  if (fixture.preset !== contract.preset) throw new Error(`${fixture.sourceKey} requires preset ${contract.preset}.`);
  if (fixture.services.length !== contract.services) throw new Error(`${fixture.sourceKey} requires ${contract.services} services.`);
  if (fixture.services.map(({ ticks }) => ticks.length).join("|") !== contract.ticks.join("|")) throw new Error(`${fixture.sourceKey} requires tick counts ${contract.ticks.join(", ")}.`);
  requireMetricText(fixture.title, "title", fixture.sourceKey);
  requireUniqueMetricIds(fixture.services.map(({ id }) => id), "service IDs", fixture.sourceKey);
  requireUniqueMetricIds(fixture.summary.map(({ id }) => id), "summary IDs", fixture.sourceKey);
  if (fixture.legend.length !== 4 || new Set(fixture.legend.map(({ tone }) => tone)).size !== 4) throw new Error(`${fixture.sourceKey} requires the complete four-state legend.`);
  Object.entries(fixture.copy.announcements).forEach(([key, value]) => requireMetricText(value, `${key} announcement`, fixture.sourceKey));
  requireMetricText(fixture.copy.expandLabel, "expand label", fixture.sourceKey);
  requireMetricText(fixture.copy.collapseLabel, "collapse label", fixture.sourceKey);
  requireMetricText(fixture.copy.stripInstructions, "strip instructions", fixture.sourceKey);
  requireMetricText(fixture.copy.dismissDetailLabel, "dismiss detail label", fixture.sourceKey);
  requireMetricText(fixture.copy.legendLabel, "legend label", fixture.sourceKey);
  for (const service of fixture.services) {
    requireMetricText(service.label, "service label", fixture.sourceKey);
    requireMetricText(service.statusLabel, "service status label", fixture.sourceKey);
    requireMetricText(service.uptimeLabel, "uptime label", fixture.sourceKey);
    requireUniqueMetricIds(service.ticks.map(({ id }) => id), `tick IDs in ${service.id}`, fixture.sourceKey);
    for (const tick of service.ticks) requireMetricText(tick.label, "tick label", fixture.sourceKey);
  }
  if (fixture.sourceKey === "chart-component-53" && fixture.services[0].incidents?.length !== 8) throw new Error(`${fixture.sourceKey} requires eight fixture-owned incidents.`);
  if (fixture.sourceKey !== "chart-component-53" && fixture.services.some(({ incidents }) => incidents?.length)) throw new Error(`${fixture.sourceKey} cannot invent incidents.`);
  if (fixture.sourceKey === "chart-component-54" && (fixture.services[0].meta?.length ?? 0) < 4) throw new Error(`${fixture.sourceKey} requires region, synchronization, run, and pipeline metadata.`);
  if (fixture.preset === "monitor-accordion" && (!fixture.expandedServiceId || !fixture.services.some(({ id }) => id === fixture.expandedServiceId))) throw new Error(`${fixture.sourceKey} requires one expanded monitor.`);
  if (fixture.preset === "monitor-accordion" && new Set(fixture.services.map(({ statusTone }) => statusTone)).size !== 4) throw new Error(`${fixture.sourceKey} requires four distinct current monitor states.`);
  if (fixture.sourceKey === "chart-component-56" && fixture.services.some(({ ticks }) => ticks.some(({ detail }) => detail.length < 4))) throw new Error(`${fixture.sourceKey} requires rich detail on every service tick.`);
  if (/\b(?:Status chart-component|Tick \d+|Srv \d+|D\d+|V\d+)\b/i.test(JSON.stringify(fixture))) throw new Error(`${fixture.sourceKey} contains placeholder copy.`);
}

export function resolveStatusStripFixture(fixture: StatusStripFixture, stress?: keyof StatusStripFixture["stress"]): StatusStripFixture {
  if (!/^chart-component-5[2-6]$/.test(fixture.sourceKey)) throw new Error(`Invalid StatusStrip source key: ${fixture.sourceKey}`);
  if (Object.keys(fixture.stress).sort().join("|") !== "longLocale|short") throw new Error(`${fixture.sourceKey} requires short and longLocale stress fixtures.`);
  const resolved = stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture;
  validateResolvedStatusStrip(resolved as Omit<StatusStripFixture, "stress">);
  return resolved;
}
