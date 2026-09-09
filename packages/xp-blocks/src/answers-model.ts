export const ANSWER_SOURCE_KEYS = Array.from({ length: 19 }, (_, index) =>
  `faq-component-${String(index + 1).padStart(2, "0")}`,
) as AnswerSourceKey[];

export const ANSWER_PRESETS = [
  "plain-disclosure", "qualified-answer-wall", "framed-answer-wall", "category-chip-disclosure",
  "split-tone-answer-wall", "searchable-answer-wall", "dual-lane-disclosure", "category-rail-detail",
  "support-aside-disclosure", "masonry-answer-wall", "editorial-photo-disclosure", "resource-answer-rail",
  "category-tile-disclosure", "ui-proof-answers", "portrait-panel-disclosure", "active-answer-rail",
  "featured-answer-teaser", "dark-support-disclosure", "light-support-disclosure",
] as const;

export const ANSWER_FORM_LADDER = { M: "M", TP: "TP", TL: "TL", DS: "DS", DW: "DW" } as const;

export type AnswerSourceKey = `faq-component-${string}`;
export type AnswerPreset = (typeof ANSWER_PRESETS)[number];
export type AnswerComposition = "list" | "categorized" | "wall" | "support-split" | "media-split" | "guided-rail" | "proof-wall" | "teaser";
export type AnswerDeviceForm = keyof typeof ANSWER_FORM_LADDER;
export type AnswerStressKey = "short" | "longLocale" | "error" | "lastOpen" | "lastQuestion" | "twoOpen" | "categoryLast" | "answerLast" | "escapeFocus" | "searchFiltered" | "searchEmpty" | "next" | "last" | "proofLast" | "contextActionFocus" | "proofFallback" | "mediaFallback" | "selectedLast" | "bottom" | "promotionFocus" | "allOpen";
export type AnswerIcon = "briefcase" | "billing" | "book" | "location" | "support" | "settings" | "returns";

export type AnswerIntro = { eyebrow?: string; heading: string; description?: string };
export type AnswerCategory = { id: string; label: string; icon?: AnswerIcon };
export type AnswerRecord = { id: string; categoryId?: string; question: string; qualifier?: string; answer: string; priority: number; icon?: AnswerIcon; actionIds?: string[]; proofId?: string };
export type AnswerAction = { id: string; label: string; href: string; kind: "escape" | "resource" | "context" | "promotion"; external?: boolean };
export type AnswerMedia = { id: string; kind: "photo" | "art-3d"; alt: string; aspect: "4:3" | "3:2" | "16:9"; focalPoint?: { x: number; y: number } };
export type AnswerProof = { id: string; kind: "ui"; scene: "analytics" | "profile-editor" | "order-operations"; title: string };
export type AnswerAnnouncements = { resultCount: string; emptySearch: string; error: string; mediaError: string; proofError: string };
export type AnswerTextPatch = { targetType: "intro" | "category" | "answer" | "action" | "media" | "proof" | "announcement"; targetId: string; field: string; value: string };
export type AnswerErrorStress = AnswerAnnouncements & { failMediaIds: string[]; failProofIds: string[] };

export type AnswersFixtureCore = {
  schemaVersion: 1;
  owner: "Answers";
  sourceKey: AnswerSourceKey;
  preset: AnswerPreset;
  composition: AnswerComposition;
  intro: AnswerIntro;
  categories?: AnswerCategory[];
  answers: AnswerRecord[];
  actions: AnswerAction[];
  escapeHatchActionId: string;
  media?: AnswerMedia[];
  proofs?: AnswerProof[];
  behavior: { searchable: boolean; initialCategoryId?: string; initialAnswerId?: string; wideWall: boolean; compactAccess: "disclosure" | "guided-rail" | "teaser" };
  announcements: AnswerAnnouncements;
};
export type AnswersFixture = AnswersFixtureCore & { stress: { short: { textPatches: AnswerTextPatch[] }; longLocale: { textPatches: AnswerTextPatch[] }; error: AnswerErrorStress } };

export type AnswerMediaRecord = {
  slug: AnswerSourceKey;
  seatId: string;
  kind: "photo" | "art-3d";
  role: string;
  alt: string;
  disposition: "approved-reuse" | "deterministic-vector" | "missing-seat";
  status: "resolved" | "MISSING-SEAT";
  owner: "asset-library" | "code-owned-vector" | "unresolved";
  assetId?: string;
  publicBase?: string;
  src?: string;
  canonicalPath?: string;
  publicPath?: string;
  viewBox?: string;
  bytes?: number;
  sha256?: string;
  decisionId?: string;
  formats?: string[];
  widths?: number[];
  crops?: Partial<Record<AnswerDeviceForm, { aspectRatio: string; focalX: number; focalY: number; objectPosition: string }>>;
  substituteUsed?: boolean;
};
export type AnswersMediaMap = { schemaVersion: 1; records: AnswerMediaRecord[] };
export type ResolvedAnswersFixture = AnswersFixtureCore & {
  activeStress?: AnswerStressKey;
  mediaBySeatId: ReadonlyMap<string, AnswerMediaRecord>;
  failedMediaIds: ReadonlySet<string>;
  failedProofIds: ReadonlySet<string>;
  wideWallEligible: boolean;
};

type Expected = { preset: AnswerPreset; composition: AnswerComposition; answers: number; categories: number; actions: number; media: number; proofs: number; searchable: boolean; wideWall: boolean; compactAccess: AnswersFixtureCore["behavior"]["compactAccess"] };
const EXPECTED: Record<AnswerSourceKey, Expected> = {
  "faq-component-01": { preset:"plain-disclosure",composition:"list",answers:4,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-02": { preset:"qualified-answer-wall",composition:"wall",answers:6,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:true,compactAccess:"disclosure" },
  "faq-component-03": { preset:"framed-answer-wall",composition:"wall",answers:4,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:true,compactAccess:"disclosure" },
  "faq-component-04": { preset:"category-chip-disclosure",composition:"categorized",answers:25,categories:5,actions:1,media:0,proofs:0,searchable:true,wideWall:false,compactAccess:"disclosure" },
  "faq-component-05": { preset:"split-tone-answer-wall",composition:"wall",answers:6,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:true,compactAccess:"disclosure" },
  "faq-component-06": { preset:"searchable-answer-wall",composition:"wall",answers:6,categories:0,actions:1,media:0,proofs:0,searchable:true,wideWall:true,compactAccess:"disclosure" },
  "faq-component-07": { preset:"dual-lane-disclosure",composition:"list",answers:9,categories:0,actions:1,media:0,proofs:0,searchable:true,wideWall:false,compactAccess:"disclosure" },
  "faq-component-08": { preset:"category-rail-detail",composition:"categorized",answers:20,categories:4,actions:1,media:0,proofs:0,searchable:true,wideWall:false,compactAccess:"disclosure" },
  "faq-component-09": { preset:"support-aside-disclosure",composition:"support-split",answers:5,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-10": { preset:"masonry-answer-wall",composition:"wall",answers:9,categories:0,actions:1,media:0,proofs:0,searchable:true,wideWall:true,compactAccess:"disclosure" },
  "faq-component-11": { preset:"editorial-photo-disclosure",composition:"media-split",answers:4,categories:0,actions:1,media:1,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-12": { preset:"resource-answer-rail",composition:"guided-rail",answers:6,categories:0,actions:7,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"guided-rail" },
  "faq-component-13": { preset:"category-tile-disclosure",composition:"categorized",answers:20,categories:5,actions:1,media:0,proofs:0,searchable:true,wideWall:false,compactAccess:"disclosure" },
  "faq-component-14": { preset:"ui-proof-answers",composition:"proof-wall",answers:3,categories:0,actions:2,media:0,proofs:3,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-15": { preset:"portrait-panel-disclosure",composition:"media-split",answers:5,categories:0,actions:1,media:1,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-16": { preset:"active-answer-rail",composition:"guided-rail",answers:6,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"guided-rail" },
  "faq-component-17": { preset:"featured-answer-teaser",composition:"teaser",answers:2,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"teaser" },
  "faq-component-18": { preset:"dark-support-disclosure",composition:"support-split",answers:5,categories:0,actions:2,media:1,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
  "faq-component-19": { preset:"light-support-disclosure",composition:"support-split",answers:5,categories:0,actions:1,media:0,proofs:0,searchable:false,wideWall:false,compactAccess:"disclosure" },
};

const remote = (value: string) => /^(?:https?:)?\/\//i.test(value);
const clean = (value: string) => value.trim();
const assertText = (value: unknown, label: string, source: string) => { if (typeof value !== "string" || !clean(value)) throw new Error(`${source} requires fixture-owned ${label}.`); };
const assertUnique = (items: Array<{ id: string }>, label: string, source: string) => { if (new Set(items.map(({ id }) => id)).size !== items.length) throw new Error(`${source} repeats ${label} IDs.`); };

function coreOf(raw: AnswersFixture): AnswersFixtureCore {
  const { stress: _stress, ...core } = raw;
  return structuredClone(core);
}

function applyTextPatches(core: AnswersFixtureCore, patches: AnswerTextPatch[], source: string) {
  for (const patch of patches) {
    let target: Record<string, unknown> | undefined;
    if (patch.targetType === "intro") target = core.intro as Record<string, unknown>;
    else if (patch.targetType === "announcement") target = core.announcements as unknown as Record<string, unknown>;
    else {
      const collection = patch.targetType === "category" ? core.categories : patch.targetType === "answer" ? core.answers : patch.targetType === "action" ? core.actions : patch.targetType === "media" ? core.media : core.proofs;
      target = collection?.find(({ id }) => id === patch.targetId) as unknown as Record<string, unknown> | undefined;
    }
    if (!target || !(patch.field in target)) throw new Error(`${source} stress references unknown ${patch.targetType}/${patch.targetId}/${patch.field}.`);
    target[patch.field] = patch.value;
  }
}

function signature(core: AnswersFixtureCore) {
  return JSON.stringify({
    sourceKey: core.sourceKey, preset: core.preset, composition: core.composition,
    categories: (core.categories ?? []).map(({ id, icon }) => ({ id, icon })),
    answers: core.answers.map(({ id, categoryId, priority, icon, actionIds, proofId }) => ({ id, categoryId, priority, icon, actionIds, proofId })),
    actions: core.actions.map(({ id, href, kind, external }) => ({ id, href, kind, external })),
    escapeHatchActionId: core.escapeHatchActionId,
    media: (core.media ?? []).map(({ id, kind, aspect, focalPoint }) => ({ id, kind, aspect, focalPoint })),
    proofs: (core.proofs ?? []).map(({ id, kind, scene }) => ({ id, kind, scene })), behavior: core.behavior,
  });
}

function validateCore(core: AnswersFixtureCore) {
  const expected = EXPECTED[core.sourceKey];
  if (!expected || core.schemaVersion !== 1 || core.owner !== "Answers") throw new Error(`Unknown or invalid Answers source ${core.sourceKey}.`);
  const actual = [core.preset,core.composition,core.answers.length,(core.categories ?? []).length,core.actions.length,(core.media ?? []).length,(core.proofs ?? []).length,core.behavior.searchable,core.behavior.wideWall,core.behavior.compactAccess];
  const wanted = [expected.preset,expected.composition,expected.answers,expected.categories,expected.actions,expected.media,expected.proofs,expected.searchable,expected.wideWall,expected.compactAccess];
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${core.sourceKey} drifts from its closed Answers composition.`);
  assertText(core.intro.heading, "intro heading", core.sourceKey);
  for (const value of Object.values(core.announcements)) assertText(value, "announcement", core.sourceKey);
  const categories = core.categories ?? [];
  const media = core.media ?? [];
  const proofs = core.proofs ?? [];
  for (const collection of [categories, core.answers, core.actions, media, proofs]) assertUnique(collection, "structural", core.sourceKey);
  const categoryIds = new Set(categories.map(({ id }) => id));
  const answerIds = new Set(core.answers.map(({ id }) => id));
  const actionIds = new Set(core.actions.map(({ id }) => id));
  const proofIds = new Set(proofs.map(({ id }) => id));
  if (core.actions.filter(({ kind }) => kind === "escape").length !== 1 || !actionIds.has(core.escapeHatchActionId) || core.actions.find(({ id }) => id === core.escapeHatchActionId)?.kind !== "escape") throw new Error(`${core.sourceKey} requires exactly one terminal escape action.`);
  if (core.behavior.initialCategoryId && !categoryIds.has(core.behavior.initialCategoryId)) throw new Error(`${core.sourceKey} initial category is unresolved.`);
  if (core.behavior.initialAnswerId && !answerIds.has(core.behavior.initialAnswerId)) throw new Error(`${core.sourceKey} initial answer is unresolved.`);
  for (const answer of core.answers) {
    assertText(answer.question, `${answer.id} question`, core.sourceKey);
    assertText(answer.answer, `${answer.id} answer`, core.sourceKey);
    if (answer.categoryId && !categoryIds.has(answer.categoryId)) throw new Error(`${core.sourceKey}/${answer.id} references an unknown category.`);
    for (const actionId of answer.actionIds ?? []) if (!actionIds.has(actionId) || actionId === core.escapeHatchActionId) throw new Error(`${core.sourceKey}/${answer.id} references an invalid owned action.`);
    if (answer.proofId && !proofIds.has(answer.proofId)) throw new Error(`${core.sourceKey}/${answer.id} references an unknown proof.`);
  }
  for (const action of core.actions) if (!action.href.startsWith("/demo/") || remote(action.href)) throw new Error(`${core.sourceKey}/${action.id} requires a safe local demo route.`);
  if (proofs.some(({ kind }) => kind !== "ui")) throw new Error(`${core.sourceKey} accepts only typed live UI proofs.`);
}

function resolveMedia(core: AnswersFixtureCore, mediaMap: AnswersMediaMap) {
  if (mediaMap.schemaVersion !== 1) throw new Error("Answers media map requires schema version 1.");
  const result = new Map<string, AnswerMediaRecord>();
  const seatMap: Record<string, string> = { "faq-11-media-01":"faq11-editorial-photo", "faq-15-media-01":"faq15-support-portrait", "faq-18-media-01":"faq18-faceted-support-art" };
  for (const seat of core.media ?? []) {
    const record = mediaMap.records.find(({ slug, seatId, kind }) => slug === core.sourceKey && seatId === seatMap[seat.id] && kind === seat.kind);
    if (!record) throw new Error(`${core.sourceKey}/${seat.id} has no exact media audit record.`);
    if (record.status === "resolved") {
      const approvedPhoto = record.disposition === "approved-reuse" && !!record.publicBase && !remote(record.publicBase);
      const originalVector = core.sourceKey === "faq-component-18" && seat.kind === "art-3d" && record.disposition === "deterministic-vector" && record.owner === "code-owned-vector" && record.src === "/media/faq-component-18-faceted-support-artifact.svg" && record.canonicalPath === "assets-library/vectors/faq-component/faq-component-18-faceted-support-artifact.svg" && record.publicPath === "apps/preview/public/media/faq-component-18-faceted-support-artifact.svg" && record.viewBox === "0 0 640 480" && !!record.sha256 && record.decisionId === "D-M35" && !record.publicBase && !record.substituteUsed;
      if (!approvedPhoto && !originalVector) throw new Error(`${core.sourceKey}/${seat.id} has no safe local original media.`);
    } else if (core.sourceKey !== "faq-component-18" || seat.kind !== "art-3d" || record.disposition !== "missing-seat" || record.publicBase || record.substituteUsed) {
      throw new Error(`${core.sourceKey}/${seat.id} cannot use an unresolved or substituted media seat.`);
    }
    result.set(seat.id, record);
  }
  return result;
}

export function resolveAnswersFixture(raw: AnswersFixture, mediaMap: AnswersMediaMap, stress?: AnswerStressKey): ResolvedAnswersFixture {
  const baseline = coreOf(raw);
  const baselineSignature = signature(baseline);
  const core = coreOf(raw);
  if (stress === "short" || stress === "longLocale") applyTextPatches(core, raw.stress[stress].textPatches, core.sourceKey);
  if (stress === "error") core.announcements = { resultCount:raw.stress.error.resultCount,emptySearch:raw.stress.error.emptySearch,error:raw.stress.error.error,mediaError:raw.stress.error.mediaError,proofError:raw.stress.error.proofError };
  if ((stress === "short" || stress === "longLocale") && signature(core) !== baselineSignature) throw new Error(`${core.sourceKey}/${stress} mutates structure.`);
  validateCore(core);
  const mediaBySeatId = resolveMedia(core, mediaMap);
  const failedMediaIds = new Set(stress === "error" ? raw.stress.error.failMediaIds : stress === "mediaFallback" ? (core.media ?? []).map(({ id }) => id) : []);
  const failedProofIds = new Set(stress === "error" ? raw.stress.error.failProofIds : stress === "proofFallback" ? (core.proofs ?? []).map(({ id }) => id) : []);
  for (const id of failedMediaIds) if (!(core.media ?? []).some((seat) => seat.id === id)) throw new Error(`${core.sourceKey} error stress references unknown media.`);
  for (const id of failedProofIds) if (!(core.proofs ?? []).some((proof) => proof.id === id)) throw new Error(`${core.sourceKey} error stress references unknown proof.`);
  return { ...core, activeStress: stress, mediaBySeatId, failedMediaIds, failedProofIds, wideWallEligible: core.behavior.wideWall && core.answers.every(({ answer }) => answer.length <= 160) };
}

export function answersStructuralSignature(core: AnswersFixtureCore) { return signature(core); }
