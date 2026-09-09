import type { Money } from "./shopping-cart-model";

export const PRODUCT_OVERVIEW_SOURCE_KEYS = Array.from({ length: 10 }, (_, index) =>
  `product-overview-${String(index + 1).padStart(2, "0")}`,
) as ProductOverviewSourceKey[];

export const PRODUCT_QUICK_VIEW_SOURCE_KEYS = Array.from({ length: 5 }, (_, index) =>
  `product-quick-view-${String(index + 1).padStart(2, "0")}`,
) as ProductQuickViewSourceKey[];

export type ProductOverviewSourceKey = `product-overview-${"01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"}`;
export type ProductQuickViewSourceKey = `product-quick-view-${"01" | "02" | "03" | "04" | "05"}`;
export type ProductDetailSourceKey = ProductOverviewSourceKey | ProductQuickViewSourceKey | "gift-card-03";
export type ProductOverviewPreset = "classic" | "marketplace-order" | "delivery-warranty" | "pickup-finance" | "mosaic-offers" | "digital-license" | "airy-spec" | "lifestyle-offers" | "wide-hero" | "editorial" | "gift-card-denomination";
export type ProductQuickViewPreset = "showcase" | "compact" | "sectioned-copy" | "social-proof" | "gallery-rich";
export type ProductDetailPreset = ProductOverviewPreset | ProductQuickViewPreset;
export type ProductDetailStressKey = "short" | "longLocale" | "error" | "selectedLast" | "quantityBoundary" | "pending" | "success";

export type PdpMediaSeat = {
  id: string;
  identityId: string;
  role: "primary" | "alternate" | "detail" | "colorway" | "payment-mark" | "system-preview";
  kind: "responsive-image" | "system-mark" | "vector-art" | "system-ui" | "held-seat";
  assetKey?: string;
  systemKey?: string;
  alt: string;
  aspect: "1:1" | "4:5" | "4:3" | "3:2" | "16:10" | "16:9";
  focalPoint?: string;
};

export type ProductOption = {
  id: string;
  label: string;
  description?: string;
  mediaSeatIds?: string[];
  priceDelta?: Money;
  disabled?: boolean;
  disabledReason?: string;
  customAmount?: { minMinor: number; maxMinor: number; inputLabel: string; help: string; rangeError: string; invalidError: string };
};
export type ProductOptionGroup = { id: string; label: string; kind: "swatch" | "chip" | "image" | "card"; selectedId: string; options: ProductOption[] };
export type ProductQuantity = { value: number; min: number; max: number; step: number; inputLabel: string; decrementLabel: string; incrementLabel: string };
export type ProductPrice = { base: Money; current: Money; previous?: Money; discountLabel?: string; taxLabel?: string; derivation: "base-plus-selected-options-times-quantity" };

export type ProductActionKind = "add-to-cart" | "cart" | "buy-now" | "purchase" | "wishlist" | "favorite" | "navigate" | "navigate-detail" | "compare" | "support" | "share" | "apply-coupon" | "live-preview";
export type NormalizedProductActionKind = "cart" | "purchase" | "wishlist" | "navigate" | "compare" | "support" | "share" | "apply-coupon" | "live-preview";
export type ProductDetailAction = { id: string; ownerId: "buy-box" | "detail-sections"; label: string; kind: ProductActionKind; emphasis: "primary" | "secondary" | "quiet"; href?: string };
export type ResolvedProductAction = ProductDetailAction & { normalizedKind: NormalizedProductActionKind };
export type ProductFact = { id: string; label: string; value: string; tone?: "neutral" | "positive" | "warning" };
export type ProductDetailSection = {
  id: string;
  title: string;
  kind: "prose" | "specifications" | "seller" | "fulfillment" | "benefits" | "offers" | "payment-offers" | "order-summary" | "trust" | "editorial-features";
  priority: 1 | 2 | 3;
  initiallyOpen?: boolean;
  facts?: ProductFact[];
  body?: string;
  actionIds?: string[];
  mediaSeatIds?: string[];
};
export type ProductSupportFact = { id: string; title: string; kind: "presence" | "trust" | "fulfilment" | "payment"; body?: string; mediaSeatIds?: string[] };
export type ProductIdentity = {
  id: string;
  title: string;
  description?: string;
  eyebrow?: string;
  subtitle?: string;
  badge?: string;
  breadcrumbs?: Array<{ id: string; label: string; href?: string }>;
  rating?: { value: number; maximum: 5; reviewCount?: number; reviewLabel?: string };
  inventory?: { available: number; sold?: number; label: string };
};
export type ProductGallery = { seatIds: string[]; selectedSeatId: string; presentation: "plate" | "filmstrip" | "mosaic" | "editorial" | "system-preview" | "thumbnails" };
export type ProductBuyBox = { price: ProductPrice; optionGroups: ProductOptionGroup[]; quantity?: ProductQuantity; selectedFulfillmentId?: string; primaryActionId?: string; secondaryActionIds: string[] };
export type ProductAnnouncements = {
  optionChanged?: string;
  quantityChanged?: string;
  added?: string;
  favoriteAdded?: string;
  favoriteRemoved?: string;
  error?: string;
  opened?: string;
  closed?: string;
  mediaChanged?: string;
  selectionChanged?: string;
  actionPending?: string;
  actionSucceeded?: string;
  actionFailed?: string;
};
export type ProductCommitState = { commitState: "idle" | "pending" | "error" | "success"; wishlistActive?: boolean };

type ProductDetailBase = {
  sourceKey: ProductDetailSourceKey;
  preset: ProductDetailPreset;
  product: ProductIdentity;
  gallery: ProductGallery;
  buyBox: ProductBuyBox;
  details: ProductDetailSection[];
  actions: ProductDetailAction[];
  media: PdpMediaSeat[];
  announcements: ProductAnnouncements;
};
export type ProductOverviewStressPatch = Partial<Omit<ProductOverviewFixture, "stress" | "sourceKey" | "preset">>;
export type ProductOverviewFixture = ProductDetailBase & {
  sourceKey: ProductOverviewSourceKey | "gift-card-03";
  preset: ProductOverviewPreset;
  stress: Record<"short" | "longLocale" | "error" | "selectedLast", ProductOverviewStressPatch> & { quantityBoundary?: ProductOverviewStressPatch; pending?: ProductOverviewStressPatch; success?: ProductOverviewStressPatch };
};
export type ProductQuickViewFixture = ProductDetailBase & {
  kind: "product-quick-view";
  sourceKey: ProductQuickViewSourceKey;
  preset: ProductQuickViewPreset;
  facts: ProductSupportFact[];
  state: ProductCommitState;
  overlay: {
    triggerLabel: string;
    titleLabel: string;
    closeLabel: string;
    galleryPreviousLabel: string;
    galleryNextLabel: string;
    presentation: { M: "bottom-sheet"; TP: "sheet"; TL: "dialog"; DS: "dialog"; DW: "dialog"; why: string };
  };
  stress: Record<"short" | "longLocale" | "error" | "pending", Partial<Omit<ProductQuickViewFixture, "stress" | "sourceKey" | "preset" | "kind">>>;
};
export type ProductDetailFixture = ProductOverviewFixture | ProductQuickViewFixture;

export type ProductOverviewMediaRecord = {
  slug: ProductDetailSourceKey;
  seatId: string;
  key: string;
  mediaKey: string;
  role: PdpMediaSeat["role"];
  identityId: string;
  kind: "product-thumb" | "system-mark" | "vector-art" | "system-ui" | "held-seat";
  assetId?: string;
  presentation: string;
  src?: string;
  publicBase?: string;
  systemKey?: string;
  alt: string;
  aspect: PdpMediaSeat["aspect"];
};
export type ProductOverviewMediaMap = { version: string; generatedAt: string; records: ProductOverviewMediaRecord[] };

export type ResolvedProductDetail = {
  fixture: ProductDetailFixture;
  sourceKey: ProductDetailSourceKey;
  preset: ProductDetailPreset;
  kind: "product-overview" | "product-quick-view";
  product: ProductIdentity;
  gallery: ProductGallery;
  activeGallerySeatIds: string[];
  buyBox: ProductBuyBox;
  details: ProductDetailSection[];
  facts: ProductSupportFact[];
  media: PdpMediaSeat[];
  actions: ResolvedProductAction[];
  announcements: ProductAnnouncements;
  state: ProductCommitState;
  calculatedPrice: Money;
};

const OVERVIEW_REQUIREMENTS: Record<ProductOverviewSourceKey | "gift-card-03", { preset: ProductOverviewPreset; media: number; gallery: number; groups: number[]; actions: number; details: number; quantity: boolean }> = {
  "product-overview-01": { preset: "classic", media: 4, gallery: 4, groups: [5, 5], actions: 2, details: 2, quantity: false },
  "product-overview-02": { preset: "marketplace-order", media: 5, gallery: 4, groups: [2, 6, 2], actions: 6, details: 3, quantity: true },
  "product-overview-03": { preset: "delivery-warranty", media: 3, gallery: 3, groups: [2, 3, 3, 3], actions: 3, details: 3, quantity: true },
  "product-overview-04": { preset: "pickup-finance", media: 4, gallery: 4, groups: [4, 3], actions: 6, details: 3, quantity: false },
  "product-overview-05": { preset: "mosaic-offers", media: 3, gallery: 3, groups: [5, 2], actions: 5, details: 2, quantity: true },
  "product-overview-06": { preset: "digital-license", media: 1, gallery: 1, groups: [4], actions: 3, details: 5, quantity: false },
  "product-overview-07": { preset: "airy-spec", media: 4, gallery: 4, groups: [3, 6], actions: 0, details: 0, quantity: false },
  "product-overview-08": { preset: "lifestyle-offers", media: 7, gallery: 3, groups: [3], actions: 3, details: 1, quantity: true },
  "product-overview-09": { preset: "wide-hero", media: 4, gallery: 4, groups: [5, 6], actions: 2, details: 1, quantity: true },
  "product-overview-10": { preset: "editorial", media: 8, gallery: 4, groups: [2], actions: 2, details: 9, quantity: false },
  "gift-card-03": { preset: "gift-card-denomination", media: 4, gallery: 4, groups: [5], actions: 1, details: 1, quantity: false },
};
const QUICK_REQUIREMENTS: Record<ProductQuickViewSourceKey, { preset: ProductQuickViewPreset; media: number; gallery: number; groups: number[]; actions: number; details: number; facts: number; quantity: boolean }> = {
  "product-quick-view-01": { preset: "showcase", media: 8, gallery: 4, groups: [3], actions: 1, details: 0, facts: 1, quantity: true },
  "product-quick-view-02": { preset: "compact", media: 3, gallery: 3, groups: [], actions: 2, details: 0, facts: 0, quantity: true },
  "product-quick-view-03": { preset: "sectioned-copy", media: 2, gallery: 2, groups: [2], actions: 2, details: 3, facts: 0, quantity: true },
  "product-quick-view-04": { preset: "social-proof", media: 7, gallery: 3, groups: [3], actions: 5, details: 0, facts: 4, quantity: true },
  "product-quick-view-05": { preset: "gallery-rich", media: 4, gallery: 4, groups: [3, 3], actions: 2, details: 0, facts: 0, quantity: false },
};

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const same = (left: unknown[], right: unknown[]) => left.length === right.length && left.every((value, index) => value === right[index]);
const localHref = (href: string | undefined, label: string, sourceKey: string) => {
  if (!href?.startsWith("/") || href.startsWith("//") || href === "#") throw new Error(`${sourceKey} ${label} requires a safe local path.`);
};
const validateMoney = (value: Money, label: string, sourceKey: string, allowNegative = false) => {
  if (!Number.isInteger(value.amountMinor) || (!allowNegative && value.amountMinor < 0)) throw new Error(`${sourceKey} ${label} requires integer minor units.`);
  required(value.currency, `${label} currency`, sourceKey);
};

function mergePatch(base: unknown, patch: unknown, sourceKey: string): unknown {
  if (patch === undefined) return structuredClone(base);
  if (Array.isArray(base) && Array.isArray(patch)) {
    const baseItems = base as Array<Record<string, unknown>>;
    const patchItems = patch as Array<Record<string, unknown>>;
    if (!patchItems.every((item) => typeof item?.id === "string") || !baseItems.every((item) => typeof item?.id === "string")) return structuredClone(patch);
    const byId = new Map(patchItems.map((item) => [item.id, item]));
    for (const id of byId.keys()) if (!baseItems.some((item) => item.id === id)) throw new Error(`${sourceKey} stress patch references unknown ID ${id}.`);
    return baseItems.map((item) => byId.has(item.id) ? mergePatch(item, byId.get(item.id), sourceKey) : structuredClone(item));
  }
  if (base && patch && typeof base === "object" && typeof patch === "object") {
    const output = structuredClone(base) as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
      if (key === "stress") throw new Error(`${sourceKey} stress patches cannot nest stress.`);
      output[key] = mergePatch(output[key], value, sourceKey);
    }
    return output;
  }
  return structuredClone(patch);
}

export function normalizeProductActionKind(kind: ProductActionKind): NormalizedProductActionKind {
  if (kind === "add-to-cart" || kind === "cart") return "cart";
  if (kind === "buy-now" || kind === "purchase") return "purchase";
  if (kind === "favorite" || kind === "wishlist") return "wishlist";
  if (kind === "navigate" || kind === "navigate-detail") return "navigate";
  return kind;
}

export function calculateProductPrice(buyBox: ProductBuyBox, selections?: Record<string, string>, quantityValue?: number): Money {
  const selected = selections ?? Object.fromEntries(buyBox.optionGroups.map((group) => [group.id, group.selectedId]));
  const delta = buyBox.optionGroups.reduce((sum, group) => {
    const option = group.options.find(({ id }) => id === selected[group.id]);
    return sum + (option?.priceDelta?.amountMinor ?? 0);
  }, 0);
  const quantity = quantityValue ?? buyBox.quantity?.value ?? 1;
  return { currency: buyBox.price.base.currency, amountMinor: (buyBox.price.base.amountMinor + delta) * quantity };
}

function validateFixture(fixture: ProductDetailFixture, enforceDeclaredCurrent = true) {
  const sourceKey = fixture.sourceKey;
  const quick = sourceKey.startsWith("product-quick-view-");
  const requirement = quick ? QUICK_REQUIREMENTS[sourceKey as ProductQuickViewSourceKey] : OVERVIEW_REQUIREMENTS[sourceKey as ProductOverviewSourceKey | "gift-card-03"];
  if (!requirement || fixture.preset !== requirement.preset) throw new Error(`${sourceKey} has an unknown source key or wrong preset.`);
  required(fixture.product.title, "product title", sourceKey);
  unique(fixture.media.map(({ id }) => id), "media IDs", sourceKey);
  unique(fixture.buyBox.optionGroups.map(({ id }) => id), "option group IDs", sourceKey);
  unique(fixture.buyBox.optionGroups.flatMap(({ options }) => options.map(({ id }) => id)), "option IDs", sourceKey);
  unique(fixture.details.map(({ id }) => id), "detail IDs", sourceKey);
  unique(fixture.actions.map(({ id }) => id), "action IDs", sourceKey);
  const factIds = [...fixture.details.flatMap(({ facts = [] }) => facts.map(({ id }) => id)), ...("facts" in fixture ? fixture.facts.map(({ id }) => id) : [])];
  unique(factIds, "fact IDs", sourceKey);
  const mediaIds = new Set(fixture.media.map(({ id }) => id));
  if (!fixture.gallery.seatIds.every((id) => mediaIds.has(id)) || !mediaIds.has(fixture.gallery.selectedSeatId)) throw new Error(`${sourceKey} cannot resolve its gallery media references.`);
  for (const seat of fixture.media) {
    required(seat.alt, `media ${seat.id} alternative`, sourceKey);
    if (seat.kind === "system-ui") required(seat.systemKey, `media ${seat.id} system key`, sourceKey);
    else required(seat.assetKey, `media ${seat.id} asset key`, sourceKey);
    if (seat.assetKey && (/^(?:https?:)?\/\//i.test(seat.assetKey) || seat.assetKey.startsWith("/"))) throw new Error(`${sourceKey} media ${seat.id} uses an asset key as a URL.`);
  }
  for (const group of fixture.buyBox.optionGroups) {
    required(group.label, `option group ${group.id} label`, sourceKey);
    unique(group.options.map(({ id }) => id), `options in ${group.id}`, sourceKey);
    const selected = group.options.find(({ id }) => id === group.selectedId);
    if (!selected) throw new Error(`${sourceKey} cannot resolve selected choice ${group.selectedId}.`);
    if (selected.disabled) throw new Error(`${sourceKey} cannot select disabled choice ${group.selectedId}.`);
    for (const option of group.options) {
      required(option.label, `option ${option.id} label`, sourceKey);
      if (option.disabled && !option.disabledReason) throw new Error(`${sourceKey} disabled option ${option.id} requires a reason.`);
      if (option.priceDelta) {
        validateMoney(option.priceDelta, `option ${option.id} price delta`, sourceKey, true);
        if (option.priceDelta.currency !== fixture.buyBox.price.base.currency) throw new Error(`${sourceKey} option ${option.id} currency drifts from base price.`);
      }
      if (option.customAmount) {
        if (![option.customAmount.minMinor, option.customAmount.maxMinor].every(Number.isInteger) || option.customAmount.minMinor < 0 || option.customAmount.maxMinor <= option.customAmount.minMinor) throw new Error(`${sourceKey} option ${option.id} has invalid custom amount bounds.`);
        for (const value of [option.customAmount.inputLabel, option.customAmount.help, option.customAmount.rangeError, option.customAmount.invalidError]) required(value, `option ${option.id} custom amount copy`, sourceKey);
      }
      if (option.mediaSeatIds?.some((id) => !mediaIds.has(id))) throw new Error(`${sourceKey} option ${option.id} has a dangling media reference.`);
    }
  }
  validateMoney(fixture.buyBox.price.base, "base price", sourceKey);
  validateMoney(fixture.buyBox.price.current, "current price", sourceKey);
  if (fixture.buyBox.price.base.currency !== fixture.buyBox.price.current.currency) throw new Error(`${sourceKey} current price currency drifts from base price.`);
  if (enforceDeclaredCurrent && fixture.buyBox.price.current.amountMinor !== calculateProductPrice(fixture.buyBox).amountMinor) throw new Error(`${sourceKey} base current price drifts from selected options and quantity.`);
  if (fixture.buyBox.price.previous) {
    validateMoney(fixture.buyBox.price.previous, "previous price", sourceKey);
    if (fixture.buyBox.price.previous.currency !== fixture.buyBox.price.base.currency || fixture.buyBox.price.previous.amountMinor <= fixture.buyBox.price.current.amountMinor) throw new Error(`${sourceKey} previous price must exceed current price in the same currency.`);
  }
  const quantity = fixture.buyBox.quantity;
  if (quantity && (![quantity.value, quantity.min, quantity.max, quantity.step].every(Number.isInteger) || quantity.min < 1 || quantity.min > quantity.max || quantity.step < 1 || quantity.value < quantity.min || quantity.value > quantity.max)) throw new Error(`${sourceKey} has invalid quantity bounds.`);
  const actionMap = new Map(fixture.actions.map((action) => [action.id, action]));
  const buyRefs = [fixture.buyBox.primaryActionId, ...fixture.buyBox.secondaryActionIds].filter(Boolean) as string[];
  for (const id of buyRefs) if (actionMap.get(id)?.ownerId !== "buy-box") throw new Error(`${sourceKey} buy box cannot resolve owned action ${id}.`);
  for (const detail of fixture.details) {
    for (const id of detail.actionIds ?? []) if (actionMap.get(id)?.ownerId !== "detail-sections") throw new Error(`${sourceKey} detail ${detail.id} cannot resolve owned action ${id}.`);
    if (detail.mediaSeatIds?.some((id) => !mediaIds.has(id))) throw new Error(`${sourceKey} detail ${detail.id} has a dangling media reference.`);
  }
  if ("facts" in fixture) for (const fact of fixture.facts) if (fact.mediaSeatIds?.some((id) => !mediaIds.has(id))) throw new Error(`${sourceKey} fact ${fact.id} has a dangling media reference.`);
  for (const action of fixture.actions) {
    required(action.label, `action ${action.id} label`, sourceKey);
    if (normalizeProductActionKind(action.kind) === "navigate") localHref(action.href, `action ${action.id}`, sourceKey);
  }
  const primary = fixture.buyBox.primaryActionId ? actionMap.get(fixture.buyBox.primaryActionId) : undefined;
  if (sourceKey === "product-overview-07") {
    if (primary || fixture.actions.length) throw new Error(`${sourceKey} must remain actionless.`);
  } else if (!primary || primary.emphasis !== "primary" || primary.ownerId !== "buy-box") throw new Error(`${sourceKey} requires one primary buy-box action.`);

  if (fixture.media.length !== requirement.media || fixture.gallery.seatIds.length !== requirement.gallery || fixture.actions.length !== requirement.actions || fixture.details.length !== requirement.details || Boolean(quantity) !== requirement.quantity || !same(fixture.buyBox.optionGroups.map(({ options }) => options.length), requirement.groups)) {
    throw new Error(`${sourceKey} violates its exact source inventory.`);
  }
  if (quick) {
    const quickFixture = fixture as ProductQuickViewFixture;
    if (quickFixture.kind !== "product-quick-view" || quickFixture.facts.length !== (requirement as typeof QUICK_REQUIREMENTS[ProductQuickViewSourceKey]).facts) throw new Error(`${sourceKey} violates its quick-view identity or fact inventory.`);
    for (const label of [quickFixture.overlay.triggerLabel, quickFixture.overlay.titleLabel, quickFixture.overlay.closeLabel, quickFixture.overlay.galleryPreviousLabel, quickFixture.overlay.galleryNextLabel, quickFixture.overlay.presentation.why]) required(label, "overlay label or WHY", sourceKey);
    if (!same(Object.keys(quickFixture.stress).sort(), ["error", "longLocale", "pending", "short"])) throw new Error(`${sourceKey} requires exact quick-view stresses.`);
  } else {
    const overview = fixture as ProductOverviewFixture;
    const expectedStress = sourceKey === "gift-card-03" ? ["error", "longLocale", "pending", "selectedLast", "short", "success"] : quantity ? ["error", "longLocale", "quantityBoundary", "selectedLast", "short"] : ["error", "longLocale", "selectedLast", "short"];
    if (!same(Object.keys(overview.stress).sort(), expectedStress)) throw new Error(`${sourceKey} requires exact product-overview stresses.`);
  }
}

export function resolveProductDetailFixture(fixture: ProductDetailFixture, stress?: ProductDetailStressKey): ResolvedProductDetail {
  if (stress && !(stress in fixture.stress)) throw new Error(`${fixture.sourceKey} does not declare stress ${stress}.`);
  validateFixture(fixture);
  const merged = (stress ? mergePatch(fixture, fixture.stress[stress as keyof typeof fixture.stress], fixture.sourceKey) : structuredClone(fixture)) as ProductDetailFixture;
  merged.stress = structuredClone(fixture.stress) as ProductDetailFixture["stress"];
  validateFixture(merged, !stress);
  const actions = merged.actions.map((action) => ({ ...action, normalizedKind: normalizeProductActionKind(action.kind) }));
  const selectedMediaGroups = merged.buyBox.optionGroups
    .map((group) => group.options.find(({ id }) => id === group.selectedId)?.mediaSeatIds)
    .filter((value): value is string[] => Boolean(value?.length));
  const multiSeatSelection = selectedMediaGroups.find((ids) => ids.length > 1);
  const activeGallerySeatIds = multiSeatSelection ?? [...new Set([...merged.gallery.seatIds, ...selectedMediaGroups.flat()])];
  return {
    fixture: merged,
    sourceKey: merged.sourceKey,
    preset: merged.preset,
    kind: "kind" in merged ? "product-quick-view" : "product-overview",
    product: merged.product,
    gallery: merged.gallery,
    activeGallerySeatIds,
    buyBox: merged.buyBox,
    details: merged.details,
    facts: "facts" in merged ? merged.facts : [],
    media: merged.media,
    actions,
    announcements: merged.announcements,
    state: "state" in merged ? merged.state : { commitState: "idle", wishlistActive: false },
    calculatedPrice: calculateProductPrice(merged.buyBox),
  };
}

export function resolveProductOverviewFixture(fixture: ProductDetailFixture, mediaMap: ProductOverviewMediaMap, stress?: ProductDetailStressKey): ResolvedProductDetail {
  const resolved = resolveProductDetailFixture(fixture, stress);
  const records = mediaMap.records.filter(({ slug }) => slug === fixture.sourceKey);
  if (records.length !== fixture.media.length) throw new Error(`${fixture.sourceKey} requires one media-map record per exact seat.`);
  unique(records.map(({ seatId }) => seatId), "media-map seat IDs", fixture.sourceKey);
  for (const seat of resolved.media) {
    const record = records.find(({ seatId, key }) => seatId === seat.id && key === (seat.assetKey ?? seat.systemKey));
    if (!record || record.identityId !== seat.identityId || record.role !== seat.role || record.aspect !== seat.aspect || record.alt !== seat.alt) throw new Error(`${fixture.sourceKey}/${seat.id} resolves the wrong media record.`);
    if (seat.kind === "responsive-image" && (record.kind !== "product-thumb" || !record.publicBase?.startsWith("/media/") || !record.src?.startsWith("/media/") || /https?:\/\//i.test(record.src))) throw new Error(`${fixture.sourceKey}/${seat.id} requires local responsive media.`);
    if (seat.kind === "system-mark" && (record.kind !== "system-mark" || !record.src?.startsWith("/media/") || !record.src.endsWith(".svg"))) throw new Error(`${fixture.sourceKey}/${seat.id} requires a local vector mark.`);
    if (seat.kind === "vector-art" && (record.kind !== "vector-art" || !record.src?.startsWith("/media/") || !record.src.endsWith(".svg"))) throw new Error(`${fixture.sourceKey}/${seat.id} requires local vector artwork.`);
    if (seat.kind === "system-ui" && (record.kind !== "system-ui" || record.systemKey !== seat.systemKey || record.src || record.publicBase)) throw new Error(`${fixture.sourceKey}/${seat.id} requires code-rendered system UI.`);
    if (seat.kind === "held-seat" && (record.kind !== "held-seat" || record.src || record.publicBase || !record.presentation)) throw new Error(`${fixture.sourceKey}/${seat.id} requires a truthful held media record.`);
  }
  return resolved;
}
