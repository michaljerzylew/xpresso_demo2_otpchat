export const LAUNCH_HERO_SOURCE_KEYS = [
  "waitlist-01",
  "waitlist-02",
  "waitlist-03",
  "waitlist-04",
  "waitlist-05",
  "waitlist-06",
] as const;

export const LAUNCH_HERO_PRESETS = [
  "testimonial-marquee",
  "media-story-split",
  "finance-proof-field",
  "community-grid",
  "launch-countdown",
  "community-countdown-card",
] as const;

export type LaunchHeroSourceKey = typeof LAUNCH_HERO_SOURCE_KEYS[number];
export type LaunchHeroPreset = typeof LAUNCH_HERO_PRESETS[number];
export type LaunchHeroCopyMode = "base" | "short" | "longLocale";
export type LaunchHeroStatus = "idle" | "invalid" | "pending" | "success" | "error";

export type LaunchHeroAction = { id: string; kind: "navigate" | "submit"; labelKey: string; href: string };
export type LaunchHeroMediaDeclaration = {
  seatId: string;
  kind: "raster-photo" | "raster-background" | "avatar" | "runtime-ui" | "vector-identity" | "procedural-background";
  status: "approved-reuse" | "HOLD-GPT-IMAGE-2" | "A3-required" | "A3-required-original-vector";
  assetId?: string;
  holdId?: string;
};

export type LaunchHeroFixture = {
  sourceKey: LaunchHeroSourceKey;
  owner: "LaunchHero";
  preset: LaunchHeroPreset;
  identity?: { nameKey: string; homeHref: string };
  navigation?: Array<{ labelKey: string; href: string }>;
  headerAction?: { labelKey: string; href: string };
  footerAction?: { labelKey: string; href: string };
  capture: {
    method: "POST";
    action: string;
    email: { labelKey: string; placeholderKey: string; type: "email"; inputMode: "email"; autoComplete: "email"; required: true };
    submitLabelKey: string;
    states: Record<Exclude<LaunchHeroStatus, "idle">, string>;
  };
  stories?: Array<Record<string, unknown> & { id: string; titleKey: string; bodyKey: string; selectorLabelKey: string }>;
  countdown?: { targetIso: string; accessibleDateKey: string; endedKey: string };
  social?: Array<{ labelKey: string; href: string }>;
  proof: Record<string, unknown> & { kind: LaunchHeroPreset };
  actionInventory: LaunchHeroAction[];
  controls: Array<{ id: string; kind: "select-story"; labelKey: string; value: string }>;
  mediaDeclarations: LaunchHeroMediaDeclaration[];
  copy: Record<LaunchHeroCopyMode, Record<string, string>>;
};

type DeliveryFile = { path: string; width: number; height: number; bytes: number; sha256: string; budgetStatus: "pass" | "legacy-exempt" };
type RasterSeat = {
  slug: LaunchHeroSourceKey;
  seatId: string;
  status: "approved-reuse" | "HOLD-GPT-IMAGE-2";
  delivery?: Record<"avif" | "webp" | "jpg", DeliveryFile | DeliveryFile[]>;
};
type CodeSeat = { slug: LaunchHeroSourceKey; seatId: string; status: string };

export type LaunchHeroMediaMap = {
  schemaVersion: string;
  packet: string;
  status: string;
  counts: {
    visualSeats: 36;
    rasterSeats: 23;
    resolvedRasterSeats: 23;
    heldRasterSeats: 0;
    runtimeUiSeats: 5;
    vectorIdentitySeats: 6;
    proceduralBackgroundSeats: 2;
    providerCallsMade: 0;
    vendorAssets: 0;
    remoteAssets: 0;
    placeholders: 0;
    substitutes: 0;
  };
  rasterSeats: RasterSeat[];
  runtimeUiSeats: CodeSeat[];
  vectorIdentitySeats: CodeSeat[];
  proceduralBackgroundSeats: CodeSeat[];
};

export type ResolvedLaunchHeroMedia = {
  seatId: string;
  status: "ready" | "hold" | "runtime-ui" | "vector" | "procedural";
  sources?: Partial<Record<"avif" | "webp" | "jpg", string>>;
  fallback?: string;
};

export type ResolvedLaunchHeroFixture = LaunchHeroFixture & {
  activeCopyMode: LaunchHeroCopyMode;
  activeCopy: Record<string, string>;
  mediaBySeat: Record<string, ResolvedLaunchHeroMedia>;
  heldSeatIds: string[];
};

const REQUIREMENTS: Record<LaunchHeroSourceKey, { preset: LaunchHeroPreset; actions: number; controls: number; seats: number }> = {
  "waitlist-01": { preset: "testimonial-marquee", actions: 3, controls: 0, seats: 9 },
  "waitlist-02": { preset: "media-story-split", actions: 3, controls: 3, seats: 5 },
  "waitlist-03": { preset: "finance-proof-field", actions: 6, controls: 0, seats: 6 },
  "waitlist-04": { preset: "community-grid", actions: 5, controls: 0, seats: 4 },
  "waitlist-05": { preset: "launch-countdown", actions: 6, controls: 0, seats: 7 },
  "waitlist-06": { preset: "community-countdown-card", actions: 4, controls: 0, seats: 5 },
};

const localRoute = (value: string, source: LaunchHeroSourceKey) => value.startsWith(`/demo/${source}/`) && !value.includes("#") && !/^https?:/i.test(value);
const publicPath = (file: DeliveryFile) => `/media/${file.path.split("/").at(-1)}`;
const deliveryFiles = (value: DeliveryFile | DeliveryFile[] | undefined) => value ? (Array.isArray(value) ? value : [value]) : [];
const publicSourceSet = (value: DeliveryFile | DeliveryFile[] | undefined) => deliveryFiles(value).map((file) => `${publicPath(file)} ${file.width}w`).join(", ");

function collectCopyKeys(value: unknown, result = new Set<string>(), root = true) {
  if (!value || typeof value !== "object") return result;
  if (Array.isArray(value)) { value.forEach((item) => collectCopyKeys(item, result, false)); return result; }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (root && key === "copy") continue;
    if (typeof child === "string" && key !== "sourceKey" && key.endsWith("Key")) result.add(child);
    else collectCopyKeys(child, result, false);
  }
  return result;
}

function validateMediaMap(map: LaunchHeroMediaMap) {
  const counts = map.counts;
  if (counts.visualSeats !== 36 || counts.rasterSeats !== 23 || counts.resolvedRasterSeats !== 23 || counts.heldRasterSeats !== 0 || counts.runtimeUiSeats !== 5 || counts.vectorIdentitySeats !== 6 || counts.proceduralBackgroundSeats !== 2) throw new Error("LaunchHero media map must account for 36 exact seats.");
  if (counts.providerCallsMade || counts.vendorAssets || counts.remoteAssets || counts.placeholders || counts.substitutes) throw new Error("LaunchHero media map admits a forbidden asset or provider call.");
  const all = [...map.rasterSeats, ...map.runtimeUiSeats, ...map.vectorIdentitySeats, ...map.proceduralBackgroundSeats];
  if (all.length !== 36 || new Set(all.map(({ seatId }) => seatId)).size !== 36) throw new Error("LaunchHero media seats must be unique and complete.");
  if (map.rasterSeats.some(({ status }) => status === "HOLD-GPT-IMAGE-2")) throw new Error("LaunchHero raster map cannot retain a stale background hold.");
  if (map.proceduralBackgroundSeats.map(({ seatId }) => seatId).join("/") !== "w03-background-field/w06-background-field") throw new Error("LaunchHero procedural atmosphere seats changed.");
}

function validateFixture(fixture: LaunchHeroFixture, map: LaunchHeroMediaMap) {
  const rule = REQUIREMENTS[fixture.sourceKey];
  if (!rule || fixture.owner !== "LaunchHero" || fixture.preset !== rule.preset) throw new Error(`${fixture.sourceKey} is outside the closed LaunchHero preset map.`);
  if (fixture.actionInventory.length !== rule.actions || fixture.controls.length !== rule.controls || fixture.mediaDeclarations.length !== rule.seats) throw new Error(`${fixture.sourceKey} inventory differs from its closed contract.`);
  if (new Set(fixture.actionInventory.map(({ id }) => id)).size !== rule.actions || new Set(fixture.mediaDeclarations.map(({ seatId }) => seatId)).size !== rule.seats) throw new Error(`${fixture.sourceKey} repeats an action or visual seat.`);
  if (fixture.actionInventory.some(({ href }) => !localRoute(href, fixture.sourceKey)) || fixture.capture.method !== "POST" || !localRoute(fixture.capture.action, fixture.sourceKey)) throw new Error(`${fixture.sourceKey} requires deterministic local actions.`);
  const field = fixture.capture.email;
  if (field.type !== "email" || field.inputMode !== "email" || field.autoComplete !== "email" || !field.required) throw new Error(`${fixture.sourceKey} capture field contract changed.`);
  const copyKeys = Object.values(fixture.copy).map((mode) => Object.keys(mode).sort().join("|"));
  if (new Set(copyKeys).size !== 1 || Object.values(fixture.copy).flatMap(Object.values).some((value) => !value.trim() || /[—–]/.test(value))) throw new Error(`${fixture.sourceKey} copy modes are incomplete or contain a long dash.`);
  const missing = [...collectCopyKeys(fixture)].filter((key) => !(key in fixture.copy.base));
  if (missing.length) throw new Error(`${fixture.sourceKey} misses copy key ${missing[0]}.`);
  const mapped = new Map([...map.rasterSeats, ...map.runtimeUiSeats, ...map.vectorIdentitySeats, ...map.proceduralBackgroundSeats].map((seat) => [seat.seatId, seat]));
  for (const declaration of fixture.mediaDeclarations) {
    const seat = mapped.get(declaration.seatId);
    if (!seat || seat.slug !== fixture.sourceKey || seat.status !== declaration.status) throw new Error(`${fixture.sourceKey}/${declaration.seatId} media mapping drifted.`);
  }
  if (fixture.sourceKey === "waitlist-01" && (!Array.isArray(fixture.proof.testimonials) || fixture.proof.testimonials.length !== 5)) throw new Error("waitlist-01 requires five testimonials.");
  if (fixture.sourceKey === "waitlist-02" && fixture.stories?.length !== 3) throw new Error("waitlist-02 requires three stories.");
  if (fixture.sourceKey === "waitlist-03" && (!Array.isArray(fixture.proof.panels) || fixture.proof.panels.length !== 4)) throw new Error("waitlist-03 requires four support panels.");
  if (fixture.sourceKey === "waitlist-05" && (!Array.isArray(fixture.proof.partners) || fixture.proof.partners.length !== 6)) throw new Error("waitlist-05 requires six partner identities.");
}

export function resolveLaunchHeroFixture(fixture: LaunchHeroFixture, map: LaunchHeroMediaMap, copyMode: LaunchHeroCopyMode = "base"): ResolvedLaunchHeroFixture {
  validateMediaMap(map);
  validateFixture(fixture, map);
  const mediaBySeat: Record<string, ResolvedLaunchHeroMedia> = {};
  for (const seat of map.rasterSeats.filter(({ slug }) => slug === fixture.sourceKey)) {
    const ready = seat.status === "approved-reuse";
    mediaBySeat[seat.seatId] = {
      seatId: seat.seatId,
      status: ready ? "ready" : "hold",
      ...(ready ? {
        sources: Object.fromEntries((["avif", "webp", "jpg"] as const).map((format) => [format, publicSourceSet(seat.delivery?.[format])]).filter((entry) => Boolean(entry[1]))),
        fallback: publicPath(deliveryFiles(seat.delivery?.jpg).at(-1)!),
      } : {}),
    };
  }
  for (const seat of map.runtimeUiSeats.filter(({ slug }) => slug === fixture.sourceKey)) mediaBySeat[seat.seatId] = { seatId: seat.seatId, status: "runtime-ui" };
  for (const seat of map.vectorIdentitySeats.filter(({ slug }) => slug === fixture.sourceKey)) mediaBySeat[seat.seatId] = { seatId: seat.seatId, status: "vector" };
  for (const seat of map.proceduralBackgroundSeats.filter(({ slug }) => slug === fixture.sourceKey)) mediaBySeat[seat.seatId] = { seatId: seat.seatId, status: "procedural" };
  return { ...structuredClone(fixture), activeCopyMode: copyMode, activeCopy: fixture.copy[copyMode], mediaBySeat, heldSeatIds: Object.values(mediaBySeat).filter(({ status }) => status === "hold").map(({ seatId }) => seatId) };
}

export function validateLaunchHeroImplementationProbe(probe: { ownerCount: number; stateOwnerCount: number; hiddenTwins: boolean; viewportBranching: boolean; coarseTargetPx: number; fineTargetPx: number; continuousWidthCount: number }) {
  if (probe.ownerCount !== 1 || probe.stateOwnerCount !== 1) throw new Error("LaunchHero owner-cardinality failed.");
  if (probe.hiddenTwins || probe.viewportBranching) throw new Error("LaunchHero two-axis/viewport-branching failed.");
  if (probe.coarseTargetPx < 44 || probe.fineTargetPx < 24) throw new Error("LaunchHero target-floor failed.");
  if (probe.continuousWidthCount !== 1681) throw new Error("LaunchHero continuous-width contract changed.");
  return true;
}
