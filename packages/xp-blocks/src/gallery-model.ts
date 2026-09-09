export const GALLERY_SOURCE_KEYS = Array.from({ length: 10 }, (_, index) =>
  `gallery-component-${String(index + 1).padStart(2, "0")}`,
) as GallerySourceKey[];

export type GallerySourceKey = `gallery-component-${string}`;
export type GalleryIntent = "wall" | "story";
export type GalleryComposition = "mosaic-wall" | "editorial-wall" | "filtered-rail" | "spotlight-rail" | "panoramic-rail";
export type GalleryPreset =
  | "balanced-section-mosaic" | "filtered-project-rail" | "thumbnail-spotlight"
  | "four-tile-proof-wall" | "culinary-anchor-wall" | "split-architecture-wall"
  | "dual-panorama-rail" | "measured-floral-rail" | "center-focus-rail" | "interlocked-maker-wall";
export type GalleryStressKey = "short" | "longLocale" | "mediaFallback";

export type GalleryItem = {
  id: string; assetId: string; mediaKind: "photo" | "ui_project_proof"; alt: string;
  aspect: `${number}:${number}`; focalPoint: { x: number; y: number }; title?: string | null;
  caption?: string | null; groupId?: string | null; band?: number | null;
  weight?: "standard" | "feature" | "wide" | "tall";
};
export type GalleryFilter = { id: string; label: string; itemIds: string[] };
export type GalleryAction = { id: string; label: string; kind: "navigate"; href: `/demo/${string}` };
export type GalleryMotion = { pause: string; resume: string; pausedAnnouncement: string; resumedAnnouncement: string; reducedMotion: string; staticFallback: string };
export type GalleryFixture = {
  schemaVersion: 1; sourceKey: GallerySourceKey; owner: "Gallery"; intent: GalleryIntent;
  composition: GalleryComposition; preset: GalleryPreset;
  intro: { eyebrow?: string | null; heading: string; body: string; actionIds: string[] };
  items: GalleryItem[]; filters: GalleryFilter[]; actions: GalleryAction[];
  footerNote: null | { heading: string; countText: string; actionId: string };
  labels: {
    lightbox: { open: string; close: string; previous: string; next: string; zoom: string; resetZoom: string; position: string };
    rail: { previous: string; next: string; position: string };
    wall: { showAll: string; showLess: string };
    fallback: { unavailable: string; retry: string };
    filter?: { group: string; selected: string };
    progress?: { label: string; value: string };
  };
  announcements: Record<string, string>;
  motion: GalleryMotion | null;
  stress: Record<GalleryStressKey, { textPatches?: Array<{ targetType: string; targetId: string; field: string; value: string }>; itemId?: string; label?: string; description?: string; longToken?: string }>;
};

export type GalleryMediaPlacement = {
  seatId: string; sourceKey: GallerySourceKey; itemId: string; fixtureAssetId: string;
  physicalIdentityId: string; status: "code-owned-ui-proof" | "approved-generated-raster";
  mediaKind: "photo" | "ui_project_proof"; role: "galleryPhoto" | "uiProjectProof";
  desiredAspect: string; focalPoint: { x: number; y: number }; alt: string;
  title?: string | null; groupId?: string | null; band?: number | null; weight?: string | null;
};
export type GalleryMediaIdentity = {
  identityId: string; status: "code-owned-ui-proof" | "approved-generated-raster";
  kind: "code-ui" | "raster"; sourceKey: GallerySourceKey; itemId: string;
  publicBase?: `/media/${string}`; providerCallMade: boolean;
};
export type GalleryMediaMap = {
  schemaVersion: "1.0"; status: "PASS";
  counts: {
    semanticSeats: number; physicalIdentities: number; photoSeats: number; codeOwnedUiProofSeats: number;
    reconciledSeats: number; resolvedRasterSeats: number; resolvedCodeOwnedSeats: number;
    holdInfraRasterSeats: number; missingUnlocalizedSeats: number; providerCallsMade: number;
    substitutionsUsed: number; placeholdersUsed: number; remoteAssets: number; vendorAssets: number; reusePlacements: number;
  };
  placements: GalleryMediaPlacement[];
  identities: GalleryMediaIdentity[];
};
export type ResolvedGalleryItem = GalleryItem & { seatId: string; identityId: string; mediaStatus: "code" | "raster" | "error"; publicBase?: `/media/${string}` };
export type ResolvedGallery = Omit<GalleryFixture, "items"> & {
  items: ResolvedGalleryItem[]; itemsById: ReadonlyMap<string, ResolvedGalleryItem>;
  activeStress?: GalleryStressKey; terminalEligible: boolean;
};

type Expected = { intent: GalleryIntent; composition: GalleryComposition; preset: GalleryPreset; items: number; filters: number; groups: number[]; actions: number; footer: number; motion: number };
const EXPECTED: Record<GallerySourceKey, Expected> = {
  "gallery-component-01": { intent:"wall",composition:"mosaic-wall",preset:"balanced-section-mosaic",items:10,filters:0,groups:[],actions:0,footer:0,motion:0 },
  "gallery-component-02": { intent:"story",composition:"filtered-rail",preset:"filtered-project-rail",items:16,filters:4,groups:[4,4,4,4],actions:0,footer:0,motion:0 },
  "gallery-component-03": { intent:"story",composition:"spotlight-rail",preset:"thumbnail-spotlight",items:3,filters:0,groups:[],actions:1,footer:0,motion:1 },
  "gallery-component-04": { intent:"wall",composition:"mosaic-wall",preset:"four-tile-proof-wall",items:4,filters:0,groups:[],actions:1,footer:1,motion:0 },
  "gallery-component-05": { intent:"wall",composition:"mosaic-wall",preset:"culinary-anchor-wall",items:6,filters:0,groups:[],actions:0,footer:0,motion:0 },
  "gallery-component-06": { intent:"wall",composition:"editorial-wall",preset:"split-architecture-wall",items:6,filters:0,groups:[],actions:1,footer:0,motion:0 },
  "gallery-component-07": { intent:"story",composition:"panoramic-rail",preset:"dual-panorama-rail",items:12,filters:0,groups:[6,6],actions:0,footer:0,motion:1 },
  "gallery-component-08": { intent:"story",composition:"spotlight-rail",preset:"measured-floral-rail",items:5,filters:0,groups:[],actions:0,footer:0,motion:0 },
  "gallery-component-09": { intent:"story",composition:"spotlight-rail",preset:"center-focus-rail",items:7,filters:0,groups:[],actions:0,footer:0,motion:1 },
  "gallery-component-10": { intent:"wall",composition:"editorial-wall",preset:"interlocked-maker-wall",items:6,filters:0,groups:[],actions:1,footer:0,motion:0 },
};

const exact = (actual: number, expected: number, label: string, source: string) => { if (actual !== expected) throw new Error(`${source} requires exactly ${expected} ${label}.`); };
const nonempty = (value: unknown, label: string, source: string) => { if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`); };
const unique = (values: string[], label: string, source: string) => { if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`); };

function setPath(target: Record<string, unknown>, path: string, value: string, source: string) {
  const parts = path.split("."); let owner = target;
  for (const part of parts.slice(0, -1)) { const next = owner[part]; if (!next || typeof next !== "object" || Array.isArray(next)) throw new Error(`${source} stress references missing ${path}.`); owner = next as Record<string, unknown>; }
  const leaf = parts.at(-1)!; if (!(leaf in owner)) throw new Error(`${source} stress references missing ${path}.`); owner[leaf] = value;
}

function stressTarget(fixture: GalleryFixture, targetType: string, targetId: string) {
  if (targetType === "intro") return fixture.intro as unknown as Record<string, unknown>;
  if (targetType === "item") return fixture.items.find(({ id }) => id === targetId) as unknown as Record<string, unknown> | undefined;
  if (targetType === "filter") return fixture.filters.find(({ id }) => id === targetId) as unknown as Record<string, unknown> | undefined;
  if (targetType === "action") return fixture.actions.find(({ id }) => id === targetId) as unknown as Record<string, unknown> | undefined;
  if (targetType === "footer") return fixture.footerNote as unknown as Record<string, unknown> | undefined;
  if (targetType === "motion") return fixture.motion as unknown as Record<string, unknown> | undefined;
  if (targetType === "announcement") return fixture.announcements as unknown as Record<string, unknown>;
  if (targetType === "label") return fixture.labels[targetId as keyof GalleryFixture["labels"]] as unknown as Record<string, unknown> | undefined;
}

function applyStress(fixture: GalleryFixture, stress?: GalleryStressKey) {
  const active = structuredClone(fixture);
  if (!stress) return active;
  const definition = active.stress[stress]; if (!definition) throw new Error(`${active.sourceKey} misses stress ${stress}.`);
  for (const patch of definition.textPatches ?? []) { const target = stressTarget(active, patch.targetType, patch.targetId); if (!target) throw new Error(`${active.sourceKey} stress references unknown ${patch.targetType}/${patch.targetId}.`); setPath(target, patch.field, patch.value, active.sourceKey); }
  return active;
}

function validateMap(map: GalleryMediaMap) {
  const counts = map.counts;
  if (map.schemaVersion !== "1.0" || map.status !== "PASS" || map.placements.length !== 75 || map.identities.length !== 75) throw new Error("Gallery media map must be the resolved 75-seat PASS packet.");
  const expected = [counts.semanticSeats, counts.physicalIdentities, counts.photoSeats, counts.codeOwnedUiProofSeats, counts.reconciledSeats, counts.resolvedRasterSeats, counts.resolvedCodeOwnedSeats, counts.holdInfraRasterSeats, counts.missingUnlocalizedSeats];
  if (expected.join("/") !== "75/75/59/16/75/59/16/0/0") throw new Error("Gallery media counts drifted from 59 resolved photos / 16 code-owned proofs.");
  if (counts.providerCallsMade < 59 || counts.substitutionsUsed || counts.placeholdersUsed || counts.remoteAssets || counts.vendorAssets || counts.reusePlacements) throw new Error("Gallery media map loses provider evidence or admits a substitute, placeholder, remote, vendor or false reuse.");
  unique(map.placements.map(({ sourceKey, itemId }) => `${sourceKey}/${itemId}`), "media placements", "gallery-component");
  unique(map.identities.map(({ identityId }) => identityId), "media identities", "gallery-component");
}

function validateFixture(fixture: GalleryFixture, map: GalleryMediaMap) {
  const spec = EXPECTED[fixture.sourceKey];
  if (!spec || fixture.schemaVersion !== 1 || fixture.owner !== "Gallery") throw new Error(`Unknown Gallery fixture ${fixture.sourceKey}.`);
  if (fixture.intent !== spec.intent || fixture.composition !== spec.composition || fixture.preset !== spec.preset) throw new Error(`${fixture.sourceKey} differs from its closed D-M17 preset.`);
  exact(fixture.items.length, spec.items, "items", fixture.sourceKey); exact(fixture.filters.length, spec.filters, "filters", fixture.sourceKey); exact(fixture.actions.length, spec.actions, "actions", fixture.sourceKey);
  exact(fixture.footerNote ? 1 : 0, spec.footer, "footer notes", fixture.sourceKey); exact(fixture.motion ? 1 : 0, spec.motion, "motion owners", fixture.sourceKey);
  nonempty(fixture.intro.heading, "intro heading", fixture.sourceKey); nonempty(fixture.intro.body, "intro body", fixture.sourceKey);
  unique(fixture.items.map(({ id }) => id), "item IDs", fixture.sourceKey); unique(fixture.items.map(({ assetId }) => assetId), "physical item identities", fixture.sourceKey); unique(fixture.filters.map(({ id }) => id), "filter IDs", fixture.sourceKey); unique(fixture.actions.map(({ id }) => id), "action IDs", fixture.sourceKey);
  const itemIds = new Set(fixture.items.map(({ id }) => id));
  for (const item of fixture.items) { nonempty(item.alt, `${item.id} alt`, fixture.sourceKey); if (!/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(item.aspect) || item.focalPoint.x < 0 || item.focalPoint.x > 1 || item.focalPoint.y < 0 || item.focalPoint.y > 1) throw new Error(`${fixture.sourceKey}/${item.id} has invalid crop geometry.`); const placement = map.placements.find(({ sourceKey, itemId }) => sourceKey === fixture.sourceKey && itemId === item.id); const expectedStatus=item.mediaKind==="ui_project_proof"?"code-owned-ui-proof":"approved-generated-raster"; const identity=map.identities.find(({ identityId })=>identityId===item.assetId); if (!placement || !identity || placement.fixtureAssetId !== item.assetId || placement.mediaKind !== item.mediaKind || placement.status!==expectedStatus || identity.status!==expectedStatus || placement.desiredAspect !== item.aspect || placement.physicalIdentityId !== item.assetId || (item.mediaKind==="photo" && !identity.publicBase)) throw new Error(`${fixture.sourceKey}/${item.id} has no identity-exact resolved media placement.`); }
  for (const filter of fixture.filters) { nonempty(filter.label, `${filter.id} label`, fixture.sourceKey); unique(filter.itemIds, `${filter.id} items`, fixture.sourceKey); if (filter.itemIds.some((id) => !itemIds.has(id))) throw new Error(`${fixture.sourceKey}/${filter.id} references an unknown item.`); }
  if (fixture.filters.length && JSON.stringify(fixture.filters.map(({ itemIds }) => itemIds.length)) !== JSON.stringify(spec.groups)) throw new Error(`${fixture.sourceKey} has the wrong filter cardinalities.`);
  if (fixture.sourceKey === "gallery-component-07") { const bands = [1,2].map((band) => fixture.items.filter((item) => item.band === band).length); if (bands.join("/") !== "6/6") throw new Error("gallery-component-07 requires two six-item bands."); }
  for (const action of fixture.actions) if (!/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(action.href)) throw new Error(`${fixture.sourceKey}/${action.id} requires one local route.`);
  if (fixture.footerNote && !fixture.actions.some(({ id }) => id === fixture.footerNote?.actionId)) throw new Error(`${fixture.sourceKey} footer action is orphaned.`);
  if (fixture.motion && Object.values(fixture.motion).some((value) => !value.trim())) throw new Error(`${fixture.sourceKey} requires complete motion controls.`);
  for (const key of ["short", "longLocale", "mediaFallback"] as GalleryStressKey[]) if (!fixture.stress[key]) throw new Error(`${fixture.sourceKey} misses stress ${key}.`);
}

export function resolveGalleryFixture(fixture: GalleryFixture, map: GalleryMediaMap, stress?: GalleryStressKey): ResolvedGallery {
  validateMap(map); const active = applyStress(fixture, stress); validateFixture(active, map);
  const failedId = stress === "mediaFallback" ? active.stress.mediaFallback.itemId : undefined;
  const items = active.items.map((item) => { const placement = map.placements.find(({ sourceKey, itemId }) => sourceKey === active.sourceKey && itemId === item.id)!; const identity=map.identities.find(({identityId})=>identityId===placement.physicalIdentityId)!; return { ...item, seatId: placement.seatId, identityId: placement.physicalIdentityId, publicBase: identity.publicBase, mediaStatus: failedId === item.id ? "error" as const : placement.status === "code-owned-ui-proof" ? "code" as const : "raster" as const }; });
  return { ...active, items, itemsById: new Map(items.map((item) => [item.id, item])), activeStress: stress, terminalEligible: items.every(({ mediaStatus }) => mediaStatus !== "error") };
}
