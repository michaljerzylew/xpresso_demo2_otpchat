import type { Money, SummaryRowKind } from "./shopping-cart-model";

export const ORDER_SUMMARY_SOURCE_KEYS = [
  "order-summary-01",
  "order-summary-02",
  "order-summary-03",
  "order-summary-04",
  "order-summary-05",
] as const;

export type OrderSummarySourceKey = (typeof ORDER_SUMMARY_SOURCE_KEYS)[number];
export type ReceiptPreset = "compact-dialog" | "split-dialog" | "delivery-table" | "post-purchase" | "tabbed-tracker";
export type ReceiptStressKey = "short" | "longLocale" | "error";

export type ReceiptFact = {
  id: string;
  label: string;
  value: string;
  iconKey?: "mail" | "location" | "person" | "payment" | "shipping" | "note";
  mediaId?: string;
};
export type ReceiptGroup = { id: string; title: string; facts: ReceiptFact[] };
export type ReceiptQuantity =
  | { mode: "fixed"; value: number; label: string }
  | { mode: "stepper"; value: number; min: number; max: number; step: number; label: string; decrementLabel: string; incrementLabel: string };
export type ReceiptItem = {
  id: string;
  title: string;
  mediaId: string;
  attributes: ReceiptFact[];
  quantity: ReceiptQuantity;
  unitPrice: Money;
  lineTotalLabel: string;
  delivery?: ReceiptFact;
};
export type ReceiptPricingRow = { id: string; label: string; kind: SummaryRowKind; amount: Money };
export type ReceiptPricing = { rows: ReceiptPricingRow[]; totalLabel: string; expectedTotal: Money };
export type ReceiptAction = {
  id: string;
  label: string;
  emphasis: "primary" | "secondary" | "peer";
  placement: "header" | "footer";
  behavior: "navigate" | "download" | "track" | "cancel" | "dismiss" | "none";
  href?: string;
};
export type ReceiptTimelineEvent = {
  id: string;
  title: string;
  description: string;
  timeLabel?: string;
  state: "complete" | "current" | "upcoming" | "error";
};
export type ReceiptRegionRef =
  | { kind: "items" }
  | { kind: "pricing" }
  | { kind: "facts"; groupId: string }
  | { kind: "timeline" };
export type ReceiptView = { id: string; label: string; regions: ReceiptRegionRef[] };
export type ReceiptMediaSeat = {
  id: string;
  role: "product-thumb" | "payment-mark";
  assetKey: string;
  alt: string;
  presentation: "square-contain" | "square-cover" | "mark-contain";
};
export type ReceiptCopy = {
  heading: string;
  description?: string;
  closeLabel?: string;
  triggerLabel?: string;
  itemCollectionLabel: string;
  pricingLabel: string;
  timelineLabel?: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel?: string;
  updateAnnouncement?: string;
  viewAnnouncement?: string;
};
export type ReceiptFixtureCore = {
  sourceKey: OrderSummarySourceKey;
  owner: "Receipt";
  preset: ReceiptPreset;
  mode: "amendable" | "read-only";
  copy: ReceiptCopy;
  headerFacts: ReceiptFact[];
  groups: ReceiptGroup[];
  items: ReceiptItem[];
  pricing: ReceiptPricing;
  actions: ReceiptAction[];
  views?: ReceiptView[];
  timeline?: ReceiptTimelineEvent[];
  acknowledgement?: { message: string; signature: string };
  media: ReceiptMediaSeat[];
  initialViewId?: string;
};
export type ReceiptFixturePatch = Partial<Omit<ReceiptFixtureCore, "sourceKey" | "owner" | "preset">>;
export type ReceiptFixture = ReceiptFixtureCore & { stress: Record<ReceiptStressKey, ReceiptFixturePatch> };
export type ReceiptCalculation = {
  lineTotals: Record<string, Money>;
  subtotal: Money;
  total: Money;
};
export type ResolvedReceiptFixture = ReceiptFixtureCore & {
  activeStress?: ReceiptStressKey;
  calculated: ReceiptCalculation;
  mediaById: ReadonlyMap<string, ReceiptMediaSeat>;
};

type ExpectedReceipt = {
  preset: ReceiptPreset;
  mode: ReceiptFixtureCore["mode"];
  headerFacts: number;
  groups: number[];
  items: number[];
  delivery: number;
  pricingKinds: SummaryRowKind[];
  actions: Array<Pick<ReceiptAction, "placement" | "emphasis" | "behavior">>;
  views: number;
  timeline: number;
  media: number;
  acknowledgement: boolean;
};

const EXPECTED: Record<OrderSummarySourceKey, ExpectedReceipt> = {
  "order-summary-01": { preset: "compact-dialog", mode: "amendable", headerFacts: 4, groups: [], items: [2, 2, 2], delivery: 0, pricingKinds: ["subtotal", "discount", "shipping"], actions: [{ placement: "footer", emphasis: "secondary", behavior: "navigate" }], views: 0, timeline: 0, media: 4, acknowledgement: false },
  "order-summary-02": { preset: "split-dialog", mode: "amendable", headerFacts: 3, groups: [4], items: [1, 1, 1], delivery: 0, pricingKinds: ["subtotal", "discount"], actions: [{ placement: "footer", emphasis: "primary", behavior: "navigate" }], views: 0, timeline: 0, media: 4, acknowledgement: false },
  "order-summary-03": { preset: "delivery-table", mode: "read-only", headerFacts: 2, groups: [], items: [2, 2], delivery: 2, pricingKinds: [], actions: [{ placement: "footer", emphasis: "peer", behavior: "track" }, { placement: "footer", emphasis: "peer", behavior: "cancel" }], views: 0, timeline: 0, media: 2, acknowledgement: false },
  "order-summary-04": { preset: "post-purchase", mode: "read-only", headerFacts: 0, groups: [3, 3], items: [3, 3, 3], delivery: 0, pricingKinds: [], actions: [{ placement: "footer", emphasis: "primary", behavior: "track" }], views: 0, timeline: 0, media: 3, acknowledgement: true },
  "order-summary-05": { preset: "tabbed-tracker", mode: "read-only", headerFacts: 1, groups: [5], items: [2, 2, 2], delivery: 0, pricingKinds: ["subtotal", "shipping"], actions: [{ placement: "header", emphasis: "peer", behavior: "download" }, { placement: "header", emphasis: "peer", behavior: "track" }], views: 3, timeline: 6, media: 4, acknowledgement: false },
};

const PATCH_KEYS = new Set(["mode", "copy", "headerFacts", "groups", "items", "pricing", "actions", "views", "timeline", "acknowledgement", "media", "initialViewId"]);
const text = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const money = (amountMinor: number, currency: string): Money => ({ amountMinor, currency });

function validateMoney(value: Money, label: string, sourceKey: string) {
  if (!Number.isInteger(value?.amountMinor) || value.amountMinor < 0) throw new Error(`${sourceKey} ${label} requires non-negative integer minor units.`);
  text(value.currency, `${label} currency`, sourceKey);
}

function validateCopy(copy: ReceiptCopy, sourceKey: OrderSummarySourceKey) {
  for (const key of ["heading", "itemCollectionLabel", "pricingLabel", "errorTitle", "errorDescription"] as const) text(copy[key], `copy.${key}`, sourceKey);
  for (const key of ["description", "closeLabel", "triggerLabel", "timelineLabel", "retryLabel", "updateAnnouncement", "viewAnnouncement"] as const) {
    if (copy[key] !== undefined) text(copy[key], `copy.${key}`, sourceKey);
  }
  if ((sourceKey === "order-summary-01" || sourceKey === "order-summary-02") && (!copy.closeLabel || !copy.triggerLabel || !copy.updateAnnouncement)) {
    throw new Error(`${sourceKey} requires overlay and quantity announcement copy.`);
  }
  if (sourceKey === "order-summary-05" && (!copy.timelineLabel || !copy.viewAnnouncement)) throw new Error(`${sourceKey} requires timeline and view announcement copy.`);
}

function adjustment(row: ReceiptPricingRow) {
  return row.kind === "discount" ? -row.amount.amountMinor : row.kind === "subtotal" ? 0 : row.amount.amountMinor;
}

export function calculateReceipt(
  fixture: Pick<ReceiptFixtureCore, "items" | "pricing">,
  quantities: Record<string, number> = {},
): ReceiptCalculation {
  const currency = fixture.pricing.expectedTotal.currency;
  const lineTotals = Object.fromEntries(fixture.items.map((item) => {
    const quantity = quantities[item.id] ?? item.quantity.value;
    return [item.id, money(item.unitPrice.amountMinor * quantity, currency)];
  }));
  const subtotalMinor = Object.values(lineTotals).reduce((sum, value) => sum + value.amountMinor, 0);
  const totalMinor = subtotalMinor + fixture.pricing.rows.reduce((sum, row) => sum + adjustment(row), 0);
  return { lineTotals, subtotal: money(subtotalMinor, currency), total: money(totalMinor, currency) };
}

function validateCore(fixture: ReceiptFixtureCore): ReceiptCalculation {
  const sourceKey = fixture.sourceKey;
  if (!(ORDER_SUMMARY_SOURCE_KEYS as readonly string[]).includes(sourceKey)) throw new Error(`Unknown order-summary source ${String(sourceKey)}.`);
  const expected = EXPECTED[sourceKey];
  if (fixture.owner !== "Receipt" || fixture.preset !== expected.preset || fixture.mode !== expected.mode) throw new Error(`${sourceKey} has an invalid Receipt owner, preset or mode.`);
  validateCopy(fixture.copy, sourceKey);
  if (fixture.headerFacts.length !== expected.headerFacts || !same(fixture.groups.map(({ facts }) => facts.length), expected.groups) || !same(fixture.items.map(({ attributes }) => attributes.length), expected.items)) {
    throw new Error(`${sourceKey} has an invalid fact, group or item inventory.`);
  }
  if (fixture.items.filter(({ delivery }) => delivery).length !== expected.delivery || !same(fixture.pricing.rows.map(({ kind }) => kind), expected.pricingKinds)) {
    throw new Error(`${sourceKey} has an invalid delivery or pricing inventory.`);
  }
  const actions = fixture.actions.map(({ placement, emphasis, behavior }) => ({ placement, emphasis, behavior }));
  if (!same(actions, expected.actions) || (fixture.views?.length ?? 0) !== expected.views || (fixture.timeline?.length ?? 0) !== expected.timeline || fixture.media.length !== expected.media || Boolean(fixture.acknowledgement) !== expected.acknowledgement) {
    throw new Error(`${sourceKey} has an invalid action, view, event, media or acknowledgement inventory.`);
  }

  const facts = [
    ...fixture.headerFacts,
    ...fixture.groups.flatMap(({ facts: groupFacts }) => groupFacts),
    ...fixture.items.flatMap(({ attributes, delivery }) => [...attributes, ...(delivery ? [delivery] : [])]),
  ];
  const allIds = [
    ...facts.map(({ id }) => id), ...fixture.groups.map(({ id }) => id), ...fixture.items.map(({ id }) => id),
    ...fixture.pricing.rows.map(({ id }) => id), ...fixture.actions.map(({ id }) => id), ...(fixture.views ?? []).map(({ id }) => id),
    ...(fixture.timeline ?? []).map(({ id }) => id), ...fixture.media.map(({ id }) => id),
  ];
  unique(allIds, "semantic IDs", sourceKey);

  fixture.headerFacts.forEach((fact) => { text(fact.label, `fact ${fact.id} label`, sourceKey); text(fact.value, `fact ${fact.id} value`, sourceKey); });
  fixture.groups.forEach((group) => { text(group.title, `group ${group.id} title`, sourceKey); group.facts.forEach((fact) => { text(fact.label, `fact ${fact.id} label`, sourceKey); text(fact.value, `fact ${fact.id} value`, sourceKey); }); });
  const currency = fixture.pricing.expectedTotal.currency;
  fixture.items.forEach((item) => {
    text(item.title, `item ${item.id} title`, sourceKey); text(item.lineTotalLabel, `item ${item.id} line total label`, sourceKey);
    validateMoney(item.unitPrice, `item ${item.id} unit price`, sourceKey);
    if (item.unitPrice.currency !== currency) throw new Error(`${sourceKey} item ${item.id} currency drifts from the receipt currency.`);
    item.attributes.forEach((fact) => { text(fact.label, `fact ${fact.id} label`, sourceKey); text(fact.value, `fact ${fact.id} value`, sourceKey); });
    if (item.delivery) { text(item.delivery.label, `delivery ${item.delivery.id} label`, sourceKey); text(item.delivery.value, `delivery ${item.delivery.id} value`, sourceKey); }
    const quantity = item.quantity;
    text(quantity.label, `item ${item.id} quantity label`, sourceKey);
    if (!Number.isInteger(quantity.value) || quantity.value < 1) throw new Error(`${sourceKey} item ${item.id} requires a positive integer quantity.`);
    if (quantity.mode === "stepper") {
      if (sourceKey !== "order-summary-01" && sourceKey !== "order-summary-02") throw new Error(`${sourceKey} cannot own editable quantities.`);
      if (![quantity.min, quantity.max, quantity.step].every(Number.isInteger) || quantity.min < 1 || quantity.step < 1 || quantity.max < quantity.value || quantity.value < quantity.min) throw new Error(`${sourceKey} item ${item.id} has invalid stepper boundaries.`);
      text(quantity.decrementLabel, `item ${item.id} decrement label`, sourceKey); text(quantity.incrementLabel, `item ${item.id} increment label`, sourceKey);
    } else if (sourceKey === "order-summary-01" || sourceKey === "order-summary-02") throw new Error(`${sourceKey} requires three editable quantities.`);
  });
  validateMoney(fixture.pricing.expectedTotal, "expected total", sourceKey);
  fixture.pricing.rows.forEach((row) => { text(row.label, `pricing row ${row.id} label`, sourceKey); validateMoney(row.amount, `pricing row ${row.id}`, sourceKey); if (row.amount.currency !== currency) throw new Error(`${sourceKey} pricing row ${row.id} currency drifts.`); });
  text(fixture.pricing.totalLabel, "total label", sourceKey);

  fixture.actions.forEach((action) => {
    text(action.label, `action ${action.id} label`, sourceKey);
    if (action.behavior === "navigate") {
      if (!action.href || !/^\/(?!\/)/.test(action.href) || action.href === "/#" || action.href.includes("#") || /^javascript:/i.test(action.href)) throw new Error(`${sourceKey} action ${action.id} requires a safe local demo path.`);
    } else if (action.href !== undefined) throw new Error(`${sourceKey} action ${action.id} may not own href for ${action.behavior}.`);
  });

  const mediaById = new Map(fixture.media.map((seat) => [seat.id, seat]));
  fixture.media.forEach((seat) => { text(seat.assetKey, `media ${seat.id} asset key`, sourceKey); text(seat.alt, `media ${seat.id} alternative`, sourceKey); });
  const referencedMedia = [...fixture.items.map(({ mediaId }) => mediaId), ...facts.flatMap(({ mediaId }) => mediaId ? [mediaId] : [])];
  unique(referencedMedia, "media references", sourceKey);
  for (const item of fixture.items) if (mediaById.get(item.mediaId)?.role !== "product-thumb") throw new Error(`${sourceKey} item ${item.id} cannot resolve one product media seat.`);
  for (const fact of facts) if (fact.mediaId && mediaById.get(fact.mediaId)?.role !== "payment-mark") throw new Error(`${sourceKey} fact ${fact.id} cannot resolve one payment media seat.`);
  if (!same([...referencedMedia].sort(), fixture.media.map(({ id }) => id).sort())) throw new Error(`${sourceKey} declares an unused or missing media seat.`);

  if (sourceKey === "order-summary-05") {
    const views = fixture.views!;
    if (!fixture.initialViewId || !views.some(({ id }) => id === fixture.initialViewId)) throw new Error(`${sourceKey} cannot resolve its initial view.`);
    for (const view of views) {
      text(view.label, `view ${view.id} label`, sourceKey);
      for (const region of view.regions) {
        if (region.kind === "facts" && !fixture.groups.some(({ id }) => id === region.groupId)) throw new Error(`${sourceKey} view ${view.id} references an unknown fact group.`);
        if (region.kind === "timeline" && !fixture.timeline?.length) throw new Error(`${sourceKey} view ${view.id} references a missing timeline.`);
      }
    }
    fixture.timeline!.forEach((event) => { text(event.title, `event ${event.id} title`, sourceKey); text(event.description, `event ${event.id} description`, sourceKey); if (event.timeLabel !== undefined) text(event.timeLabel, `event ${event.id} time`, sourceKey); });
  } else if (fixture.views || fixture.timeline || fixture.initialViewId) throw new Error(`${sourceKey} cannot own receipt views or timeline state.`);
  if (fixture.acknowledgement) { text(fixture.acknowledgement.message, "acknowledgement message", sourceKey); text(fixture.acknowledgement.signature, "acknowledgement signature", sourceKey); }

  const calculated = calculateReceipt(fixture);
  const subtotalRow = fixture.pricing.rows.find(({ kind }) => kind === "subtotal");
  if (subtotalRow && subtotalRow.amount.amountMinor !== calculated.subtotal.amountMinor) throw new Error(`${sourceKey} subtotal row drifts from calculated item totals.`);
  if (calculated.total.amountMinor !== fixture.pricing.expectedTotal.amountMinor || calculated.total.currency !== fixture.pricing.expectedTotal.currency) throw new Error(`${sourceKey} expected total drifts from calculated pricing.`);
  return calculated;
}

function structuralSignature(fixture: ReceiptFixtureCore) {
  return {
    sourceKey: fixture.sourceKey, owner: fixture.owner, preset: fixture.preset, mode: fixture.mode,
    headerFacts: fixture.headerFacts.map(({ id, mediaId }) => ({ id, mediaId })),
    groups: fixture.groups.map(({ id, facts }) => ({ id, facts: facts.map(({ id: factId, mediaId }) => ({ id: factId, mediaId })) })),
    items: fixture.items.map(({ id, mediaId, attributes, delivery, quantity, unitPrice }) => ({
      id, mediaId, attributes: attributes.map(({ id: factId }) => factId), delivery: delivery?.id,
      quantity: quantity.mode === "fixed"
        ? { mode: quantity.mode, value: quantity.value }
        : { mode: quantity.mode, value: quantity.value, min: quantity.min, max: quantity.max, step: quantity.step },
      unitPrice,
    })),
    pricing: fixture.pricing.rows.map(({ id, kind, amount }) => ({ id, kind, amount })),
    expectedTotal: fixture.pricing.expectedTotal,
    actions: fixture.actions.map(({ id, placement, emphasis, behavior, href }) => ({ id, placement, emphasis, behavior, href })),
    views: fixture.views?.map(({ id, regions }) => ({ id, regions })), timeline: fixture.timeline?.map(({ id, state }) => ({ id, state })),
    media: fixture.media.map(({ id, role, assetKey, presentation }) => ({ id, role, assetKey, presentation })), initialViewId: fixture.initialViewId,
  };
}

function mergePatch(base: ReceiptFixtureCore, patch: ReceiptFixturePatch, stress: ReceiptStressKey): ReceiptFixtureCore {
  if (typeof patch !== "object" || patch === null || Array.isArray(patch)) throw new Error(`${base.sourceKey} stress ${stress} must be one object.`);
  for (const key of Object.keys(patch)) if (!PATCH_KEYS.has(key)) throw new Error(`${base.sourceKey} stress ${stress} contains unsupported key ${key}.`);
  if ("stress" in patch || "sourceKey" in patch || "owner" in patch || "preset" in patch) throw new Error(`${base.sourceKey} stress ${stress} cannot change identity or nest stress.`);
  return { ...base, ...patch, copy: { ...base.copy, ...patch.copy } };
}

function immutable<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) immutable(child);
  }
  return value;
}

export function resolveReceiptFixture(raw: ReceiptFixture, stress?: ReceiptStressKey): ResolvedReceiptFixture {
  if (!raw || typeof raw !== "object") throw new Error("Receipt fixture must be an object.");
  const base: ReceiptFixtureCore = {
    sourceKey: raw.sourceKey, owner: raw.owner, preset: raw.preset, mode: raw.mode, copy: raw.copy,
    headerFacts: raw.headerFacts, groups: raw.groups, items: raw.items, pricing: raw.pricing, actions: raw.actions,
    views: raw.views, timeline: raw.timeline, acknowledgement: raw.acknowledgement, media: raw.media, initialViewId: raw.initialViewId,
  };
  const baseCalculation = validateCore(base);
  const stressKeys = Object.keys(raw.stress ?? {});
  if (!same(stressKeys.sort(), (["short", "longLocale", "error"] as ReceiptStressKey[]).sort())) throw new Error(`${raw.sourceKey} requires exactly short, longLocale and error stress patches.`);
  for (const key of stressKeys as ReceiptStressKey[]) {
    const merged = mergePatch(base, raw.stress[key], key);
    validateCore(merged);
    if (!same(structuralSignature(merged), structuralSignature(base))) throw new Error(`${raw.sourceKey} stress ${key} changes structural ownership, values or references.`);
  }
  const resolved = stress ? mergePatch(base, raw.stress[stress], stress) : base;
  const calculated = stress ? validateCore(resolved) : baseCalculation;
  return immutable({ ...resolved, activeStress: stress, calculated, mediaById: new Map(resolved.media.map((seat) => [seat.id, seat])) });
}
