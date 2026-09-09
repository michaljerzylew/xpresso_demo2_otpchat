export const SETTINGS_PRESETS = [
  "profile",
  "notifications",
  "workspace",
  "connectors",
  "members",
  "security",
  "billing",
] as const;

export type SettingsPreset = (typeof SETTINGS_PRESETS)[number];
export type SettingsControl =
  | { kind: "text" | "email" | "tel" | "url" | "password" | "number" | "time"; id: string; label: string; value?: string | number; placeholder?: string; required?: boolean; readOnly?: boolean; hint?: string; visibilityToggleLabel?: string }
  | { kind: "textarea"; id: string; label: string; value?: string; placeholder?: string; maxLength?: number; hint?: string }
  | { kind: "select" | "radio"; id: string; label: string; selectedId?: string; choices: Array<{ id: string; label: string; hint?: string }> }
  | { kind: "switch" | "checkbox"; id: string; label: string; checked: boolean; hint?: string }
  | { kind: "upload"; id: string; label: string; accept: string[]; maxBytes: number; mediaKey?: string; hint?: string }
  | { kind: "range"; id: string; label: string; value: number; min: number; max: number; unit?: string };

export type SettingsAction = {
  id: string;
  label: string;
  tone: "primary" | "secondary" | "danger" | "quiet";
  job: "commit" | "create" | "connect" | "disconnect" | "remove" | "copy" | "download" | "detail" | "paginate";
  requiresConfirmation?: boolean;
};

export type SettingsRecord = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  mediaKey?: string;
  values?: Array<{ label: string; value: string }>;
  controls?: SettingsControl[];
  actions?: SettingsAction[];
};

export type SettingsSection = {
  id: string;
  label: string;
  description?: string;
  kind: "fields" | "matrix" | "directory" | "collection" | "security" | "billing" | "danger";
  controls?: SettingsControl[];
  records?: SettingsRecord[];
  matrix?: {
    columns: Array<{ id: string; label: string }>;
    groups: Array<{ id: string; label: string; rows: Array<{ id: string; label: string; values: Record<string, boolean> }> }>;
  };
  actions?: SettingsAction[];
  compactHint?: "accordion" | "records" | "subpage" | "snap";
};

export type SettingsMediaReference = { key: string; role: "avatar" | "connector-mark" | "payment-mark" | "upload-preview"; alt: string };
export type SettingsMediaAsset = { key: string; kind: "raster" | "system"; src?: string; alt: string };
export type SettingsAlert = { title: string; description: string; tone: "info" | "warning" };
export type SettingsStress = {
  title?: string;
  description?: string;
  sectionLabels?: Record<string, string>;
  actionLabels?: Record<string, string>;
};

export type AccountSettingsFixture = {
  sourceKey: `account-settings-${string}`;
  preset: SettingsPreset;
  title: string;
  description?: string;
  alert?: SettingsAlert;
  sections: SettingsSection[];
  initialSectionId: string;
  media?: SettingsMediaReference[];
  stress: { short: SettingsStress; longLocale: SettingsStress; error: SettingsStress };
};

export type ResolvedAccountSettingsFixture = AccountSettingsFixture & { resolvedMedia: SettingsMediaAsset[] };

type SourceContract = {
  preset: SettingsPreset;
  kinds: SettingsSection["kind"][];
  records: number[];
  media: number;
};

const contracts: Record<string, SourceContract> = {
  "account-settings-01": { preset: "profile", kinds: ["fields", "fields", "collection", "collection", "danger"], records: [0, 0, 2, 3, 0], media: 1 },
  "account-settings-02": { preset: "notifications", kinds: ["matrix", "fields", "fields", "fields"], records: [0, 0, 0, 0], media: 0 },
  "account-settings-03": { preset: "workspace", kinds: ["fields", "fields", "collection", "collection", "danger"], records: [0, 0, 3, 2, 0], media: 1 },
  "account-settings-04": { preset: "connectors", kinds: ["directory", "directory", "directory"], records: [3, 6, 4], media: 13 },
  "account-settings-05": { preset: "members", kinds: ["collection", "collection"], records: [6, 2], media: 8 },
  "account-settings-06": { preset: "security", kinds: ["security", "collection", "collection"], records: [0, 3, 12], media: 0 },
  "account-settings-07": { preset: "billing", kinds: ["billing", "fields", "collection", "billing", "collection"], records: [6, 0, 2, 1, 2], media: 2 },
};

const requireText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};

const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

function allActions(fixture: AccountSettingsFixture) {
  return fixture.sections.flatMap((section) => [...(section.actions ?? []), ...(section.records ?? []).flatMap((record) => record.actions ?? [])]);
}

function applyStress(fixture: AccountSettingsFixture, stress?: keyof AccountSettingsFixture["stress"]): AccountSettingsFixture {
  if (!stress) return fixture;
  const patch = fixture.stress[stress];
  return {
    ...fixture,
    title: patch.title ?? fixture.title,
    description: patch.description ?? fixture.description,
    sections: fixture.sections.map((section) => ({
      ...section,
      label: patch.sectionLabels?.[section.id] ?? section.label,
      actions: section.actions?.map((action) => ({ ...action, label: patch.actionLabels?.[action.id] ?? action.label })),
      records: section.records?.map((record) => ({
        ...record,
        actions: record.actions?.map((action) => ({ ...action, label: patch.actionLabels?.[action.id] ?? action.label })),
      })),
    })),
  };
}

export function resolveAccountSettingsFixture(
  input: AccountSettingsFixture,
  media: SettingsMediaAsset[] = [],
  stress?: keyof AccountSettingsFixture["stress"],
): ResolvedAccountSettingsFixture {
  if (!/^account-settings-0[1-7]$/.test(input.sourceKey)) throw new Error(`Invalid account-settings source key: ${input.sourceKey}`);
  const fixture = applyStress(input, stress);
  const contract = contracts[fixture.sourceKey];
  if (!contract || fixture.preset !== contract.preset) throw new Error(`${fixture.sourceKey} has an invalid settings preset.`);
  if (fixture.sections.map((section) => section.kind).join("|") !== contract.kinds.join("|")) throw new Error(`${fixture.sourceKey} has an invalid section-kind sequence.`);
  if (fixture.sections.map((section) => section.records?.length ?? 0).join("|") !== contract.records.join("|")) throw new Error(`${fixture.sourceKey} has an invalid record-count sequence.`);
  if (!fixture.sections.some((section) => section.id === fixture.initialSectionId)) throw new Error(`${fixture.sourceKey} requires a valid initial section.`);
  if (Object.keys(fixture.stress).sort().join("|") !== "error|longLocale|short") throw new Error(`${fixture.sourceKey} requires short, longLocale and error stress fixtures.`);
  requireText(fixture.title, "title", fixture.sourceKey);
  unique(fixture.sections.map((section) => section.id), "section IDs", fixture.sourceKey);
  const ids: string[] = [...fixture.sections.map((section) => section.id)];
  for (const section of fixture.sections) {
    requireText(section.label, "section label", fixture.sourceKey);
    if (section.description !== undefined) requireText(section.description, "section description", fixture.sourceKey);
    ids.push(...(section.controls ?? []).map((control) => control.id));
    ids.push(...(section.records ?? []).map((record) => record.id));
    for (const control of section.controls ?? []) {
      requireText(control.label, "control label", fixture.sourceKey);
      if ((control.kind === "select" || control.kind === "radio") && !control.choices.length) throw new Error(`${fixture.sourceKey} control ${control.id} requires choices.`);
    }
    for (const record of section.records ?? []) {
      requireText(record.title, "record title", fixture.sourceKey);
      ids.push(...(record.controls ?? []).map((control) => control.id));
      ids.push(...(record.actions ?? []).map((action) => action.id));
      if (record.mediaKey && !(fixture.media ?? []).some(({ key }) => key === record.mediaKey)) throw new Error(`${fixture.sourceKey} record ${record.id} cannot resolve declared media ${record.mediaKey}.`);
    }
    ids.push(...(section.actions ?? []).map((action) => action.id));
    if (section.matrix) {
      ids.push(...section.matrix.columns.map((column) => column.id));
      ids.push(...section.matrix.groups.map((group) => group.id), ...section.matrix.groups.flatMap((group) => group.rows.map((row) => row.id)));
      for (const group of section.matrix.groups) for (const row of group.rows) {
        if (Object.keys(row.values).sort().join("|") !== section.matrix.columns.map((column) => column.id).sort().join("|")) throw new Error(`${fixture.sourceKey} matrix row ${row.id} has incomplete channel ownership.`);
      }
    }
  }
  unique(ids, "nested IDs", fixture.sourceKey);
  for (const action of allActions(fixture)) {
    requireText(action.label, "action label", fixture.sourceKey);
    if (action.tone === "danger" && !action.requiresConfirmation) throw new Error(`${fixture.sourceKey} destructive action ${action.id} requires confirmation.`);
  }
  if ((fixture.media ?? []).length !== contract.media) throw new Error(`${fixture.sourceKey} requires ${contract.media} media references.`);
  const resolvedKeys = new Set(media.map((asset) => asset.key));
  for (const reference of fixture.media ?? []) if (!resolvedKeys.has(reference.key)) throw new Error(`${fixture.sourceKey} cannot resolve media ${reference.key}.`);

  if (fixture.sourceKey === "account-settings-01") {
    if ((fixture.sections[0].controls?.length ?? 0) !== 7 || (fixture.sections[1].controls?.length ?? 0) !== 3) throw new Error(`${fixture.sourceKey} requires avatar plus six personal controls and three credential controls.`);
  }
  if (fixture.sourceKey === "account-settings-02") {
    const matrix = fixture.sections[0].matrix;
    if (!matrix || matrix.columns.length !== 3 || matrix.groups.map((group) => group.rows.length).join("|") !== "2|2|3") throw new Error(`${fixture.sourceKey} requires the exact 3 by 7 notification matrix in 2+2+3 groups.`);
    if ((fixture.sections[1].controls?.length ?? 0) !== 4 || (fixture.sections[2].controls?.length ?? 0) !== 4 || (fixture.sections[3].controls?.length ?? 0) !== 10) throw new Error(`${fixture.sourceKey} requires exact inbox, browser and DND controls.`);
  }
  if (fixture.sourceKey === "account-settings-04") for (const record of fixture.sections.flatMap((section) => section.records ?? [])) {
    if ((record.values?.filter(({ label }) => label.startsWith("Feature")).length ?? 0) !== 4 || (record.values?.filter(({ label }) => label.startsWith("Workflow")).length ?? 0) !== 4) throw new Error(`${fixture.sourceKey} connector ${record.id} requires four features and four workflows.`);
  }
  if (fixture.sourceKey === "account-settings-05" && fixture.sections.flatMap((section) => section.records ?? []).some((record) => !(record.controls?.some((control) => control.kind === "select")))) throw new Error(`${fixture.sourceKey} requires a role selector for every person.`);
  if (fixture.sourceKey === "account-settings-06" && (fixture.sections[2].actions?.filter((action) => action.job === "paginate").length ?? 0) !== 2) throw new Error(`${fixture.sourceKey} requires previous and next session pagination actions.`);
  if (fixture.sourceKey === "account-settings-07" && (fixture.sections[0].records?.filter((record) => record.status === "usage").length ?? 0) !== 3) throw new Error(`${fixture.sourceKey} requires exactly three usage meters.`);
  if (fixture.sourceKey === "account-settings-07") {
    if (!fixture.alert) throw new Error(`${fixture.sourceKey} requires the source-owned free-plan alert.`);
    requireText(fixture.alert.title, "alert title", fixture.sourceKey);
    requireText(fixture.alert.description, "alert description", fixture.sourceKey);
  } else if (fixture.alert) throw new Error(`${fixture.sourceKey} cannot invent a top-level settings alert.`);

  return { ...fixture, resolvedMedia: media };
}
