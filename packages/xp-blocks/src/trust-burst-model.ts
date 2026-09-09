export const SOCIAL_PROOF_SOURCE_KEYS = Array.from({ length: 11 }, (_, index) =>
  `social-proof-${String(index + 1).padStart(2, "0")}`,
) as SocialProofSourceKey[];

export type SocialProofSourceKey = `social-proof-${string}`;
export type TrustBurstPreset =
  | "proof-stage"
  | "platform-wall"
  | "stat-band"
  | "channel-switcher"
  | "reward-mosaic"
  | "metric-deck"
  | "metric-panel"
  | "evidence-split"
  | "conversion-split"
  | "globe-network";

export type TrustMetric = {
  id: string;
  label: string;
  value: string;
  description?: string;
  iconKey?: string;
  delta?: {
    display: string;
    direction: "up" | "down" | "flat";
    tone: "positive" | "negative" | "neutral" | "warning";
    context?: string;
  };
};

export type TrustAction = { id: string; label: string; kind: "navigate"; href: `/demo/${string}` };
export type TrustMediaSeat = {
  id: string;
  kind: "photo" | "three-d" | "vector" | "runtime-ui" | "runtime-chart";
  role: "team-photo" | "progress-photo" | "device-scene" | "procedural-globe" | "identity-mark" | "portrait-illustration" | "reward-illustration" | "proof-surface";
  aspect: "1:1" | "4:3" | "3:2" | "16:9" | "4:5" | "device";
  alt: string;
  focalPoint?: { x: number; y: number };
  fallback: "code-static" | "compact-export" | "neutral-media";
};

export type ProofSurface =
  | { id: string; kind: "line"; label: string; value: string; points: number[] }
  | { id: string; kind: "donut"; label: string; value: string; segments: [number, number] }
  | { id: string; kind: "summary"; label: string; value: string; delta: string };
export type PlatformRecord = { id: string; name: string; count: string; description: string; markId: string };
export type ChannelState = { id: string; label: string; metrics: [TrustMetric, TrustMetric, TrustMetric] };
export type RewardTile =
  | { id: string; kind: "binary-distribution"; prompt: string; segments: [{ label: string; value: string }, { label: string; value: string }] }
  | { id: string; kind: "dual-update"; title: string; metrics: [TrustMetric, TrustMetric] }
  | { id: string; kind: "percentage-result"; metric: TrustMetric }
  | { id: string; kind: "vector-scene"; title: string; description: string; vectorId: string }
  | { id: string; kind: "device-scene"; title: string; mediaId: string }
  | { id: string; kind: "earnings-scene"; metric: TrustMetric; vectorIds: [string, string, string, string] };

export type TrustBurstStress = {
  textPatches: Array<{ targetId: string; field: "eyebrow" | "heading" | "description" | "label" | "value" | "name" | "alt"; value: string }>;
  failMediaIds?: string[];
  failRuntimeIds?: string[];
};

type FixtureBase = {
  sourceKey: SocialProofSourceKey;
  eyebrow?: string | null;
  heading: string;
  description?: string | null;
  heroMetricId?: string | null;
  media: TrustMediaSeat[];
  stress: { short: TrustBurstStress; longLocale: TrustBurstStress; error?: TrustBurstStress };
};

type TrustBurstVariant =
  | { preset: "proof-stage"; payload: { facts: [string, string]; surfaces: [ProofSurface, ProofSurface, ProofSurface]; portraitVectorIds: [string, string] } }
  | { preset: "platform-wall"; payload: { platforms: [PlatformRecord, PlatformRecord, PlatformRecord, PlatformRecord, PlatformRecord, PlatformRecord] } }
  | { preset: "stat-band"; payload: { metrics: [TrustMetric, TrustMetric, TrustMetric, TrustMetric] } }
  | { preset: "channel-switcher"; payload: { initialChannelId: string; channels: [ChannelState, ChannelState, ChannelState, ChannelState] } }
  | { preset: "reward-mosaic"; payload: { tiles: [RewardTile, RewardTile, RewardTile, RewardTile, RewardTile, RewardTile] } }
  | { preset: "metric-deck"; payload: { metrics: [TrustMetric, TrustMetric, TrustMetric, TrustMetric, TrustMetric, TrustMetric] } }
  | { preset: "metric-panel"; payload: { metrics: [TrustMetric, TrustMetric, TrustMetric, TrustMetric] } }
  | { preset: "evidence-split"; payload: { metrics: [TrustMetric, TrustMetric, TrustMetric, TrustMetric]; photoId: string } }
  | { preset: "conversion-split"; payload:
      | { facet: "photo"; metrics: [TrustMetric, TrustMetric, TrustMetric]; action: TrustAction; photoId: string }
      | { facet: "device"; metrics: [TrustMetric, TrustMetric, TrustMetric]; action: TrustAction; uiSurfaceIds: [string, string, string]; actionMarkId: string } }
  | { preset: "globe-network"; payload: { actions: [TrustAction, TrustAction]; supportingCopy: string; metrics: [TrustMetric, TrustMetric, TrustMetric, TrustMetric]; globe: { id: string; nodes: Array<{ id: string; lat: number; lng: number }>; arcs: Array<{ id: string; from: string; to: string; altitude: number; tone: string }>; initialRotation: [number, number, number] } } };

type WithFixtureBase<Variant> = Variant extends TrustBurstVariant ? FixtureBase & Variant : never;
export type TrustBurstFixture = WithFixtureBase<TrustBurstVariant>;

export type SocialProofMediaRecord = {
  slug: SocialProofSourceKey;
  seatId: string;
  kind: TrustMediaSeat["kind"];
  role: TrustMediaSeat["role"];
  aspect: TrustMediaSeat["aspect"];
  status: string;
  src?: string;
  publicBase?: string;
  presentation?: string;
  owner?: string;
  reason?: string;
};

export type ResolvedTrustMedia = SocialProofMediaRecord & { seat: TrustMediaSeat };
type ResolvedFields = {
  activeStress?: string;
  mediaById: ReadonlyMap<string, ResolvedTrustMedia>;
  failedMediaIds: ReadonlySet<string>;
  failedRuntimeIds: ReadonlySet<string>;
  heldMediaIds: ReadonlySet<string>;
};
type ResolveFixture<Fixture> = Fixture extends TrustBurstFixture ? Omit<Fixture, "stress"> & ResolvedFields : never;
export type ResolvedTrustBurstFixture = ResolveFixture<TrustBurstFixture>;

const EXPECTED: Record<SocialProofSourceKey, { preset: TrustBurstPreset; facet?: "photo" | "device"; media: number }> = {
  "social-proof-01": { preset: "proof-stage", media: 5 },
  "social-proof-02": { preset: "platform-wall", media: 6 },
  "social-proof-03": { preset: "stat-band", media: 0 },
  "social-proof-04": { preset: "channel-switcher", media: 3 },
  "social-proof-05": { preset: "reward-mosaic", media: 7 },
  "social-proof-06": { preset: "metric-deck", media: 0 },
  "social-proof-07": { preset: "metric-panel", media: 0 },
  "social-proof-08": { preset: "evidence-split", media: 1 },
  "social-proof-09": { preset: "conversion-split", facet: "photo", media: 1 },
  "social-proof-10": { preset: "globe-network", media: 1 },
  "social-proof-11": { preset: "conversion-split", facet: "device", media: 4 },
};

const text = (value: unknown, label: string, source: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires fixture-owned ${label}.`);
};
const exact = (value: unknown[], count: number, label: string, source: string) => {
  if (value.length !== count) throw new Error(`${source} requires exactly ${count} ${label}.`);
};
const unique = (values: string[], label: string, source: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`);
};

function visit(value: unknown, callback: (record: Record<string, unknown>) => boolean): boolean {
  if (!value || typeof value !== "object") return false;
  if (!Array.isArray(value) && callback(value as Record<string, unknown>)) return true;
  return Object.values(value).some((child) => visit(child, callback));
}

function applyTextPatch(fixture: TrustBurstFixture, patch: TrustBurstStress["textPatches"][number]) {
  if (patch.targetId === "fixture-root") {
    if (!(patch.field in fixture)) throw new Error(`${fixture.sourceKey} stress cannot patch root ${patch.field}.`);
    (fixture as unknown as Record<string, unknown>)[patch.field] = patch.value;
    return;
  }
  const found = visit(fixture.payload, (record) => {
    if (record.id !== patch.targetId) return false;
    const field = patch.field === "heading" && !("heading" in record) && "title" in record ? "title" : patch.field;
    if (!(field in record) && patch.field === "alt") return false;
    if (!(field in record)) throw new Error(`${fixture.sourceKey} stress cannot patch ${patch.targetId}.${patch.field}.`);
    record[field] = patch.value;
    return true;
  }) || visit(fixture.media, (record) => {
    if (record.id !== patch.targetId) return false;
    if (patch.field !== "alt") throw new Error(`${fixture.sourceKey} media stress may patch alt only.`);
    record.alt = patch.value;
    return true;
  });
  if (!found && patch.targetId === "supporting-copy" && patch.field === "description" && fixture.preset === "globe-network") {
    fixture.payload.supportingCopy = patch.value;
    return;
  }
  if (!found) throw new Error(`${fixture.sourceKey} stress references unknown target ${patch.targetId}.`);
}

function tupleSignature(fixture: TrustBurstFixture) {
  return JSON.stringify({
    sourceKey: fixture.sourceKey,
    preset: fixture.preset,
    media: fixture.media.map(({ id, kind, role, aspect, fallback }) => ({ id, kind, role, aspect, fallback })),
    payload: structuralPayload(fixture),
  });
}

function structuralPayload(fixture: TrustBurstFixture): unknown {
  if (fixture.preset === "proof-stage") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "proof-stage" }>["payload"];
    return { facts: payload.facts.length, surfaces: payload.surfaces.map(({ id, kind }) => ({ id, kind })), portraits: payload.portraitVectorIds };
  }
  if (fixture.preset === "platform-wall") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "platform-wall" }>["payload"];
    return payload.platforms.map(({ id, markId }) => ({ id, markId }));
  }
  if (fixture.preset === "channel-switcher") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "channel-switcher" }>["payload"];
    return { initial: payload.initialChannelId, channels: payload.channels.map(({ id, metrics }) => ({ id, metrics: metrics.map(({ id: metricId }) => metricId) })) };
  }
  if (fixture.preset === "reward-mosaic") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "reward-mosaic" }>["payload"];
    return payload.tiles.map((tile) => ({ id: tile.id, kind: tile.kind, ...(tile.kind === "vector-scene" ? { vectorId: tile.vectorId } : {}), ...(tile.kind === "device-scene" ? { mediaId: tile.mediaId } : {}), ...(tile.kind === "earnings-scene" ? { vectorIds: tile.vectorIds } : {}) }));
  }
  if (fixture.preset === "conversion-split") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "conversion-split" }>["payload"];
    return { facet: payload.facet, metrics: payload.metrics.map(({ id }) => id), action: { id: payload.action.id, href: payload.action.href }, ...(payload.facet === "photo" ? { photoId: payload.photoId } : { uiSurfaceIds: payload.uiSurfaceIds, actionMarkId: payload.actionMarkId }) };
  }
  if (fixture.preset === "globe-network") {
    const payload = fixture.payload as Extract<TrustBurstFixture, { preset: "globe-network" }>["payload"];
    return { actions: payload.actions.map(({ id, href }) => ({ id, href })), metrics: payload.metrics.map(({ id }) => id), globe: { id: payload.globe.id, nodes: payload.globe.nodes.map(({ id }) => id), arcs: payload.globe.arcs.map(({ id, from, to }) => ({ id, from, to })) } };
  }
  const payload = fixture.payload as { metrics: TrustMetric[] };
  return payload.metrics.map(({ id }) => id);
}

function referencedMedia(fixture: TrustBurstFixture): string[] {
  if (fixture.preset === "proof-stage") return [...fixture.payload.surfaces.map(({ id }) => id), ...fixture.payload.portraitVectorIds];
  if (fixture.preset === "platform-wall") return fixture.payload.platforms.map(({ markId }) => markId);
  if (fixture.preset === "channel-switcher") return fixture.media.map(({ id }) => id);
  if (fixture.preset === "reward-mosaic") return ["reward-binary-chart", ...fixture.payload.tiles.flatMap((tile) => tile.kind === "vector-scene" ? [tile.vectorId] : tile.kind === "device-scene" ? [tile.mediaId] : tile.kind === "earnings-scene" ? tile.vectorIds : [])];
  if (fixture.preset === "evidence-split") return [fixture.payload.photoId];
  if (fixture.preset === "conversion-split") return fixture.payload.facet === "photo" ? [fixture.payload.photoId] : [...fixture.payload.uiSurfaceIds, fixture.payload.actionMarkId];
  if (fixture.preset === "globe-network") return [fixture.payload.globe.id];
  return [];
}

function validateAction(action: TrustAction, source: string) {
  text(action.label, `action ${action.id} label`, source);
  if (action.kind !== "navigate" || !/^\/demo\/[a-z0-9][a-z0-9/-]*$/.test(action.href) || action.href.includes("#")) throw new Error(`${source} action ${action.id} requires a local /demo route.`);
}

function validateFixture(fixture: TrustBurstFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown Social Proof source ${fixture.sourceKey}.`);
  if (fixture.preset !== expected.preset) throw new Error(`${fixture.sourceKey} has the wrong closed preset.`);
  if (fixture.preset === "conversion-split" && fixture.payload.facet !== expected.facet) throw new Error(`${fixture.sourceKey} has the wrong conversion facet.`);
  text(fixture.heading, "heading", fixture.sourceKey);
  exact(fixture.media, expected.media, "media seats", fixture.sourceKey);
  unique(fixture.media.map(({ id }) => id), "media seat IDs", fixture.sourceKey);
  for (const seat of fixture.media) text(seat.alt, `media ${seat.id} alt`, fixture.sourceKey);
  const declared = new Set(fixture.media.map(({ id }) => id));
  const references = referencedMedia(fixture);
  unique(references, "media references", fixture.sourceKey);
  for (const id of references) if (!declared.has(id)) throw new Error(`${fixture.sourceKey} references undeclared media ${id}.`);
  for (const id of declared) if (!references.includes(id)) throw new Error(`${fixture.sourceKey} leaves media ${id} unowned.`);

  if (fixture.preset === "proof-stage") {
    exact(fixture.payload.facts, 2, "facts", fixture.sourceKey); exact(fixture.payload.surfaces, 3, "proof surfaces", fixture.sourceKey);
    if (fixture.payload.surfaces.map(({ kind }) => kind).join("/") !== "line/donut/summary") throw new Error(`${fixture.sourceKey} requires line, donut and summary proof surfaces.`);
  } else if (fixture.preset === "platform-wall") exact(fixture.payload.platforms, 6, "platform records", fixture.sourceKey);
  else if (fixture.preset === "stat-band") exact(fixture.payload.metrics, 4, "metrics", fixture.sourceKey);
  else if (fixture.preset === "channel-switcher") {
    exact(fixture.payload.channels, 4, "channels", fixture.sourceKey);
    fixture.payload.channels.forEach((channel) => exact(channel.metrics, 3, `metrics for ${channel.id}`, fixture.sourceKey));
    if (!fixture.payload.channels.some(({ id }) => id === fixture.payload.initialChannelId)) throw new Error(`${fixture.sourceKey} has an invalid initial channel.`);
  } else if (fixture.preset === "reward-mosaic") {
    exact(fixture.payload.tiles, 6, "reward tiles", fixture.sourceKey);
    if (fixture.payload.tiles.map(({ kind }) => kind).join("/") !== "binary-distribution/dual-update/percentage-result/vector-scene/device-scene/earnings-scene") throw new Error(`${fixture.sourceKey} drifts from six heterogeneous reward jobs.`);
    if (!fixture.heroMetricId || !fixture.payload.tiles.some(({ id }) => id === fixture.heroMetricId)) throw new Error(`${fixture.sourceKey} requires a local hero tile.`);
  } else if (fixture.preset === "metric-deck") exact(fixture.payload.metrics, 6, "metrics", fixture.sourceKey);
  else if (fixture.preset === "metric-panel" || fixture.preset === "evidence-split") exact(fixture.payload.metrics, 4, "metrics", fixture.sourceKey);
  else if (fixture.preset === "conversion-split") { exact(fixture.payload.metrics, 3, "metrics", fixture.sourceKey); validateAction(fixture.payload.action, fixture.sourceKey); }
  else if (fixture.preset === "globe-network") {
    exact(fixture.payload.actions, 2, "actions", fixture.sourceKey); exact(fixture.payload.metrics, 4, "metrics", fixture.sourceKey); exact(fixture.payload.globe.nodes, 6, "globe nodes", fixture.sourceKey); exact(fixture.payload.globe.arcs, 8, "globe arcs", fixture.sourceKey);
    fixture.payload.actions.forEach((action) => validateAction(action, fixture.sourceKey));
    const nodes = new Set(fixture.payload.globe.nodes.map(({ id }) => id));
    for (const arc of fixture.payload.globe.arcs) if (!nodes.has(arc.from) || !nodes.has(arc.to)) throw new Error(`${fixture.sourceKey} arc ${arc.id} references an unknown node.`);
  }
  if (["platform-wall", "stat-band", "channel-switcher", "metric-deck", "metric-panel"].includes(fixture.preset) && fixture.heroMetricId) throw new Error(`${fixture.sourceKey} cannot invent a peer hierarchy.`);
  for (const required of ["short", "longLocale", "error"] as const) if (!fixture.stress?.[required]) throw new Error(`${fixture.sourceKey} requires ${required} stress.`);
}

export function resolveTrustBurstFixture(raw: TrustBurstFixture, stress: string | undefined, records: SocialProofMediaRecord[]): ResolvedTrustBurstFixture {
  if (!raw || typeof raw !== "object") throw new Error("TrustBurst fixture must be an object.");
  validateFixture(raw);
  const baseSignature = tupleSignature(raw);
  const fixture = structuredClone(raw);
  const active = stress ? fixture.stress[stress as keyof typeof fixture.stress] : undefined;
  if (stress && !active) throw new Error(`${fixture.sourceKey} has no ${stress} stress state.`);
  active?.textPatches.forEach((patch) => applyTextPatch(fixture, patch));
  validateFixture(fixture);
  if (tupleSignature(fixture) !== baseSignature) throw new Error(`${fixture.sourceKey} stress changed structural ownership.`);

  const mediaById = new Map<string, ResolvedTrustMedia>();
  const heldMediaIds = new Set<string>();
  for (const seat of fixture.media) {
    const record = records.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === seat.id);
    if (!record || record.kind !== seat.kind || record.role !== seat.role || record.aspect !== seat.aspect) throw new Error(`${fixture.sourceKey} cannot resolve exact media ${seat.id}.`);
    if (record.status === "HOLD-INFRA") {
      if (fixture.sourceKey !== "social-proof-05" || seat.id !== "reward-device-scene") throw new Error(`${fixture.sourceKey} has an unexpected held media seat.`);
      heldMediaIds.add(seat.id);
    } else if (
      (seat.kind === "vector" && (!record.src?.startsWith("/media/") || record.src.includes("..")))
      || (seat.kind === "photo" && (!record.publicBase?.startsWith("/media/") || record.publicBase.includes("..")))
      || (seat.kind === "three-d" && record.presentation === "physical-render" && (record.owner !== "xp-media" || !record.publicBase?.startsWith("/media/") || record.publicBase.includes("..")))
      || (["runtime-ui", "runtime-chart"].includes(seat.kind) && (record.presentation !== "runtime" || record.owner !== "xp-code"))
      || (seat.kind === "three-d" && record.presentation !== "physical-render" && (record.presentation !== "runtime" || record.owner !== "xp-code"))
    ) {
      throw new Error(`${fixture.sourceKey} has an invalid ${seat.kind} resolver for ${seat.id}.`);
    }
    mediaById.set(seat.id, { ...record, seat });
  }
  const failedMediaIds = new Set(active?.failMediaIds ?? []);
  const failedRuntimeIds = new Set(active?.failRuntimeIds ?? []);
  for (const id of [...failedMediaIds, ...failedRuntimeIds]) if (!mediaById.has(id)) throw new Error(`${fixture.sourceKey} stress fails unknown media ${id}.`);
  const { stress: _stress, ...core } = fixture;
  return { ...core, activeStress: stress, mediaById, failedMediaIds, failedRuntimeIds, heldMediaIds } as ResolvedTrustBurstFixture;
}
