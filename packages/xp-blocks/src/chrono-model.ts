export const CHRONO_SOURCE_KEYS = [
  "timeline-component-01",
  "timeline-component-02",
  "timeline-component-03",
  "timeline-component-04",
  "timeline-component-05",
] as const;

export const CHRONO_PRESETS = [
  "order-tracking",
  "company-history",
  "process-axis",
  "career-axis",
  "release-changelog",
] as const;

export const CHRONO_STRESSES = [
  "short", "longLocale", "error", "missingOptional", "saveOn", "currentNormalized", "mediaError",
  "eventLastOpen", "mediaRailEnd", "scrollCurrentLast", "stepLast", "paused", "progressMid", "complete",
  "milestoneLast", "actionFocus", "latestOpen", "releaseLast", "allCollapsed", "copySuccess", "illustrationError", "codeError",
] as const;

export type ChronoSourceKey = typeof CHRONO_SOURCE_KEYS[number];
export type ChronoPreset = typeof CHRONO_PRESETS[number];
export type ChronoStressKey = typeof CHRONO_STRESSES[number];
export type ChronoMode = "tracking" | "history" | "axis" | "changelog";
export type ChronoDeviceForm = "M" | "TP" | "TL" | "DS" | "DW";
export type ChronoAction = { id:string;label:string;intent:"toggle-save"|"navigate-details"|"navigate-portfolio";href?:`/demo/${string}`;ownerId?:string };
export type ChronoControl = { id:string;label:string;targetId:string;href?:`/demo/${string}` };
export type ChronoMediaRef = { id:string;role:"product"|"workplace"|"avatar"|"award"|"identity"|"diagram";alt:string;identityId:string;mediaKey:string;aspect:"1:1"|"4:3"|"16:9" };
export type ChronoCodeProof = { id:string;title:string;packageName:string;language:"typescript";lines:string[] };
export type TrackingEvent = { id:string;title:string;time:string;date:string;state:"complete"|"current"|"pending" };
export type HistorySupport =
  | { kind:"photo-strip";mediaIds:string[] }
  | { kind:"service-rows";rows:Array<{id:string;name:string;description:string;iconKey:string}> }
  | { kind:"award-pair";mediaIds:[string,string];labels:[string,string] }
  | { kind:"identity-pair";mediaIds:[string,string];labels:[string,string] }
  | { kind:"avatar-group";mediaIds:[string,string,string,string];names:[string,string,string,string];roles:[string,string,string,string] };
export type HistoryEvent = { id:string;date:string;title:string;body:string;support:HistorySupport };
export type ProcessEvent = { id:string;title:string;body:string;targetProgress:number;duration:string;iconKey:string };
export type CareerEvent = { id:string;title:string;date:string;employmentType:string;period:string;skills:[string,string,string,string,string];responsibilities:[string,string,string] };
export type ReleaseGroup = { id:string;kind:"new"|"updates"|"fixes";label:string;facts:string[] };
export type ReleaseEvent = { id:string;version:string;date:string;title:string;summary:string[];groups:[ReleaseGroup,ReleaseGroup,ReleaseGroup];mediaIds:string[];codeProofId?:string };

type TextPatch = { targetType:string;targetId:string;field:string;value:string };
type StressRecord = { textPatches?:TextPatch[];omittedPaths?:string[];[key:string]:unknown };
type CommonFixture = {
  schemaVersion:number;sourceKey:ChronoSourceKey;owner:"Chrono";mode:ChronoMode;preset:ChronoPreset;
  intro:{eyebrow?:string;heading:string;description?:string};actions:ChronoAction[];controls:ChronoControl[];media:ChronoMediaRef[];
  codeProofs:ChronoCodeProof[];labels:Record<string,string>;announcements:Record<string,string>;initialState:Record<string,unknown>;
  behavior:Record<string,unknown>;stress:Record<string,StressRecord>;
};
export type TrackingFixture = CommonFixture & { sourceKey:"timeline-component-01";mode:"tracking";preset:"order-tracking";order:{id:string;verificationLabel:string;productName:string;productDescription:string;currentPrice:string;priorPrice?:string;discountLabel?:string;arrivalHeading:string;mediaId:string};events:TrackingEvent[] };
export type HistoryFixture = CommonFixture & { sourceKey:"timeline-component-02";mode:"history";preset:"company-history";events:HistoryEvent[] };
export type ProcessFixture = CommonFixture & { sourceKey:"timeline-component-03";mode:"axis";preset:"process-axis";events:ProcessEvent[] };
export type CareerFixture = CommonFixture & { sourceKey:"timeline-component-04";mode:"axis";preset:"career-axis";events:CareerEvent[] };
export type ChangelogFixture = CommonFixture & { sourceKey:"timeline-component-05";mode:"changelog";preset:"release-changelog";events:ReleaseEvent[] };
export type ChronoFixture = TrackingFixture|HistoryFixture|ProcessFixture|CareerFixture|ChangelogFixture;

export type TimelineMediaRecord = {
  sourceSlug:string;seatId:string;identityId:string;status:"RESOLVED"|"MISSING-RASTER";
  disposition:string;owner:string;src?:string;publicBase?:string;canonicalPath?:string;publicPath?:string;sha256?:string;
};
export type TimelineMediaMap = { schemaVersion:number;counts:{semanticSeats:number;resolvedSeats:number;unresolvedSeats:number;missingRasterIdentities:number;providerCallsMade:number};records:TimelineMediaRecord[] };
export type ResolvedChronoMedia = { seatId:string;identityId:string;status:"resolved"|"hold"|"error";alt:string;role:ChronoMediaRef["role"];aspect:ChronoMediaRef["aspect"];src?:string;publicBase?:string };
export type ResolvedChronoFixture = ChronoFixture & {
  activeStress?:ChronoStressKey;terminalEligible:boolean;failedMediaIds:Set<string>;failedCodeProofIds:Set<string>;
  mediaById:Map<string,ResolvedChronoMedia>;initial:{saved:boolean;activeEventId?:string;currentEventId?:string;openEventId?:string;activeReleaseId?:string;openReleaseId?:string|null;openGroupIds:string[];paused:boolean;copyState:"idle"|"success"|"error";progressOverrides:Record<string,number>};
};

const REQUIREMENTS:Record<ChronoSourceKey,{mode:ChronoMode;preset:ChronoPreset;events:number;actions:number;controls:number;media:number;proofs:number}> = {
  "timeline-component-01":{mode:"tracking",preset:"order-tracking",events:5,actions:2,controls:0,media:1,proofs:0},
  "timeline-component-02":{mode:"history",preset:"company-history",events:5,actions:0,controls:5,media:13,proofs:0},
  "timeline-component-03":{mode:"axis",preset:"process-axis",events:4,actions:0,controls:5,media:0,proofs:0},
  "timeline-component-04":{mode:"axis",preset:"career-axis",events:4,actions:1,controls:5,media:0,proofs:0},
  "timeline-component-05":{mode:"changelog",preset:"release-changelog",events:3,actions:0,controls:13,media:5,proofs:1},
};

const required=(value:unknown,label:string,source:string)=>{if(typeof value!=="string"||!value.trim())throw new Error(`${source} requires ${label}.`)};
const unique=(values:string[],label:string,source:string)=>{if(new Set(values).size!==values.length)throw new Error(`${source} repeats ${label}.`)};
const local=(href:string|undefined,label:string,source:string)=>{if(!href?.startsWith("/demo/")||href.includes(":")||href.includes("//"))throw new Error(`${source}/${label} requires one local /demo route.`)};

function setField(target:Record<string,unknown>,field:string,value:string,source:string){
  const match=field.match(/^([A-Za-z][A-Za-z0-9]*)\[(\d+)]$/);
  if(match){const list=target[match[1]];const index=Number(match[2]);if(!Array.isArray(list)||index>=list.length)throw new Error(`${source} stress references missing ${field}.`);list[index]=value;return}
  if(!(field in target))throw new Error(`${source} stress references missing ${field}.`);
  target[field]=value;
}

function patchTarget(fixture:ChronoFixture,patch:TextPatch):Record<string,unknown>|undefined{
  if(patch.targetType==="intro")return fixture.intro as Record<string,unknown>;
  if(patch.targetType==="order"&&fixture.sourceKey==="timeline-component-01")return fixture.order as unknown as Record<string,unknown>;
  if(patch.targetType==="event"||patch.targetType==="release")return fixture.events.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  if(patch.targetType==="action")return fixture.actions.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  if(patch.targetType==="control")return fixture.controls.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  if(patch.targetType==="codeProof")return fixture.codeProofs.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  if(patch.targetType==="supportRow"&&fixture.sourceKey==="timeline-component-02")return fixture.events.flatMap(({support})=>support.kind==="service-rows"?support.rows:[]).find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  if(patch.targetType==="releaseGroup"&&fixture.sourceKey==="timeline-component-05")return fixture.events.flatMap(({groups})=>groups).find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
  return undefined;
}

function applyTextPatches(fixture:ChronoFixture,patches:TextPatch[]){
  for(const patch of patches){
    if(patch.targetType==="label"||patch.targetType==="announcement"){
      const collection=patch.targetType==="label"?fixture.labels:fixture.announcements;
      if(patch.field!=="text"||!(patch.targetId in collection))throw new Error(`${fixture.sourceKey} stress references unknown ${patch.targetType}/${patch.targetId}.`);
      collection[patch.targetId]=patch.value;continue;
    }
    const target=patchTarget(fixture,patch);if(!target)throw new Error(`${fixture.sourceKey} stress references unknown ${patch.targetType}/${patch.targetId}.`);
    setField(target,patch.field,patch.value,fixture.sourceKey);
  }
}

function omitPath(fixture:ChronoFixture,pathValue:string){
  const parts=pathValue.split(".");let target:Record<string,unknown>=fixture as unknown as Record<string,unknown>;
  for(const part of parts.slice(0,-1)){const next=target[part];if(!next||typeof next!=="object")return;target=next as Record<string,unknown>}
  delete target[parts.at(-1)!];
}

function validateFixture(fixture:ChronoFixture,map:TimelineMediaMap,stress?:ChronoStressKey){
  const requirement=REQUIREMENTS[fixture.sourceKey];
  if(!requirement||fixture.owner!=="Chrono"||fixture.mode!==requirement.mode||fixture.preset!==requirement.preset)throw new Error(`${fixture.sourceKey} is outside the closed Chrono contract.`);
  if(fixture.events.length!==requirement.events||fixture.actions.length!==requirement.actions||fixture.controls.length!==requirement.controls||fixture.media.length!==requirement.media||fixture.codeProofs.length!==requirement.proofs)throw new Error(`${fixture.sourceKey} inventory differs from its closed preset.`);
  required(fixture.intro.heading,"intro heading",fixture.sourceKey);unique(fixture.events.map(({id})=>id),"event IDs",fixture.sourceKey);unique(fixture.actions.map(({id})=>id),"action IDs",fixture.sourceKey);unique(fixture.controls.map(({id})=>id),"control IDs",fixture.sourceKey);unique(fixture.media.map(({id})=>id),"media IDs",fixture.sourceKey);
  fixture.actions.forEach((action)=>{required(action.label,`action ${action.id} label`,fixture.sourceKey);if(action.intent!=="toggle-save")local(action.href,action.id,fixture.sourceKey)});
  fixture.controls.forEach((control)=>{required(control.label,`control ${control.id} label`,fixture.sourceKey);if(control.href)local(control.href,control.id,fixture.sourceKey)});
  for(const seat of fixture.media){const record=map.records.find(({sourceSlug,seatId})=>sourceSlug===fixture.sourceKey&&seatId===seat.id);if(!record||record.identityId!==seat.identityId)throw new Error(`${fixture.sourceKey}/${seat.id} has no identity-exact audited media record.`);if(record.src&&(!record.src.startsWith("/media/")||record.src.includes(":")))throw new Error(`${fixture.sourceKey}/${seat.id} has a remote vector path.`);if(record.publicBase&&(!record.publicBase.startsWith("/media/")||record.publicBase.includes(":")))throw new Error(`${fixture.sourceKey}/${seat.id} has a remote raster path.`)}
  if(fixture.sourceKey==="timeline-component-01"){
    const states=fixture.events.map(({state})=>state);if(stress!=="currentNormalized"&&(states.filter((state)=>state==="complete").length!==2||states.filter((state)=>state==="current").length!==1||states.filter((state)=>state==="pending").length!==2))throw new Error("timeline-component-01 requires 2 complete, 1 current and 2 pending events.");
    if(fixture.order.mediaId!==fixture.media[0]?.id)throw new Error("timeline-component-01 product media seat is dangling.");
  }
  if(fixture.sourceKey==="timeline-component-02"){
    const supports=fixture.events.map(({support})=>support);const photos=supports.find(({kind})=>kind==="photo-strip");const services=supports.find(({kind})=>kind==="service-rows");const awards=supports.find(({kind})=>kind==="award-pair");const identities=supports.find(({kind})=>kind==="identity-pair");const avatars=supports.find(({kind})=>kind==="avatar-group");
    if(photos?.kind!=="photo-strip"||photos.mediaIds.length!==5||services?.kind!=="service-rows"||services.rows.length!==2||awards?.kind!=="award-pair"||awards.mediaIds.length!==2||identities?.kind!=="identity-pair"||identities.mediaIds.length!==2||avatars?.kind!=="avatar-group"||avatars.mediaIds.length!==4)throw new Error("timeline-component-02 support counts must remain 5/2/2/2/4.");
  }
  if(fixture.sourceKey==="timeline-component-03"&&!(["progressMid","complete"] as Array<ChronoStressKey>).includes(stress as ChronoStressKey)&&fixture.events.map(({targetProgress})=>targetProgress).join("/")!=="35/70/80/100")throw new Error("timeline-component-03 progress targets must remain 35/70/80/100.");
  if(fixture.sourceKey==="timeline-component-04"&&(fixture.events.some(({skills,responsibilities})=>skills.length!==5||responsibilities.length!==3)||fixture.events.flatMap(({skills})=>skills).length!==20||fixture.events.flatMap(({responsibilities})=>responsibilities).length!==12))throw new Error("timeline-component-04 requires 20 skills and 12 responsibilities.");
  if(fixture.sourceKey==="timeline-component-05"){
    const groups=fixture.events.flatMap(({groups})=>groups);const facts=fixture.events.reduce((sum,event)=>sum+event.summary.length+event.groups.reduce((groupSum,group)=>groupSum+group.facts.length,0),0);
    if(groups.length!==9||facts!==38||fixture.codeProofs.length!==1)throw new Error("timeline-component-05 requires 9 groups, 38 facts and one live code proof.");
    const mediaIds=new Set(fixture.media.map(({id})=>id));if(fixture.events.flatMap(({mediaIds:ids})=>ids).some((id)=>!mediaIds.has(id)))throw new Error("timeline-component-05 has dangling media identity.");
  }
}

export function resolveChronoMedia(map:TimelineMediaMap,fixture:ChronoFixture,seat:ChronoMediaRef,failed=false):ResolvedChronoMedia{
  const record=map.records.find(({sourceSlug,seatId})=>sourceSlug===fixture.sourceKey&&seatId===seat.id);
  if(!record)throw new Error(`${fixture.sourceKey}/${seat.id} has no audited media record.`);
  const base={seatId:seat.id,identityId:seat.identityId,alt:seat.alt,role:seat.role,aspect:seat.aspect};
  if(failed)return {...base,status:"error"};
  if(record.status==="MISSING-RASTER")return {...base,status:"hold"};
  if(!record.src&&!record.publicBase)throw new Error(`${fixture.sourceKey}/${seat.id} has no local delivery path.`);
  return {...base,status:"resolved",src:record.src,publicBase:record.publicBase};
}

export function resolveChronoFixture(fixture:ChronoFixture,map:TimelineMediaMap,stress?:ChronoStressKey):ResolvedChronoFixture{
  const active=structuredClone(fixture) as ChronoFixture;const definition=stress?active.stress[stress]:undefined;
  if(stress&&!definition)throw new Error(`${active.sourceKey} does not declare stress ${stress}.`);
  if(definition?.textPatches)applyTextPatches(active,definition.textPatches);
  if(definition?.omittedPaths)definition.omittedPaths.forEach((pathValue)=>omitPath(active,pathValue));
  if(stress==="currentNormalized"&&active.sourceKey==="timeline-component-01")for(const event of active.events){const override=(definition?.eventStateOverrides as Record<string,TrackingEvent["state"]>|undefined)?.[event.id];if(override)event.state=override}
  if(stress==="progressMid"||stress==="complete")if(active.sourceKey==="timeline-component-03")for(const event of active.events){const override=(definition?.progressOverrides as Record<string,number>|undefined)?.[event.id];if(override!==undefined)event.targetProgress=override}
  validateFixture(active,map,stress);
  const failedMediaIds=new Set<string>((definition?.failedMediaIds as string[]|undefined)??[]);const failedCodeProofIds=new Set<string>((definition?.failedCodeProofIds as string[]|undefined)??[]);
  const mediaById=new Map(active.media.map((seat)=>[seat.id,resolveChronoMedia(map,active,seat,failedMediaIds.has(seat.id))]));
  const initialState=active.initialState as Record<string,unknown>;
  const initial={
    saved:(definition?.saved as boolean|undefined)??(initialState.saved as boolean|undefined)??false,
    activeEventId:(definition?.activeEventId as string|undefined)??(initialState.activeEventId as string|undefined),
    currentEventId:(definition?.currentEventId as string|undefined)??(initialState.currentEventId as string|undefined),
    openEventId:(definition?.openEventId as string|undefined)??(initialState.openEventId as string|undefined),
    activeReleaseId:(definition?.activeReleaseId as string|undefined)??(initialState.activeReleaseId as string|undefined),
    openReleaseId:definition&&"openReleaseId" in definition?(definition.openReleaseId as string|null):(initialState.openReleaseId as string|undefined),
    openGroupIds:[...((definition?.openGroupIds as string[]|undefined)??(initialState.openGroupIds as string[]|undefined)??[])],
    paused:(definition?.paused as boolean|undefined)??false,
    copyState:(definition?.copyState as "idle"|"success"|"error"|undefined)??"idle",
    progressOverrides:(definition?.progressOverrides as Record<string,number>|undefined)??{},
  };
  const terminalEligible=!map.records.some(({sourceSlug,status})=>sourceSlug===active.sourceKey&&status==="MISSING-RASTER");
  return Object.assign(active,{activeStress:stress,terminalEligible,failedMediaIds,failedCodeProofIds,mediaById,initial});
}
