import type {
  AuthShellPreset,
  ResolvedAuthAction,
  ResolvedAuthPerson,
  ResolvedAuthPhoto,
  ResolvedAuthProof,
  ResolvedAuthShellIdentity,
  ResolvedAuthShellModel,
} from "./auth-model";

export const REGISTER_SOURCE_KEYS = [
  "register-01", "register-02", "register-03", "register-04", "register-05", "register-06",
] as const;

export type RegisterSourceKey = (typeof REGISTER_SOURCE_KEYS)[number];
export type RegisterStress = "base" | "short" | "longLocale";
export type RegisterPreset =
  | "username-email-confirm-provider-last"
  | "name-secret-provider-first"
  | "email-confirm-provider-trio-first"
  | "email-confirm-provider-single-first";
export type RegisterFieldId = "name" | "username" | "email" | "password" | "confirmPassword";
export type RegisterStep = "identity" | "secret";

export type RegisterFixtureField = {
  id: RegisterFieldId;
  type: "text" | "email" | "password";
  autoComplete: "name" | "username" | "email" | "new-password";
  inputMode?: "text" | "email";
  required: true;
  step: RegisterStep;
  confirms?: "password";
  labelKey: string;
  placeholderKey: string;
  requiredErrorKey: string;
  invalidErrorKey?: string;
};

export type RegisterFixtureAction = {
  id: string;
  role: "home" | "back" | "provider" | "policy" | "sign-in" | "submit";
  labelKey: string;
  href?: string;
  provider?: { providerId: string; markId: string; accessibleNameKey: string };
};

type RegisterFixtureProof =
  | {
      kind: "dashboard" | "editorial";
      proofId: string;
      headingKey: string;
      bodyKey: string;
      altKey: string;
      fallbackHeadingKey: string;
      fallbackBodyKey: string;
      disclosureOpenKey: string;
      disclosureCloseKey: string;
      badges?: Array<{ id: string; labelKey: string; markId: string }>;
    }
  | {
      kind: "trust";
      reassuranceHeadingKey: string;
      reassuranceBodyKey: string;
      cardHeadingKey: string;
      cardBodyKey: string;
      people: Array<{ personId: string; assetId: string; altKey: string; initials: string }>;
      aggregateLabelKey: string;
      disclosureOpenKey: string;
      disclosureCloseKey: string;
    };

export type RegisterFixture = {
  sourceKey: RegisterSourceKey;
  shellPreset: AuthShellPreset;
  registerPreset: RegisterPreset;
  identity?: { companyId: string; nameKey: string; markId: string; homeActionId?: string } | null;
  intro: { headingKey: string; bodyKey: string };
  fields: RegisterFixtureField[];
  providerPlacement: "before-fields" | "after-form";
  providerActions: RegisterFixtureAction[];
  shellActions: RegisterFixtureAction[];
  signInAction: RegisterFixtureAction;
  submitAction: RegisterFixtureAction;
  consent: { required: true; labelKey: string; policyAction: RegisterFixtureAction; requiredErrorKey: string };
  proof?: RegisterFixtureProof | null;
  photo?: {
    kind: "dark-wave";
    assetId: string;
    status: "ready";
    decision: "D-M38";
    codeOwned: true;
    rasterized: false;
    altKey: string;
    fallbackHeadingKey: string;
    fallbackBodyKey: string;
    focalPoint: Record<"M" | "TP" | "TL" | "DS" | "DW", string>;
  } | null;
  decoration: "outline" | "proof-edge" | "graphic-mark" | "none" | "lines" | "silk-photo";
  formAriaKey: string;
  providerGroupLabelKey: string;
  revealShowKey: string;
  revealHideKey: string;
  reducedDataExplanationKey: string;
  passwordGuidance: { guidanceKey: string; strengthStartKey: string; strengthGrowingKey: string; strengthReadyKey: string };
  stepCopy: { identityProgressKey: string; secretProgressKey: string; identityTitleKey: string; secretTitleKey: string; backKey: string; continueKey: string };
  status: { pendingLabelKey: string; pendingAnnouncementKey: string; errorHeadingKey: string; errorMessageKey: string; errorRetryKey: string; successHeadingKey: string; successMessageKey: string; successContinueKey: string };
  copy: Record<RegisterStress, Record<string, string>>;
  accountGlyph?: { kind: "decorative"; assetId: string; ariaHidden: true };
};

export type ResolvedRegisterField = Omit<RegisterFixtureField, "labelKey" | "placeholderKey" | "requiredErrorKey" | "invalidErrorKey"> & {
  label: string;
  placeholder: string;
  requiredError: string;
  invalidError?: string;
};

export type ResolvedRegisterAction = Omit<RegisterFixtureAction, "labelKey" | "provider"> & {
  label: string;
  provider?: { providerId: string; markId: string; accessibleName: string; src: string; darkSrc: string };
};

export type ResolvedRegisterFixture = ResolvedAuthShellModel & {
  sourceKey: RegisterSourceKey;
  registerPreset: RegisterPreset;
  activeStress: RegisterStress;
  fields: ResolvedRegisterField[];
  providerPlacement: "before-fields" | "after-form";
  providerActions: ResolvedRegisterAction[];
  signInAction: ResolvedRegisterAction;
  submitAction: ResolvedRegisterAction;
  consent: { label: string; policyAction: ResolvedRegisterAction; requiredError: string };
  decoration: RegisterFixture["decoration"];
  accountGlyph: boolean;
  labels: ResolvedAuthShellModel["labels"] & {
    formAria: string;
    providerGroup: string;
    revealShow: string;
    revealHide: string;
    reducedData: string;
    passwordGuidance: string;
    strengthStart: string;
    strengthGrowing: string;
    strengthReady: string;
    identityProgress: string;
    secretProgress: string;
    identityTitle: string;
    secretTitle: string;
    stepBack: string;
    stepContinue: string;
    pending: string;
    pendingAnnouncement: string;
    errorHeading: string;
    errorMessage: string;
    errorRetry: string;
    successHeading: string;
    successMessage: string;
    successContinue: string;
  };
};

const EXPECTED: Record<RegisterSourceKey, {
  shell: AuthShellPreset;
  preset: RegisterPreset;
  fields: string;
  providers: string;
  placement: "before-fields" | "after-form";
  shellActions: string;
  proof: "none" | "dashboard" | "editorial" | "trust";
  identity: string | null;
  decoration: RegisterFixture["decoration"];
}> = {
  "register-01": { shell:"centered-quick-entry",preset:"username-email-confirm-provider-last",fields:"username|email|password|confirmPassword",providers:"mark-prov1",placement:"after-form",shellActions:"",proof:"none",identity:"mark-c_001",decoration:"outline" },
  "register-02": { shell:"product-proof-split",preset:"username-email-confirm-provider-last",fields:"username|email|password|confirmPassword",providers:"mark-prov1",placement:"after-form",shellActions:"back",proof:"dashboard",identity:"mark-c_002",decoration:"proof-edge" },
  "register-03": { shell:"graphic-trust-split",preset:"name-secret-provider-first",fields:"name|email|password",providers:"mark-prov2",placement:"before-fields",shellActions:"",proof:"trust",identity:"mark-c_003",decoration:"graphic-mark" },
  "register-04": { shell:"trial-proof-split",preset:"name-secret-provider-first",fields:"name|email|password",providers:"mark-prov2",placement:"before-fields",shellActions:"",proof:"editorial",identity:null,decoration:"none" },
  "register-05": { shell:"centered-social-card",preset:"email-confirm-provider-trio-first",fields:"email|password|confirmPassword",providers:"mark-prov1|mark-prov2|mark-prov3",placement:"before-fields",shellActions:"",proof:"none",identity:"mark-c_005",decoration:"lines" },
  "register-06": { shell:"ambient-trust-split",preset:"email-confirm-provider-single-first",fields:"email|password|confirmPassword",providers:"mark-prov1",placement:"before-fields",shellActions:"home",proof:"trust",identity:"mark-c_006",decoration:"silk-photo" },
};

const COMPANY_MARKS: Record<string, { companyId:string;name:string;src:string;inverseSrc:string }> = {
  "mark-c_001": {companyId:"c_001",name:"Avelor Grid",src:"/media/logo-avelor-grid-symbol-color-on-light.svg",inverseSrc:"/media/logo-avelor-grid-symbol-color-on-dark.svg"},
  "mark-c_002": {companyId:"c_002",name:"Brentex Point",src:"/media/logo-brentex-point-symbol-color-on-light.svg",inverseSrc:"/media/logo-brentex-point-symbol-color-on-dark.svg"},
  "mark-c_003": {companyId:"c_003",name:"Caldara Data",src:"/media/logo-caldara-data-symbol-color-on-light.svg",inverseSrc:"/media/logo-caldara-data-symbol-color-on-dark.svg"},
  "mark-c_005": {companyId:"c_005",name:"Entralis Forge",src:"/media/logo-entralis-forge-symbol-color-on-light.svg",inverseSrc:"/media/logo-entralis-forge-symbol-color-on-dark.svg"},
  "mark-c_006": {companyId:"c_006",name:"Falden Code",src:"/media/logo-falden-code-symbol-color-on-light.svg",inverseSrc:"/media/logo-falden-code-symbol-color-on-dark.svg"},
};
const AUTH_MARKS = Object.fromEntries(["mark-prov1","mark-prov2","mark-prov3","mark-badge1","mark-badge2","mark-badge3"].map((markId)=>[markId,{src:`/media/login-page-${markId}-color-on-light.svg`,darkSrc:`/media/login-page-${markId}-color-on-dark.svg`}])) as Record<string,{src:string;darkSrc:string}>;
const PEOPLE: Record<string, { name:string;avif:string;webp:string;jpg:string }> = Object.fromEntries(["darius-vasile","aisha-khan","hiroshi-tanaka"].map((slug)=>[`dashboard-dialog-${slug}`,{name:slug.split("-").map((part)=>part[0]!.toUpperCase()+part.slice(1)).join(" "),avif:`/media/dashboard-dialog-${slug}-avatar-256.avif`,webp:`/media/dashboard-dialog-${slug}-avatar-256.webp`,jpg:`/media/dashboard-dialog-${slug}-avatar-256.jpg`}])) as Record<string,{name:string;avif:string;webp:string;jpg:string}>;
const PROOF_RECORDS: Record<string, Array<{id:string;label:string;value:string;detail:string;progress:number}>> = {
  "register-dash-02":[
    {id:"routes",label:"Mapped routes",value:"24",detail:"Six refined today",progress:76},
    {id:"windows",label:"Delivery windows",value:"91%",detail:"Within target",progress:91},
    {id:"handoffs",label:"Open handoffs",value:"5",detail:"Two need review",progress:58},
  ],
  "register-dash-04":[
    {id:"deployments",label:"Deployments",value:"18",detail:"Four active",progress:82},
    {id:"checks",label:"Health checks",value:"96%",detail:"All regions",progress:96},
    {id:"changes",label:"Change window",value:"04:30",detail:"Ready to stage",progress:64},
  ],
};

const required = (value: unknown, label: string, sourceKey: string) => {
  if(typeof value!=="string"||!value.trim())throw new Error(`${sourceKey} requires ${label}.`);
  return value;
};
const copyValue = (copy:Record<string,string>,key:unknown,label:string,sourceKey:string)=>required(copy[required(key,`${label} key`,sourceKey)],label,sourceKey);
const localHref = (href:string|undefined,label:string,sourceKey:string)=>{
  if(!href||!href.startsWith(`/demo/${sourceKey}/`)||href.includes("#")||/^(?:https?:)?\/\//i.test(href))throw new Error(`${sourceKey} ${label} requires a source-owned route.`);
};

function resolveIdentity(fixture:RegisterFixture,copy:Record<string,string>):ResolvedAuthShellIdentity|undefined {
  if(!fixture.identity)return undefined;
  const mark=COMPANY_MARKS[fixture.identity.markId];
  if(!mark||mark.companyId!==fixture.identity.companyId)throw new Error(`${fixture.sourceKey} has an invalid company binding.`);
  const name=copyValue(copy,fixture.identity.nameKey,"identity name",fixture.sourceKey);
  if(name!==mark.name)throw new Error(`${fixture.sourceKey} has an invalid company name binding.`);
  return {...mark,markId:fixture.identity.markId};
}

function resolveAction(action:RegisterFixtureAction,copy:Record<string,string>,sourceKey:RegisterSourceKey):ResolvedRegisterAction {
  if(action.role!=="submit")localHref(action.href,`action ${action.id}`,sourceKey);
  else if(action.href!==undefined)throw new Error(`${sourceKey} submit remains state-owned.`);
  let provider:ResolvedRegisterAction["provider"];
  if(action.role==="provider"){
    const raw=action.provider;const mark=raw&&AUTH_MARKS[raw.markId];
    if(!raw||!mark)throw new Error(`${sourceKey} provider ${action.id} lacks an original mark.`);
    provider={...raw,accessibleName:copyValue(copy,raw.accessibleNameKey,`provider ${action.id} accessible name`,sourceKey),...mark};
  }else if(action.provider)throw new Error(`${sourceKey} non-provider ${action.id} has provider metadata.`);
  return {id:action.id,role:action.role,label:copyValue(copy,action.labelKey,`action ${action.id} label`,sourceKey),href:action.href,provider};
}

function resolvePeople(fixture:RegisterFixture,proof:Extract<RegisterFixtureProof,{kind:"trust"}>,copy:Record<string,string>):ResolvedAuthPerson[] {
  return proof.people.map((person)=>{
    const asset=PEOPLE[person.assetId];
    if(!asset)throw new Error(`${fixture.sourceKey} person ${person.personId} has no approved identity.`);
    return {id:person.personId,assetId:person.assetId,initials:person.initials,alt:copyValue(copy,person.altKey,`person ${person.personId} alt`,fixture.sourceKey),status:"delivered",...asset};
  });
}

function resolveProof(fixture:RegisterFixture,copy:Record<string,string>,identity?:ResolvedAuthShellIdentity):ResolvedAuthProof|undefined {
  const proof=fixture.proof;if(!proof)return undefined;
  if(proof.kind==="trust")return {kind:"trust",reassurance:{heading:copyValue(copy,proof.reassuranceHeadingKey,"reassurance heading",fixture.sourceKey),body:copyValue(copy,proof.reassuranceBodyKey,"reassurance body",fixture.sourceKey)},card:{heading:copyValue(copy,proof.cardHeadingKey,"trust heading",fixture.sourceKey),body:copyValue(copy,proof.cardBodyKey,"trust body",fixture.sourceKey)},aggregateLabel:copyValue(copy,proof.aggregateLabelKey,"aggregate label",fixture.sourceKey),disclosure:{open:copyValue(copy,proof.disclosureOpenKey,"disclosure open",fixture.sourceKey),close:copyValue(copy,proof.disclosureCloseKey,"disclosure close",fixture.sourceKey),fallback:copyValue(copy,fixture.reducedDataExplanationKey,"reduced data explanation",fixture.sourceKey)},people:resolvePeople(fixture,proof,copy),mark:identity?{src:identity.src,inverseSrc:identity.inverseSrc,name:identity.name}:undefined};
  const records=PROOF_RECORDS[proof.proofId];if(!records)throw new Error(`${fixture.sourceKey} has an unknown D-M1 proof.`);
  const badges=(proof.badges??[]).map((badge)=>{const mark=AUTH_MARKS[badge.markId];if(!mark)throw new Error(`${fixture.sourceKey} badge ${badge.id} lacks an original mark.`);if("href" in badge||"route" in badge)throw new Error(`${fixture.sourceKey} badges must remain non-interactive.`);return {id:badge.id,label:copyValue(copy,badge.labelKey,`badge ${badge.id}`,fixture.sourceKey),markId:badge.markId,...mark};});
  return {kind:proof.kind,proofId:proof.proofId,heading:copyValue(copy,proof.headingKey,"proof heading",fixture.sourceKey),body:copyValue(copy,proof.bodyKey,"proof body",fixture.sourceKey),title:copyValue(copy,proof.headingKey,"proof title",fixture.sourceKey),alt:copyValue(copy,proof.altKey,"proof alt",fixture.sourceKey),fallback:{heading:copyValue(copy,proof.fallbackHeadingKey,"proof fallback heading",fixture.sourceKey),message:copyValue(copy,proof.fallbackBodyKey,"proof fallback body",fixture.sourceKey),action:copyValue(copy,proof.disclosureOpenKey,"proof retry label",fixture.sourceKey)},disclosure:{open:copyValue(copy,proof.disclosureOpenKey,"proof disclosure open",fixture.sourceKey),close:copyValue(copy,proof.disclosureCloseKey,"proof disclosure close",fixture.sourceKey)},records,badges};
}

function resolvePhoto(fixture:RegisterFixture,copy:Record<string,string>):ResolvedAuthPhoto|undefined {
  const photo=fixture.photo;
  if(!photo)return undefined;
  if(fixture.sourceKey!=="register-06"||photo.assetId!=="register-06-dark-silk-v1"||photo.kind!=="dark-wave"||photo.status!=="ready"||photo.decision!=="D-M38"||photo.codeOwned!==true||photo.rasterized!==false||["avif","webp","jpg","src","srcset"].some((key)=>key in photo))throw new Error(`${fixture.sourceKey} has an invalid dark-wave seat.`);
  return {kind:"dark-wave",assetId:photo.assetId,alt:copyValue(copy,photo.altKey,"photo alt",fixture.sourceKey),fallback:{heading:copyValue(copy,photo.fallbackHeadingKey,"photo fallback heading",fixture.sourceKey),body:copyValue(copy,photo.fallbackBodyKey,"photo fallback body",fixture.sourceKey),reducedData:copyValue(copy,fixture.reducedDataExplanationKey,"reduced data explanation",fixture.sourceKey)},focalPoint:photo.focalPoint,status:"ready"};
}

export function resolveRegisterFixture(fixture:RegisterFixture,stress:RegisterStress="base"):ResolvedRegisterFixture {
  const expected=EXPECTED[fixture.sourceKey];if(!expected)throw new Error(`Unknown register source ${fixture.sourceKey}.`);
  const copy=fixture.copy[stress];if(!copy)throw new Error(`${fixture.sourceKey} lacks ${stress} copy.`);
  const providerMarks=fixture.providerActions.map((action)=>action.provider?.markId).join("|");
  const proofKind=fixture.proof?.kind??"none";
  if(fixture.shellPreset!==expected.shell||fixture.registerPreset!==expected.preset||fixture.fields.map(({id})=>id).join("|")!==expected.fields||providerMarks!==expected.providers||fixture.providerPlacement!==expected.placement||fixture.shellActions.map(({role})=>role).join("|")!==expected.shellActions||proofKind!==expected.proof||(fixture.identity?.markId??null)!==expected.identity||fixture.decoration!==expected.decoration)throw new Error(`${fixture.sourceKey} drifts from its closed source mapping.`);
  if(new Set(fixture.fields.map(({id})=>id)).size!==fixture.fields.length)throw new Error(`${fixture.sourceKey} repeats a field owner.`);
  const actions=[...fixture.providerActions,...fixture.shellActions,fixture.signInAction,fixture.submitAction,fixture.consent.policyAction];
  if(new Set(actions.map(({id})=>id)).size!==actions.length)throw new Error(`${fixture.sourceKey} repeats an action owner.`);
  const fields=fixture.fields.map((field)=>({id:field.id,type:field.type,autoComplete:field.autoComplete,inputMode:field.inputMode,required:field.required,step:field.step,confirms:field.confirms,label:copyValue(copy,field.labelKey,`${field.id} label`,fixture.sourceKey),placeholder:copyValue(copy,field.placeholderKey,`${field.id} placeholder`,fixture.sourceKey),requiredError:copyValue(copy,field.requiredErrorKey,`${field.id} required error`,fixture.sourceKey),invalidError:field.invalidErrorKey?copyValue(copy,field.invalidErrorKey,`${field.id} invalid error`,fixture.sourceKey):undefined}));
  const contract=fields.map(({id,type,autoComplete,step,confirms})=>[id,type,autoComplete,step,confirms??""].join("|")).join(";");
  if(!contract.includes("email|email|email|identity|")||!contract.includes("password|password|new-password|secret|")||fields.some((field)=>field.id==="confirmPassword"&&(field.confirms!=="password"||field.autoComplete!=="new-password")))throw new Error(`${fixture.sourceKey} violates native autofill or step ownership.`);
  const identity=resolveIdentity(fixture,copy);const proof=resolveProof(fixture,copy,identity);const photo=resolvePhoto(fixture,copy);
  if((fixture.sourceKey==="register-03"||fixture.sourceKey==="register-06")&&(proof?.kind!=="trust"||proof.people.map(({id,assetId})=>`${id}|${assetId}`).join(";")!=="person-darius-vasile|dashboard-dialog-darius-vasile;person-aisha-khan|dashboard-dialog-aisha-khan;person-hiroshi-tanaka|dashboard-dialog-hiroshi-tanaka"))throw new Error(`${fixture.sourceKey} must preserve the exact three-person trust group.`);
  if(fixture.sourceKey==="register-04"&&(!(proof&&proof.kind==="editorial")||proof.badges.map(({markId})=>markId).join("|")!=="mark-badge1|mark-badge2|mark-badge3"))throw new Error("register-04 must preserve three non-interactive badges.");
  if(fixture.sourceKey==="register-06"&&(!photo||photo.kind!=="dark-wave"||photo.status!=="ready"))throw new Error("register-06 cannot retire or substitute its D-M38 dark-wave seat.");
  const shellActions=fixture.shellActions.map((action)=>resolveAction(action,copy,fixture.sourceKey));
  const ambientTreatment=fixture.decoration==="proof-edge"?"proof-edge":fixture.decoration==="graphic-mark"?"graphic-mark":fixture.decoration==="silk-photo"?"silk-photo":fixture.decoration;
  const label=(key:string,name:string)=>copyValue(copy,key,name,fixture.sourceKey);
  return {sourceKey:fixture.sourceKey,shellPreset:fixture.shellPreset,registerPreset:fixture.registerPreset,activeStress:stress,identity,intro:{heading:copyValue(copy,fixture.intro.headingKey,"intro heading",fixture.sourceKey),body:copyValue(copy,fixture.intro.bodyKey,"intro body",fixture.sourceKey)},fields,providerPlacement:fixture.providerPlacement,providerActions:fixture.providerActions.map((action)=>resolveAction(action,copy,fixture.sourceKey)),shellActions:shellActions.map(({id,role,label,href})=>({id,role:role as "home"|"back",label,href})),signInAction:resolveAction(fixture.signInAction,copy,fixture.sourceKey),submitAction:resolveAction(fixture.submitAction,copy,fixture.sourceKey),consent:{label:copyValue(copy,fixture.consent.labelKey,"consent label",fixture.sourceKey),policyAction:resolveAction(fixture.consent.policyAction,copy,fixture.sourceKey),requiredError:copyValue(copy,fixture.consent.requiredErrorKey,"consent error",fixture.sourceKey)},proof,photo,decoration:fixture.decoration,accountGlyph:Boolean(fixture.accountGlyph),ambient:{treatment:ambientTreatment,motion:false},labels:{formAria:label(fixture.formAriaKey,"form aria"),providerGroup:label(fixture.providerGroupLabelKey,"provider group"),revealShow:label(fixture.revealShowKey,"reveal show"),revealHide:label(fixture.revealHideKey,"reveal hide"),reducedData:label(fixture.reducedDataExplanationKey,"reduced data"),passwordGuidance:label(fixture.passwordGuidance.guidanceKey,"password guidance"),strengthStart:label(fixture.passwordGuidance.strengthStartKey,"strength start"),strengthGrowing:label(fixture.passwordGuidance.strengthGrowingKey,"strength growing"),strengthReady:label(fixture.passwordGuidance.strengthReadyKey,"strength ready"),identityProgress:label(fixture.stepCopy.identityProgressKey,"identity progress"),secretProgress:label(fixture.stepCopy.secretProgressKey,"secret progress"),identityTitle:label(fixture.stepCopy.identityTitleKey,"identity title"),secretTitle:label(fixture.stepCopy.secretTitleKey,"secret title"),stepBack:label(fixture.stepCopy.backKey,"step back"),stepContinue:label(fixture.stepCopy.continueKey,"step continue"),pending:label(fixture.status.pendingLabelKey,"pending"),pendingAnnouncement:label(fixture.status.pendingAnnouncementKey,"pending announcement"),errorHeading:label(fixture.status.errorHeadingKey,"error heading"),errorMessage:label(fixture.status.errorMessageKey,"error message"),errorRetry:label(fixture.status.errorRetryKey,"error retry"),successHeading:label(fixture.status.successHeadingKey,"success heading"),successMessage:label(fixture.status.successMessageKey,"success message"),successContinue:label(fixture.status.successContinueKey,"success continue")}};
}
