export const FEATURE_SOURCE_KEYS = Array.from(
  { length: 32 },
  (_, index) => `features-section-${String(index + 1).padStart(2, "0")}`,
) as FeatureSourceKey[];

export const FEATURE_HOLD_SOURCE_KEYS = [] as const satisfies readonly FeatureSourceKey[];

export const FEATURE_RUNNABLE_SOURCE_KEYS = FEATURE_SOURCE_KEYS.filter(
  (sourceKey) => !(FEATURE_HOLD_SOURCE_KEYS as readonly string[]).includes(sourceKey),
);

export type FeatureSourceKey = `features-section-${
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08"
  | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16"
  | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24"
  | "25" | "26" | "27" | "28" | "29" | "30" | "31" | "32"}`;

export const CAPABILITY_PRESETS = [
  "icon-deck", "accordion-proof", "split-proof", "proof-deck", "switcher",
  "device-orbit", "integration-map", "alternating-proof", "portrait-proof",
  "proof-collage", "use-case-carousel", "product-spec", "report-stack",
  "globe-split", "globe-orbit",
] as const;
export type CapabilityPreset = (typeof CAPABILITY_PRESETS)[number];

export const STORY_PRESETS = ["process-deck", "scroll-scene", "device-scroll", "workflow-steps"] as const;
export type StoryPreset = (typeof STORY_PRESETS)[number];

export const FEATURE_BENTO_PRESETS = [
  "illustrated-feature-mosaic", "community-mosaic", "service-mosaic", "analytics-mosaic",
] as const;
export type FeatureBentoPreset = (typeof FEATURE_BENTO_PRESETS)[number];

export type FeatureIntro = { eyebrow?: string; title: string; body: string[]; actionIds: string[] };
export type FeatureItem = {
  id: string;
  title: string;
  body: string[];
  iconKey?: string;
  metricIds?: string[];
  surfaceIds?: string[];
  mediaSeatIds?: string[];
  actionIds: string[];
};
export type FeatureStep = FeatureItem & { progressLabel: string };
export type FeatureTile = FeatureItem;
export type FeatureAction = {
  id: string;
  ownerId: "intro" | string;
  kind: "navigate" | "select" | "previous" | "next" | "open-detail" | "pause";
  label: string;
  href?: `/${string}`;
  targetId?: string;
  emphasis?: "primary" | "secondary" | "utility";
};
export type FeatureControl = Omit<FeatureAction, "href" | "emphasis">;
export type FeatureSurface = {
  id: string;
  kind: "system-ui" | "chart" | "workflow" | "process" | "device" | "globe";
  title?: string;
  rowIds?: string[];
  dataIds?: string[];
};
export type FeatureMediaSeat = {
  id: string;
  role: "photo" | "portrait" | "poster" | "physical-3d" | "mark" | "vector-portrait" | "illustration";
  kind: "raster" | "three-d" | "vector";
  assetKey: string;
  alt: string;
  aspect: `${number}/${number}`;
  focalPoint?: { x: number; y: number };
  posterKey?: string;
};
export type FeatureMetric = { id: string; label: string; value: string; unit?: string };
export type FeatureCopy = {
  previousLabel: string; nextLabel: string; openLabel: string; closeLabel: string;
  pauseLabel: string; progressTemplate: string;
};
export type FeatureStressPatch = Partial<Omit<FeatureFixtureCore, "sourceKey" | "owner" | "preset" | "stress">>;

type FeatureFixtureCore = {
  schemaVersion: 1;
  sourceKey: FeatureSourceKey;
  intro?: FeatureIntro;
  items: FeatureItem[];
  steps: FeatureStep[];
  tiles: FeatureTile[];
  actions: FeatureAction[];
  controls: FeatureControl[];
  surfaces: FeatureSurface[];
  media: FeatureMediaSeat[];
  metrics: FeatureMetric[];
  initialSelectionId?: string;
  copy: FeatureCopy;
  announcements: Record<string, string>;
  stress: Record<string, FeatureStressPatch>;
};
export type CapabilityFixture = FeatureFixtureCore & { owner: "CapabilityDeck"; preset: CapabilityPreset };
export type StoryFixture = FeatureFixtureCore & { owner: "StoryPager"; preset: StoryPreset };
export type FeatureBentoFixture = FeatureFixtureCore & { owner: "Bento"; preset: FeatureBentoPreset };
export type FeatureFixture = CapabilityFixture | StoryFixture | FeatureBentoFixture;
export type ResolvedFeatureFixture = Omit<FeatureFixture, "stress"> & {
  stress: FeatureFixture["stress"];
  activeStress?: string;
  mediaBySeatId: ReadonlyMap<string, ResolvedFeatureMedia>;
};

export type FeatureMediaRecord = {
  slug: FeatureSourceKey;
  seatId: string;
  key: string;
  role: string;
  aspect: string;
  kind: "vector" | "raster" | "three-d";
  src: string;
  darkSrc?: string;
  publicBase?: string;
  status?: "accepted-original" | "accepted-reuse" | "resolved-deterministic";
  runtimeOwner?: "xp-media" | "xp-code-art";
};
export type ResolvedFeatureMedia = { seat: FeatureMediaSeat; record: FeatureMediaRecord; runtimeOwner: "xp-vector" | "xp-code-art" | "xp-media" };

type ExpectedTuple = {
  owner: FeatureFixture["owner"];
  preset: FeatureFixture["preset"];
  items: number; steps: number; tiles: number; actions: number; controls: number;
  surfaces: number; metrics: number; media: number;
};

const tuple = (owner:ExpectedTuple["owner"],preset:ExpectedTuple["preset"],values:number[]):ExpectedTuple => ({
  owner,preset,items:values[0],steps:values[1],tiles:values[2],actions:values[3],controls:values[4],surfaces:values[5],metrics:values[6],media:values[7],
});

export const FEATURE_EXPECTED: Record<FeatureSourceKey, ExpectedTuple> = {
  "features-section-01":tuple("CapabilityDeck","icon-deck",[6,0,0,1,0,0,0,0]),
  "features-section-02":tuple("CapabilityDeck","accordion-proof",[3,0,0,0,3,3,0,0]),
  "features-section-03":tuple("CapabilityDeck","split-proof",[4,0,0,0,0,1,0,0]),
  "features-section-04":tuple("Bento","illustrated-feature-mosaic",[0,0,5,7,0,0,0,5]),
  "features-section-05":tuple("CapabilityDeck","icon-deck",[4,0,0,1,0,0,4,0]),
  "features-section-06":tuple("CapabilityDeck","proof-deck",[3,0,0,0,0,3,0,0]),
  "features-section-07":tuple("CapabilityDeck","split-proof",[4,0,0,1,0,1,0,0]),
  "features-section-08":tuple("CapabilityDeck","icon-deck",[4,0,0,1,0,0,0,0]),
  "features-section-09":tuple("CapabilityDeck","switcher",[4,0,0,4,4,4,0,1]),
  "features-section-10":tuple("CapabilityDeck","proof-deck",[3,0,0,5,0,3,0,0]),
  "features-section-11":tuple("CapabilityDeck","device-orbit",[6,0,0,0,0,1,0,0]),
  "features-section-12":tuple("Bento","community-mosaic",[0,0,5,2,1,5,0,19]),
  "features-section-13":tuple("CapabilityDeck","icon-deck",[6,0,0,1,0,0,0,0]),
  "features-section-14":tuple("CapabilityDeck","integration-map",[7,0,0,0,0,4,0,10]),
  "features-section-15":tuple("CapabilityDeck","switcher",[4,0,0,1,4,4,0,0]),
  "features-section-16":tuple("CapabilityDeck","proof-deck",[3,0,0,3,0,3,0,0]),
  "features-section-17":tuple("CapabilityDeck","alternating-proof",[2,0,0,0,0,2,0,0]),
  "features-section-18":tuple("CapabilityDeck","portrait-proof",[3,0,0,1,0,3,0,1]),
  "features-section-19":tuple("CapabilityDeck","proof-collage",[4,0,0,1,0,6,0,0]),
  "features-section-20":tuple("CapabilityDeck","split-proof",[3,0,0,1,0,1,0,0]),
  "features-section-21":tuple("Bento","service-mosaic",[0,0,4,2,4,0,9,6]),
  "features-section-22":tuple("Bento","analytics-mosaic",[0,0,5,2,1,5,2,6]),
  "features-section-23":tuple("StoryPager","process-deck",[0,4,0,2,2,4,0,0]),
  "features-section-24":tuple("StoryPager","scroll-scene",[0,4,0,2,2,4,0,0]),
  "features-section-25":tuple("StoryPager","device-scroll",[0,5,0,0,7,1,0,0]),
  "features-section-26":tuple("StoryPager","workflow-steps",[0,3,0,0,5,1,0,7]),
  "features-section-27":tuple("CapabilityDeck","switcher",[3,0,0,3,3,0,0,3]),
  "features-section-28":tuple("CapabilityDeck","use-case-carousel",[5,0,0,5,7,0,0,5]),
  "features-section-29":tuple("CapabilityDeck","product-spec",[4,0,0,4,4,0,6,1]),
  "features-section-30":tuple("CapabilityDeck","report-stack",[3,0,0,0,6,3,0,0]),
  "features-section-31":tuple("CapabilityDeck","globe-split",[4,0,0,5,0,1,2,0]),
  "features-section-32":tuple("CapabilityDeck","globe-orbit",[4,0,0,0,0,1,0,0]),
};

const text = (value:unknown,label:string,source:string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const unique = (values:string[],label:string,source:string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const assertRefs = (actual:string[],allowed:Set<string>,label:string,source:string) => {
  for (const id of actual) if (!allowed.has(id)) throw new Error(`${source} references unknown ${label} ${id}.`);
};

function mergeKnown(base:unknown,patch:unknown,source:string,path="fixture"):unknown {
  if (patch === undefined) return structuredClone(base);
  if (Array.isArray(base) && Array.isArray(patch)) {
    if (!base.every((item) => item && typeof item === "object" && "id" in item)) return structuredClone(patch);
    const byId = new Map(base.map((item) => [String((item as { id:string }).id),item]));
    for (const entry of patch) {
      if (!entry || typeof entry !== "object" || !("id" in entry) || !byId.has(String(entry.id))) throw new Error(`${source} stress patch references unknown structural ID at ${path}.`);
      byId.set(String(entry.id),mergeKnown(byId.get(String(entry.id)),entry,source,`${path}.${String(entry.id)}`));
    }
    return base.map((entry) => byId.get(String((entry as { id:string }).id)));
  }
  if (base && patch && typeof base === "object" && typeof patch === "object" && !Array.isArray(patch)) {
    const result = structuredClone(base) as Record<string,unknown>;
    for (const [key,value] of Object.entries(patch)) {
      if (!(key in result) && !(path==="fixture"&&key==="initialSelectionId")) throw new Error(`${source} stress patch introduces unknown key ${path}.${key}.`);
      result[key] = mergeKnown(result[key],value,source,`${path}.${key}`);
    }
    return result;
  }
  return structuredClone(patch);
}

function validateFixture(fixture:FeatureFixture) {
  const expected = FEATURE_EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown feature source ${fixture.sourceKey}.`);
  if (fixture.owner !== expected.owner || fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} has the wrong owner or preset.`);
  const actual = [fixture.items.length,fixture.steps.length,fixture.tiles.length,fixture.actions.length,fixture.controls.length,fixture.surfaces.length,fixture.metrics.length,fixture.media.length];
  const wanted = [expected.items,expected.steps,expected.tiles,expected.actions,expected.controls,expected.surfaces,expected.metrics,expected.media];
  if (actual.join("|") !== wanted.join("|")) throw new Error(`${fixture.sourceKey} inventory tuple mismatch: ${actual.join("/")} != ${wanted.join("/")}.`);
  const content = [...fixture.items,...fixture.steps,...fixture.tiles];
  const contentIds = content.map(({id}) => id);
  const actionIds = fixture.actions.map(({id}) => id);
  const controlIds = fixture.controls.map(({id}) => id);
  const surfaceIds = fixture.surfaces.map(({id}) => id);
  const mediaIds = fixture.media.map(({id}) => id);
  const metricIds = fixture.metrics.map(({id}) => id);
  for (const [ids,label] of [[contentIds,"content IDs"],[actionIds,"action IDs"],[controlIds,"control IDs"],[surfaceIds,"surface IDs"],[mediaIds,"media IDs"],[metricIds,"metric IDs"]] as const) unique(ids,label,fixture.sourceKey);
  fixture.intro?.body.forEach((line,index) => text(line,`intro body ${index + 1}`,fixture.sourceKey));
  const surfaceKinds=new Set(["system-ui","chart","workflow","process","device","globe"]);
  for(const surface of fixture.surfaces)if(!surfaceKinds.has(surface.kind))throw new Error(`${fixture.sourceKey} has invalid code surface kind ${surface.kind}.`);
  const mediaKinds=new Set(["raster","three-d","vector"]);
  for(const seat of fixture.media)if(!mediaKinds.has(seat.kind)||/^https?:/i.test(seat.assetKey))throw new Error(`${fixture.sourceKey} has invalid media seat ${seat.id}.`);
  for (const entry of content) {
    text(entry.title,`${entry.id} title`,fixture.sourceKey);
    entry.body.forEach((line,index) => text(line,`${entry.id} body ${index + 1}`,fixture.sourceKey));
    assertRefs(entry.actionIds,new Set(actionIds),"action",fixture.sourceKey);
    assertRefs(entry.surfaceIds ?? [],new Set(surfaceIds),"surface",fixture.sourceKey);
    assertRefs(entry.mediaSeatIds ?? [],new Set(mediaIds),"media seat",fixture.sourceKey);
    assertRefs(entry.metricIds ?? [],new Set(metricIds),"metric",fixture.sourceKey);
  }
  assertRefs(fixture.intro?.actionIds ?? [],new Set(actionIds),"intro action",fixture.sourceKey);
  const ownerIds = new Set(["intro",...contentIds]);
  for (const action of fixture.actions) {
    text(action.label,`${action.id} label`,fixture.sourceKey);
    if (!ownerIds.has(action.ownerId)) throw new Error(`${fixture.sourceKey} action ${action.id} has unknown owner ${action.ownerId}.`);
    if (action.kind === "navigate" && (!action.href || !action.href.startsWith("/"))) throw new Error(`${fixture.sourceKey} action ${action.id} requires a local route.`);
  }
  const selectable = new Set(contentIds);
  for (const control of fixture.controls) {
    text(control.label,`${control.id} label`,fixture.sourceKey);
    if (control.targetId && !selectable.has(control.targetId)) throw new Error(`${fixture.sourceKey} control ${control.id} has invalid target.`);
  }
  if (fixture.initialSelectionId && !selectable.has(fixture.initialSelectionId)) throw new Error(`${fixture.sourceKey} has invalid initial selection.`);
  if (["accordion-proof","switcher","use-case-carousel","product-spec","report-stack","process-deck","scroll-scene","device-scroll","workflow-steps"].includes(fixture.preset) && !fixture.initialSelectionId) throw new Error(`${fixture.sourceKey} requires initialSelectionId.`);
  if (fixture.owner === "CapabilityDeck" && (fixture.steps.length || fixture.tiles.length)) throw new Error(`${fixture.sourceKey} leaks non-capability content.`);
  if (fixture.owner === "StoryPager" && (fixture.items.length || fixture.tiles.length)) throw new Error(`${fixture.sourceKey} leaks non-story content.`);
  if (fixture.owner === "Bento" && (fixture.items.length || fixture.steps.length)) throw new Error(`${fixture.sourceKey} leaks non-bento content.`);
}

export function resolveFeatureFixture(fixture:FeatureFixture,stress:string|undefined,mediaRecords:FeatureMediaRecord[] = []):ResolvedFeatureFixture {
  validateFixture(fixture);
  const resolved = stress && fixture.stress[stress]
    ? mergeKnown(fixture,fixture.stress[stress],fixture.sourceKey) as FeatureFixture
    : structuredClone(fixture);
  validateFixture(resolved);
  const records = new Map(mediaRecords.map((record) => [`${record.slug}:${record.seatId}`,record]));
  const mediaBySeatId = new Map<string,ResolvedFeatureMedia>();
  for (const seat of resolved.media) {
    const record = records.get(`${resolved.sourceKey}:${seat.id}`);
    if (!record || record.key !== seat.assetKey || record.role !== seat.role || record.aspect !== seat.aspect || record.kind !== seat.kind || !record.src.startsWith("/media/")) throw new Error(`${resolved.sourceKey} cannot resolve media ${seat.id}.`);
    if (seat.kind === "vector") {
      mediaBySeatId.set(seat.id,{seat,record,runtimeOwner:"xp-vector"});
    } else if (resolved.sourceKey === "features-section-21" && seat.role === "poster") {
      if (record.runtimeOwner !== "xp-code-art" || record.status !== "resolved-deterministic") throw new Error(`${resolved.sourceKey} poster ${seat.id} is not deterministic code art.`);
      mediaBySeatId.set(seat.id,{seat,record,runtimeOwner:"xp-code-art"});
    } else {
      if (!record.publicBase?.startsWith("/media/") || !["accepted-original","accepted-reuse"].includes(record.status ?? "")) throw new Error(`${resolved.sourceKey} has unresolved physical media ${seat.id}.`);
      mediaBySeatId.set(seat.id,{seat,record,runtimeOwner:"xp-media"});
    }
  }
  return {...resolved,activeStress:stress,mediaBySeatId} as ResolvedFeatureFixture;
}

export function assertFeatureRegistry(fixtures:FeatureFixture[]) {
  if (fixtures.map(({sourceKey}) => sourceKey).join("|") !== FEATURE_SOURCE_KEYS.join("|")) throw new Error("Feature fixtures drift from source order.");
  const counts = fixtures.reduce<Record<string,number>>((result,{owner}) => ({...result,[owner]:(result[owner] ?? 0) + 1}),{});
  if (counts.CapabilityDeck !== 24 || counts.StoryPager !== 4 || counts.Bento !== 4) throw new Error("Feature owner counts must be 24/4/4.");
}
