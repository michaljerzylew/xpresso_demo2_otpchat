export const CATEGORY_FILTER_SOURCE_KEYS = [
  "category-filter-01",
  "category-filter-02",
  "category-filter-03",
  "category-filter-04",
  "category-filter-05",
  "category-filter-06",
] as const;

export type FilterSourceKey = (typeof CATEGORY_FILTER_SOURCE_KEYS)[number];
export type FilterPanelPreset = "catalog-basics" | "accordion-search" | "advanced" | "fashion" | "property";
export type FilterBarPreset = "summary" | "field-rail";
export type FilterTone = "neutral" | "accent" | "positive" | "warning" | "danger";

export type FilterOption = {
  id: string;
  label: string;
  description?: string;
  countLabel?: string;
  tone?: FilterTone;
  disabled?: boolean;
  disabledReason?: string;
};

export type FilterRange = {
  kind: "range";
  id: string;
  label: string;
  minLabel: string;
  maxLabel: string;
  bounds: { min: number; max: number; step: number };
  value: { min: number; max: number };
  marks?: Array<{ value: number; label: string; iconKey?: "star" }>;
  unit?: "currency" | "rating" | "area" | "number";
  currencyCode?: string;
};

export type FilterControl =
  | {
      kind: "checks";
      id: string;
      label: string;
      options: FilterOption[];
      selectedIds: string[];
      presentation: "rows" | "pills" | "swatches";
      initialVisibleCount?: number;
      anyOptionId?: string;
    }
  | {
      kind: "segmented";
      id: string;
      label: string;
      options: FilterOption[];
      selectedId: string;
    }
  | {
      kind: "single-select" | "multi-select" | "search-select";
      id: string;
      label: string;
      placeholder?: string;
      options: FilterOption[];
      selectedIds: string[];
      emptyLabel?: string;
    }
  | {
      kind: "text-fields";
      id: string;
      label: string;
      fields: Array<{
        id: string;
        label: string;
        value: string;
        inputMode: "text" | "numeric" | "decimal";
        autoComplete: string;
        enterKeyHint: "next" | "done" | "search";
      }>;
    }
  | FilterRange;

export type FilterAction = {
  id: string;
  label: string;
  behavior: "open" | "apply" | "cancel" | "clear" | "remove" | "reveal" | "request-access";
  emphasis: "primary" | "secondary" | "quiet" | "destructive";
};

export type FilterGroup = {
  id: string;
  label: string;
  controls: FilterControl[];
  disclosure: "fixed-open" | "default-open" | "default-closed";
  locked?: { reason: string; action?: FilterAction };
};

export type FilterValue = string | string[] | { min: number; max: number };
export type FilterState = { values: Record<string, FilterValue>; activeCount: number; resultCount: number };

export type FilterCopy = {
  title: string;
  description?: string;
  triggerLabel: string;
  closeLabel: string;
  clearLabel: string;
  applyLabel: string;
  cancelLabel: string;
  resultLabel: string;
  activeCountLabel: string;
  removeChipLabel: string;
  expandGroupLabel: string;
  collapseGroupLabel: string;
  validation: { rangeOrder: string; rangeBounds: string; required: string };
  announcements: {
    applied: string;
    draftChanged: string;
    removed: string;
    cleared: string;
    cancelled: string;
    groupExpanded: string;
    groupCollapsed: string;
  };
};

export type FilterPanelFixture = {
  preset: FilterPanelPreset;
  groups: FilterGroup[];
  search?: { label: string; placeholder: string; emptyTitle: string; emptyDescription: string };
};

export type FilterBarField = { id: string; label: string; controlId: string; emptyValueLabel: string };
export type FilterBarFixture = {
  preset: FilterBarPreset;
  fields?: FilterBarField[];
  controls?: FilterControl[];
  sort?: { label: string; options: FilterOption[]; selectedId: string };
};

export type CategoryFilterFixture = {
  sourceKey: FilterSourceKey;
  panel?: FilterPanelFixture;
  bar?: FilterBarFixture;
  initialApplied: FilterState;
  resultCountCases: Array<{ id: string; values: FilterState["values"]; resultCount: number }>;
  actions: FilterAction[];
  copy: FilterCopy;
  states?: {
    errorControlId?: string;
    error?: string;
    emptySearch?: boolean;
    permissionDenied?: boolean;
  };
  media: [];
  stress: Record<string, Partial<Omit<CategoryFilterFixture, "stress">>>;
};

const SOURCE_PRESETS: Record<FilterSourceKey, { panel?: FilterPanelPreset; bar?: FilterBarPreset }> = {
  "category-filter-01": { panel: "catalog-basics", bar: "summary" },
  "category-filter-02": { panel: "accordion-search", bar: "summary" },
  "category-filter-03": { panel: "advanced" },
  "category-filter-04": { bar: "field-rail" },
  "category-filter-05": { panel: "fashion", bar: "summary" },
  "category-filter-06": { panel: "property", bar: "summary" },
};

const requireText = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const options = (control: FilterControl) => "options" in control ? control.options : [];
const flattenControls = (fixture: CategoryFilterFixture) => [
  ...(fixture.panel?.groups.flatMap((group) => group.controls) ?? []),
  ...(fixture.bar?.controls ?? []),
];

function controlValue(control: FilterControl): FilterValue {
  if (control.kind === "range") return control.value;
  if (control.kind === "text-fields") return control.fields.map((field) => field.value);
  if (control.kind === "segmented") return control.selectedId;
  return control.selectedIds;
}

function controlIsActive(control: FilterControl) {
  if (control.kind === "range") return control.value.min !== control.bounds.min || control.value.max !== control.bounds.max;
  if (control.kind === "text-fields") return control.fields.some((field) => field.value.trim());
  if (control.kind === "segmented") return Boolean(control.selectedId);
  return control.selectedIds.length > 0;
}

function validateControl(control: FilterControl, sourceKey: string) {
  requireText(control.id, "control ID", sourceKey);
  requireText(control.label, `control ${control.id} label`, sourceKey);
  if (control.kind === "range") {
    if (![control.bounds.min, control.bounds.max, control.bounds.step, control.value.min, control.value.max].every(Number.isFinite)) {
      throw new Error(`${sourceKey} range ${control.id} requires finite values.`);
    }
    if (control.bounds.min >= control.bounds.max || control.bounds.step <= 0) throw new Error(`${sourceKey} range ${control.id} has invalid bounds.`);
    if (control.value.min > control.value.max || control.value.min < control.bounds.min || control.value.max > control.bounds.max) {
      throw new Error(`${sourceKey} range ${control.id} has an invalid initial value.`);
    }
    requireText(control.minLabel, `range ${control.id} minimum label`, sourceKey);
    requireText(control.maxLabel, `range ${control.id} maximum label`, sourceKey);
    return;
  }
  if (control.kind === "text-fields") {
    unique(control.fields.map((field) => field.id), `field IDs in ${control.id}`, sourceKey);
    for (const field of control.fields) requireText(field.label, `field ${field.id} label`, sourceKey);
    return;
  }
  unique(control.options.map((option) => option.id), `option IDs in ${control.id}`, sourceKey);
  for (const option of control.options) {
    requireText(option.label, `option ${option.id} label`, sourceKey);
    if (option.disabled && !option.disabledReason) throw new Error(`${sourceKey} disabled option ${option.id} requires a reason.`);
  }
  const selected = control.kind === "segmented" ? [control.selectedId] : control.selectedIds;
  for (const id of selected) {
    const selectedOption = control.options.find((option) => option.id === id);
    if (!selectedOption || selectedOption.disabled) throw new Error(`${sourceKey} control ${control.id} has an invalid selected option ${id}.`);
  }
  if (control.kind === "checks" && control.anyOptionId) {
    if (!control.options.some((option) => option.id === control.anyOptionId)) throw new Error(`${sourceKey} control ${control.id} cannot resolve its any option.`);
    if (control.selectedIds.includes(control.anyOptionId) && control.selectedIds.length > 1) throw new Error(`${sourceKey} control ${control.id} cannot select any with explicit values.`);
  }
}

function validateSourceContract(fixture: CategoryFilterFixture) {
  const controls = flattenControls(fixture);
  const groups = fixture.panel?.groups ?? [];
  const byKind = (kind: FilterControl["kind"]) => controls.filter((control) => control.kind === kind);
  const optionCounts = (kind: FilterControl["kind"]) => byKind(kind).map((control) => options(control).length);
  const hasOptionCount = (kind: FilterControl["kind"], count: number) => optionCounts(kind).includes(count);

  if (fixture.sourceKey === "category-filter-01") {
    if (groups.length !== 4 || byKind("range").length !== 2 || !byKind("range").some((control) => control.kind === "range" && control.marks?.length === 5) || !hasOptionCount("checks", 7) || !hasOptionCount("checks", 3)) {
      throw new Error(`${fixture.sourceKey} requires four groups, two ranges, five rating marks and checklists of seven and three.`);
    }
  }
  if (fixture.sourceKey === "category-filter-02") {
    const locked = groups.filter((group) => group.locked);
    if (groups.length !== 8 || locked.length !== 2 || !hasOptionCount("checks", 3) || !hasOptionCount("checks", 5) || !byKind("single-select").some((control) => options(control).length === 5) || !byKind("text-fields").some((control) => control.kind === "text-fields" && control.fields.length === 4)) {
      throw new Error(`${fixture.sourceKey} requires six primary groups, two locked groups and the exact search-led control inventory.`);
    }
  }
  if (fixture.sourceKey === "category-filter-03") {
    const selectorCounts = controls.filter((control) => ["single-select", "multi-select", "search-select"].includes(control.kind)).map((control) => options(control).length).sort((a, b) => b - a);
    const flagCount = byKind("checks").reduce((count, control) => count + options(control).length, 0);
    if (fixture.initialApplied.activeCount !== 4 || flagCount !== 3 || selectorCounts.join("|") !== "6|5|4|4" || fixture.actions.map((action) => action.behavior).join("|") !== "cancel|apply") {
      throw new Error(`${fixture.sourceKey} requires four active criteria, three flags, selectors 6/5/4/4 and cancel/apply actions.`);
    }
  }
  if (fixture.sourceKey === "category-filter-04") {
    const fields = fixture.bar?.fields ?? [];
    const barControls = fixture.bar?.controls ?? [];
    const ids = new Set(barControls.map((control) => control.id));
    const listCounts = barControls.filter((control) => control.kind !== "range").map((control) => options(control).length).sort((a, b) => b - a);
    const rating = barControls.find((control) => control.kind === "range");
    if (fixture.panel || fields.length !== 4 || barControls.length !== 4 || fields.some((field) => !ids.has(field.controlId)) || listCounts.join("|") !== "6|6|5" || rating?.kind !== "range" || rating.bounds.min !== 1 || rating.bounds.max !== 5) {
      throw new Error(`${fixture.sourceKey} requires four field seats backed by controls 6/6/rating-1..5/5.`);
    }
  }
  if (fixture.sourceKey === "category-filter-05") {
    const ranges = byKind("range");
    const swatches = byKind("checks").find((control) => control.kind === "checks" && control.presentation === "swatches");
    if (groups.length !== 5 || ranges.length !== 1 || !hasOptionCount("checks", 7) || byKind("checks").filter((control) => options(control).length === 7).length !== 3 || !swatches || options(swatches).length !== 6) {
      throw new Error(`${fixture.sourceKey} requires five groups with 7/7/range/6/7 controls.`);
    }
  }
  if (fixture.sourceKey === "category-filter-06") {
    const ranges = byKind("range");
    const search = byKind("search-select");
    const segments = byKind("segmented");
    const pills = byKind("checks").filter((control) => control.kind === "checks" && control.presentation === "pills");
    const yearSelectors = byKind("single-select").filter((control) => options(control).length === 8);
    if (groups.length !== 10 || search.length !== 1 || options(search[0]!).length !== 17 || segments.length !== 2 || segments.some((control) => options(control).length !== 2) || ranges.length !== 2 || pills.filter((control) => options(control).length === 6).length < 3 || yearSelectors.length !== 2) {
      throw new Error(`${fixture.sourceKey} requires ten property groups and the exact location, binary, range, year and pill controls.`);
    }
  }
}

function validateFixture(fixture: CategoryFilterFixture) {
  if (!CATEGORY_FILTER_SOURCE_KEYS.includes(fixture.sourceKey)) throw new Error(`Unknown category-filter source key: ${fixture.sourceKey}`);
  const expected = SOURCE_PRESETS[fixture.sourceKey];
  if (fixture.panel?.preset !== expected.panel || fixture.bar?.preset !== expected.bar) throw new Error(`${fixture.sourceKey} has the wrong FilterPanel or FilterBar preset.`);
  if (!fixture.panel && !fixture.bar) throw new Error(`${fixture.sourceKey} requires a filter owner.`);
  if (fixture.media.length !== 0) throw new Error(`${fixture.sourceKey} cannot declare media.`);
  const controls = flattenControls(fixture);
  unique(controls.map((control) => control.id), "control IDs", fixture.sourceKey);
  unique(fixture.panel?.groups.map((group) => group.id) ?? [], "group IDs", fixture.sourceKey);
  unique(fixture.actions.map((action) => action.id), "action IDs", fixture.sourceKey);
  unique(fixture.resultCountCases.map((item) => item.id), "result case IDs", fixture.sourceKey);
  for (const control of controls) validateControl(control, fixture.sourceKey);
  for (const control of controls) {
    const stateValue = fixture.initialApplied.values[control.id];
    if (stateValue === undefined || JSON.stringify(stateValue) !== JSON.stringify(controlValue(control))) {
      throw new Error(`${fixture.sourceKey} initialApplied value for ${control.id} must match the rendered control state.`);
    }
  }
  const derivedActiveCount = controls.filter(controlIsActive).length;
  if (fixture.initialApplied.activeCount !== derivedActiveCount) throw new Error(`${fixture.sourceKey} activeCount must be derived from active controls (${derivedActiveCount}).`);
  for (const group of fixture.panel?.groups ?? []) {
    requireText(group.label, `group ${group.id} label`, fixture.sourceKey);
    if (group.locked) requireText(group.locked.reason, `locked group ${group.id} reason`, fixture.sourceKey);
  }
  for (const action of fixture.actions) requireText(action.label, `action ${action.id} label`, fixture.sourceKey);
  for (const [key, value] of Object.entries(fixture.copy)) {
    if (key === "description") continue;
    if (typeof value === "string") requireText(value, `copy ${key}`, fixture.sourceKey);
    else for (const [nestedKey, nestedValue] of Object.entries(value)) requireText(nestedValue, `copy ${key}.${nestedKey}`, fixture.sourceKey);
  }
  if (!Number.isInteger(fixture.initialApplied.activeCount) || fixture.initialApplied.activeCount < 0 || fixture.initialApplied.resultCount < 0) throw new Error(`${fixture.sourceKey} has invalid initial counts.`);
  if (fixture.states?.errorControlId || fixture.states?.error) {
    if (!fixture.states.errorControlId || !fixture.states.error || !controls.some((control) => control.id === fixture.states?.errorControlId)) {
      throw new Error(`${fixture.sourceKey} error state requires existing errorControlId and fixture-owned error copy.`);
    }
  }
  if (fixture.states?.emptySearch && !fixture.panel?.search) throw new Error(`${fixture.sourceKey} cannot expose emptySearch without a search contract.`);
  if (fixture.states?.permissionDenied && !fixture.panel?.groups.some((group) => group.locked)) throw new Error(`${fixture.sourceKey} cannot expose permissionDenied without a locked group.`);
  for (const item of fixture.resultCountCases) if (!Number.isInteger(item.resultCount) || item.resultCount < 0) throw new Error(`${fixture.sourceKey} has an invalid result case.`);
  if (Object.values(fixture.stress).some((patch) => "stress" in patch)) throw new Error(`${fixture.sourceKey} stress patches cannot nest stress.`);
  for (const required of ["short", "longLocale", "error"]) if (!fixture.stress[required]) throw new Error(`${fixture.sourceKey} requires ${required} stress copy.`);
  validateSourceContract(fixture);
}

export function resolveCategoryFilterFixture(input: CategoryFilterFixture, stress?: keyof CategoryFilterFixture["stress"]): CategoryFilterFixture {
  const patch = stress ? input.stress[stress] : undefined;
  if (stress && !patch) throw new Error(`${input.sourceKey} has no ${String(stress)} stress fixture.`);
  const fixture = patch ? { ...input, ...patch, stress: input.stress } as CategoryFilterFixture : input;
  validateFixture(fixture);
  return fixture;
}
