import type { DeviceClass, OverlayPresentation } from "@xp/primitives";

export const OFFER_SOURCE_KEYS = ["offer-modal-01", "offer-modal-02", "offer-modal-03", "offer-modal-04", "offer-modal-05"] as const;
export type OfferSourceKey = (typeof OFFER_SOURCE_KEYS)[number];
export type OfferStress = "base" | "short" | "longLocale";
export type OfferPreset = "capture-side" | "coupon-band" | "capture-background" | "chance-wheel" | "deadline-coupon";
export type OfferActionKind = "open" | "dismiss" | "submit-capture" | "copy-code" | "spin" | "remind-later";
export type OfferMediaStatus = "ready" | "hold";

export type OfferActionFixture = {
  id: string;
  kind: OfferActionKind;
  labelKey: string;
  pendingLabelKey?: string;
  successLabelKey?: string;
  errorLabelKey?: string;
};

export type OfferRasterFixture = {
  seatId: "OM-R01" | "OM-R02" | "OM-R03" | "OM-R04";
  kind: "raster";
  status: "HOLD-INFRA" | "approved-reuse";
  assetKey: string | null;
  decorative: boolean;
  alt?: string;
  altKey?: string | null;
  presentations: Record<DeviceClass, "band" | "side" | "background">;
  cropIds: Record<DeviceClass, string>;
  fallbackTone: string;
};

export type OfferEmailFixture = {
  id: string;
  labelKey: string;
  placeholderKey: string;
  required: true;
  type: "email";
  inputMode: "email";
  autocomplete: "email";
  enterKeyHint: "send" | "done";
  invalidErrorKey: string;
};

export type WheelOutcomeFixture = { id: string; kind: "discount-percent"; value: number } | { id: string; kind: "shipping-pass" | "no-award" };
export type WheelSectorFixture = { id: string; labelKey: string; outcomeId: string; tone: "cobalt" | "clay" | "moss" | "stone" | "amber" | "iris" | "coral" };

type OfferBaseFixture = {
  schemaVersion: 1;
  packet: "offer-modal-contract-v1";
  sourceKey: OfferSourceKey;
  owner: "OfferSurface";
  preset: OfferPreset;
  headingKey: string;
  bodyKeys: string[];
  openActionId: string;
  dismissActionId: string;
  actions: OfferActionFixture[];
  copy: Record<OfferStress, Record<string, string>>;
};

export type CaptureOfferFixture = OfferBaseFixture & {
  preset: "capture-side" | "capture-background";
  submitActionId: string;
  email: OfferEmailFixture;
  suppression: { id: string; labelKey: string; initiallyChecked: false; persistenceErrorKey: string };
  privacyKey?: string;
  media: OfferRasterFixture;
};

export type CouponOfferFixture = OfferBaseFixture & {
  preset: "coupon-band";
  coupon: { value: string; instructionKey: string; copyActionId: string; selectable: true };
  media: OfferRasterFixture;
};

export type WheelOfferFixture = OfferBaseFixture & {
  preset: "chance-wheel";
  spinActionId: string;
  remindActionId: string;
  email: OfferEmailFixture;
  wheel: {
    runtimeSeatId: "OM-U01";
    hubVectorId: "OM-V01";
    possibleOutcomesLabelKey: string;
    resultAnnouncementKeys: { win: string; noWin: string };
    outcomes: [WheelOutcomeFixture, WheelOutcomeFixture, WheelOutcomeFixture, WheelOutcomeFixture];
    sectors: [WheelSectorFixture, WheelSectorFixture, WheelSectorFixture, WheelSectorFixture, WheelSectorFixture, WheelSectorFixture, WheelSectorFixture];
  };
  media: [
    { seatId: "OM-U01"; kind: "runtime-ui"; status: "A3-required"; owner: "IntrinsicWheel"; rasterized: false },
    { seatId: "OM-V01"; kind: "vector"; status: "A3-required"; assetKey: "offer-wheel-compass-hub"; paint: "currentColor"; rasterized: false },
  ];
};

export type DeadlineOfferFixture = OfferBaseFixture & {
  preset: "deadline-coupon";
  deadlineIso: string;
  unitLabelKeys: [string, string, string, string];
  expiredHeadingKey: string;
  coupon: { value: string; instructionKey: string; copyActionId: string; selectable: true; validAfterExpiry: false };
  remindActionId: string;
  reminderValidAfterExpiry: false;
  media: OfferRasterFixture;
};

export type OfferSurfaceFixture = CaptureOfferFixture | CouponOfferFixture | WheelOfferFixture | DeadlineOfferFixture;

type MediaDelivery = { width: number; height: number; publicPath: string; bytes: number; sha256: string; budgetStatus: string };
type OfferRasterMapRecord = {
  slug: OfferSourceKey;
  seatId: string;
  status: "HOLD-INFRA" | "approved-reuse";
  assetId: string | null;
  fallbackTone: string;
  crops?: Record<DeviceClass, { cropId: string; aspectRatio: string; objectPosition: string }>;
  delivery?: { avif: MediaDelivery[]; webp: MediaDelivery[]; jpg: MediaDelivery[] };
};
export type OfferMediaMap = {
  schemaVersion: "1.0";
  packet: "offer-modal-contract-v1";
  counts: { visualSeats: number; rasterSeats: number; resolvedRasterSeats: number; heldRasterSeats: number; runtimeUiSeats: number; vectorIdentitySeats: number };
  rasterSeats: OfferRasterMapRecord[];
  runtimeUiSeats: Array<{ slug: OfferSourceKey; seatId: "OM-U01"; semanticRecords: number; outcomeIds: string[] }>;
  vectorIdentitySeats: Array<{ slug: OfferSourceKey; seatId: "OM-V01"; assetId: string; paint: "currentColor"; externalReferences: number }>;
  slugDisposition: Record<OfferSourceKey, { copy: "PASS"; media: string; blockingSeats: string[] }>;
};

export type ResolvedOfferAction = {
  id: string;
  kind: OfferActionKind;
  label: string;
  pendingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
};
export type ResolvedOfferRaster = {
  seatId: string;
  status: OfferMediaStatus;
  assetId?: string;
  alt: string;
  decorative: boolean;
  presentations: Record<DeviceClass, "band" | "side" | "background">;
  cropIds: Record<DeviceClass, string>;
  fallbackTone: string;
  sources?: { avif: string; webp: string; jpg: string };
};
export type ResolvedWheelSector = { id: string; label: string; outcomeId: string; tone: WheelSectorFixture["tone"] };
export type ResolvedWheelOutcome = WheelOutcomeFixture & { label: string };

type ResolvedOfferBase = {
  sourceKey: OfferSourceKey;
  preset: OfferPreset;
  activeStress: OfferStress;
  heading: string;
  body: string[];
  actions: ResolvedOfferAction[];
  openAction: ResolvedOfferAction;
  dismissAction: ResolvedOfferAction;
  overlayPresentation: Record<DeviceClass, OverlayPresentation>;
  adapterRoute: string;
  mediaStatus: OfferMediaStatus;
  terminalCandidate: boolean;
  controlCount: number;
  visualSeatCount: number;
};

export type ResolvedCaptureOffer = ResolvedOfferBase & {
  preset: "capture-side" | "capture-background";
  submitAction: ResolvedOfferAction;
  email: OfferEmailFixture & { label: string; placeholder: string; invalidError: string };
  suppression: { id: string; label: string; initiallyChecked: false; persistenceError: string };
  privacy?: string;
  media: ResolvedOfferRaster;
};
export type ResolvedCouponOffer = ResolvedOfferBase & {
  preset: "coupon-band";
  coupon: { value: string; instruction: string; copyAction: ResolvedOfferAction };
  media: ResolvedOfferRaster;
};
export type ResolvedWheelOffer = ResolvedOfferBase & {
  preset: "chance-wheel";
  spinAction: ResolvedOfferAction;
  remindAction: ResolvedOfferAction;
  email: OfferEmailFixture & { label: string; placeholder: string; invalidError: string };
  wheel: {
    possibleOutcomesLabel: string;
    resultAnnouncements: { win: string; noWin: string };
    outcomes: [ResolvedWheelOutcome, ResolvedWheelOutcome, ResolvedWheelOutcome, ResolvedWheelOutcome];
    sectors: [ResolvedWheelSector, ResolvedWheelSector, ResolvedWheelSector, ResolvedWheelSector, ResolvedWheelSector, ResolvedWheelSector, ResolvedWheelSector];
  };
};
export type ResolvedDeadlineOffer = ResolvedOfferBase & {
  preset: "deadline-coupon";
  deadlineMs: number;
  units: [string, string, string, string];
  expiredHeading: string;
  coupon: { value: string; instruction: string; copyAction: ResolvedOfferAction; validAfterExpiry: false };
  remindAction: ResolvedOfferAction;
  reminderValidAfterExpiry: false;
  media: ResolvedOfferRaster;
};
export type ResolvedOfferSurface = ResolvedCaptureOffer | ResolvedCouponOffer | ResolvedWheelOffer | ResolvedDeadlineOffer;

const EXPECTED: Record<OfferSourceKey, { preset: OfferPreset; actions: OfferActionKind[]; controls: number; seats: number; status: OfferMediaStatus }> = {
  "offer-modal-01": { preset: "capture-side", actions: ["open", "dismiss", "submit-capture"], controls: 2, seats: 1, status: "ready" },
  "offer-modal-02": { preset: "coupon-band", actions: ["open", "dismiss", "copy-code"], controls: 0, seats: 1, status: "ready" },
  "offer-modal-03": { preset: "capture-background", actions: ["open", "dismiss", "submit-capture"], controls: 2, seats: 1, status: "ready" },
  "offer-modal-04": { preset: "chance-wheel", actions: ["open", "dismiss", "spin", "remind-later"], controls: 1, seats: 2, status: "ready" },
  "offer-modal-05": { preset: "deadline-coupon", actions: ["open", "dismiss", "copy-code", "remind-later"], controls: 0, seats: 1, status: "ready" },
};

const OVERLAY_PRESENTATION: Record<DeviceClass, OverlayPresentation> = { M: "bottom-sheet", TP: "sheet", TL: "dialog", DS: "dialog", DW: "dialog" };
const required = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
  return value;
};
const valueFor = (copy: Record<string, string>, key: unknown, label: string, source: string) => required(copy[required(key, `${label} key`, source)], label, source);
const publicMedia = (path: string, source: OfferSourceKey) => {
  if (!path.startsWith("apps/preview/public/media/") || /https?:|shadcn|ss-assets|vendor/i.test(path)) throw new Error(`${source} media route is unsafe.`);
  return `/media/${path.slice("apps/preview/public/media/".length)}`;
};

function resolveActions(fixture: OfferSurfaceFixture, copy: Record<string, string>) {
  if (new Set(fixture.actions.map(({ id }) => id)).size !== fixture.actions.length) throw new Error(`${fixture.sourceKey} action IDs must be unique.`);
  return fixture.actions.map((action) => ({
    id: required(action.id, "action id", fixture.sourceKey),
    kind: action.kind,
    label: valueFor(copy, action.labelKey, `${action.id} label`, fixture.sourceKey),
    pendingLabel: action.pendingLabelKey ? valueFor(copy, action.pendingLabelKey, `${action.id} pending`, fixture.sourceKey) : undefined,
    successLabel: action.successLabelKey ? valueFor(copy, action.successLabelKey, `${action.id} success`, fixture.sourceKey) : undefined,
    errorLabel: action.errorLabelKey ? valueFor(copy, action.errorLabelKey, `${action.id} error`, fixture.sourceKey) : undefined,
  }));
}

function resolveRaster(fixture: CaptureOfferFixture | CouponOfferFixture | DeadlineOfferFixture, mediaMap: OfferMediaMap): ResolvedOfferRaster {
  const source = fixture.sourceKey;
  const seat = fixture.media;
  const record = mediaMap.rasterSeats.find((candidate) => candidate.slug === source && candidate.seatId === seat.seatId);
  if (!record || record.status !== seat.status || record.assetId !== seat.assetKey || record.fallbackTone !== seat.fallbackTone) throw new Error(`${source}/${seat.seatId} media evidence drifted.`);
  for (const deviceClass of ["M", "TP", "TL", "DS", "DW"] as DeviceClass[]) {
    if (seat.presentations[deviceClass] === ("hidden" as never)) throw new Error(`${source} cannot hide mandatory media.`);
    if (record.crops && record.crops[deviceClass]?.cropId !== seat.cropIds[deviceClass]) throw new Error(`${source} crop ${deviceClass} drifted.`);
  }
  if (seat.status === "HOLD-INFRA") {
    if (seat.assetKey || record.delivery) throw new Error(`${source} held media cannot carry a substitute.`);
    return { seatId: seat.seatId, status: "hold", alt: "Required offer media is not yet available.", decorative: seat.decorative, presentations: seat.presentations, cropIds: seat.cropIds, fallbackTone: seat.fallbackTone };
  }
  if (!record.delivery || !seat.assetKey || !seat.alt) throw new Error(`${source} approved raster delivery is incomplete.`);
  const pick = (format: keyof NonNullable<OfferRasterMapRecord["delivery"]>) => {
    const delivery = record.delivery![format].find(({ width }) => width === 1280);
    if (!delivery || (format !== "jpg" && delivery.budgetStatus !== "pass")) throw new Error(`${source} ${format} delivery failed budget evidence.`);
    return publicMedia(delivery.publicPath, source);
  };
  return { seatId: seat.seatId, status: "ready", assetId: seat.assetKey, alt: seat.alt, decorative: seat.decorative, presentations: seat.presentations, cropIds: seat.cropIds, fallbackTone: seat.fallbackTone, sources: { avif: pick("avif"), webp: pick("webp"), jpg: pick("jpg") } };
}

function resolveEmail(email: OfferEmailFixture, copy: Record<string, string>, source: OfferSourceKey) {
  if (email.required !== true || email.type !== "email" || email.inputMode !== "email" || email.autocomplete !== "email") throw new Error(`${source} native email contract drifted.`);
  return { ...email, label: valueFor(copy, email.labelKey, "email label", source), placeholder: valueFor(copy, email.placeholderKey, "email placeholder", source), invalidError: valueFor(copy, email.invalidErrorKey, "email invalid", source) };
}

export function offerAdapterRoute(sourceKey: OfferSourceKey) {
  return `/demo/${sourceKey}/offer`;
}

export type OfferDeadlineProjection = { expired: boolean; values: [number, number, number, number] };
export function projectOfferDeadline(deadlineMs: number, now: number): OfferDeadlineProjection {
  const remaining = Math.max(0, deadlineMs - now);
  const totalSeconds = Math.floor(remaining / 1000);
  return { expired: remaining === 0, values: [Math.floor(totalSeconds / 86400), Math.floor((totalSeconds % 86400) / 3600), Math.floor((totalSeconds % 3600) / 60), totalSeconds % 60] };
}

export function resolveOfferSurface(fixture: OfferSurfaceFixture, mediaMap: OfferMediaMap, stress: OfferStress = "base"): ResolvedOfferSurface {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.schemaVersion !== 1 || fixture.packet !== "offer-modal-contract-v1" || fixture.owner !== "OfferSurface") throw new Error(`${fixture.sourceKey} owner contract drifted.`);
  const copy = fixture.copy[stress];
  if (!copy || new Set(Object.values(fixture.copy).map((branch) => Object.keys(branch).sort().join("|"))).size !== 1) throw new Error(`${fixture.sourceKey} copy stress drifted.`);
  if (fixture.preset !== expected.preset || fixture.actions.map(({ kind }) => kind).join("|") !== expected.actions.join("|")) throw new Error(`${fixture.sourceKey} closed preset/action vector drifted.`);
  const actions = resolveActions(fixture, copy);
  const action = (id: string, kind: OfferActionKind) => {
    const resolved = actions.find((candidate) => candidate.id === id && candidate.kind === kind);
    if (!resolved) throw new Error(`${fixture.sourceKey} action reference ${id}/${kind} is missing.`);
    return resolved;
  };
  const base: ResolvedOfferBase = {
    sourceKey: fixture.sourceKey,
    preset: fixture.preset,
    activeStress: stress,
    heading: valueFor(copy, fixture.headingKey, "heading", fixture.sourceKey),
    body: fixture.bodyKeys.map((key, index) => valueFor(copy, key, `body ${index + 1}`, fixture.sourceKey)),
    actions,
    openAction: action(fixture.openActionId, "open"),
    dismissAction: action(fixture.dismissActionId, "dismiss"),
    overlayPresentation: OVERLAY_PRESENTATION,
    adapterRoute: offerAdapterRoute(fixture.sourceKey),
    mediaStatus: expected.status,
    terminalCandidate: expected.status === "ready",
    controlCount: expected.controls,
    visualSeatCount: expected.seats,
  };
  if (fixture.preset === "capture-side" || fixture.preset === "capture-background") {
    const suppression = fixture.suppression;
    if (suppression.initiallyChecked !== false) throw new Error(`${fixture.sourceKey} suppression must start unchecked.`);
    return { ...base, preset: fixture.preset, submitAction: action(fixture.submitActionId, "submit-capture"), email: resolveEmail(fixture.email, copy, fixture.sourceKey), suppression: { id: suppression.id, label: valueFor(copy, suppression.labelKey, "suppression label", fixture.sourceKey), initiallyChecked: false, persistenceError: valueFor(copy, suppression.persistenceErrorKey, "suppression error", fixture.sourceKey) }, privacy: fixture.privacyKey ? valueFor(copy, fixture.privacyKey, "privacy", fixture.sourceKey) : undefined, media: resolveRaster(fixture, mediaMap) };
  }
  if (fixture.preset === "coupon-band") {
    if (!/^[A-Z0-9]{4,24}$/.test(fixture.coupon.value) || fixture.coupon.selectable !== true) throw new Error(`${fixture.sourceKey} coupon output drifted.`);
    return { ...base, preset: fixture.preset, coupon: { value: fixture.coupon.value, instruction: valueFor(copy, fixture.coupon.instructionKey, "coupon instruction", fixture.sourceKey), copyAction: action(fixture.coupon.copyActionId, "copy-code") }, media: resolveRaster(fixture, mediaMap) };
  }
  if (fixture.preset === "chance-wheel") {
    const runtime = mediaMap.runtimeUiSeats.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === fixture.wheel.runtimeSeatId);
    const vector = mediaMap.vectorIdentitySeats.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === fixture.wheel.hubVectorId);
    if (!runtime || runtime.semanticRecords !== 7 || runtime.outcomeIds.length !== 4 || !vector || vector.assetId !== "offer-wheel-compass-hub" || vector.paint !== "currentColor" || vector.externalReferences !== 0) throw new Error(`${fixture.sourceKey} code-owned seats drifted.`);
    if (fixture.wheel.sectors.length !== 7 || fixture.wheel.outcomes.length !== 4 || new Set(fixture.wheel.sectors.map(({ id }) => id)).size !== 7 || new Set(fixture.wheel.outcomes.map(({ id }) => id)).size !== 4) throw new Error(`${fixture.sourceKey} wheel cardinality drifted.`);
    const outcomes = fixture.wheel.outcomes.map((outcome) => {
      const sector = fixture.wheel.sectors.find((candidate) => candidate.outcomeId === outcome.id);
      if (!sector) throw new Error(`${fixture.sourceKey} outcome ${outcome.id} has no sector.`);
      return { ...outcome, label: valueFor(copy, sector.labelKey, `${outcome.id} outcome label`, fixture.sourceKey) };
    }) as ResolvedWheelOffer["wheel"]["outcomes"];
    const outcomeIds = new Set(outcomes.map(({ id }) => id));
    const sectors = fixture.wheel.sectors.map((sector) => {
      if (!outcomeIds.has(sector.outcomeId)) throw new Error(`${fixture.sourceKey} sector ${sector.id} references an unknown outcome.`);
      return { id: sector.id, label: valueFor(copy, sector.labelKey, `${sector.id} label`, fixture.sourceKey), outcomeId: sector.outcomeId, tone: sector.tone };
    }) as ResolvedWheelOffer["wheel"]["sectors"];
    return {
      ...base,
      preset: fixture.preset,
      email: resolveEmail(fixture.email, copy, fixture.sourceKey),
      spinAction: action(fixture.spinActionId, "spin"),
      remindAction: action(fixture.remindActionId, "remind-later"),
      wheel: {
        possibleOutcomesLabel: valueFor(copy, fixture.wheel.possibleOutcomesLabelKey, "possible outcomes", fixture.sourceKey),
        resultAnnouncements: {
          win: valueFor(copy, fixture.wheel.resultAnnouncementKeys.win, "win announcement", fixture.sourceKey),
          noWin: valueFor(copy, fixture.wheel.resultAnnouncementKeys.noWin, "no-win announcement", fixture.sourceKey),
        },
        outcomes,
        sectors,
      },
    };
  }
  const deadlineFixture = fixture as DeadlineOfferFixture;
  const deadlineMs = Date.parse(deadlineFixture.deadlineIso);
  if (!Number.isFinite(deadlineMs) || deadlineFixture.unitLabelKeys.join("|") !== "unit_days|unit_hours|unit_minutes|unit_seconds" || deadlineFixture.coupon.validAfterExpiry !== false || deadlineFixture.reminderValidAfterExpiry !== false) throw new Error(`${deadlineFixture.sourceKey} deadline contract drifted.`);
  if (!/^[A-Z0-9]{4,24}$/.test(deadlineFixture.coupon.value) || deadlineFixture.coupon.selectable !== true) throw new Error(`${deadlineFixture.sourceKey} coupon output drifted.`);
  return { ...base, preset: deadlineFixture.preset, deadlineMs, units: deadlineFixture.unitLabelKeys.map((key, index) => valueFor(copy, key, `countdown unit ${index + 1}`, deadlineFixture.sourceKey)) as [string, string, string, string], expiredHeading: valueFor(copy, deadlineFixture.expiredHeadingKey, "expired heading", deadlineFixture.sourceKey), coupon: { value: deadlineFixture.coupon.value, instruction: valueFor(copy, deadlineFixture.coupon.instructionKey, "coupon instruction", deadlineFixture.sourceKey), copyAction: action(deadlineFixture.coupon.copyActionId, "copy-code"), validAfterExpiry: false }, remindAction: action(deadlineFixture.remindActionId, "remind-later"), reminderValidAfterExpiry: false, media: resolveRaster(deadlineFixture, mediaMap) };
}
