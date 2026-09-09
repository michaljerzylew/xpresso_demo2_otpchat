export const DOWNLOAD_SOURCE_KEYS = [
  "download-01",
  "download-02",
  "download-03",
  "download-04",
  "download-05",
  "download-06",
] as const;

export const DOWNLOAD_SURFACE_PRESETS = [
  "promo-slab-store-pair",
  "release-panel-consent",
  "platform-deck",
  "promo-slab-desktop-proof",
  "release-panel-requirements",
] as const;

export const RELEASE_LIST_PRESETS = ["current-releases"] as const;

export type DownloadSourceKey = typeof DOWNLOAD_SOURCE_KEYS[number];
export type DownloadSurfaceSourceKey = Exclude<DownloadSourceKey, "download-05">;
export type ReleaseListSourceKey = "download-05";
export type DownloadSurfacePreset = typeof DOWNLOAD_SURFACE_PRESETS[number];
export type ReleaseListPreset = typeof RELEASE_LIST_PRESETS[number];
export type DownloadCopyMode = "base" | "short" | "longLocale";
export type PlatformId = "ios" | "android" | "macos-arm" | "macos-intel" | "macos" | "windows" | "linux" | "chrome" | "firefox" | "safari";
export type PlatformResolution =
  | { status: "unknown" }
  | { status: "hinted" | "confirmed" | "overridden"; platformId: PlatformId };
export type DownloadActionState = "idle" | "pending" | "success" | "error";
export type DownloadAssetKind = "direct" | "store" | "extension" | "documentation" | "release-notes";

export type DownloadArtifact = {
  id: string;
  platformId: PlatformId;
  kind: DownloadAssetKind;
  labelKey: string;
  href: `/demo/${string}`;
  version?: string;
  size?: string;
  compatibility?: string;
  countKey?: string;
};

export type DownloadMediaDeclaration = {
  seatId: string;
  kind: "runtime-vector" | "runtime-ui" | "raster-photo";
  altKey: string;
  state?: "HOLD-GPT-IMAGE-2";
  themes?: Array<"light" | "dark">;
};

export type DownloadMediaAsset = {
  assetId: string;
  accessibleName: string;
  kind?: "raster-photo";
  src: `/media/${string}`;
  publicBase?: `/media/${string}`;
  width?: number;
  height?: number;
};

export type DownloadMediaSeat = {
  slug: DownloadSourceKey;
  seatId: string;
  kind: "runtime-vector" | "runtime-ui" | "raster-photo";
  assetId?: string;
  runtimeOwner?: string;
  state?: "HOLD-GPT-IMAGE-2";
  jobId?: string;
  alt: string;
  themes?: Array<"light" | "dark">;
};

export type DownloadMediaMap = {
  schemaVersion: "1.0";
  packet: "download-contract-v1";
  status: "HOLD-INFRA" | "PASS";
  counts: {
    semanticSeats: number;
    resolvedSeats: number;
    heldRasterSeats: number;
    runtimeUiSeats: number;
    runtimeVectorSeats: number;
    uniqueVectorAssets: number;
    providerJobsRequired: number;
    providerJobsCompleted?: number;
    vendorAssets: number;
    remoteAssets: number;
    placeholders: number;
  };
  assets: DownloadMediaAsset[];
  seats: DownloadMediaSeat[];
};

type CopyFixture = {
  copy: Record<DownloadCopyMode, Record<string, string>>;
};

type PlatformFixture = {
  platformResolution: {
    initial: "unknown" | "hinted" | "confirmed";
    platformId?: PlatformId;
    persistenceKey: string;
  };
};

export type DownloadSurfaceFixture = CopyFixture & PlatformFixture & {
  sourceKey: DownloadSurfaceSourceKey;
  owner: "DownloadSurface";
  preset: DownloadSurfacePreset;
  intro?: { eyebrowKey?: string; headingKey: string; bodyKey: string };
  release?: { product?: string; version: string; size?: string; date?: string; statusKey: string };
  artifacts?: DownloadArtifact[];
  groups?: Array<{
    id: "desktop" | "mobile" | "browser";
    titleKey: string;
    descriptionKey: string;
    mediaSeatId: string;
    mediaAltKey: string;
    artifacts: DownloadArtifact[];
  }>;
  supportedServices?: Array<{ id: string; labelKey: string }>;
  consent?: {
    initiallyChecked: boolean;
    labelKey: string;
    validationKey: string;
    routes: Array<{ id: string; labelKey: string; href: `/demo/${string}` }>;
  };
  requirements?: Array<{ id: string; labelKey: string }>;
  benefits?: Array<{ id: string; labelKey: string }>;
  stateKeys?: Record<string, string>;
  mediaDeclarations?: DownloadMediaDeclaration[];
};

export type ReleaseListFixture = CopyFixture & PlatformFixture & {
  sourceKey: ReleaseListSourceKey;
  owner: "ReleaseList";
  preset: ReleaseListPreset;
  intro: { eyebrowKey: string; headingKey: string; bodyKey: string };
  availability: Array<{ id: string; platformId: PlatformId; labelKey: string; mediaSeatId: string }>;
  releases: Array<{
    id: "desktop" | "mobile";
    titleKey: string;
    statusKey: string;
    version: string;
    size: string;
    date?: string;
    artifacts: DownloadArtifact[];
  }>;
  stateKeys: Record<string, string>;
  mediaDeclarations: DownloadMediaDeclaration[];
};

export type DownloadFixture = DownloadSurfaceFixture | ReleaseListFixture;

export type ResolvedDownloadSurfaceFixture = DownloadSurfaceFixture & {
  activeCopyMode: DownloadCopyMode;
  activeCopy: Record<string, string>;
  runnable: boolean;
  mediaHoldSeatIds: string[];
  mediaMap: DownloadMediaMap;
};

export type ResolvedReleaseListFixture = ReleaseListFixture & {
  activeCopyMode: DownloadCopyMode;
  activeCopy: Record<string, string>;
  runnable: true;
  mediaHoldSeatIds: [];
  mediaMap: DownloadMediaMap;
};

const EXPECTED = {
  "download-01": { owner: "DownloadSurface", preset: "promo-slab-store-pair", artifacts: 2, media: 3 },
  "download-02": { owner: "DownloadSurface", preset: "release-panel-consent", artifacts: 4, media: 2 },
  "download-03": { owner: "DownloadSurface", preset: "platform-deck", artifacts: 7, media: 8 },
  "download-04": { owner: "DownloadSurface", preset: "promo-slab-desktop-proof", artifacts: 2, media: 1 },
  "download-05": { owner: "ReleaseList", preset: "current-releases", artifacts: 4, media: 5 },
  "download-06": { owner: "DownloadSurface", preset: "release-panel-requirements", artifacts: 4, media: 0 },
} as const;

const exact = (value: unknown, count: number, label: string, source: string) => {
  if (!Array.isArray(value) || value.length !== count) throw new Error(`${source} requires exactly ${count} ${label}.`);
  return value;
};

const nonempty = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
};

const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};

const allArtifacts = (fixture: DownloadFixture) => fixture.owner === "ReleaseList"
  ? fixture.releases.flatMap(({ artifacts }) => artifacts)
  : fixture.groups?.flatMap(({ artifacts }) => artifacts) ?? fixture.artifacts ?? [];

function collectCopyKeys(value: unknown, keys: Set<string>, root = true) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectCopyKeys(item, keys, false));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (root && key === "copy") continue;
    if (typeof child === "string" && child.endsWith("Key") && key !== "sourceKey" && key !== "persistenceKey") keys.add(child);
    else collectCopyKeys(child, keys, false);
  }
}

function validateCopy(fixture: DownloadFixture) {
  const keys = Object.keys(fixture.copy.base).sort();
  if (!keys.length || ["short", "longLocale"].some((mode) => JSON.stringify(Object.keys(fixture.copy[mode as DownloadCopyMode]).sort()) !== JSON.stringify(keys))) {
    throw new Error(`${fixture.sourceKey} copy modes must expose identical keys.`);
  }
  if (Object.values(fixture.copy).flatMap(Object.values).some((value) => !value.trim() || value.includes("—"))) throw new Error(`${fixture.sourceKey} copy contains an empty value or em dash.`);
  const references = new Set<string>();
  collectCopyKeys(fixture, references);
  for (const mode of ["base", "short", "longLocale"] as const) {
    const missing = [...references].find((key) => !(key in fixture.copy[mode]));
    if (missing) throw new Error(`${fixture.sourceKey}/${mode} misses copy key ${missing}.`);
  }
  const baseLength = Object.values(fixture.copy.base).join("").length;
  const longLength = Object.values(fixture.copy.longLocale).join("").length;
  if (longLength < Math.ceil(baseLength * 1.35)) throw new Error(`${fixture.sourceKey} long-locale copy must expand the base inventory by at least 35%.`);
}

export function validateDownloadMediaMap(map: DownloadMediaMap) {
  const counts = map.counts;
  if (map.schemaVersion !== "1.0" || map.packet !== "download-contract-v1" || !["HOLD-INFRA", "PASS"].includes(map.status)) throw new Error("Download media map identity changed.");
  if (counts.semanticSeats !== 19 || counts.resolvedSeats !== 19 || counts.heldRasterSeats !== 0 || counts.runtimeUiSeats !== 4 || counts.runtimeVectorSeats !== 12 || counts.uniqueVectorAssets !== 9 || counts.providerJobsRequired !== 0 || counts.providerJobsCompleted !== 3) throw new Error("Download media map seat totals changed.");
  if (counts.vendorAssets || counts.remoteAssets || counts.placeholders) throw new Error("Download media map admits a forbidden dependency.");
  exact(map.assets, 12, "local media assets", "download-media");
  exact(map.seats, 19, "semantic seats", "download-media");
  unique(map.assets.map(({ assetId }) => assetId), "asset IDs", "download-media");
  unique(map.seats.map(({ seatId }) => seatId), "seat IDs", "download-media");
  for (const asset of map.assets) {
    nonempty(asset.accessibleName, `${asset.assetId} accessible name`, "download-media");
    if (!asset.src.startsWith("/media/download-") || asset.src.includes(":")) throw new Error(`${asset.assetId} requires one local download asset.`);
    if (asset.kind === "raster-photo") {
      if (!asset.publicBase?.startsWith("/media/download-03-") || !asset.src.endsWith("-1280.jpg") || asset.width !== 2048 || asset.height !== 1152) throw new Error(`${asset.assetId} requires one local responsive photo set.`);
    } else if (!asset.src.endsWith(".svg")) throw new Error(`${asset.assetId} requires one local download SVG.`);
  }
  for (const seat of map.seats) {
    nonempty(seat.alt, `${seat.seatId} alt`, "download-media");
    if (seat.kind === "runtime-vector" && (!seat.assetId || !map.assets.some(({ assetId }) => assetId === seat.assetId))) throw new Error(`${seat.seatId} requires one resolved local vector.`);
    if (seat.kind === "raster-photo" && (seat.state || seat.jobId || !seat.assetId || map.assets.find(({ assetId }) => assetId === seat.assetId)?.kind !== "raster-photo")) throw new Error(`${seat.seatId} requires one resolved local raster photo.`);
  }
  const held = map.seats.filter(({ state }) => state === "HOLD-GPT-IMAGE-2");
  if (held.length) throw new Error("Download media map retains a stale generated-media HOLD.");
  return true;
}

function validateArtifacts(fixture: DownloadFixture, expectedCount: number) {
  const artifacts = allArtifacts(fixture);
  exact(artifacts, expectedCount, "artifacts", fixture.sourceKey);
  unique(artifacts.map(({ id }) => id), "artifact IDs", fixture.sourceKey);
  for (const artifact of artifacts) {
    nonempty(artifact.labelKey, `${artifact.id} label key`, fixture.sourceKey);
    if (!artifact.href.startsWith(`/demo/${fixture.sourceKey}/`) || artifact.href.includes("#") || artifact.href.includes(":")) throw new Error(`${fixture.sourceKey}/${artifact.id} requires one safe local demo href.`);
  }
}

function validateInventory(fixture: DownloadFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.owner !== expected.owner || fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} is outside the closed download preset map.`);
  const media = fixture.mediaDeclarations ?? [];
  exact(media, expected.media, "semantic media declarations", fixture.sourceKey);
  unique(media.map(({ seatId }) => seatId), "media seat IDs", fixture.sourceKey);
  validateArtifacts(fixture, expected.artifacts);

  if (fixture.sourceKey === "download-01") {
    if (fixture.artifacts?.map(({ platformId }) => platformId).join("/") !== "ios/android") throw new Error("download-01 requires the exact iOS/Android store pair.");
  } else if (fixture.sourceKey === "download-02") {
    exact(fixture.supportedServices, 3, "supported services", fixture.sourceKey);
    exact(fixture.consent?.routes, 3, "policy routes", fixture.sourceKey);
    if (fixture.consent?.initiallyChecked !== false || fixture.release?.version !== "5.16.1" || !fixture.release.date) throw new Error("download-02 requires unchecked consent and the dated 5.16.1 release.");
    for (const route of fixture.consent.routes) if (!route.href.startsWith("/demo/download-02/") || route.href.includes("#")) throw new Error("download-02 policy destinations must be safe local routes.");
  } else if (fixture.sourceKey === "download-03") {
    const groups = exact(fixture.groups, 3, "platform groups", fixture.sourceKey) as NonNullable<DownloadSurfaceFixture["groups"]>;
    if (groups.map(({ id }) => id).join("/") !== "desktop/mobile/browser" || groups.map(({ artifacts }) => artifacts.length).join("/") !== "2/2/3") throw new Error("download-03 requires desktop/mobile/browser groups with 2/2/3 actions.");
    if (media.filter(({ state }) => state === "HOLD-GPT-IMAGE-2").length) throw new Error("download-03 retains a stale raster media HOLD.");
  } else if (fixture.sourceKey === "download-04") {
    if (fixture.artifacts?.filter(({ kind }) => kind === "direct").length !== 1 || fixture.artifacts?.some(({ platformId }) => platformId !== "macos")) throw new Error("download-04 has one macOS build and one macOS release-notes route only.");
    if (fixture.artifacts?.[0]?.version !== "2.2.0" || !fixture.artifacts[0].compatibility) throw new Error("download-04 requires version and compatibility.");
  } else if (fixture.sourceKey === "download-05") {
    exact(fixture.availability, 5, "availability facts", fixture.sourceKey);
    exact(fixture.releases, 2, "release rows", fixture.sourceKey);
    if (fixture.releases.some((release) => "date" in release)) throw new Error("download-05 must not fabricate release dates.");
    if (fixture.releases.map(({ version, size }) => `${version}:${size}`).join("/") !== "3.2.1:230 MB/2.2.0:234 MB") throw new Error("download-05 release metadata changed.");
    const actionable = fixture.releases.flatMap(({ artifacts }) => artifacts.map(({ platformId }) => platformId)).join("/");
    if (actionable !== "windows/macos/ios/android") throw new Error("download-05 must not invent Chrome or Linux binaries.");
  } else {
    exact(fixture.requirements, 3, "requirements", fixture.sourceKey);
    exact(fixture.benefits, 3, "benefits", fixture.sourceKey);
    if (fixture.artifacts?.filter(({ kind }) => kind === "direct").map(({ platformId }) => platformId).join("/") !== "windows/macos/linux") throw new Error("download-06 requires three desktop packages.");
    if (fixture.artifacts?.filter(({ kind }) => kind === "documentation").length !== 1) throw new Error("download-06 requires one documentation route.");
  }
  validateCopy(fixture);
}

function initialResolution(fixture: DownloadFixture): PlatformResolution {
  const { initial, platformId } = fixture.platformResolution;
  if (initial === "unknown") return { status: "unknown" };
  if (!platformId) throw new Error(`${fixture.sourceKey} ${initial} platform resolution needs a platformId.`);
  return { status: initial, platformId };
}

export function resolveDownloadSurfaceFixture(fixture: DownloadSurfaceFixture, map: DownloadMediaMap, mode: DownloadCopyMode = "base"): ResolvedDownloadSurfaceFixture {
  validateInventory(fixture);
  validateDownloadMediaMap(map);
  if (fixture.owner !== "DownloadSurface" || !(mode in fixture.copy)) throw new Error(`${fixture.sourceKey} is not a DownloadSurface fixture.`);
  initialResolution(fixture);
  const mediaHoldSeatIds = (fixture.mediaDeclarations ?? []).filter(({ state }) => state === "HOLD-GPT-IMAGE-2").map(({ seatId }) => seatId);
  const mappedSeats = map.seats.filter(({ slug }) => slug === fixture.sourceKey).map(({ seatId }) => seatId);
  if (mappedSeats.join("/") !== (fixture.mediaDeclarations ?? []).map(({ seatId }) => seatId).join("/")) throw new Error(`${fixture.sourceKey} media declarations differ from the canonical map.`);
  return { ...structuredClone(fixture), activeCopyMode: mode, activeCopy: fixture.copy[mode], runnable: mediaHoldSeatIds.length === 0, mediaHoldSeatIds, mediaMap: map };
}

export function resolveReleaseListFixture(fixture: ReleaseListFixture, map: DownloadMediaMap, mode: DownloadCopyMode = "base"): ResolvedReleaseListFixture {
  validateInventory(fixture);
  validateDownloadMediaMap(map);
  if (fixture.owner !== "ReleaseList" || !(mode in fixture.copy)) throw new Error(`${fixture.sourceKey} is not a ReleaseList fixture.`);
  initialResolution(fixture);
  const mappedSeats = map.seats.filter(({ slug }) => slug === fixture.sourceKey).map(({ seatId }) => seatId);
  if (mappedSeats.join("/") !== fixture.mediaDeclarations.map(({ seatId }) => seatId).join("/")) throw new Error(`${fixture.sourceKey} media declarations differ from the canonical map.`);
  return { ...structuredClone(fixture), activeCopyMode: mode, activeCopy: fixture.copy[mode], runnable: true, mediaHoldSeatIds: [], mediaMap: map };
}

export function fixtureInitialResolution(fixture: DownloadFixture): PlatformResolution {
  return initialResolution(fixture);
}

export function fixtureArtifacts(fixture: DownloadFixture): DownloadArtifact[] {
  return allArtifacts(fixture);
}

export function isRunnableDownloadFixture(fixture: DownloadFixture): boolean {
  return !(fixture.mediaDeclarations ?? []).some(({ state }) => state === "HOLD-GPT-IMAGE-2");
}

export type DownloadImplementationProbe = {
  publicOwners: string[];
  stateOwnerCount: number;
  hiddenTwins: boolean;
  viewportBranching: boolean;
  continuousWidthCount: number;
  coarseTargetPx: number;
  fineTargetPx: number;
  source03ResolvedPhotoCount: number;
};

export function validateDownloadImplementationProbe(probe: DownloadImplementationProbe) {
  if (probe.publicOwners.join("/") !== "DownloadSurface/ReleaseList") throw new Error("download-public-owner-cardinality");
  if (probe.stateOwnerCount !== 1) throw new Error("download-state-owner-cardinality");
  if (probe.hiddenTwins) throw new Error("hidden-responsive-twin");
  if (probe.viewportBranching) throw new Error("two-axis-viewport-branching");
  if (probe.continuousWidthCount !== 721) throw new Error("continuous-slot-coverage");
  if (probe.coarseTargetPx < 44 || probe.fineTargetPx < 24) throw new Error("target-floor");
  if (probe.source03ResolvedPhotoCount !== 3) throw new Error("download-03-photo-cardinality");
  return true;
}
