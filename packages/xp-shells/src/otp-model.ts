import type {
  AuthShellPreset,
  ResolvedAuthPerson,
  ResolvedAuthProof,
  ResolvedAuthShellIdentity,
  ResolvedAuthShellModel,
} from "./auth-model";
import type { ResetFixtureMedia, ResetFixtureProof, ResolvedResetProof } from "./reset-model";

export const OTP_SOURCE_KEYS = [
  "two-factor-authentication-01",
  "two-factor-authentication-02",
  "two-factor-authentication-03",
  "two-factor-authentication-04",
  "two-factor-authentication-05",
  "two-factor-authentication-06",
] as const;

export type OtpSourceKey = (typeof OTP_SOURCE_KEYS)[number];
export type OtpStress = "base" | "short" | "longLocale";
export type OtpPreset = "authenticator-access" | "sms-reset" | "sms-account-verify";
export type OtpChannel = "authenticator" | "sms";

export type OtpFixture = {
  schemaVersion: 1;
  packet: "two-factor-authentication-contract-v1";
  sourceKey: OtpSourceKey;
  owner: "OtpUnit";
  shellOwner: "AuthShell";
  shellPreset: AuthShellPreset;
  otpPreset: OtpPreset;
  channel: OtpChannel;
  length: 6;
  maskedTarget?: string;
  identity: { companyId: string; name: string; markId: string | null };
  intro: { headingKey: string; bodyKey: string };
  code: { labelKey: string; requiredErrorKey: string; invalidErrorKey: string; expiredErrorKey: string };
  commit: { id: string; labelKey: string; autoSubmit: true; method: "post"; action: string };
  recovery?: { id: string; labelKey: string; localMode: "recovery-code" };
  resend?: { id: string; labelKey: string; waitingLabelKey: string; availableLabelKey: string; announcementKey: string; cooldownSeconds: number };
  done: { headingKey: string; bodyKey: string; actionKey: string; href: string };
  shellActions: Array<{ id: string; role: "home" | "back"; labelKey: string; href: string }>;
  proof?: ResetFixtureProof | null;
  ambient?: { photoId: string; kind: "dark-wave"; assetId: string; status: "ready"; decision: "D-M38"; codeOwned: true; rasterized: false; altKey: string; fallbackHeadingKey: string; fallbackBodyKey: string; reducedDataKey: string; motionPauseKey: string; motionResumeKey: string; motionStaticKey: string } | null;
  stateKeys: { verifyingAnnouncementKey: string; errorAnnouncementKey: string; doneAnnouncementKey: string; formAriaKey: string };
  media: ResetFixtureMedia[];
  copy: Record<OtpStress, Record<string, string>>;
};

export type ResolvedOtpFixture = {
  sourceKey: OtpSourceKey;
  shellPreset: AuthShellPreset;
  otpPreset: OtpPreset;
  channel: OtpChannel;
  activeStress: OtpStress;
  length: 6;
  maskedTarget?: string;
  identity?: ResolvedAuthShellIdentity;
  intro: { heading: string; body: string };
  code: { label: string; requiredError: string; invalidError: string; expiredError: string };
  commit: { id: string; label: string; autoSubmit: true; method: "post"; action: string };
  recovery?: { id: string; label: string; heading: string; body: string; codeLabel: string; placeholder: string; submit: string; cancel: string; invalid: string };
  resend?: { id: string; label: string; waitingLabel: string; availableLabel: string; announcement: string; cooldownSeconds: number };
  done: { heading: string; body: string; action: string; href: string };
  shellActions: Array<{ id: string; role: "home" | "back"; label: string; href: string }>;
  proof?: ResolvedResetProof;
  photo?: { kind: "dark-wave"; assetId: string; alt: string; fallback: { heading: string; body: string; reducedData: string }; status: "ready" };
  ambient: { treatment: "outline" | "proof-edge" | "graphic-mark" | "none" | "lines" | "silk-photo"; motion: boolean };
  mediaStatus: "ready" | "hold";
  labels: { verifyingAnnouncement: string; errorAnnouncement: string; doneAnnouncement: string; formAria: string; motionPause?: string; motionResume?: string; motionStatic?: string };
};

const EXPECTED: Record<OtpSourceKey, { shell: AuthShellPreset; preset: OtpPreset; channel: OtpChannel; proof: string; recovery: boolean; resend: boolean; masked: boolean; ambient: ResolvedOtpFixture["ambient"]["treatment"]; hold: boolean }> = {
  "two-factor-authentication-01": { shell: "centered-quick-entry", preset: "authenticator-access", channel: "authenticator", proof: "none", recovery: true, resend: false, masked: false, ambient: "outline", hold: false },
  "two-factor-authentication-02": { shell: "product-proof-split", preset: "authenticator-access", channel: "authenticator", proof: "dashboard", recovery: true, resend: false, masked: false, ambient: "proof-edge", hold: false },
  "two-factor-authentication-03": { shell: "graphic-trust-split", preset: "sms-reset", channel: "sms", proof: "trust-proof", recovery: true, resend: true, masked: true, ambient: "graphic-mark", hold: false },
  "two-factor-authentication-04": { shell: "trial-proof-split", preset: "sms-reset", channel: "sms", proof: "dashboard-and-badges", recovery: true, resend: true, masked: true, ambient: "none", hold: false },
  "two-factor-authentication-05": { shell: "centered-social-card", preset: "sms-account-verify", channel: "sms", proof: "none", recovery: false, resend: true, masked: true, ambient: "lines", hold: false },
  "two-factor-authentication-06": { shell: "ambient-trust-split", preset: "sms-reset", channel: "sms", proof: "trust-chips", recovery: false, resend: true, masked: true, ambient: "silk-photo", hold: false },
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
const local = (value: string, label: string, source: OtpSourceKey) => {
  if (!value.startsWith(`/demo/${source}/`) || value.includes("#") || /^(?:https?:)?\/\//i.test(value)) throw new Error(`${source} ${label} must be source-owned.`);
};

function resolveIdentity(fixture: OtpFixture) {
  if (fixture.identity.markId === null) return undefined;
  const mark = MARKS[fixture.identity.markId];
  if (!mark || mark.companyId !== fixture.identity.companyId || mark.name !== fixture.identity.name) throw new Error(`${fixture.sourceKey} identity drifted.`);
  return mark;
}

function resolveProof(fixture: OtpFixture, copy: Record<string, string>): ResolvedResetProof | undefined {
  const proof = fixture.proof;
  if (!proof) return undefined;
  const disclosure = { open: text(copy, proof.detailsOpenKey, "proof open", fixture.sourceKey), close: text(copy, proof.detailsCloseKey, "proof close", fixture.sourceKey) };
  if (proof.kind === "trust-proof") return { kind: proof.kind, title: text(copy, proof.titleKey, "trust title", fixture.sourceKey), body: text(copy, proof.bodyKey, "trust body", fixture.sourceKey), peopleHeading: text(copy, proof.peopleHeadingKey, "people heading", fixture.sourceKey), peopleBody: text(copy, proof.peopleBodyKey, "people body", fixture.sourceKey), aggregate: text(copy, proof.aggregateKey, "aggregate", fixture.sourceKey), markAlt: text(copy, proof.markAltKey, "trust mark", fixture.sourceKey), disclosure, people: proof.people.map((id) => ({ ...PEOPLE[id], alt: text(copy, `person_${id === "p_006" ? "anya" : id === "p_010" ? "chen" : "katarina"}_alt`, `${id} alt`, fixture.sourceKey) })) };
  if (proof.kind === "trust-chips") return { kind: proof.kind, title: text(copy, proof.titleKey, "trust title", fixture.sourceKey), body: text(copy, proof.bodyKey, "trust body", fixture.sourceKey), peopleHeading: text(copy, proof.peopleHeadingKey, "people heading", fixture.sourceKey), peopleBody: text(copy, proof.peopleBodyKey, "people body", fixture.sourceKey), aggregate: text(copy, proof.aggregateKey, "aggregate", fixture.sourceKey), markAlt: text(copy, proof.markAltKey, "trust mark", fixture.sourceKey), disclosure, people: proof.chips.map((chip) => ({ id: chip.id, name: text(copy, chip.labelKey, `${chip.id} label`, fixture.sourceKey), assetId: chip.id, initials: chip.initials, alt: text(copy, chip.labelKey, `${chip.id} alt`, fixture.sourceKey), status: "code" })) };
  if (!proof.codeOwned || proof.rasterized) throw new Error(`${fixture.sourceKey} violates D-M1.`);
  const common = { title: text(copy, proof.titleKey, "dashboard title", fixture.sourceKey), alt: text(copy, proof.altKey, "dashboard alt", fixture.sourceKey), fallback: { heading: text(copy, proof.fallbackHeadingKey, "fallback heading", fixture.sourceKey), body: text(copy, proof.fallbackBodyKey, "fallback body", fixture.sourceKey), retry: text(copy, proof.retryLabelKey, "fallback retry", fixture.sourceKey) }, disclosure };
  if (proof.kind === "dashboard") return { kind: proof.kind, proofId: proof.proofId, ...common };
  const badges = fixture.media.filter((item) => item.kind === "proof-badge");
  if (badges.length !== 3) throw new Error(`${fixture.sourceKey} requires three proof badges.`);
  return { kind: proof.kind, proofId: proof.proofId, ...common, editorial: { heading: text(copy, proof.editorialHeadingKey, "editorial heading", fixture.sourceKey), body: text(copy, proof.editorialBodyKey, "editorial body", fixture.sourceKey) }, badges: badges.map((item, index) => ({ id: item.id, markId: required(item.markId, "badge mark", fixture.sourceKey), label: text(copy, proof.badgeLabelKeys[index], `badge ${index + 1}`, fixture.sourceKey) })) };
}

export function resolveOtpFixture(fixture: OtpFixture, stress: OtpStress = "base"): ResolvedOtpFixture {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown OTP source ${fixture.sourceKey}.`);
  if (fixture.packet !== "two-factor-authentication-contract-v1" || fixture.owner !== "OtpUnit" || fixture.shellOwner !== "AuthShell") throw new Error(`${fixture.sourceKey} owner contract drifted.`);
  const copy = fixture.copy[stress];
  if (!copy || new Set(Object.values(fixture.copy).map((value) => Object.keys(value).sort().join("|"))).size !== 1) throw new Error(`${fixture.sourceKey} copy stress drifted.`);
  if (fixture.shellPreset !== expected.shell || fixture.otpPreset !== expected.preset || fixture.channel !== expected.channel || (fixture.proof?.kind ?? "none") !== expected.proof) throw new Error(`${fixture.sourceKey} closed mapping drifted.`);
  if (fixture.length !== 6 || fixture.commit.autoSubmit !== true || fixture.commit.method !== "post") throw new Error(`${fixture.sourceKey} native OTP contract drifted.`);
  if (Boolean(fixture.recovery) !== expected.recovery || Boolean(fixture.resend) !== expected.resend || Boolean(fixture.maskedTarget) !== expected.masked) throw new Error(`${fixture.sourceKey} action vector drifted.`);
  local(fixture.commit.action, "commit action", fixture.sourceKey);
  local(fixture.done.href, "done action", fixture.sourceKey);
  for (const action of fixture.shellActions) local(action.href, action.id, fixture.sourceKey);
  const mediaStatus = fixture.media.some((item) => item.status === "HOLD-INFRA") ? "hold" : "ready";
  if ((mediaStatus === "hold") !== expected.hold) throw new Error(`${fixture.sourceKey} localized media status drifted.`);
  const ambient = fixture.ambient;
  if (fixture.sourceKey === "two-factor-authentication-06" && (!ambient || ambient.kind !== "dark-wave" || ambient.assetId !== "register-06-dark-silk-v1" || ambient.status !== "ready" || ambient.decision !== "D-M38" || ambient.codeOwned !== true || ambient.rasterized !== false || ["avif","webp","jpg","src","srcset"].some((key) => key in ambient) || !fixture.media.some((item) => item.kind === "dark-wave" && item.assetId === "register-06-dark-silk-v1" && item.status === "ready" && item.decision === "D-M38" && item.codeOwned === true && item.rasterized === false && !["avif","webp","jpg","src","srcset"].some((key) => key in item)))) throw new Error(`${fixture.sourceKey} cannot substitute the D-M38 dark-wave seat.`);
  for (const item of fixture.media) if ((item.codeOwned || item.kind === "identity-chip") && item.rasterized !== false) throw new Error(`${fixture.sourceKey} code media drifted.`);
  const proof = resolveProof(fixture, copy);
  const photo = fixture.ambient ? { kind: fixture.ambient.kind, assetId: fixture.ambient.assetId, alt: text(copy, fixture.ambient.altKey, "photo alt", fixture.sourceKey), fallback: { heading: text(copy, fixture.ambient.fallbackHeadingKey, "photo fallback heading", fixture.sourceKey), body: text(copy, fixture.ambient.fallbackBodyKey, "photo fallback body", fixture.sourceKey), reducedData: text(copy, fixture.ambient.reducedDataKey, "reduced data", fixture.sourceKey) }, status: fixture.ambient.status } : undefined;
  const recovery = fixture.recovery ? { id: fixture.recovery.id, label: text(copy, fixture.recovery.labelKey, "recovery label", fixture.sourceKey), heading: text(copy, "recovery_heading", "recovery heading", fixture.sourceKey), body: text(copy, "recovery_body", "recovery body", fixture.sourceKey), codeLabel: text(copy, "recovery_code_label", "recovery code label", fixture.sourceKey), placeholder: text(copy, "recovery_code_placeholder", "recovery placeholder", fixture.sourceKey), submit: text(copy, "recovery_submit", "recovery submit", fixture.sourceKey), cancel: text(copy, "recovery_cancel", "recovery cancel", fixture.sourceKey), invalid: text(copy, "recovery_invalid", "recovery invalid", fixture.sourceKey) } : undefined;
  const resend = fixture.resend ? { id: fixture.resend.id, label: text(copy, fixture.resend.labelKey, "resend label", fixture.sourceKey), waitingLabel: text(copy, fixture.resend.waitingLabelKey, "resend waiting", fixture.sourceKey), availableLabel: text(copy, fixture.resend.availableLabelKey, "resend available", fixture.sourceKey), announcement: text(copy, fixture.resend.announcementKey, "resend announcement", fixture.sourceKey), cooldownSeconds: fixture.resend.cooldownSeconds } : undefined;
  return {
    sourceKey: fixture.sourceKey,
    shellPreset: fixture.shellPreset,
    otpPreset: fixture.otpPreset,
    channel: fixture.channel,
    activeStress: stress,
    length: fixture.length,
    maskedTarget: fixture.maskedTarget,
    identity: resolveIdentity(fixture),
    intro: { heading: text(copy, fixture.intro.headingKey, "intro heading", fixture.sourceKey), body: text(copy, fixture.intro.bodyKey, "intro body", fixture.sourceKey) },
    code: { label: text(copy, fixture.code.labelKey, "code label", fixture.sourceKey), requiredError: text(copy, fixture.code.requiredErrorKey, "required error", fixture.sourceKey), invalidError: text(copy, fixture.code.invalidErrorKey, "invalid error", fixture.sourceKey), expiredError: text(copy, fixture.code.expiredErrorKey, "expired error", fixture.sourceKey) },
    commit: { id: fixture.commit.id, label: text(copy, fixture.commit.labelKey, "commit label", fixture.sourceKey), autoSubmit: true, method: fixture.commit.method, action: fixture.commit.action },
    recovery,
    resend,
    done: { heading: text(copy, fixture.done.headingKey, "done heading", fixture.sourceKey), body: text(copy, fixture.done.bodyKey, "done body", fixture.sourceKey), action: text(copy, fixture.done.actionKey, "done action", fixture.sourceKey), href: fixture.done.href },
    shellActions: fixture.shellActions.map((action) => ({ id: action.id, role: action.role, label: text(copy, action.labelKey, `${action.id} label`, fixture.sourceKey), href: action.href })),
    proof,
    photo,
    ambient: { treatment: expected.ambient, motion: fixture.sourceKey === "two-factor-authentication-06" },
    mediaStatus,
    labels: { verifyingAnnouncement: text(copy, fixture.stateKeys.verifyingAnnouncementKey, "verifying announcement", fixture.sourceKey), errorAnnouncement: text(copy, fixture.stateKeys.errorAnnouncementKey, "error announcement", fixture.sourceKey), doneAnnouncement: text(copy, fixture.stateKeys.doneAnnouncementKey, "done announcement", fixture.sourceKey), formAria: text(copy, fixture.stateKeys.formAriaKey, "form aria", fixture.sourceKey), motionPause: fixture.ambient ? text(copy, fixture.ambient.motionPauseKey, "motion pause", fixture.sourceKey) : undefined, motionResume: fixture.ambient ? text(copy, fixture.ambient.motionResumeKey, "motion resume", fixture.sourceKey) : undefined, motionStatic: fixture.ambient ? text(copy, fixture.ambient.motionStaticKey, "motion static", fixture.sourceKey) : undefined },
  };
}

export function composeOtpAuthShellModel(otp: ResolvedOtpFixture, base: ResolvedAuthShellModel): ResolvedAuthShellModel {
  if (base.shellPreset !== otp.shellPreset) throw new Error(`${otp.sourceKey} shell base mismatch.`);
  let proof: ResolvedAuthProof | undefined;
  if (otp.proof?.kind === "dashboard") {
    if (base.proof?.kind !== "dashboard") throw new Error(`${otp.sourceKey} dashboard base missing.`);
    proof = { ...base.proof, proofId: otp.proof.proofId, title: otp.proof.title, alt: otp.proof.alt, fallback: { heading: otp.proof.fallback.heading, message: otp.proof.fallback.body, action: otp.proof.fallback.retry }, disclosure: otp.proof.disclosure };
  } else if (otp.proof?.kind === "dashboard-and-badges") {
    if (base.proof?.kind !== "editorial") throw new Error(`${otp.sourceKey} editorial base missing.`);
    const editorialBase = base.proof;
    proof = { ...editorialBase, proofId: otp.proof.proofId, title: otp.proof.title, alt: otp.proof.alt, heading: otp.proof.editorial.heading, body: otp.proof.editorial.body, fallback: { heading: otp.proof.fallback.heading, message: otp.proof.fallback.body, action: otp.proof.fallback.retry }, disclosure: otp.proof.disclosure, badges: otp.proof.badges.map((badge, index) => ({ ...editorialBase.badges[index]!, id: badge.id, label: badge.label, markId: badge.markId })) };
  } else if (otp.proof?.kind === "trust-proof" || otp.proof?.kind === "trust-chips") {
    proof = { kind: "trust", reassurance: { heading: otp.proof.title, body: otp.proof.body }, card: { heading: otp.proof.peopleHeading, body: otp.proof.peopleBody }, aggregateLabel: otp.proof.aggregate, disclosure: { ...otp.proof.disclosure, fallback: otp.proof.body }, people: otp.proof.people, mark: otp.identity ? { src: otp.identity.src, inverseSrc: otp.identity.inverseSrc, name: otp.identity.name } : undefined };
  } else if (base.proof) throw new Error(`${otp.sourceKey} cannot inherit unowned proof.`);
  const photo = otp.photo ? { ...(base.photo ?? { kind: "dark-wave" as const, assetId: otp.photo.assetId, focalPoint: { M: "50% 50%", TP: "50% 50%", TL: "50% 50%", DS: "50% 50%", DW: "50% 50%" }, status: "ready" as const }), kind: otp.photo.kind, assetId: otp.photo.assetId, alt: otp.photo.alt, fallback: otp.photo.fallback, status: otp.photo.status } : undefined;
  return { sourceKey: otp.sourceKey, shellPreset: otp.shellPreset, identity: otp.identity, intro: otp.intro, shellActions: otp.shellActions, proof, photo, ambient: otp.ambient, labels: { motionPause: otp.labels.motionPause, motionResume: otp.labels.motionResume, motionStatic: otp.labels.motionStatic } };
}
