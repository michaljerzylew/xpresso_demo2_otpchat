export const ABOUT_US_SOURCE_KEYS = Array.from({ length: 24 }, (_, index) =>
  `about-us-page-${String(index + 1).padStart(2, "0")}`,
) as AboutUsSourceKey[];

export type AboutUsSourceKey = `about-us-page-${string}`;
export type AboutUsOwner = "ProofBand" | "StorySplit" | "MockShowcase" | "BentoGrid" | "CapabilityDeck";
export type AboutUsMediaRole = "photo" | "portrait" | "identity-mark" | "system-ui";

export type StoryIntro = { eyebrow?: string; title: string; body?: string[]; actionIds?: string[] };
export type StoryAction = {
  id: string;
  label: string;
  ownerId: string;
  kind: "navigate" | "open-detail" | "invoke";
  emphasis: "primary" | "secondary" | "peer";
  href?: string;
  targetId?: string;
  resultTitle?: string;
  resultBody?: string;
};
export type StoryMediaSeat = {
  id: string;
  role: AboutUsMediaRole;
  mediaKey: string;
  identityId: string;
  alt: string;
  aspect: "1:1" | "3:2" | "4:3" | "4:5" | "16:9";
};
export type StoryMetric = { id: string; label: string; value: string; detail?: string };
export type StoryIdentity = { id: string; name: string; role: string; mediaSeatId: string };
export type StoryFeature = {
  id: string;
  title: string;
  description?: string;
  bullets?: string[];
  iconKey?: string;
  mediaSeatIds?: string[];
  actionIds?: string[];
  tagIds?: string[];
};
export type StoryPanel = {
  id: string;
  title?: string;
  body?: string[];
  featureIds?: string[];
  metricIds?: string[];
  mediaSeatIds?: string[];
  actionIds?: string[];
};
export type StoryControl = { id: string; ownerId: string; label: string; kind: "rail-previous" | "rail-next" };
export type StorySystemRecord = {
  id: string;
  kind: "metric" | "table-row" | "chart-point" | "progress";
  label: string;
  value?: string;
  detail?: string;
  progress?: number;
  values?: Record<string, number>;
};
export type StorySystemControl =
  | { id: string; kind: "menu"; label: string; commands: string[] }
  | { id: string; kind: "select"; label: string; optionIds: string[]; selectedId: string }
  | { id: string; kind: "toggle-set"; label: string; optionIds: string[]; selectedIds: string[] };
export type StorySystemSurface = {
  id: string;
  kind: "chart" | "metric" | "table" | "business-card" | "progress-list" | "plan-picker";
  title: string;
  recordIds: string[];
  actionIds?: string[];
};
export type StorySystemView = { id: string; label: string; surfaces: StorySystemSurface[]; controls: StorySystemControl[] };

export type AboutUsExtension =
  | { kind: "none" }
  | { kind: "tabbed-principles"; tabs: Array<{ id: string; label: string; panelId: string }>; panels: StoryPanel[]; initialPanelId: string }
  | { kind: "system-ui"; views: StorySystemView[]; initialViewId: string; compactExportKey: string; inspectActionId: string }
  | { kind: "community-proof"; tagIds: string[]; ratingIdentityIds: string[] }
  | { kind: "manual-story-rail"; itemIds: string[]; initialItemId: string }
  | { kind: "portrait-field"; identityIds: string[] }
  | { kind: "profile-toolkit"; profileIdentityId: string; toolIdentityIds: string[] }
  | { kind: "group-pager"; groups: Array<{ id: string; itemIds: string[] }>; initialGroupId: string; initialItemId: string };

export type AboutUsFixtureCore = {
  schemaVersion: string;
  sourceKey: AboutUsSourceKey;
  owner: AboutUsOwner;
  preset: string;
  intro: StoryIntro;
  actions: StoryAction[];
  media: StoryMediaSeat[];
  identities: StoryIdentity[];
  metrics: StoryMetric[];
  features: StoryFeature[];
  panels: StoryPanel[];
  controls: StoryControl[];
  tags: Array<{ id: string; label: string }>;
  systemRecords: StorySystemRecord[];
  extension: AboutUsExtension;
  announcements: Record<string, string>;
};
export type AboutUsFixture = AboutUsFixtureCore & { stress: Record<string, Record<string, unknown>> };

export type AboutUsMediaRecord = {
  slug: AboutUsSourceKey;
  seatId: string;
  key: string;
  mediaKey: string;
  role: AboutUsMediaRole;
  identityId: string;
  alt: string;
  aspect: StoryMediaSeat["aspect"];
  kind: "responsive-image" | "avatar" | "vector" | "system-ui";
  publicBase?: string;
  src?: string;
  darkSrc?: string;
  presentation?: string;
};
export type ResolvedAboutUsMedia = AboutUsMediaRecord & { seat: StoryMediaSeat };
export type ResolvedAboutUsFixture = AboutUsFixtureCore & {
  activeStress?: string;
  mediaBySeatId: ReadonlyMap<string, ResolvedAboutUsMedia>;
};

type Expected = {
  owner: AboutUsOwner;
  preset: string;
  actions: number;
  media: number;
  features: number;
  metrics: number;
  identities: number;
  panels: number;
  controls: number;
  tags: number;
  systemRecords: number;
};

const EXPECTED: Record<AboutUsSourceKey, Expected> = {
  "about-us-page-01": { owner:"ProofBand",preset:"founding-proof",actions:1,media:1,features:0,metrics:4,identities:1,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-02": { owner:"BentoGrid",preset:"destination-bento",actions:3,media:2,features:2,metrics:2,identities:2,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-03": { owner:"StorySplit",preset:"principles-tabs",actions:1,media:2,features:0,metrics:0,identities:2,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-04": { owner:"StorySplit",preset:"image-tabs",actions:4,media:3,features:0,metrics:0,identities:3,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-05": { owner:"CapabilityDeck",preset:"interface-capabilities",actions:0,media:3,features:3,metrics:0,identities:3,panels:0,controls:2,tags:0,systemRecords:0 },
  "about-us-page-06": { owner:"BentoGrid",preset:"collage-stat-bento",actions:1,media:3,features:0,metrics:4,identities:3,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-07": { owner:"ProofBand",preset:"proof-reasons",actions:1,media:1,features:3,metrics:4,identities:1,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-08": { owner:"MockShowcase",preset:"product-proof",actions:2,media:1,features:0,metrics:4,identities:1,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-09": { owner:"StorySplit",preset:"editorial-proof",actions:1,media:7,features:4,metrics:4,identities:7,panels:1,controls:2,tags:0,systemRecords:0 },
  "about-us-page-10": { owner:"StorySplit",preset:"achievement-checklist",actions:1,media:1,features:5,metrics:0,identities:1,panels:1,controls:0,tags:0,systemRecords:0 },
  "about-us-page-11": { owner:"StorySplit",preset:"trust-story",actions:2,media:11,features:0,metrics:0,identities:11,panels:1,controls:4,tags:0,systemRecords:0 },
  "about-us-page-12": { owner:"ProofBand",preset:"portrait-overlap",actions:1,media:1,features:0,metrics:0,identities:1,panels:1,controls:0,tags:0,systemRecords:0 },
  "about-us-page-13": { owner:"MockShowcase",preset:"community-proof-bento",actions:1,media:8,features:5,metrics:2,identities:8,panels:0,controls:0,tags:6,systemRecords:0 },
  "about-us-page-14": { owner:"StorySplit",preset:"kinetic-selfie",actions:2,media:1,features:0,metrics:0,identities:1,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-15": { owner:"StorySplit",preset:"paired-stories",actions:2,media:2,features:0,metrics:4,identities:2,panels:2,controls:0,tags:0,systemRecords:0 },
  "about-us-page-16": { owner:"StorySplit",preset:"manual-story-rail",actions:2,media:3,features:6,metrics:0,identities:3,panels:0,controls:2,tags:0,systemRecords:0 },
  "about-us-page-17": { owner:"StorySplit",preset:"services-expert",actions:2,media:2,features:4,metrics:1,identities:2,panels:1,controls:0,tags:0,systemRecords:0 },
  "about-us-page-18": { owner:"ProofBand",preset:"portrait-stat-proof",actions:1,media:3,features:0,metrics:3,identities:3,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-19": { owner:"StorySplit",preset:"ratings-metrics",actions:2,media:6,features:0,metrics:0,identities:6,panels:1,controls:0,tags:0,systemRecords:6 },
  "about-us-page-20": { owner:"StorySplit",preset:"portrait-field",actions:1,media:7,features:0,metrics:0,identities:7,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-21": { owner:"MockShowcase",preset:"paired-product-dialogues",actions:2,media:2,features:2,metrics:0,identities:2,panels:0,controls:0,tags:0,systemRecords:4 },
  "about-us-page-22": { owner:"StorySplit",preset:"profile-toolkit",actions:13,media:11,features:1,metrics:0,identities:11,panels:0,controls:0,tags:0,systemRecords:0 },
  "about-us-page-23": { owner:"MockShowcase",preset:"four-view-dashboard",actions:4,media:2,features:0,metrics:0,identities:2,panels:0,controls:0,tags:0,systemRecords:38 },
  "about-us-page-24": { owner:"StorySplit",preset:"group-pager",actions:0,media:0,features:9,metrics:0,identities:0,panels:3,controls:2,tags:0,systemRecords:0 },
};

const TOP_LEVEL_KEYS = new Set(["intro", "actions", "media", "identities", "metrics", "features", "panels", "controls", "tags", "systemRecords", "extension", "announcements"]);
const text = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};

function merge(base: unknown, patch: unknown, source: string): unknown {
  if (patch === undefined) return base;
  if (Array.isArray(base) && Array.isArray(patch)) {
    const structural = base.every((item) => item && typeof item === "object" && "id" in item);
    if (!structural) return structuredClone(patch);
    const byId = new Map(base.map((item) => [String((item as { id: string }).id), item]));
    for (const item of patch) {
      if (!item || typeof item !== "object" || !("id" in item) || !byId.has(String(item.id))) throw new Error(`${source} stress patch references an unknown structural ID.`);
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

function structuralSignature(fixture: AboutUsFixtureCore) {
  return JSON.stringify({
    sourceKey: fixture.sourceKey, owner: fixture.owner, preset: fixture.preset,
    actions: fixture.actions.map(({ id, kind, href, targetId }) => ({ id, kind, href, targetId })),
    media: fixture.media.map(({ id, role, mediaKey, identityId, aspect }) => ({ id, role, mediaKey, identityId, aspect })),
    identities: fixture.identities.map(({ id, mediaSeatId }) => ({ id, mediaSeatId })),
    metrics: fixture.metrics.map(({ id }) => id), features: fixture.features.map(({ id, mediaSeatIds, actionIds, tagIds }) => ({ id, mediaSeatIds, actionIds, tagIds })),
    panels: fixture.panels.map(({ id, featureIds, metricIds, mediaSeatIds, actionIds }) => ({ id, featureIds, metricIds, mediaSeatIds, actionIds })),
    controls: fixture.controls.map(({ id, ownerId, kind }) => ({ id, ownerId, kind })), tags: fixture.tags.map(({ id }) => id),
    systemRecords: fixture.systemRecords.map(({ id, kind }) => ({ id, kind })), extension: extensionSignature(fixture.extension),
  });
}

function extensionSignature(extension: AboutUsExtension): unknown {
  if (extension.kind === "tabbed-principles") return { kind:extension.kind,tabs:extension.tabs.map(({id,panelId})=>({id,panelId})),panels:extension.panels.map(({id,mediaSeatIds,actionIds})=>({id,mediaSeatIds,actionIds})) };
  if (extension.kind === "system-ui") return { kind:extension.kind,views:extension.views.map((view)=>({id:view.id,surfaces:view.surfaces.map(({id,kind,recordIds,actionIds})=>({id,kind,recordIds,actionIds})),controls:view.controls.map(({id,kind})=>({id,kind}))})) };
  if (extension.kind === "community-proof") return { kind:extension.kind,tagIds:extension.tagIds,ratingIdentityIds:extension.ratingIdentityIds };
  if (extension.kind === "manual-story-rail") return { kind:extension.kind,itemIds:extension.itemIds };
  if (extension.kind === "portrait-field") return { kind:extension.kind,identityIds:extension.identityIds };
  if (extension.kind === "profile-toolkit") return { kind:extension.kind,profileIdentityId:extension.profileIdentityId,toolIdentityIds:extension.toolIdentityIds };
  if (extension.kind === "group-pager") return { kind:extension.kind,groups:extension.groups };
  return { kind:"none" };
}

function references(fixture: AboutUsFixtureCore) {
  return [
    ...fixture.identities.map(({ mediaSeatId }) => mediaSeatId),
    ...fixture.features.flatMap(({ mediaSeatIds = [] }) => mediaSeatIds),
    ...fixture.panels.flatMap(({ mediaSeatIds = [] }) => mediaSeatIds),
    ...(fixture.extension.kind === "tabbed-principles" ? fixture.extension.panels.flatMap(({ mediaSeatIds = [] }) => mediaSeatIds) : []),
  ];
}

function validateCore(fixture: AboutUsFixtureCore) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown About Us source ${fixture.sourceKey}.`);
  if (fixture.owner !== expected.owner || fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} has the wrong public owner or preset.`);
  const actual = [fixture.actions.length,fixture.media.length,fixture.features.length,fixture.metrics.length,fixture.identities.length,fixture.panels.length,fixture.controls.length,fixture.tags.length,fixture.systemRecords.length];
  const wanted = [expected.actions,expected.media,expected.features,expected.metrics,expected.identities,expected.panels,expected.controls,expected.tags,expected.systemRecords];
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${fixture.sourceKey} drifts from its exact action/media/content inventory.`);
  text(fixture.intro.title, "intro title", fixture.sourceKey);
  fixture.intro.body?.forEach((line, index) => text(line, `intro body ${index + 1}`, fixture.sourceKey));
  const collections: Array<[string, Array<{ id: string }>]> = [["actions",fixture.actions],["media",fixture.media],["identities",fixture.identities],["metrics",fixture.metrics],["features",fixture.features],["panels",fixture.panels],["controls",fixture.controls],["tags",fixture.tags],["system records",fixture.systemRecords]];
  collections.forEach(([label, items]) => unique(items.map(({ id }) => id), `${label} IDs`, fixture.sourceKey));
  const ownerIds = new Set(["intro",...fixture.features.map(({id})=>id),...fixture.panels.map(({id})=>id)]);
  if (fixture.extension.kind === "tabbed-principles") fixture.extension.panels.forEach(({ id }) => ownerIds.add(id));
  if (fixture.extension.kind === "system-ui") fixture.extension.views.forEach((view) => { ownerIds.add(view.id); view.surfaces.forEach(({id})=>ownerIds.add(id)); });
  for (const action of fixture.actions) {
    text(action.label, `action ${action.id} label`, fixture.sourceKey);
    if (!ownerIds.has(action.ownerId)) throw new Error(`${fixture.sourceKey} action ${action.id} has an unresolved owner ${action.ownerId}.`);
    if (action.kind === "navigate") {
      if (!action.href || !/^\/demo\//.test(action.href) || action.href.includes("#") || /^(?:https?:)?\/\//i.test(action.href)) throw new Error(`${fixture.sourceKey} action ${action.id} requires a safe local demo href.`);
    } else if (action.href !== undefined) throw new Error(`${fixture.sourceKey} action ${action.id} cannot own href.`);
  }
  const mediaIds = new Set(fixture.media.map(({ id }) => id));
  const identityIds = new Set(fixture.identities.map(({ id }) => id));
  for (const seat of fixture.media) {
    text(seat.mediaKey, `media ${seat.id} key`, fixture.sourceKey); text(seat.alt, `media ${seat.id} alt`, fixture.sourceKey);
    if (!identityIds.has(seat.identityId)) throw new Error(`${fixture.sourceKey} media ${seat.id} has an unresolved identity.`);
  }
  for (const ref of references(fixture)) if (!mediaIds.has(ref)) throw new Error(`${fixture.sourceKey} references unknown media ${ref}.`);
  for (const seat of fixture.media) if (!references(fixture).includes(seat.id)) throw new Error(`${fixture.sourceKey} leaves media ${seat.id} unowned.`);
  const actionIds = new Set(fixture.actions.map(({id})=>id));
  const featureIds = new Set(fixture.features.map(({id})=>id));
  const metricIds = new Set(fixture.metrics.map(({id})=>id));
  const tagIds = new Set(fixture.tags.map(({id})=>id));
  const checkRefs = (ids: string[] | undefined, known: Set<string>, label: string) => ids?.forEach((id)=>{if(!known.has(id)) throw new Error(`${fixture.sourceKey} has unknown ${label} ${id}.`);});
  checkRefs(fixture.intro.actionIds,actionIds,"action");
  fixture.features.forEach((feature)=>{ checkRefs(feature.actionIds,actionIds,"action"); checkRefs(feature.tagIds,tagIds,"tag"); });
  fixture.panels.forEach((panel)=>{ checkRefs(panel.actionIds,actionIds,"action"); checkRefs(panel.featureIds,featureIds,"feature"); checkRefs(panel.metricIds,metricIds,"metric"); });
  if (fixture.extension.kind === "tabbed-principles") {
    const panelIds = new Set(fixture.extension.panels.map(({id})=>id));
    if (!panelIds.has(fixture.extension.initialPanelId)) throw new Error(`${fixture.sourceKey} has an invalid initial panel.`);
    fixture.extension.tabs.forEach(({panelId})=>{if(!panelIds.has(panelId)) throw new Error(`${fixture.sourceKey} tab has an invalid panel.`);});
    fixture.extension.panels.forEach((panel)=>checkRefs(panel.actionIds,actionIds,"action"));
  }
  if (fixture.extension.kind === "system-ui") {
    const records = new Set([...fixture.systemRecords.map(({id})=>id), ...fixture.metrics.map(({id})=>id)]);
    const views = new Set(fixture.extension.views.map(({id})=>id));
    if (!views.has(fixture.extension.initialViewId)) throw new Error(`${fixture.sourceKey} has an invalid initial system view.`);
    fixture.extension.views.forEach((view)=>view.surfaces.forEach((surface)=>{checkRefs(surface.recordIds,records,"system record");checkRefs(surface.actionIds,actionIds,"action");}));
    if (fixture.sourceKey === "about-us-page-23") {
      if (fixture.extension.views.length !== 4 || fixture.systemRecords.filter(({kind})=>kind==="chart-point").length !== 7 || fixture.systemRecords.filter(({kind})=>kind==="progress").length !== 4) throw new Error(`${fixture.sourceKey} drifts from the exact four-view dashboard inventory.`);
      const menus = fixture.extension.views.flatMap(({controls})=>controls).filter((control)=>control.kind==="menu");
      if (menus.some(({commands})=>commands.length!==3)) throw new Error(`${fixture.sourceKey} menus require exactly three commands.`);
    }
  }
  if (fixture.sourceKey === "about-us-page-20" && fixture.identities.length !== 7) throw new Error(`${fixture.sourceKey} requires seven portrait identities.`);
  if (fixture.sourceKey === "about-us-page-24" && (fixture.extension.kind !== "group-pager" || fixture.extension.groups.length !== 3 || fixture.extension.groups.some(({itemIds})=>itemIds.length!==3))) throw new Error(`${fixture.sourceKey} requires a 3 by 3 group pager.`);
  for (const value of Object.values(fixture.announcements)) text(value, "announcement", fixture.sourceKey);
}

function coreOf(raw: AboutUsFixture): AboutUsFixtureCore {
  const { stress: _stress, ...core } = raw;
  return core;
}

export function resolveAboutUsFixture(raw: AboutUsFixture, stress?: string, records: AboutUsMediaRecord[] = []): ResolvedAboutUsFixture {
  if (!raw || typeof raw !== "object") throw new Error("About Us fixture must be an object.");
  const base = coreOf(raw);
  validateCore(base);
  for (const required of ["short","longLocale","error"]) if (!raw.stress?.[required]) throw new Error(`${raw.sourceKey} requires ${required} stress.`);
  for (const [name, patch] of Object.entries(raw.stress)) {
    for (const key of Object.keys(patch)) if (!TOP_LEVEL_KEYS.has(key)) throw new Error(`${raw.sourceKey} stress ${name} contains unsupported key ${key}.`);
    const candidate = merge(base, patch, raw.sourceKey) as AboutUsFixtureCore;
    validateCore(candidate);
    if (structuralSignature(candidate) !== structuralSignature(base)) throw new Error(`${raw.sourceKey} stress ${name} changes structural ownership.`);
  }
  const requestedPatch = stress ? raw.stress[stress] ?? (()=>{throw new Error(`${raw.sourceKey} does not declare stress ${stress}.`);})() : undefined;
  // Error stress represents failed media/system UI, not failed story content. Keep the
  // complete source job mounted so renderers can degrade only the affected seats.
  const active = requestedPatch && stress !== "error" ? merge(base, requestedPatch, raw.sourceKey) as AboutUsFixtureCore : base;
  const mediaBySeatId = new Map<string, ResolvedAboutUsMedia>();
  for (const seat of active.media) {
    const record = records.find((candidate)=>candidate.slug===active.sourceKey && candidate.seatId===seat.id && candidate.key===seat.mediaKey);
    if (!record) throw new Error(`${active.sourceKey}/${seat.id} cannot resolve its exact media record.`);
    if (record.role!==seat.role || record.identityId!==seat.identityId || record.alt!==seat.alt || record.aspect!==seat.aspect) throw new Error(`${active.sourceKey}/${seat.id} media metadata drifts.`);
    if (record.kind === "responsive-image" || record.kind === "avatar") {
      if (!record.publicBase?.startsWith("/media/") || record.publicBase === seat.mediaKey) throw new Error(`${active.sourceKey}/${seat.id} requires a local raster base, not an asset key URL.`);
    } else if (record.kind === "vector") {
      if (!record.src?.startsWith("/media/") || !record.darkSrc?.startsWith("/media/")) throw new Error(`${active.sourceKey}/${seat.id} requires local light and dark vectors.`);
    } else if (record.presentation !== "runtime") throw new Error(`${active.sourceKey}/${seat.id} system UI must remain runtime code.`);
    mediaBySeatId.set(seat.id,{...record,seat});
  }
  return Object.freeze({...active,activeStress:stress,mediaBySeatId});
}

export function aboutUsOwnerFor(sourceKey: AboutUsSourceKey) { return EXPECTED[sourceKey]?.owner; }
