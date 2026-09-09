export const VOICE_SOURCE_KEYS = Array.from({ length: 24 }, (_, index) =>
  `testimonials-component-${String(index + 1).padStart(2, "0")}`,
) as VoiceSourceKey[];

export const VOICE_PRESETS = [
  "split-quote-rail", "review-wall", "spotlight-streams", "classic-quote-rail",
  "avatar-detail-selector", "dual-row-stream", "breakout-avatar-rail", "logo-bubble-stream",
  "video-proof-reel", "photo-split-rail", "constellation-rail", "results-proof-bento",
  "brand-proof-deck", "photo-rating-rail", "editorial-photo-rail", "portrait-proof-selector",
  "media-proof-spotlight", "editorial-split-rail", "pastel-card-rail", "sticky-dual-stream",
  "support-proof-stream", "metrics-review-stack", "logo-proof-tabs", "social-proof-wall",
] as const;

export type VoiceSourceKey = `testimonials-component-${string}`;
export type VoicePreset = (typeof VOICE_PRESETS)[number];
export type VoiceComposition = "rail" | "wall" | "marquee" | "spotlight" | "selector" | "video" | "bento" | "social-wall";
export type VoiceStressKey = "short" | "longLocale" | "error" | "selectedLast" | "paused";
export type VoiceDeviceForm = "M" | "TP" | "TL" | "DS" | "DW";
export type VoiceMediaKind = "avatar" | "photo" | "video-poster";
export type VoiceControlKind = "previous" | "next" | "pause" | "play" | "retry" | "transcript" | "expand" | "collapse" | "position";

export type VoiceIntro = { eyebrow?: string; heading: string; description?: string; actionIds: string[] };
export type VoiceIdentity = { name: string; role?: string; organization?: string; handle?: string };
export type VoiceMetric = { id?: string; value: string; label: string };
export type VoiceRating = { value: number; maximum: 5 };
export type VoiceRecord = {
  id: string;
  quote: string;
  title?: string;
  identity?: VoiceIdentity;
  rating?: VoiceRating;
  metric?: Omit<VoiceMetric, "id">;
  mediaId?: string;
  identityMarkId?: string;
  dateLabel?: string;
  emphasis?: Array<{ start: number; end: number }>;
};
export type VoiceSubject = { id: string; identity: VoiceIdentity; mediaId: string };
export type VoiceSpotlight = { id: string; statement: string; identityMarkId?: string };
export type VoiceMediaSeat = {
  id: string;
  kind: VoiceMediaKind;
  assetKey: string;
  alt: string;
  aspect: "1:1" | "4:5" | "3:4" | "9:16" | "16:9";
  focalPoint?: { x: number; y: number };
};
export type VoiceIdentityMark = { id: string; name: string; lightId: string; darkId?: string };
export type VoiceAction = {
  id: string;
  label: string;
  href: string;
  ownerId: "intro";
  kind: "navigate";
  emphasis: "primary" | "secondary";
  external?: boolean;
};
export type VoiceControl = { id: string; kind: VoiceControlKind; label: string };
export type VoiceState = { activeId: string; expandedIds: string[]; paused: boolean; playingVideoId: string | null };
export type VoiceAnnouncements = { error: string; mediaError: string; paused: string; resumed: string; selectionChanged: string };

export type VoicesFixtureCore = {
  schemaVersion: 1;
  sourceKey: VoiceSourceKey;
  owner: "Voices";
  preset: VoicePreset;
  composition: VoiceComposition;
  intro: VoiceIntro;
  records: VoiceRecord[];
  subjects: VoiceSubject[];
  spotlights: VoiceSpotlight[];
  aggregateMetrics: Array<Required<VoiceMetric>>;
  media: VoiceMediaSeat[];
  identityMarks: VoiceIdentityMark[];
  decorativeAvatarIds: string[];
  actions: VoiceAction[];
  controls: VoiceControl[];
  behavior: {
    initialId: string;
    ambientOnFinePointer: boolean;
    compactAccess: "snap-rail" | "selector" | "action-sheet" | "bounded-wall";
  };
  state: VoiceState;
  announcements: VoiceAnnouncements;
};
export type VoicesFixture = VoicesFixtureCore & { stress: Record<VoiceStressKey, Record<string, unknown>> };

export type VoiceRasterMediaRecord = {
  slug: VoiceSourceKey;
  seatId: string;
  assetKey: string;
  role: VoiceMediaKind;
  aspect: VoiceMediaSeat["aspect"];
  alt: string;
  assetId: string;
  kind: "avatar" | "responsive-image";
  publicBase: string;
  avatarBase?: string;
  provenanceSha256: string;
};
export type VoiceMarkMediaRecord = {
  slug: VoiceSourceKey;
  seatId: string;
  name: string;
  identityId: string;
  lightPath: string;
  darkPath: string;
  lightSha256: string;
  darkSha256: string;
};
export type VoicesMediaMap = {
  schemaVersion: 1;
  media: VoiceRasterMediaRecord[];
  marks: VoiceMarkMediaRecord[];
};
export type ResolvedVoicesFixture = VoicesFixtureCore & {
  activeStress?: VoiceStressKey;
  mediaBySeatId: ReadonlyMap<string, VoiceRasterMediaRecord>;
  marksBySeatId: ReadonlyMap<string, VoiceMarkMediaRecord>;
};

type Expected = {
  preset: VoicePreset;
  composition: VoiceComposition;
  records: number;
  spotlights: number;
  subjects: number;
  media: readonly [number, number, number];
  marks: number;
  metrics: number;
  actions: number;
  controls: readonly VoiceControlKind[];
  decorative?: number;
  recordMetrics?: number;
};

const EXPECTED: Record<VoiceSourceKey, Expected> = {
  "testimonials-component-01": { preset:"split-quote-rail",composition:"rail",records:4,spotlights:0,subjects:0,media:[4,0,0],marks:0,metrics:0,actions:0,controls:["previous","next","position"] },
  "testimonials-component-02": { preset:"review-wall",composition:"wall",records:9,spotlights:0,subjects:0,media:[9,0,0],marks:9,metrics:0,actions:1,controls:[] },
  "testimonials-component-03": { preset:"spotlight-streams",composition:"marquee",records:12,spotlights:3,subjects:0,media:[12,0,0],marks:15,metrics:0,actions:0,controls:["previous","next","pause","position"] },
  "testimonials-component-04": { preset:"classic-quote-rail",composition:"rail",records:5,spotlights:0,subjects:0,media:[5,0,0],marks:0,metrics:0,actions:0,controls:["previous","next","position"] },
  "testimonials-component-05": { preset:"avatar-detail-selector",composition:"selector",records:7,spotlights:0,subjects:0,media:[7,0,0],marks:0,metrics:0,actions:0,controls:["previous","next","position"] },
  "testimonials-component-06": { preset:"dual-row-stream",composition:"marquee",records:8,spotlights:0,subjects:0,media:[8,0,0],marks:0,metrics:0,actions:0,controls:["pause","position"] },
  "testimonials-component-07": { preset:"breakout-avatar-rail",composition:"rail",records:7,spotlights:0,subjects:0,media:[7,0,0],marks:0,metrics:0,actions:0,controls:["previous","next","position"] },
  "testimonials-component-08": { preset:"logo-bubble-stream",composition:"marquee",records:4,spotlights:0,subjects:0,media:[4,0,0],marks:4,metrics:0,actions:0,controls:["pause","position"] },
  "testimonials-component-09": { preset:"video-proof-reel",composition:"video",records:3,spotlights:0,subjects:0,media:[0,0,3],marks:0,metrics:0,actions:0,controls:["play","pause","retry","transcript","position"] },
  "testimonials-component-10": { preset:"photo-split-rail",composition:"rail",records:3,spotlights:0,subjects:0,media:[0,3,0],marks:0,metrics:0,actions:1,controls:["previous","next","position"] },
  "testimonials-component-11": { preset:"constellation-rail",composition:"rail",records:5,spotlights:0,subjects:0,media:[14,0,0],marks:0,metrics:0,actions:1,controls:["previous","next","pause","position"],decorative:9 },
  "testimonials-component-12": { preset:"results-proof-bento",composition:"bento",records:4,spotlights:0,subjects:0,media:[4,0,0],marks:2,metrics:0,actions:1,controls:[],recordMetrics:2 },
  "testimonials-component-13": { preset:"brand-proof-deck",composition:"selector",records:4,spotlights:0,subjects:0,media:[4,0,0],marks:3,metrics:0,actions:1,controls:["pause","expand","collapse","position"] },
  "testimonials-component-14": { preset:"photo-rating-rail",composition:"rail",records:4,spotlights:0,subjects:0,media:[0,4,0],marks:0,metrics:0,actions:1,controls:["previous","next","position"] },
  "testimonials-component-15": { preset:"editorial-photo-rail",composition:"rail",records:4,spotlights:0,subjects:0,media:[0,4,0],marks:0,metrics:0,actions:1,controls:["previous","next","position"] },
  "testimonials-component-16": { preset:"portrait-proof-selector",composition:"selector",records:0,spotlights:1,subjects:5,media:[0,5,0],marks:0,metrics:1,actions:0,controls:["previous","next","pause","position"] },
  "testimonials-component-17": { preset:"media-proof-spotlight",composition:"spotlight",records:1,spotlights:0,subjects:0,media:[0,1,0],marks:0,metrics:2,actions:0,controls:[] },
  "testimonials-component-18": { preset:"editorial-split-rail",composition:"rail",records:4,spotlights:0,subjects:0,media:[4,0,0],marks:0,metrics:0,actions:0,controls:["previous","next","position"] },
  "testimonials-component-19": { preset:"pastel-card-rail",composition:"rail",records:6,spotlights:0,subjects:0,media:[6,0,0],marks:0,metrics:0,actions:1,controls:["previous","next","pause","position"] },
  "testimonials-component-20": { preset:"sticky-dual-stream",composition:"marquee",records:8,spotlights:0,subjects:0,media:[8,0,0],marks:8,metrics:0,actions:1,controls:["pause","position"] },
  "testimonials-component-21": { preset:"support-proof-stream",composition:"marquee",records:8,spotlights:0,subjects:0,media:[8,0,0],marks:0,metrics:2,actions:1,controls:["pause","position"] },
  "testimonials-component-22": { preset:"metrics-review-stack",composition:"selector",records:3,spotlights:0,subjects:0,media:[3,0,0],marks:0,metrics:3,actions:2,controls:["previous","next","pause","position"] },
  "testimonials-component-23": { preset:"logo-proof-tabs",composition:"selector",records:6,spotlights:0,subjects:0,media:[6,0,0],marks:6,metrics:0,actions:0,controls:["pause","position"] },
  "testimonials-component-24": { preset:"social-proof-wall",composition:"social-wall",records:12,spotlights:0,subjects:0,media:[6,6,0],marks:12,metrics:0,actions:1,controls:["pause","position"] },
};

const ANNOUNCEMENT_KEYS = new Set(["error", "mediaError", "paused", "resumed", "selectionChanged"]);
const text = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const unique = (items: Array<{ id: string }>, label: string, source: string) => {
  if (new Set(items.map(({ id }) => id)).size !== items.length) throw new Error(`${source} repeats ${label} IDs.`);
};
const remote = (value: string) => /^(?:https?:)?\/\//i.test(value);

function merge(base: unknown, patch: unknown, source: string): unknown {
  if (patch === undefined) return base;
  if (Array.isArray(base) && Array.isArray(patch)) {
    const structural = base.every((item) => item && typeof item === "object" && "id" in item);
    if (!structural) return structuredClone(patch);
    const byId = new Map(base.map((item) => [String((item as { id: string }).id), item]));
    for (const item of patch) {
      if (!item || typeof item !== "object" || !("id" in item) || !byId.has(String(item.id))) throw new Error(`${source} stress references an unknown structural ID.`);
      byId.set(String(item.id), merge(byId.get(String(item.id)), item, source));
    }
    return base.map((item) => byId.get(String((item as { id: string }).id)));
  }
  if (base && patch && typeof base === "object" && typeof patch === "object" && !Array.isArray(patch)) {
    const result = structuredClone(base) as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch)) result[key] = merge(result[key], value, source);
    return result;
  }
  return structuredClone(patch);
}

function coreOf(raw: VoicesFixture): VoicesFixtureCore {
  const { stress: _stress, ...core } = raw;
  return core;
}

function normalizedStress(raw: VoicesFixture, stress: VoiceStressKey) {
  const patch = raw.stress[stress];
  const keys = Object.keys(patch);
  return stress === "error" && keys.length > 0 && keys.every((key) => ANNOUNCEMENT_KEYS.has(key)) ? { announcements: patch } : patch;
}

function normalizeEmphasis(fixture: VoicesFixtureCore): VoicesFixtureCore {
  return {
    ...fixture,
    records: fixture.records.map((record) => record.emphasis ? ({
      ...record,
      emphasis: record.emphasis
        .map(({ start, end }) => ({ start: Math.min(start, record.quote.length), end: Math.min(end, record.quote.length) }))
        .filter(({ start, end }) => end > start),
    }) : record),
  };
}

function structuralSignature(fixture: VoicesFixtureCore) {
  return JSON.stringify({
    sourceKey: fixture.sourceKey,
    preset: fixture.preset,
    composition: fixture.composition,
    records: fixture.records.map(({ id, mediaId, identityMarkId, emphasis }) => ({ id, mediaId, identityMarkId, emphasis })),
    subjects: fixture.subjects.map(({ id, mediaId }) => ({ id, mediaId })),
    spotlights: fixture.spotlights.map(({ id, identityMarkId }) => ({ id, identityMarkId })),
    aggregateMetrics: fixture.aggregateMetrics.map(({ id }) => id),
    media: fixture.media.map(({ id, kind, assetKey, aspect }) => ({ id, kind, assetKey, aspect })),
    identityMarks: fixture.identityMarks.map(({ id, lightId, darkId }) => ({ id, lightId, darkId })),
    decorativeAvatarIds: fixture.decorativeAvatarIds,
    actions: fixture.actions.map(({ id, href, ownerId, kind, emphasis }) => ({ id, href, ownerId, kind, emphasis })),
    controls: fixture.controls.map(({ id, kind }) => ({ id, kind })),
    behavior: fixture.behavior,
  });
}

function validateCore(fixture: VoicesFixtureCore) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown Voices source ${fixture.sourceKey}.`);
  if (fixture.schemaVersion !== 1 || fixture.owner !== "Voices" || fixture.preset !== expected.preset || fixture.composition !== expected.composition) throw new Error(`${fixture.sourceKey} has the wrong Voices owner, preset or composition.`);
  const counts = [fixture.records.length, fixture.spotlights.length, fixture.subjects.length, fixture.identityMarks.length, fixture.aggregateMetrics.length, fixture.actions.length, fixture.controls.length, fixture.decorativeAvatarIds.length, fixture.records.filter(({ metric }) => metric).length];
  const wanted = [expected.records, expected.spotlights, expected.subjects, expected.marks, expected.metrics, expected.actions, expected.controls.length, expected.decorative ?? 0, expected.recordMetrics ?? 0];
  if (JSON.stringify(counts) !== JSON.stringify(wanted)) throw new Error(`${fixture.sourceKey} drifts from its exact proof inventory.`);
  const mediaKinds: VoiceMediaKind[] = ["avatar", "photo", "video-poster"];
  const mediaVector = mediaKinds.map((kind) => fixture.media.filter((seat) => seat.kind === kind).length);
  if (JSON.stringify(mediaVector) !== JSON.stringify(expected.media)) throw new Error(`${fixture.sourceKey} has the wrong media role vector.`);
  if (JSON.stringify(fixture.controls.map(({ kind }) => kind)) !== JSON.stringify(expected.controls)) throw new Error(`${fixture.sourceKey} has the wrong control order.`);
  text(fixture.intro.heading, "intro heading", fixture.sourceKey);
  for (const collection of [fixture.records, fixture.subjects, fixture.spotlights, fixture.aggregateMetrics, fixture.media, fixture.identityMarks, fixture.actions, fixture.controls]) unique(collection, "structural", fixture.sourceKey);
  const mediaIds = new Set(fixture.media.map(({ id }) => id));
  const markIds = new Set(fixture.identityMarks.map(({ id }) => id));
  const actionIds = new Set(fixture.actions.map(({ id }) => id));
  const selectable = new Set((fixture.sourceKey === "testimonials-component-16" ? fixture.subjects : fixture.records).map(({ id }) => id));
  if (!selectable.has(fixture.behavior.initialId) || !selectable.has(fixture.state.activeId)) throw new Error(`${fixture.sourceKey} has an unresolved initial or active ID.`);
  for (const id of fixture.intro.actionIds) if (!actionIds.has(id)) throw new Error(`${fixture.sourceKey} intro references an unknown action ${id}.`);
  for (const record of fixture.records) {
    text(record.quote, `record ${record.id} quote`, fixture.sourceKey);
    if (record.mediaId && !mediaIds.has(record.mediaId)) throw new Error(`${fixture.sourceKey} record ${record.id} references unknown media.`);
    if (record.identityMarkId && !markIds.has(record.identityMarkId)) throw new Error(`${fixture.sourceKey} record ${record.id} references unknown identity mark.`);
    for (const range of record.emphasis ?? []) if (!Number.isInteger(range.start) || !Number.isInteger(range.end) || range.start < 0 || range.end <= range.start || range.end > record.quote.length) throw new Error(`${fixture.sourceKey} record ${record.id} has invalid emphasis offsets.`);
  }
  for (const subject of fixture.subjects) if (!mediaIds.has(subject.mediaId)) throw new Error(`${fixture.sourceKey} subject ${subject.id} references unknown media.`);
  for (const spotlight of fixture.spotlights) {
    text(spotlight.statement, `spotlight ${spotlight.id} statement`, fixture.sourceKey);
    if (spotlight.identityMarkId && !markIds.has(spotlight.identityMarkId)) throw new Error(`${fixture.sourceKey} spotlight ${spotlight.id} references unknown identity mark.`);
  }
  for (const id of fixture.decorativeAvatarIds) if (!mediaIds.has(id)) throw new Error(`${fixture.sourceKey} decorative avatar ${id} is unresolved.`);
  for (const action of fixture.actions) if (!action.href.startsWith("/demo/testimonials/") || action.href.includes("#") || remote(action.href) || action.ownerId !== "intro") throw new Error(`${fixture.sourceKey} action ${action.id} requires one safe local owner.`);
  for (const seat of fixture.media) if (remote(seat.assetKey)) throw new Error(`${fixture.sourceKey} media keys may not be URLs.`);
  for (const mark of fixture.identityMarks) if (remote(mark.lightId) || (mark.darkId && remote(mark.darkId))) throw new Error(`${fixture.sourceKey} mark keys may not be URLs.`);
  for (const value of Object.values(fixture.announcements)) text(value, "announcement", fixture.sourceKey);
}

function resolveMedia(fixture: VoicesFixtureCore, mediaMap: VoicesMediaMap) {
  if (mediaMap.schemaVersion !== 1) throw new Error("Voices media map requires schema version 1.");
  const raster = mediaMap.media.filter(({ slug }) => slug === fixture.sourceKey);
  const marks = mediaMap.marks.filter(({ slug }) => slug === fixture.sourceKey);
  const mediaBySeatId = new Map<string, VoiceRasterMediaRecord>();
  const marksBySeatId = new Map<string, VoiceMarkMediaRecord>();
  for (const seat of fixture.media) {
    const record = raster.find(({ seatId, assetKey, role }) => seatId === seat.id && assetKey === seat.assetKey && role === seat.kind);
    if (!record || remote(record.publicBase) || (record.avatarBase && remote(record.avatarBase))) throw new Error(`${fixture.sourceKey}/${seat.id} cannot resolve one exact local media record.`);
    mediaBySeatId.set(seat.id, record);
  }
  for (const seat of fixture.identityMarks) {
    const record = marks.find(({ seatId, name }) => seatId === seat.id && name === seat.name);
    if (!record || remote(record.lightPath) || remote(record.darkPath)) throw new Error(`${fixture.sourceKey}/${seat.id} cannot resolve one exact local identity mark.`);
    marksBySeatId.set(seat.id, record);
  }
  if (mediaBySeatId.size !== fixture.media.length || marksBySeatId.size !== fixture.identityMarks.length || raster.length !== fixture.media.length || marks.length !== fixture.identityMarks.length) throw new Error(`${fixture.sourceKey} media map has missing or extra source-scoped records.`);
  return { mediaBySeatId, marksBySeatId };
}

export function resolveVoicesFixture(raw: VoicesFixture, mediaMap: VoicesMediaMap, stress?: VoiceStressKey): ResolvedVoicesFixture {
  if (!raw || typeof raw !== "object") throw new Error("Voices fixture must be an object.");
  const base = coreOf(raw);
  validateCore(base);
  if (base.behavior.initialId !== base.state.activeId) throw new Error(`${raw.sourceKey} behavior and initial state disagree.`);
  for (const key of ["short", "longLocale", "error", "selectedLast", "paused"] as VoiceStressKey[]) if (!raw.stress?.[key]) throw new Error(`${raw.sourceKey} requires ${key} stress.`);
  let core = base;
  if (stress) {
    const stressed = merge(base, normalizedStress(raw, stress), raw.sourceKey) as VoicesFixtureCore;
    if (structuralSignature(stressed) !== structuralSignature(base)) throw new Error(`${raw.sourceKey}/${stress} changes structural ownership.`);
    core = normalizeEmphasis(stressed);
    validateCore(core);
  }
  const resolved = resolveMedia(core, mediaMap);
  return { ...core, ...resolved, activeStress: stress };
}
