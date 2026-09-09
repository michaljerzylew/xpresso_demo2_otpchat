export const WIDGET_PRESETS = ["metric-rows", "entity-rows", "mini-table", "interactive", "tabbed", "twin-list"] as const;

export type WidgetPreset = (typeof WIDGET_PRESETS)[number];
export type WidgetTone = "positive" | "negative" | "warning" | "info" | "neutral";
export type WidgetCommand = { id: string; label: string; tone?: WidgetTone };
export type WidgetAction =
  | { id: string; label: string; kind: "menu"; commands: WidgetCommand[] }
  | { id: string; label: string; kind: "button" | "open-detail" }
  | { id: string; label: string; kind: "navigate"; href: string };
export type WidgetField = {
  id: string;
  label: string;
  kind: "text" | "card" | "cvc";
  placeholder?: string;
  value?: string;
  error?: string;
};
export type WidgetRow = {
  id: string;
  label: string;
  value?: string;
  detail?: string;
  secondaryValue?: string;
  delta?: { display: string; direction: "up" | "down" | "flat"; tone: WidgetTone };
  iconKey?: string;
  mediaKey?: string;
  status?: { label: string; tone: WidgetTone };
  progress?: { value: number; max: number; display?: string; kind: "line" | "ring" };
  samples?: number[];
  fields?: WidgetField[];
  actions?: WidgetAction[];
};
export type WidgetSummary = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  delta?: WidgetRow["delta"];
  progress?: WidgetRow["progress"];
};
export type WidgetTab = { id: string; label: string; iconKey?: string; rows: WidgetRow[] };
export type WidgetSelect = {
  id: string;
  label: string;
  selectedId: string;
  options: Array<{ id: string; label: string; iconKey?: string }>;
};
export type WidgetInteractive =
  | {
      kind: "plan-picker";
      selectedId: string;
      choices: Array<{ id: string; label: string; price: string; description?: string }>;
      totals: WidgetRow[];
      commit: WidgetAction;
    }
  | {
      kind: "payment-upgrade";
      currentPlan: WidgetRow;
      savedMethods: WidgetRow[];
      cardInput: WidgetField;
      commit: WidgetAction;
    }
  | {
      kind: "customer-search";
      summary: WidgetSummary[];
      previewRows: WidgetRow[];
      allRows: WidgetRow[];
      searchLabel: string;
      emptyTitle: string;
      emptyDescription: string;
      openAction: WidgetAction;
    };
export type WidgetTwin = { id: string; title: string; rows: WidgetRow[]; action?: WidgetAction };
export type WidgetMedia = { key: string; alt: string; role: "thumbnail" | "cover" | "avatar" };
export type WidgetContent = {
  title: string;
  description?: string;
  summary?: WidgetSummary[];
  rows?: WidgetRow[];
  columns?: Array<{ id: string; label: string }>;
  tabs?: WidgetTab[];
  interactive?: WidgetInteractive;
  twins?: [WidgetTwin, WidgetTwin];
  select?: WidgetSelect;
  mapLabel?: string;
  actions?: WidgetAction[];
  media?: WidgetMedia[];
};
export type WidgetFixture = WidgetContent & {
  sourceKey: `widget-component-${string}`;
  preset: WidgetPreset;
  stress: { short: WidgetContent; longLocale: WidgetContent; empty?: WidgetContent };
};

function actionShape(action: WidgetAction) {
  return [action.id, action.kind, action.kind === "menu" ? action.commands.map(({ id }) => id) : null];
}

function contentShape(content: WidgetContent) {
  return JSON.stringify({
    summary: content.summary?.map(({ id }) => id) ?? [],
    rows: content.rows?.map((row) => ({ id: row.id, iconKey: row.iconKey, mediaKey: row.mediaKey, progress: row.progress?.kind, fields: row.fields?.map((field) => [field.id, field.kind]) ?? [], actions: row.actions?.map(actionShape) ?? [] })) ?? [],
    columns: content.columns?.map(({ id }) => id) ?? [],
    tabs: content.tabs?.map((tab) => ({ id: tab.id, iconKey: tab.iconKey, rows: tab.rows.map((row) => ({ id: row.id, iconKey: row.iconKey, status: row.status?.label, progress: row.progress?.kind })) })) ?? [],
    interactive: content.interactive ? {
      kind: content.interactive.kind,
      selectedId: content.interactive.kind === "plan-picker" ? content.interactive.selectedId : undefined,
      choices: content.interactive.kind === "plan-picker" ? content.interactive.choices.map(({ id }) => id) : undefined,
      totals: content.interactive.kind === "plan-picker" ? content.interactive.totals.map(({ id }) => id) : undefined,
      currentPlan: content.interactive.kind === "payment-upgrade" ? content.interactive.currentPlan.id : undefined,
      savedMethods: content.interactive.kind === "payment-upgrade" ? content.interactive.savedMethods.map((row) => ({ id: row.id, fields: row.fields?.map((field) => [field.id, field.kind]) })) : undefined,
      cardInput: content.interactive.kind === "payment-upgrade" ? [content.interactive.cardInput.id, content.interactive.cardInput.kind] : undefined,
      summary: content.interactive.kind === "customer-search" ? content.interactive.summary.map(({ id }) => id) : undefined,
      previewRows: content.interactive.kind === "customer-search" ? content.interactive.previewRows.map(({ id }) => id) : undefined,
      allRows: content.interactive.kind === "customer-search" ? content.interactive.allRows.map(({ id }) => id) : undefined,
      action: actionShape(content.interactive.kind === "customer-search" ? content.interactive.openAction : content.interactive.commit),
    } : null,
    twins: content.twins?.map((twin) => ({ id: twin.id, rows: twin.rows.map(({ id, iconKey }) => [id, iconKey]), action: twin.action ? actionShape(twin.action) : null })) ?? [],
    select: content.select ? { id: content.select.id, selectedId: content.select.selectedId, options: content.select.options.map(({ id, iconKey }) => [id, iconKey]) } : null,
    map: Boolean(content.mapLabel),
    actions: content.actions?.map(actionShape) ?? [],
    media: content.media?.map(({ key, role }) => [key, role]) ?? [],
  });
}

type Contract = {
  preset: WidgetPreset;
  rows?: number;
  summary?: number;
  tabs?: number[];
  twins?: [number, number];
  interactive?: WidgetInteractive["kind"];
  columns?: number;
  media?: number;
  actions?: number;
};

const contracts: Record<string, Contract> = {
  "widget-component-01": { preset: "metric-rows", rows: 3, summary: 1, actions: 1 },
  "widget-component-02": { preset: "entity-rows", rows: 2, media: 1 },
  "widget-component-03": { preset: "metric-rows", rows: 5, actions: 1 },
  "widget-component-04": { preset: "metric-rows", rows: 4, summary: 1, actions: 1 },
  "widget-component-05": { preset: "entity-rows", rows: 5, media: 5, actions: 1 },
  "widget-component-06": { preset: "metric-rows", rows: 5, actions: 1 },
  "widget-component-07": { preset: "metric-rows", rows: 3, summary: 1, actions: 1 },
  "widget-component-08": { preset: "entity-rows", rows: 2, media: 1, actions: 1 },
  "widget-component-09": { preset: "metric-rows", rows: 6, actions: 1 },
  "widget-component-10": { preset: "interactive", interactive: "plan-picker", actions: 1 },
  "widget-component-11": { preset: "interactive", interactive: "payment-upgrade", actions: 1 },
  "widget-component-12": { preset: "metric-rows", rows: 5, actions: 1 },
  "widget-component-13": { preset: "metric-rows", rows: 5, actions: 1 },
  "widget-component-14": { preset: "mini-table", rows: 5, columns: 3, actions: 1 },
  "widget-component-15": { preset: "tabbed", tabs: [3, 3, 3], summary: 1, media: 1, actions: 1 },
  "widget-component-16": { preset: "entity-rows", rows: 3, media: 6, actions: 2 },
  "widget-component-17": { preset: "tabbed", tabs: [4, 4, 4], actions: 1 },
  "widget-component-18": { preset: "twin-list", twins: [5, 5] },
  "widget-component-19": { preset: "entity-rows", rows: 2, summary: 1, actions: 1 },
  "widget-component-20": { preset: "interactive", interactive: "customer-search", actions: 1 },
};

const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

function validateAction(action: WidgetAction, sourceKey: string) {
  text(action.label, "action label", sourceKey);
  if (action.kind === "navigate" && (!action.href.startsWith("/demo/") || action.href.includes("#"))) throw new Error(`${sourceKey} navigation requires a safe local demo destination.`);
  if (action.kind === "menu") {
    if (action.commands.length !== 3) throw new Error(`${sourceKey} menu requires exactly three commands.`);
    unique(action.commands.map(({ id }) => id), "menu command IDs", sourceKey);
    action.commands.forEach((command) => text(command.label, "menu command label", sourceKey));
  }
}

function validateField(field: WidgetField, sourceKey: string) {
  text(field.label, "field label", sourceKey);
  if (field.placeholder !== undefined) text(field.placeholder, "field placeholder", sourceKey);
  if (field.kind === "cvc" && field.value && !/^\d{3,4}$/.test(field.value)) throw new Error(`${sourceKey} CVC fields require three or four digits.`);
}

function validateRow(row: WidgetRow, sourceKey: string) {
  text(row.label, "row label", sourceKey);
  if (row.value !== undefined) text(row.value, "row value", sourceKey);
  if (row.progress && (!(row.progress.max > 0) || row.progress.value < 0 || row.progress.value > row.progress.max)) throw new Error(`${sourceKey} row ${row.id} has invalid progress.`);
  if (row.samples && row.samples.length < 2) throw new Error(`${sourceKey} row ${row.id} requires at least two samples.`);
  unique((row.fields ?? []).map(({ id }) => id), `field IDs in ${row.id}`, sourceKey);
  row.fields?.forEach((field) => validateField(field, sourceKey));
  unique((row.actions ?? []).map(({ id }) => id), `action IDs in ${row.id}`, sourceKey);
  row.actions?.forEach((action) => validateAction(action, sourceKey));
}

function allActions(content: WidgetContent) {
  const nested = content.rows?.flatMap((row) => row.actions ?? []) ?? [];
  const twins = content.twins?.flatMap((twin) => twin.action ? [twin.action] : []) ?? [];
  const commit = content.interactive ? [content.interactive.kind === "customer-search" ? content.interactive.openAction : content.interactive.commit] : [];
  return [...(content.actions ?? []), ...nested, ...twins, ...commit];
}

function validateContent(sourceKey: string, preset: WidgetPreset, content: WidgetContent) {
  const contract = contracts[sourceKey];
  if (!contract) throw new Error(`Invalid widget source key: ${sourceKey}`);
  if (preset !== contract.preset) throw new Error(`${sourceKey} requires preset ${contract.preset}.`);
  text(content.title, "title", sourceKey);
  if (content.description !== undefined) text(content.description, "description", sourceKey);
  if ((content.rows?.length ?? 0) !== (contract.rows ?? 0)) throw new Error(`${sourceKey} requires ${contract.rows ?? 0} rows.`);
  if ((content.summary?.length ?? 0) !== (contract.summary ?? 0)) throw new Error(`${sourceKey} requires ${contract.summary ?? 0} summary rows.`);
  if ((content.columns?.length ?? 0) !== (contract.columns ?? 0)) throw new Error(`${sourceKey} requires ${contract.columns ?? 0} columns.`);
  if ((content.media?.length ?? 0) !== (contract.media ?? 0)) throw new Error(`${sourceKey} requires ${contract.media ?? 0} media seats.`);
  if ((content.actions?.length ?? 0) !== (contract.actions ?? 0)) throw new Error(`${sourceKey} requires ${contract.actions ?? 0} top-level actions.`);
  unique((content.rows ?? []).map(({ id }) => id), "row IDs", sourceKey);
  unique((content.summary ?? []).map(({ id }) => id), "summary IDs", sourceKey);
  unique((content.columns ?? []).map(({ id }) => id), "column IDs", sourceKey);
  unique((content.media ?? []).map(({ key }) => key), "media keys", sourceKey);
  content.rows?.forEach((row) => validateRow(row, sourceKey));
  content.media?.forEach((media) => text(media.alt, "media alt", sourceKey));
  const actions = allActions(content);
  unique(actions.map(({ id }) => id), "action IDs", sourceKey);
  actions.forEach((action) => validateAction(action, sourceKey));

  if (contract.tabs) {
    if ((content.tabs?.length ?? 0) !== contract.tabs.length || content.tabs?.some((tab, index) => tab.rows.length !== contract.tabs?.[index])) throw new Error(`${sourceKey} requires tab row counts ${contract.tabs.join(", ")}.`);
    unique(content.tabs?.map(({ id }) => id) ?? [], "tab IDs", sourceKey);
    content.tabs?.forEach((tab) => { text(tab.label, "tab label", sourceKey); unique(tab.rows.map(({ id }) => id), `row IDs in ${tab.id}`, sourceKey); tab.rows.forEach((row) => validateRow(row, sourceKey)); });
  } else if (content.tabs) throw new Error(`${sourceKey} may not declare tabs.`);

  if (contract.twins) {
    if (!content.twins || content.twins[0].rows.length !== contract.twins[0] || content.twins[1].rows.length !== contract.twins[1]) throw new Error(`${sourceKey} requires twin row counts ${contract.twins.join(", ")}.`);
    unique(content.twins.map(({ id }) => id), "twin IDs", sourceKey);
    content.twins.forEach((twin) => { text(twin.title, "twin title", sourceKey); unique(twin.rows.map(({ id }) => id), `row IDs in ${twin.id}`, sourceKey); twin.rows.forEach((row) => validateRow(row, sourceKey)); });
  } else if (content.twins) throw new Error(`${sourceKey} may not declare twins.`);

  if (contract.interactive) {
    if (content.interactive?.kind !== contract.interactive) throw new Error(`${sourceKey} requires ${contract.interactive}.`);
    if (content.interactive.kind === "plan-picker") {
      const selectedId = content.interactive.selectedId;
      if (content.interactive.choices.length !== 4 || content.interactive.totals.length !== 2 || !content.interactive.choices.some(({ id }) => id === selectedId)) throw new Error(`${sourceKey} requires four plans, two totals and a valid selection.`);
    }
    if (content.interactive.kind === "payment-upgrade") {
      if (content.interactive.savedMethods.length !== 2 || content.interactive.savedMethods.some((row) => row.fields?.length !== 1 || row.fields[0]?.kind !== "cvc") || content.interactive.cardInput.kind !== "card") throw new Error(`${sourceKey} requires two saved CVC methods and one card input.`);
    }
    if (content.interactive.kind === "customer-search") {
      if (content.interactive.summary.length !== 2 || content.interactive.previewRows.length !== 5 || content.interactive.allRows.length !== 27) throw new Error(`${sourceKey} requires two states, five preview rows and twenty-seven searchable rows.`);
      text(content.interactive.searchLabel, "search label", sourceKey);
      text(content.interactive.emptyTitle, "empty title", sourceKey);
      text(content.interactive.emptyDescription, "empty description", sourceKey);
    }
  } else if (content.interactive) throw new Error(`${sourceKey} may not declare an interactive payload.`);

  if (sourceKey === "widget-component-02" && (content.rows?.some((row) => row.samples?.length !== 5) || content.media?.[0]?.role !== "thumbnail")) throw new Error(`${sourceKey} requires two five-bar measures and one thumbnail.`);
  if (sourceKey === "widget-component-08" && content.rows?.some((row) => {
    const action = row.actions?.[0];
    return action?.kind !== "menu" || action.commands.length !== 3;
  })) throw new Error(`${sourceKey} requires a three-command menu per account.`);
  if (sourceKey === "widget-component-12" && content.rows?.some((row) => row.progress?.kind !== "ring")) throw new Error(`${sourceKey} requires five ring rows.`);
  if (sourceKey === "widget-component-13" && content.rows?.some((row) => row.progress?.kind !== "ring")) throw new Error(`${sourceKey} requires five browser ring rows.`);
  if (sourceKey === "widget-component-17" && content.tabs?.some((tab) => tab.rows.filter((row) => row.status?.label === "Sender").length !== 2 || tab.rows.filter((row) => row.status?.label === "Receiver").length !== 2)) throw new Error(`${sourceKey} requires two sender and two receiver rows per tab.`);
  if (sourceKey === "widget-component-18" && content.twins?.[1].rows.some((row) => !row.delta)) throw new Error(`${sourceKey} requires volume deltas on all five rows.`);
  if (sourceKey === "widget-component-19") {
    if (!content.select || content.select.options.length !== 5 || !content.select.options.some(({ id }) => id === content.select?.selectedId) || !content.mapLabel) throw new Error(`${sourceKey} requires a five-country selector and system map.`);
  }
}

export function resolveWidgetFixture(fixture: WidgetFixture, stress?: keyof WidgetFixture["stress"]): WidgetFixture {
  if (!/^widget-component-(0[1-9]|1[0-9]|20)$/.test(fixture.sourceKey)) throw new Error(`Invalid widget source key: ${fixture.sourceKey}`);
  if (!WIDGET_PRESETS.includes(fixture.preset)) throw new Error(`${fixture.sourceKey} has an invalid widget preset.`);
  const keys = Object.keys(fixture.stress).sort().join("|");
  if (keys !== "longLocale|short" && keys !== "empty|longLocale|short") throw new Error(`${fixture.sourceKey} requires short and longLocale stress fixtures, with optional empty.`);
  const content = stress ? fixture.stress[stress] : fixture;
  if (!content) throw new Error(`${fixture.sourceKey} does not declare stress ${stress}.`);
  if (stress && contentShape(content) !== contentShape(fixture)) throw new Error(`${fixture.sourceKey} stress ${stress} changes structural IDs, kinds, state ownership or media keys.`);
  validateContent(fixture.sourceKey, fixture.preset, content);
  return { ...fixture, ...content, stress: fixture.stress };
}
