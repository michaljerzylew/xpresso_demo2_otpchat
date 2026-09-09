import type { UploadFileRecord, UploadMediaMap, ResolvedUpload } from "./upload-model";
import type { ProductOverviewFixture, ProductOverviewMediaMap } from "./product-overview-model";

export const GIFT_CARD_SOURCE_KEYS = ["gift-card-01", "gift-card-02", "gift-card-03"] as const;
export type GiftCardSourceKey = (typeof GIFT_CARD_SOURCE_KEYS)[number];
export type GiftCardStressKey = "short" | "longLocale" | "error" | "pending" | "success";
export type GiftCardCopyMode = "base" | "short" | "longLocale";
export type GiftCardSurfacePreset = "delivery-purchase" | "live-designer";

type CopyTable = Record<string, string>;
type Currency = { id: string; labelKey: string; symbol: string };
type AmountChoice = { id: string; kind: "preset" | "custom"; labelKey: string; minorByCurrency?: Record<string, number> };
type RecipientField = { id: string; labelKey: string; exampleKey: string; helpKey?: string; counterKey?: string; maxLength?: number; required?: boolean; validationErrorKey?: string; counterRemaining40Key?: string; counterRemaining20Key?: string; counterRemaining0Key?: string };

type GiftCardBaseFixture = {
  schemaVersion: 1;
  sourceKey: GiftCardSourceKey;
  owner: "GiftCardSurface" | "ProductOverview";
  preset: GiftCardSurfacePreset | "gift-card-denomination";
  copy: Record<GiftCardCopyMode, CopyTable>;
};

export type DeliveryPurchaseFixture = GiftCardBaseFixture & {
  sourceKey: "gift-card-01";
  owner: "GiftCardSurface";
  preset: "delivery-purchase";
  limits: { messageMaxLength: number };
  intro: { headingKey: string; ledeKey: string };
  navigation: { labelKey: string; orientationActionKey: string; href: string };
  deliveryChoices: Array<{ id: string; labelKey: string; descriptionKey: string }>;
  currencies: Currency[];
  amountChoices: AmountChoice[];
  customAmount: { minMinorByCurrency: Record<string, number>; maxMinorByCurrency: Record<string, number>; labelKey: string; helpKey: string };
  timingChoices: Array<{ id: string; labelKey: string; descriptionKey: string; scheduleDate?: { labelKey: string; helpKey: string } }>;
  recipientFields: RecipientField[];
  physicalFields: RecipientField[];
  stateKeys: Record<string, string>;
};

export type LiveDesignerFixture = GiftCardBaseFixture & {
  sourceKey: "gift-card-02";
  owner: "GiftCardSurface";
  preset: "live-designer";
  preview: { owner: "LivePreview"; preset: "gift-card-editor"; fields: ["cover", "recipient", "amount", "message"] } & Record<string, unknown>;
  limits: { messageMaxLength: number; uploadMaxFiles: number; uploadMaxBytes: number };
  intro: { headingKey: string; ledeKey: string };
  balanceAction: { href: string; labelKey: string; retryActionKey: string };
  coverSources: Array<{ id: "standard" | "upload"; labelKey: string }>;
  designs: Array<{ id: string; mediaId: string; labelKey: string; previewAltKey: string; tagIds: string[] }>;
  activeTagIds: string[];
  tags: Array<{ id: string; labelKey: string }>;
  upload: { maxFiles: number; maxBytes: number; accept: string[] } & Record<string, unknown>;
  currencies: Currency[];
  amountChoices: AmountChoice[];
  customAmount: { minMinorByCurrency: Record<string, number>; maxMinorByCurrency: Record<string, number>; inputLabelKey: string; errorMinKey: string; errorMaxKey: string; errorInvalidKey: string };
  recipientFields: RecipientField[];
  stateKeys: Record<string, string>;
};

export type GiftCardDenominationFixture = GiftCardBaseFixture & {
  sourceKey: "gift-card-03";
  owner: "ProductOverview";
  preset: "gift-card-denomination";
  composition: { galleryOwner: "PdpGallery"; buyBoxOwner: "BuyBox"; detailSectionsOwner: "DetailSections" };
  fixedCurrency: { code: string; symbol: string; labelKey: string };
  intro: { headingKey: string; bodyKey: string };
  mediaDeclarations: Array<{ id: string; mediaSeatId: string }>;
  denominationChoices: Array<{ id: string; amountMinor: number; labelKey: string; mediaId: string; mediaSeatId: string; thumbnailLabelKey: string; thumbnailAltKey: string; selectedMediaAltKey: string }>;
  customAmount: { minMinor: number; maxMinor: number; labelKey: string; inputLabelKey: string; helpKey: string; rangeErrorKey: string; invalidErrorKey: string };
  stateKeys: Record<string, string>;
};

export type GiftCardFixture = DeliveryPurchaseFixture | LiveDesignerFixture | GiftCardDenominationFixture;
export type GiftCardSurfaceFixture = DeliveryPurchaseFixture | LiveDesignerFixture;
export type GiftCardMediaRecord = {
  slug: GiftCardSourceKey;
  seatId: string;
  key: string;
  identityId: string;
  role: "promo-art" | "cover-design" | "denomination-art";
  kind: "original-vector";
  aspect: "16:10";
  alt: string;
  status: "RESOLVED-ORIGINAL";
  src: string;
  canonicalPath: string;
  publicPath: string;
  viewBox: "0 0 960 600";
  sha256: string;
  decisionId: "D-M37";
};
export type GiftCardMediaMap = { version: "gift-card-media-v2"; records: GiftCardMediaRecord[] };

export type ResolvedGiftCardSurface = GiftCardSurfaceFixture & { activeCopy: CopyTable; activeStress?: GiftCardStressKey; media: GiftCardMediaRecord[] };

const required = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const safeLocal = (href: string, label: string, source: string) => {
  if (!href.startsWith("/") || href.startsWith("//") || href === "#") throw new Error(`${source} ${label} requires a safe local route.`);
};
const exactKeys = (copy: Record<GiftCardCopyMode, CopyTable>, source: string) => {
  const base = Object.keys(copy.base).sort().join("|");
  if (!base || Object.keys(copy.short).sort().join("|") !== base || Object.keys(copy.longLocale).sort().join("|") !== base) throw new Error(`${source} copy modes must have exact key parity.`);
};

export function resolveGiftCardFixture(fixture: GiftCardSurfaceFixture, mediaMap: GiftCardMediaMap, stress?: GiftCardStressKey): ResolvedGiftCardSurface;
export function resolveGiftCardFixture(fixture: GiftCardDenominationFixture, mediaMap: GiftCardMediaMap, stress?: GiftCardStressKey): GiftCardDenominationFixture & { activeCopy: CopyTable; activeStress?: GiftCardStressKey; media: GiftCardMediaRecord[] };
export function resolveGiftCardFixture(fixture: GiftCardFixture, mediaMap: GiftCardMediaMap, stress?: GiftCardStressKey): GiftCardFixture & { activeCopy: CopyTable; activeStress?: GiftCardStressKey; media: GiftCardMediaRecord[] };
export function resolveGiftCardFixture(fixture: GiftCardFixture, mediaMap: GiftCardMediaMap, stress?: GiftCardStressKey): any {
  if (!GIFT_CARD_SOURCE_KEYS.includes(fixture.sourceKey)) throw new Error(`Unknown gift-card source ${fixture.sourceKey}.`);
  if (fixture.schemaVersion !== 1) throw new Error(`${fixture.sourceKey} requires schema version 1.`);
  exactKeys(fixture.copy, fixture.sourceKey);
  const expectedPreset = fixture.sourceKey === "gift-card-01" ? "delivery-purchase" : fixture.sourceKey === "gift-card-02" ? "live-designer" : "gift-card-denomination";
  const expectedOwner = fixture.sourceKey === "gift-card-03" ? "ProductOverview" : "GiftCardSurface";
  if (fixture.preset !== expectedPreset || fixture.owner !== expectedOwner) throw new Error(`${fixture.sourceKey} has the wrong owner or closed preset.`);
  const media = mediaMap.records.filter(({ slug }) => slug === fixture.sourceKey);
  const expectedMedia = fixture.sourceKey === "gift-card-01" ? 1 : fixture.sourceKey === "gift-card-02" ? 5 : 4;
  if (media.length !== expectedMedia || media.some(({ kind, status, aspect, src, canonicalPath, publicPath, viewBox, sha256, decisionId }) => kind !== "original-vector" || status !== "RESOLVED-ORIGINAL" || aspect !== "16:10" || !src.startsWith("/media/gift-card-") || !src.endsWith(".svg") || !canonicalPath.startsWith("assets-library/vectors/gift-card/") || !publicPath.startsWith("apps/preview/public/media/gift-card-") || viewBox !== "0 0 960 600" || !/^[a-f0-9]{64}$/.test(sha256) || decisionId !== "D-M37")) throw new Error(`${fixture.sourceKey} requires ${expectedMedia} resolved original vector seats.`);
  unique(media.map(({ seatId }) => seatId), "media seat IDs", fixture.sourceKey);
  unique(media.map(({ identityId }) => identityId), "media identities", fixture.sourceKey);
  for (const record of media) required(record.alt, `${record.seatId} alternative`, fixture.sourceKey);

  if (fixture.sourceKey === "gift-card-01") {
    if (fixture.deliveryChoices.length !== 2 || fixture.currencies.length !== 3 || fixture.amountChoices.length !== 5 || fixture.timingChoices.length !== 2 || fixture.recipientFields.length !== 3 || fixture.physicalFields.length !== 4) throw new Error(`${fixture.sourceKey} violates its exact delivery inventory.`);
    safeLocal(fixture.navigation.href, "orientation action", fixture.sourceKey);
  } else if (fixture.sourceKey === "gift-card-02") {
    if (fixture.preview.owner !== "LivePreview" || fixture.designs.length !== 5 || fixture.tags.length !== 10 || fixture.activeTagIds.length !== 2 || fixture.coverSources.length !== 2 || fixture.currencies.length !== 3 || fixture.amountChoices.length !== 5 || fixture.recipientFields.length !== 3) throw new Error(`${fixture.sourceKey} violates its exact designer inventory.`);
    if (fixture.upload.maxFiles !== 6 || fixture.upload.maxBytes !== 5_242_880 || fixture.upload.accept.join("|") !== "image/jpeg|image/png|image/webp") throw new Error(`${fixture.sourceKey} upload limits drifted.`);
    unique(fixture.designs.map(({ id }) => id), "design IDs", fixture.sourceKey); unique(fixture.tags.map(({ id }) => id), "tag IDs", fixture.sourceKey);
    const tagIds = new Set(fixture.tags.map(({ id }) => id));
    if (fixture.designs.some(({ tagIds: ids }) => ids.length !== 2 || ids.some((id) => !tagIds.has(id)))) throw new Error(`${fixture.sourceKey} has dangling design tags.`);
    const seatIds = new Set(media.map(({ seatId }) => seatId));
    if (fixture.designs.some(({ mediaId }) => !seatIds.has(mediaId))) throw new Error(`${fixture.sourceKey} has dangling design media.`);
    safeLocal(fixture.balanceAction.href, "balance action", fixture.sourceKey);
  } else {
    if (fixture.denominationChoices.length !== 4 || fixture.mediaDeclarations.length !== 4) throw new Error(`${fixture.sourceKey} requires four synchronized denomination records.`);
    unique(fixture.denominationChoices.map(({ id }) => id), "denomination IDs", fixture.sourceKey);
    const declarationIds = new Set(fixture.mediaDeclarations.map(({ id }) => id));
    const seatIds = new Set(media.map(({ seatId }) => seatId));
    if (fixture.denominationChoices.some(({ mediaId, mediaSeatId, amountMinor }) => !declarationIds.has(mediaId) || !seatIds.has(mediaSeatId) || !Number.isInteger(amountMinor) || amountMinor <= 0)) throw new Error(`${fixture.sourceKey} has a dangling or invalid denomination.`);
  }

  const mode: GiftCardCopyMode = stress === "short" ? "short" : stress === "longLocale" ? "longLocale" : "base";
  return { ...fixture, activeCopy: fixture.copy[mode], activeStress: stress, media };
}

export function createGiftCardUploadModel(fixture: LiveDesignerFixture, copy: CopyTable, files: UploadFileRecord[] = []): ResolvedUpload {
  return {
    schemaVersion: 1,
    owner: "UploadUnit",
    sourceKey: `${fixture.sourceKey}-cover-upload`,
    preset: "project-assets",
    heading: copy.coverSourceUpload,
    description: copy.uploadConstraints,
    uploadCopy: {
      pointerAction: copy.uploadPointerInstruction,
      touchAction: copy.uploadTouchInstruction,
      constraints: copy.uploadConstraints,
      validation: { count: copy.uploadInvalidCount, type: copy.uploadInvalidType, size: copy.uploadInvalidSize, duplicate: copy.uploadRecoverableError, source: copy.uploadRecoverableError },
      announcements: { progress: copy.uploadPending, success: copy.uploadSuccess, error: copy.uploadRecoverableError },
    },
    files,
    actions: { choose: copy.chooseFiles, remove: copy.removeFile, retry: copy.balanceRetryAction },
    stress: { short: {}, longLocale: {}, missingOptional: {}, empty: copy.uploadEmpty, pending: {}, error: copy.uploadRecoverableError, success: {} },
    accept: fixture.upload.accept,
    multiple: true,
    maxFiles: fixture.upload.maxFiles,
    maxBytes: fixture.upload.maxBytes,
  };
}

export const EMPTY_UPLOAD_MEDIA_MAP: UploadMediaMap = { schemaVersion: "1.0", records: [] };

export function giftCardDenominationToProductOverview(fixture: GiftCardDenominationFixture, mediaMap: GiftCardMediaMap, stress?: GiftCardStressKey): { fixture: ProductOverviewFixture; mediaMap: ProductOverviewMediaMap } {
  const resolved = resolveGiftCardFixture(fixture, mediaMap, stress);
  const copy = resolved.activeCopy;
  const first = fixture.denominationChoices[0];
  const productFixture: ProductOverviewFixture = {
    sourceKey: "gift-card-03",
    preset: "gift-card-denomination",
    product: { id: "gift-card-denomination", title: copy[fixture.intro.headingKey], description: copy[fixture.intro.bodyKey] },
    gallery: { seatIds: fixture.denominationChoices.map(({ mediaSeatId }) => mediaSeatId), selectedSeatId: first.mediaSeatId, presentation: "thumbnails" },
    media: fixture.denominationChoices.map((choice) => ({ id: choice.mediaSeatId, identityId: choice.mediaId, role: "primary", kind: "vector-art", assetKey: resolved.media.find(({ seatId }) => seatId === choice.mediaSeatId)!.key, alt: copy[choice.selectedMediaAltKey], aspect: "16:10" })),
    buyBox: {
      price: { base: { currency: fixture.fixedCurrency.code, amountMinor: 0 }, current: { currency: fixture.fixedCurrency.code, amountMinor: first.amountMinor }, derivation: "base-plus-selected-options-times-quantity" },
      optionGroups: [{ id: "denomination", label: copy[fixture.fixedCurrency.labelKey], kind: "chip", selectedId: first.id, options: [
        ...fixture.denominationChoices.map((choice) => ({ id: choice.id, label: copy[choice.labelKey], mediaSeatIds: [choice.mediaSeatId], priceDelta: { currency: fixture.fixedCurrency.code, amountMinor: choice.amountMinor } })),
        { id: "custom", label: copy[fixture.customAmount.labelKey], customAmount: { minMinor: fixture.customAmount.minMinor, maxMinor: fixture.customAmount.maxMinor, inputLabel: copy[fixture.customAmount.inputLabelKey], help: copy[fixture.customAmount.helpKey], rangeError: copy[fixture.customAmount.rangeErrorKey], invalidError: copy[fixture.customAmount.invalidErrorKey] } },
      ] }],
      primaryActionId: "add-to-cart",
      secondaryActionIds: [],
    },
    details: [{ id: "gift-card-details", title: copy[fixture.intro.headingKey], kind: "prose", priority: 1, initiallyOpen: true, body: copy[fixture.intro.bodyKey] }],
    actions: [{ id: "add-to-cart", ownerId: "buy-box", label: copy[fixture.stateKeys.addToCartKey], kind: "add-to-cart", emphasis: "primary" }],
    announcements: { mediaChanged: copy[fixture.stateKeys.announceThumbnailKey], selectionChanged: copy[fixture.stateKeys.announceDenominationKey], actionPending: copy[fixture.stateKeys.cartPendingKey], actionSucceeded: copy[fixture.stateKeys.cartSuccessKey], actionFailed: copy[fixture.stateKeys.cartErrorKey], error: copy[fixture.stateKeys.cartErrorSummaryKey] },
    stress: { short: {}, longLocale: {}, error: {}, pending: {}, success: {}, selectedLast: { gallery: { selectedSeatId: fixture.denominationChoices.at(-1)!.mediaSeatId }, buyBox: { optionGroups: [{ id: "denomination", selectedId: fixture.denominationChoices.at(-1)!.id }] } } } as ProductOverviewFixture["stress"],
  };
  const productMap: ProductOverviewMediaMap = { version: mediaMap.version, generatedAt: "deterministic", records: resolved.media.map((record) => ({ slug: "gift-card-03", seatId: record.seatId, key: record.key, mediaKey: record.key, role: "primary", identityId: record.identityId, kind: "vector-art", assetId: record.identityId, presentation: "original deterministic gift-card art", src: record.src, alt: copy[fixture.denominationChoices.find(({ mediaSeatId }) => mediaSeatId === record.seatId)!.selectedMediaAltKey], aspect: "16:10" })) };
  return { fixture: productFixture, mediaMap: productMap };
}
