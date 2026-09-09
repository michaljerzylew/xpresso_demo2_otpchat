export const COMPARE_SOURCE_KEYS = [
  "compare-01",
  "compare-02",
  "compare-03",
  "compare-04",
  "compare-05",
  "compare-06",
  "compare-07",
] as const;

export type CompareSourceKey = (typeof COMPARE_SOURCE_KEYS)[number];
export type CompareKind = "matrix" | "offers" | "journey";
export type ComparePreset =
  | "mixed-preferred"
  | "filtered-offers"
  | "annotated-preferred"
  | "boolean-actions"
  | "paired-routes"
  | "commerce-promo"
  | "advice";

export type CompareAction = {
  id: string;
  label: string;
  ownerId: string;
  behavior: "navigate" | "apply-filters" | "reset-filters" | "run-query" | "swap-query" | "select-candidate";
  emphasis: "primary" | "secondary" | "quiet";
  href?: string;
};

export type CompareValue =
  | { kind: "text"; text: string; annotation?: string }
  | { kind: "number"; value: number; unit?: string }
  | { kind: "money"; amountMinor: number; currency: string; qualifier?: string }
  | { kind: "boolean"; value: boolean; trueLabel: string; falseLabel: string }
  | { kind: "status"; tone: "positive" | "warning" | "negative" | "neutral"; label: string }
  | { kind: "rating"; value: number; maximum: number; label: string };

export type CompareCandidate = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  mediaSeatId?: string;
  badge?: string;
  highlighted?: boolean;
  price?: { current: CompareValue; previous?: CompareValue; discountLabel?: string };
};

export type CompareAttribute = {
  id: string;
  label: string;
  groupId?: string;
  values: Record<string, CompareValue>;
  advice?: string;
};

export type MatrixCompareFixture = {
  kind: "matrix";
  candidates: CompareCandidate[];
  attributes: CompareAttribute[];
  picker: { defaultActiveIds: string[]; minimum: 2; maximum: 2 | 3; label: string };
  sectionActionId?: string;
  promo?: { id: string; eyebrow: string; title: string; description: string; actionId: string };
  candidateActionIds?: Record<string, string>;
};

export type ResultRecord = {
  id: string;
  candidateId: string;
  benefits: [string, string, string];
  fee: CompareValue;
  reward: { title: string; description: string };
  actionId: string;
};

export type CompareFilter = {
  id: string;
  label: string;
  selectedId: string;
  options: Array<{ id: string; label: string }>;
  required?: boolean;
};

export type ResultSetCompareFixture = {
  kind: "offers";
  candidates: [CompareCandidate, CompareCandidate, CompareCandidate];
  filters: [CompareFilter, CompareFilter, CompareFilter, CompareFilter];
  applyActionId: string;
  records: [ResultRecord, ResultRecord, ResultRecord];
  empty: { title: string; description: string; resetActionId: string };
};

export type LocationOption = { id: string; label: string; description: string };
export type QueryField =
  | { id: string; label: string; kind: "location"; selectedId: string; required: true; error?: string }
  | { id: string; label: string; kind: "date"; value: string; required: true; error?: string }
  | {
      id: string;
      label: string;
      kind: "traveller-class";
      count: number;
      minimum: 1;
      maximum: 9;
      selectedClassId: string;
      classOptions: [
        { id: string; label: string }, { id: string; label: string },
        { id: string; label: string }, { id: string; label: string },
      ];
      required: true;
      error?: string;
    };

export type PairedChoiceOption = {
  id: string;
  mediaSeatId: string;
  departure: { time: string; period: string; location: string };
  arrival: { time: string; period: string; location: string };
  duration: string;
  stopCount: number;
  price: CompareValue;
};

export type PairedChoiceCompareFixture = {
  kind: "journey";
  tripModes: [{ id: string; label: string }, { id: string; label: string }];
  selectedTripModeId: string;
  serviceCategories: [
    { id: string; label: string }, { id: string; label: string }, { id: string; label: string },
  ];
  selectedServiceCategoryId: string;
  locations: [
    LocationOption, LocationOption, LocationOption, LocationOption,
    LocationOption, LocationOption, LocationOption, LocationOption,
  ];
  queryFields: [QueryField, QueryField, QueryField, QueryField, QueryField];
  swapActionId: string;
  searchActionId: string;
  groups: [
    { id: string; role: "outbound"; label: string; dateLabel: string; options: [PairedChoiceOption, PairedChoiceOption]; selectedId: string },
    { id: string; role: "return"; label: string; dateLabel: string; options: [PairedChoiceOption, PairedChoiceOption]; selectedId: string },
  ];
};

export type CompareMediaSeat =
  | { id: string; role: "candidate-mark" | "wordmark" | "payment-vector"; assetKey: string; alt: string }
  | { id: string; role: "product-photo"; assetKey: string; alt: string };

export type CompareCopy = {
  eyebrow?: string;
  title?: string;
  description?: string;
  comparisonLabel: string;
  announcements: Record<string, string>;
  fieldLabels?: Partial<Record<"candidate" | "benefits" | "fee" | "reward" | "action" | "filters" | "query" | "editQuery" | "close" | "position" | "tripMode" | "serviceCategory", string>>;
};

export type CompareFixture = {
  sourceKey: CompareSourceKey;
  copy: CompareCopy;
  content: MatrixCompareFixture | ResultSetCompareFixture | PairedChoiceCompareFixture;
  actions: CompareAction[];
  media: CompareMediaSeat[];
  stress: Record<string, Partial<Omit<CompareFixture, "sourceKey" | "stress">>>;
};

export type CompareResolvedMediaAsset = {
  seatId?: string;
  assetKey: string;
  kind: "vector" | "raster";
  src: string;
  darkSrc?: string;
  alt: string;
};
export type CompareMediaAsset = CompareResolvedMediaAsset;

export type ResolvedCompareFixture = CompareFixture & {
  preset: ComparePreset;
  activeStress?: string;
  resolvedMedia: CompareResolvedMediaAsset[];
};

const EXPECTED: Record<CompareSourceKey, { kind: CompareKind; preset: ComparePreset }> = {
  "compare-01": { kind: "matrix", preset: "mixed-preferred" },
  "compare-02": { kind: "offers", preset: "filtered-offers" },
  "compare-03": { kind: "matrix", preset: "annotated-preferred" },
  "compare-04": { kind: "matrix", preset: "boolean-actions" },
  "compare-05": { kind: "journey", preset: "paired-routes" },
  "compare-06": { kind: "matrix", preset: "commerce-promo" },
  "compare-07": { kind: "matrix", preset: "advice" },
};
const EXPECTED_MEDIA: Record<CompareSourceKey, { count: number; role?: CompareMediaSeat["role"] }> = {
  "compare-01": { count: 3, role: "candidate-mark" },
  "compare-02": { count: 3, role: "payment-vector" },
  "compare-03": { count: 3, role: "candidate-mark" },
  "compare-04": { count: 0 },
  "compare-05": { count: 4, role: "wordmark" },
  "compare-06": { count: 3, role: "product-photo" },
  "compare-07": { count: 2, role: "candidate-mark" },
};

const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const exactKeys = (actual: string[], expected: string[]) => actual.length === expected.length && actual.every((id) => expected.includes(id));

function merge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return (patch === undefined ? base : patch) as T;
  const result = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    const previous = result[key];
    result[key] = value && typeof value === "object" && !Array.isArray(value) && previous && typeof previous === "object" && !Array.isArray(previous)
      ? merge(previous, value)
      : value;
  }
  return result as T;
}

function validateValue(value: CompareValue, label: string, sourceKey: string) {
  if (!value || typeof value !== "object") throw new Error(`${sourceKey} requires ${label}.`);
  if (value.kind === "text") text(value.text, `${label} text`, sourceKey);
  if (value.kind === "number" && !Number.isFinite(value.value)) throw new Error(`${sourceKey} ${label} requires a finite number.`);
  if (value.kind === "money") {
    if (!Number.isInteger(value.amountMinor) || value.amountMinor < 0) throw new Error(`${sourceKey} ${label} requires non-negative integer minor units.`);
    text(value.currency, `${label} currency`, sourceKey);
  }
  if (value.kind === "boolean") {
    text(value.trueLabel, `${label} affirmative label`, sourceKey);
    text(value.falseLabel, `${label} negative label`, sourceKey);
  }
  if (value.kind === "status") text(value.label, `${label} status`, sourceKey);
  if (value.kind === "rating" && (!Number.isFinite(value.value) || !Number.isFinite(value.maximum) || value.maximum <= 0 || value.value < 0 || value.value > value.maximum)) {
    throw new Error(`${sourceKey} ${label} has an invalid rating.`);
  }
}

function validateCandidates(candidates: CompareCandidate[], mediaIds: Set<string>, sourceKey: string) {
  unique(candidates.map(({ id }) => id), "candidate IDs", sourceKey);
  for (const candidate of candidates) {
    text(candidate.id, "candidate ID", sourceKey);
    text(candidate.name, `candidate ${candidate.id} name`, sourceKey);
    text(candidate.shortName, `candidate ${candidate.id} short name`, sourceKey);
    if (candidate.mediaSeatId && !mediaIds.has(candidate.mediaSeatId)) throw new Error(`${sourceKey} cannot resolve media seat ${candidate.mediaSeatId}.`);
    if (candidate.price) {
      validateValue(candidate.price.current, `${candidate.id} current price`, sourceKey);
      if (candidate.price.current.kind !== "money") throw new Error(`${sourceKey} candidate prices must use money values.`);
      if (candidate.price.previous) {
        validateValue(candidate.price.previous, `${candidate.id} previous price`, sourceKey);
        if (candidate.price.previous.kind !== "money") throw new Error(`${sourceKey} previous candidate prices must use money values.`);
        if (candidate.price.discountLabel && candidate.price.previous.amountMinor < candidate.price.current.amountMinor) {
          throw new Error(`${sourceKey} candidate ${candidate.id} has a discounted previous price below its current price.`);
        }
      }
    }
  }
}

function validateMatrix(fixture: CompareFixture, content: MatrixCompareFixture, actionIds: Set<string>, mediaIds: Set<string>) {
  const { sourceKey } = fixture;
  validateCandidates(content.candidates, mediaIds, sourceKey);
  unique(content.attributes.map(({ id }) => id), "attribute IDs", sourceKey);
  const candidateIds = content.candidates.map(({ id }) => id);
  for (const attribute of content.attributes) {
    text(attribute.label, `attribute ${attribute.id} label`, sourceKey);
    if (!exactKeys(Object.keys(attribute.values), candidateIds)) throw new Error(`${sourceKey} attribute ${attribute.id} must contain one value for every candidate.`);
    for (const [candidateId, value] of Object.entries(attribute.values)) validateValue(value, `${attribute.id}/${candidateId}`, sourceKey);
  }
  if (content.picker.minimum !== 2 || content.picker.maximum !== Math.min(3, content.candidates.length) || content.picker.defaultActiveIds.length < 2 || content.picker.defaultActiveIds.length > content.picker.maximum) {
    throw new Error(`${sourceKey} picker bounds must match its candidate inventory.`);
  }
  unique(content.picker.defaultActiveIds, "default active candidate IDs", sourceKey);
  if (content.picker.defaultActiveIds.some((id) => !candidateIds.includes(id))) throw new Error(`${sourceKey} picker references an unknown candidate.`);
  text(content.picker.label, "picker label", sourceKey);
  if (content.promo) {
    for (const key of [content.promo.eyebrow, content.promo.title, content.promo.description]) text(key, "promo copy", sourceKey);
    if (!actionIds.has(content.promo.actionId)) throw new Error(`${sourceKey} promo action does not resolve.`);
    if (fixture.actions.find(({ id }) => id === content.promo!.actionId)?.ownerId !== content.promo.id) throw new Error(`${sourceKey} promo action has the wrong owner.`);
    if (fixture.actions.find(({ id }) => id === content.promo!.actionId)?.behavior !== "navigate") throw new Error(`${sourceKey} promo action must navigate.`);
  }
  if (content.sectionActionId && !actionIds.has(content.sectionActionId)) throw new Error(`${sourceKey} section action does not resolve.`);
  for (const [candidateId, actionId] of Object.entries(content.candidateActionIds ?? {})) {
    if (!candidateIds.includes(candidateId) || !actionIds.has(actionId)) throw new Error(`${sourceKey} candidate action ${candidateId}/${actionId} does not resolve.`);
    if (fixture.actions.find(({ id }) => id === actionId)?.ownerId !== candidateId) throw new Error(`${sourceKey} candidate action ${actionId} has the wrong owner.`);
    if (fixture.actions.find(({ id }) => id === actionId)?.behavior !== "navigate") throw new Error(`${sourceKey} candidate action ${actionId} must navigate.`);
  }
  const contracts: Partial<Record<CompareSourceKey, { candidates: number; attributes: number; highlighted: number; actions: number }>> = {
    "compare-01": { candidates: 3, attributes: 10, highlighted: 1, actions: 1 },
    "compare-03": { candidates: 3, attributes: 11, highlighted: 1, actions: 0 },
    "compare-04": { candidates: 3, attributes: 8, highlighted: 1, actions: 3 },
    "compare-06": { candidates: 3, attributes: 11, highlighted: 0, actions: 1 },
    "compare-07": { candidates: 2, attributes: 10, highlighted: 0, actions: 0 },
  };
  const contract = contracts[sourceKey];
  if (!contract || content.candidates.length !== contract.candidates || content.attributes.length !== contract.attributes || content.candidates.filter(({ highlighted }) => highlighted).length !== contract.highlighted || fixture.actions.length !== contract.actions) {
    throw new Error(`${sourceKey} does not preserve its exact matrix inventory.`);
  }
  const ownedActions = [content.sectionActionId, content.promo?.actionId, ...Object.values(content.candidateActionIds ?? {})].filter((id): id is string => Boolean(id));
  unique(ownedActions, "matrix action ownership", sourceKey);
  if (!exactKeys(ownedActions, fixture.actions.map(({ id }) => id))) {
    throw new Error(`${sourceKey} has an orphaned or multiply owned business action.`);
  }
  if (sourceKey === "compare-01" && (!content.promo || content.promo.actionId !== fixture.actions[0]?.id)) {
    throw new Error(`${sourceKey} requires one explicitly promo-owned section action.`);
  }
  if (sourceKey === "compare-04") {
    if (content.attributes.some(({ values }) => Object.values(values).some(({ kind }) => kind !== "boolean")) || Object.keys(content.candidateActionIds ?? {}).length !== 3) {
      throw new Error(`${sourceKey} requires 24 boolean values and one action per candidate.`);
    }
  }
  if (sourceKey === "compare-06") {
    if (!content.promo || content.candidates.some(({ price, mediaSeatId }) => !price || !mediaSeatId)) throw new Error(`${sourceKey} requires a promo and three priced product-photo candidates.`);
    const moneyRows = content.attributes.filter(({ values }) => Object.values(values).every(({ kind }) => kind === "money"));
    const resolutionRows = content.attributes.filter(({ id, label }) => /resolution/i.test(`${id} ${label}`));
    if (moneyRows.length !== 1 || resolutionRows.length !== 1) throw new Error(`${sourceKey} requires one corrected comparison-price row and one resolution row.`);
  }
  if (sourceKey === "compare-07" && content.attributes.some(({ advice }) => !advice?.trim())) throw new Error(`${sourceKey} requires ten nonempty advice statements.`);
}

function validateOffers(fixture: CompareFixture, content: ResultSetCompareFixture, actionIds: Set<string>, mediaIds: Set<string>, stress?: string) {
  const { sourceKey } = fixture;
  validateCandidates(content.candidates, mediaIds, sourceKey);
  const expectedRecords = stress === "empty" ? 0 : 3;
  if (content.filters.length !== 4 || content.records.length !== expectedRecords || content.candidates.length !== 3 || fixture.actions.length !== 5) throw new Error(`${sourceKey} requires four filters, ${expectedRecords} active records and exactly five actions.`);
  if (content.filters.map(({ options }) => options.length).join("|") !== "3|4|4|3") throw new Error(`${sourceKey} filter option counts must be 3/4/4/3.`);
  unique(content.filters.map(({ id }) => id), "filter IDs", sourceKey);
  unique(content.filters.flatMap(({ options }) => options.map(({ id }) => id)), "filter option IDs", sourceKey);
  for (const filter of content.filters) {
    text(filter.label, `filter ${filter.id} label`, sourceKey);
    if (!filter.options.some(({ id }) => id === filter.selectedId)) throw new Error(`${sourceKey} filter ${filter.id} has an invalid selected option.`);
    for (const option of filter.options) text(option.label, `filter option ${option.id} label`, sourceKey);
  }
  const candidateIds = new Set(content.candidates.map(({ id }) => id));
  unique(content.records.map(({ id }) => id), "offer IDs", sourceKey);
  for (const record of content.records) {
    if (!candidateIds.has(record.candidateId)) throw new Error(`${sourceKey} offer ${record.id} references an unknown candidate.`);
    if (record.benefits.length !== 3 || record.benefits.some((benefit) => !benefit.trim())) throw new Error(`${sourceKey} offer ${record.id} requires three benefits.`);
    validateValue(record.fee, `${record.id} fee`, sourceKey);
    text(record.reward.title, `${record.id} reward title`, sourceKey);
    text(record.reward.description, `${record.id} reward description`, sourceKey);
    if (!actionIds.has(record.actionId)) throw new Error(`${sourceKey} offer ${record.id} action does not resolve.`);
    if (fixture.actions.find(({ id }) => id === record.actionId)?.behavior !== "navigate") throw new Error(`${sourceKey} offer ${record.id} action must navigate.`);
    if (fixture.actions.find(({ id }) => id === record.actionId)?.ownerId !== record.id) throw new Error(`${sourceKey} offer ${record.id} action has the wrong owner.`);
  }
  if (!actionIds.has(content.applyActionId) || !actionIds.has(content.empty.resetActionId)) throw new Error(`${sourceKey} filter apply/reset actions do not resolve.`);
  if (fixture.actions.find(({ id }) => id === content.applyActionId)?.behavior !== "apply-filters" || fixture.actions.find(({ id }) => id === content.empty.resetActionId)?.behavior !== "reset-filters") {
    throw new Error(`${sourceKey} filter actions have invalid behaviors.`);
  }
  const applyOwner = fixture.actions.find(({ id }) => id === content.applyActionId)?.ownerId;
  const resetOwner = fixture.actions.find(({ id }) => id === content.empty.resetActionId)?.ownerId;
  if (!applyOwner || !resetOwner || applyOwner === resetOwner) throw new Error(`${sourceKey} filter and empty actions require distinct resolved owners.`);
  text(content.empty.title, "empty title", sourceKey);
  text(content.empty.description, "empty description", sourceKey);
  for (const key of ["candidate", "benefits", "fee", "reward", "action", "filters", "close"] as const) {
    text(fixture.copy.fieldLabels?.[key], `field label ${key}`, sourceKey);
  }
}

function validateJourney(fixture: CompareFixture, content: PairedChoiceCompareFixture, actionIds: Set<string>, mediaIds: Set<string>) {
  const { sourceKey } = fixture;
  if (content.tripModes.length !== 2 || content.serviceCategories.length !== 3 || content.locations.length !== 8 || content.queryFields.length !== 5 || content.groups.length !== 2 || fixture.actions.length !== 2) {
    throw new Error(`${sourceKey} does not preserve the exact query and route inventory.`);
  }
  const locationFields = content.queryFields.filter((field): field is Extract<QueryField, { kind: "location" }> => field.kind === "location");
  const dateFields = content.queryFields.filter((field): field is Extract<QueryField, { kind: "date" }> => field.kind === "date");
  const travellerFields = content.queryFields.filter((field): field is Extract<QueryField, { kind: "traveller-class" }> => field.kind === "traveller-class");
  unique(content.queryFields.map(({ id }) => id), "query field IDs", sourceKey);
  unique(content.tripModes.map(({ id }) => id), "trip mode IDs", sourceKey);
  unique(content.serviceCategories.map(({ id }) => id), "service category IDs", sourceKey);
  unique(content.groups.map(({ id }) => id), "route group IDs", sourceKey);
  if (locationFields.length !== 2 || dateFields.length !== 2 || travellerFields.length !== 1 || travellerFields[0].classOptions.length !== 4) {
    throw new Error(`${sourceKey} requires two locations, two dates and one four-class traveller field.`);
  }
  const locationIds = new Set(content.locations.map(({ id }) => id));
  unique([...locationIds], "location IDs", sourceKey);
  for (const location of content.locations) {
    text(location.label, `location ${location.id} label`, sourceKey);
    text(location.description, `location ${location.id} description`, sourceKey);
  }
  for (const field of locationFields) {
    if (!locationIds.has(field.selectedId) && !(field.selectedId === "" && field.error?.trim())) throw new Error(`${sourceKey} location field ${field.id} has an invalid selection.`);
  }
  const traveller = travellerFields[0]!;
  if (traveller.minimum !== 1 || traveller.maximum !== 9 || traveller.count < 1 || traveller.count > 9 || !traveller.classOptions.some(({ id }) => id === traveller.selectedClassId)) {
    throw new Error(`${sourceKey} traveller field must preserve bounds 1..9 and four classes.`);
  }
  if (!content.tripModes.some(({ id }) => id === content.selectedTripModeId) || !content.serviceCategories.some(({ id }) => id === content.selectedServiceCategoryId)) {
    throw new Error(`${sourceKey} query selectors have invalid defaults.`);
  }
  if (dateFields.every(({ value }) => Number.isFinite(Date.parse(value))) && Date.parse(dateFields[1].value) < Date.parse(dateFields[0].value)) {
    throw new Error(`${sourceKey} return date precedes departure.`);
  }
  if (content.groups[0].role !== "outbound" || content.groups[1].role !== "return") throw new Error(`${sourceKey} route groups must remain outbound then return.`);
  unique(content.groups.flatMap(({ options }) => options.map(({ id }) => id)), "choice IDs", sourceKey);
  for (const group of content.groups) {
    if (group.options.length !== 2 || !group.options.some(({ id }) => id === group.selectedId)) throw new Error(`${sourceKey} ${group.role} requires two choices and one owned selection.`);
    for (const option of group.options) {
      if (!mediaIds.has(option.mediaSeatId)) throw new Error(`${sourceKey} choice ${option.id} cannot resolve media seat ${option.mediaSeatId}.`);
      text(option.departure.time, `${option.id} departure`, sourceKey);
      text(option.arrival.time, `${option.id} arrival`, sourceKey);
      text(option.duration, `${option.id} duration`, sourceKey);
      if (!Number.isInteger(option.stopCount) || option.stopCount < 0) throw new Error(`${sourceKey} choice ${option.id} has invalid stops.`);
      validateValue(option.price, `${option.id} price`, sourceKey);
    }
  }
  if (!actionIds.has(content.swapActionId) || !actionIds.has(content.searchActionId)) throw new Error(`${sourceKey} swap/search actions do not resolve.`);
  if (fixture.actions.find(({ id }) => id === content.swapActionId)?.behavior !== "swap-query" || fixture.actions.find(({ id }) => id === content.searchActionId)?.behavior !== "run-query") {
    throw new Error(`${sourceKey} query actions have invalid behaviors.`);
  }
  const swapOwner = fixture.actions.find(({ id }) => id === content.swapActionId)?.ownerId;
  const searchOwner = fixture.actions.find(({ id }) => id === content.searchActionId)?.ownerId;
  if (!swapOwner || swapOwner !== searchOwner) throw new Error(`${sourceKey} swap and search must resolve to the one query owner.`);
  for (const key of ["query", "editQuery", "close", "tripMode", "serviceCategory"] as const) {
    text(fixture.copy.fieldLabels?.[key], `field label ${key}`, sourceKey);
  }
  text(fixture.copy.announcements.nonstop, "nonstop announcement", sourceKey);
  text(fixture.copy.announcements.stops, "stops announcement", sourceKey);
}

export function resolveCompareFixture(
  fixture: CompareFixture,
  stress?: string,
  resolvedMedia: CompareResolvedMediaAsset[] = [],
): ResolvedCompareFixture {
  if (!COMPARE_SOURCE_KEYS.includes(fixture.sourceKey)) throw new Error(`Invalid compare source key: ${fixture.sourceKey}`);
  const sourceKey = fixture.sourceKey;
  const active = stress ? merge(fixture, fixture.stress[stress] ?? (() => { throw new Error(`${sourceKey} does not declare stress ${stress}.`); })()) : fixture;
  const expected = EXPECTED[sourceKey];
  if (active.content.kind !== expected.kind) throw new Error(`${sourceKey} must resolve to ${expected.kind}, not ${active.content.kind}.`);
  text(active.copy.comparisonLabel, "comparison label", sourceKey);
  if (active.copy.eyebrow !== undefined) text(active.copy.eyebrow, "eyebrow", sourceKey);
  if (active.copy.title !== undefined) text(active.copy.title, "title", sourceKey);
  if (active.copy.description !== undefined) text(active.copy.description, "description", sourceKey);
  for (const [key, value] of Object.entries(active.copy.announcements)) text(value, `announcement ${key}`, sourceKey);
  for (const [key, value] of Object.entries(active.copy.fieldLabels ?? {})) text(value, `field label ${key}`, sourceKey);
  unique(active.actions.map(({ id }) => id), "action IDs", sourceKey);
  unique(active.media.map(({ id }) => id), "media seat IDs", sourceKey);
  unique(active.media.map(({ assetKey }) => assetKey), "within-fixture media asset keys", sourceKey);
  for (const action of active.actions) {
    text(action.id, "action ID", sourceKey);
    text(action.label, `action ${action.id} label`, sourceKey);
    text(action.ownerId, `action ${action.id} owner`, sourceKey);
    if (action.href && /^(?:https?:)?\/\//i.test(action.href)) throw new Error(`${sourceKey} action ${action.id} uses a remote URL.`);
  }
  for (const seat of active.media) {
    text(seat.alt, `media seat ${seat.id} alt`, sourceKey);
    text(seat.assetKey, `media seat ${seat.id} asset key`, sourceKey);
  }
  const expectedMedia = EXPECTED_MEDIA[sourceKey];
  if (active.media.length !== expectedMedia.count || (expectedMedia.role && active.media.some(({ role }) => role !== expectedMedia.role))) {
    throw new Error(`${sourceKey} does not preserve its exact media seat inventory.`);
  }
  const actionIds = new Set(active.actions.map(({ id }) => id));
  const mediaIds = new Set(active.media.map(({ id }) => id));
  if (active.content.kind === "matrix") validateMatrix(active, active.content, actionIds, mediaIds);
  if (active.content.kind === "offers") validateOffers(active, active.content, actionIds, mediaIds, stress);
  if (active.content.kind === "journey") validateJourney(active, active.content, actionIds, mediaIds);
  const referencedMedia = active.content.kind === "journey"
    ? active.content.groups.flatMap(({ options }) => options.map(({ mediaSeatId }) => mediaSeatId))
    : active.content.candidates.flatMap(({ mediaSeatId }) => mediaSeatId ? [mediaSeatId] : []);
  unique(referencedMedia, "runtime media references", sourceKey);
  if (!exactKeys(referencedMedia, active.media.map(({ id }) => id))) throw new Error(`${sourceKey} has an unused or unresolved media seat.`);

  const resolved = active.media.map((seat) => {
    const asset = resolvedMedia.find((candidate) => candidate.seatId === seat.id || candidate.assetKey === seat.assetKey);
    if (!asset) throw new Error(`${sourceKey} cannot resolve local media asset ${seat.assetKey}.`);
    if (!asset.src.startsWith("/") || asset.src.startsWith("//")) throw new Error(`${sourceKey} media ${seat.assetKey} must use a local public path.`);
    if (asset.darkSrc && (!asset.darkSrc.startsWith("/") || asset.darkSrc.startsWith("//"))) throw new Error(`${sourceKey} dark media ${seat.assetKey} must use a local public path.`);
    if ((seat.role === "product-photo" && asset.kind !== "raster") || (seat.role !== "product-photo" && asset.kind !== "vector")) {
      throw new Error(`${sourceKey} media ${seat.assetKey} has the wrong runtime kind.`);
    }
    if (!asset.alt.trim()) throw new Error(`${sourceKey} media ${seat.assetKey} requires nonempty alt text.`);
    return { ...asset, seatId: seat.id, alt: seat.alt };
  });
  return { ...active, preset: expected.preset, activeStress: stress, resolvedMedia: resolved };
}

export function comparePresetFor(sourceKey: CompareSourceKey) {
  return EXPECTED[sourceKey].preset;
}
