export const APP_INTEGRATION_SOURCE_KEYS = Array.from({ length: 10 }, (_, index) =>
  `app-integration-${String(index + 1).padStart(2, "0")}`,
) as AppIntegrationSourceKey[];

export type AppIntegrationSourceKey = `app-integration-${string}`;
export type IntegrationProofPreset =
  | "split-descriptive-list" | "overlap-identity-cluster" | "summary-card-directory"
  | "linked-accent-cards" | "static-identity-strip" | "connect-card-directory"
  | "single-proof-marquee" | "dual-connect-lanes" | "staggered-232-wall"
  | "eight-node-hub-orbit";
export type IntegrationProofComposition = "split-list" | "identity-cluster" | "card-directory" | "proof-marquee" | "action-lanes" | "grouped-wall" | "hub-orbit";
export type IntegrationStressKey = "short" | "longLocale" | "error";

export type IntegrationRecord = { id:string; name:string; description?:string; markId:string; actionId?:string; groupId?:string; priority:number };
export type IntegrationAction = { id:string; kind:"browse"|"details"|"connect"|"learn"|"primary"|"secondary"; label:string; href?:`/demo/${string}`; recordId?:string };
export type IntegrationMark = { id:string; role:"integration-mark"|"hub-mark"; assetId:string; alt:string; aspect:"1:1" };
export type IntegrationGroup = { id:string; recordIds:string[] };
export type IntegrationMotion = { kind:"none"|"marquee"|"connector-pulse"; initial:"static"|"running"; pauseLabel?:string; resumeLabel?:string };
export type IntegrationPatch = { targetType:"fixture"|"record"|"action"|"mark"|"summary"|"hub"|"motion"|"stress"; targetId:string; field:string; value:string };
export type IntegrationStress = {
  short:{heading:string;body:string};
  longLocale:{heading:string;body:string;longestToken:string;textPatches:IntegrationPatch[]};
  mediaFallback:string; connectPending?:string; connectSuccess?:string; connectError?:string; connectRetry?:string;
};
export type IntegrationProofFixture = {
  schemaVersion:1; owner:"IntegrationProof"; sourceKey:AppIntegrationSourceKey; slug:AppIntegrationSourceKey;
  preset:IntegrationProofPreset; composition:IntegrationProofComposition; eyebrow?:string; heading:string; body:string;
  records:IntegrationRecord[]; groups:IntegrationGroup[]; actions:IntegrationAction[]; marks:IntegrationMark[]; motion:IntegrationMotion; stress:IntegrationStress;
  summary?:{id:string;title:string;body:string;actionId:string};
  hub?:{id:string;name:string;markId:string;nodeIds:string[]};
};

export type IntegrationMediaIdentity = { identityId:string; identityName:string; seatRole:string; aspect:"1:1"; light:{src:string}; dark:{src:string} };
export type IntegrationMediaSeat = { slug:AppIntegrationSourceKey; seatId:string; role:"integration-mark"|"hub-mark"; aspect:"1:1"; identityId:string; identityName:string; resolution:"approved-identity-role-aspect-reuse" };
export type IntegrationMediaMap = { schemaVersion:"1.0"; status:"PASS"; identities:IntegrationMediaIdentity[]; seats:IntegrationMediaSeat[] };
export type ResolvedIntegrationMark = IntegrationMark & { identityName:string; lightSrc:string; darkSrc:string };
export type ResolvedIntegrationProof = Omit<IntegrationProofFixture,"stress"|"marks"> & {
  activeStress?:IntegrationStressKey; stress:IntegrationStress; marks:ResolvedIntegrationMark[]; marksById:ReadonlyMap<string,ResolvedIntegrationMark>;
};

type Expected={preset:IntegrationProofPreset;composition:IntegrationProofComposition;records:number;descriptions:number;actions:number;marks:number;groups:number[];summary:number;hub:number};
const expected=(preset:IntegrationProofPreset,composition:IntegrationProofComposition,tuple:[number,number,number,number,number[],number,number]):Expected=>({preset,composition,records:tuple[0],descriptions:tuple[1],actions:tuple[2],marks:tuple[3],groups:tuple[4],summary:tuple[5],hub:tuple[6]});
const EXPECTED:Record<AppIntegrationSourceKey,Expected>={
  "app-integration-01":expected("split-descriptive-list","split-list",[3,3,1,3,[],0,0]),
  "app-integration-02":expected("overlap-identity-cluster","identity-cluster",[9,0,1,9,[],0,0]),
  "app-integration-03":expected("summary-card-directory","card-directory",[5,5,1,5,[],1,0]),
  "app-integration-04":expected("linked-accent-cards","card-directory",[6,6,6,6,[],0,0]),
  "app-integration-05":expected("static-identity-strip","identity-cluster",[6,0,0,6,[],0,0]),
  "app-integration-06":expected("connect-card-directory","card-directory",[8,8,9,8,[],0,0]),
  "app-integration-07":expected("single-proof-marquee","proof-marquee",[9,0,1,9,[],0,0]),
  "app-integration-08":expected("dual-connect-lanes","action-lanes",[10,10,10,10,[5,5],0,0]),
  "app-integration-09":expected("staggered-232-wall","grouped-wall",[7,0,1,7,[2,3,2],0,0]),
  "app-integration-10":expected("eight-node-hub-orbit","hub-orbit",[8,0,2,9,[],0,1]),
};

const exact=(actual:number,wanted:number,label:string,slug:string)=>{if(actual!==wanted)throw new Error(`${slug} requires exactly ${wanted} ${label}.`)};
const unique=(values:string[],label:string,slug:string)=>{if(new Set(values).size!==values.length)throw new Error(`${slug} repeats ${label}.`)};
const local=(href:string|undefined,label:string,slug:string)=>{if(!href||!/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(href))throw new Error(`${slug} ${label} requires a local /demo route.`)};

function patchFixture(fixture:IntegrationProofFixture,stress?:IntegrationStressKey){
  const resolved=structuredClone(fixture);
  if(stress==="short"){resolved.heading=resolved.stress.short.heading;resolved.body=resolved.stress.short.body}
  if(stress==="longLocale")for(const patch of resolved.stress.longLocale.textPatches){
    let target:Record<string,unknown>|undefined;
    if(patch.targetType==="fixture")target=resolved as unknown as Record<string,unknown>;
    else if(patch.targetType==="record")target=resolved.records.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    else if(patch.targetType==="action")target=resolved.actions.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    else if(patch.targetType==="mark")target=resolved.marks.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    else if(patch.targetType==="summary")target=resolved.summary as unknown as Record<string,unknown>;
    else if(patch.targetType==="hub")target=resolved.hub as unknown as Record<string,unknown>;
    else if(patch.targetType==="motion")target=resolved.motion as unknown as Record<string,unknown>;
    else target=resolved.stress as unknown as Record<string,unknown>;
    if(!target||!(patch.field in target))throw new Error(`${fixture.sourceKey} stress references unknown ${patch.targetType}:${patch.targetId}.${patch.field}.`);
    target[patch.field]=patch.value;
  }
  return resolved;
}

function validate(fixture:IntegrationProofFixture){
  const spec=EXPECTED[fixture.sourceKey];
  if(!spec||fixture.schemaVersion!==1||fixture.owner!=="IntegrationProof"||fixture.slug!==fixture.sourceKey)throw new Error(`Unknown or invalid App Integration fixture ${fixture.sourceKey}.`);
  if(fixture.preset!==spec.preset||fixture.composition!==spec.composition)throw new Error(`${fixture.sourceKey} has the wrong closed preset/composition.`);
  exact(fixture.records.length,spec.records,"records",fixture.sourceKey);exact(fixture.records.filter(({description})=>Boolean(description)).length,spec.descriptions,"descriptions",fixture.sourceKey);exact(fixture.actions.length,spec.actions,"actions",fixture.sourceKey);exact(fixture.marks.length,spec.marks,"marks",fixture.sourceKey);exact(fixture.summary?1:0,spec.summary,"summary records",fixture.sourceKey);exact(fixture.hub?1:0,spec.hub,"hub records",fixture.sourceKey);
  if(JSON.stringify(fixture.groups.map(({recordIds})=>recordIds.length))!==JSON.stringify(spec.groups))throw new Error(`${fixture.sourceKey} has the wrong group cardinalities.`);
  const ids=[...fixture.records,...fixture.actions,...fixture.marks,...fixture.groups].map(({id})=>id);if(fixture.summary)ids.push(fixture.summary.id);if(fixture.hub)ids.push(fixture.hub.id);unique(ids,"semantic IDs",fixture.sourceKey);
  const records=new Set(fixture.records.map(({id})=>id)),actions=new Set(fixture.actions.map(({id})=>id)),marks=new Set(fixture.marks.map(({id})=>id));
  for(const record of fixture.records){if(!marks.has(record.markId)||(record.actionId&&!actions.has(record.actionId))||(record.groupId&&!fixture.groups.some(({id})=>id===record.groupId)))throw new Error(`${fixture.sourceKey} record ${record.id} has an orphan relation.`)}
  for(const action of fixture.actions){if(action.kind==="connect"){if(action.href||!action.recordId||!records.has(action.recordId))throw new Error(`${fixture.sourceKey} connect action ${action.id} is invalid.`)}else local(action.href,action.id,fixture.sourceKey)}
  for(const group of fixture.groups){unique(group.recordIds,`${group.id} records`,fixture.sourceKey);if(group.recordIds.some((id)=>!records.has(id)))throw new Error(`${fixture.sourceKey} group ${group.id} has an orphan record.`)}
  if(fixture.summary&&(!actions.has(fixture.summary.actionId)||fixture.sourceKey!=="app-integration-03"))throw new Error(`${fixture.sourceKey} summary action is invalid.`);
  if(fixture.hub&&(!marks.has(fixture.hub.markId)||fixture.hub.nodeIds.length!==8||fixture.hub.nodeIds.some((id)=>!records.has(id))))throw new Error(`${fixture.sourceKey} hub relation is invalid.`);
  if(fixture.motion.kind!=="none"&&(!fixture.motion.pauseLabel||!fixture.motion.resumeLabel))throw new Error(`${fixture.sourceKey} moving proof requires pause and resume labels.`);
  if(/(?:shadcn|figma|openai|chatgpt|milkies)/i.test(JSON.stringify(fixture)))throw new Error(`${fixture.sourceKey} contains a forbidden vendor mark.`);
}

export function resolveIntegrationProofFixture(fixture:IntegrationProofFixture,media:IntegrationMediaMap,stress?:IntegrationStressKey):ResolvedIntegrationProof{
  validate(fixture);const resolved=patchFixture(fixture,stress);validate(resolved);
  if(media.schemaVersion!=="1.0"||media.status!=="PASS")throw new Error("App Integration media map is not approved.");
  const identities=new Map(media.identities.map((identity)=>[identity.identityId,identity]));const marks:ResolvedIntegrationMark[]=[];
  for(const mark of resolved.marks){const seats=media.seats.filter(({slug,seatId})=>slug===resolved.sourceKey&&seatId===mark.id);exact(seats.length,1,`media resolutions for ${mark.id}`,resolved.sourceKey);const seat=seats[0],identity=identities.get(seat.identityId);if(!identity||seat.identityId!==mark.assetId||seat.role!==mark.role||seat.aspect!==mark.aspect||seat.resolution!=="approved-identity-role-aspect-reuse")throw new Error(`${resolved.sourceKey} media contract drift for ${mark.id}.`);if(!identity.light.src.startsWith("/media/")||!identity.dark.src.startsWith("/media/"))throw new Error(`${resolved.sourceKey} mark ${mark.id} requires local media.`);marks.push({...mark,identityName:identity.identityName,lightSrc:identity.light.src,darkSrc:identity.dark.src})}
  const mapped=media.seats.filter(({slug})=>slug===resolved.sourceKey);exact(mapped.length,resolved.marks.length,"mapped seats",resolved.sourceKey);
  return {...resolved,activeStress:stress,marks,marksById:new Map(marks.map((mark)=>[mark.id,mark]))};
}
