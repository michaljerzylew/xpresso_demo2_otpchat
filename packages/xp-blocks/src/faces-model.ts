export const FACES_SOURCE_KEYS = Array.from({ length: 20 }, (_, index) =>
  `team-section-${String(index + 1).padStart(2, "0")}`,
) as TeamSourceKey[];

export type TeamSourceKey = `team-section-${string}`;
export type FacesComposition = "directory" | "filtered-directory" | "rail" | "portrait-mosaic" | "collective" | "spotlight" | "portrait-selector" | "identity-marquee";
export type FaceAction = { id: string; ownerId: string; label: string; kind: "social" | "navigate" | "recruit"; emphasis: "primary" | "secondary" | "peer" | "quiet"; href: `/demo/${string}` };
export type FaceMediaSeat = { id: string; identityId: string; role: "portrait" | "group-photo"; assetKey: string; alt: string; aspect: string; focalPoint?: string };
export type FacePerson = { id: string; name?: string; role?: string; bio?: string[]; portraitSeatIds: string[]; groupIds: string[]; actionIds: string[] };
export type FaceGroup = { id: string; label: string; personIds: string[] };
export type FacesExtension =
  | { kind: "directory"; personIds: string[]; compactPresentation: string; wideColumns: number }
  | { kind: "filtered-directory"; personIds: string[]; groups: FaceGroup[]; initialGroupId: string; allGroupId: string }
  | { kind: "rail"; personIds: string[]; initialPersonId: string; loop: false; compactCompletePeers: number; wideCompletePeers: number }
  | { kind: "portrait-mosaic"; personIds: string[]; anonymous: boolean; presentation: string }
  | { kind: "collective"; groupPhotoSeatId: string }
  | { kind: "spotlight"; personIds: string[]; initialPersonId: string; presentation: string }
  | { kind: "portrait-selector"; personIds: string[]; initialPersonId: string }
  | { kind: "identity-marquee"; rows: Array<{ id: string; personIds: string[] }>; loop: false; paused: true };
export type FacesFixture = {
  schemaVersion: 1; sourceKey: TeamSourceKey; composition: FacesComposition; preset: string;
  intro: { eyebrow?: string; title: string; body?: string[]; actionIds: string[] };
  people: FacePerson[]; media: FaceMediaSeat[]; actions: FaceAction[]; extension: FacesExtension;
  state: { activeGroupId?: string; selectedPersonId?: string; openPersonId?: string };
  announcements: Record<string, string> & { error: string };
  stress: Record<string, Partial<Pick<FacesFixture, "intro" | "people" | "actions" | "state" | "announcements">>>;
};
export type FaceMediaRecord = {
  slug: TeamSourceKey; seatId: string; key: string; assetKey: string; identityId: string;
  role: "portrait" | "group-photo"; kind: "responsive-image"; assetId: string; src: `/media/${string}`;
  width: number; height: number; publicBase: `/media/${string}`; cropPolicy: string; aspect: string; provenanceId: string; alt: string;
};
export type FacesMediaMap = { version: "team-section-media-v1"; generatedAt: string; records: FaceMediaRecord[] };
export type ResolvedFacePerson = FacePerson & { media: FaceMediaRecord[]; actions: FaceAction[] };
export type ResolvedFaces = Omit<FacesFixture, "people"> & {
  people: ResolvedFacePerson[]; peopleById: ReadonlyMap<string, ResolvedFacePerson>;
  mediaBySeat: ReadonlyMap<string, FaceMediaRecord>; activeStress?: string; terminalEligible: true;
};

type Expected = { composition: FacesComposition; preset: string; people: number; media: number; actions: number };
const EXPECTED: Record<TeamSourceKey, Expected> = {
  "team-section-01":{composition:"directory",preset:"full-profile-grid",people:8,media:8,actions:32},
  "team-section-02":{composition:"directory",preset:"floating-card-grid",people:4,media:4,actions:12},
  "team-section-03":{composition:"rail",preset:"bio-progress-rail",people:4,media:4,actions:16},
  "team-section-04":{composition:"directory",preset:"avatar-card-row",people:5,media:5,actions:20},
  "team-section-05":{composition:"directory",preset:"split-profile-grid",people:4,media:4,actions:16},
  "team-section-06":{composition:"portrait-mosaic",preset:"anonymous-mosaic",people:10,media:10,actions:1},
  "team-section-07":{composition:"rail",preset:"portrait-rail",people:4,media:4,actions:12},
  "team-section-08":{composition:"portrait-mosaic",preset:"avatar-constellation",people:10,media:10,actions:1},
  "team-section-09":{composition:"directory",preset:"capsule-grid",people:5,media:5,actions:21},
  "team-section-10":{composition:"directory",preset:"linked-photo-grid",people:4,media:4,actions:4},
  "team-section-11":{composition:"portrait-mosaic",preset:"sticker-collage",people:7,media:7,actions:1},
  "team-section-12":{composition:"filtered-directory",preset:"grouped-directory",people:6,media:6,actions:25},
  "team-section-13":{composition:"collective",preset:"group-banner",people:0,media:1,actions:1},
  "team-section-14":{composition:"spotlight",preset:"selected-profile",people:6,media:12,actions:24},
  "team-section-15":{composition:"directory",preset:"compact-card-trio",people:3,media:3,actions:7},
  "team-section-16":{composition:"portrait-selector",preset:"cluster-selector",people:7,media:7,actions:1},
  "team-section-17":{composition:"identity-marquee",preset:"manual-identity-rows",people:15,media:15,actions:1},
  "team-section-18":{composition:"spotlight",preset:"profile-accordion",people:4,media:4,actions:17},
  "team-section-19":{composition:"rail",preset:"inverted-profile-rail",people:7,media:7,actions:0},
  "team-section-20":{composition:"rail",preset:"dark-stage-rail",people:6,media:6,actions:13},
};

const exact = (actual: number, expected: number, label: string, source: string) => { if (actual !== expected) throw new Error(`${source} requires exactly ${expected} ${label}.`); };
const unique = (values: string[], label: string, source: string) => { if (new Set(values).size !== values.length) throw new Error(`${source} repeats ${label}.`); };
const nonempty = (value: unknown, label: string, source: string) => { if (typeof value !== "string" || !value.trim()) throw new Error(`${source} requires ${label}.`); };

function mergeById<T extends { id: string }>(base: T[], patch?: T[]) {
  if (!patch) return base;
  const updates = new Map(patch.map((item) => [item.id, item]));
  return base.map((item) => updates.has(item.id) ? { ...item, ...updates.get(item.id)! } : item);
}

function applyStress(fixture: FacesFixture, stress?: string) {
  const active = structuredClone(fixture);
  if (!stress) return active;
  const patch = active.stress[stress];
  if (!patch) throw new Error(`${active.sourceKey} misses stress ${stress}.`);
  if (patch.intro) active.intro = { ...active.intro, ...patch.intro };
  if (patch.state) active.state = { ...active.state, ...patch.state };
  if (patch.announcements) active.announcements = { ...active.announcements, ...patch.announcements };
  active.people = mergeById(active.people, patch.people as FacePerson[] | undefined);
  active.actions = mergeById(active.actions, patch.actions as FaceAction[] | undefined);
  return active;
}

function validateFixture(fixture: FacesFixture, map: FacesMediaMap) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected || fixture.schemaVersion !== 1) throw new Error(`Unknown Faces fixture ${fixture.sourceKey}.`);
  if (fixture.composition !== expected.composition || fixture.preset !== expected.preset || fixture.extension.kind !== expected.composition) throw new Error(`${fixture.sourceKey} differs from its closed Faces preset.`);
  exact(fixture.people.length, expected.people, "people", fixture.sourceKey); exact(fixture.media.length, expected.media, "media seats", fixture.sourceKey); exact(fixture.actions.length, expected.actions, "actions", fixture.sourceKey);
  nonempty(fixture.intro.title, "intro title", fixture.sourceKey); nonempty(fixture.announcements.error, "error announcement", fixture.sourceKey);
  unique(fixture.people.map(({ id }) => id), "people", fixture.sourceKey); unique(fixture.media.map(({ id }) => id), "media seats", fixture.sourceKey); unique(fixture.actions.map(({ id }) => id), "actions", fixture.sourceKey);
  const people = new Set(fixture.people.map(({ id }) => id)); const seats = new Set(fixture.media.map(({ id }) => id)); const actions = new Map(fixture.actions.map((action) => [action.id, action]));
  for (const person of fixture.people) {
    if (fixture.sourceKey !== "team-section-06") nonempty(person.name, `${person.id} name`, fixture.sourceKey);
    if (person.portraitSeatIds.some((id) => !seats.has(id))) throw new Error(`${fixture.sourceKey}/${person.id} references unknown media.`);
    if (person.actionIds.some((id) => actions.get(id)?.ownerId !== person.id)) throw new Error(`${fixture.sourceKey}/${person.id} has invalid action ownership.`);
  }
  for (const id of fixture.intro.actionIds) if (actions.get(id)?.ownerId !== "intro") throw new Error(`${fixture.sourceKey}/intro has invalid action ownership.`);
  for (const seat of fixture.media) {
    if (seat.role === "portrait" && !people.has(seat.identityId)) throw new Error(`${fixture.sourceKey}/${seat.id} references unknown identity.`);
    const record = map.records.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === seat.id);
    if (!record || record.identityId !== seat.identityId || record.assetKey !== seat.assetKey || record.role !== seat.role || !record.src.startsWith("/media/")) throw new Error(`${fixture.sourceKey}/${seat.id} has no identity-exact local media record.`);
  }
  if (fixture.sourceKey === "team-section-13" && fixture.people.length) throw new Error("team-section-13 cannot invent individual people.");
  if (fixture.sourceKey === "team-section-14" && (fixture.people.some(({ portraitSeatIds }) => portraitSeatIds.length !== 2) || fixture.people.some(({ actionIds }) => actionIds.length !== 4))) throw new Error("team-section-14 requires six two-view, four-action identities.");
  if (fixture.sourceKey === "team-section-17" && new Set(fixture.media.map(({ id }) => map.records.find(({ slug, seatId }) => slug === fixture.sourceKey && seatId === id)?.assetId)).size !== 15) throw new Error("team-section-17 requires fifteen distinct masters.");
  for (const key of ["short", "longLocale", "error"]) if (!fixture.stress[key]) throw new Error(`${fixture.sourceKey} misses stress ${key}.`);
}

export function resolveFacesFixture(fixture: FacesFixture, map: FacesMediaMap, stress?: string): ResolvedFaces {
  if (map.version !== "team-section-media-v1" || map.records.length !== 126) throw new Error("Faces requires the complete 126-seat media map.");
  const active = applyStress(fixture, stress); validateFixture(active, map);
  const mediaBySeat = new Map(map.records.filter(({ slug }) => slug === active.sourceKey).map((record) => [record.seatId, record]));
  const actionById = new Map(active.actions.map((action) => [action.id, action]));
  const people = active.people.map((person) => ({ ...person, media: person.portraitSeatIds.map((id) => mediaBySeat.get(id)!), actions: person.actionIds.map((id) => actionById.get(id)!) }));
  return { ...active, people, peopleById: new Map(people.map((person) => [person.id, person])), mediaBySeat, activeStress: stress, terminalEligible: true };
}
