export const CONTACT_SOURCE_KEYS = Array.from({ length: 16 }, (_, index) =>
  `contact-us-page-${String(index + 1).padStart(2, "0")}`,
) as ContactSourceKey[];

export type ContactSourceKey = `contact-us-page-${string}`;
export type ContactComposition = "directory" | "info-form" | "hero-form" | "map-form" | "media-form" | "shell-form" | "proof-form";
export type ContactActionKind = "call" | "email" | "directions" | "chat" | "navigation" | "social" | "resource" | "privacy" | "submit";
export type ContactStressKey = "short" | "longLocale" | "error";
export type ContactFormStatus = "idle" | "invalid" | "submitting" | "success" | "error";

export type ContactAction = { id:string;kind:ContactActionKind;label:string;href?:string };
export type ContactChannel = { id:string;type:"call"|"email"|"directions"|"chat"|"fax"|"hours";label:string;value:string;actionIds:string[];iconKey:string };
export type ContactOffice = { id:string;name:string;description:string;illustrationId?:string;mediaId?:string;channels:ContactChannel[] };
export type ContactMethod = { id:string;label:string;description:string };
export type ContactField = { id:string;kind:"name"|"email"|"phone"|"subject"|"message"|"budget";label:string;placeholder:string;help?:string;required:boolean;autocomplete?:string;inputMode?:"email"|"tel"|"decimal";maxLength:number };
export type ContactChoice = { id:string;label:string;value:string };
export type ContactFormSpec = { id:string;fields:ContactField[];services:ContactChoice[];submitActionId:string;successTitle:string;successBody:string;errorSummaryTitle:string;submittingLabel:string;fieldErrors:Array<{fieldId:string;message:string}> };
export type ContactMediaSeat = { id:string;kind:"photo"|"avatar";role:string;alt:string;aspect:string;focalPoint:{x:number;y:number} };
export type ContactVectorSeat = { id:string;kind:"identity-mark"|"location-illustration"|"company-mark";role:string;aspect:string };
export type ContactProof = { id:string;kind:"map-ui"|"dashboard-ui";title?:string;placeLabel?:string;scene?:string;routeActionId?:string };
export type ContactClient = { id:string;name:string;role:string;mediaId:string };
export type ContactCompany = { id:string;name:string;vectorId:string };
export type ContactStress = { textPatches?:Array<{targetId:string;field:string;value:string}>;errorSummaryTitle?:string;fieldErrors?:Array<{fieldId:string;message:string}> }|null;

export type ContactFixture = {
  schemaVersion:1;owner:"Contact";sourceKey:ContactSourceKey;preset:string;composition:ContactComposition;
  eyebrow?:string|null;heading:string;description:string;identityLabel?:string|null;
  channels:ContactChannel[];offices:ContactOffice[];methods:ContactMethod[];actions:ContactAction[];form:ContactFormSpec|null;
  media:ContactMediaSeat[];vectors:ContactVectorSeat[];proofs:ContactProof[];clients:ContactClient[];companies:ContactCompany[];
  testimonial:{id:string;name:string;role:string;quote:string;rating:number;mediaId:string}|null;
  profile:{id:string;name:string;role:string;availability:string;mediaId:string;socialActionIds:string[];companyVectorIds:string[]}|null;
  clientCountLabel?:string|null;
  shellLinks:{topActionIds:string[];footerActionIds:string[];socialActionIds:string[];identityVectorId:string}|null;
  behavior:{compactRank:string[];wideRank:string[];compactDirectory:"rows"|"rail";stickySubmitOnTouch:boolean};
  stress:Record<ContactStressKey,ContactStress>;
};

export type ContactMediaRecord = { slug:ContactSourceKey;seatId:string;kind:"photo"|"avatar"|"portrait"|"vector"|"runtime-ui";role:string;assetId?:string;publicBase?:string;src?:string;status:string;focals?:Record<string,{objectPosition:string}> };
export type ResolvedContactMedia = ContactMediaRecord & { fixtureSeatId:string;alt:string };
export type ResolvedContactFixture = Omit<ContactFixture,"stress"> & { activeStress?:ContactStressKey;mediaById:ReadonlyMap<string,ResolvedContactMedia>;vectorById:ReadonlyMap<string,ResolvedContactMedia>;failedMedia:boolean;failedProof:boolean };

const expectations:Record<ContactSourceKey,{preset:string;composition:ContactComposition;actions:number;fields:number;choices:number;media:number;vectors:number;proofs:number;forms:number}>={
  "contact-us-page-01":{preset:"photo-info-grid",composition:"directory",actions:4,fields:0,choices:0,media:1,vectors:0,proofs:0,forms:0},
  "contact-us-page-02":{preset:"dark-info-card",composition:"info-form",actions:4,fields:4,choices:0,media:0,vectors:0,proofs:0,forms:1},
  "contact-us-page-03":{preset:"hero-overlap",composition:"hero-form",actions:4,fields:4,choices:0,media:1,vectors:1,proofs:0,forms:1},
  "contact-us-page-04":{preset:"map-services",composition:"map-form",actions:5,fields:3,choices:4,media:0,vectors:0,proofs:1,forms:1},
  "contact-us-page-05":{preset:"illustrated-offices",composition:"directory",actions:9,fields:0,choices:0,media:0,vectors:3,proofs:0,forms:0},
  "contact-us-page-06":{preset:"channel-photo-overlap",composition:"media-form",actions:5,fields:4,choices:0,media:1,vectors:0,proofs:0,forms:1},
  "contact-us-page-07":{preset:"office-photo-band",composition:"directory",actions:10,fields:0,choices:0,media:3,vectors:0,proofs:0,forms:0},
  "contact-us-page-08":{preset:"page-shell-split",composition:"shell-form",actions:18,fields:3,choices:0,media:1,vectors:1,proofs:0,forms:1},
  "contact-us-page-09":{preset:"hero-contact-panel",composition:"hero-form",actions:8,fields:4,choices:0,media:1,vectors:0,proofs:0,forms:1},
  "contact-us-page-10":{preset:"compact-contact-card",composition:"info-form",actions:6,fields:3,choices:0,media:0,vectors:0,proofs:0,forms:1},
  "contact-us-page-11":{preset:"photo-collage",composition:"media-form",actions:2,fields:3,choices:0,media:2,vectors:0,proofs:0,forms:1},
  "contact-us-page-12":{preset:"office-client-proof",composition:"media-form",actions:1,fields:4,choices:4,media:7,vectors:0,proofs:0,forms:1},
  "contact-us-page-13":{preset:"testimonial-form",composition:"media-form",actions:1,fields:4,choices:4,media:1,vectors:0,proofs:0,forms:1},
  "contact-us-page-14":{preset:"dashboard-proof",composition:"proof-form",actions:1,fields:4,choices:4,media:0,vectors:6,proofs:1,forms:1},
  "contact-us-page-15":{preset:"portrait-contact",composition:"media-form",actions:3,fields:4,choices:4,media:1,vectors:0,proofs:0,forms:1},
  "contact-us-page-16":{preset:"profile-availability",composition:"media-form",actions:5,fields:4,choices:4,media:1,vectors:5,proofs:0,forms:1},
};

const exact=(actual:number,wanted:number,source:string,label:string)=>{if(actual!==wanted)throw new Error(`[contact-source-parity] ${source} requires exactly ${wanted} ${label}.`)};
const unique=(values:string[],source:string,label:string)=>{if(new Set(values).size!==values.length)throw new Error(`[contact-source-parity] ${source} repeats ${label}.`)};
const routeValid=(action:ContactAction)=>action.kind==="submit"?!action.href:action.kind==="call"?/^tel:\+?[0-9]+$/.test(action.href??""):action.kind==="email"?/^mailto:[^@\s]+@[^@\s]+$/.test(action.href??""):action.kind==="directions"?/^https:\/\/www\.openstreetmap\.org\/directions\?/.test(action.href??""):/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(action.href??"");

function applyStress(input:ContactFixture,stress?:ContactStressKey){
  const fixture=structuredClone(input);if(!stress)return fixture;const patch=fixture.stress[stress];if(!patch)return fixture;
  const roots:Array<Record<string,unknown>>=[fixture as unknown as Record<string,unknown>];
  const pools=[fixture.actions,fixture.channels,fixture.offices,...fixture.offices.map(({channels})=>channels),fixture.methods,fixture.form?[fixture.form]:[],fixture.form?.fields??[],fixture.form?.services??[],fixture.media,fixture.vectors,fixture.proofs,fixture.clients,fixture.companies,fixture.testimonial?[fixture.testimonial]:[],fixture.profile?[fixture.profile]:[]] as Array<Array<Record<string,unknown>>>;
  for(const change of patch.textPatches??[]){const target=change.targetId==="fixture-root"?roots[0]:pools.flat().find((record)=>record.id===change.targetId);if(!target)throw new Error(`[contact-stress] ${fixture.sourceKey} references ${change.targetId}.`);if(change.field==="errorMessage"&&fixture.form){const entry=fixture.form.fieldErrors.find(({fieldId})=>fieldId===change.targetId);if(!entry)throw new Error(`[contact-stress] ${fixture.sourceKey} misses error for ${change.targetId}.`);entry.message=change.value;continue}if(!(change.field in target))throw new Error(`[contact-stress] ${fixture.sourceKey} references ${change.targetId}.${change.field}.`);target[change.field]=change.value}
  if(fixture.form&&patch.errorSummaryTitle)fixture.form.errorSummaryTitle=patch.errorSummaryTitle;if(fixture.form&&patch.fieldErrors)fixture.form.fieldErrors=structuredClone(patch.fieldErrors);
  return fixture;
}

export function validateContactFixture(fixture:ContactFixture){
  const expected=expectations[fixture.sourceKey];if(!expected||fixture.schemaVersion!==1||fixture.owner!=="Contact")throw new Error(`[contact-closed-map] Unknown or invalid Contact source ${fixture.sourceKey}.`);
  if(fixture.preset!==expected.preset||fixture.composition!==expected.composition)throw new Error(`[contact-closed-map] ${fixture.sourceKey} remaps its preset/composition.`);
  exact(fixture.actions.length,expected.actions,fixture.sourceKey,"actions");exact(fixture.form?.fields.length??0,expected.fields,fixture.sourceKey,"fields");exact(fixture.form?.services.length??0,expected.choices,fixture.sourceKey,"service choices");exact(fixture.media.length,expected.media,fixture.sourceKey,"raster seats");exact(fixture.vectors.length,expected.vectors,fixture.sourceKey,"vector seats");exact(fixture.proofs.length,expected.proofs,fixture.sourceKey,"proof scenes");exact(fixture.form?1:0,expected.forms,fixture.sourceKey,"forms");
  unique([...fixture.actions,...fixture.channels,...fixture.offices,...fixture.offices.flatMap(({channels})=>channels),...fixture.methods,...(fixture.form?.fields??[]),...(fixture.form?.services??[]),...fixture.media,...fixture.vectors,...fixture.proofs,...fixture.clients,...fixture.companies].map(({id})=>id),fixture.sourceKey,"record IDs");
  for(const action of fixture.actions)if(!action.id||!action.label.trim()||!routeValid(action))throw new Error(`[contact-native-action] ${fixture.sourceKey} has an invalid ${action.kind} action ${action.id}.`);
  const actionIds=new Set(fixture.actions.map(({id})=>id));const mediaIds=new Set(fixture.media.map(({id})=>id));const vectorIds=new Set(fixture.vectors.map(({id})=>id));
  for(const channel of [...fixture.channels,...fixture.offices.flatMap(({channels})=>channels)])for(const id of channel.actionIds)if(!actionIds.has(id))throw new Error(`[contact-reference] ${fixture.sourceKey} channel ${channel.id} references a missing action.`);
  if(fixture.form){if(!actionIds.has(fixture.form.submitActionId)||fixture.actions.find(({id})=>id===fixture.form!.submitActionId)?.kind!=="submit")throw new Error(`[contact-form] ${fixture.sourceKey} submit action is orphaned.`);exact(fixture.form.fieldErrors.length,fixture.form.fields.filter(({required})=>required).length,fixture.sourceKey,"required-field errors");for(const error of fixture.form.fieldErrors)if(!fixture.form.fields.some(({id})=>id===error.fieldId))throw new Error(`[contact-form] ${fixture.sourceKey} error references an unknown field.`)}
  for(const client of fixture.clients)if(!mediaIds.has(client.mediaId))throw new Error(`[contact-reference] ${fixture.sourceKey} client media is orphaned.`);for(const company of fixture.companies)if(!vectorIds.has(company.vectorId))throw new Error(`[contact-reference] ${fixture.sourceKey} company vector is orphaned.`);
  if(fixture.testimonial&&!mediaIds.has(fixture.testimonial.mediaId))throw new Error(`[contact-reference] ${fixture.sourceKey} testimonial media is orphaned.`);if(fixture.profile&&(!mediaIds.has(fixture.profile.mediaId)||fixture.profile.companyVectorIds.some((id)=>!vectorIds.has(id))||fixture.profile.socialActionIds.some((id)=>!actionIds.has(id))))throw new Error(`[contact-reference] ${fixture.sourceKey} profile relation is orphaned.`);
  if(fixture.sourceKey==="contact-us-page-08"&&(!fixture.shellLinks||fixture.shellLinks.topActionIds.length!==4||fixture.shellLinks.footerActionIds.length!==9||fixture.shellLinks.socialActionIds.length!==4))throw new Error("[contact-shell] source08 requires exact 4/9/4 shell groups.");
  if(fixture.sourceKey==="contact-us-page-12")exact(fixture.clients.length,6,fixture.sourceKey,"clients");if(fixture.sourceKey==="contact-us-page-14")exact(fixture.companies.length,6,fixture.sourceKey,"companies");if(fixture.sourceKey==="contact-us-page-16")exact(fixture.profile?.companyVectorIds.length??0,5,fixture.sourceKey,"profile companies");
  if(/(?:shadcn|figma|openai|chatgpt|milkies|vendor)/i.test(JSON.stringify(fixture)))throw new Error(`[contact-origin] ${fixture.sourceKey} contains a forbidden vendor mark.`);
}

export function resolveContactFixture(input:ContactFixture,records:ContactMediaRecord[],stress?:ContactStressKey):ResolvedContactFixture{
  validateContactFixture(input);const fixture=applyStress(input,stress);validateContactFixture(fixture);
  const sourceRecords=records.filter(({slug})=>slug===fixture.sourceKey);const rasterRecords=sourceRecords.filter(({kind})=>kind!=="vector"&&kind!=="runtime-ui");const vectorRecords=sourceRecords.filter(({kind})=>kind==="vector");
  exact(rasterRecords.length,fixture.media.length,fixture.sourceKey,"resolved raster records");exact(vectorRecords.length,fixture.vectors.length,fixture.sourceKey,"resolved vector records");
  const identityName=(assetId?:string)=>assetId?.replace(/^(?:about-us|dashboard-dialog)-/,"").split("-").map((part)=>part.charAt(0).toUpperCase()+part.slice(1)).join(" ");
  const linkedIdentities=new Map<string,string>();for(const client of fixture.clients){const seatIndex=fixture.media.findIndex(({id})=>id===client.mediaId);const name=identityName(rasterRecords[seatIndex]?.assetId);if(name){client.name=name;linkedIdentities.set(client.mediaId,name)}}if(fixture.testimonial){const seatIndex=fixture.media.findIndex(({id})=>id===fixture.testimonial!.mediaId);const name=identityName(rasterRecords[seatIndex]?.assetId);if(name){fixture.testimonial.name=name;linkedIdentities.set(fixture.testimonial.mediaId,name)}}if(fixture.profile){const seatIndex=fixture.media.findIndex(({id})=>id===fixture.profile!.mediaId);const name=identityName(rasterRecords[seatIndex]?.assetId);if(name){fixture.profile.name=name;linkedIdentities.set(fixture.profile.mediaId,name)}}
  const mediaById=new Map<string,ResolvedContactMedia>();fixture.media.forEach((seat,index)=>{const record=rasterRecords[index];if(!record?.publicBase||!record.publicBase.startsWith("/media/"))throw new Error(`[contact-media] ${fixture.sourceKey} raster ${seat.id} has no local source.`);const name=linkedIdentities.get(seat.id);mediaById.set(seat.id,{...record,fixtureSeatId:seat.id,alt:name?`Portrait of ${name}`:seat.alt})});
  const vectorById=new Map<string,ResolvedContactMedia>();fixture.vectors.forEach((seat,index)=>{const record=vectorRecords[index];if(!record?.src?.startsWith("/media/"))throw new Error(`[contact-media] ${fixture.sourceKey} vector ${seat.id} has no local source.`);vectorById.set(seat.id,{...record,fixtureSeatId:seat.id,alt:seat.role})});
  return {...fixture,activeStress:stress,mediaById,vectorById,failedMedia:false,failedProof:false};
}
