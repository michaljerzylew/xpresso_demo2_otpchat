export type UserScheduleMediaAsset = {
  key: string;
  kind: "responsive-image" | "avatar" | "system-icon";
  src?: string;
  alt: string;
};

export type EventDiscoveryMedia = { key: string; alt: string; focalPoint: string };
export type EventDiscoveryEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: { amount: number; currency?: string; label?: string };
  media: EventDiscoveryMedia;
  categoryIds: string[];
  languageId: string;
  date: string;
  href: string;
  featured?: boolean;
};
export type EventFacet =
  | { id: "date"; kind: "date"; label: string; quickOptions: { id: string; label: string; range: [string, string] }[] }
  | { id: "category" | "language" | "price"; kind: "multi"; label: string; options: { id: string; label: string }[] };
export type ScheduleFormField = {
  id: string;
  label: string;
  kind: "text" | "textarea" | "date" | "time" | "select" | "money" | "upload" | "url" | "people";
  placeholder?: string;
  options?: { id: string; label: string }[];
};
export type ScheduleCreateModel = {
  triggerLabel: string;
  title: string;
  description: string;
  fields: ScheduleFormField[];
  upload: { maxFiles: 6; maxBytes: 5242880; acceptLabel: string; removeLabel: string; errorLabel?: string };
  people?: { addLabel: string; removeLabel: string; initialParticipantIds: string[] };
  actions: [{ id: "cancel"; label: string }, { id: "create"; label: string }];
  dirtyTitle?: string;
  dirtyDescription?: string;
  discardLabel?: string;
  keepEditingLabel?: string;
};

export type EventDiscoveryFixture = {
  sourceKey: "user-schedule-01";
  title: string;
  resultLabel: string;
  events: EventDiscoveryEvent[];
  facets: EventFacet[];
  initiallyApplied: { facetId: string; optionId: string }[];
  filterLabel: string;
  clearLabel: string;
  showResultsLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  create: ScheduleCreateModel;
  stress?: Record<string, Partial<Omit<EventDiscoveryFixture, "stress">>>;
};

export type ScheduleParticipant = { id: string; name: string; avatarKey?: string; initials: string };
export type ScheduleMeeting = {
  id: string;
  title: string;
  platform: { id: string; label: string; iconKey: string };
  start: string;
  end: string;
  status: "upcoming" | "completed";
  description: string;
  participants: ScheduleParticipant[];
  join: { label: string; href: string };
};
export type ScheduleDay = { date: string; dayLabel: string; dayNumber: string; isToday?: boolean; meetings: ScheduleMeeting[] };
export type SchedulePanelFixture = {
  sourceKey: "user-schedule-02";
  title: string;
  monthLabel: string;
  days: ScheduleDay[];
  selectedDate: string;
  tabs: [{ id: "upcoming"; label: string }, { id: "all"; label: string }, { id: "completed"; label: string }];
  searchLabel: string;
  sortLabel: string;
  sortOptions: [{ id: "default"; label: string }, { id: "time"; label: string }, { id: "name"; label: string }];
  emptyTitle: string;
  create: ScheduleCreateModel;
  stress?: Record<string, Partial<Omit<SchedulePanelFixture, "stress">>>;
};

export type UserScheduleFixture = EventDiscoveryFixture | SchedulePanelFixture;
export type ResolvedEventDiscoveryFixture = EventDiscoveryFixture & { resolvedMedia: UserScheduleMediaAsset[] };
export type ResolvedSchedulePanelFixture = SchedulePanelFixture & { resolvedMedia: UserScheduleMediaAsset[]; participantPool: ScheduleParticipant[] };

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires fixture-owned ${label}.`);
};
const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};
const localHref = (href: string, label: string, sourceKey: string) => {
  if (!href.startsWith("/demo/") || href === "#") throw new Error(`${sourceKey} ${label} requires a safe local demo href.`);
};
const validateCreate = (create: ScheduleCreateModel, expectedFields: number, sourceKey: string) => {
  required(create.triggerLabel, "create trigger", sourceKey);
  required(create.title, "create title", sourceKey);
  required(create.description, "create description", sourceKey);
  if (create.fields.length !== expectedFields) throw new Error(`${sourceKey} requires ${expectedFields} creation fields.`);
  unique(create.fields.map((field) => field.id), "creation field IDs", sourceKey);
  for (const field of create.fields) required(field.label, `field ${field.id} label`, sourceKey);
  if (create.upload.maxFiles !== 6 || create.upload.maxBytes !== 5 * 1024 * 1024) throw new Error(`${sourceKey} requires the six-file, five-megabyte upload contract.`);
  if (create.actions.length !== 2 || create.actions[0].id !== "cancel" || create.actions[1].id !== "create") throw new Error(`${sourceKey} requires cancel then create actions.`);
};

export function resolveEventDiscoveryFixture(fixture: EventDiscoveryFixture, media: UserScheduleMediaAsset[]): ResolvedEventDiscoveryFixture {
  if (fixture.sourceKey !== "user-schedule-01") throw new Error(`Invalid EventDiscovery source key: ${fixture.sourceKey}`);
  required(fixture.title, "title", fixture.sourceKey);
  if (fixture.events.length !== 9) throw new Error(`${fixture.sourceKey} requires exactly nine events.`);
  unique(fixture.events.map((event) => event.id), "event IDs", fixture.sourceKey);
  if (fixture.events.filter((event) => event.featured).length !== 1) throw new Error(`${fixture.sourceKey} requires exactly one featured event.`);
  if (fixture.facets.length !== 4 || fixture.facets.map((facet) => facet.id).join("|") !== "date|category|language|price") throw new Error(`${fixture.sourceKey} requires date, category, language and price facets in source order.`);
  const dateFacet = fixture.facets[0];
  const category = fixture.facets[1];
  const language = fixture.facets[2];
  const price = fixture.facets[3];
  if (dateFacet.kind !== "date" || dateFacet.quickOptions.length !== 4) throw new Error(`${fixture.sourceKey} requires four date shortcuts.`);
  if (category.kind !== "multi" || category.options.length !== 10) throw new Error(`${fixture.sourceKey} requires ten category options.`);
  if (language.kind !== "multi" || language.options.length !== 9) throw new Error(`${fixture.sourceKey} requires nine language options.`);
  if (price.kind !== "multi" || price.options.length !== 4) throw new Error(`${fixture.sourceKey} requires four price options.`);
  const resolvedKeys = new Set(media.map((asset) => asset.key));
  for (const event of fixture.events) {
    required(event.title, `event ${event.id} title`, fixture.sourceKey);
    required(event.description, `event ${event.id} description`, fixture.sourceKey);
    required(event.location, `event ${event.id} location`, fixture.sourceKey);
    localHref(event.href, `event ${event.id}`, fixture.sourceKey);
    if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(event.date)) throw new Error(`${fixture.sourceKey} event ${event.id} requires an ISO date.`);
    if (!resolvedKeys.has(event.media.key)) throw new Error(`${fixture.sourceKey} cannot resolve media ${event.media.key}.`);
  }
  validateCreate(fixture.create, 9, fixture.sourceKey);
  return { ...fixture, resolvedMedia: media };
}

export function resolveSchedulePanelFixture(fixture: SchedulePanelFixture, media: UserScheduleMediaAsset[]): ResolvedSchedulePanelFixture {
  if (fixture.sourceKey !== "user-schedule-02") throw new Error(`Invalid SchedulePanel source key: ${fixture.sourceKey}`);
  required(fixture.title, "title", fixture.sourceKey);
  if (fixture.days.length !== 14) throw new Error(`${fixture.sourceKey} requires exactly fourteen consecutive fixture days.`);
  unique(fixture.days.map((day) => day.date), "day dates", fixture.sourceKey);
  if (fixture.days.filter((day) => day.isToday).length !== 1) throw new Error(`${fixture.sourceKey} requires exactly one today.`);
  if (!fixture.days.some((day) => day.date === fixture.selectedDate)) throw new Error(`${fixture.sourceKey} selected date is outside its day range.`);
  const meetings = fixture.days.flatMap((day) => day.meetings);
  if (meetings.length !== 9) throw new Error(`${fixture.sourceKey} requires exactly nine meetings.`);
  unique(meetings.map((meeting) => meeting.id), "meeting IDs", fixture.sourceKey);
  const participantMap = new Map<string, ScheduleParticipant>();
  for (const meeting of meetings) for (const person of meeting.participants) {
    const existing = participantMap.get(person.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(person)) throw new Error(`${fixture.sourceKey} participant ${person.id} changes identity between meetings.`);
    participantMap.set(person.id, person);
  }
  const participantPool = [...participantMap.values()];
  if (participantPool.length !== 8) throw new Error(`${fixture.sourceKey} requires exactly eight participants.`);
  const selected = fixture.days.find((day) => day.date === fixture.selectedDate)!;
  if (selected.meetings.length !== 3 || selected.meetings.filter((meeting) => meeting.status === "upcoming").length !== 2) throw new Error(`${fixture.sourceKey} selected date requires three meetings with two upcoming.`);
  const platforms = new Map<string, string>();
  for (const meeting of meetings) {
    platforms.set(meeting.platform.id, meeting.platform.iconKey);
    localHref(meeting.join.href, `meeting ${meeting.id} join action`, fixture.sourceKey);
  }
  if (platforms.size !== 3) throw new Error(`${fixture.sourceKey} requires exactly three fictional meeting platforms.`);
  if (fixture.tabs.length !== 3 || fixture.sortOptions.length !== 3) throw new Error(`${fixture.sourceKey} requires exactly three tabs and three sort options.`);
  const mediaKeys = new Set(media.map((asset) => asset.key));
  for (const person of participantPool) if (person.avatarKey && !mediaKeys.has(person.avatarKey)) throw new Error(`${fixture.sourceKey} cannot resolve portrait ${person.avatarKey}.`);
  validateCreate(fixture.create, 11, fixture.sourceKey);
  if (!fixture.create.people || fixture.create.people.initialParticipantIds.length !== 6) throw new Error(`${fixture.sourceKey} requires six initial meeting participants.`);
  return { ...fixture, resolvedMedia: media, participantPool };
}
