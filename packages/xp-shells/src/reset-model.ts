import type {
  AuthShellPreset,
  ResolvedAuthPerson,
  ResolvedAuthProof,
  ResolvedAuthShellIdentity,
  ResolvedAuthShellModel,
} from "./auth-model";

export const RESET_SOURCE_KEYS = [
  "reset-password-01","reset-password-02","reset-password-03",
  "reset-password-04","reset-password-05","reset-password-06",
] as const;
export type ResetSourceKey=(typeof RESET_SOURCE_KEYS)[number];
export type ResetStress="base"|"short"|"longLocale";
export type ResetPreset="set-new-password";
export type ResetFieldId="email"|"password"|"confirm";

export type ResetFixtureField={
  id:ResetFieldId;name:ResetFieldId;type:"email"|"password";
  autoComplete:"email"|"new-password";inputMode?:"email";enterKeyHint:"next"|"done";
  autoCapitalize?:"none";spellCheck?:false;required:true;
  labelKey:string;placeholderKey:string;requiredErrorKey:string;invalidErrorKey?:string;
};
export type ResetFixtureAction={id:string;role:"back"|"home"|"back-login"|"submit"|"continue-login"|"request-new-link";labelKey:string;href?:string;method?:"post";action?:string};
export type ResetFixtureRule={id:"length"|"case"|"number"|"symbol";labelKey:string};
export type ResetFixtureMedia={id:string;kind:string;markId?:string;proofId?:string;owner?:string;codeOwned?:boolean;rasterized?:boolean;personId?:string;assetId?:string;canonicalAssetId?:string|null;initials?:string;altKey?:string;labelKey?:string;status?:"HOLD-INFRA"|"ready";decision?:"D-M38"};
export type ResetFixtureProof=
  | {kind:"dashboard";proofId:"dash-02";titleKey:string;altKey:string;fallbackHeadingKey:string;fallbackBodyKey:string;retryLabelKey:string;detailsOpenKey:string;detailsCloseKey:string;codeOwned:true;rasterized:false}
  | {kind:"dashboard-and-badges";proofId:"dash-04";titleKey:string;altKey:string;fallbackHeadingKey:string;fallbackBodyKey:string;retryLabelKey:string;detailsOpenKey:string;detailsCloseKey:string;editorialHeadingKey:string;editorialBodyKey:string;badgeLabelKeys:[string,string,string];codeOwned:true;rasterized:false}
  | {kind:"trust-proof";titleKey:string;bodyKey:string;detailsOpenKey:string;detailsCloseKey:string;markAltKey:string;peopleHeadingKey:string;peopleBodyKey:string;aggregateKey:string;people:["p_006","p_010","p_018"]}
  | {kind:"trust-chips";titleKey:string;bodyKey:string;detailsOpenKey:string;detailsCloseKey:string;markAltKey:string;peopleHeadingKey:string;peopleBodyKey:string;aggregateKey:string;chips:Array<{id:string;initials:string;labelKey:string}>};

export type ResetFixture={
  schemaVersion:1;packet:"reset-password-contract-v1";sourceKey:ResetSourceKey;owner:"ResetUnit";shellOwner:"AuthShell";
  shellPreset:AuthShellPreset;resetPreset:ResetPreset;identity:{companyId:string;name:string;markId:string|null};
  intro:{headingKey:string;bodyKey:string};fields:ResetFixtureField[];shellActions:ResetFixtureAction[];
  backToLogin:ResetFixtureAction;submit:ResetFixtureAction;doneAction:ResetFixtureAction;expiredAction:ResetFixtureAction;
  rules:ResetFixtureRule[];proof?:ResetFixtureProof|null;
  ambient?:{photoId:string;kind:"dark-wave";assetId:string;status:"ready";decision:"D-M38";codeOwned:true;rasterized:false;altKey:string;fallbackHeadingKey:string;fallbackBodyKey:string;reducedDataKey:string;motionPauseKey:string;motionResumeKey:string;motionStaticKey:string}|null;
  stateKeys:Record<string,string>;media:ResetFixtureMedia[];copy:Record<ResetStress,Record<string,string>>;
};

export type ResolvedResetField=Omit<ResetFixtureField,"labelKey"|"placeholderKey"|"requiredErrorKey"|"invalidErrorKey">&{label:string;placeholder:string;requiredError:string;invalidError?:string};
export type ResolvedResetAction=Omit<ResetFixtureAction,"labelKey">&{label:string};
export type ResolvedResetRule={id:ResetFixtureRule["id"];label:string};
export type ResolvedResetProof=
  | {kind:"dashboard";proofId:"dash-02";title:string;alt:string;fallback:{heading:string;body:string;retry:string};disclosure:{open:string;close:string}}
  | {kind:"dashboard-and-badges";proofId:"dash-04";title:string;alt:string;fallback:{heading:string;body:string;retry:string};disclosure:{open:string;close:string};editorial:{heading:string;body:string};badges:Array<{id:string;markId:string;label:string}>}
  | {kind:"trust-proof";title:string;body:string;peopleHeading:string;peopleBody:string;aggregate:string;markAlt:string;disclosure:{open:string;close:string};people:ResolvedAuthPerson[]}
  | {kind:"trust-chips";title:string;body:string;peopleHeading:string;peopleBody:string;aggregate:string;markAlt:string;disclosure:{open:string;close:string};people:ResolvedAuthPerson[]};

export type ResolvedResetFixture={
  sourceKey:ResetSourceKey;shellPreset:AuthShellPreset;resetPreset:ResetPreset;activeStress:ResetStress;
  identity?:ResolvedAuthShellIdentity;intro:{heading:string;body:string};fields:ResolvedResetField[];
  shellActions:ResolvedResetAction[];backToLogin:ResolvedResetAction;submit:ResolvedResetAction;doneAction:ResolvedResetAction;expiredAction:ResolvedResetAction;
  rules:ResolvedResetRule[];proof?:ResolvedResetProof;photo?:{kind:"dark-wave";assetId:string;alt:string;fallback:{heading:string;body:string;reducedData:string};status:"ready"};
  ambient:{treatment:"outline"|"proof-edge"|"graphic-mark"|"none"|"lines"|"silk-photo";motion:boolean};mediaStatus:"ready"|"hold";
  labels:Record<string,string>;
};

const EXPECTED:Record<ResetSourceKey,{shell:AuthShellPreset;fields:string;proof:string;ambient:ResolvedResetFixture["ambient"]["treatment"];hold:boolean}>={
  "reset-password-01":{shell:"centered-quick-entry",fields:"email|password|confirm",proof:"none",ambient:"outline",hold:false},
  "reset-password-02":{shell:"product-proof-split",fields:"email|password|confirm",proof:"dashboard",ambient:"proof-edge",hold:false},
  "reset-password-03":{shell:"graphic-trust-split",fields:"password|confirm",proof:"trust-proof",ambient:"graphic-mark",hold:false},
  "reset-password-04":{shell:"trial-proof-split",fields:"password|confirm",proof:"dashboard-and-badges",ambient:"none",hold:false},
  "reset-password-05":{shell:"centered-social-card",fields:"password|confirm",proof:"none",ambient:"lines",hold:false},
  "reset-password-06":{shell:"ambient-trust-split",fields:"password|confirm",proof:"trust-chips",ambient:"silk-photo",hold:false},
};
const MARKS:Record<string,ResolvedAuthShellIdentity>={
  "mark-c_001":{companyId:"c_001",name:"Avelor Grid",markId:"mark-c_001",src:"/media/logo-avelor-grid-symbol-color-on-light.svg",inverseSrc:"/media/logo-avelor-grid-symbol-color-on-dark.svg"},
  "mark-c_002":{companyId:"c_002",name:"Brentex Point",markId:"mark-c_002",src:"/media/logo-brentex-point-symbol-color-on-light.svg",inverseSrc:"/media/logo-brentex-point-symbol-color-on-dark.svg"},
  "mark-c_003":{companyId:"c_003",name:"Caldara Data",markId:"mark-c_003",src:"/media/logo-caldara-data-symbol-color-on-light.svg",inverseSrc:"/media/logo-caldara-data-symbol-color-on-dark.svg"},
  "mark-c_005":{companyId:"c_005",name:"Entralis Forge",markId:"mark-c_005",src:"/media/logo-entralis-forge-symbol-color-on-light.svg",inverseSrc:"/media/logo-entralis-forge-symbol-color-on-dark.svg"},
  "mark-c_006":{companyId:"c_006",name:"Falden Code",markId:"mark-c_006",src:"/media/logo-falden-code-symbol-color-on-light.svg",inverseSrc:"/media/logo-falden-code-symbol-color-on-dark.svg"},
};
const PEOPLE:Record<string,Omit<ResolvedAuthPerson,"alt">>={
  p_006:{id:"p_006",name:"Anya Sokolov",assetId:"avatar-p_006",initials:"AS",status:"delivered",avif:"/media/about-us-anya-sokolov-avatar-256.avif",webp:"/media/about-us-anya-sokolov-avatar-256.webp",jpg:"/media/about-us-anya-sokolov-avatar-256.jpg"},
  p_010:{id:"p_010",name:"Chen Wei",assetId:"avatar-p_010",initials:"CW",status:"delivered",avif:"/media/team-section-07-portrait-07-1-avatar-256.avif",webp:"/media/team-section-07-portrait-07-1-avatar-256.webp",jpg:"/media/team-section-07-portrait-07-1-avatar-256.jpg"},
  p_018:{id:"p_018",name:"Katarina Novak",assetId:"avatar-p_018",initials:"KN",status:"delivered",avif:"/media/about-us-katarina-novak-avatar-256.avif",webp:"/media/about-us-katarina-novak-avatar-256.webp",jpg:"/media/about-us-katarina-novak-avatar-256.jpg"},
};
const required=(value:unknown,label:string,source:string)=>{if(typeof value!=="string"||!value.trim())throw new Error(`${source} requires ${label}.`);return value;};
const text=(copy:Record<string,string>,key:unknown,label:string,source:string)=>required(copy[required(key,`${label} key`,source)],label,source);
const local=(value:string|undefined,label:string,source:ResetSourceKey)=>{if(!value?.startsWith(`/demo/${source}/`)||value.includes("#")||/^(?:https?:)?\/\//i.test(value))throw new Error(`${source} ${label} must be a source-owned local path.`);};

function action(value:ResetFixtureAction,copy:Record<string,string>,source:ResetSourceKey):ResolvedResetAction{
  if(value.role==="submit"){if(value.method!=="post"||value.href)throw new Error(`${source} submit contract drifted.`);local(value.action,"submit",source);}else{if(value.method||value.action)throw new Error(`${source} navigation action cannot submit.`);local(value.href,value.id,source);}
  return {...value,label:text(copy,value.labelKey,`${value.id} label`,source)};
}
function identity(f:ResetFixture){if(f.identity.markId===null)return undefined;const mark=MARKS[f.identity.markId];if(!mark||mark.companyId!==f.identity.companyId||mark.name!==f.identity.name)throw new Error(`${f.sourceKey} identity drifted.`);return mark;}
function resolveProof(f:ResetFixture,copy:Record<string,string>):ResolvedResetProof|undefined{
  const p=f.proof;if(!p)return undefined;
  const disclosure={open:text(copy,p.detailsOpenKey,"proof open",f.sourceKey),close:text(copy,p.detailsCloseKey,"proof close",f.sourceKey)};
  if(p.kind==="trust-proof")return {kind:p.kind,title:text(copy,p.titleKey,"trust title",f.sourceKey),body:text(copy,p.bodyKey,"trust body",f.sourceKey),peopleHeading:text(copy,p.peopleHeadingKey,"people heading",f.sourceKey),peopleBody:text(copy,p.peopleBodyKey,"people body",f.sourceKey),aggregate:text(copy,p.aggregateKey,"aggregate",f.sourceKey),markAlt:text(copy,p.markAltKey,"trust mark",f.sourceKey),disclosure,people:p.people.map(id=>({...PEOPLE[id],alt:text(copy,`person_${id==="p_006"?"anya":id==="p_010"?"chen":"katarina"}_alt`,`${id} alt`,f.sourceKey)}))};
  if(p.kind==="trust-chips")return {kind:p.kind,title:text(copy,p.titleKey,"trust title",f.sourceKey),body:text(copy,p.bodyKey,"trust body",f.sourceKey),peopleHeading:text(copy,p.peopleHeadingKey,"people heading",f.sourceKey),peopleBody:text(copy,p.peopleBodyKey,"people body",f.sourceKey),aggregate:text(copy,p.aggregateKey,"aggregate",f.sourceKey),markAlt:text(copy,p.markAltKey,"trust mark",f.sourceKey),disclosure,people:p.chips.map(chip=>({id:chip.id,name:text(copy,chip.labelKey,`${chip.id} label`,f.sourceKey),assetId:chip.id,initials:chip.initials,alt:text(copy,chip.labelKey,`${chip.id} alt`,f.sourceKey),status:"code"}))};
  if(!p.codeOwned||p.rasterized)throw new Error(`${f.sourceKey} violates D-M1.`);
  const common={title:text(copy,p.titleKey,"dashboard title",f.sourceKey),alt:text(copy,p.altKey,"dashboard alt",f.sourceKey),fallback:{heading:text(copy,p.fallbackHeadingKey,"fallback heading",f.sourceKey),body:text(copy,p.fallbackBodyKey,"fallback body",f.sourceKey),retry:text(copy,p.retryLabelKey,"fallback retry",f.sourceKey)},disclosure};
  if(p.kind==="dashboard")return {kind:p.kind,proofId:p.proofId,...common};
  const media=f.media.filter(x=>x.kind==="proof-badge");if(media.length!==3)throw new Error(`${f.sourceKey} requires three proof badges.`);
  return {kind:p.kind,proofId:p.proofId,...common,editorial:{heading:text(copy,p.editorialHeadingKey,"editorial heading",f.sourceKey),body:text(copy,p.editorialBodyKey,"editorial body",f.sourceKey)},badges:media.map((m,i)=>({id:m.id,markId:required(m.markId,"badge mark",f.sourceKey),label:text(copy,p.badgeLabelKeys[i],`badge ${i+1}`,f.sourceKey)}))};
}

export function resolveResetFixture(f:ResetFixture,stress:ResetStress="base"):ResolvedResetFixture{
  const e=EXPECTED[f.sourceKey];if(!e)throw new Error(`Unknown reset source ${f.sourceKey}.`);
  if(f.packet!=="reset-password-contract-v1"||f.owner!=="ResetUnit"||f.shellOwner!=="AuthShell"||f.resetPreset!=="set-new-password")throw new Error(`${f.sourceKey} owner contract drifted.`);
  const copy=f.copy[stress];if(!copy)throw new Error(`${f.sourceKey} lacks ${stress} copy.`);if(new Set(Object.values(f.copy).map(x=>Object.keys(x).sort().join("|"))).size!==1)throw new Error(`${f.sourceKey} copy stress drifted.`);
  if(f.shellPreset!==e.shell||f.fields.map(x=>x.id).join("|")!==e.fields||(f.proof?.kind??"none")!==e.proof)throw new Error(`${f.sourceKey} closed mapping drifted.`);
  if(f.rules.map(x=>x.id).join("|")!=="length|case|number|symbol")throw new Error(`${f.sourceKey} rule vector drifted.`);
  const fields=f.fields.map(x=>{if(x.required!==true||x.name!==x.id||x.autoComplete!==(x.id==="email"?"email":"new-password"))throw new Error(`${f.sourceKey} native field contract drifted.`);return {...x,label:text(copy,x.labelKey,`${x.id} label`,f.sourceKey),placeholder:text(copy,x.placeholderKey,`${x.id} placeholder`,f.sourceKey),requiredError:text(copy,x.requiredErrorKey,`${x.id} required`,f.sourceKey),invalidError:x.invalidErrorKey?text(copy,x.invalidErrorKey,`${x.id} invalid`,f.sourceKey):undefined};});
  if(fields.some(x=>!x.label.trim()))throw new Error(`${f.sourceKey} persistent label missing.`);
  const actions=[...f.shellActions,f.backToLogin,f.submit,f.doneAction,f.expiredAction];if(new Set(actions.map(x=>x.id)).size!==actions.length)throw new Error(`${f.sourceKey} repeated action owner.`);
  for(const m of f.media){if((m.codeOwned||m.kind==="identity-chip")&&m.rasterized!==false)throw new Error(`${f.sourceKey} code media drifted.`);if((m as ResetFixtureMedia&{href?:unknown}).href!==undefined)throw new Error(`${f.sourceKey} media cannot become interactive.`);}
  const mediaStatus=f.media.some(x=>x.status==="HOLD-INFRA")?"hold":"ready";if((mediaStatus==="hold")!==e.hold)throw new Error(`${f.sourceKey} localized media status drifted.`);
  const ambient=f.ambient;
  if(f.sourceKey==="reset-password-06"&&(
    !ambient||ambient.photoId!=="dark-silk-photo-06"||
    ambient.kind!=="dark-wave"||
    ambient.assetId!=="register-06-dark-silk-v1"||
    ambient.status!=="ready"||ambient.decision!=="D-M38"||ambient.codeOwned!==true||ambient.rasterized!==false||
    ["avif","webp","jpg","src","srcset"].some(key=>key in ambient)||
    !f.media.some(x=>x.kind==="dark-wave"&&x.assetId==="register-06-dark-silk-v1"&&x.status==="ready"&&x.decision==="D-M38"&&x.codeOwned===true&&x.rasterized===false&&!["avif","webp","jpg","src","srcset"].some(key=>key in x))
  ))throw new Error(`${f.sourceKey} cannot substitute the dark-silk seat.`);
  const proof=resolveProof(f,copy),photo=ambient?{kind:ambient.kind,assetId:ambient.assetId,alt:text(copy,ambient.altKey,"photo alt",f.sourceKey),fallback:{heading:text(copy,ambient.fallbackHeadingKey,"photo fallback heading",f.sourceKey),body:text(copy,ambient.fallbackBodyKey,"photo fallback body",f.sourceKey),reducedData:text(copy,ambient.reducedDataKey,"reduced data",f.sourceKey)},status:ambient.status}:undefined;
  const labels:Record<string,string>=Object.fromEntries(Object.entries(f.stateKeys).map(([name,key])=>[name.replace(/Key$/,""),text(copy,key,name,f.sourceKey)]));
  if(ambient){
    labels.motionPause=text(copy,ambient.motionPauseKey,"motion pause",f.sourceKey);
    labels.motionResume=text(copy,ambient.motionResumeKey,"motion resume",f.sourceKey);
    labels.motionStatic=text(copy,ambient.motionStaticKey,"motion static",f.sourceKey);
  }
  return {sourceKey:f.sourceKey,shellPreset:f.shellPreset,resetPreset:f.resetPreset,activeStress:stress,identity:identity(f),intro:{heading:text(copy,f.intro.headingKey,"intro heading",f.sourceKey),body:text(copy,f.intro.bodyKey,"intro body",f.sourceKey)},fields,shellActions:f.shellActions.map(x=>action(x,copy,f.sourceKey)),backToLogin:action(f.backToLogin,copy,f.sourceKey),submit:action(f.submit,copy,f.sourceKey),doneAction:action(f.doneAction,copy,f.sourceKey),expiredAction:action(f.expiredAction,copy,f.sourceKey),rules:f.rules.map(x=>({id:x.id,label:text(copy,x.labelKey,`${x.id} rule`,f.sourceKey)})),proof,photo,ambient:{treatment:e.ambient,motion:f.sourceKey==="reset-password-06"},mediaStatus,labels};
}

export function composeResetAuthShellModel(reset:ResolvedResetFixture,base:ResolvedAuthShellModel):ResolvedAuthShellModel{
  if(base.shellPreset!==reset.shellPreset)throw new Error(`${reset.sourceKey} shell base mismatch.`);let proof:ResolvedAuthProof|undefined;
  if(reset.proof?.kind==="dashboard"){if(base.proof?.kind!=="dashboard")throw new Error(`${reset.sourceKey} dashboard base missing.`);proof={...base.proof,proofId:reset.proof.proofId,title:reset.proof.title,alt:reset.proof.alt,fallback:{heading:reset.proof.fallback.heading,message:reset.proof.fallback.body,action:reset.proof.fallback.retry},disclosure:reset.proof.disclosure};}
  else if(reset.proof?.kind==="dashboard-and-badges"){const baseProof=base.proof;if(baseProof?.kind!=="editorial")throw new Error(`${reset.sourceKey} editorial base missing.`);proof={...baseProof,proofId:reset.proof.proofId,title:reset.proof.title,alt:reset.proof.alt,heading:reset.proof.editorial.heading,body:reset.proof.editorial.body,fallback:{heading:reset.proof.fallback.heading,message:reset.proof.fallback.body,action:reset.proof.fallback.retry},disclosure:reset.proof.disclosure,badges:reset.proof.badges.map((badge,i)=>({...baseProof.badges[i]!,id:badge.id,label:badge.label,markId:badge.markId}))};}
  else if(reset.proof?.kind==="trust-proof"||reset.proof?.kind==="trust-chips"){proof={kind:"trust",reassurance:{heading:reset.proof.title,body:reset.proof.body},card:{heading:reset.proof.peopleHeading,body:reset.proof.peopleBody},aggregateLabel:reset.proof.aggregate,disclosure:{...reset.proof.disclosure,fallback:reset.proof.body},people:reset.proof.people,mark:reset.identity?{src:reset.identity.src,inverseSrc:reset.identity.inverseSrc,name:reset.identity.name}:undefined};}
  else if(base.proof)throw new Error(`${reset.sourceKey} cannot inherit unowned proof.`);
  const photo=reset.photo?{...(base.photo??{kind:"dark-wave" as const,assetId:reset.photo.assetId,focalPoint:{M:"50% 50%",TP:"50% 50%",TL:"50% 50%",DS:"50% 50%",DW:"50% 50%"},status:"ready" as const}),kind:reset.photo.kind,assetId:reset.photo.assetId,alt:reset.photo.alt,fallback:reset.photo.fallback,status:reset.photo.status}:undefined;
  return {sourceKey:reset.sourceKey,shellPreset:reset.shellPreset,identity:reset.identity,intro:reset.intro,shellActions:reset.shellActions.flatMap(x=>x.role==="home"||x.role==="back"?[{id:x.id,role:x.role,label:x.label,href:x.href}]:[]),proof,photo,ambient:reset.ambient,labels:{motionPause:reset.labels.motionPause,motionResume:reset.labels.motionResume,motionStatic:reset.labels.motionStatic}};
}
