export const LOGIN_SOURCE_KEYS = [
  "login-page-01",
  "login-page-02",
  "login-page-03",
  "login-page-04",
  "login-page-05",
  "login-page-06",
] as const;

export type LoginSourceKey = (typeof LOGIN_SOURCE_KEYS)[number];
export type LoginStress = "base" | "short" | "longLocale";
export type AuthShellPreset =
  | "centered-quick-entry"
  | "product-proof-split"
  | "graphic-trust-split"
  | "trial-proof-split"
  | "centered-social-card"
  | "ambient-trust-split";
export type CredentialsPreset =
  | "email-with-shortcuts"
  | "email-with-social-pair"
  | "trial-identity-with-social-pair"
  | "email-with-social-trio";
export type AuthActionRole = "home" | "back" | "magic-link" | "quick-entry" | "provider" | "recover" | "register" | "submit";

export type LoginFixtureAction = {
  id: string;
  role: AuthActionRole;
  labelKey: string;
  href?: string;
  provider?: { name: string; markId: string; accessibleName: string };
};
export type LoginFixtureField = {
  id: "name" | "email" | "password";
  type: "text" | "email" | "password";
  autoComplete: "name" | "email" | "current-password";
  inputMode?: "text" | "email";
  required: true;
  labelKey: string;
  requiredErrorKey: string;
  invalidErrorKey?: string;
  placeholderKey: string;
};
export type LoginFixturePerson = { id: string; name: string; assetId: string; initials: string; altKey: string };
export type LoginFixtureProof =
  | {
      kind: "dashboard";
      proofId: string;
      titleKey: string;
      altKey: string;
      fallbackHeadingKey: string;
      fallbackMessageKey: string;
      fallbackActionKey: string;
      disclosureOpenKey: string;
      disclosureCloseKey: string;
    }
  | {
      kind: "editorial";
      proofId: string;
      editorialHeadingKey: string;
      editorialBodyKey: string;
      titleKey: string;
      altKey: string;
      fallbackHeadingKey: string;
      fallbackMessageKey: string;
      fallbackActionKey: string;
      disclosureOpenKey: string;
      disclosureCloseKey: string;
      badges: Array<{ id: string; labelKey: string; markId: string }>;
    }
  | {
      kind: "trust";
      reassuranceHeadingKey: string;
      reassuranceBodyKey: string;
      trustCardHeadingKey: string;
      trustCardBodyKey: string;
      aggregateLabelKey: string;
      disclosureOpenKey: string;
      disclosureCloseKey: string;
      disclosureFallbackKey: string;
    };

export type LoginFixture = {
  sourceKey: LoginSourceKey;
  shellPreset: AuthShellPreset;
  credentialsPreset: CredentialsPreset;
  identity: { companyId: string; name: string; markId: string };
  intro: { headingKey: string; bodyKey: string };
  fields: LoginFixtureField[];
  alternativeActions: LoginFixtureAction[];
  utilityActions: LoginFixtureAction[];
  proof?: LoginFixtureProof;
  people?: LoginFixturePerson[];
  ambient?: { treatment: "none" | "outline" | "lines" | "material"; motion: boolean };
  copy: Record<LoginStress, Record<string, string>>;
  rememberLabelKey: string;
  revealShowKey: string;
  revealHideKey: string;
  formAriaKey: string;
  alternativesAriaKey: string;
  dividerKey: string;
  pendingLabelKey: string;
  pendingAnnouncementKey: string;
  authErrorHeadingKey: string;
  authErrorMessageKey: string;
  authErrorRetryKey: string;
  successHeadingKey: string;
  successMessageKey: string;
  successContinueKey: string;
  recoveryHeadingKey: string;
  recoveryBodyKey: string;
  recoveryEmailLabelKey: string;
  recoveryEmailPlaceholderKey: string;
  recoverySubmitKey: string;
  recoveryCancelKey: string;
  recoverySentAnnouncementKey: string;
  mediaFallbackHeadingKey: string;
  mediaFallbackMessageKey: string;
  mediaFallbackActionKey: string;
  motionPauseKey?: string;
  motionResumeKey?: string;
  motionStaticKey?: string;
  ambientPauseKey?: string;
  ambientResumeKey?: string;
  ambientStaticKey?: string;
  [key: string]: unknown;
};

export type ResolvedAuthAction = Omit<LoginFixtureAction, "labelKey" | "provider"> & {
  label: string;
  provider?: { name: string; markId: string; accessibleName: string; src: string; darkSrc: string };
};
export type ResolvedCredentialField = Omit<LoginFixtureField, "labelKey" | "requiredErrorKey" | "invalidErrorKey" | "placeholderKey"> & {
  label: string;
  requiredError: string;
  invalidError?: string;
  placeholder: string;
};
export type ResolvedAuthPerson = {
  id: string;
  name: string;
  assetId: string;
  initials: string;
  alt: string;
  status: "delivered" | "pending" | "code";
  avif?: string;
  webp?: string;
  jpg?: string;
};
export type ResolvedDashboardProof = {
  kind: "dashboard" | "editorial";
  proofId: string;
  heading?: string;
  body?: string;
  title: string;
  alt: string;
  fallback: { heading: string; message: string; action: string };
  disclosure: { open: string; close: string };
  records: Array<{ id: string; label: string; value: string; detail: string; progress: number }>;
  badges: Array<{ id: string; label: string; markId: string; src: string; darkSrc: string }>;
};
export type ResolvedTrustProof = {
  kind: "trust";
  reassurance: { heading: string; body: string };
  card: { heading: string; body: string };
  aggregateLabel: string;
  disclosure: { open: string; close: string; fallback: string };
  people: ResolvedAuthPerson[];
  mark?: { src: string; inverseSrc: string; name: string };
};
export type ResolvedAuthProof = ResolvedDashboardProof | ResolvedTrustProof;

export type ResolvedAuthShellIdentity = {
  companyId: string;
  name: string;
  markId: string;
  src: string;
  inverseSrc: string;
};

export type ResolvedAuthPhoto = {
  kind?: "raster" | "dark-wave";
  assetId: string;
  alt: string;
  fallback: { heading: string; body: string; reducedData: string };
  focalPoint: Record<"M" | "TP" | "TL" | "DS" | "DW", string>;
  status: "ready" | "hold";
  avif?: string;
  webp?: string;
  jpg?: string;
};

export type ResolvedAuthShellModel = {
  sourceKey: string;
  shellPreset: AuthShellPreset;
  identity?: ResolvedAuthShellIdentity;
  intro: { heading: string; body: string };
  shellActions: Array<{ id: string; role: "home" | "back"; label: string; href?: string }>;
  proof?: ResolvedAuthProof;
  photo?: ResolvedAuthPhoto;
  ambient: { treatment: "none" | "outline" | "lines" | "material" | "proof-edge" | "graphic-mark" | "silk-photo"; motion: boolean };
  labels: { motionPause?: string; motionResume?: string; motionStatic?: string };
};

export type ResolvedLoginFixture = ResolvedAuthShellModel & {
  sourceKey: LoginSourceKey;
  credentialsPreset: CredentialsPreset;
  activeStress: LoginStress;
  identity: ResolvedAuthShellIdentity;
  fields: ResolvedCredentialField[];
  alternativeActions: ResolvedAuthAction[];
  credentialActions: ResolvedAuthAction[];
  labels: {
    remember: string;
    revealShow: string;
    revealHide: string;
    formAria: string;
    alternativesAria: string;
    divider: string;
    pending: string;
    pendingAnnouncement: string;
    authErrorHeading: string;
    authErrorMessage: string;
    authErrorRetry: string;
    successHeading: string;
    successMessage: string;
    successContinue: string;
    recoveryHeading: string;
    recoveryBody: string;
    recoveryEmailLabel: string;
    recoveryEmailPlaceholder: string;
    recoverySubmit: string;
    recoveryCancel: string;
    recoverySentAnnouncement: string;
    mediaFallbackHeading: string;
    mediaFallbackMessage: string;
    mediaFallbackAction: string;
    motionPause?: string;
    motionResume?: string;
    motionStatic?: string;
  };
};

const EXPECTED: Record<LoginSourceKey, { shell: AuthShellPreset; credentials: CredentialsPreset; fields: number; alternativeRoles: AuthActionRole[]; utilityRoles: AuthActionRole[]; providerMarks: string[]; proof?: ResolvedAuthProof["kind"]; proofId?: "dash-02" | "dash-04"; company: [string,string,string]; ambient: ["none"|"outline"|"lines"|"material",boolean] }> = {
  "login-page-01": { shell:"centered-quick-entry",credentials:"email-with-shortcuts",fields:2,alternativeRoles:["magic-link","quick-entry","quick-entry","provider"],utilityRoles:["submit","recover","register"],providerMarks:["mark-prov1"],company:["c_001","Avelor Grid","mark-c_001"],ambient:["outline",false] },
  "login-page-02": { shell:"product-proof-split",credentials:"email-with-shortcuts",fields:2,alternativeRoles:["magic-link","quick-entry","quick-entry","provider"],utilityRoles:["back","submit","recover","register"],providerMarks:["mark-prov1"],proof:"dashboard",proofId:"dash-02",company:["c_002","Brentex Point","mark-c_002"],ambient:["lines",true] },
  "login-page-03": { shell:"graphic-trust-split",credentials:"email-with-social-pair",fields:2,alternativeRoles:["provider","provider"],utilityRoles:["submit","recover","register"],providerMarks:["mark-prov2","mark-prov3"],proof:"trust",company:["c_003","Caldara Data","mark-c_003"],ambient:["none",false] },
  "login-page-04": { shell:"trial-proof-split",credentials:"trial-identity-with-social-pair",fields:3,alternativeRoles:["provider","provider"],utilityRoles:["submit","recover","register"],providerMarks:["mark-prov2","mark-prov3"],proof:"editorial",proofId:"dash-04",company:["c_004","Dovrin Shift","mark-c_004"],ambient:["none",false] },
  "login-page-05": { shell:"centered-social-card",credentials:"email-with-social-trio",fields:2,alternativeRoles:["provider","provider","provider"],utilityRoles:["submit","recover","register"],providerMarks:["mark-prov1","mark-prov2","mark-prov3"],company:["c_005","Entralis Forge","mark-c_005"],ambient:["none",false] },
  "login-page-06": { shell:"ambient-trust-split",credentials:"email-with-social-pair",fields:2,alternativeRoles:["provider","provider"],utilityRoles:["home","submit","recover","register"],providerMarks:["mark-prov1","mark-prov2"],proof:"trust",company:["c_006","Falden Code","mark-c_006"],ambient:["material",true] },
};

const COMPANY_MARKS: Record<string, {src:string;inverseSrc:string}> = Object.fromEntries([
  ["mark-c_001","avelor-grid"],["mark-c_002","brentex-point"],["mark-c_003","caldara-data"],
  ["mark-c_004","dovrin-shift"],["mark-c_005","entralis-forge"],["mark-c_006","falden-code"],
].map(([id,name]) => [id, {src:`/media/logo-${name}-symbol-color-on-light.svg`,inverseSrc:`/media/logo-${name}-symbol-color-on-dark.svg`} ]));
const AUTH_MARKS: Record<string, {src:string;darkSrc:string}> = Object.fromEntries(["mark-prov1","mark-prov2","mark-prov3","mark-badge1","mark-badge2","mark-badge3"].map((id) => [id, {src:`/media/login-page-${id}-color-on-light.svg`,darkSrc:`/media/login-page-${id}-color-on-dark.svg`} ]));
const PERSON_ASSETS: Record<string, Omit<ResolvedAuthPerson, "id" | "name" | "initials" | "alt">> = {
  "avatar-p_006": { assetId:"avatar-p_006",status:"delivered",avif:"/media/about-us-anya-sokolov-avatar-256.avif",webp:"/media/about-us-anya-sokolov-avatar-256.webp",jpg:"/media/about-us-anya-sokolov-avatar-256.jpg" },
  "avatar-p_010": { assetId:"avatar-p_010",status:"delivered",avif:"/media/team-section-07-portrait-07-1-avatar-256.avif",webp:"/media/team-section-07-portrait-07-1-avatar-256.webp",jpg:"/media/team-section-07-portrait-07-1-avatar-256.jpg" },
  "team-section-14-asset-14-01-main": { assetId:"team-section-14-asset-14-01-main",status:"delivered",avif:"/media/team-section-14-asset-14-01-main-avatar-256.avif",webp:"/media/team-section-14-asset-14-01-main-avatar-256.webp",jpg:"/media/team-section-14-asset-14-01-main-avatar-256.jpg" },
};
const DASHBOARD_RECORDS: Record<"dash-02" | "dash-04", ResolvedDashboardProof["records"]> = {
  "dash-02": [
    {id:"coverage",label:"Survey coverage",value:"86%",detail:"12 mapped sectors",progress:86},
    {id:"flights",label:"Active flights",value:"18",detail:"3 returning",progress:64},
    {id:"review",label:"Reports ready",value:"42",detail:"7 need review",progress:78},
  ],
  "dash-04": [
    {id:"stages",label:"Stage plans",value:"12",detail:"4 active today",progress:72},
    {id:"crews",label:"Assigned crews",value:"8",detail:"All confirmed",progress:100},
    {id:"window",label:"Next change",value:"04:30",detail:"Lighting reset",progress:46},
  ],
};

function required(value: unknown, label: string, sourceKey: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
  return value;
}
function localHref(href: string | undefined, label: string, sourceKey: string) {
  if (!href || !href.startsWith(`/demo/${sourceKey}/`) || href.includes("#") || /^(?:https?:)?\/\//i.test(href)) throw new Error(`${sourceKey} ${label} requires a safe source-owned route.`);
}
function copyValue(copy: Record<string, string>, key: unknown, label: string, sourceKey: string) {
  const copyKey = required(key, `${label} key`, sourceKey);
  return required(copy[copyKey], label, sourceKey);
}
function resolveAction(action: LoginFixtureAction, copy: Record<string, string>, sourceKey: string): ResolvedAuthAction {
  if (action.role !== "submit" && action.role !== "recover") localHref(action.href, `action ${action.id}`, sourceKey);
  if ((action.role === "submit" || action.role === "recover") && action.href !== undefined) throw new Error(`${sourceKey} ${action.role} must remain locally state-owned.`);
  const provider = action.provider;
  if (action.role === "provider" && (!provider || !AUTH_MARKS[provider.markId])) throw new Error(`${sourceKey} provider ${action.id} has no approved original mark binding.`);
  if (action.role !== "provider" && provider) throw new Error(`${sourceKey} non-provider action ${action.id} cannot borrow a provider identity.`);
  if (provider) { required(provider.name, `provider ${action.id} name`, sourceKey); required(provider.accessibleName, `provider ${action.id} accessible name`, sourceKey); }
  return { id:action.id,role:action.role,label:copyValue(copy,action.labelKey,`action ${action.id} label`,sourceKey),href:action.href,provider:provider?{...provider,...AUTH_MARKS[provider.markId]}:undefined };
}
function resolvePeople(fixture: LoginFixture, copy: Record<string, string>): ResolvedAuthPerson[] {
  return (fixture.people ?? []).map((person) => {
    const asset = PERSON_ASSETS[person.assetId];
    if (!asset) throw new Error(`${fixture.sourceKey} person ${person.id} has no canonical identity binding.`);
    return { id:person.id,name:person.name,initials:person.initials,alt:copyValue(copy,person.altKey,`person ${person.id} alt`,fixture.sourceKey),...asset };
  });
}
function resolveProof(fixture: LoginFixture, copy: Record<string, string>): ResolvedAuthProof | undefined {
  const proof = fixture.proof;
  if (!proof) return undefined;
  if (proof.kind === "trust") return {
    kind:"trust",
    reassurance:{heading:copyValue(copy,proof.reassuranceHeadingKey,"reassurance heading",fixture.sourceKey),body:copyValue(copy,proof.reassuranceBodyKey,"reassurance body",fixture.sourceKey)},
    card:{heading:copyValue(copy,proof.trustCardHeadingKey,"trust card heading",fixture.sourceKey),body:copyValue(copy,proof.trustCardBodyKey,"trust card body",fixture.sourceKey)},
    aggregateLabel:copyValue(copy,proof.aggregateLabelKey,"aggregate label",fixture.sourceKey),
    disclosure:{open:copyValue(copy,proof.disclosureOpenKey,"disclosure open label",fixture.sourceKey),close:copyValue(copy,proof.disclosureCloseKey,"disclosure close label",fixture.sourceKey),fallback:copyValue(copy,proof.disclosureFallbackKey,"disclosure fallback",fixture.sourceKey)},
    people:resolvePeople(fixture,copy),
  };
  const proofId = proof.proofId;
  if (proofId !== "dash-02" && proofId !== "dash-04") throw new Error(`${fixture.sourceKey} has an unknown code-owned proof ID.`);
  if (proof.kind === "editorial" && (proof.badges.map(({id,markId})=>`${id}|${markId}`).join(";") !== "badge1|mark-badge1;badge2|mark-badge2;badge3|mark-badge3" || proof.badges.some((badge)=>"href" in badge || "route" in badge))) throw new Error(`${fixture.sourceKey} must preserve exact non-interactive proof badge bindings.`);
  const badges = proof.kind === "editorial" ? proof.badges.map((badge) => {
    const src = AUTH_MARKS[badge.markId];
    if (!src) throw new Error(`${fixture.sourceKey} badge ${badge.id} has no approved original mark binding.`);
    return {id:badge.id,label:copyValue(copy,badge.labelKey,`badge ${badge.id} label`,fixture.sourceKey),markId:badge.markId,...src};
  }) : [];
  return {
    kind:proof.kind,proofId,
    heading:proof.kind === "editorial" ? copyValue(copy,proof.editorialHeadingKey,"editorial heading",fixture.sourceKey) : undefined,
    body:proof.kind === "editorial" ? copyValue(copy,proof.editorialBodyKey,"editorial body",fixture.sourceKey) : undefined,
    title:copyValue(copy,proof.titleKey,"dashboard title",fixture.sourceKey),alt:copyValue(copy,proof.altKey,"dashboard alt",fixture.sourceKey),
    fallback:{heading:copyValue(copy,proof.fallbackHeadingKey,"proof fallback heading",fixture.sourceKey),message:copyValue(copy,proof.fallbackMessageKey,"proof fallback message",fixture.sourceKey),action:copyValue(copy,proof.fallbackActionKey,"proof fallback action",fixture.sourceKey)},
    disclosure:{open:copyValue(copy,proof.disclosureOpenKey,"proof disclosure open label",fixture.sourceKey),close:copyValue(copy,proof.disclosureCloseKey,"proof disclosure close label",fixture.sourceKey)},
    records:DASHBOARD_RECORDS[proofId],badges,
  };
}

export function resolveLoginFixture(fixture: LoginFixture, stress: LoginStress = "base"): ResolvedLoginFixture {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown login source ${fixture.sourceKey}.`);
  if (fixture.shellPreset !== expected.shell || fixture.credentialsPreset !== expected.credentials) throw new Error(`${fixture.sourceKey} has the wrong closed auth preset pair.`);
  if (fixture.fields.length !== expected.fields || fixture.alternativeActions.map(({role})=>role).join("|") !== expected.alternativeRoles.join("|") || fixture.utilityActions.map(({role})=>role).join("|") !== expected.utilityRoles.join("|")) throw new Error(`${fixture.sourceKey} drifts from its exact field or action inventory.`);
  if (fixture.alternativeActions.filter(({role})=>role === "quick-entry").some((action)=>"selected" in action || "checked" in action || "ariaSelected" in action)) throw new Error(`${fixture.sourceKey} quick-entry actions cannot become selected role controls.`);
  const copy = fixture.copy[stress];
  if (!copy) throw new Error(`${fixture.sourceKey} does not define ${stress} copy.`);
  if (new Set(fixture.fields.map(({id})=>id)).size !== fixture.fields.length || new Set([...fixture.alternativeActions,...fixture.utilityActions].map(({id})=>id)).size !== fixture.alternativeActions.length + fixture.utilityActions.length) throw new Error(`${fixture.sourceKey} repeats a field or action ID.`);
  const fields = fixture.fields.map((field) => ({
    id:field.id,type:field.type,autoComplete:field.autoComplete,inputMode:field.inputMode,required:field.required,
    label:copyValue(copy,field.labelKey,`field ${field.id} label`,fixture.sourceKey),
    requiredError:copyValue(copy,field.requiredErrorKey,`field ${field.id} required error`,fixture.sourceKey),
    invalidError:field.invalidErrorKey?copyValue(copy,field.invalidErrorKey,`field ${field.id} invalid error`,fixture.sourceKey):undefined,
    placeholder:copyValue(copy,field.placeholderKey,`field ${field.id} placeholder`,fixture.sourceKey),
  }));
  if (fields.map(({id})=>id).join("|") !== (fixture.sourceKey === "login-page-04" ? "name|email|password" : "email|password")) throw new Error(`${fixture.sourceKey} has the wrong ordered credential fields.`);
  const fieldContract = fields.map(({id,type,autoComplete,inputMode,required})=>[id,type,autoComplete,inputMode??"",required].join("|")).join(";");
  const expectedFieldContract = fixture.sourceKey === "login-page-04" ? "name|text|name||true;email|email|email|email|true;password|password|current-password||true" : "email|email|email|email|true;password|password|current-password||true";
  if (fieldContract !== expectedFieldContract) throw new Error(`${fixture.sourceKey} has the wrong field input or autocomplete contract.`);
  const alternativeActions = fixture.alternativeActions.map((action)=>resolveAction(action,copy,fixture.sourceKey));
  const utilityActions = fixture.utilityActions.map((action)=>resolveAction(action,copy,fixture.sourceKey));
  const shellActions = utilityActions.filter(({role})=>role === "back" || role === "home");
  const credentialActions = utilityActions.filter(({role})=>role !== "back" && role !== "home");
  if (!credentialActions.some(({role})=>role === "submit") || !credentialActions.some(({role})=>role === "recover") || !credentialActions.some(({role})=>role === "register")) throw new Error(`${fixture.sourceKey} requires submit, recover and register actions.`);
  if (alternativeActions.filter(({role})=>role === "provider").map(({provider})=>provider?.markId).join("|") !== expected.providerMarks.join("|")) throw new Error(`${fixture.sourceKey} has the wrong ordered provider mark bindings.`);
  const proof = resolveProof(fixture,copy);
  if (proof?.kind !== expected.proof) throw new Error(`${fixture.sourceKey} has the wrong proof owner.`);
  if (expected.proofId && (proof?.kind === "trust" || proof?.proofId !== expected.proofId)) throw new Error(`${fixture.sourceKey} has the wrong code-owned proof binding.`);
  const expectedPeople="p_006|Anya Sokolov|avatar-p_006|AS;p_010|Chen Wei|avatar-p_010|CW;p_017|Gia Silva|team-section-14-asset-14-01-main|GS";
  if ((fixture.sourceKey === "login-page-03" || fixture.sourceKey === "login-page-06") && (proof?.kind !== "trust" || (fixture.people??[]).map(({id,name,assetId,initials})=>[id,name,assetId,initials].join("|")).join(";") !== expectedPeople || proof.people.some(({status})=>status!=="delivered"))) throw new Error(`${fixture.sourceKey} must preserve the exact shared delivered trust identities.`);
  if (fixture.identity.companyId !== expected.company[0] || fixture.identity.name !== expected.company[1] || fixture.identity.markId !== expected.company[2]) throw new Error(`${fixture.sourceKey} has the wrong company identity binding.`);
  const identitySrc = COMPANY_MARKS[fixture.identity.markId];
  if (!identitySrc) throw new Error(`${fixture.sourceKey} has no canonical company mark binding.`);
  const ambient=fixture.ambient??{treatment:"none" as const,motion:false};if(ambient.treatment!==expected.ambient[0]||ambient.motion!==expected.ambient[1])throw new Error(`${fixture.sourceKey} has the wrong ambient treatment contract.`);
  const label = (key: keyof LoginFixture, name: string) => copyValue(copy,fixture[key],name,fixture.sourceKey);
  const optionalLabel = (key: keyof LoginFixture, name: string) => fixture[key] ? label(key,name) : undefined;
  return {
    sourceKey:fixture.sourceKey,shellPreset:fixture.shellPreset,credentialsPreset:fixture.credentialsPreset,activeStress:stress,
    identity:{...fixture.identity,...identitySrc},intro:{heading:copyValue(copy,fixture.intro.headingKey,"intro heading",fixture.sourceKey),body:copyValue(copy,fixture.intro.bodyKey,"intro body",fixture.sourceKey)},
    fields,alternativeActions,shellActions:shellActions.map(({id,role,label,href})=>({id,role:role as "home"|"back",label,href})),credentialActions,proof,ambient,
    labels:{
      remember:label("rememberLabelKey","remember label"),revealShow:label("revealShowKey","show-password label"),revealHide:label("revealHideKey","hide-password label"),formAria:label("formAriaKey","form accessible name"),alternativesAria:label("alternativesAriaKey","alternatives accessible name"),divider:label("dividerKey","divider label"),pending:label("pendingLabelKey","pending label"),pendingAnnouncement:label("pendingAnnouncementKey","pending announcement"),authErrorHeading:label("authErrorHeadingKey","auth error heading"),authErrorMessage:label("authErrorMessageKey","auth error message"),authErrorRetry:label("authErrorRetryKey","auth error retry"),successHeading:label("successHeadingKey","success heading"),successMessage:label("successMessageKey","success message"),successContinue:label("successContinueKey","success continue"),recoveryHeading:label("recoveryHeadingKey","recovery heading"),recoveryBody:label("recoveryBodyKey","recovery body"),recoveryEmailLabel:label("recoveryEmailLabelKey","recovery email label"),recoveryEmailPlaceholder:label("recoveryEmailPlaceholderKey","recovery email placeholder"),recoverySubmit:label("recoverySubmitKey","recovery submit"),recoveryCancel:label("recoveryCancelKey","recovery cancel"),recoverySentAnnouncement:label("recoverySentAnnouncementKey","recovery announcement"),mediaFallbackHeading:label("mediaFallbackHeadingKey","media fallback heading"),mediaFallbackMessage:label("mediaFallbackMessageKey","media fallback message"),mediaFallbackAction:label("mediaFallbackActionKey","media fallback action"),motionPause:optionalLabel(fixture.sourceKey === "login-page-06" ? "ambientPauseKey" : "motionPauseKey","motion pause"),motionResume:optionalLabel(fixture.sourceKey === "login-page-06" ? "ambientResumeKey" : "motionResumeKey","motion resume"),motionStatic:optionalLabel(fixture.sourceKey === "login-page-06" ? "ambientStaticKey" : "motionStaticKey","motion static"),
    },
  };
}
