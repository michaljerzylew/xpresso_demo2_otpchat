export const PORTFOLIO_SOURCE_KEYS = [
  "portfolio-01","portfolio-02","portfolio-03","portfolio-04","portfolio-05","portfolio-06",
  "portfolio-07","portfolio-08","portfolio-09","portfolio-10","portfolio-11","portfolio-12",
  "portfolio-13","portfolio-14","portfolio-15","portfolio-16","portfolio-17","portfolio-18",
] as const;

export type PortfolioSourceKey = (typeof PORTFOLIO_SOURCE_KEYS)[number];
export type ShowcaseComposition = "wall" | "rail" | "case" | "capability" | "featured" | "accordion";
export type ShowcasePreset =
  | "gallery-detail" | "proof-cards" | "filtered-cards" | "staggered-wall"
  | "filtered-bento" | "filtered-snap" | "spotlight-rail" | "filtered-summaries"
  | "capability-collage" | "split-pair" | "alternating-studies" | "manual-coverflow"
  | "featured-related" | "project-trio" | "category-browser" | "pastel-grid"
  | "project-resume" | "preview-grid";

export type ShowcaseAction = {
  id: string;
  ownerId: string;
  label: string;
  kind: "navigate" | "share" | "contact" | "open-detail" | "open-preview" | "open-tool";
  emphasis: "primary" | "secondary" | "peer" | "quiet";
  href: `/demo/${string}`;
};

export type ShowcaseVisualRef =
  | { id: string; identityId: string; role: "photo" | "project-cover" | "illustration"; assetKey: string; alt: string; aspect: "1:1" | "4:5" | "3:2" | "4:3" | "16:10" | "16:9"; focalPoint?: string }
  | { id: string; identityId: string; role: "identity-mark"; assetKey: string; alt: string; presentation: "symbol" | "wordmark" | "combination" }
  | { id: string; identityId: string; role: "system-ui"; surfaceId: string; alt: string }
  | { id: string; identityId: string; role: "system-icon"; systemIconKey: string; alt: string };

export type ShowcaseProject = {
  id: string;
  title: string;
  summary?: string;
  categoryIds: string[];
  mediaSeatIds: string[];
  actionIds: string[];
  meta: Array<{ id: string; label: string; value: string }>;
  tags: Array<{ id: string; label: string }>;
  detail?: { body: string[]; featureIds: string[]; toolActionIds: string[] };
};

export type ShowcaseFeature = { id: string; title: string; description: string; systemIconSeatId?: string };
export type ShowcaseTaxonomy = {
  categories: Array<{ id: string; label: string }>;
  initialCategoryId: string;
  allCategoryId?: string;
};
export type ShowcaseExtension =
  | { kind: "wall"; projectIds: string[]; taxonomy?: ShowcaseTaxonomy; wideColumns: 2 | 3 | 4; weightByProjectId?: Record<string, "standard" | "wide" | "tall" | "feature">; compactPresentation: "peer-rail" | "bounded-grid-sheet" }
  | { kind: "rail"; projectIds: string[]; taxonomy?: ShowcaseTaxonomy; initialProjectId: string; loop: false; compactCompletePeers: 1 | 2; wideCompletePeers: 2 | 3 | 4 }
  | { kind: "case"; projectIds: string[]; presentation: "gallery-detail" | "spotlight" | "split-pair" | "alternating" | "category-browser"; taxonomy?: ShowcaseTaxonomy; factIds?: string[]; contactActionId?: string }
  | { kind: "capability"; featureIds: [string, string, string, string]; projectIds: [string, string, string, string, string] }
  | { kind: "featured"; featuredProjectId: string; featureIds: [string, string, string, string]; relatedProjectIds: [string, string, string, string] }
  | { kind: "accordion"; initialProjectIds: [string, string, string, string]; deferredProjectIds: [string, string]; defaultExpandedProjectId: string; revealLabel: string; concealLabel: string };

export type ShowcaseFixtureCore = {
  schemaVersion: 1;
  sourceKey: PortfolioSourceKey;
  module: "Showcase";
  preset: ShowcasePreset;
  intro: { eyebrow?: string; title: string; description?: string[]; actionIds: string[] };
  projects: ShowcaseProject[];
  features: ShowcaseFeature[];
  facts: Array<{ id: string; label: string; value: string }>;
  actions: ShowcaseAction[];
  visuals: ShowcaseVisualRef[];
  extension: ShowcaseExtension;
  state: { activeCategoryId?: string; activeProjectId?: string; expandedProjectId?: string; revealedProjectIds?: string[]; openMediaSeatId?: string };
  copy: { resultCount: string; previousProject: string; nextProject: string; openGrid: string; closeGrid: string; openMedia: string; closeMedia: string };
  announcements: { categoryChanged: string; projectChanged: string; disclosureChanged: string; collectionChanged: string; actionResult: string; error: string };
};
export type ShowcaseFixture = ShowcaseFixtureCore & { stress: Record<string, Record<string, unknown>> };

export type ShowcaseMediaRecord = {
  slug: PortfolioSourceKey;
  seatId: string;
  key: string;
  mediaKey: string;
  role: ShowcaseVisualRef["role"];
  identityId: string;
  alt: string;
  kind: ShowcaseVisualRef["role"];
  assetId: string;
  presentation: string;
  src?: `/media/${string}`;
  darkSrc?: `/media/${string}`;
  publicBase?: `/media/${string}`;
  aspect?: string;
  surfaceId?: string;
  systemIconKey?: string;
};
export type ResolvedShowcaseVisual = { seat: ShowcaseVisualRef; media: ShowcaseMediaRecord };
export type ResolvedShowcaseFixture = ShowcaseFixtureCore & {
  activeStress?: string;
  mediaBySeatId: ReadonlyMap<string, ResolvedShowcaseVisual>;
};

type Expected = {
  composition: ShowcaseComposition;
  preset: ShowcasePreset;
  projects: number;
  actions: number;
  visuals: number;
  filters: number;
  features: number;
  facts: number;
};

const EXPECTED: Record<PortfolioSourceKey, Expected> = {
  "portfolio-01": { composition:"case",preset:"gallery-detail",projects:1,actions:4,visuals:6,filters:0,features:0,facts:3 },
  "portfolio-02": { composition:"rail",preset:"proof-cards",projects:3,actions:3,visuals:7,filters:0,features:0,facts:0 },
  "portfolio-03": { composition:"wall",preset:"filtered-cards",projects:6,actions:6,visuals:6,filters:5,features:0,facts:0 },
  "portfolio-04": { composition:"wall",preset:"staggered-wall",projects:12,actions:1,visuals:12,filters:0,features:0,facts:0 },
  "portfolio-05": { composition:"wall",preset:"filtered-bento",projects:22,actions:22,visuals:22,filters:5,features:0,facts:0 },
  "portfolio-06": { composition:"rail",preset:"filtered-snap",projects:25,actions:25,visuals:25,filters:5,features:0,facts:0 },
  "portfolio-07": { composition:"case",preset:"spotlight-rail",projects:4,actions:4,visuals:4,filters:0,features:0,facts:0 },
  "portfolio-08": { composition:"rail",preset:"filtered-summaries",projects:6,actions:6,visuals:6,filters:5,features:0,facts:0 },
  "portfolio-09": { composition:"capability",preset:"capability-collage",projects:5,actions:1,visuals:14,filters:0,features:4,facts:0 },
  "portfolio-10": { composition:"case",preset:"split-pair",projects:2,actions:3,visuals:2,filters:0,features:0,facts:0 },
  "portfolio-11": { composition:"case",preset:"alternating-studies",projects:3,actions:4,visuals:3,filters:0,features:0,facts:0 },
  "portfolio-12": { composition:"rail",preset:"manual-coverflow",projects:7,actions:1,visuals:7,filters:0,features:0,facts:0 },
  "portfolio-13": { composition:"featured",preset:"featured-related",projects:5,actions:1,visuals:9,filters:0,features:4,facts:0 },
  "portfolio-14": { composition:"wall",preset:"project-trio",projects:3,actions:1,visuals:3,filters:0,features:0,facts:0 },
  "portfolio-15": { composition:"case",preset:"category-browser",projects:10,actions:2,visuals:11,filters:7,features:0,facts:0 },
  "portfolio-16": { composition:"wall",preset:"pastel-grid",projects:4,actions:4,visuals:4,filters:0,features:0,facts:0 },
  "portfolio-17": { composition:"accordion",preset:"project-resume",projects:6,actions:18,visuals:24,filters:0,features:24,facts:0 },
  "portfolio-18": { composition:"wall",preset:"preview-grid",projects:4,actions:4,visuals:4,filters:0,features:0,facts:0 },
};

const text = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const exactKeys = (value: object, allowed: readonly string[], label: string, source: string) => {
  const extra=Object.keys(value).filter((key)=>!allowed.includes(key));
  if(extra.length)throw new Error(`${source} has unsupported ${label}: ${extra.join(", ")}.`);
};
const localHref = (value: string) => /^\/demo\/[a-z0-9][a-z0-9/_-]*$/i.test(value) && !value.includes("#");

function merge(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (!base || !patch || typeof base !== "object" || typeof patch !== "object" || Array.isArray(base) || Array.isArray(patch)) return structuredClone(patch);
  const result = structuredClone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) result[key] = merge(result[key], value);
  return result;
}

function taxonomyOf(extension: ShowcaseExtension) {
  return extension.kind === "wall" || extension.kind === "rail" || extension.kind === "case" ? extension.taxonomy : undefined;
}
function projectIdsOf(extension: ShowcaseExtension) {
  if (extension.kind === "featured") return [extension.featuredProjectId, ...extension.relatedProjectIds];
  if (extension.kind === "accordion") return [...extension.initialProjectIds, ...extension.deferredProjectIds];
  return [...extension.projectIds];
}
function featureIdsOf(extension: ShowcaseExtension) {
  return extension.kind === "capability" || extension.kind === "featured" ? [...extension.featureIds] : [];
}
function structuralSignature(fixture: ShowcaseFixtureCore) {
  return JSON.stringify({
    sourceKey:fixture.sourceKey,module:fixture.module,preset:fixture.preset,extension:fixture.extension,
    projects:fixture.projects.map(({id,categoryIds,mediaSeatIds,actionIds,detail})=>({id,categoryIds,mediaSeatIds,actionIds,detail:detail&&{featureIds:detail.featureIds,toolActionIds:detail.toolActionIds}})),
    features:fixture.features.map(({id,systemIconSeatId})=>({id,systemIconSeatId})),facts:fixture.facts.map(({id})=>id),
    actions:fixture.actions.map(({id,ownerId,kind,href})=>({id,ownerId,kind,href})),
    visuals:fixture.visuals.map((visual)=>visual),
  });
}

function validateCore(fixture: ShowcaseFixtureCore) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown Portfolio source ${fixture.sourceKey}.`);
  exactKeys(fixture,["schemaVersion","sourceKey","module","preset","intro","projects","features","facts","actions","visuals","extension","state","copy","announcements"],"fixture properties",fixture.sourceKey);
  const extensionKeys:Record<ShowcaseComposition,string[]>={
    wall:["kind","projectIds","taxonomy","wideColumns","weightByProjectId","compactPresentation"],
    rail:["kind","projectIds","taxonomy","initialProjectId","loop","compactCompletePeers","wideCompletePeers"],
    case:["kind","projectIds","presentation","taxonomy","factIds","contactActionId"],
    capability:["kind","featureIds","projectIds"],featured:["kind","featuredProjectId","featureIds","relatedProjectIds"],
    accordion:["kind","initialProjectIds","deferredProjectIds","defaultExpandedProjectId","revealLabel","concealLabel"],
  };
  exactKeys(fixture.extension,extensionKeys[fixture.extension.kind]??[],"extension properties",fixture.sourceKey);
  if (fixture.schemaVersion !== 1 || fixture.module !== "Showcase") throw new Error(`${fixture.sourceKey} requires Showcase schema version 1.`);
  if (fixture.preset !== expected.preset || fixture.extension.kind !== expected.composition) throw new Error(`${fixture.sourceKey} has the wrong composition or preset.`);
  const taxonomy = taxonomyOf(fixture.extension);
  const actual = [fixture.projects.length,fixture.actions.length,fixture.visuals.length,taxonomy?.categories.length ?? 0,fixture.features.length,fixture.facts.length];
  const wanted = [expected.projects,expected.actions,expected.visuals,expected.filters,expected.features,expected.facts];
  if (JSON.stringify(actual)!==JSON.stringify(wanted)) throw new Error(`${fixture.sourceKey} drifts from its exact project/action/visual/filter/feature/fact inventory.`);

  text(fixture.intro.title,"intro title",fixture.sourceKey);
  fixture.intro.description?.forEach((value,index)=>text(value,`intro description ${index+1}`,fixture.sourceKey));
  for (const value of Object.values(fixture.copy)) text(value,"control copy",fixture.sourceKey);
  for (const value of Object.values(fixture.announcements)) text(value,"announcement",fixture.sourceKey);
  for (const required of ["short","longLocale","error"]) void required;

  unique(fixture.projects.map(({id})=>id),"project IDs",fixture.sourceKey);
  unique(fixture.actions.map(({id})=>id),"action IDs",fixture.sourceKey);
  unique(fixture.visuals.map(({id})=>id),"visual IDs",fixture.sourceKey);
  unique(fixture.features.map(({id})=>id),"feature IDs",fixture.sourceKey);
  unique(fixture.facts.map(({id})=>id),"fact IDs",fixture.sourceKey);
  const projectIds = new Set(fixture.projects.map(({id})=>id));
  const actionIds = new Set(fixture.actions.map(({id})=>id));
  const visualIds = new Set(fixture.visuals.map(({id})=>id));
  const featureIds = new Set(fixture.features.map(({id})=>id));
  const factIds = new Set(fixture.facts.map(({id})=>id));
  const categoryIds = new Set(taxonomy?.categories.map(({id})=>id) ?? []);

  if (new Set(projectIdsOf(fixture.extension)).size !== fixture.projects.length || projectIdsOf(fixture.extension).some((id)=>!projectIds.has(id))) throw new Error(`${fixture.sourceKey} extension project inventory does not resolve exactly.`);
  if (featureIdsOf(fixture.extension).some((id)=>!featureIds.has(id))) throw new Error(`${fixture.sourceKey} extension references an unknown feature.`);
  if (fixture.extension.kind === "case" && fixture.extension.factIds?.some((id)=>!factIds.has(id))) throw new Error(`${fixture.sourceKey} case references an unknown fact.`);
  if (taxonomy) {
    unique(taxonomy.categories.map(({id})=>id),"category IDs",fixture.sourceKey);
    taxonomy.categories.forEach(({label})=>text(label,"category label",fixture.sourceKey));
    if (!categoryIds.has(taxonomy.initialCategoryId) || (taxonomy.allCategoryId && !categoryIds.has(taxonomy.allCategoryId))) throw new Error(`${fixture.sourceKey} has an invalid initial or all category.`);
  }

  const owners = new Set(["intro","contact",...projectIds]);
  fixture.actions.forEach((action)=>{
    text(action.label,`action ${action.id} label`,fixture.sourceKey);
    if (!owners.has(action.ownerId)) throw new Error(`${fixture.sourceKey} action ${action.id} has unresolved owner ${action.ownerId}.`);
    if (!localHref(action.href)) throw new Error(`${fixture.sourceKey} action ${action.id} requires a local demo href.`);
  });
  fixture.visuals.forEach((visual)=>{
    text(visual.alt,`visual ${visual.id} alt`,fixture.sourceKey);
    text(visual.identityId,`visual ${visual.id} identity`,fixture.sourceKey);
    if (visual.role === "system-ui") text(visual.surfaceId,`visual ${visual.id} surface`,fixture.sourceKey);
    else if (visual.role === "system-icon") text(visual.systemIconKey,`visual ${visual.id} system icon`,fixture.sourceKey);
    else text(visual.assetKey,`visual ${visual.id} asset key`,fixture.sourceKey);
  });
  fixture.features.forEach((feature)=>{
    text(feature.title,`feature ${feature.id} title`,fixture.sourceKey); text(feature.description,`feature ${feature.id} description`,fixture.sourceKey);
    if (feature.systemIconSeatId && !visualIds.has(feature.systemIconSeatId)) throw new Error(`${fixture.sourceKey} feature ${feature.id} references unknown icon seat.`);
  });
  fixture.projects.forEach((project)=>{
    text(project.title,`project ${project.id} title`,fixture.sourceKey);
    project.categoryIds.forEach((id)=>{if(!categoryIds.has(id)) throw new Error(`${fixture.sourceKey} project ${project.id} references unknown category ${id}.`);});
    project.mediaSeatIds.forEach((id)=>{if(!visualIds.has(id)) throw new Error(`${fixture.sourceKey} project ${project.id} references unknown media ${id}.`);});
    project.actionIds.forEach((id)=>{if(!actionIds.has(id)) throw new Error(`${fixture.sourceKey} project ${project.id} references unknown action ${id}.`);});
    project.detail?.featureIds.forEach((id)=>{if(!featureIds.has(id)) throw new Error(`${fixture.sourceKey} project ${project.id} references unknown feature ${id}.`);});
    project.detail?.toolActionIds.forEach((id)=>{if(!actionIds.has(id)) throw new Error(`${fixture.sourceKey} project ${project.id} references unknown tool action ${id}.`);});
  });
  fixture.intro.actionIds.forEach((id)=>{if(!actionIds.has(id)) throw new Error(`${fixture.sourceKey} intro references unknown action ${id}.`);});

  if (fixture.state.activeCategoryId && !categoryIds.has(fixture.state.activeCategoryId)) throw new Error(`${fixture.sourceKey} has an invalid active category.`);
  if (fixture.state.activeProjectId && !projectIds.has(fixture.state.activeProjectId)) throw new Error(`${fixture.sourceKey} has an invalid active project.`);
  if (fixture.state.expandedProjectId && !projectIds.has(fixture.state.expandedProjectId)) throw new Error(`${fixture.sourceKey} has an invalid expanded project.`);
  fixture.state.revealedProjectIds?.forEach((id)=>{if(!projectIds.has(id)) throw new Error(`${fixture.sourceKey} has an invalid revealed project.`);});
  if (fixture.state.openMediaSeatId && !visualIds.has(fixture.state.openMediaSeatId)) throw new Error(`${fixture.sourceKey} has an invalid open media seat.`);

  if (fixture.sourceKey === "portfolio-17") {
    if (fixture.extension.kind !== "accordion" || fixture.extension.initialProjectIds.length!==4 || fixture.extension.deferredProjectIds.length!==2) throw new Error(`${fixture.sourceKey} requires four initial and two deferred rows.`);
    fixture.projects.forEach((project)=>{if(project.detail?.featureIds.length!==4 || project.detail.toolActionIds.length!==3) throw new Error(`${fixture.sourceKey} project ${project.id} requires four features and three tools.`);});
  }
}

function coreOf(fixture: ShowcaseFixture): ShowcaseFixtureCore {
  const { stress: _stress, ...core } = fixture;
  return core;
}

export function resolveShowcaseFixture(raw: ShowcaseFixture, stress?: string, records: ShowcaseMediaRecord[] = []): ResolvedShowcaseFixture {
  if (!raw || typeof raw !== "object") throw new Error("Showcase fixture must be an object.");
  const base = coreOf(raw);
  validateCore(base);
  for (const required of ["short","longLocale","error"]) if (!raw.stress?.[required]) throw new Error(`${raw.sourceKey} requires ${required} stress.`);
  for (const [name, patch] of Object.entries(raw.stress)) {
    const candidate = merge(base,patch) as ShowcaseFixtureCore;
    validateCore(candidate);
    if (structuralSignature(candidate)!==structuralSignature(base)) throw new Error(`${raw.sourceKey} stress ${name} changes structural ownership.`);
  }
  if (stress && !raw.stress[stress]) throw new Error(`${raw.sourceKey} does not declare stress ${stress}.`);
  const active = stress ? merge(base,raw.stress[stress]) as ShowcaseFixtureCore : base;
  const mediaBySeatId = new Map<string,ResolvedShowcaseVisual>();
  for (const seat of active.visuals) {
    const record = records.find((item)=>item.slug===active.sourceKey && item.seatId===seat.id && item.key===("assetKey" in seat ? seat.assetKey : seat.id));
    if (!record) throw new Error(`${active.sourceKey}/${seat.id} cannot resolve its exact media record.`);
    if (record.role!==seat.role || record.identityId!==seat.identityId || record.alt!==seat.alt) throw new Error(`${active.sourceKey}/${seat.id} media metadata drifts.`);
    if (seat.role === "system-ui") {
      if (record.presentation!=="runtime-system" || !record.surfaceId) throw new Error(`${active.sourceKey}/${seat.id} system UI must remain runtime code.`);
    } else if (seat.role === "system-icon") {
      if (record.presentation!=="runtime-system" || !record.systemIconKey) throw new Error(`${active.sourceKey}/${seat.id} system icon must remain runtime code.`);
    } else if (seat.role === "identity-mark") {
      if (!record.src?.startsWith("/media/") || !record.darkSrc?.startsWith("/media/")) throw new Error(`${active.sourceKey}/${seat.id} requires local light and dark marks.`);
    } else if (!record.publicBase?.startsWith("/media/") || !record.src?.startsWith("/media/")) {
      throw new Error(`${active.sourceKey}/${seat.id} requires a local responsive raster.`);
    }
    mediaBySeatId.set(seat.id,{seat,media:record});
  }
  return Object.freeze({...active,activeStress:stress,mediaBySeatId});
}

export function showcasePresetFor(sourceKey: PortfolioSourceKey) { return EXPECTED[sourceKey]?.preset; }
export function showcaseCompositionFor(sourceKey: PortfolioSourceKey) { return EXPECTED[sourceKey]?.composition; }
