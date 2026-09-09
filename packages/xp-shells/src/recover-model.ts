import type { AuthShellPreset, ResolvedAuthProof, ResolvedAuthShellModel } from "./auth-model";

export const RECOVER_SOURCE_KEYS = [
  "forgot-password-01",
  "forgot-password-02",
  "forgot-password-03",
  "forgot-password-04",
  "forgot-password-05",
  "forgot-password-06",
] as const;

export type RecoverSourceKey = (typeof RECOVER_SOURCE_KEYS)[number];
export type RecoverStress = "base" | "short" | "longLocale";
export type RecoverPreset = "recovery-link";
export type RecoverActionRole =
  | "home"
  | "back"
  | "back-login"
  | "submit"
  | "open-mail"
  | "resend"
  | "edit-email";

export type RecoverFixtureAction = {
  id: string;
  role: RecoverActionRole;
  labelKey: string;
  href?: string;
  method?: "post";
  action?: string;
};

export type RecoverFixtureField = {
  id: "email";
  name: "email";
  type: "email";
  autoComplete: "email";
  inputMode: "email";
  enterKeyHint: "send";
  autoCapitalize: "none";
  spellCheck: false;
  required: true;
  labelKey: string;
  placeholderKey: string;
  requiredErrorKey: string;
  invalidErrorKey: string;
};

export type RecoverFixtureMedia = {
  id: string;
  kind:
    | "identity-mark"
    | "css-outline-decoration"
    | "css-line-tonal-decoration"
    | "ui-proof"
    | "graphic-mark"
    | "trust-mark"
    | "lock-glyph"
    | "proof-badge"
    | "person"
    | "dark-wave";
  markId?: string;
  proofId?: string;
  owner?: string;
  codeOwned?: boolean;
  rasterized?: boolean;
  personId?: string;
  assetId?: string;
  canonicalAssetId?: string | null;
  initials?: string;
  altKey?: string;
  labelKey?: string;
  status?: "HOLD-INFRA" | "ready";
  decision?: "D-M38";
  alt?: string;
};

export type RecoverFixtureProof =
  | {
      kind: "dashboard";
      proofId: "dash-02";
      titleKey: string;
      altKey: string;
      fallbackHeadingKey: string;
      fallbackBodyKey: string;
      retryLabelKey: string;
      detailsOpenKey: string;
      detailsCloseKey: string;
      codeOwned: true;
      rasterized: false;
    }
  | {
      kind: "dashboard-and-badges";
      proofId: "dash-04";
      titleKey: string;
      altKey: string;
      fallbackHeadingKey: string;
      fallbackBodyKey: string;
      retryLabelKey: string;
      detailsOpenKey: string;
      detailsCloseKey: string;
      lockAltKey: string;
      editorialHeadingKey: string;
      editorialBodyKey: string;
      badgeLabelKeys: [string, string, string];
      codeOwned: true;
      rasterized: false;
    }
  | {
      kind: "trust-proof";
      titleKey: string;
      bodyKey: string;
      detailsOpenKey: string;
      detailsCloseKey: string;
      markAltKey: string;
      peopleHeadingKey: string;
      peopleBodyKey: string;
      aggregateKey: string;
      people: ["p_006", "p_010", "p_017"];
    };

export type RecoverFixture = {
  schemaVersion: 1;
  packet: "forgot-password-contract-v1";
  sourceKey: RecoverSourceKey;
  owner: "RecoverUnit";
  shellOwner: "AuthShell";
  shellPreset: AuthShellPreset;
  recoverPreset: "recovery-link";
  identity: { companyId: string; name: string; markId: string | null };
  intro: { headingKey: string; bodyKey: string };
  field: RecoverFixtureField;
  shellActions: RecoverFixtureAction[];
  backToLogin: RecoverFixtureAction;
  submit: RecoverFixtureAction;
  sentActions: [RecoverFixtureAction, RecoverFixtureAction, RecoverFixtureAction];
  reassurance: {
    headingKey: string;
    bodyKey: string;
    steps: Array<{ id: string; headingKey: string; bodyKey: string }>;
  };
  proof?: RecoverFixtureProof | null;
  ambient?: { photoId: "dark-silk-photo-06"; kind: "dark-wave"; assetId: "register-06-dark-silk-v1"; status: "ready"; decision: "D-M38"; codeOwned: true; rasterized: false; altKey: string } | null;
  cooldownSeconds: number;
  stateKeys: {
    pendingKey: string;
    errorKey: string;
    sentHeadingKey: string;
    sentBodyKey: string;
    sentMaskedKey: string;
    cooldownKey: string;
    resendReadyKey: string;
    mailUnavailableKey: string;
    fallbackHeadingKey: string;
    fallbackBodyKey: string;
  };
  media: RecoverFixtureMedia[];
  copy: Record<RecoverStress, Record<string, string>>;
};

export type ResolvedRecoverAction = Omit<RecoverFixtureAction, "labelKey"> & { label: string };
export type ResolvedRecoverPerson = {
  personId: "p_006" | "p_010" | "p_017";
  name: string;
  assetId: "avatar-p_006" | "avatar-p_010" | "team-section-14-asset-14-01-main";
  initials: "AS" | "CW" | "GS";
  alt: string;
  status: "delivered" | "hold";
  avif?: string;
  webp?: string;
  jpg?: string;
};
export type ResolvedRecoverProof =
  | {
      kind: "dashboard";
      proofId: "dash-02";
      title: string;
      alt: string;
      fallback: { heading: string; body: string; retry: string };
      disclosure: { open: string; close: string };
      owner: "live-xpresso-primitives";
      codeOwned: true;
      rasterized: false;
    }
  | {
      kind: "dashboard-and-badges";
      proofId: "dash-04";
      title: string;
      alt: string;
      editorial: { heading: string; body: string };
      lockAlt: string;
      fallback: { heading: string; body: string; retry: string };
      disclosure: { open: string; close: string };
      badges: [
        { id: string; markId: "mark-badge1"; label: string },
        { id: string; markId: "mark-badge2"; label: string },
        { id: string; markId: "mark-badge3"; label: string },
      ];
      owner: "live-xpresso-primitives";
      codeOwned: true;
      rasterized: false;
    }
  | {
      kind: "trust-proof";
      title: string;
      body: string;
      peopleHeading: string;
      peopleBody: string;
      aggregate: string;
      markAlt: string;
      disclosure: { open: string; close: string };
      people: [ResolvedRecoverPerson, ResolvedRecoverPerson, ResolvedRecoverPerson];
    };

export type ResolvedRecoverFixture = {
  sourceKey: RecoverSourceKey;
  shellPreset: AuthShellPreset;
  recoverPreset: "recovery-link";
  activeStress: RecoverStress;
  identity?: {
    companyId: string;
    name: string;
    markId: string;
    src: string;
    inverseSrc: string;
  };
  intro: { heading: string; body: string };
  field: Omit<RecoverFixtureField, "labelKey" | "placeholderKey" | "requiredErrorKey" | "invalidErrorKey"> & {
    label: string;
    placeholder: string;
    requiredError: string;
    invalidError: string;
  };
  shellActions: ResolvedRecoverAction[];
  backToLogin: ResolvedRecoverAction;
  submit: ResolvedRecoverAction;
  sentActions: [ResolvedRecoverAction, ResolvedRecoverAction, ResolvedRecoverAction];
  reassurance: {
    heading: string;
    body: string;
    steps: Array<{ id: string; heading: string; body: string }>;
  };
  proof?: ResolvedRecoverProof;
  photo?: {
    photoId: "dark-silk-photo-06";
    kind: "dark-wave";
    assetId: "register-06-dark-silk-v1";
    alt: string;
    status: "ready";
  };
  ambient: { treatment: "outline" | "proof-edge" | "graphic-mark" | "none" | "lines" | "silk-photo"; motion: false };
  cooldownSeconds: 30;
  mediaStatus: "ready" | "hold";
  labels: {
    pending: string;
    error: string;
    sentHeading: string;
    sentBody: string;
    sentMasked: string;
    cooldown: string;
    resendReady: string;
    mailUnavailable: string;
    fallbackHeading: string;
    fallbackBody: string;
  };
};

const EXPECTED: Record<RecoverSourceKey, {
  shell: AuthShellPreset;
  identity: string | null;
  shellActions: string;
  proof: "none" | "dashboard" | "trust-proof" | "dashboard-and-badges";
  mediaKinds: string;
  ambient: ResolvedRecoverFixture["ambient"]["treatment"];
  steps: number;
  hold: boolean;
}> = {
  "forgot-password-01": { shell:"centered-quick-entry",identity:"mark-c_001",shellActions:"",proof:"none",mediaKinds:"identity-mark|css-outline-decoration",ambient:"outline",steps:2,hold:false },
  "forgot-password-02": { shell:"product-proof-split",identity:"mark-c_002",shellActions:"back",proof:"dashboard",mediaKinds:"identity-mark|ui-proof",ambient:"proof-edge",steps:2,hold:false },
  "forgot-password-03": { shell:"graphic-trust-split",identity:"mark-c_003",shellActions:"",proof:"trust-proof",mediaKinds:"identity-mark|graphic-mark|trust-mark|person|person|person",ambient:"graphic-mark",steps:3,hold:false },
  "forgot-password-04": { shell:"trial-proof-split",identity:null,shellActions:"",proof:"dashboard-and-badges",mediaKinds:"lock-glyph|ui-proof|proof-badge|proof-badge|proof-badge",ambient:"none",steps:2,hold:false },
  "forgot-password-05": { shell:"centered-social-card",identity:"mark-c_005",shellActions:"",proof:"none",mediaKinds:"identity-mark|css-line-tonal-decoration",ambient:"lines",steps:2,hold:false },
  "forgot-password-06": { shell:"ambient-trust-split",identity:"mark-c_006",shellActions:"home",proof:"trust-proof",mediaKinds:"identity-mark|trust-mark|person|person|person|dark-wave",ambient:"silk-photo",steps:3,hold:false },
};

const COMPANY_MARKS: Record<string, { companyId:string;name:string;src:string;inverseSrc:string }> = {
  "mark-c_001": {companyId:"c_001",name:"Avelor Grid",src:"/media/logo-avelor-grid-symbol-color-on-light.svg",inverseSrc:"/media/logo-avelor-grid-symbol-color-on-dark.svg"},
  "mark-c_002": {companyId:"c_002",name:"Brentex Point",src:"/media/logo-brentex-point-symbol-color-on-light.svg",inverseSrc:"/media/logo-brentex-point-symbol-color-on-dark.svg"},
  "mark-c_003": {companyId:"c_003",name:"Caldara Data",src:"/media/logo-caldara-data-symbol-color-on-light.svg",inverseSrc:"/media/logo-caldara-data-symbol-color-on-dark.svg"},
  "mark-c_005": {companyId:"c_005",name:"Entralis Forge",src:"/media/logo-entralis-forge-symbol-color-on-light.svg",inverseSrc:"/media/logo-entralis-forge-symbol-color-on-dark.svg"},
  "mark-c_006": {companyId:"c_006",name:"Falden Code",src:"/media/logo-falden-code-symbol-color-on-light.svg",inverseSrc:"/media/logo-falden-code-symbol-color-on-dark.svg"},
};

const PEOPLE: Record<string, Omit<ResolvedRecoverPerson, "alt">> = {
  "p_006": {personId:"p_006",name:"Anya Sokolov",assetId:"avatar-p_006",initials:"AS",status:"delivered",avif:"/media/about-us-anya-sokolov-avatar-256.avif",webp:"/media/about-us-anya-sokolov-avatar-256.webp",jpg:"/media/about-us-anya-sokolov-avatar-256.jpg"},
  "p_010": {personId:"p_010",name:"Chen Wei",assetId:"avatar-p_010",initials:"CW",status:"delivered",avif:"/media/team-section-07-portrait-07-1-avatar-256.avif",webp:"/media/team-section-07-portrait-07-1-avatar-256.webp",jpg:"/media/team-section-07-portrait-07-1-avatar-256.jpg"},
  "p_017": {personId:"p_017",name:"Gia Silva",assetId:"team-section-14-asset-14-01-main",initials:"GS",status:"delivered",avif:"/media/team-section-14-asset-14-01-main-avatar-256.avif",webp:"/media/team-section-14-asset-14-01-main-avatar-256.webp",jpg:"/media/team-section-14-asset-14-01-main-avatar-256.jpg"},
};

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
  return value;
};
const copyValue = (copy:Record<string,string>, key:unknown, label:string, sourceKey:string) =>
  required(copy[required(key,`${label} key`,sourceKey)],label,sourceKey);
const localPath = (path:string|undefined,label:string,sourceKey:RecoverSourceKey) => {
  if (!path || !path.startsWith(`/demo/${sourceKey}/`) || path.includes("#") || /^(?:https?:)?\/\//i.test(path)) {
    throw new Error(`${sourceKey} ${label} requires a source-owned local path.`);
  }
};

function resolveIdentity(fixture:RecoverFixture) {
  if (fixture.identity.markId === null) return undefined;
  const mark = COMPANY_MARKS[fixture.identity.markId];
  if (!mark || mark.companyId !== fixture.identity.companyId || mark.name !== fixture.identity.name) {
    throw new Error(`${fixture.sourceKey} has an invalid company identity.`);
  }
  return {...mark,markId:fixture.identity.markId};
}

function resolveAction(action:RecoverFixtureAction,copy:Record<string,string>,sourceKey:RecoverSourceKey):ResolvedRecoverAction {
  if (action.role === "submit") {
    if (action.method !== "post" || action.href !== undefined) throw new Error(`${sourceKey} submit must remain a POST owner.`);
    localPath(action.action,`action ${action.id}`,sourceKey);
  } else if (action.role === "back" || action.role === "home" || action.role === "back-login") {
    if (action.action !== undefined || action.method !== undefined) throw new Error(`${sourceKey} navigation action ${action.id} cannot submit.`);
    localPath(action.href,`action ${action.id}`,sourceKey);
  } else if (action.href !== undefined || action.action !== undefined || action.method !== undefined) {
    throw new Error(`${sourceKey} sent action ${action.id} must remain state-owned.`);
  }
  return {...action,label:copyValue(copy,action.labelKey,`action ${action.id} label`,sourceKey)};
}

function resolvePeople(fixture:RecoverFixture,copy:Record<string,string>):[ResolvedRecoverPerson,ResolvedRecoverPerson,ResolvedRecoverPerson] {
  const media = fixture.media.filter((item)=>item.kind === "person");
  if (media.map(({personId})=>personId).join("|") !== "p_006|p_010|p_017") throw new Error(`${fixture.sourceKey} has the wrong trust identities.`);
  const people = media.map((item)=>{
    const person = item.personId ? PEOPLE[item.personId] : undefined;
    if (!person || item.assetId !== person.assetId || item.initials !== person.initials) throw new Error(`${fixture.sourceKey} person binding drifted.`);
    const canonicalAssetId = person.personId === "p_006" ? "about-us-anya-sokolov" : person.personId === "p_010" ? "team-section-07-portrait-07-1" : "team-section-14-asset-14-01-main";
    if (item.canonicalAssetId !== canonicalAssetId) throw new Error(`${fixture.sourceKey} person provenance drifted.`);
    if (person.personId === "p_017" && (item.canonicalAssetId !== "team-section-14-asset-14-01-main" || item.status === "HOLD-INFRA")) throw new Error(`${fixture.sourceKey} must retain Gia's exact delivered canonical binding.`);
    return {...person,alt:copyValue(copy,item.altKey,`person ${person.personId} alt`,fixture.sourceKey)};
  });
  return people as [ResolvedRecoverPerson,ResolvedRecoverPerson,ResolvedRecoverPerson];
}

function validateMedia(fixture:RecoverFixture) {
  const codeOwnedKinds = new Set([
    "identity-mark","css-outline-decoration","css-line-tonal-decoration","ui-proof",
    "graphic-mark","trust-mark","lock-glyph","proof-badge","dark-wave",
  ]);
  for (const item of fixture.media) {
    if (codeOwnedKinds.has(item.kind) && (!item.codeOwned || item.rasterized !== false)) {
      throw new Error(`${fixture.sourceKey} ${item.id} must remain code-owned and non-rasterized.`);
    }
    if ((item as RecoverFixtureMedia & {href?:unknown}).href !== undefined) {
      throw new Error(`${fixture.sourceKey} ${item.id} cannot become interactive media.`);
    }
  }
  const identityMarks = fixture.media.filter((item)=>item.kind === "identity-mark");
  if (fixture.identity.markId === null) {
    if (identityMarks.length) throw new Error(`${fixture.sourceKey} cannot invent an identity mark.`);
  } else if (identityMarks.length !== 1 || identityMarks[0]!.markId !== fixture.identity.markId) {
    throw new Error(`${fixture.sourceKey} identity media drifted.`);
  }
  const proofMedia = fixture.media.filter((item)=>item.kind === "ui-proof");
  if (fixture.proof?.kind === "dashboard" || fixture.proof?.kind === "dashboard-and-badges") {
    if (proofMedia.length !== 1 || proofMedia[0]!.proofId !== fixture.proof.proofId || proofMedia[0]!.owner !== "live-xpresso-primitives") {
      throw new Error(`${fixture.sourceKey} live proof binding drifted.`);
    }
  } else if (proofMedia.length) {
    throw new Error(`${fixture.sourceKey} cannot invent live proof media.`);
  }
  for (const item of fixture.media.filter((entry)=>entry.kind === "graphic-mark" || entry.kind === "trust-mark")) {
    if (item.markId !== fixture.identity.markId) throw new Error(`${fixture.sourceKey} proof mark identity drifted.`);
  }
  if (fixture.sourceKey === "forgot-password-04") {
    const lock = fixture.media.find((item)=>item.kind === "lock-glyph");
    const badges = fixture.media.filter((item)=>item.kind === "proof-badge");
    if (!lock || lock.proofId !== "recover-lock-04" || lock.owner !== "RecoverUnit") throw new Error("forgot-password-04 lock proof binding drifted.");
    if (badges.map(({labelKey})=>labelKey).join("|") !== "badge_encrypted|badge_cloud|badge_support") throw new Error("forgot-password-04 badge labels drifted.");
  }
}

function resolveProof(fixture:RecoverFixture,copy:Record<string,string>):ResolvedRecoverProof|undefined {
  const proof = fixture.proof;
  if (!proof) return undefined;
  if (proof.kind === "trust-proof") {
    if (proof.people.join("|") !== "p_006|p_010|p_017") throw new Error(`${fixture.sourceKey} proof person order drifted.`);
    return {
      kind:"trust-proof",
      title:copyValue(copy,proof.titleKey,"trust title",fixture.sourceKey),
      body:copyValue(copy,proof.bodyKey,"trust body",fixture.sourceKey),
      peopleHeading:copyValue(copy,proof.peopleHeadingKey,"people heading",fixture.sourceKey),
      peopleBody:copyValue(copy,proof.peopleBodyKey,"people body",fixture.sourceKey),
      aggregate:copyValue(copy,proof.aggregateKey,"people aggregate",fixture.sourceKey),
      markAlt:copyValue(copy,proof.markAltKey,"trust mark alt",fixture.sourceKey),
      disclosure:{open:copyValue(copy,proof.detailsOpenKey,"proof open",fixture.sourceKey),close:copyValue(copy,proof.detailsCloseKey,"proof close",fixture.sourceKey)},
      people:resolvePeople(fixture,copy),
    };
  }
  if (!proof.codeOwned || proof.rasterized || !["dash-02","dash-04"].includes(proof.proofId)) throw new Error(`${fixture.sourceKey} violates D-M1.`);
  const common = {
    title:copyValue(copy,proof.titleKey,"proof title",fixture.sourceKey),
    alt:copyValue(copy,proof.altKey,"proof alt",fixture.sourceKey),
    fallback:{heading:copyValue(copy,proof.fallbackHeadingKey,"proof fallback heading",fixture.sourceKey),body:copyValue(copy,proof.fallbackBodyKey,"proof fallback body",fixture.sourceKey),retry:copyValue(copy,proof.retryLabelKey,"proof retry",fixture.sourceKey)},
    disclosure:{open:copyValue(copy,proof.detailsOpenKey,"proof open",fixture.sourceKey),close:copyValue(copy,proof.detailsCloseKey,"proof close",fixture.sourceKey)},
    owner:"live-xpresso-primitives" as const,
    codeOwned:true as const,
    rasterized:false as const,
  };
  if (proof.kind === "dashboard") return {kind:"dashboard",proofId:"dash-02",...common};
  const badgeMedia = fixture.media.filter((item)=>item.kind === "proof-badge");
  if (badgeMedia.map(({markId})=>markId).join("|") !== "mark-badge1|mark-badge2|mark-badge3") throw new Error("forgot-password-04 requires three ordered non-interactive badges.");
  const badges: Extract<ResolvedRecoverProof,{kind:"dashboard-and-badges"}>["badges"] = [
    {id:badgeMedia[0]!.id,markId:"mark-badge1",label:copyValue(copy,proof.badgeLabelKeys[0],`badge ${badgeMedia[0]!.id}`,fixture.sourceKey)},
    {id:badgeMedia[1]!.id,markId:"mark-badge2",label:copyValue(copy,proof.badgeLabelKeys[1],`badge ${badgeMedia[1]!.id}`,fixture.sourceKey)},
    {id:badgeMedia[2]!.id,markId:"mark-badge3",label:copyValue(copy,proof.badgeLabelKeys[2],`badge ${badgeMedia[2]!.id}`,fixture.sourceKey)},
  ];
  return {
    kind:"dashboard-and-badges",proofId:"dash-04",...common,
    editorial:{heading:copyValue(copy,proof.editorialHeadingKey,"editorial heading",fixture.sourceKey),body:copyValue(copy,proof.editorialBodyKey,"editorial body",fixture.sourceKey)},
    lockAlt:copyValue(copy,proof.lockAltKey,"lock alt",fixture.sourceKey),
    badges,
  };
}

export function resolveRecoverFixture(fixture:RecoverFixture,stress:RecoverStress="base"):ResolvedRecoverFixture {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown recover source ${fixture.sourceKey}.`);
  if (fixture.packet !== "forgot-password-contract-v1" || fixture.owner !== "RecoverUnit" || fixture.shellOwner !== "AuthShell" || fixture.recoverPreset !== "recovery-link") throw new Error(`${fixture.sourceKey} has the wrong owner or packet.`);
  validateMedia(fixture);
  const copy = fixture.copy[stress];
  if (!copy) throw new Error(`${fixture.sourceKey} lacks ${stress} copy.`);
  const localeKeys = Object.values(fixture.copy).map((values)=>Object.keys(values).sort().join("|"));
  if (new Set(localeKeys).size !== 1) throw new Error(`${fixture.sourceKey} copy stresses drift.`);
  const proofKind = fixture.proof?.kind ?? "none";
  if (fixture.shellPreset !== expected.shell || fixture.identity.markId !== expected.identity || fixture.shellActions.map(({role})=>role).join("|") !== expected.shellActions || proofKind !== expected.proof || fixture.media.map(({kind})=>kind).join("|") !== expected.mediaKinds || fixture.reassurance.steps.length !== expected.steps) {
    throw new Error(`${fixture.sourceKey} drifts from its closed source mapping.`);
  }
  const field = fixture.field;
  if ([field.id,field.name,field.type,field.autoComplete,field.inputMode,field.enterKeyHint,field.autoCapitalize,String(field.spellCheck),String(field.required)].join("|") !== "email|email|email|email|email|send|none|false|true") throw new Error(`${fixture.sourceKey} violates the native email field contract.`);
  if (!copyValue(copy,field.placeholderKey,"email placeholder",fixture.sourceKey).includes(".example") || !copyValue(copy,fixture.stateKeys.sentMaskedKey,"masked destination",fixture.sourceKey).includes(".example")) throw new Error(`${fixture.sourceKey} must keep non-routable example addresses.`);
  if (fixture.cooldownSeconds !== 30) throw new Error(`${fixture.sourceKey} cooldown must remain deterministic at 30 seconds.`);
  const actions = [...fixture.shellActions,fixture.backToLogin,fixture.submit,...fixture.sentActions];
  if (new Set(actions.map(({id})=>id)).size !== actions.length) throw new Error(`${fixture.sourceKey} repeats an action owner.`);
  if (fixture.backToLogin.role !== "back-login" || fixture.submit.role !== "submit" || fixture.sentActions.map(({role})=>role).join("|") !== "open-mail|resend|edit-email") throw new Error(`${fixture.sourceKey} has the wrong ordered recovery actions.`);
  const steps = fixture.reassurance.steps.map((step)=>({id:step.id,heading:copyValue(copy,step.headingKey,`step ${step.id} heading`,fixture.sourceKey),body:copyValue(copy,step.bodyKey,`step ${step.id} body`,fixture.sourceKey)}));
  if (new Set(steps.map(({id})=>id)).size !== steps.length || steps.length < 2 || steps.length > 4) throw new Error(`${fixture.sourceKey} has an invalid reassurance sequence.`);
  const proof = resolveProof(fixture,copy);
  const ambient = fixture.ambient;
  const photo = ambient ? {photoId:ambient.photoId,kind:ambient.kind,assetId:ambient.assetId,alt:copyValue(copy,ambient.altKey,"photo alt",fixture.sourceKey),status:ambient.status} : undefined;
  if (fixture.sourceKey !== "forgot-password-06" && photo) throw new Error(`${fixture.sourceKey} cannot invent an ambient photo.`);
  const darkWave = fixture.media.find((item)=>item.kind === "dark-wave");
  if (fixture.sourceKey === "forgot-password-06" && (!photo || !ambient || photo.kind !== "dark-wave" || photo.assetId !== "register-06-dark-silk-v1" || ambient.decision !== "D-M38" || ambient.codeOwned !== true || ambient.rasterized !== false || ["avif","webp","jpg","src","srcset"].some((key)=>key in ambient) || !darkWave || darkWave.id !== "dark-silk-photo-06" || darkWave.assetId !== "register-06-dark-silk-v1" || darkWave.status !== "ready" || darkWave.decision !== "D-M38" || darkWave.codeOwned !== true || darkWave.rasterized !== false || ["avif","webp","jpg","src","srcset"].some((key)=>key in darkWave))) throw new Error("forgot-password-06 cannot retire or substitute the shared D-M38 dark-wave seat.");
  const mediaStatus = fixture.media.some(({status})=>status === "HOLD-INFRA") ? "hold" : "ready";
  if ((mediaStatus === "hold") !== expected.hold) throw new Error(`${fixture.sourceKey} has the wrong localized media status.`);
  const identity = resolveIdentity(fixture);
  const labels = fixture.stateKeys;
  return {
    sourceKey:fixture.sourceKey,shellPreset:fixture.shellPreset,recoverPreset:fixture.recoverPreset,activeStress:stress,identity,
    intro:{heading:copyValue(copy,fixture.intro.headingKey,"intro heading",fixture.sourceKey),body:copyValue(copy,fixture.intro.bodyKey,"intro body",fixture.sourceKey)},
    field:{id:field.id,name:field.name,type:field.type,autoComplete:field.autoComplete,inputMode:field.inputMode,enterKeyHint:field.enterKeyHint,autoCapitalize:field.autoCapitalize,spellCheck:field.spellCheck,required:field.required,label:copyValue(copy,field.labelKey,"email label",fixture.sourceKey),placeholder:copyValue(copy,field.placeholderKey,"email placeholder",fixture.sourceKey),requiredError:copyValue(copy,field.requiredErrorKey,"required error",fixture.sourceKey),invalidError:copyValue(copy,field.invalidErrorKey,"invalid error",fixture.sourceKey)},
    shellActions:fixture.shellActions.map((action)=>resolveAction(action,copy,fixture.sourceKey)),
    backToLogin:resolveAction(fixture.backToLogin,copy,fixture.sourceKey),
    submit:resolveAction(fixture.submit,copy,fixture.sourceKey),
    sentActions:fixture.sentActions.map((action)=>resolveAction(action,copy,fixture.sourceKey)) as [ResolvedRecoverAction,ResolvedRecoverAction,ResolvedRecoverAction],
    reassurance:{heading:copyValue(copy,fixture.reassurance.headingKey,"reassurance heading",fixture.sourceKey),body:copyValue(copy,fixture.reassurance.bodyKey,"reassurance body",fixture.sourceKey),steps},
    proof,photo,ambient:{treatment:expected.ambient,motion:false},cooldownSeconds:30,mediaStatus,
    labels:{pending:copyValue(copy,labels.pendingKey,"pending",fixture.sourceKey),error:copyValue(copy,labels.errorKey,"error",fixture.sourceKey),sentHeading:copyValue(copy,labels.sentHeadingKey,"sent heading",fixture.sourceKey),sentBody:copyValue(copy,labels.sentBodyKey,"sent body",fixture.sourceKey),sentMasked:copyValue(copy,labels.sentMaskedKey,"masked destination",fixture.sourceKey),cooldown:copyValue(copy,labels.cooldownKey,"cooldown",fixture.sourceKey),resendReady:copyValue(copy,labels.resendReadyKey,"resend ready",fixture.sourceKey),mailUnavailable:copyValue(copy,labels.mailUnavailableKey,"mail unavailable",fixture.sourceKey),fallbackHeading:copyValue(copy,labels.fallbackHeadingKey,"fallback heading",fixture.sourceKey),fallbackBody:copyValue(copy,labels.fallbackBodyKey,"fallback body",fixture.sourceKey)},
  };
}

export function composeRecoverAuthShellModel(
  recover:ResolvedRecoverFixture,
  base:ResolvedAuthShellModel,
):ResolvedAuthShellModel {
  if (base.shellPreset !== recover.shellPreset) throw new Error(`${recover.sourceKey} shell base does not match ${recover.shellPreset}.`);
  let proof:ResolvedAuthProof|undefined;
  if (recover.proof?.kind === "dashboard") {
    if (!base.proof || base.proof.kind !== "dashboard") throw new Error(`${recover.sourceKey} requires a dashboard shell base.`);
    proof = {
      ...base.proof,
      proofId:recover.proof.proofId,
      title:recover.proof.title,
      alt:recover.proof.alt,
      fallback:{heading:recover.proof.fallback.heading,message:recover.proof.fallback.body,action:recover.proof.fallback.retry},
      disclosure:recover.proof.disclosure,
    };
  } else if (recover.proof?.kind === "dashboard-and-badges") {
    const recoverProof = recover.proof;
    if (!base.proof || base.proof.kind !== "editorial" || base.proof.badges.length !== recoverProof.badges.length) throw new Error(`${recover.sourceKey} requires an editorial shell base with three badges.`);
    proof = {
      ...base.proof,
      proofId:recoverProof.proofId,
      heading:recoverProof.editorial.heading,
      body:recoverProof.editorial.body,
      title:recoverProof.title,
      alt:recoverProof.alt,
      fallback:{heading:recoverProof.fallback.heading,message:recoverProof.fallback.body,action:recoverProof.fallback.retry},
      disclosure:recoverProof.disclosure,
      badges:base.proof.badges.map((badge,index)=>({...badge,id:recoverProof.badges[index]!.id,label:recoverProof.badges[index]!.label})),
    };
  } else if (recover.proof?.kind === "trust-proof") {
    if (!base.proof || base.proof.kind !== "trust") throw new Error(`${recover.sourceKey} requires a trust shell base.`);
    proof = {
      ...base.proof,
      reassurance:{heading:recover.proof.title,body:recover.proof.body},
      card:{heading:recover.proof.peopleHeading,body:recover.proof.peopleBody},
      aggregateLabel:recover.proof.aggregate,
      disclosure:{open:recover.proof.disclosure.open,close:recover.proof.disclosure.close,fallback:recover.labels.fallbackBody},
      people:recover.proof.people.map((person)=>({
        id:person.personId,
        name:person.name,
        assetId:person.assetId,
        initials:person.initials,
        alt:person.alt,
        status:person.status === "delivered" ? "delivered" : "pending",
        avif:person.avif,
        webp:person.webp,
        jpg:person.jpg,
      })),
    };
  } else if (base.proof) {
    throw new Error(`${recover.sourceKey} cannot inherit an unowned proof.`);
  }
  const photo = recover.photo ? {
    ...(base.photo ?? {
      kind:"dark-wave" as const,
      assetId:recover.photo.assetId,
      focalPoint:{M:"50% 50%",TP:"50% 50%",TL:"50% 50%",DS:"50% 50%",DW:"50% 50%"},
      status:"ready" as const,
    }),
    kind:recover.photo.kind,
    assetId:recover.photo.assetId,
    alt:recover.photo.alt,
    status:recover.photo.status,
    fallback:{heading:recover.labels.fallbackHeading,body:recover.labels.fallbackBody,reducedData:recover.labels.fallbackBody},
  } : undefined;
  return {
    sourceKey:recover.sourceKey,
    shellPreset:recover.shellPreset,
    identity:recover.identity,
    intro:recover.intro,
    shellActions:recover.shellActions.flatMap((action)=>action.role === "home" || action.role === "back" ? [{id:action.id,role:action.role,label:action.label,href:action.href}] : []),
    proof,
    photo,
    ambient:recover.ambient,
    labels:{},
  };
}
