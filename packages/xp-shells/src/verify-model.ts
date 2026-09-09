import type {
  AuthShellPreset,
  ResolvedAuthPerson,
  ResolvedAuthProof,
  ResolvedAuthShellIdentity,
  ResolvedAuthShellModel,
} from "./auth-model";
import type { ResetFixtureProof, ResolvedResetProof } from "./reset-model";

export const VERIFY_SOURCE_KEYS = [
  "verify-email-01",
  "verify-email-02",
  "verify-email-03",
  "verify-email-04",
  "verify-email-05",
  "verify-email-06",
] as const;

export type VerifySourceKey = (typeof VERIFY_SOURCE_KEYS)[number];
export type VerifyStress = "base" | "short" | "longLocale";
export type VerifyPhase = "waiting" | "checking" | "verified" | "expired" | "error";
export type VerifyPreset = "email-verification";

type VerifyFixtureMedia = {
  id: string;
  kind: string;
  owner?: string;
  markId?: string;
  proofId?: string;
  personId?: string;
  assetId?: string;
  canonicalAssetId?: string | null;
  initials?: string;
  altKey?: string;
  decorative?: boolean;
  codeOwned?: boolean;
  rasterized?: boolean;
  status?: "HOLD-INFRA" | "ready";
  decision?: "D-M38";
};

export type VerifyFixture = {
  schemaVersion: 1;
  packet: "verify-email-contract-v1";
  decision: "D-M22";
  sourceKey: VerifySourceKey;
  owner: "VerifyUnit";
  shellOwner: "AuthShell";
  shellPreset: AuthShellPreset;
  verifyPreset: VerifyPreset;
  identity: { companyId: string; name: string; markId: string | null };
  intro: { headingKey: string; bodyKey: string; maskedAddress: string };
  continueAction: { id: string; labelKey: string; role: "defer" | "acknowledge"; href: string };
  resend: {
    id: string;
    labelKey: string;
    waitingLabelKey: string;
    availableLabelKey: string;
    announcementKey: string;
    method: "post";
    action: string;
    serverDeadline: string;
    deadlineSource: "host-response";
  };
  editEmail: { id: string; labelKey: string; href: string; invalidatesPendingIdentity: true; preserveNonEmailData: true };
  copyAddress: { id: string; labelKey: string; announcementKey: string };
  mailTargets: Array<{
    id: string;
    labelKey: string;
    href: string;
    kind: "verified-web-inbox";
    hostVerified: true;
    allowlisted: true;
  }>;
  verification: {
    statusEndpoint: string;
    pollBaseMs: number;
    pollBackoffMaxMs: number;
    pauseWhenHidden: true;
    checkOnVisible: true;
    pushRequiresStatusRead: true;
    continueOnce: true;
    tokenStorage: "server-route-only";
    cleanRedirect: string;
  };
  shellActions: Array<{ id: string; role: "home" | "back"; labelKey: string; href: string }>;
  proof?: ResetFixtureProof | null;
  ambient?: {
    photoId: string;
    kind: "dark-wave";
    assetId: string;
    status: "ready";
    decision: "D-M38";
    codeOwned: true;
    rasterized: false;
    altKey: string;
    fallbackHeadingKey: string;
    fallbackBodyKey: string;
    reducedDataKey: string;
    motionPauseKey: string;
    motionResumeKey: string;
    motionStaticKey: string;
  } | null;
  statusKeys: {
    checkingAnnouncementKey: string;
    verifiedHeadingKey: string;
    verifiedBodyKey: string;
    verifiedAnnouncementKey: string;
    expiredHeadingKey: string;
    expiredBodyKey: string;
    expiredAnnouncementKey: string;
    errorHeadingKey: string;
    errorBodyKey: string;
    errorAnnouncementKey: string;
    retryLabelKey: string;
    formAriaKey: string;
  };
  scenarios: {
    mailTargets: "none" | "single" | "multiple";
    phases: VerifyPhase[];
    deepLinks: Array<"valid" | "expired" | "already-consumed">;
    visibilityFastPath: true;
    source04AddressCorrection: boolean;
  };
  media: VerifyFixtureMedia[];
  copy: Record<VerifyStress, Record<string, string>>;
};

export type ResolvedVerifyFixture = {
  sourceKey: VerifySourceKey;
  shellPreset: AuthShellPreset;
  verifyPreset: VerifyPreset;
  activeStress: VerifyStress;
  identity?: ResolvedAuthShellIdentity;
  intro: { heading: string; body: string; maskedAddress: string };
  continueAction: { id: string; label: string; role: "defer" | "acknowledge"; href: string };
  resend: {
    id: string;
    label: string;
    waitingLabel: string;
    availableLabel: string;
    announcement: string;
    method: "post";
    action: string;
    serverDeadline: number;
  };
  editEmail: { id: string; label: string; href: string; invalidatesPendingIdentity: true; preserveNonEmailData: true };
  copyAddress: { id: string; label: string; announcement: string };
  mailTargets: Array<{ id: string; label: string; href: string; host: string }>;
  verification: {
    statusEndpoint: string;
    pollBaseMs: number;
    pollBackoffMaxMs: number;
    cleanRedirect: string;
  };
  shellActions: Array<{ id: string; role: "home" | "back"; label: string; href: string }>;
  proof?: ResolvedResetProof;
  photo?: { kind: "dark-wave"; assetId: string; alt: string; fallback: { heading: string; body: string; reducedData: string }; status: "ready" };
  ambient: { treatment: "outline" | "proof-edge" | "graphic-mark" | "none" | "lines" | "silk-photo"; motion: boolean };
  mediaStatus: "ready" | "hold";
  labels: {
    checkingAnnouncement: string;
    verified: { heading: string; body: string; announcement: string };
    expired: { heading: string; body: string; announcement: string };
    error: { heading: string; body: string; announcement: string };
    retry: string;
    formAria: string;
    motionPause?: string;
    motionResume?: string;
    motionStatic?: string;
  };
};

const EXPECTED: Record<VerifySourceKey, {
  shell: AuthShellPreset;
  role: "defer" | "acknowledge";
  targets: number;
  proof: string;
  ambient: ResolvedVerifyFixture["ambient"]["treatment"];
  hold: boolean;
}> = {
  "verify-email-01": { shell: "centered-quick-entry", role: "defer", targets: 0, proof: "none", ambient: "outline", hold: false },
  "verify-email-02": { shell: "product-proof-split", role: "defer", targets: 1, proof: "dashboard", ambient: "proof-edge", hold: false },
  "verify-email-03": { shell: "graphic-trust-split", role: "defer", targets: 2, proof: "trust-proof", ambient: "graphic-mark", hold: false },
  "verify-email-04": { shell: "trial-proof-split", role: "acknowledge", targets: 0, proof: "dashboard-and-badges", ambient: "none", hold: false },
  "verify-email-05": { shell: "centered-social-card", role: "defer", targets: 1, proof: "none", ambient: "lines", hold: false },
  "verify-email-06": { shell: "ambient-trust-split", role: "defer", targets: 2, proof: "trust-proof", ambient: "silk-photo", hold: false },
};

const MARKS: Record<string, ResolvedAuthShellIdentity> = {
  "mark-c_001": { companyId: "c_001", name: "Avelor Grid", markId: "mark-c_001", src: "/media/logo-avelor-grid-symbol-color-on-light.svg", inverseSrc: "/media/logo-avelor-grid-symbol-color-on-dark.svg" },
  "mark-c_002": { companyId: "c_002", name: "Brentex Point", markId: "mark-c_002", src: "/media/logo-brentex-point-symbol-color-on-light.svg", inverseSrc: "/media/logo-brentex-point-symbol-color-on-dark.svg" },
  "mark-c_003": { companyId: "c_003", name: "Caldara Data", markId: "mark-c_003", src: "/media/logo-caldara-data-symbol-color-on-light.svg", inverseSrc: "/media/logo-caldara-data-symbol-color-on-dark.svg" },
  "mark-c_005": { companyId: "c_005", name: "Entralis Forge", markId: "mark-c_005", src: "/media/logo-entralis-forge-symbol-color-on-light.svg", inverseSrc: "/media/logo-entralis-forge-symbol-color-on-dark.svg" },
  "mark-c_006": { companyId: "c_006", name: "Falden Code", markId: "mark-c_006", src: "/media/logo-falden-code-symbol-color-on-light.svg", inverseSrc: "/media/logo-falden-code-symbol-color-on-dark.svg" },
};

const PEOPLE: Record<string, Omit<ResolvedAuthPerson, "alt">> = {
  p_006: { id: "p_006", name: "Anya Sokolov", assetId: "avatar-p_006", initials: "AS", status: "delivered", avif: "/media/about-us-anya-sokolov-avatar-256.avif", webp: "/media/about-us-anya-sokolov-avatar-256.webp", jpg: "/media/about-us-anya-sokolov-avatar-256.jpg" },
  p_010: { id: "p_010", name: "Chen Wei", assetId: "avatar-p_010", initials: "CW", status: "delivered", avif: "/media/team-section-07-portrait-07-1-avatar-256.avif", webp: "/media/team-section-07-portrait-07-1-avatar-256.webp", jpg: "/media/team-section-07-portrait-07-1-avatar-256.jpg" },
  p_018: { id: "p_018", name: "Katarina Novak", assetId: "avatar-p_018", initials: "KN", status: "delivered", avif: "/media/about-us-katarina-novak-avatar-256.avif", webp: "/media/about-us-katarina-novak-avatar-256.webp", jpg: "/media/about-us-katarina-novak-avatar-256.jpg" },
};

const required = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
  return value;
};
const text = (copy: Record<string, string>, key: unknown, label: string, source: string) => required(copy[required(key, `${label} key`, source)], label, source);
const sourceRoute = (value: string, label: string, source: VerifySourceKey) => {
  if (!value.startsWith(`/demo/${source}/`) || value.includes("#") || /^(?:https?:)?\/\//i.test(value)) throw new Error(`${source} ${label} must be source-owned.`);
};

function resolveIdentity(fixture: VerifyFixture) {
  if (fixture.identity.markId === null) return undefined;
  const mark = MARKS[fixture.identity.markId];
  if (!mark || mark.companyId !== fixture.identity.companyId || mark.name !== fixture.identity.name) throw new Error(`${fixture.sourceKey} identity drifted.`);
  return mark;
}

function resolveProof(fixture: VerifyFixture, copy: Record<string, string>): ResolvedResetProof | undefined {
  const proof = fixture.proof;
  if (!proof) return undefined;
  const disclosure = { open: text(copy, proof.detailsOpenKey, "proof open", fixture.sourceKey), close: text(copy, proof.detailsCloseKey, "proof close", fixture.sourceKey) };
  if (proof.kind === "trust-chips") throw new Error(`${fixture.sourceKey} cannot replace evidenced people with trust chips.`);
  if (proof.kind === "trust-proof") {
    return {
      kind: proof.kind,
      title: text(copy, proof.titleKey, "trust title", fixture.sourceKey),
      body: text(copy, proof.bodyKey, "trust body", fixture.sourceKey),
      peopleHeading: text(copy, proof.peopleHeadingKey, "people heading", fixture.sourceKey),
      peopleBody: text(copy, proof.peopleBodyKey, "people body", fixture.sourceKey),
      aggregate: text(copy, proof.aggregateKey, "aggregate", fixture.sourceKey),
      markAlt: text(copy, proof.markAltKey, "trust mark", fixture.sourceKey),
      disclosure,
      people: proof.people.map((id) => {
        const media = fixture.media.find((item) => item.kind === "person" && item.personId === id);
        if (!media || media.assetId !== PEOPLE[id]?.assetId) throw new Error(`${fixture.sourceKey} person ${id} lost canonical provenance.`);
        return { ...PEOPLE[id], alt: media.decorative ? "" : text(copy, media.altKey, `${id} alt`, fixture.sourceKey) };
      }),
    };
  }
  if (!proof.codeOwned || proof.rasterized) throw new Error(`${fixture.sourceKey} violates D-M1.`);
  const common = {
    title: text(copy, proof.titleKey, "dashboard title", fixture.sourceKey),
    alt: text(copy, proof.altKey, "dashboard alt", fixture.sourceKey),
    fallback: {
      heading: text(copy, proof.fallbackHeadingKey, "fallback heading", fixture.sourceKey),
      body: text(copy, proof.fallbackBodyKey, "fallback body", fixture.sourceKey),
      retry: text(copy, proof.retryLabelKey, "fallback retry", fixture.sourceKey),
    },
    disclosure,
  };
  if (proof.kind === "dashboard") return { kind: proof.kind, proofId: proof.proofId, ...common };
  const badges = fixture.media.filter((item) => item.kind === "proof-badge");
  if (badges.length !== 3) throw new Error(`${fixture.sourceKey} requires three non-interactive proof badges.`);
  return {
    kind: proof.kind,
    proofId: proof.proofId,
    ...common,
    editorial: { heading: text(copy, proof.editorialHeadingKey, "editorial heading", fixture.sourceKey), body: text(copy, proof.editorialBodyKey, "editorial body", fixture.sourceKey) },
    badges: badges.map((item, index) => ({ id: item.id, markId: required(item.markId, "badge mark", fixture.sourceKey), label: text(copy, proof.badgeLabelKeys[index], `badge ${index + 1}`, fixture.sourceKey) })),
  };
}

function resolveMailTarget(target: VerifyFixture["mailTargets"][number], copy: Record<string, string>, source: VerifySourceKey) {
  if (target.kind !== "verified-web-inbox" || target.hostVerified !== true || target.allowlisted !== true) throw new Error(`${source} inbox target is not host-verified and allowlisted.`);
  let parsed: URL;
  try { parsed = new URL(target.href); } catch { throw new Error(`${source} inbox target is invalid.`); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.hash) throw new Error(`${source} inbox target must be a credential-free HTTPS destination.`);
  return { id: required(target.id, "mail target id", source), label: text(copy, target.labelKey, "open mail label", source), href: parsed.href, host: parsed.hostname };
}

export function resolveVerifyFixture(fixture: VerifyFixture, stress: VerifyStress = "base"): ResolvedVerifyFixture {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown verify source ${fixture.sourceKey}.`);
  if (fixture.packet !== "verify-email-contract-v1" || fixture.decision !== "D-M22" || fixture.owner !== "VerifyUnit" || fixture.shellOwner !== "AuthShell" || fixture.verifyPreset !== "email-verification") throw new Error(`${fixture.sourceKey} owner contract drifted.`);
  const copy = fixture.copy[stress];
  if (!copy || new Set(Object.values(fixture.copy).map((value) => Object.keys(value).sort().join("|"))).size !== 1) throw new Error(`${fixture.sourceKey} copy stress drifted.`);
  if (fixture.shellPreset !== expected.shell || fixture.continueAction.role !== expected.role || fixture.mailTargets.length !== expected.targets || (fixture.proof?.kind ?? "none") !== expected.proof) throw new Error(`${fixture.sourceKey} closed mapping drifted.`);
  if (!/^.{1,64}@[^@]+\.example$/u.test(fixture.intro.maskedAddress) || !/[•*]/u.test(fixture.intro.maskedAddress)) throw new Error(`${fixture.sourceKey} requires a masked reserved address.`);
  sourceRoute(fixture.continueAction.href, "continue route", fixture.sourceKey);
  sourceRoute(fixture.resend.action, "resend route", fixture.sourceKey);
  sourceRoute(fixture.editEmail.href, "edit route", fixture.sourceKey);
  sourceRoute(fixture.verification.statusEndpoint, "status route", fixture.sourceKey);
  for (const action of fixture.shellActions) sourceRoute(action.href, action.id, fixture.sourceKey);
  if (fixture.verification.cleanRedirect !== `/demo/${fixture.sourceKey}` || fixture.verification.pollBaseMs !== 5000 || fixture.verification.pollBackoffMaxMs !== 30000 || fixture.verification.pauseWhenHidden !== true || fixture.verification.checkOnVisible !== true || fixture.verification.pushRequiresStatusRead !== true || fixture.verification.continueOnce !== true || fixture.verification.tokenStorage !== "server-route-only") throw new Error(`${fixture.sourceKey} verification lifecycle drifted.`);
  if (fixture.resend.method !== "post" || fixture.resend.deadlineSource !== "host-response") throw new Error(`${fixture.sourceKey} resend ownership drifted.`);
  const serverDeadline = Date.parse(fixture.resend.serverDeadline);
  if (!Number.isFinite(serverDeadline)) throw new Error(`${fixture.sourceKey} requires an absolute resend deadline.`);
  if (fixture.editEmail.invalidatesPendingIdentity !== true || fixture.editEmail.preserveNonEmailData !== true) throw new Error(`${fixture.sourceKey} edit-email ownership drifted.`);
  if (fixture.scenarios.phases.join("|") !== "waiting|checking|verified|expired|error" || fixture.scenarios.deepLinks.join("|") !== "valid|expired|already-consumed" || fixture.scenarios.visibilityFastPath !== true || fixture.scenarios.source04AddressCorrection !== (fixture.sourceKey === "verify-email-04")) throw new Error(`${fixture.sourceKey} scenario coverage drifted.`);
  for (const item of fixture.media) if ((item.codeOwned || item.kind === "identity-chip") && item.rasterized !== false) throw new Error(`${fixture.sourceKey} code media drifted.`);
  const mediaStatus = fixture.media.some((item) => item.status === "HOLD-INFRA") ? "hold" : "ready";
  if ((mediaStatus === "hold") !== expected.hold) throw new Error(`${fixture.sourceKey} localized media status drifted.`);
  const ambient = fixture.ambient;
  if (fixture.sourceKey === "verify-email-06" && (!ambient || ambient.photoId !== "dark-silk-photo-06" || ambient.kind !== "dark-wave" || ambient.assetId !== "register-06-dark-silk-v1" || ambient.status !== "ready" || ambient.decision !== "D-M38" || ambient.codeOwned !== true || ambient.rasterized !== false || ["avif","webp","jpg","src","srcset"].some((key) => key in ambient) || !fixture.media.some((item) => item.kind === "dark-wave" && item.assetId === "register-06-dark-silk-v1" && item.status === "ready" && item.decision === "D-M38" && item.codeOwned === true && item.rasterized === false && !["avif","webp","jpg","src","srcset"].some((key) => key in item)))) throw new Error(`${fixture.sourceKey} cannot substitute the D-M38 dark-wave seat.`);
  const proof = resolveProof(fixture, copy);
  const photo = fixture.ambient ? {
    kind: fixture.ambient.kind,
    assetId: fixture.ambient.assetId,
    alt: text(copy, fixture.ambient.altKey, "photo alt", fixture.sourceKey),
    fallback: {
      heading: text(copy, fixture.ambient.fallbackHeadingKey, "photo fallback heading", fixture.sourceKey),
      body: text(copy, fixture.ambient.fallbackBodyKey, "photo fallback body", fixture.sourceKey),
      reducedData: text(copy, fixture.ambient.reducedDataKey, "photo reduced data", fixture.sourceKey),
    },
    status: fixture.ambient.status,
  } : undefined;
  return {
    sourceKey: fixture.sourceKey,
    shellPreset: fixture.shellPreset,
    verifyPreset: fixture.verifyPreset,
    activeStress: stress,
    identity: resolveIdentity(fixture),
    intro: { heading: text(copy, fixture.intro.headingKey, "intro heading", fixture.sourceKey), body: text(copy, fixture.intro.bodyKey, "intro body", fixture.sourceKey), maskedAddress: fixture.intro.maskedAddress },
    continueAction: { id: fixture.continueAction.id, label: text(copy, fixture.continueAction.labelKey, "continue label", fixture.sourceKey), role: fixture.continueAction.role, href: fixture.continueAction.href },
    resend: { id: fixture.resend.id, label: text(copy, fixture.resend.labelKey, "resend label", fixture.sourceKey), waitingLabel: text(copy, fixture.resend.waitingLabelKey, "resend waiting", fixture.sourceKey), availableLabel: text(copy, fixture.resend.availableLabelKey, "resend available", fixture.sourceKey), announcement: text(copy, fixture.resend.announcementKey, "resend announcement", fixture.sourceKey), method: fixture.resend.method, action: fixture.resend.action, serverDeadline },
    editEmail: { id: fixture.editEmail.id, label: text(copy, fixture.editEmail.labelKey, "edit email label", fixture.sourceKey), href: fixture.editEmail.href, invalidatesPendingIdentity: true, preserveNonEmailData: true },
    copyAddress: { id: fixture.copyAddress.id, label: text(copy, fixture.copyAddress.labelKey, "copy address label", fixture.sourceKey), announcement: text(copy, fixture.copyAddress.announcementKey, "copy address announcement", fixture.sourceKey) },
    mailTargets: fixture.mailTargets.map((target) => resolveMailTarget(target, copy, fixture.sourceKey)),
    verification: { statusEndpoint: fixture.verification.statusEndpoint, pollBaseMs: fixture.verification.pollBaseMs, pollBackoffMaxMs: fixture.verification.pollBackoffMaxMs, cleanRedirect: fixture.verification.cleanRedirect },
    shellActions: fixture.shellActions.map((action) => ({ id: action.id, role: action.role, label: text(copy, action.labelKey, `${action.id} label`, fixture.sourceKey), href: action.href })),
    proof,
    photo,
    ambient: { treatment: expected.ambient, motion: fixture.sourceKey === "verify-email-06" },
    mediaStatus,
    labels: {
      checkingAnnouncement: text(copy, fixture.statusKeys.checkingAnnouncementKey, "checking announcement", fixture.sourceKey),
      verified: { heading: text(copy, fixture.statusKeys.verifiedHeadingKey, "verified heading", fixture.sourceKey), body: text(copy, fixture.statusKeys.verifiedBodyKey, "verified body", fixture.sourceKey), announcement: text(copy, fixture.statusKeys.verifiedAnnouncementKey, "verified announcement", fixture.sourceKey) },
      expired: { heading: text(copy, fixture.statusKeys.expiredHeadingKey, "expired heading", fixture.sourceKey), body: text(copy, fixture.statusKeys.expiredBodyKey, "expired body", fixture.sourceKey), announcement: text(copy, fixture.statusKeys.expiredAnnouncementKey, "expired announcement", fixture.sourceKey) },
      error: { heading: text(copy, fixture.statusKeys.errorHeadingKey, "error heading", fixture.sourceKey), body: text(copy, fixture.statusKeys.errorBodyKey, "error body", fixture.sourceKey), announcement: text(copy, fixture.statusKeys.errorAnnouncementKey, "error announcement", fixture.sourceKey) },
      retry: text(copy, fixture.statusKeys.retryLabelKey, "retry label", fixture.sourceKey),
      formAria: text(copy, fixture.statusKeys.formAriaKey, "form aria", fixture.sourceKey),
      motionPause: fixture.ambient ? text(copy, fixture.ambient.motionPauseKey, "motion pause", fixture.sourceKey) : undefined,
      motionResume: fixture.ambient ? text(copy, fixture.ambient.motionResumeKey, "motion resume", fixture.sourceKey) : undefined,
      motionStatic: fixture.ambient ? text(copy, fixture.ambient.motionStaticKey, "motion static", fixture.sourceKey) : undefined,
    },
  };
}

export function composeVerifyAuthShellModel(verify: ResolvedVerifyFixture, base: ResolvedAuthShellModel): ResolvedAuthShellModel {
  if (base.shellPreset !== verify.shellPreset) throw new Error(`${verify.sourceKey} shell base mismatch.`);
  let proof: ResolvedAuthProof | undefined;
  if (verify.proof?.kind === "dashboard") {
    if (base.proof?.kind !== "dashboard") throw new Error(`${verify.sourceKey} dashboard base missing.`);
    proof = { ...base.proof, proofId: verify.proof.proofId, title: verify.proof.title, alt: verify.proof.alt, fallback: { heading: verify.proof.fallback.heading, message: verify.proof.fallback.body, action: verify.proof.fallback.retry }, disclosure: verify.proof.disclosure };
  } else if (verify.proof?.kind === "dashboard-and-badges") {
    if (base.proof?.kind !== "editorial") throw new Error(`${verify.sourceKey} editorial base missing.`);
    const editorialBase = base.proof;
    proof = { ...editorialBase, proofId: verify.proof.proofId, title: verify.proof.title, alt: verify.proof.alt, heading: verify.proof.editorial.heading, body: verify.proof.editorial.body, fallback: { heading: verify.proof.fallback.heading, message: verify.proof.fallback.body, action: verify.proof.fallback.retry }, disclosure: verify.proof.disclosure, badges: verify.proof.badges.map((badge, index) => ({ ...editorialBase.badges[index]!, id: badge.id, label: badge.label, markId: badge.markId })) };
  } else if (verify.proof?.kind === "trust-proof") {
    proof = { kind: "trust", reassurance: { heading: verify.proof.title, body: verify.proof.body }, card: { heading: verify.proof.peopleHeading, body: verify.proof.peopleBody }, aggregateLabel: verify.proof.aggregate, disclosure: { ...verify.proof.disclosure, fallback: verify.proof.body }, people: verify.proof.people, mark: verify.identity ? { src: verify.identity.src, inverseSrc: verify.identity.inverseSrc, name: verify.identity.name } : undefined };
  } else if (base.proof) throw new Error(`${verify.sourceKey} cannot inherit unowned proof.`);
  const photo = verify.photo ? { ...(base.photo ?? { kind: "dark-wave" as const, assetId: verify.photo.assetId, focalPoint: { M: "50% 50%", TP: "50% 50%", TL: "50% 50%", DS: "50% 50%", DW: "50% 50%" }, status: "ready" as const }), kind: verify.photo.kind, assetId: verify.photo.assetId, alt: verify.photo.alt, fallback: verify.photo.fallback, status: verify.photo.status } : undefined;
  return { sourceKey: verify.sourceKey, shellPreset: verify.shellPreset, identity: verify.identity, intro: { heading: verify.intro.heading, body: verify.intro.body }, shellActions: verify.shellActions, proof, photo, ambient: verify.ambient, labels: { motionPause: verify.labels.motionPause, motionResume: verify.labels.motionResume, motionStatic: verify.labels.motionStatic } };
}
