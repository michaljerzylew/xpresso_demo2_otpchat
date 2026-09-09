export const CATEGORY_NAV_SOURCE_KEYS = Array.from({ length: 12 }, (_, index) =>
  `product-category-${String(index + 1).padStart(2, "0")}`,
) as CategoryNavSourceKey[];

export const CATEGORY_NAV_PRESETS = [
  "merchandise-bento", "editorial-pair", "utility-image-rail", "icon-count-list",
  "circular-image-rail", "image-icon-rail", "compact-offer-cards", "cutout-promo-deck",
  "audience-split-cards", "asymmetric-promo-bento", "capsule-campaign", "icon-catalog-grid",
] as const;

export type CategoryNavSourceKey = `product-category-${"01"|"02"|"03"|"04"|"05"|"06"|"07"|"08"|"09"|"10"|"11"|"12"}`;
export type CategoryNavPreset = typeof CATEGORY_NAV_PRESETS[number];
export type CategoryNavComposition = "bento"|"editorial"|"finite-rail"|"icon-list"|"split-grid"|"cutout-deck"|"capsule"|"catalog-grid";
export type ProductCategoryStressKey = "short"|"longLocale"|"error"|"lastDestination"|"railLast"|"collectionActionFocus"|"mediaFallback"|"repeatParity"|"hotspotLast"|"quantity2"|"saved"|"dismissed"|"productMediaFallback"|"roomMediaFallback";
export type CategoryDeviceForm = "M"|"TP"|"TL"|"DS"|"DW";
export type CategoryIcon = "apparel"|"bag"|"footwear"|"jewelry"|"watch"|"device"|"sofa"|"chair"|"lamp"|"storage"|"plant"|"child"|"eyewear";

export type CategoryAction = { id:string;label:string;href:`/demo/${string}`;kind:"destination"|"collection" };
export type CategoryMediaRef = { id:string;alt:string;role:"category-photo"|"product-still"|"editorial-photo";aspect:"1:1"|"4:5"|"3:2"|"16:10";focalPoint?:{xPct:number;yPct:number};reuseGroupId?:string };
export type CategoryDestination = { id:string;label:string;summary?:string;productCount?:number;discountPct?:number;statusLabel?:string;badgeLabel?:string;kicker?:string;icon?:CategoryIcon;mediaId?:string;actionId:string;role:"category"|"promotion";prominence:"standard"|"feature"|"wide";tone?:"neutral"|"accent-1"|"accent-2"|"accent-3"|"accent-4" };
type TextPatch = { targetType:"intro"|"destination"|"action"|"media"|"labels"|"product";targetId:string;field:string;value:string };
type FixtureStress = { short:{textPatches:TextPatch[]};longLocale:{textPatches:TextPatch[];direction?:"rtl"};error:{mediaFailureMessage:string;referenceFailureMessage:string;failMediaIds:string[]} };
export type CategoryNavFixture = { schemaVersion:number;id:string;sourceKey:CategoryNavSourceKey;owner:"CategoryNav";preset:CategoryNavPreset;composition:CategoryNavComposition;intent:"primary-navigation"|"catalog-browse"|"campaign-entry";intro:{eyebrow?:string;heading:string;description?:string};labels:Record<string,string>;destinations:CategoryDestination[];actions:CategoryAction[];media:CategoryMediaRef[];stress:FixtureStress };

type CropRecord = { aspectRatio:string;objectPosition:string;focalX:number;focalY:number };
type DerivativeRecord = { path:string;width:number;height:number;bytes:number;sha256:string;budgetBytes:number;budgetStatus:"pass"|"fail" };
export type ProductCategoryMediaMap = {
  schemaVersion:number;
  counts:{placementsRequired:number;placementsAudited:number;placementsResolved:number;placementsMissing:number;minimumIdentitiesRequired:number;identitiesResolved:number;identitiesMissing:number;source01To12Placements:number;source13Placements:number;source06Placements:number;source06ReuseGroups:number;generated:number;substitutesUsed:number};
  placements:Array<{slug:string;seatId:string;role:string;aspect:string;status:"resolved"|"MISSING-SEAT";assetId?:string;identityId:string;reuseGroupId?:string}>;
  approvedAssets:Array<{assetId:string;crops:Record<CategoryDeviceForm,CropRecord>;derivatives:{avif1280:DerivativeRecord;webp1280:DerivativeRecord;avif1920:DerivativeRecord;webp1920:DerivativeRecord}}>;
  coherentSets:Array<{coherentSetId:string;status:string;requiredIdentities:string[];rule:string}>;
};

export type ResolvedCategoryMedia = { seatId:string;identityId:string;status:"resolved"|"hold"|"error";alt:string;publicBase?:string;objectPosition?:string;reuseGroupId?:string };
export type ResolvedCategoryNav = Omit<CategoryNavFixture,"stress"> & { activeStress?:ProductCategoryStressKey;direction?:"rtl";failedMediaIds:Set<string>;mediaById:Map<string,ResolvedCategoryMedia>;messages:{mediaFailure:string;referenceFailure:string} };

const REQUIREMENTS:Record<CategoryNavSourceKey,{preset:CategoryNavPreset;composition:CategoryNavComposition;destinations:number;actions:number;media:number}> = {
  "product-category-01":{preset:"merchandise-bento",composition:"bento",destinations:6,actions:6,media:6},
  "product-category-02":{preset:"editorial-pair",composition:"editorial",destinations:2,actions:3,media:2},
  "product-category-03":{preset:"utility-image-rail",composition:"finite-rail",destinations:8,actions:8,media:8},
  "product-category-04":{preset:"icon-count-list",composition:"icon-list",destinations:6,actions:7,media:0},
  "product-category-05":{preset:"circular-image-rail",composition:"finite-rail",destinations:8,actions:8,media:8},
  "product-category-06":{preset:"image-icon-rail",composition:"finite-rail",destinations:8,actions:8,media:8},
  "product-category-07":{preset:"compact-offer-cards",composition:"split-grid",destinations:4,actions:5,media:4},
  "product-category-08":{preset:"cutout-promo-deck",composition:"cutout-deck",destinations:3,actions:4,media:3},
  "product-category-09":{preset:"audience-split-cards",composition:"split-grid",destinations:4,actions:5,media:4},
  "product-category-10":{preset:"asymmetric-promo-bento",composition:"bento",destinations:4,actions:5,media:4},
  "product-category-11":{preset:"capsule-campaign",composition:"capsule",destinations:4,actions:5,media:3},
  "product-category-12":{preset:"icon-catalog-grid",composition:"catalog-grid",destinations:8,actions:9,media:8},
};

const required=(value:unknown,label:string,source:string)=>{if(typeof value!=="string"||!value.trim())throw new Error(`${source} requires ${label}.`)};
const unique=(values:string[],label:string,source:string)=>{if(new Set(values).size!==values.length)throw new Error(`${source} repeats ${label}.`)};
const local=(href:string,label:string,source:string)=>{if(!href.startsWith("/demo/")||href.includes(":")||href.includes("//"))throw new Error(`${source}/${label} requires one local /demo route.`)};
const publicBase=(path:string)=>`/media/${path.split("/").at(-1)?.replace(/-1280\.avif$/,"")}`;

function applyTextPatches<T extends CategoryNavFixture>(fixture:T,patches:TextPatch[]):T {
  const output=structuredClone(fixture);
  for(const patch of patches){
    let target:Record<string,unknown>|undefined;
    if(patch.targetType==="intro")target=output.intro;
    else if(patch.targetType==="labels")target=output.labels;
    else if(patch.targetType==="destination")target=output.destinations.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    else if(patch.targetType==="action")target=output.actions.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    else if(patch.targetType==="media")target=output.media.find(({id})=>id===patch.targetId) as unknown as Record<string,unknown>;
    if(!target||!(patch.field in target))throw new Error(`${fixture.sourceKey} stress references unknown ${patch.targetType}/${patch.targetId}/${patch.field}.`);
    target[patch.field]=patch.value;
  }
  return output;
}

export function resolveCategoryMedia(map:ProductCategoryMediaMap,slug:string,seat:CategoryMediaRef,form:CategoryDeviceForm,failed=false):ResolvedCategoryMedia {
  const placement=map.placements.find((item)=>item.slug===slug&&item.seatId===seat.id);
  if(!placement)throw new Error(`${slug}/${seat.id} has no audited media placement.`);
  if(failed)return {seatId:seat.id,identityId:placement.identityId,status:"error",alt:seat.alt,reuseGroupId:placement.reuseGroupId};
  if(placement.status==="MISSING-SEAT")return {seatId:seat.id,identityId:placement.identityId,status:"hold",alt:seat.alt,reuseGroupId:placement.reuseGroupId};
  const asset=map.approvedAssets.find(({assetId})=>assetId===placement.assetId);
  if(!asset||asset.derivatives.avif1280.budgetStatus!=="pass"||asset.derivatives.webp1280.budgetStatus!=="pass")throw new Error(`${slug}/${seat.id} has no approved local derivative pair.`);
  return {seatId:seat.id,identityId:placement.identityId,status:"resolved",alt:seat.alt,publicBase:publicBase(asset.derivatives.avif1280.path),objectPosition:asset.crops[form]?.objectPosition,reuseGroupId:placement.reuseGroupId};
}

function validate(fixture:CategoryNavFixture,map:ProductCategoryMediaMap){
  const requirement=REQUIREMENTS[fixture.sourceKey];
  if(!requirement||fixture.owner!=="CategoryNav"||fixture.preset!==requirement.preset||fixture.composition!==requirement.composition)throw new Error(`${fixture.sourceKey} is outside the closed CategoryNav contract.`);
  if(fixture.destinations.length!==requirement.destinations||fixture.actions.length!==requirement.actions||fixture.media.length!==requirement.media)throw new Error(`${fixture.sourceKey} inventory differs from its closed preset.`);
  required(fixture.intro.heading,"intro heading",fixture.sourceKey);unique(fixture.destinations.map(({id})=>id),"destination IDs",fixture.sourceKey);unique(fixture.actions.map(({id})=>id),"action IDs",fixture.sourceKey);unique(fixture.media.map(({id})=>id),"media IDs",fixture.sourceKey);
  const actionIds=new Set(fixture.actions.map(({id})=>id),),mediaIds=new Set(fixture.media.map(({id})=>id));
  fixture.actions.forEach((action)=>{required(action.label,`action ${action.id} label`,fixture.sourceKey);local(action.href,action.id,fixture.sourceKey)});
  fixture.destinations.forEach((destination)=>{required(destination.label,`destination ${destination.id} label`,fixture.sourceKey);if(!actionIds.has(destination.actionId))throw new Error(`${fixture.sourceKey}/${destination.id} has a dangling action.`);if(destination.mediaId&&!mediaIds.has(destination.mediaId))throw new Error(`${fixture.sourceKey}/${destination.id} has a dangling media seat.`)});
  for(const seat of fixture.media)resolveCategoryMedia(map,fixture.sourceKey,seat,"M");
  if(fixture.sourceKey==="product-category-06"){
    const groups=fixture.media.map(({reuseGroupId})=>reuseGroupId);if(groups.some((id)=>!id)||new Set(groups).size!==4||[...new Set(groups)].some((id)=>groups.filter((value)=>value===id).length!==2))throw new Error("product-category-06 must preserve eight placements across four two-seat reuse groups.");
  }
}

export function resolveCategoryNavFixture(fixture:CategoryNavFixture,map:ProductCategoryMediaMap,stress?:ProductCategoryStressKey):ResolvedCategoryNav{
  const copyStress=stress==="short"||stress==="longLocale"?stress:undefined;
  const active=copyStress?applyTextPatches(fixture,fixture.stress[copyStress].textPatches):structuredClone(fixture);
  validate(active,map);
  const failedMediaIds=new Set<string>(stress==="error"?active.stress.error.failMediaIds:stress==="mediaFallback"&&active.media[0]?[active.media[0].id]:[]);
  const mediaById=new Map(active.media.map((seat)=>[seat.id,resolveCategoryMedia(map,active.sourceKey,seat,"M",failedMediaIds.has(seat.id))]));
  const {stress:_,...core}=active;
  return {...core,activeStress:stress,direction:stress==="longLocale"?"rtl":undefined,failedMediaIds,mediaById,messages:{mediaFailure:active.stress.error.mediaFailureMessage,referenceFailure:active.stress.error.referenceFailureMessage}};
}
