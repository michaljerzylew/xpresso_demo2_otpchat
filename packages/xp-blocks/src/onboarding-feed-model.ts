export const ONBOARDING_FEED_SOURCE_KEYS = [
  "onboarding-feed-01",
  "onboarding-feed-02",
  "onboarding-feed-03",
  "onboarding-feed-04",
  "onboarding-feed-05",
] as const;

export type OnboardingFeedSourceKey = (typeof ONBOARDING_FEED_SOURCE_KEYS)[number];
export type OnboardingCopyMode = "base" | "short" | "longLocale";
export type SetupChecklistPreset = "guided-compact" | "guided-task-overlays" | "status-timeline" | "status-tabs";
export type OnboardingPreset = SetupChecklistPreset | "onboarding-profile";
export type CopyBook = Record<OnboardingCopyMode, Record<string, string>>;
export type CopyRef = { id: string; labelKey: string; href?: `/demo/${string}`; kind?: string };

export type OnboardingControl = {
  id: string;
  type: "text" | "email" | "tel" | "number" | "date" | "password" | "textarea" | "select" | "checkbox" | "switch" | "image-upload";
  labelKey: string;
  placeholderKey?: string;
  helpKey?: string;
  required?: boolean;
  options?: { id: string; labelKey: string }[];
  upload?: { maxFiles: 1; maxBytes: number; accept: string[]; chooseKey: string; removeKey: string; previewKey: string; typeErrorKey: string; sizeErrorKey: string };
};

export type OnboardingStep = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  controls: OnboardingControl[];
  mobileChunks: { id: string; controlIds: string[]; maxMobileControls: number }[];
  actions: { id: string; kind: "back" | "next" | "complete"; labelKey: string }[];
};

export type GuidedTask = {
  kind: "account" | "subscription" | "referral" | "terms";
  fields?: OnboardingControl[];
  controls?: OnboardingControl[];
  policyRoutes?: CopyRef[];
  alternateIdentityAction?: CopyRef;
  primaryAction: CopyRef;
  cancelAction?: CopyRef;
  facts?: { id: string; labelKey: string; valueKey: string }[];
  fullTermsRoute?: CopyRef;
  peopleMediaIds?: string[];
  representedPeople?: number;
};

export type GuidedItem = {
  id: string;
  titleKey: string;
  bodyKey: string;
  state: "available" | "locked";
  action: CopyRef;
  task?: GuidedTask;
};

export type StatusItem = { id: string; titleKey: string; bodyKey: string; timeKey: string; state: "complete" | "running" | "pending" };
export type MediaRef = { id: string; role: string; ownerName?: string; altKey: string; reuseGroupId?: string; codeOwned?: boolean };

export type OnboardingFeedFixture = {
  schemaVersion: 1;
  sourceKey: OnboardingFeedSourceKey;
  owner: "WizardShell" | "SetupChecklist";
  preset: OnboardingPreset;
  titleKey?: string;
  descriptionKey?: string;
  copy: CopyBook;
  stateKeys: Record<string, string>;
  media: MediaRef[];
  footerActions?: CopyRef[];
  guidedItems?: GuidedItem[];
  statusItems?: StatusItem[];
  views?: { id: string; labelKey: string }[];
  details?: {
    generalFacts: { id: string; labelKey: string; valueKey: string }[];
    peopleMediaIds: string[];
    representedPeople: number;
    access: { labelKey: string; currentValue: string; currentValueKey: string; disabled: boolean; disabledReasonKey: string; options: { id: string; labelKey: string }[] };
    action: CopyRef;
  };
  support?: { titleKey: string; bodyKey: string; route: CopyRef };
  contextOrder?: string[];
  navigationPolicy?: "direct";
  stepSelectors?: { id: string; labelKey: string }[];
  steps?: OnboardingStep[];
};

export type OnboardingMediaMap = {
  schemaVersion: "1.0";
  status: "PASS";
  assignments: Record<OnboardingFeedSourceKey, { id: string; kind: string; personId?: string; owner?: string; reuseGroupId?: string }[]>;
  people: Record<string, { assetId: string; name: string; role: string; publicBase: string }>;
};

export type ResolvedOnboardingMedia = MediaRef & { ownerName: string; src: string; roleName: string };
export type ResolvedOnboardingFixture = OnboardingFeedFixture & {
  activeCopyMode: OnboardingCopyMode;
  strings: Record<string, string>;
  resolvedMedia: ResolvedOnboardingMedia[];
};

const expected = {
  "onboarding-feed-01": { owner: "SetupChecklist", preset: "guided-compact" },
  "onboarding-feed-02": { owner: "WizardShell", preset: "onboarding-profile" },
  "onboarding-feed-03": { owner: "SetupChecklist", preset: "guided-task-overlays" },
  "onboarding-feed-04": { owner: "SetupChecklist", preset: "status-timeline" },
  "onboarding-feed-05": { owner: "SetupChecklist", preset: "status-tabs" },
} as const;

function exact(actual: unknown[], wanted: unknown[], label: string) {
  if (actual.join("/") !== wanted.join("/")) throw new Error(`onboarding-feed invalid ${label}: ${actual.join("/")}`);
}

function requireCopy(copy: Record<string, string>, keys: (string | undefined)[], source: string) {
  for (const key of keys) if (key && !copy[key]?.trim()) throw new Error(`${source} misses copy key ${key}.`);
}

function validateRoutes(fixture: OnboardingFeedFixture) {
  const serialized = JSON.stringify(fixture);
  for (const href of serialized.match(/\/demo\/[A-Za-z0-9/_-]+/g) ?? []) {
    if (!href.startsWith("/demo/")) throw new Error(`${fixture.sourceKey} has an unsafe route.`);
  }
  if (/https?:\/\/(?![a-z0-9.-]+\.example)/i.test(serialized)) throw new Error(`${fixture.sourceKey} contains a non-example remote URL.`);
}

function validateCardinality(fixture: OnboardingFeedFixture) {
  if (fixture.sourceKey === "onboarding-feed-01") {
    exact(fixture.guidedItems?.map(({ id }) => id) ?? [], ["profile", "preferences", "review"], "source01 ordered items");
    if (fixture.guidedItems?.filter(({ action }) => action).length !== 3 || fixture.footerActions?.length !== 2) throw new Error("onboarding-feed-01 requires 3 task actions and 2 footer actions.");
    exact(fixture.guidedItems?.map(({ state }) => state) ?? [], ["available", "locked", "locked"], "source01 initial states");
  }
  if (fixture.sourceKey === "onboarding-feed-02") {
    if (fixture.navigationPolicy !== "direct") throw new Error("onboarding-feed-02 requires direct navigation.");
    exact(fixture.steps?.map(({ id }) => id) ?? [], ["personal", "goals", "workspace", "notifications", "complete"], "source02 steps");
    exact(fixture.steps?.map(({ controls }) => controls.length) ?? [], [12, 16, 5, 8, 0], "source02 controls");
    exact(fixture.steps?.map(({ mobileChunks }) => mobileChunks.map(({ controlIds }) => controlIds.length).join("+")) ?? [], ["6+6", "6+5+5", "5", "4+4", ""], "source02 chunks");
    if ((fixture.steps ?? []).flatMap(({ controls }) => controls).length !== 41 || fixture.stepSelectors?.length !== 5) throw new Error("onboarding-feed-02 requires 41 controls and five selectors.");
    if ((fixture.steps ?? []).flatMap(({ actions }) => actions).some(({ kind }) => !["back", "next", "complete"].includes(kind))) throw new Error("onboarding-feed-02 contains a forbidden action.");
    const upload = fixture.steps?.[2]?.controls.find(({ type }) => type === "image-upload")?.upload;
    if (!upload || upload.maxFiles !== 1 || upload.maxBytes !== 1_048_576 || upload.accept.join("/") !== "image/jpeg/image/png/image/webp") throw new Error("onboarding-feed-02 requires the bounded image upload.");
    exact(fixture.contextOrder ?? [], ["progress", "title", "description", "controls", "actions"], "source02 context order");
  }
  if (fixture.sourceKey === "onboarding-feed-03") {
    const tasks = fixture.guidedItems?.map(({ task }) => task).filter(Boolean) as GuidedTask[];
    exact(tasks.map(({ kind }) => kind), ["account", "subscription", "referral", "terms"], "source03 tasks");
    exact(tasks.map((task) => (task.fields ?? task.controls ?? []).length), [5, 1, 2, 0], "source03 overlay controls");
    if (tasks[0]?.policyRoutes?.length !== 2 || !tasks[0]?.alternateIdentityAction || tasks[2]?.peopleMediaIds?.length !== 3 || tasks[2]?.representedPeople !== 13 || tasks[3]?.facts?.length !== 6 || !fixture.support || fixture.footerActions?.length !== 2) throw new Error("onboarding-feed-03 inventory is incomplete.");
  }
  if (fixture.sourceKey === "onboarding-feed-04" || fixture.sourceKey === "onboarding-feed-05") {
    const counts = ["complete", "running", "pending"].map((state) => fixture.statusItems?.filter((item) => item.state === state).length ?? 0);
    exact(counts, [3, 1, 1], `${fixture.sourceKey} status counts`);
  }
  if (fixture.sourceKey === "onboarding-feed-05") {
    if (fixture.views?.length !== 2 || fixture.details?.generalFacts.length !== 4 || fixture.details.peopleMediaIds.length !== 3 || fixture.details.representedPeople !== 3 || fixture.details.access.disabled !== true || fixture.details.access.currentValue !== "private" || fixture.details.access.options.length !== 3 || fixture.footerActions?.length !== 1) throw new Error("onboarding-feed-05 details inventory is incomplete.");
  }
}

function resolveMedia(fixture: OnboardingFeedFixture, map: OnboardingMediaMap) {
  const assignments = map.assignments[fixture.sourceKey];
  return fixture.media.filter((reference) => !reference.codeOwned).map((reference) => {
    if (!reference.ownerName) throw new Error(`${fixture.sourceKey} has an unnamed portrait.`);
    const assignment = assignments.find((item) => item.personId && map.people[item.personId]?.name === reference.ownerName);
    if (!assignment?.personId) throw new Error(`${fixture.sourceKey} cannot resolve ${reference.ownerName}.`);
    const person = map.people[assignment.personId];
    if (!person.publicBase.startsWith("/media/")) throw new Error(`${fixture.sourceKey} media must stay local.`);
    if (reference.reuseGroupId && assignment.reuseGroupId !== reference.reuseGroupId) throw new Error(`${fixture.sourceKey} media reuse group differs.`);
    return { ...reference, ownerName: reference.ownerName, src: `${person.publicBase}.webp`, roleName: person.role };
  });
}

export function resolveOnboardingFeedFixture(fixture: OnboardingFeedFixture, map: OnboardingMediaMap, copyMode: OnboardingCopyMode = "base"): ResolvedOnboardingFixture {
  const rule = expected[fixture.sourceKey];
  if (fixture.schemaVersion !== 1 || fixture.owner !== rule.owner || fixture.preset !== rule.preset) throw new Error(`${fixture.sourceKey} differs from its closed owner/preset mapping.`);
  if (map.schemaVersion !== "1.0" || map.status !== "PASS" || ONBOARDING_FEED_SOURCE_KEYS.some((source) => !Array.isArray(map.assignments[source]))) throw new Error("Onboarding Feed media map is not complete.");
  exact(Object.keys(fixture.copy), ["base", "short", "longLocale"], `${fixture.sourceKey} copy modes`);
  exact(Object.keys(fixture.copy.base), Object.keys(fixture.copy.short), `${fixture.sourceKey} short parity`);
  exact(Object.keys(fixture.copy.base), Object.keys(fixture.copy.longLocale), `${fixture.sourceKey} long parity`);
  const strings = fixture.copy[copyMode];
  requireCopy(strings, [fixture.titleKey, fixture.descriptionKey, ...Object.values(fixture.stateKeys)], fixture.sourceKey);
  validateRoutes(fixture);
  validateCardinality(fixture);
  return { ...fixture, activeCopyMode: copyMode, strings, resolvedMedia: resolveMedia(fixture, map) };
}

export type OnboardingImplementationProbe = {
  publicOwners: string[];
  sourceAdapters: number;
  oneStateOwner: boolean;
  hiddenTwins: boolean;
  viewportBranching: boolean;
  forms: string[];
  slots: string[];
  contextBeforeControls: boolean;
  jsOffRoutes: boolean;
};

export function validateOnboardingImplementationProbe(probe: OnboardingImplementationProbe) {
  exact(probe.publicOwners, ["WizardShell", "SetupChecklist"], "public owners");
  exact(probe.forms, ["M", "TP", "TL", "DS", "DW"], "native forms");
  exact(probe.slots, ["S1", "S2", "S3", "S4", "S5", "S6"], "slot ladder");
  if (probe.sourceAdapters !== 5 || !probe.oneStateOwner || probe.hiddenTwins || probe.viewportBranching || !probe.contextBeforeControls || !probe.jsOffRoutes) throw new Error("onboarding-feed implementation probe failed.");
  return true;
}
