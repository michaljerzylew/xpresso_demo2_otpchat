import type { MetricDelta, MetricTone, MetricValue } from "./metric-model";

export const BENTO_SOURCE_KEYS = Array.from(
  { length: 24 },
  (_, index) => `bento-grid-${String(index + 1).padStart(2, "0")}`,
) as BentoSourceKey[];

export type BentoSourceKey = `bento-grid-${
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08"
  | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16"
  | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24"}`;

export const BENTO_PRESETS = [
  "uniform-feature", "editorial-mosaic", "metric-mosaic", "integration-proof",
  "dark-product-mosaic", "product-proof", "commerce-mosaic", "workflow-mosaic",
  "finance-workspace", "team-workflow", "talent-mosaic", "theme-workspace",
  "ecosystem-proof", "design-system-mosaic",
  "illustrated-feature-mosaic", "community-mosaic", "service-mosaic", "analytics-mosaic",
] as const;
export type BentoPreset = (typeof BENTO_PRESETS)[number];
export type BentoDeviceClass = "M" | "TP" | "TL" | "DS" | "DW";
export type BentoTileRole = "lead" | "feature" | "metric" | "proof" | "media" | "mock" | "list" | "collection" | "control" | "process";

export type BentoSpan = {
  columnStart?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  columnSpan: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  rowSpan?: 1 | 2;
};

export type BentoTilePayload =
  | { kind: "feature"; title: string; body: string[]; iconKey?: string; factIds?: string[] }
  | { kind: "metric"; metricIds: string[]; visualId?: string; breakdownIds?: string[] }
  | { kind: "proof"; surfaceIds: string[]; identityIds?: string[] }
  | { kind: "media"; mediaSeatIds: string[]; caption?: string }
  | { kind: "mock"; surfaceIds: string[]; openActionId?: string }
  | { kind: "list"; rowIds: string[]; initialVisibleRows: number; disclosureActionId?: string }
  | { kind: "collection"; collectionId: string; initialItemId?: string }
  | { kind: "control"; controlIds: string[]; resultSurfaceId: string }
  | { kind: "process"; stepIds: string[]; activeStepId: string };

export type BentoTile = {
  id: string;
  role: BentoTileRole;
  rank: number;
  titleId?: string;
  payload: BentoTilePayload;
  span: Record<"TL" | "DS" | "DW", BentoSpan>;
  density: Record<"TL" | "DS" | "DW", "compact" | "full">;
  mergeGroupId?: string;
  actionIds: string[];
  mediaSeatIds: string[];
  systemSurfaceIds?: string[];
};

export type BentoAction = {
  id: string;
  ownerId: "intro" | string;
  kind: "navigate" | "open-detail" | "toggle" | "select" | "submit" | "copy" | "step";
  label: string;
  href?: `/${string}`;
  targetId?: string;
  emphasis: "primary" | "secondary" | "utility";
  disabledReason?: string;
  processingLabel?: string;
  successAnnouncementId?: string;
};

export type BentoMetric = MetricValue & { trend?: string; delta?: MetricDelta };
export type BentoIdentity = {
  id: string;
  name?: string;
  label?: string;
  role: string;
  mediaSeatId?: string;
  portraitKey?: string;
};
export type BentoRow = { id: string; label: string; value?: string; tone?: MetricTone; identityId?: string };
export type BentoCollectionItem = {
  id: string;
  label?: string;
  title?: string;
  value?: string;
  status?: string;
  tone?: MetricTone;
  summary?: string;
  productCount?: number;
  mediaSeatId?: string;
};
export type BentoCollection = { id: string; label?: string; description?: string; items?: BentoCollectionItem[]; rowIds?: string[] };
export type BentoControlOption = { id: string; label: string; value: string };
export type BentoControl = {
  id: string;
  kind: "select" | "toggle" | "rating" | "slider" | "text";
  label: string;
  value: string | number | boolean;
  options?: BentoControlOption[];
  resultSurfaceId?: string;
};
export type BentoProcess = { id: string; label: string; status?: string };
export type BentoSystemBranch = { id: string; label: string; status: string };
export type BentoSystemSurface = {
  id: string;
  kind: "dashboard" | "list" | "chart" | "feedback" | "system-ui" | "diagram" | "code" | "terminal";
  title?: string;
  label?: string;
  body?: string;
  rowIds?: string[];
  branches?: BentoSystemBranch[];
  selectedDate?: string;
  stateOptions?: string[] | Record<string, string>;
};
export type BentoMediaSeat = { id: string; role: "photo" | "portrait" | "mark" | "graphic"; assetKey: string; alt: string; kind: "raster" | "avatar" | "vector" | "illustration" };

export type BentoMediaRecord = {
  slug: BentoSourceKey;
  seatId: string;
  key: string;
  mediaKey: string;
  role: string;
  kind: "raster" | "avatar" | "vector" | "illustration";
  assetId: string;
  src: string;
  darkSrc?: string;
  publicBase?: string;
  alt: string;
};
export type ResolvedBentoMedia = BentoMediaRecord & { seat: BentoMediaSeat };

export type BentoIntro = { eyebrow?: string; title: string; body: string[]; actionIds: string[] };
export type BentoStressPatch = Partial<Omit<BentoFixtureCore, "sourceKey" | "preset" | "stress" | "owner">> & { patched?: true };
export type BentoFixtureCore = {
  sourceKey: BentoSourceKey;
  preset: BentoPreset;
  intro?: BentoIntro;
  leadTileId?: string | null;
  tiles: BentoTile[];
  actions: BentoAction[];
  metrics: BentoMetric[];
  identities: BentoIdentity[];
  rows: BentoRow[];
  collections: BentoCollection[];
  controls: BentoControl[];
  processes: BentoProcess[];
  systemSurfaces: BentoSystemSurface[];
  media: BentoMediaSeat[];
  copy: {
    openLabel: string; closeLabel: string; expandLabel: string; collapseLabel: string;
    railLabel: string; previousLabel: string; nextLabel: string; emptyLabel: string;
  };
  announcements: Record<string, string>;
  owner: "Bento";
};
export type BentoFixture = BentoFixtureCore & { stress: Record<string, BentoStressPatch> };
export type ResolvedBentoFixture = BentoFixtureCore & {
  stress: BentoFixture["stress"];
  activeStress?: string;
  mediaBySeatId: ReadonlyMap<string, ResolvedBentoMedia>;
};

type BentoExpected = {
  preset: BentoPreset; tiles: number; actions: number; metrics: number; identities: number;
  rows: number; collections: number; controls: number; surfaces: number; media: number;
  lead?: string | null;
};

const EXPECTED: Record<BentoSourceKey, BentoExpected> = {
  "bento-grid-01": { preset:"uniform-feature",tiles:6,actions:1,metrics:1,identities:0,rows:0,collections:0,controls:0,surfaces:6,media:0 },
  "bento-grid-02": { preset:"editorial-mosaic",tiles:4,actions:0,metrics:0,identities:2,rows:3,collections:0,controls:0,surfaces:1,media:2,lead:"tile_1" },
  "bento-grid-03": { preset:"metric-mosaic",tiles:7,actions:0,metrics:4,identities:0,rows:0,collections:0,controls:0,surfaces:1,media:3,lead:"tile_1" },
  "bento-grid-04": { preset:"integration-proof",tiles:4,actions:1,metrics:1,identities:0,rows:5,collections:0,controls:0,surfaces:2,media:0,lead:"tile_2" },
  "bento-grid-05": { preset:"dark-product-mosaic",tiles:9,actions:3,metrics:1,identities:0,rows:0,collections:0,controls:0,surfaces:5,media:2,lead:"tile_5" },
  "bento-grid-06": { preset:"metric-mosaic",tiles:6,actions:1,metrics:3,identities:0,rows:2,collections:0,controls:1,surfaces:3,media:0,lead:"tile_1" },
  "bento-grid-07": { preset:"product-proof",tiles:5,actions:0,metrics:0,identities:0,rows:0,collections:0,controls:0,surfaces:5,media:0,lead:"tile_1" },
  "bento-grid-08": { preset:"uniform-feature",tiles:4,actions:1,metrics:0,identities:0,rows:0,collections:0,controls:0,surfaces:4,media:0,lead:null },
  "bento-grid-09": { preset:"commerce-mosaic",tiles:7,actions:11,metrics:6,identities:0,rows:0,collections:1,controls:3,surfaces:1,media:5,lead:"tile_1" },
  "bento-grid-10": { preset:"workflow-mosaic",tiles:4,actions:0,metrics:0,identities:0,rows:3,collections:1,controls:0,surfaces:1,media:2,lead:"tile_1" },
  "bento-grid-11": { preset:"finance-workspace",tiles:7,actions:0,metrics:0,identities:0,rows:4,collections:1,controls:2,surfaces:5,media:0,lead:"tile_1" },
  "bento-grid-12": { preset:"uniform-feature",tiles:4,actions:0,metrics:0,identities:0,rows:0,collections:0,controls:0,surfaces:4,media:0 },
  "bento-grid-13": { preset:"metric-mosaic",tiles:6,actions:1,metrics:0,identities:0,rows:3,collections:0,controls:1,surfaces:2,media:0,lead:"tile_1" },
  "bento-grid-14": { preset:"product-proof",tiles:5,actions:1,metrics:0,identities:0,rows:0,collections:1,controls:1,surfaces:1,media:5,lead:"tile_1" },
  "bento-grid-15": { preset:"finance-workspace",tiles:4,actions:0,metrics:0,identities:0,rows:0,collections:2,controls:0,surfaces:1,media:1,lead:"tile_3" },
  "bento-grid-16": { preset:"workflow-mosaic",tiles:5,actions:3,metrics:0,identities:0,rows:3,collections:0,controls:2,surfaces:2,media:5,lead:"tile_4" },
  "bento-grid-17": { preset:"team-workflow",tiles:4,actions:0,metrics:0,identities:4,rows:12,collections:1,controls:1,surfaces:3,media:4,lead:"tile_1" },
  "bento-grid-18": { preset:"talent-mosaic",tiles:5,actions:1,metrics:0,identities:0,rows:7,collections:1,controls:0,surfaces:0,media:6,lead:"tile_4" },
  "bento-grid-19": { preset:"metric-mosaic",tiles:7,actions:0,metrics:4,identities:8,rows:3,collections:1,controls:0,surfaces:2,media:9,lead:"tile_1" },
  "bento-grid-20": { preset:"theme-workspace",tiles:5,actions:2,metrics:0,identities:0,rows:0,collections:0,controls:4,surfaces:4,media:0,lead:"tile_4" },
  "bento-grid-21": { preset:"theme-workspace",tiles:5,actions:4,metrics:3,identities:0,rows:0,collections:0,controls:1,surfaces:2,media:0,lead:"tile_3" },
  "bento-grid-22": { preset:"ecosystem-proof",tiles:5,actions:0,metrics:0,identities:0,rows:0,collections:0,controls:0,surfaces:4,media:8,lead:"tile_1" },
  "bento-grid-23": { preset:"workflow-mosaic",tiles:5,actions:2,metrics:0,identities:0,rows:7,collections:2,controls:2,surfaces:3,media:10,lead:"tile_3" },
  "bento-grid-24": { preset:"design-system-mosaic",tiles:7,actions:3,metrics:0,identities:0,rows:8,collections:0,controls:7,surfaces:5,media:7,lead:"tile_1" },
};

const text = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const exactIds = (actual: string[], expected: string[], label: string, source: string) => {
  if ([...actual].sort().join("|") !== [...expected].sort().join("|")) throw new Error(`${source} has unresolved ${label}.`);
};

function merge(base: unknown, patch: unknown, source: string): unknown {
  if (patch === undefined) return structuredClone(base);
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

function structuralSignature(fixture: BentoFixtureCore) {
  return JSON.stringify({
    sourceKey:fixture.sourceKey,preset:fixture.preset,owner:fixture.owner,leadTileId:fixture.leadTileId,
    tiles:fixture.tiles.map(({id,rank,role,payload,span,actionIds,mediaSeatIds,systemSurfaceIds})=>({id,rank,role,kind:payload.kind,span,actionIds,mediaSeatIds,systemSurfaceIds})),
    actions:fixture.actions.map(({id,ownerId,kind,href,targetId})=>({id,ownerId,kind,href,targetId})),
    metrics:fixture.metrics.map(({id})=>id),identities:fixture.identities.map(({id,mediaSeatId})=>({id,mediaSeatId})),
    rows:fixture.rows.map(({id,identityId})=>({id,identityId})),collections:fixture.collections.map(({id,rowIds,items})=>({id,rowIds,itemIds:items?.map(({id})=>id)})),
    controls:fixture.controls.map(({id,kind,resultSurfaceId,options})=>({id,kind,resultSurfaceId,optionIds:options?.map(({id})=>id)})),
    processes:fixture.processes.map(({id})=>id),systemSurfaces:fixture.systemSurfaces.map(({id,kind,rowIds,branches})=>({id,kind,rowIds,branchIds:branches?.map(({id})=>id)})),
    media:fixture.media.map(({id,assetKey,kind})=>({id,assetKey,kind})),
  });
}

function validateCore(fixture: BentoFixtureCore, media: BentoMediaRecord[]) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown Bento source ${fixture.sourceKey}.`);
  if (fixture.owner !== "Bento" || fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} has the wrong public owner or preset.`);
  const counts = [fixture.tiles.length,fixture.actions.length,fixture.metrics.length,fixture.identities.length,fixture.rows.length,fixture.collections.length,fixture.controls.length,fixture.systemSurfaces.length,fixture.media.length];
  const wanted = [expected.tiles,expected.actions,expected.metrics,expected.identities,expected.rows,expected.collections,expected.controls,expected.surfaces,expected.media];
  if (counts.join("|") !== wanted.join("|")) throw new Error(`${fixture.sourceKey} drifts from its exact content inventory.`);
  if (fixture.processes.length !== 0) throw new Error(`${fixture.sourceKey} must not invent process records.`);
  if (fixture.preset === "uniform-feature") {
    if (fixture.leadTileId) throw new Error(`${fixture.sourceKey} uniform presets cannot invent a lead tile.`);
  } else if (fixture.leadTileId !== expected.lead || !fixture.tiles.some(({id})=>id===fixture.leadTileId)) throw new Error(`${fixture.sourceKey} requires one exact lead tile.`);

  const groups: Array<[string, Array<{id:string}>]> = [
    ["tile",fixture.tiles],["action",fixture.actions],["metric",fixture.metrics],["identity",fixture.identities],
    ["row",fixture.rows],["collection",fixture.collections],["control",fixture.controls],["surface",fixture.systemSurfaces],["media",fixture.media],
  ];
  groups.forEach(([label,items])=>unique(items.map(({id})=>id),`${label} IDs`,fixture.sourceKey));
  if (fixture.tiles.map(({rank})=>rank).join("|") !== Array.from({length:fixture.tiles.length},(_,i)=>i+1).join("|")) throw new Error(`${fixture.sourceKey} tile rank must be contiguous DOM order.`);
  fixture.intro?.body.forEach((line,index)=>text(line,`intro body ${index+1}`,fixture.sourceKey));
  if (fixture.intro) text(fixture.intro.title,"intro title",fixture.sourceKey);

  const ids = {
    actions:new Set(fixture.actions.map(({id})=>id)),metrics:new Set(fixture.metrics.map(({id})=>id)),identities:new Set(fixture.identities.map(({id})=>id)),
    rows:new Set(fixture.rows.map(({id})=>id)),collections:new Set(fixture.collections.map(({id})=>id)),controls:new Set(fixture.controls.map(({id})=>id)),
    surfaces:new Set(fixture.systemSurfaces.map(({id})=>id)),media:new Set(fixture.media.map(({id})=>id)),processes:new Set(fixture.processes.map(({id})=>id)),
  };
  const actionRefs = [...(fixture.intro?.actionIds??[]),...fixture.tiles.flatMap(({actionIds})=>actionIds)];
  actionRefs.forEach((id)=>{if(!ids.actions.has(id))throw new Error(`${fixture.sourceKey} references unknown action ${id}.`);});
  const owners = new Set(["intro",...fixture.tiles.map(({id})=>id)]);
  fixture.actions.forEach((action)=>{
    text(action.label,`action ${action.id} label`,fixture.sourceKey);
    if(!owners.has(action.ownerId))throw new Error(`${fixture.sourceKey} action ${action.id} has an unresolved owner.`);
    if(action.kind==="navigate" && (!action.href?.startsWith("/") || action.href.includes("#") || action.href.startsWith("//")))throw new Error(`${fixture.sourceKey} action ${action.id} requires a safe local href.`);
    if(action.kind!=="navigate" && action.href)throw new Error(`${fixture.sourceKey} non-navigation action ${action.id} cannot carry href.`);
    if(action.successAnnouncementId && !fixture.announcements[action.successAnnouncementId])throw new Error(`${fixture.sourceKey} action ${action.id} has an unresolved announcement.`);
  });

  for (const tile of fixture.tiles) {
    for (const className of ["TL","DS","DW"] as const) {
      const span=tile.span[className];
      if (span.columnSpan<1 || span.columnSpan>12 || (span.columnStart??1)+span.columnSpan-1>12) throw new Error(`${fixture.sourceKey} tile ${tile.id} exceeds the ${className} grid.`);
    }
    tile.mediaSeatIds.forEach((id)=>{if(!ids.media.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown media ${id}.`);});
    tile.systemSurfaceIds?.forEach((id)=>{if(!ids.surfaces.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown surface ${id}.`);});
    const payload=tile.payload;
    if(payload.kind==="feature"){
      text(payload.title,`tile ${tile.id} title`,fixture.sourceKey);payload.body.forEach((line,index)=>text(line,`tile ${tile.id} body ${index+1}`,fixture.sourceKey));
      payload.factIds?.forEach((id)=>{if(!ids.metrics.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown fact ${id}.`);});
    } else if(payload.kind==="metric") {
      payload.metricIds.forEach((id)=>{if(!ids.metrics.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown metric ${id}.`);});
      if(payload.visualId && !ids.surfaces.has(payload.visualId))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown visual ${payload.visualId}.`);
    } else if(payload.kind==="proof" || payload.kind==="mock") {
      payload.surfaceIds.forEach((id)=>{if(!ids.surfaces.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown surface ${id}.`);});
      if(payload.kind==="proof")payload.identityIds?.forEach((id)=>{if(!ids.identities.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown identity ${id}.`);});
    } else if(payload.kind==="media") {
      payload.mediaSeatIds.forEach((id)=>{if(!ids.media.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown media ${id}.`);});
    } else if(payload.kind==="list") {
      payload.rowIds.forEach((id)=>{if(!ids.rows.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown row ${id}.`);});
      if(payload.initialVisibleRows<1 || payload.initialVisibleRows>payload.rowIds.length)throw new Error(`${fixture.sourceKey} tile ${tile.id} has an invalid compact list boundary.`);
    } else if(payload.kind==="collection") {
      if(!ids.collections.has(payload.collectionId))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown collection ${payload.collectionId}.`);
    } else if(payload.kind==="control") {
      payload.controlIds.forEach((id)=>{if(!ids.controls.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown control ${id}.`);});
      if(!ids.surfaces.has(payload.resultSurfaceId))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown control result ${payload.resultSurfaceId}.`);
    } else {
      payload.stepIds.forEach((id)=>{if(!ids.processes.has(id))throw new Error(`${fixture.sourceKey} tile ${tile.id} references unknown process ${id}.`);});
    }
  }

  fixture.rows.forEach(({identityId})=>{if(identityId&&!ids.identities.has(identityId))throw new Error(`${fixture.sourceKey} row references an unknown identity.`);});
  fixture.collections.forEach((collection)=>{
    collection.rowIds?.forEach((id)=>{if(!ids.rows.has(id))throw new Error(`${fixture.sourceKey} collection ${collection.id} references unknown row ${id}.`);});
    collection.items?.forEach((item)=>{if(item.mediaSeatId&&!ids.media.has(item.mediaSeatId))throw new Error(`${fixture.sourceKey} collection ${collection.id} references unknown media ${item.mediaSeatId}.`);});
  });
  fixture.controls.forEach((control)=>{
    text(control.label,`control ${control.id} label`,fixture.sourceKey);
    if(control.options){if(control.options.length<2)throw new Error(`${fixture.sourceKey} control ${control.id} requires peer options.`);unique(control.options.map(({id})=>id),`options in ${control.id}`,fixture.sourceKey);}
    if(control.resultSurfaceId&&!ids.surfaces.has(control.resultSurfaceId))throw new Error(`${fixture.sourceKey} control ${control.id} has an unresolved result surface.`);
  });
  fixture.systemSurfaces.forEach((surface)=>{
    surface.rowIds?.forEach((id)=>{if(!ids.rows.has(id))throw new Error(`${fixture.sourceKey} surface ${surface.id} references unknown row ${id}.`);});
    unique((surface.branches??[]).map(({id})=>id),`branches in ${surface.id}`,fixture.sourceKey);
  });

  const exactMedia=media.filter(({slug})=>slug===fixture.sourceKey);
  if(exactMedia.length!==fixture.media.length)throw new Error(`${fixture.sourceKey} cannot resolve its exact media seat count.`);
  const mediaBySeat=new Map(exactMedia.map((record)=>[record.seatId,record]));
  for(const seat of fixture.media){
    const record=mediaBySeat.get(seat.id);
    if(!record||record.key!==seat.assetKey||record.kind!==seat.kind)throw new Error(`${fixture.sourceKey} cannot resolve media ${seat.id}.`);
    if(/^(?:https?:)?\/\//.test(record.src)||record.publicBase&&/^(?:https?:)?\/\//.test(record.publicBase))throw new Error(`${fixture.sourceKey} media ${seat.id} is remote.`);
  }
  Object.values(fixture.copy).forEach((value)=>text(value,"structural copy",fixture.sourceKey));
}

export function resolveBentoFixture(fixture: BentoFixture, stress: string | undefined, media: BentoMediaRecord[]): ResolvedBentoFixture {
  if(!BENTO_SOURCE_KEYS.includes(fixture.sourceKey))throw new Error(`Invalid Bento source ${fixture.sourceKey}.`);
  if(!BENTO_PRESETS.includes(fixture.preset))throw new Error(`${fixture.sourceKey} has an invalid Bento preset.`);
  if(!fixture.stress.short||!fixture.stress.longLocale)throw new Error(`${fixture.sourceKey} requires short and longLocale stress states.`);
  if(stress&&!fixture.stress[stress])throw new Error(`${fixture.sourceKey} has no stress state ${stress}.`);
  const base=structuredClone(fixture) as BentoFixture;
  const patch=stress?fixture.stress[stress]:undefined;
  const merged=patch?.patched===true&&Object.keys(patch).length===1?base:merge(base,patch,fixture.sourceKey) as BentoFixture;
  if(structuralSignature(base)!==structuralSignature(merged))throw new Error(`${fixture.sourceKey} stress changes structural ownership.`);
  validateCore(merged,media);
  const records=media.filter(({slug})=>slug===fixture.sourceKey);
  const seats=new Map(merged.media.map((seat)=>[seat.id,seat]));
  const mediaBySeatId=new Map(records.map((record)=>[record.seatId,{...record,seat:seats.get(record.seatId)!}]));
  return {...merged,activeStress:stress,mediaBySeatId};
}

export const BENTO_CATEGORY_TOTALS = Object.freeze({ tiles:130, actions:35, controls:25, rows:60, surfaces:67, media:69 });
