export const MINI_APP_SOURCE_KEYS = [
  "card-nav-01",
  "card-nav-02",
  "card-nav-03",
  "card-nav-04",
  "card-nav-05",
  "card-nav-06",
] as const;

export const MINI_APP_PRESETS = [
  "performance-brief",
  "payment-method",
  "wallet-control",
  "schedule-agenda",
  "profile-wizard",
  "analytics-overview",
] as const;

export type MiniAppSourceKey = typeof MINI_APP_SOURCE_KEYS[number];
export type MiniAppPreset = typeof MINI_APP_PRESETS[number];
export type MiniAppCopyMode = "base" | "short" | "longLocale";

export type MiniAppPerson = {
  id: string;
  role: string;
  assetId: string;
  nameKey: string;
  roleKey: string;
  altKey: string;
};

export type MiniAppAction = {
  id: string;
  label: string;
  behavior: "localState" | "localRoute";
  result?: string;
  route?: `/demo/${string}`;
  hideLabel?: string;
};

export type MiniAppFixture = {
  sourceKey: MiniAppSourceKey;
  preset: MiniAppPreset;
  title: string;
  description?: string;
  initialStateIds: Record<string, string>;
  mediaDeclarations: { people?: MiniAppPerson[] };
  nav?: Record<string, unknown>;
  toolbar?: Record<string, unknown>;
  body: Record<string, unknown>;
  actions: MiniAppAction[];
  copy: Record<MiniAppCopyMode, Record<string, string>>;
  stress: { mode: MiniAppCopyMode };
};

export type MiniAppMediaMap = {
  schemaVersion: "1.0";
  status: "PASS";
  counts: {
    portraitPlacements: 14;
    uniquePeople: 13;
    resolvedPlacements: 14;
    resolvedPeople: 13;
    providerCallsMade: 0;
    substitutesUsed: 0;
    placeholdersUsed: 0;
    remoteAssets: 0;
    vendorAssets: 0;
  };
  delivery: {
    kind: "circle-safe-avatar";
    width: 256;
    formats: Array<"avif" | "webp" | "jpg">;
    canonicalPublicParity: string;
  };
  people: Record<string, { assetId: string; name: string; role: string; publicBase: `/media/${string}` }>;
  assignments: Record<MiniAppSourceKey, string[]>;
  reuse: { personId: string; assetId: string; placements: number; why: string };
};

export type ResolvedMiniAppPerson = MiniAppPerson & {
  name: string;
  title: string;
  alt: string;
  sources: Record<"avif" | "webp" | "jpg", string>;
};

export type ResolvedMiniAppFixture = MiniAppFixture & {
  activeCopyMode: MiniAppCopyMode;
  activeCopy: Record<string, string>;
  people: ResolvedMiniAppPerson[];
};

const REQUIREMENTS: Record<MiniAppSourceKey, { preset: MiniAppPreset; people: number; actions: number }> = {
  "card-nav-01": { preset: "performance-brief", people: 5, actions: 1 },
  "card-nav-02": { preset: "payment-method", people: 0, actions: 2 },
  "card-nav-03": { preset: "wallet-control", people: 0, actions: 2 },
  "card-nav-04": { preset: "schedule-agenda", people: 9, actions: 1 },
  "card-nav-05": { preset: "profile-wizard", people: 0, actions: 3 },
  "card-nav-06": { preset: "analytics-overview", people: 0, actions: 0 },
};

const asRecord = (value: unknown, label: string, source: string) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${source} requires ${label}.`);
  return value as Record<string, unknown>;
};

const asArray = (value: unknown, label: string, source: string) => {
  if (!Array.isArray(value)) throw new Error(`${source} requires ${label}.`);
  return value;
};

const exactLength = (value: unknown, count: number, label: string, source: string) => {
  const items = asArray(value, label, source);
  if (items.length !== count) throw new Error(`${source} requires ${count} ${label}.`);
  return items;
};

const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};

function collectCopyKeys(value: unknown, keys: Set<string>, root = true) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectCopyKeys(item, keys, false));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (root && (key === "copy" || key === "stress")) continue;
    if (typeof child === "string" && child.endsWith("Key")) keys.add(child);
    else collectCopyKeys(child, keys, false);
  }
}

function validateCopy(fixture: MiniAppFixture) {
  const baseKeys = Object.keys(fixture.copy.base).sort();
  if (!baseKeys.length || ["short", "longLocale"].some((mode) => JSON.stringify(Object.keys(fixture.copy[mode as MiniAppCopyMode]).sort()) !== JSON.stringify(baseKeys))) {
    throw new Error(`${fixture.sourceKey} copy modes must expose identical keys.`);
  }
  if (Object.values(fixture.copy).flatMap(Object.values).some((value) => !value.trim() || value.includes("—"))) throw new Error(`${fixture.sourceKey} copy contains an empty value or em dash.`);
  const references = new Set<string>();
  collectCopyKeys(fixture, references);
  for (const mode of ["base", "short", "longLocale"] as const) {
    const missing = [...references].filter((key) => !(key in fixture.copy[mode]));
    if (missing.length) throw new Error(`${fixture.sourceKey}/${mode} misses copy key ${missing[0]}.`);
  }
  if (!Object.values(fixture.copy.longLocale).some((value) => /[A-Za-z]{24,}/.test(value))) throw new Error(`${fixture.sourceKey} requires a 24-character long-locale token.`);
}

function validateMediaMap(map: MiniAppMediaMap) {
  const counts = map.counts;
  if (map.schemaVersion !== "1.0" || map.status !== "PASS" || counts.portraitPlacements !== 14 || counts.uniquePeople !== 13 || counts.resolvedPlacements !== 14 || counts.resolvedPeople !== 13) throw new Error("Card Nav media map must resolve 14 placements to 13 people.");
  if (counts.providerCallsMade || counts.substitutesUsed || counts.placeholdersUsed || counts.remoteAssets || counts.vendorAssets) throw new Error("Card Nav media map admits non-original or unresolved media.");
  if (map.delivery.width !== 256 || map.delivery.formats.join("/") !== "avif/webp/jpg" || map.delivery.canonicalPublicParity !== "byte-identical-39-of-39") throw new Error("Card Nav media delivery contract changed.");
  if (Object.keys(map.people).length !== 13 || Object.values(map.people).some(({ publicBase }) => !publicBase.startsWith("/media/") || /^https?:/.test(publicBase))) throw new Error("Card Nav people must resolve to thirteen local media bases.");
  if (map.reuse.personId !== "p_005" || map.reuse.placements !== 2 || !map.reuse.why.trim()) throw new Error("Card Nav recurring identity contract changed.");
}

function validateInventory(fixture: MiniAppFixture) {
  const source = fixture.sourceKey;
  const body = asRecord(fixture.body, "body", source);
  if (source === "card-nav-01") {
    const nav = asRecord(fixture.nav, "tabs", source);
    exactLength(nav.items, 3, "tabs", source);
    exactLength(body.views, 3, "views", source);
  } else if (source === "card-nav-02") {
    exactLength(body.methods, 2, "payment methods", source);
    exactLength(body.fields, 4, "payment fields", source);
    asRecord(body.preview, "payment preview", source);
  } else if (source === "card-nav-03") {
    exactLength(body.cards, 2, "wallet cards", source);
    asRecord(body.editor, "limit editor", source);
    if (fixture.actions.map(({ id }) => id).join("/") !== "reveal/adjust_limit") throw new Error(`${source} requires independent reveal and limit actions.`);
  } else if (source === "card-nav-04") {
    const nav = asRecord(fixture.nav, "period navigation", source);
    exactLength(nav.periods, 3, "periods", source);
    exactLength(nav.days, 7, "days", source);
    exactLength(body.counts, 3, "event counts", source);
    exactLength(body.records, 5, "agenda records", source);
    asRecord(fixture.toolbar, "toolbar", source);
  } else if (source === "card-nav-05") {
    const nav = asRecord(fixture.nav, "step navigation", source);
    exactLength(nav.items, 3, "step destinations", source);
    const steps = exactLength(body.steps, 3, "wizard steps", source).map((step) => asRecord(step, "wizard step", source));
    if (steps.map((step) => asArray(step.fields, "step fields", source).length).join("/") !== "5/6/6") throw new Error(`${source} requires a 5/6/6 field schema.`);
  } else {
    const metrics = exactLength(body.metrics, 4, "metrics", source).map((metric) => asRecord(metric, "metric", source));
    if (metrics.some((metric) => exactLength(asRecord(metric.chart, "chart", source).points, 6, "chart points", source).length !== 6)) throw new Error(`${source} requires six chart points per metric.`);
  }
}

function validateFixture(fixture: MiniAppFixture, map: MiniAppMediaMap) {
  const requirement = REQUIREMENTS[fixture.sourceKey];
  if (!requirement || fixture.preset !== requirement.preset) throw new Error(`${fixture.sourceKey} is outside the closed MiniApp preset map.`);
  const people = fixture.mediaDeclarations.people ?? [];
  if (people.length !== requirement.people || fixture.actions.length !== requirement.actions) throw new Error(`${fixture.sourceKey} inventory differs from its closed preset.`);
  unique(people.map(({ id }) => id), "person IDs", fixture.sourceKey);
  unique(fixture.actions.map(({ id }) => id), "action IDs", fixture.sourceKey);
  for (const action of fixture.actions) {
    if (action.behavior === "localRoute" && (!action.route?.startsWith("/demo/") || action.route.includes(":"))) throw new Error(`${fixture.sourceKey}/${action.id} requires one local route.`);
  }
  const assigned = map.assignments[fixture.sourceKey];
  if (!assigned || assigned.join("/") !== people.map(({ id }) => id).join("/")) throw new Error(`${fixture.sourceKey} media assignments differ from the fixture.`);
  for (const person of people) {
    if (map.people[person.id]?.assetId !== person.assetId) throw new Error(`${fixture.sourceKey}/${person.id} has no identity-exact audited portrait.`);
  }
  validateCopy(fixture);
  validateInventory(fixture);
}

export function resolveMiniAppFixture(fixture: MiniAppFixture, map: MiniAppMediaMap, mode: MiniAppCopyMode = fixture.stress.mode): ResolvedMiniAppFixture {
  validateMediaMap(map);
  const active = structuredClone(fixture);
  validateFixture(active, map);
  if (!(mode in active.copy)) throw new Error(`${active.sourceKey} does not declare copy mode ${mode}.`);
  const activeCopy = active.copy[mode];
  const people = (active.mediaDeclarations.people ?? []).map((person) => {
    const media = map.people[person.id];
    return {
      ...person,
      name: activeCopy[person.nameKey],
      title: activeCopy[person.roleKey],
      alt: activeCopy[person.altKey],
      sources: {
        avif: `${media.publicBase}.avif`,
        webp: `${media.publicBase}.webp`,
        jpg: `${media.publicBase}.jpg`,
      },
    };
  });
  return { ...active, activeCopyMode: mode, activeCopy, people };
}

export type MiniAppImplementationProbe = {
  ownerCount: number;
  hiddenTwins: boolean;
  viewportBranching: boolean;
  stateOwnerCount: number;
  continuousWidthCount: number;
  coarseTargetPx: number;
  fineTargetPx: number;
};

export function validateMiniAppImplementationProbe(probe: MiniAppImplementationProbe) {
  if (probe.ownerCount !== 1 || probe.stateOwnerCount !== 1) throw new Error("mini-app-owner-cardinality");
  if (probe.hiddenTwins) throw new Error("hidden-responsive-twin");
  if (probe.viewportBranching) throw new Error("two-axis-viewport-branching");
  if (probe.continuousWidthCount !== 721) throw new Error("continuous-slot-coverage");
  if (probe.coarseTargetPx < 44 || probe.fineTargetPx < 24) throw new Error("target-floor");
  return true;
}
