export const PRODUCT_REVIEW_SOURCE_KEYS = [
  "product-reviews-01",
  "product-reviews-02",
  "product-reviews-03",
  "product-reviews-04",
  "product-reviews-05",
] as const;

export const PRODUCT_REVIEW_PRESETS = [
  "analytics-ledger",
  "split-summary",
  "product-proof",
  "photo-proof",
  "review-workbench",
] as const;

export type ProductReviewSourceKey = typeof PRODUCT_REVIEW_SOURCE_KEYS[number];
export type ProductReviewPreset = typeof PRODUCT_REVIEW_PRESETS[number];
export type ProductReviewStress = "short" | "longLocale" | "empty" | "error" | "pending";
export type ProductReviewMediaStatus = "resolved" | "hold" | "error";

type Identified = { id: string };
export type ProductReviewRating = { value: number; maximum: 5; precision: 0.5 };
export type ProductReviewMediaSeat = Identified & { assetId: string; alt: string; role: string; aspect: string; reuseGroupId?: string };
type FixtureStress = { textPatches?: Array<{ targetType: string; targetId: string; field: string; value: string }>; failMediaIds?: string[]; [key: string]: unknown };
export type ProductReviewUploadUnitCopy = {
  pointerAction: string;
  touchAction: string;
  constraints: string;
  validation: Record<"count" | "type" | "size" | "duplicate" | "source", string>;
  announcements: Record<"progress" | "success" | "error", string>;
  actions: Record<"choose" | "remove" | "retry", string>;
};
export type ProductReviewField = Identified & {
  kind: "rating" | "text" | "textarea" | "upload" | "radio" | "checkbox";
  label: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  help?: string;
  accept?: string[];
  maxFiles?: number;
  maxBytesPerFile?: number;
  options?: Array<Identified & { label: string }>;
};
export type ProductReviewOverlayMode = {
  mode: "review" | "question" | "report";
  title: string;
  description: string;
  fields: ProductReviewField[];
  actions: Array<Identified & { kind: "cancel" | "reset" | "submit"; label: string }>;
  successTitle: string;
  successBody: string;
  errorSummary: string;
  pendingLabel: string;
  supportActionId?: string;
};
export type ProductReviewFixture = {
  schemaVersion: number;
  sourceKey: Exclude<ProductReviewSourceKey, "product-reviews-03">;
  owner: "ReviewCenter";
  preset: Exclude<ProductReviewPreset, "product-proof">;
  composition: string;
  intro: { eyebrow: string; heading: string; description: string };
  copy: Record<string, string>;
  aggregate: { rating: ProductReviewRating; reviewCount: number; volume?: number; trendPercent?: number; verifiedCount?: number; period?: { kind: "month"; value: string }; histogram?: Array<{ stars: number; value: number }>; trustMetric?: { value: number; label: string; markMediaIds: string[] } };
  reviews: Array<Identified & { author: Identified & { name: string; avatarMediaId: string }; verified?: boolean; title?: string; rating: ProductReviewRating; dateIso: string; time24h?: string; body: string; spend?: { currency: string; amountMinor: number }; priorReviewCount?: number; votes?: { positive?: number; negative?: number; helpful?: number; selected?: string | null }; actions: Array<Identified & { kind: string; label: string; href?: string }> }>;
  actions: Array<Identified & { kind: string; label: string; href?: string }>;
  filters: Array<Identified & { label: string; selectedId: string; options: Array<Identified & { label: string }> }>;
  pagination: null | { totalRecords: number; pageSize: number; pageCount: number; initialPage: number };
  customerPhotoMediaIds: string[];
  media: ProductReviewMediaSeat[];
  uploadUnitCopy?: ProductReviewUploadUnitCopy;
  overlayCopy: { modes: ProductReviewOverlayMode[]; shared: Record<string, string> };
  announcements: Record<string, string>;
  state: { controls?: Array<Identified & { label: string; selectedLabel?: string; previousLabel?: string; nextLabel?: string; openLabel?: string; closeLabel?: string }> };
  stress: Record<string, FixtureStress>;
};
export type ProductReviewRailFixture = {
  schemaVersion: number;
  sourceKey: "product-reviews-03";
  owner: "ProductReviewRail";
  preset: "product-proof";
  composition: "rail";
  eyebrow: string;
  heading: string;
  description: string;
  finite: true;
  initialRecordId: string;
  records: Array<Identified & { productName: string; productMediaId: string; reviewExcerpt: string; rating: ProductReviewRating; dateIso: string; maker: Identified & { name: string; markMediaId: string }; price: { currency: string; amountMinor: number }; compareAt: { currency: string; amountMinor: number } }>;
  controls: Array<Identified & { label: string }>;
  media: ProductReviewMediaSeat[];
  announcements: Record<string, string>;
  state: Record<string, unknown>;
  stress: Record<string, FixtureStress>;
};
export type ProductReviewsFixture = ProductReviewFixture | ProductReviewRailFixture;

export type ProductReviewsMediaMap = {
  schemaVersion: string;
  status: "PASS";
  counts: { semanticPlacements: number; physicalIdentities: number; resolvedPlacements: number; holdInfraRasterPlacements: number; missingOriginalVectorPlacements: number; providerCallsMade: number; substitutesUsed: number; placeholdersUsed: number; remoteAssets: number; vendorAssets: number };
  identities: Array<{ identityId: string; status: "resolved" | "hold-infra-raster"; kind: "raster" | "vector"; files?: Array<{ format: "avif" | "webp" | "jpg"; src: string; sha256?: string }>; variants?: { light: { src: string }; dark: { src: string } } }>;
  placements: Array<{ slug: ProductReviewSourceKey; seatId: string; fixtureAssetId: string; role: string; aspect: string; alt: string; status: "resolved" | "hold-infra-raster"; identityId: string; resolution: string; reuseGroupId?: string }>;
};

export type ResolvedProductReviewMedia = { seatId: string; identityId: string; role: string; aspect: string; alt: string; status: ProductReviewMediaStatus; sources?: Partial<Record<"avif" | "webp" | "jpg", string>>; variants?: { light: string; dark: string } };
export type ResolvedProductReviewsFixture = ProductReviewsFixture & { activeStress?: string; activeStressState?: FixtureStress; terminalEligible: boolean; mediaById: Map<string, ResolvedProductReviewMedia> };

const REQUIREMENTS: Record<ProductReviewSourceKey, { owner: ProductReviewsFixture["owner"]; preset: ProductReviewPreset; records: number; media: number; actions: number; filters: number }> = {
  "product-reviews-01": { owner: "ReviewCenter", preset: "analytics-ledger", records: 3, media: 3, actions: 0, filters: 0 },
  "product-reviews-02": { owner: "ReviewCenter", preset: "split-summary", records: 3, media: 3, actions: 1, filters: 0 },
  "product-reviews-03": { owner: "ProductReviewRail", preset: "product-proof", records: 4, media: 8, actions: 0, filters: 0 },
  "product-reviews-04": { owner: "ReviewCenter", preset: "photo-proof", records: 3, media: 10, actions: 2, filters: 0 },
  "product-reviews-05": { owner: "ReviewCenter", preset: "review-workbench", records: 6, media: 9, actions: 2, filters: 2 },
};

const required = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const validateRating = (rating: ProductReviewRating, source: string) => {
  if (rating.maximum !== 5 || rating.precision !== 0.5 || rating.value < 0 || rating.value > 5 || rating.value * 2 % 1) throw new Error(`${source} has an invalid half-step rating.`);
};
const validateLocalRoute = (href: string | undefined, label: string, source: string) => {
  if (href !== undefined && (!href.startsWith("/demo/") || href.includes(":") || href.includes("//"))) throw new Error(`${source}/${label} requires one local /demo route.`);
};

function recursiveTarget(value: unknown, targetId: string): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (record.id === targetId || record.mode === targetId) return record;
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) { const found = recursiveTarget(item, targetId); if (found) return found; }
    } else {
      const found = recursiveTarget(child, targetId); if (found) return found;
    }
  }
  return undefined;
}

function setPath(target: Record<string, unknown>, path: string, value: string, source: string) {
  const parts = path.split(".");
  let owner = target;
  for (const part of parts.slice(0, -1)) {
    const next = owner[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) throw new Error(`${source} stress references missing ${path}.`);
    owner = next as Record<string, unknown>;
  }
  const leaf = parts.at(-1)!;
  if (!(leaf in owner)) throw new Error(`${source} stress references missing ${path}.`);
  owner[leaf] = value;
}

function applyStress(fixture: ProductReviewsFixture, stress?: string) {
  if (!stress) return undefined;
  const definition = fixture.stress[stress];
  if (!definition) throw new Error(`${fixture.sourceKey} does not declare stress ${stress}.`);
  for (const patch of definition.textPatches ?? []) {
    const target = patch.targetType === "fixture-root" ? fixture as unknown as Record<string, unknown> : recursiveTarget(fixture, patch.targetId);
    if (!target) throw new Error(`${fixture.sourceKey} stress references unknown ${patch.targetType}/${patch.targetId}.`);
    setPath(target, patch.field, patch.value, fixture.sourceKey);
  }
  return definition;
}

function validateMediaMap(map: ProductReviewsMediaMap) {
  const counts = map.counts;
  if (map.schemaVersion !== "1.0" || map.placements.length !== 33 || counts.semanticPlacements !== 33 || counts.physicalIdentities !== 32) throw new Error("Product Reviews media inventory must remain 33 placements / 32 identities.");
  if (map.status !== "PASS" || counts.resolvedPlacements !== 33 || counts.holdInfraRasterPlacements !== 0 || counts.missingOriginalVectorPlacements !== 0) throw new Error("Product Reviews media resolution must remain 33 resolved / 0 HOLD / 0 manual gaps.");
  if (counts.providerCallsMade < 7 || counts.substitutesUsed || counts.placeholdersUsed || counts.remoteAssets || counts.vendorAssets) throw new Error("Product Reviews media map loses provider evidence or admits a substitute, placeholder, remote or vendor asset.");
  unique(map.placements.map(({ slug, seatId }) => `${slug}/${seatId}`), "media placement IDs", "product-reviews");
}

function validateReviewFixture(fixture: ProductReviewFixture) {
  required(fixture.intro.heading, "intro heading", fixture.sourceKey);
  validateRating(fixture.aggregate.rating, fixture.sourceKey);
  if (!["product-reviews-01", "product-reviews-02", "product-reviews-04"].includes(fixture.sourceKey) && fixture.aggregate.histogram) throw new Error(`${fixture.sourceKey} invents a histogram.`);
  if (["product-reviews-01", "product-reviews-02", "product-reviews-04"].includes(fixture.sourceKey) && fixture.aggregate.histogram?.length !== 5) throw new Error(`${fixture.sourceKey} requires five histogram bins.`);
  for (const review of fixture.reviews) {
    required(review.author.name, `${review.id} author`, fixture.sourceKey); required(review.body, `${review.id} body`, fixture.sourceKey); validateRating(review.rating, fixture.sourceKey);
    review.actions.forEach((action) => validateLocalRoute(action.href, action.id, fixture.sourceKey));
  }
  fixture.actions.forEach((action) => { required(action.label, `${action.id} label`, fixture.sourceKey); validateLocalRoute(action.href, action.id, fixture.sourceKey); });
  if (fixture.sourceKey === "product-reviews-04") {
    if (fixture.customerPhotoMediaIds.length !== 7 || fixture.actions.map(({ kind }) => kind).join("/") !== "write-review/ask-question") throw new Error("product-reviews-04 requires seven photos and distinct review/question intents.");
    if (fixture.reviews.some(({ votes }) => typeof votes?.positive !== "number" || typeof votes?.negative !== "number")) throw new Error("product-reviews-04 requires positive and negative votes per review.");
  }
  if (fixture.sourceKey === "product-reviews-05") {
    if (fixture.filters.length !== 2 || fixture.filters.some(({ options, selectedId }) => options.length !== 4 || !options.some(({ id }) => id === selectedId))) throw new Error("product-reviews-05 requires two exact four-option filter axes.");
    if (JSON.stringify(fixture.pagination) !== JSON.stringify({ totalRecords: 6, pageSize: 3, pageCount: 2, initialPage: 1 })) throw new Error("product-reviews-05 requires one six-record, two-page cursor.");
    if (fixture.reviews.some(({ votes, actions }) => typeof votes?.helpful !== "number" || actions.length !== 1 || actions[0]?.kind !== "report")) throw new Error("product-reviews-05 requires helpful and report ownership per review.");
    const reviewMode = fixture.overlayCopy.modes.find(({ mode }) => mode === "review");
    const reportMode = fixture.overlayCopy.modes.find(({ mode }) => mode === "report");
    const upload = reviewMode?.fields.find(({ kind }) => kind === "upload");
    if (!reviewMode || !reportMode || !upload || JSON.stringify(upload.accept) !== JSON.stringify(["image/jpeg", "image/png", "image/gif", "image/svg+xml"]) || upload.maxFiles !== 10 || upload.maxBytesPerFile !== 5_242_880) throw new Error("product-reviews-05 requires the canonical 10-file / 5-MiB upload contract.");
    const copy = fixture.uploadUnitCopy;
    if (!copy) throw new Error("product-reviews-05 requires canonical UploadUnit copy.");
    const copyStrings = [copy.pointerAction, copy.touchAction, copy.constraints, ...Object.values(copy.validation), ...Object.values(copy.announcements), ...Object.values(copy.actions)];
    copyStrings.forEach((value, index) => required(value, `upload copy ${index + 1}`, fixture.sourceKey));
    if (copyStrings.some((value) => value.includes("—"))) throw new Error("product-reviews-05 UploadUnit copy cannot contain em dashes.");
  }
}

function validateProductRail(fixture: ProductReviewRailFixture) {
  required(fixture.heading, "heading", fixture.sourceKey);
  if (!fixture.finite || fixture.controls.length !== 6 || !fixture.records.some(({ id }) => id === fixture.initialRecordId)) throw new Error("product-reviews-03 requires one finite four-record rail with six controls.");
  for (const record of fixture.records) {
    required(record.productName, `${record.id} product name`, fixture.sourceKey); required(record.reviewExcerpt, `${record.id} review excerpt`, fixture.sourceKey); validateRating(record.rating, fixture.sourceKey);
    if (record.price.amountMinor < 0 || record.compareAt.amountMinor <= record.price.amountMinor) throw new Error("product-reviews-03 requires compare price above current price.");
  }
}

function validateFixture(fixture: ProductReviewsFixture, map: ProductReviewsMediaMap) {
  const requirement = REQUIREMENTS[fixture.sourceKey];
  if (!requirement || fixture.owner !== requirement.owner || fixture.preset !== requirement.preset) throw new Error(`${fixture.sourceKey} is outside the closed Product Reviews contract.`);
  const records = fixture.sourceKey === "product-reviews-03" ? fixture.records : fixture.reviews;
  const actions = fixture.sourceKey === "product-reviews-03" ? [] : fixture.actions;
  const filters = fixture.sourceKey === "product-reviews-03" ? [] : fixture.filters;
  if (records.length !== requirement.records || fixture.media.length !== requirement.media || actions.length !== requirement.actions || filters.length !== requirement.filters) throw new Error(`${fixture.sourceKey} inventory differs from its closed preset.`);
  unique(records.map(({ id }) => id), "record IDs", fixture.sourceKey); unique(fixture.media.map(({ id }) => id), "media IDs", fixture.sourceKey); unique(actions.map(({ id }) => id), "action IDs", fixture.sourceKey);
  const requiredStress = fixture.sourceKey === "product-reviews-03" ? ["short", "longLocale", "error"] : ["short", "longLocale", "empty", "error", "pending"];
  if (requiredStress.some((key) => !fixture.stress[key])) throw new Error(`${fixture.sourceKey} misses a required stress state.`);
  for (const seat of fixture.media) {
    const placement = map.placements.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === seat.id);
    if (!placement || placement.fixtureAssetId !== seat.assetId || placement.role !== seat.role || placement.aspect !== seat.aspect || (placement.reuseGroupId ?? null) !== (seat.reuseGroupId ?? null)) throw new Error(`${fixture.sourceKey}/${seat.id} has no identity-exact audited media placement.`);
  }
  if (fixture.sourceKey === "product-reviews-03") validateProductRail(fixture); else validateReviewFixture(fixture);
}

export function resolveProductReviewsFixture(fixture: ProductReviewsFixture, map: ProductReviewsMediaMap, stress?: string): ResolvedProductReviewsFixture {
  validateMediaMap(map);
  const active = structuredClone(fixture) as ProductReviewsFixture;
  const activeStressState = applyStress(active, stress);
  validateFixture(active, map);
  const failed = new Set(activeStressState?.failMediaIds ?? []);
  const mediaById = new Map(active.media.map((seat) => {
    const placement = map.placements.find(({ slug, seatId }) => slug === active.sourceKey && seatId === seat.id)!;
    const identity = map.identities.find(({ identityId }) => identityId === placement.identityId);
    if (!identity) throw new Error(`${active.sourceKey}/${seat.id} has no audited delivery identity.`);
    const status: ProductReviewMediaStatus = failed.has(seat.id) ? "error" : placement.status === "hold-infra-raster" ? "hold" : "resolved";
    const sources = identity.files?.reduce<Partial<Record<"avif" | "webp" | "jpg", string>>>((delivery, file) => ({ ...delivery, [file.format]: file.src }), {});
    const variants = identity.variants ? { light: identity.variants.light.src, dark: identity.variants.dark.src } : undefined;
    if (status === "resolved" && !sources?.jpg && !variants?.light) throw new Error(`${active.sourceKey}/${seat.id} has no local rendered delivery.`);
    if ([...Object.values(sources ?? {}), variants?.light, variants?.dark].filter(Boolean).some((src) => !src!.startsWith("/media/") || /^https?:/.test(src!))) throw new Error(`${active.sourceKey}/${seat.id} has non-local media.`);
    return [seat.id, { seatId: seat.id, identityId: placement.identityId, role: seat.role, aspect: seat.aspect, alt: seat.alt, status, sources, variants }];
  }));
  const terminalEligible = ![...mediaById.values()].some(({ status }) => status === "hold");
  return Object.assign(active, { activeStress: stress, activeStressState, terminalEligible, mediaById });
}
