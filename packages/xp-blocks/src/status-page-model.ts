export const STATUS_SOURCE_KEYS = [
  "error-page-01",
  "error-page-02",
  "error-page-03",
  "error-page-04",
  "error-page-05",
] as const;

export const STATUS_PAGE_PRESETS = [
  "orbit-panel",
  "lost-figure",
  "passage-background",
  "companion-outline",
  "signal-panel",
] as const;

export type StatusSourceKey = typeof STATUS_SOURCE_KEYS[number];
export type StatusPagePreset = typeof STATUS_PAGE_PRESETS[number];
export type StatusCopyMode = "base" | "short" | "longLocale";
export type StatusDeviceClass = "M" | "TP" | "TL" | "DS" | "DW";
export type StatusPresentation = "band" | "inline-figure" | "background" | "panel";

export type StatusAction = {
  id: "recover";
  labelKey: string;
  href: "/demo/home";
  kind: "navigate";
};

type SharedIdentity = {
  id: string;
  mediaErrorKey: string;
  decorative: true;
  presentations: Record<StatusDeviceClass, StatusPresentation>;
};

export type StatusExternalIdentity = SharedIdentity & {
  kind: "raster-illustration" | "vector-illustration" | "photo";
  mediaSeatId: string;
  reducedDataKey?: string;
};

export type StatusSystemIdentity = SharedIdentity & {
  kind: "system-art";
  visual: "signal-field";
  wordKeys: [string, string, string];
};

export type StatusPageFixture = {
  schemaVersion: 1;
  sourceKey: StatusSourceKey;
  owner: "StatusPage";
  preset: StatusPagePreset;
  code: 404;
  kickerKey?: string;
  headlineKey: string;
  bodyKey: string;
  primaryAction: StatusAction;
  secondaryAction?: never;
  identity: StatusExternalIdentity | StatusSystemIdentity;
  numeralStyle: "solid" | "outline" | "translucent" | "signal";
  hostModes: ["shell", "standalone"];
  copy: Record<StatusCopyMode, Record<string, string>>;
};

export type StatusMediaRecord = {
  sourceKey: StatusSourceKey;
  seatId: string;
  kind: "raster-illustration" | "vector-illustration" | "photo" | "system-art";
  status: "RESOLVED-ORIGINAL" | "RESOLVED-LIBRARY-REUSE" | "RUNTIME-CSS-SVG";
  aspect: string;
  focalPoint: string;
  jobId?: string;
  assetId?: string;
  src?: `/media/${string}.svg`;
  publicBase?: `/media/${string}`;
  canonicalPath?: string;
  viewBox?: string;
  sha256?: string;
  runtimeOwner?: "StatusPage";
  visual?: "signal-field";
};

export type StatusMediaMap = {
  schemaVersion: "1.0";
  packet: "error-page-contract-v1";
  generatedAt: string;
  status: "PASS";
  counts: {
    semanticIdentities: 5;
    externalSeats: 4;
    resolvedExternalSeats: 4;
    heldExternalSeats: 0;
    systemArtIdentities: 1;
    originalVectors: 3;
    approvedPhotoReuses: 1;
    vendorAssets: 0;
    remoteAssets: 0;
    placeholders: 0;
  };
  records: StatusMediaRecord[];
};

export type ResolvedStatusPageFixture = StatusPageFixture & {
  activeCopyMode: StatusCopyMode;
  activeCopy: Record<string, string>;
  media: StatusMediaRecord;
  runnable: boolean;
  mediaHoldSeatIds: string[];
};

const EXPECTED: Record<StatusSourceKey, {
  preset: StatusPagePreset;
  kind: StatusPageFixture["identity"]["kind"];
  seatId: string;
  presentations: string;
  numeralStyle: StatusPageFixture["numeralStyle"];
}> = {
  "error-page-01": { preset: "orbit-panel", kind: "vector-illustration", seatId: "ep01-orbit-traversal", presentations: "band/band/panel/panel/panel", numeralStyle: "solid" },
  "error-page-02": { preset: "lost-figure", kind: "vector-illustration", seatId: "ep02-lost-orientation", presentations: "inline-figure/inline-figure/inline-figure/inline-figure/inline-figure", numeralStyle: "solid" },
  "error-page-03": { preset: "passage-background", kind: "photo", seatId: "ep03-directional-passage", presentations: "background/background/background/background/background", numeralStyle: "translucent" },
  "error-page-04": { preset: "companion-outline", kind: "vector-illustration", seatId: "ep04-companion-object", presentations: "inline-figure/inline-figure/inline-figure/inline-figure/inline-figure", numeralStyle: "outline" },
  "error-page-05": { preset: "signal-panel", kind: "system-art", seatId: "ep05-signal", presentations: "band/band/panel/panel/panel", numeralStyle: "signal" },
};

const CLASS_ORDER: StatusDeviceClass[] = ["M", "TP", "TL", "DS", "DW"];

function requireText(value: unknown, label: string, sourceKey: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
}

function assertExactKeys(copy: StatusPageFixture["copy"], sourceKey: string) {
  const base = Object.keys(copy.base).sort().join("/");
  if (!base || Object.keys(copy.short).sort().join("/") !== base || Object.keys(copy.longLocale).sort().join("/") !== base) {
    throw new Error(`${sourceKey} copy modes must expose identical keys.`);
  }
  for (const [mode, values] of Object.entries(copy)) for (const [key, value] of Object.entries(values)) {
    requireText(value, `${mode}.${key}`, sourceKey);
    if (value.includes("—") || value.includes("–")) throw new Error(`${sourceKey} copy contains a forbidden long dash.`);
  }
}

function referencedCopyKeys(fixture: StatusPageFixture) {
  const keys = [fixture.kickerKey, fixture.headlineKey, fixture.bodyKey, fixture.primaryAction.labelKey, fixture.identity.mediaErrorKey];
  if (fixture.identity.kind === "photo") keys.push(fixture.identity.reducedDataKey);
  if (fixture.identity.kind === "system-art") keys.push(...fixture.identity.wordKeys);
  return keys.filter((key): key is string => Boolean(key));
}

function validateFixture(fixture: StatusPageFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.schemaVersion !== 1 || fixture.owner !== "StatusPage" || fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} is outside the closed StatusPage preset map.`);
  if (fixture.code !== 404 || fixture.identity.kind !== expected.kind || fixture.numeralStyle !== expected.numeralStyle) throw new Error(`${fixture.sourceKey} changes its fixed status identity.`);
  const seatId = fixture.identity.kind === "system-art" ? fixture.identity.id : fixture.identity.mediaSeatId;
  if (seatId !== expected.seatId) throw new Error(`${fixture.sourceKey} changes its semantic identity seat.`);
  if (fixture.primaryAction.id !== "recover" || fixture.primaryAction.kind !== "navigate" || fixture.primaryAction.href !== "/demo/home" || "secondaryAction" in fixture) {
    throw new Error(`${fixture.sourceKey} requires exactly one local Home recovery action.`);
  }
  if (fixture.hostModes.join("/") !== "shell/standalone") throw new Error(`${fixture.sourceKey} requires shell and standalone hosts.`);
  const presentations = CLASS_ORDER.map((deviceClass) => fixture.identity.presentations[deviceClass]).join("/");
  if (presentations !== expected.presentations || Object.values(fixture.identity.presentations).some((value) => !["band", "inline-figure", "background", "panel"].includes(value))) {
    throw new Error(`${fixture.sourceKey} changes or hides a native-class identity presentation.`);
  }
  assertExactKeys(fixture.copy, fixture.sourceKey);
  for (const mode of ["base", "short", "longLocale"] as const) for (const key of referencedCopyKeys(fixture)) {
    if (!(key in fixture.copy[mode])) throw new Error(`${fixture.sourceKey}/${mode} misses copy key ${key}.`);
  }
  if (fixture.sourceKey === "error-page-04") {
    if (fixture.kickerKey || Object.values(fixture.copy).some((copy) => "kickerKey" in copy)) throw new Error("error-page-04 must preserve its no-kicker hierarchy.");
  } else if (!fixture.kickerKey) throw new Error(`${fixture.sourceKey} requires its kicker rank.`);
  if (fixture.identity.kind === "photo" && !fixture.identity.reducedDataKey) throw new Error("error-page-03 requires reduced-data copy.");
  if (fixture.identity.kind === "system-art") {
    if (fixture.identity.wordKeys.length !== 3 || fixture.identity.visual !== "signal-field") throw new Error("error-page-05 requires one three-word signal field.");
    const words = fixture.identity.wordKeys.map((key) => fixture.copy.base[key]).join("/");
    if (words !== "Trace/Pulse/Drift") throw new Error("error-page-05 signal words changed.");
  }
}

export function validateStatusMediaMap(map: StatusMediaMap) {
  if (map.schemaVersion !== "1.0" || map.packet !== "error-page-contract-v1" || map.status !== "PASS") throw new Error("StatusPage media map identity changed.");
  const counts = map.counts;
  if (counts.semanticIdentities !== 5 || counts.externalSeats !== 4 || counts.resolvedExternalSeats !== 4 || counts.heldExternalSeats !== 0 || counts.systemArtIdentities !== 1 || counts.originalVectors !== 3 || counts.approvedPhotoReuses !== 1) throw new Error("StatusPage media totals changed.");
  if (counts.vendorAssets || counts.remoteAssets || counts.placeholders) throw new Error("StatusPage media map admits a forbidden dependency.");
  if (map.records.length !== 5 || map.records.map(({ sourceKey }) => sourceKey).join("/") !== STATUS_SOURCE_KEYS.join("/")) throw new Error("StatusPage media map must account for five ordered identities.");
  if (new Set(map.records.map(({ seatId }) => seatId)).size !== 5) throw new Error("StatusPage media map repeats an identity seat.");
  for (const record of map.records) {
    const expected = EXPECTED[record.sourceKey];
    if (record.seatId !== expected.seatId || record.kind !== expected.kind) throw new Error(`${record.sourceKey} media record differs from the closed fixture.`);
    requireText(record.aspect, "media aspect", record.sourceKey);
    requireText(record.focalPoint, "media focal point", record.sourceKey);
    if (record.kind === "vector-illustration" && (record.status !== "RESOLVED-ORIGINAL" || !record.src?.startsWith("/media/error-page-") || !record.src.endsWith(".svg") || !record.viewBox || !record.sha256 || !record.canonicalPath?.startsWith("assets-library/vectors/error-page/"))) throw new Error(`${record.sourceKey} requires one resolved original local vector.`);
    if (record.kind === "photo" && (record.status !== "RESOLVED-LIBRARY-REUSE" || record.assetId !== "portfolio-11-placeholder-acoustic-corridor" || !record.publicBase?.startsWith("/media/portfolio-11-placeholder-acoustic-corridor") || !record.sha256)) throw new Error("error-page-03 requires the approved corridor library asset.");
    if (record.sourceKey === "error-page-01" && (record.kind !== "vector-illustration" || record.status !== "RESOLVED-ORIGINAL" || record.assetId !== "error-page-01-orbit-traveler" || record.src !== "/media/error-page-01-orbit-traveler.svg" || record.viewBox !== "0 0 640 400")) throw new Error("error-page-01 requires the D-M34 original orbit traveler vector.");
    if (record.kind === "system-art" && (record.sourceKey !== "error-page-05" || record.status !== "RUNTIME-CSS-SVG" || record.runtimeOwner !== "StatusPage" || record.visual !== "signal-field" || record.src || record.publicBase)) throw new Error("error-page-05 requires code-owned system art and zero external media.");
  }
  return true;
}

export function resolveStatusPageFixture(fixture: StatusPageFixture, mediaMap: StatusMediaMap, mode: StatusCopyMode = "base"): ResolvedStatusPageFixture {
  validateFixture(fixture);
  validateStatusMediaMap(mediaMap);
  if (!(mode in fixture.copy)) throw new Error(`${fixture.sourceKey} has no copy mode ${mode}.`);
  const media = mediaMap.records.find(({ sourceKey }) => sourceKey === fixture.sourceKey);
  if (!media) throw new Error(`${fixture.sourceKey} has no media identity record.`);
  return { ...structuredClone(fixture), activeCopyMode: mode, activeCopy: fixture.copy[mode], media: structuredClone(media), runnable: true, mediaHoldSeatIds: [] };
}

export function isRunnableStatusFixture(_fixture: StatusPageFixture) {
  return true;
}

export type StatusPageImplementationProbe = {
  publicOwners: string[];
  semanticMainCount: number;
  headingCount: number;
  bodyCount: number;
  actionCount: number;
  identityCount: number;
  hiddenTwins: boolean;
  viewportBranching: boolean;
  fixedAction: boolean;
  continuousWidthCount: number;
  unresolvedMediaHoldCount: number;
};

export function validateStatusPageImplementationProbe(probe: StatusPageImplementationProbe) {
  if (probe.publicOwners.join("/") !== "StatusPage") throw new Error("status-page-public-owner-cardinality");
  if ([probe.semanticMainCount, probe.headingCount, probe.bodyCount, probe.actionCount, probe.identityCount].some((count) => count !== 1)) throw new Error("status-page-semantic-tree-cardinality");
  if (probe.hiddenTwins) throw new Error("status-page-hidden-responsive-twin");
  if (probe.viewportBranching) throw new Error("status-page-viewport-branching");
  if (probe.fixedAction) throw new Error("status-page-fixed-action");
  if (probe.continuousWidthCount !== 1681) throw new Error("status-page-continuous-slot-coverage");
  if (probe.unresolvedMediaHoldCount !== 0) throw new Error("status-page-unresolved-media-hold");
  return true;
}
