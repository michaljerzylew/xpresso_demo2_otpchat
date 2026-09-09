export const STAGE_SOURCE_KEYS = Array.from({ length: 41 }, (_, index) =>
  `hero-section-${String(index + 1).padStart(2, "0")}`,
) as StageSourceKey[];

const STAGE_FORMS = ["M", "TP", "TL", "DS", "DW"] as const;
const RASTER_ROLES = new Set(["photo", "portrait", "product", "device", "poster", "avatar", "three-d"]);
const VECTOR_ROLES = new Set(["mark", "illustration"]);

export type StageSourceKey = `hero-section-${
  | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10"
  | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20"
  | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28" | "29" | "30"
  | "31" | "32" | "33" | "34" | "35" | "36" | "37" | "38" | "39" | "40" | "41"}`;

type StagePreset =
  | "gallery-strip" | "search-scene" | "metric-montage" | "portrait-split"
  | "device-showcase" | "trust-stage" | "product-stage" | "content-rail"
  | "system-canvas" | "immersive-scene";
type StageComposition = "centered" | "split" | "scene";
type StageTone = "light" | "dark" | "media-overlay";
type StageFoldMode = "launch" | "launch-with-continuation" | "scene-step";
type StageFormKey = typeof STAGE_FORMS[number];
type StageAction = {
  id: string;
  label: string;
  kind: "link" | "submit" | "copy" | "select" | "increment" | "decrement" | "purchase" | "play" | "pause" | "next" | "previous" | "scroll";
  emphasis: "primary" | "secondary" | "quiet";
  href?: string;
  disabled?: boolean;
};
type StageMediaSeat = {
  id: string;
  assetKey?: string;
  role: "photo" | "portrait" | "product" | "device" | "poster" | "avatar" | "mark" | "illustration" | "three-d" | "system-ui" | "chart" | "icon";
  presentation: "backdrop" | "contained" | "bleed" | "peek" | "thumb" | "card" | "cutout" | "mark" | "canvas";
  aspect: "1:1" | "4:3" | "3:2" | "3:4" | "16:9" | "9:16" | "free";
  alt: string;
  focal?: { x: number; y: number };
  runtimeOwner?: "stage-css" | "metric-tile" | "system-canvas";
};
type StageAttachment =
  | { kind: "none" }
  | { kind: "capture"; fieldId: string; inputMode: "email" | "prompt" | "search"; submitActionId: string }
  | { kind: "search"; tabIds?: string[]; fieldIds: string[]; submitActionId: string }
  | { kind: "copy-command"; valueId: string; copyActionId: string }
  | { kind: "choice-gallery"; choiceIds: string[]; selectedId: string; commitActionId?: string }
  | { kind: "commerce"; buyBoxFixtureId: string }
  | { kind: "rail"; itemIds: string[]; labelledBy: string; pauseActionId?: string }
  | { kind: "tabs-canvas"; tabIds: string[]; selectedId: string }
  | { kind: "demo-chat"; fieldId: string; sendActionId: string; messageIds: string[] };
type StageContentItem = { id: string; label: string; title?: string; body?: string; role?: string; value?: string };
type StageContent = {
  fields: StageContentItem[];
  tabs: StageContentItem[];
  choices: StageContentItem[];
  proofItems: StageContentItem[];
  continuationItems: StageContentItem[];
  ornamentItems: StageContentItem[];
  messages: StageContentItem[];
  stats: StageContentItem[];
  specs: StageContentItem[];
  status?: string;
};

export type StageFixture = {
  schemaVersion: 1;
  version: 1;
  sourceKey: StageSourceKey;
  preset: StagePreset;
  composition: StageComposition;
  tone: StageTone;
  foldMode: StageFoldMode;
  claim: {
    eyebrow?: string;
    headline: { standard: string; compact: string; long: string };
    lede?: { standard: string; compact: string; long: string };
  };
  actions: StageAction[];
  actionIds: string[];
  proof?: { kind: "rating" | "avatars" | "marks" | "stats" | "testimonial" | "features"; itemIds: string[]; relocateKey?: string };
  media: StageMediaSeat[];
  attachment: StageAttachment;
  continuation?: { kind: "benefits" | "cards" | "rail" | "canvas" | "specs"; itemIds: string[] };
  ornaments: { mode: "full-chip-static"; itemIds: string[] };
  forms: Record<StageFormKey, { composition: StageComposition; media: "backdrop" | "peek" | "band" | "contained" | "bleed" | "canvas" | "cutout"; proof: "inline" | "rail" | "continuation" }>;
  stresses: Record<string, Partial<StageFixture>>;
  content: StageContent;
};

export type StageMediaAsset = {
  assetKey: string;
  src: string;
  darkSrc?: string;
  posterSrc?: string;
  alt: string;
  width: number;
  height: number;
  provenanceId: string;
};

type ResolvedStageMedia = StageMediaSeat & {
  status: "ready" | "hold" | "vector" | "code";
  asset?: StageMediaAsset;
  vectorPath?: string;
};
export type ResolvedStageFixture = Omit<StageFixture, "media"> & {
  media: ResolvedStageMedia[];
  mediaById: ReadonlyMap<string, ResolvedStageMedia>;
  activeStress?: string;
  heldSeatIds: string[];
  terminalEligible: boolean;
};

type Requirement = { preset: StagePreset; composition: StageComposition; foldMode: StageFoldMode; actions: number; media: number; proof: number; continuation: number; attachment: StageAttachment["kind"] };
const REQUIREMENTS: Record<StageSourceKey, Requirement> = {
  "hero-section-01": { preset:"gallery-strip",composition:"centered",foldMode:"launch",actions:1,media:7,proof:0,continuation:0,attachment:"none" },
  "hero-section-02": { preset:"search-scene",composition:"scene",foldMode:"launch-with-continuation",actions:1,media:1,proof:0,continuation:0,attachment:"search" },
  "hero-section-03": { preset:"metric-montage",composition:"split",foldMode:"launch-with-continuation",actions:2,media:9,proof:3,continuation:0,attachment:"none" },
  "hero-section-04": { preset:"portrait-split",composition:"split",foldMode:"launch",actions:1,media:1,proof:3,continuation:0,attachment:"none" },
  "hero-section-05": { preset:"device-showcase",composition:"split",foldMode:"launch",actions:2,media:2,proof:1,continuation:0,attachment:"none" },
  "hero-section-06": { preset:"device-showcase",composition:"centered",foldMode:"launch",actions:2,media:1,proof:4,continuation:0,attachment:"none" },
  "hero-section-07": { preset:"device-showcase",composition:"centered",foldMode:"launch-with-continuation",actions:2,media:2,proof:1,continuation:3,attachment:"none" },
  "hero-section-08": { preset:"trust-stage",composition:"centered",foldMode:"launch",actions:1,media:7,proof:0,continuation:0,attachment:"capture" },
  "hero-section-09": { preset:"system-canvas",composition:"split",foldMode:"launch",actions:2,media:5,proof:0,continuation:0,attachment:"copy-command" },
  "hero-section-10": { preset:"metric-montage",composition:"split",foldMode:"launch",actions:2,media:1,proof:4,continuation:0,attachment:"none" },
  "hero-section-11": { preset:"system-canvas",composition:"centered",foldMode:"launch-with-continuation",actions:2,media:1,proof:0,continuation:1,attachment:"none" },
  "hero-section-12": { preset:"portrait-split",composition:"split",foldMode:"launch",actions:2,media:1,proof:0,continuation:0,attachment:"none" },
  "hero-section-13": { preset:"portrait-split",composition:"split",foldMode:"launch-with-continuation",actions:1,media:2,proof:2,continuation:3,attachment:"none" },
  "hero-section-14": { preset:"immersive-scene",composition:"scene",foldMode:"scene-step",actions:1,media:1,proof:6,continuation:0,attachment:"capture" },
  "hero-section-15": { preset:"product-stage",composition:"split",foldMode:"launch-with-continuation",actions:1,media:6,proof:0,continuation:3,attachment:"choice-gallery" },
  "hero-section-16": { preset:"metric-montage",composition:"centered",foldMode:"launch",actions:1,media:3,proof:6,continuation:2,attachment:"capture" },
  "hero-section-17": { preset:"product-stage",composition:"centered",foldMode:"launch-with-continuation",actions:0,media:2,proof:0,continuation:3,attachment:"none" },
  "hero-section-18": { preset:"search-scene",composition:"scene",foldMode:"launch-with-continuation",actions:1,media:1,proof:0,continuation:0,attachment:"search" },
  "hero-section-19": { preset:"product-stage",composition:"scene",foldMode:"launch-with-continuation",actions:3,media:4,proof:0,continuation:3,attachment:"commerce" },
  "hero-section-20": { preset:"device-showcase",composition:"scene",foldMode:"launch",actions:1,media:3,proof:0,continuation:0,attachment:"capture" },
  "hero-section-21": { preset:"content-rail",composition:"split",foldMode:"launch-with-continuation",actions:1,media:7,proof:3,continuation:3,attachment:"none" },
  "hero-section-22": { preset:"search-scene",composition:"split",foldMode:"launch-with-continuation",actions:1,media:1,proof:0,continuation:0,attachment:"search" },
  "hero-section-23": { preset:"metric-montage",composition:"split",foldMode:"launch-with-continuation",actions:2,media:13,proof:4,continuation:3,attachment:"none" },
  "hero-section-24": { preset:"metric-montage",composition:"split",foldMode:"launch-with-continuation",actions:2,media:10,proof:6,continuation:3,attachment:"none" },
  "hero-section-25": { preset:"system-canvas",composition:"centered",foldMode:"launch",actions:2,media:6,proof:0,continuation:0,attachment:"rail" },
  "hero-section-26": { preset:"metric-montage",composition:"centered",foldMode:"launch",actions:2,media:4,proof:4,continuation:0,attachment:"none" },
  "hero-section-27": { preset:"trust-stage",composition:"centered",foldMode:"launch",actions:2,media:8,proof:4,continuation:0,attachment:"none" },
  "hero-section-28": { preset:"system-canvas",composition:"centered",foldMode:"launch-with-continuation",actions:1,media:1,proof:3,continuation:1,attachment:"none" },
  "hero-section-29": { preset:"device-showcase",composition:"centered",foldMode:"launch",actions:1,media:4,proof:0,continuation:0,attachment:"capture" },
  "hero-section-30": { preset:"content-rail",composition:"centered",foldMode:"launch-with-continuation",actions:1,media:7,proof:3,continuation:7,attachment:"search" },
  "hero-section-31": { preset:"metric-montage",composition:"split",foldMode:"launch-with-continuation",actions:2,media:2,proof:6,continuation:3,attachment:"none" },
  "hero-section-32": { preset:"content-rail",composition:"split",foldMode:"launch-with-continuation",actions:3,media:5,proof:4,continuation:4,attachment:"none" },
  "hero-section-33": { preset:"system-canvas",composition:"split",foldMode:"launch-with-continuation",actions:2,media:2,proof:1,continuation:0,attachment:"none" },
  "hero-section-34": { preset:"system-canvas",composition:"scene",foldMode:"launch-with-continuation",actions:3,media:1,proof:0,continuation:0,attachment:"demo-chat" },
  "hero-section-35": { preset:"content-rail",composition:"centered",foldMode:"launch-with-continuation",actions:3,media:2,proof:0,continuation:2,attachment:"capture" },
  "hero-section-36": { preset:"system-canvas",composition:"split",foldMode:"launch-with-continuation",actions:1,media:4,proof:4,continuation:5,attachment:"none" },
  "hero-section-37": { preset:"metric-montage",composition:"centered",foldMode:"launch",actions:2,media:5,proof:5,continuation:0,attachment:"none" },
  "hero-section-38": { preset:"product-stage",composition:"scene",foldMode:"scene-step",actions:2,media:2,proof:0,continuation:2,attachment:"none" },
  "hero-section-39": { preset:"system-canvas",composition:"centered",foldMode:"scene-step",actions:1,media:1,proof:0,continuation:0,attachment:"none" },
  "hero-section-40": { preset:"system-canvas",composition:"centered",foldMode:"scene-step",actions:2,media:3,proof:4,continuation:0,attachment:"tabs-canvas" },
  "hero-section-41": { preset:"product-stage",composition:"split",foldMode:"launch-with-continuation",actions:3,media:6,proof:1,continuation:0,attachment:"choice-gallery" },
};

const nonempty = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};
const sameSet = (left: string[], right: string[]) => left.length === right.length && left.every((value) => right.includes(value));
const localSource = (value: string) => value.startsWith("/") && !value.startsWith("//") && !/^https?:/i.test(value);

function mergePatch(base: unknown, patch: unknown, source: string): unknown {
  if (patch === undefined) return structuredClone(base);
  if (Array.isArray(base) && Array.isArray(patch)) {
    const baseItems = base as Array<Record<string, unknown>>;
    const patchItems = patch as Array<Record<string, unknown>>;
    if (!baseItems.every((item) => typeof item?.id === "string") || !patchItems.every((item) => typeof item?.id === "string")) return structuredClone(patch);
    const patches = new Map(patchItems.map((item) => [item.id as string, item]));
    for (const id of patches.keys()) if (!baseItems.some((item) => item.id === id)) throw new Error(`${source} stress references unknown ID ${id}.`);
    return baseItems.map((item) => patches.has(item.id as string) ? mergePatch(item, patches.get(item.id as string), source) : structuredClone(item));
  }
  if (base && patch && typeof base === "object" && typeof patch === "object") {
    const output = structuredClone(base) as Record<string, unknown>;
    for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
      if (key === "stresses") throw new Error(`${source} stress cannot replace the stress registry.`);
      output[key] = mergePatch(output[key], value, source);
    }
    return output;
  }
  return structuredClone(patch);
}

function referencedAttachmentIds(attachment: StageAttachment) {
  switch (attachment.kind) {
    case "capture": return [attachment.fieldId, attachment.submitActionId];
    case "search": return [...(attachment.tabIds ?? []), ...attachment.fieldIds, attachment.submitActionId];
    case "copy-command": return [attachment.valueId, attachment.copyActionId];
    case "choice-gallery": return [...attachment.choiceIds, attachment.selectedId, ...(attachment.commitActionId ? [attachment.commitActionId] : [])];
    case "rail": return [...attachment.itemIds, ...(attachment.pauseActionId ? [attachment.pauseActionId] : [])];
    case "tabs-canvas": return [...attachment.tabIds, attachment.selectedId];
    case "demo-chat": return [attachment.fieldId, attachment.sendActionId, ...attachment.messageIds];
    case "commerce": return [attachment.buyBoxFixtureId];
    default: return [];
  }
}

function validateFixture(fixture: StageFixture) {
  const source = fixture.sourceKey;
  const rule = REQUIREMENTS[source];
  if (!rule || fixture.schemaVersion !== 1 || fixture.version !== 1) throw new Error(`${source} is outside the 41-source Stage contract.`);
  if (fixture.preset !== rule.preset || fixture.composition !== rule.composition || fixture.foldMode !== rule.foldMode || fixture.attachment.kind !== rule.attachment) throw new Error(`${source} differs from its closed preset/composition/fold/attachment map.`);
  const proofIds = fixture.proof?.itemIds ?? [];
  const continuationIds = fixture.continuation?.itemIds ?? [];
  if (fixture.actions.length !== rule.actions || fixture.media.length !== rule.media || proofIds.length !== rule.proof || continuationIds.length !== rule.continuation) throw new Error(`${source} differs from its exact action/media/proof/continuation inventory.`);
  if (fixture.ornaments.mode !== "full-chip-static" || !STAGE_FORMS.every((form) => Boolean(fixture.forms[form]))) throw new Error(`${source} requires five explicit forms and static ornaments.`);
  nonempty(fixture.claim.headline.standard, "standard headline", source);
  nonempty(fixture.claim.headline.compact, "compact headline", source);
  nonempty(fixture.claim.headline.long, "long headline", source);
  const actionIds = fixture.actions.map(({ id }) => id);
  const mediaIds = fixture.media.map(({ id }) => id);
  unique(actionIds, "actions", source); unique(mediaIds, "media seats", source);
  if (!sameSet(actionIds, fixture.actionIds)) throw new Error(`${source} actionIds must reference every action exactly once.`);
  for (const action of fixture.actions) {
    nonempty(action.id, "action ID", source); nonempty(action.label, `label for ${action.id}`, source);
    if (action.kind === "link") { if (!action.href || !localSource(action.href)) throw new Error(`${source}/${action.id} requires a local href.`); }
    else if (action.href) throw new Error(`${source}/${action.id} admits href only for links.`);
  }
  for (const seat of fixture.media) {
    nonempty(seat.id, "media seat ID", source); nonempty(seat.alt, `alt for ${seat.id}`, source);
    if ((seat.role === "chart" || seat.role === "system-ui") && seat.assetKey) throw new Error(`${source}/${seat.id} cannot rasterize a system surface.`);
    if ((seat.role === "chart" || seat.role === "system-ui") && !seat.runtimeOwner) throw new Error(`${source}/${seat.id} requires a code runtime owner.`);
  }
  const contentGroups = Object.entries(fixture.content).filter(([key, value]) => key !== "status" && Array.isArray(value)) as Array<[string, StageContentItem[]]>;
  const allContent = contentGroups.flatMap(([, items]) => items);
  const allContentIds = allContent.map(({ id }) => id);
  unique(allContentIds, "content IDs", source);
  allContent.forEach((item) => { nonempty(item.id, "content ID", source); nonempty(item.label, `label for ${item.id}`, source); });
  const knownIds = new Set([...actionIds, ...allContentIds, ...mediaIds, ...(fixture.attachment.kind === "commerce" ? [fixture.attachment.buyBoxFixtureId] : [])]);
  for (const id of [...proofIds, ...continuationIds, ...fixture.ornaments.itemIds, ...referencedAttachmentIds(fixture.attachment)]) if (!knownIds.has(id)) throw new Error(`${source} references orphan ID ${id}.`);
  const proofContentIds = fixture.proof?.kind === "stats" && sameSet(proofIds, fixture.content.stats.map(({ id }) => id))
    ? fixture.content.stats.map(({ id }) => id)
    : fixture.content.proofItems.map(({ id }) => id);
  if (!sameSet(proofIds, proofContentIds)) throw new Error(`${source} proof inventory differs from its typed content collection.`);
  const attachment = fixture.attachment;
  if (attachment.kind === "capture" && (!fixture.content.fields.some(({ id }) => id === attachment.fieldId) || !actionIds.includes(attachment.submitActionId))) throw new Error(`${source} capture references an orphan field or submit action.`);
  if (attachment.kind === "search" && (!sameSet(attachment.fieldIds, fixture.content.fields.map(({ id }) => id)) || !sameSet(attachment.tabIds ?? [], fixture.content.tabs.map(({ id }) => id)) || !actionIds.includes(attachment.submitActionId))) throw new Error(`${source} search inventory is incomplete.`);
  if (attachment.kind === "choice-gallery" && (!sameSet(attachment.choiceIds, fixture.content.choices.map(({ id }) => id)) || !attachment.choiceIds.includes(attachment.selectedId))) throw new Error(`${source} choice gallery inventory is incomplete.`);
  if (attachment.kind === "tabs-canvas" && (!sameSet(attachment.tabIds, fixture.content.tabs.map(({ id }) => id)) || !attachment.tabIds.includes(attachment.selectedId))) throw new Error(`${source} tabs canvas inventory is incomplete.`);
  if (attachment.kind === "demo-chat" && (!fixture.content.fields.some(({ id }) => id === attachment.fieldId) || !sameSet(attachment.messageIds, fixture.content.messages.map(({ id }) => id)) || !actionIds.includes(attachment.sendActionId))) throw new Error(`${source} demo chat inventory is incomplete.`);
}

function validateAssets(assets: StageMediaAsset[]) {
  unique(assets.map(({ assetKey }) => assetKey), "Stage media assets", "StageMediaAsset[]");
  for (const asset of assets) {
    nonempty(asset.assetKey, "assetKey", "StageMediaAsset[]"); nonempty(asset.alt, `alt for ${asset.assetKey}`, "StageMediaAsset[]"); nonempty(asset.provenanceId, `provenance for ${asset.assetKey}`, "StageMediaAsset[]");
    for (const src of [asset.src, asset.darkSrc, asset.posterSrc].filter(Boolean) as string[]) if (!localSource(src)) throw new Error(`${asset.assetKey} requires a registered local source.`);
    if (!Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width < 1 || asset.height < 1) throw new Error(`${asset.assetKey} requires positive intrinsic dimensions.`);
  }
}

export function resolveStageFixture(fixture: StageFixture, stress?: string, media: StageMediaAsset[] = []): ResolvedStageFixture {
  const patched = stress ? mergePatch(fixture, fixture.stresses[stress] ?? (() => { throw new Error(`${fixture.sourceKey} misses stress ${stress}.`); })(), fixture.sourceKey) as StageFixture : structuredClone(fixture);
  validateFixture(patched); validateAssets(media);
  const assets = new Map(media.map((asset) => [asset.assetKey, asset]));
  const resolvedMedia: ResolvedStageMedia[] = patched.media.map((seat) => {
    if (VECTOR_ROLES.has(seat.role)) return { ...seat, status: "vector", vectorPath: `/vectors/hero-section/${patched.sourceKey}/${seat.id}.svg` };
    if (!RASTER_ROLES.has(seat.role)) return { ...seat, status: "code" };
    const asset = seat.assetKey ? assets.get(seat.assetKey) : undefined;
    if (asset && asset.alt !== seat.alt) throw new Error(`${patched.sourceKey}/${seat.id} asset alt differs from the fixture identity.`);
    return { ...seat, status: asset ? "ready" : "hold", ...(asset ? { asset } : {}) };
  });
  const mediaById = new Map(resolvedMedia.map((seat) => [seat.id, seat]));
  const heldSeatIds = resolvedMedia.filter(({ status }) => status === "hold").map(({ id }) => id);
  return { ...patched, media: resolvedMedia, mediaById, activeStress: stress, heldSeatIds, terminalEligible: heldSeatIds.length === 0 };
}

export function validateStageImplementationProbe(probe: { ownerCount: number; stateOwnerCount: number; hiddenTwins: boolean; viewportBranching: boolean; formCount: number; slotCount: number; coarseTargetPx: number; fineTargetPx: number }) {
  if (probe.ownerCount !== 1 || probe.stateOwnerCount !== 1 || probe.hiddenTwins) throw new Error("Stage owner-cardinality failed.");
  if (probe.viewportBranching || probe.formCount !== 5 || probe.slotCount !== 6) throw new Error("Stage two-axis form/slot contract failed.");
  if (probe.coarseTargetPx < 48 || probe.fineTargetPx < 44) throw new Error("Stage target-floor failed.");
  return true;
}
