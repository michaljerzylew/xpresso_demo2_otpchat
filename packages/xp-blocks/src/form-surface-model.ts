export const FORM_SURFACE_PRESETS = [
  "profile-grid",
  "sectioned-settings",
  "workspace-package",
  "workspace-plans",
  "tabbed-profile",
  "checkout-accordion",
  "checkout-sections",
  "product-wizard",
  "account-wizard",
] as const;

export type FormSurfacePreset = (typeof FORM_SURFACE_PRESETS)[number];
export type FormFieldKind = "text" | "email" | "tel" | "password" | "textarea" | "select" | "date" | "number" | "checkbox" | "radio" | "switch" | "combobox";
export type FormOption = { id: string; label: string };
export type FormFieldModel = {
  id: string;
  kind: FormFieldKind;
  label: string;
  placeholder?: string;
  value?: string | number | boolean | string[];
  help?: string;
  error?: string;
  required?: boolean;
  span?: "one" | "two" | "full";
  iconKey?: string;
  options?: FormOption[];
  visibilityToggleLabel?: string;
};
export type FormChoice = {
  id: string;
  label: string;
  description?: string;
  price?: string;
  badge?: string;
  iconKey?: string;
  details?: string[];
  disabled?: boolean;
  disabledReason?: string;
};
export type FormChoiceSetModel = {
  id: string;
  label: string;
  selection: "single" | "multi";
  value?: string | string[];
  presentation: "compact" | "rich" | "priced" | "delivery";
  options: FormChoice[];
  selectedDetails?: string[];
};
export type FormOptionRow = { id: string; label: string; value: string };
export type FormHelp = { title: string; description?: string; reasons?: string[]; link?: { label: string; href: string } };
export type FormSummaryRow = { id: string; label: string; value: string };
export type FormSectionModel = {
  id: string;
  number?: number;
  title: string;
  description?: string;
  fields?: FormFieldModel[];
  choiceSets?: FormChoiceSetModel[];
  optionRows?: FormOptionRow[];
  disclosure?: { defaultOpen: boolean };
  help?: FormHelp;
  summary?: FormSummaryRow[];
};
export type FormActionModel = { id: string; label: string; kind: "primary" | "secondary" | "destructive" | "inline"; stage?: string };
export type FormSurfaceStress = { title?: string; description?: string; sections?: FormSectionModel[]; actions?: FormActionModel[] };
export type FormSurfaceFixture = {
  sourceKey: `form-layout-${string}`;
  preset: FormSurfacePreset;
  title: string;
  description?: string;
  sections: FormSectionModel[];
  actions: FormActionModel[];
  stress: { short: FormSurfaceStress; longLocale: FormSurfaceStress; error: FormSurfaceStress };
};

type Contract = {
  sections: number;
  fields: number[];
  choiceOptions: number[];
  optionRows?: number[];
  actions: number;
  disclosures?: number;
  summaries?: number;
};

const contracts: Record<FormSurfacePreset, Contract> = {
  "profile-grid": { sections: 1, fields: [8], choiceOptions: [], actions: 1 },
  "sectioned-settings": { sections: 3, fields: [8, 3, 4], choiceOptions: [4], actions: 2 },
  "workspace-package": { sections: 3, fields: [5, 0, 4], choiceOptions: [3, 3], actions: 2 },
  "workspace-plans": { sections: 3, fields: [3, 0, 0], choiceOptions: [3, 5], actions: 2 },
  "tabbed-profile": { sections: 3, fields: [6, 4, 6], choiceOptions: [], actions: 6 },
  "checkout-accordion": { sections: 3, fields: [7, 0, 4], choiceOptions: [2, 3, 2], actions: 2, disclosures: 3 },
  "checkout-sections": { sections: 4, fields: [10, 0, 1, 4], choiceOptions: [2, 3, 2], optionRows: [3], actions: 2, summaries: 4 },
  "product-wizard": { sections: 5, fields: [2, 3, 3, 2, 0], choiceOptions: [3], actions: 8 },
  "account-wizard": { sections: 4, fields: [6, 9, 4, 0], choiceOptions: [3], actions: 6 },
};

const presetBySource = Object.fromEntries(FORM_SURFACE_PRESETS.map((preset, index) => [`form-layout-${String(index + 1).padStart(2, "0")}`, preset])) as Record<string, FormSurfacePreset>;
const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const sectionFieldCounts = (sections: FormSectionModel[]) => sections.map((section) => section.fields?.length ?? 0);
const choiceOptionCounts = (sections: FormSectionModel[]) => sections.flatMap((section) => section.choiceSets ?? []).map((set) => set.options.length);
const optionRowCounts = (sections: FormSectionModel[]) => sections.flatMap((section) => section.optionRows ? [section.optionRows.length] : []);

function validateShape(fixture: Omit<FormSurfaceFixture, "stress">, contract: Contract) {
  const { sourceKey, sections, actions } = fixture;
  if (sections.length !== contract.sections) throw new Error(`${sourceKey} requires ${contract.sections} sections.`);
  if (sectionFieldCounts(sections).join("|") !== contract.fields.join("|")) throw new Error(`${sourceKey} requires field counts ${contract.fields.join(", ")} in source order.`);
  if (choiceOptionCounts(sections).join("|") !== contract.choiceOptions.join("|")) throw new Error(`${sourceKey} requires choice counts ${contract.choiceOptions.join(", ")} in source order.`);
  if (optionRowCounts(sections).join("|") !== (contract.optionRows ?? []).join("|")) throw new Error(`${sourceKey} requires option-row counts ${(contract.optionRows ?? []).join(", ")} in source order.`);
  if (actions.length !== contract.actions) throw new Error(`${sourceKey} requires ${contract.actions} actions.`);
  if (contract.disclosures !== undefined && sections.filter((section) => section.disclosure).length !== contract.disclosures) throw new Error(`${sourceKey} requires ${contract.disclosures} disclosures.`);
  if (contract.summaries !== undefined && sections.filter((section) => section.summary?.length).length !== contract.summaries) throw new Error(`${sourceKey} requires ${contract.summaries} section summaries.`);
}

function validateContent(fixture: Omit<FormSurfaceFixture, "stress">) {
  const { sourceKey, sections, actions } = fixture;
  text(fixture.title, "title", sourceKey);
  if (fixture.description !== undefined) text(fixture.description, "description", sourceKey);
  unique(sections.map(({ id }) => id), "section IDs", sourceKey);
  unique(actions.map(({ id }) => id), "action IDs", sourceKey);
  const allIds = [...sections.map(({ id }) => id), ...actions.map(({ id }) => id)];
  for (const section of sections) {
    text(section.title, "section title", sourceKey);
    const members = [...(section.fields ?? []), ...(section.choiceSets ?? []), ...(section.optionRows ?? []), ...(section.summary ?? [])];
    allIds.push(...members.map(({ id }) => id));
    for (const field of section.fields ?? []) {
      text(field.label, "field label", sourceKey);
      if (field.error !== undefined) text(field.error, "field error", sourceKey);
      if ((field.kind === "select" || field.kind === "radio") && !field.options?.length) throw new Error(`${sourceKey} field ${field.id} requires options.`);
      for (const option of field.options ?? []) { allIds.push(option.id); text(option.label, "field option", sourceKey); }
    }
    for (const set of section.choiceSets ?? []) {
      text(set.label, "choice-set label", sourceKey);
      unique(set.options.map(({ id }) => id), `choice IDs in ${set.id}`, sourceKey);
      for (const option of set.options) {
        allIds.push(option.id);
        text(option.label, "choice label", sourceKey);
        if (option.disabled && !option.disabledReason) throw new Error(`${sourceKey} disabled choice ${option.id} requires a reason.`);
      }
    }
    for (const row of section.optionRows ?? []) { text(row.label, "option-row label", sourceKey); text(row.value, "option-row value", sourceKey); }
    for (const row of section.summary ?? []) { text(row.label, "summary label", sourceKey); text(row.value, "summary value", sourceKey); }
    if (section.help?.link) {
      text(section.help.link.label, "help link label", sourceKey);
      if (!section.help.link.href.startsWith("/demo/")) throw new Error(`${sourceKey} help links require local demo destinations.`);
    }
  }
  unique(allIds, "nested IDs", sourceKey);
  for (const action of actions) {
    text(action.label, "action label", sourceKey);
    if (action.stage && !sections.some((section) => section.id === action.stage)) throw new Error(`${sourceKey} action ${action.id} targets an unknown stage.`);
  }
}

function validatePresetDetails(fixture: Omit<FormSurfaceFixture, "stress">) {
  const { sourceKey, preset, sections, actions } = fixture;
  if (preset === "workspace-package" && !(sections[1].choiceSets?.[0].selectedDetails?.length)) throw new Error(`${sourceKey} requires selected-plan details.`);
  if (preset === "workspace-plans" && (sections[1].choiceSets?.[0].options.map((option) => option.details?.length).join("|") !== "4|6|8" || sections[1].help?.reasons?.length !== 3)) throw new Error(`${sourceKey} requires 4, 6 and 8 plan features plus three help reasons.`);
  if (preset === "tabbed-profile") {
    const stageCounts = sections.map((section) => actions.filter((action) => action.stage === section.id).length);
    if (stageCounts.join("|") !== "2|2|2" || sections[1].fields?.filter((field) => field.visibilityToggleLabel).length !== 2) throw new Error(`${sourceKey} requires two actions per tab and two password visibility controls.`);
  }
  if (preset === "checkout-accordion" && actions.some((action) => action.stage !== sections[2].id)) throw new Error(`${sourceKey} commit actions belong only to the payment disclosure.`);
  if (preset === "product-wizard" && sections.slice(0, 4).some((section) => !section.title) || preset === "product-wizard" && actions.map((action) => action.stage).join("|") !== `${sections[0].id}|${sections[1].id}|${sections[1].id}|${sections[2].id}|${sections[2].id}|${sections[3].id}|${sections[3].id}|${sections[4].id}`) throw new Error(`${sourceKey} requires stage-owned product workflow actions.`);
  if (preset === "account-wizard" && actions.map((action) => action.stage).join("|") !== `${sections[0].id}|${sections[1].id}|${sections[1].id}|${sections[2].id}|${sections[2].id}|${sections[3].id}`) throw new Error(`${sourceKey} requires stage-owned account workflow actions.`);
}

export function resolveFormSurfaceFixture(fixture: FormSurfaceFixture, stress?: keyof FormSurfaceFixture["stress"]): FormSurfaceFixture {
  if (!/^form-layout-0[1-9]$/.test(fixture.sourceKey)) throw new Error(`Invalid form-layout source key: ${fixture.sourceKey}`);
  if (!FORM_SURFACE_PRESETS.includes(fixture.preset) || presetBySource[fixture.sourceKey] !== fixture.preset) throw new Error(`${fixture.sourceKey} has an invalid FormSurface preset.`);
  if (Object.keys(fixture.stress).sort().join("|") !== "error|longLocale|short") throw new Error(`${fixture.sourceKey} requires short, longLocale and error stress fixtures.`);
  const resolved = stress ? { ...fixture, ...fixture.stress[stress], stress: fixture.stress } : fixture;
  const plain = resolved as Omit<FormSurfaceFixture, "stress">;
  validateShape(plain, contracts[fixture.preset]);
  validateContent(plain);
  validatePresetDetails(plain);
  return resolved;
}
