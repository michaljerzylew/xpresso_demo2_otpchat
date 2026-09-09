export const ANNOUNCE_SOURCE_KEYS = Array.from({ length: 12 }, (_, index) =>
  `announcement-banner-${String(index + 1).padStart(2, "0")}`,
) as AnnounceSourceKey[];

export const ANNOUNCE_FROZEN_NOW = "2026-08-21T12:00:00.000Z";

export type AnnounceSourceKey = `announcement-banner-${
  | "01" | "02" | "03" | "04" | "05" | "06"
  | "07" | "08" | "09" | "10" | "11" | "12"}`;
export type AnnouncePreset = "promo-art" | "promo-deadline" | "promo-capture" | "ticker" | "notice" | "coupon" | "capture" | "consent-detailed" | "consent-compact" | "upsell";
export type AnnouncePlacement = "top-dock" | "floating-bottom" | "inline";
export type AnnounceStressKey = "short" | "longLocale" | "error";
export type CaptureStatus = "idle" | "invalid" | "submitting" | "success" | "error";
export type CopyStatus = "idle" | "copying" | "copied" | "error";
export type TickerStatus = "running" | "paused-pointer" | "paused-focus" | "paused-touch" | "reduced";
export type ConsentStatus = "unresolved" | "settings-open" | "rejected" | "declined" | "accepted";
export type TrialStatus = "open" | "trial-pending" | "trial-started" | "trial-error";

export type AnnounceAction = {
  id: string;
  kind: "navigate" | "activate" | "submit" | "copy" | "dismiss" | "decline-promo" | "open-settings" | "consent-decision";
  label: string;
  href?: `/demo/${string}`;
  choice?: "accept" | "reject" | "decline";
  effect?: "none" | "dismiss-on-success";
};

export type AnnounceMediaSeat = {
  id: string;
  kind: "illustration" | "object-3d";
  role: "scene-backdrop" | "hanging-accent" | "character-group" | "corner-accent" | "promo-object" | "seasonal-seal";
  assetKey: string;
  alt: string;
  aspect: `${number}/${number}` | "freeform";
  focalPoint?: { x: number; y: number };
  compactCrop: "crop" | "contain" | "code-static";
};

export type DeadlineSpec = {
  instant: string;
  visibleUnits: readonly ["days", "hours", "minutes"] | readonly ["days", "hours", "minutes", "seconds"];
  expiredLabel: string;
};

export type CaptureSpec = {
  field: { id: "email"; label: string; placeholder: string; help: string; required: true; inputMode: "email" };
  submitActionId: string;
  messages: Record<Exclude<CaptureStatus, "idle">, string>;
};

export type AnnounceStress = {
  textPatches: Array<{ targetId: string; field: "badge" | "title" | "body" | "label" | "alt" | "coupon"; value: string }>;
  clock?: "live" | "expired";
  failMediaIds?: string[];
  captureOutcome?: Exclude<CaptureStatus, "idle">;
  copyOutcome?: "copied" | "error";
};

type AnnounceCore = {
  schemaVersion: 1;
  owner: "Announce";
  sourceKey: AnnounceSourceKey;
  preset: AnnouncePreset;
  placement: AnnouncePlacement;
  badge?: string;
  title?: string;
  body?: string;
  actions: AnnounceAction[];
  media: AnnounceMediaSeat[];
  persistenceKey?: `announce:${string}:v${number}`;
  stress: Record<AnnounceStressKey, AnnounceStress>;
};

export type AnnounceFixture = AnnounceCore & {
  primaryActionId?: string;
  secondaryActionId?: string;
  contextualActionId?: string;
  declineActionId?: string;
  dismissActionId?: string;
  settingsActionId?: string;
  rejectActionId?: string;
  acceptActionId?: string;
  policyActionId?: string;
  deadline?: DeadlineSpec;
  capture?: CaptureSpec;
  messages?: readonly [string, string, string, string, string, string, string, string];
  pauseLabel?: string;
  resumeLabel?: string;
  coupon?: { value: string; copyActionId: string; copiedLabel: string; errorLabel: string };
};

type MutableTickerTuple = [string, string, string, string, string, string, string, string];
type StressMutableAnnounceFixture = Omit<AnnounceFixture, "messages"> & { messages?: MutableTickerTuple };

export type AnnounceMediaRecord = {
  slug: AnnounceSourceKey;
  seatId: string;
  assetKey: string;
  kind: AnnounceMediaSeat["kind"];
  role: AnnounceMediaSeat["role"];
  aspect: string;
  status: "resolved-original-vector" | "approved-reuse";
  src?: `/media/${string}`;
  publicBase?: `/media/${string}`;
};

export type ResolvedAnnounceMedia = AnnounceMediaRecord & { seat: AnnounceMediaSeat; src: `/media/${string}` };
export type ResolvedAnnounceFixture = Omit<AnnounceFixture, "stress"> & {
  activeStress?: AnnounceStressKey;
  mediaById: ReadonlyMap<string, ResolvedAnnounceMedia>;
  failedMediaIds: ReadonlySet<string>;
  captureOutcome?: Exclude<CaptureStatus, "idle">;
  copyOutcome?: "copied" | "error";
  clockMode?: "live" | "expired";
  frozenNow: string;
};

type Expected = {
  preset: AnnouncePreset;
  placement: AnnouncePlacement;
  actionKinds: AnnounceAction["kind"][];
  mediaRoles: AnnounceMediaSeat["role"][];
  deadlineUnits?: 3 | 4;
  capture: boolean;
  ticker: boolean;
  dismiss: boolean;
};

const expected = (preset: AnnouncePreset, placement: AnnouncePlacement, actionKinds: AnnounceAction["kind"][], mediaRoles: AnnounceMediaSeat["role"][] = [], additions: Partial<Expected> = {}): Expected => ({
  preset, placement, actionKinds, mediaRoles, capture: false, ticker: false, dismiss: actionKinds.includes("dismiss"), ...additions,
});

const EXPECTED: Record<AnnounceSourceKey, Expected> = {
  "announcement-banner-01": expected("promo-art", "top-dock", ["navigate", "dismiss"], ["scene-backdrop", "hanging-accent", "character-group", "corner-accent"]),
  "announcement-banner-02": expected("promo-deadline", "top-dock", ["navigate", "decline-promo", "dismiss"], [], { deadlineUnits: 3 }),
  "announcement-banner-03": expected("promo-capture", "top-dock", ["submit", "dismiss"], ["promo-object"], { deadlineUnits: 4, capture: true }),
  "announcement-banner-04": expected("promo-deadline", "top-dock", ["navigate", "navigate", "decline-promo", "dismiss"], ["seasonal-seal"], { deadlineUnits: 4 }),
  "announcement-banner-05": expected("ticker", "top-dock", [], [], { ticker: true }),
  "announcement-banner-06": expected("notice", "top-dock", ["navigate", "dismiss"]),
  "announcement-banner-07": expected("coupon", "top-dock", ["copy", "navigate", "navigate", "dismiss"]),
  "announcement-banner-08": expected("capture", "top-dock", ["submit"], [], { capture: true }),
  "announcement-banner-09": expected("consent-detailed", "floating-bottom", ["open-settings", "consent-decision", "consent-decision"]),
  "announcement-banner-10": expected("consent-compact", "floating-bottom", ["navigate", "consent-decision", "consent-decision"]),
  "announcement-banner-11": expected("notice", "floating-bottom", ["navigate"]),
  "announcement-banner-12": expected("upsell", "floating-bottom", ["activate", "navigate"]),
};

function reject(rule: string, message: string): never {
  throw new Error(`[${rule}] ${message}`);
}

function exact(actual: number, wanted: number, source: string, label: string) {
  if (actual !== wanted) reject("source-tuple-parity", `${source} requires exactly ${wanted} ${label}.`);
}

function unique(values: string[], source: string, label: string) {
  if (new Set(values).size !== values.length) reject("source-tuple-parity", `${source} repeats ${label}.`);
}

function actionById(fixture: AnnounceFixture, id: string | undefined, field: string) {
  if (!id) reject("source-tuple-parity", `${fixture.sourceKey} is missing ${field}.`);
  const action = fixture.actions.find((candidate) => candidate.id === id);
  if (!action) reject("source-tuple-parity", `${fixture.sourceKey} ${field} is orphaned.`);
  return action;
}

export function validateAnnounceFixture(fixture: AnnounceFixture) {
  const contract = EXPECTED[fixture.sourceKey];
  if (!contract || fixture.schemaVersion !== 1 || fixture.owner !== "Announce") reject("closed-source-map", `Unknown or invalid Announce source ${fixture.sourceKey}.`);
  if (fixture.preset !== contract.preset || fixture.placement !== contract.placement) reject("closed-source-map", `${fixture.sourceKey} remaps its closed preset or placement.`);
  exact(fixture.actions.length, contract.actionKinds.length, fixture.sourceKey, "actions");
  if (fixture.actions.some((action, index) => action.kind !== contract.actionKinds[index])) reject("source-tuple-parity", `${fixture.sourceKey} has the wrong ordered action tuple.`);
  exact(fixture.media.length, contract.mediaRoles.length, fixture.sourceKey, "media seats");
  if (fixture.media.some((seat, index) => seat.role !== contract.mediaRoles[index])) reject("source-tuple-parity", `${fixture.sourceKey} has the wrong ordered media tuple.`);
  unique([...fixture.actions, ...fixture.media].map(({ id }) => id), fixture.sourceKey, "record IDs");

  for (const action of fixture.actions) {
    if (!action.id || !action.label.trim()) reject("source-tuple-parity", `${fixture.sourceKey} has an incomplete action.`);
    if (action.kind === "navigate" && (!action.href || !/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(action.href))) reject("source-tuple-parity", `${fixture.sourceKey} navigation must use a local /demo route.`);
    if (action.kind !== "navigate" && action.href) reject("source-tuple-parity", `${fixture.sourceKey} non-navigation action cannot own href.`);
  }
  if (contract.dismiss !== Boolean(fixture.dismissActionId) || contract.dismiss !== fixture.actions.some(({ kind }) => kind === "dismiss")) reject("dismiss-contract", `${fixture.sourceKey} violates its dismiss declaration.`);
  if (contract.dismiss && !fixture.persistenceKey) reject("dismiss-contract", `${fixture.sourceKey} dismiss requires persistence.`);
  if (!contract.dismiss && fixture.dismissActionId) reject("dismiss-contract", `${fixture.sourceKey} cannot invent a dismiss action.`);

  if (contract.deadlineUnits) {
    if (!fixture.deadline || !Number.isFinite(Date.parse(fixture.deadline.instant))) reject("source-tuple-parity", `${fixture.sourceKey} requires one valid deadline.`);
    exact(fixture.deadline.visibleUnits.length, contract.deadlineUnits, fixture.sourceKey, "deadline units");
  } else if (fixture.deadline) reject("source-tuple-parity", `${fixture.sourceKey} cannot invent a deadline.`);

  if (contract.capture) {
    if (!fixture.capture || fixture.capture.field.id !== "email" || !fixture.capture.field.label.trim() || !fixture.capture.field.help.trim()) reject("capture-state-contract", `${fixture.sourceKey} requires a labelled email capture.`);
    const submit = actionById(fixture, fixture.capture.submitActionId, "capture.submitActionId");
    if (submit.kind !== "submit" || Object.values(fixture.capture.messages).some((message) => !message.trim())) reject("capture-state-contract", `${fixture.sourceKey} capture state contract is incomplete.`);
  } else if (fixture.capture) reject("source-tuple-parity", `${fixture.sourceKey} cannot invent a capture.`);

  if (contract.ticker) {
    if (!fixture.messages || fixture.messages.length !== 8 || new Set(fixture.messages).size !== 8 || !fixture.pauseLabel || !fixture.resumeLabel) reject("ticker-motion-contract", `${fixture.sourceKey} requires eight unique messages and explicit pause controls.`);
  } else if (fixture.messages) reject("source-tuple-parity", `${fixture.sourceKey} cannot invent ticker records.`);

  if (fixture.preset === "coupon") {
    if (!fixture.coupon || actionById(fixture, fixture.coupon.copyActionId, "coupon.copyActionId").kind !== "copy" || !fixture.coupon.copiedLabel || !fixture.coupon.errorLabel) reject("copy-control-a11y", `${fixture.sourceKey} requires native copy and announced outcomes.`);
  }
  if (fixture.preset === "consent-detailed") {
    const settings = actionById(fixture, fixture.settingsActionId, "settingsActionId");
    const rejectAction = actionById(fixture, fixture.rejectActionId, "rejectActionId");
    const accept = actionById(fixture, fixture.acceptActionId, "acceptActionId");
    if (settings.kind !== "open-settings" || rejectAction.choice !== "reject" || accept.choice !== "accept" || !fixture.persistenceKey) reject("consent-decision-parity", `${fixture.sourceKey} must retain settings, reject and accept.`);
  }
  if (fixture.preset === "consent-compact") {
    const policy = actionById(fixture, fixture.policyActionId, "policyActionId");
    const decline = actionById(fixture, fixture.declineActionId, "declineActionId");
    const accept = actionById(fixture, fixture.acceptActionId, "acceptActionId");
    if (policy.kind !== "navigate" || decline.choice !== "decline" || accept.choice !== "accept" || !fixture.persistenceKey) reject("consent-decision-parity", `${fixture.sourceKey} must retain policy, decline and accept.`);
  }
  if (fixture.preset === "upsell") {
    const trial = actionById(fixture, fixture.secondaryActionId, "secondaryActionId");
    const upgrade = actionById(fixture, fixture.primaryActionId, "primaryActionId");
    if (trial.kind !== "activate" || trial.effect !== "dismiss-on-success" || upgrade.kind !== "navigate") reject("source-tuple-parity", `${fixture.sourceKey} must close only after successful trial activation.`);
  }

  for (const key of ["primaryActionId", "contextualActionId", "declineActionId", "dismissActionId", "settingsActionId", "rejectActionId", "acceptActionId", "policyActionId", "secondaryActionId"] as const) {
    if (fixture[key]) actionById(fixture, fixture[key], key);
  }
  if (/(?:shadcn|vendor|source phrase|href=\"#\")/i.test(JSON.stringify(fixture))) reject("B-C1", `${fixture.sourceKey} contains forbidden source-facing copy.`);
  for (const seat of fixture.media) if (!seat.assetKey || !seat.alt || !seat.compactCrop) reject("media-provenance", `${fixture.sourceKey} has an incomplete media seat.`);
}

function applyStress(fixture: AnnounceFixture, stress?: AnnounceStressKey) {
  const resolved = structuredClone(fixture) as StressMutableAnnounceFixture;
  if (!stress) return { resolved, patch: undefined };
  const patch = fixture.stress[stress];
  for (const change of patch.textPatches) {
    if (change.targetId === "fixture-root") {
      if (!(change.field in resolved)) reject("source-tuple-parity", `${fixture.sourceKey} stress references unknown root field ${change.field}.`);
      (resolved as unknown as Record<string, unknown>)[change.field] = change.value;
      continue;
    }
    if (change.targetId.startsWith("ab05-message-") && resolved.messages && change.field === "label") {
      const index = Number(change.targetId.at(-1)) - 1;
      if (index < 0 || index >= resolved.messages.length) reject("source-tuple-parity", `${fixture.sourceKey} stress references unknown ticker record.`);
      resolved.messages[index] = change.value;
      continue;
    }
    const target = [...resolved.actions, ...resolved.media].find(({ id }) => id === change.targetId) as unknown as Record<string, unknown> | undefined;
    if (!target || !(change.field in target)) reject("source-tuple-parity", `${fixture.sourceKey} stress references unknown ${change.targetId}.${change.field}.`);
    target[change.field] = change.value;
  }
  return { resolved, patch };
}

function normalizedAspect(value: string) {
  return value.replace(":", "/");
}

export function resolveAnnounceFixture(fixture: AnnounceFixture, records: AnnounceMediaRecord[], stress?: AnnounceStressKey, frozenNow = ANNOUNCE_FROZEN_NOW): ResolvedAnnounceFixture {
  validateAnnounceFixture(fixture);
  const { resolved, patch } = applyStress(fixture, stress);
  validateAnnounceFixture(resolved);
  if (!Number.isFinite(Date.parse(frozenNow))) reject("source-tuple-parity", `${fixture.sourceKey} received an invalid frozen clock.`);
  const mediaById = new Map<string, ResolvedAnnounceMedia>();
  for (const seat of resolved.media) {
    const candidates = records.filter((record) => record.slug === resolved.sourceKey && record.seatId === seat.id);
    if (candidates.length !== 1) reject("media-provenance", `${resolved.sourceKey} cannot resolve exact media ${seat.id}.`);
    const record = candidates[0];
    if (record.assetKey !== seat.assetKey || record.kind !== seat.kind || record.role !== seat.role || (seat.aspect !== "freeform" && normalizedAspect(record.aspect) !== normalizedAspect(seat.aspect))) reject("media-provenance", `${resolved.sourceKey} media contract drift for ${seat.id}.`);
    const src = record.src ?? (record.publicBase ? `${record.publicBase}-640.webp` : undefined);
    if (!src?.startsWith("/media/") || /^https?:/i.test(src)) reject("media-provenance", `${resolved.sourceKey} media ${seat.id} requires approved local provenance.`);
    mediaById.set(seat.id, { ...record, seat, src: src as `/media/${string}` });
  }
  const failedMediaIds = new Set(patch?.failMediaIds ?? []);
  for (const id of failedMediaIds) if (!mediaById.has(id)) reject("media-provenance", `${resolved.sourceKey} stress fails unknown media ${id}.`);
  return {
    ...resolved,
    activeStress: stress,
    mediaById,
    failedMediaIds,
    captureOutcome: patch?.captureOutcome,
    copyOutcome: patch?.copyOutcome,
    clockMode: patch?.clock,
    frozenNow,
  };
}

export type AnnounceImplementationProbe = {
  ownerCount: number;
  hiddenTwins: boolean;
  usesViewport: boolean;
  coarseTargetPx: number;
  tickerSemanticRecords: number;
  tickerPauseModes: readonly string[];
};

export function validateAnnounceImplementationProbe(probe: AnnounceImplementationProbe) {
  if (probe.ownerCount !== 1 || probe.hiddenTwins) reject("owner-cardinality", "Announce requires one owner and no hidden twins.");
  if (probe.usesViewport) reject("two-axis-overflow", "Announce cannot read viewport geometry.");
  if (probe.coarseTargetPx < 44) reject("B-MOB", "Announce coarse targets must be at least 44px.");
  if (probe.tickerSemanticRecords !== 8 || !["pointer", "focus", "touch", "reduced"].every((mode) => probe.tickerPauseModes.includes(mode))) reject("ticker-motion-contract", "Ticker requires eight records and complete pause semantics.");
}
