export const VIDEO_CALL_SOURCE_KEYS = ["video-call-01", "video-call-02", "video-call-03"] as const;

export type VideoCallSourceKey = (typeof VIDEO_CALL_SOURCE_KEYS)[number];
export type MeetingPreset = "stage-focus" | "meeting-app";
export type MeetingPanelId = "participants" | "chat";
export type MeetingStress = "base" | "short" | "longLocale";
export type MeetingForm = "M" | "TP" | "TL" | "DS" | "DW";
export type ParticipantPresence = "in-meeting" | "invited" | "offline";
export type ParticipantRole = "local" | "guest" | "host";
export type MediaState = "on" | "muted" | "off" | "unavailable";

export type MeetingParticipant = {
  id: string;
  identityMediaId: string;
  displayNameKey: string;
  presence: ParticipantPresence;
  role: ParticipantRole;
  handRaised: boolean;
  microphone: "on" | "muted" | "unavailable";
  camera: "on" | "off" | "unavailable";
};

export type MeetingStreamSeat = {
  id: string;
  participantId: string;
  kind: "featured" | "peer" | "self";
  posterMediaId: string;
};

export type MeetingAction = {
  id: string;
  type: string;
  labelKey?: string;
  labelKeyOn?: string;
  labelKeyOff?: string;
  targetParticipantId?: string;
  menuId?: string;
  confirmation?: {
    titleKey: string;
    bodyKey: string;
    cancelKey: string;
    confirmKey: string;
    successKey?: string;
  };
  feedback?: { successKey: string; errorKey: string };
};

export type MeetingMediaPlacement = {
  id?: string;
  mediaId?: string;
  identityId: string;
  role: string;
  localPath: string;
  publicPath: string;
  sha256: string;
  libraryId: string;
  altKey: string;
};

export type MeetingMessage = {
  id: string;
  authorId: string;
  direction: "incoming" | "outgoing";
  bodyKey: string;
  timestampKey: string;
  status: "pending" | "sent" | "failed";
  avatarMediaId?: string;
};

export type MeetingRosterSection = {
  id: string;
  titleKey: string;
  countKey: string;
  participantIds: string[];
};

export type MeetingFixture = {
  schemaVersion: 1;
  packet: "video-call-contract-v1";
  sourceKey: VideoCallSourceKey;
  owner: "MeetingShell";
  preset: MeetingPreset;
  participants: MeetingParticipant[];
  streamSeats: MeetingStreamSeat[];
  compactParticipantIds?: string[];
  rosterSections?: MeetingRosterSection[];
  availablePanels: MeetingPanelId[];
  initialPanel: MeetingPanelId | null;
  controlIds: string[];
  messageIds: string[];
  messages?: MeetingMessage[];
  typingParticipantIds?: string[];
  meetingMeta: {
    titleKey?: string;
    meetingIdKey?: string;
    elapsedKey?: string;
    participantCountKey?: string;
    overflowKey?: string;
    backActionId?: string;
    copyActionId?: string;
    startedAtOffsetSeconds: number;
    overflowParticipantCount: number;
  };
  actions: MeetingAction[];
  menus: unknown[];
  panels: Array<Record<string, unknown>>;
  mediaPlacements: MeetingMediaPlacement[];
  stateKeys: Record<string, string>;
  copy: Record<MeetingStress, Record<string, string>>;
};

export type ResolvedMeetingParticipant = MeetingParticipant & {
  displayName: string;
  media?: ResolvedMeetingMedia;
};

export type ResolvedMeetingMedia = MeetingMediaPlacement & {
  id: string;
  src: string;
  alt: string;
};

export type ResolvedMeetingAction = MeetingAction & {
  label: string;
  labelOn?: string;
  labelOff?: string;
};

export type ResolvedMeetingMessage = MeetingMessage & {
  body: string;
  timestamp: string;
  author: string;
  avatar?: ResolvedMeetingMedia;
};

export type ResolvedRosterSection = MeetingRosterSection & {
  title: string;
  count: string;
};

export type ResolvedMeetingFixture = Omit<MeetingFixture, "participants" | "streamSeats" | "actions" | "messages" | "rosterSections" | "mediaPlacements" | "copy"> & {
  activeStress: MeetingStress;
  copy: Record<string, string>;
  participants: ResolvedMeetingParticipant[];
  streamSeats: Array<MeetingStreamSeat & { participant: ResolvedMeetingParticipant; media: ResolvedMeetingMedia }>;
  actions: ResolvedMeetingAction[];
  messages: ResolvedMeetingMessage[];
  rosterSections: ResolvedRosterSection[];
  mediaPlacements: ResolvedMeetingMedia[];
  labels: {
    meeting: string;
    activeSpeaker: string;
    peerRail: string;
    panelTitle?: string;
    panelClose?: string;
    overflow: string;
    overflowClose: string;
    captions?: string;
    typing?: string;
    endTitle: string;
    endBody: string;
    endCancel: string;
    endConfirm: string;
  };
};

type ExpectedVector = {
  preset: MeetingPreset;
  panels: string;
  initialPanel: MeetingPanelId | null;
  participants: number;
  streams: number;
  placements: number;
  controls: string;
  roster: string;
  messages: string;
  compact: number;
  typing: number;
};

const EXPECTED: Record<VideoCallSourceKey, ExpectedVector> = {
  "video-call-01": {
    preset: "stage-focus", panels: "", initialPanel: null, participants: 4, streams: 4, placements: 4,
    controls: "microphone|camera|captions|hand-signal|reactions|more-options|recording|end-call",
    roster: "", messages: "", compact: 0, typing: 0,
  },
  "video-call-02": {
    preset: "meeting-app", panels: "participants", initialPanel: "participants", participants: 10, streams: 4, placements: 13,
    controls: "microphone|camera|captions|hand-signal|reactions|more-options|leave-call|participants|layout|device-settings|fullscreen|meeting-info",
    roster: "4|2|3", messages: "", compact: 0, typing: 0,
  },
  "video-call-03": {
    preset: "meeting-app", panels: "chat", initialPanel: "chat", participants: 7, streams: 4, placements: 10,
    controls: "microphone|camera|captions|hand-signal|reactions|more-options|leave-call|chat|layout|device-settings|fullscreen|meeting-info",
    roster: "", messages: "incoming|outgoing|incoming|outgoing|incoming|outgoing", compact: 3, typing: 3,
  },
};

const required = (value: unknown, label: string, sourceKey: string) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
  return value;
};

const copyValue = (copy: Record<string, string>, key: unknown, label: string, sourceKey: string) =>
  required(copy[required(key, `${label} key`, sourceKey)], label, sourceKey);

const unique = (values: string[], label: string, sourceKey: string) => {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
};

const mediaId = (media: MeetingMediaPlacement) => required(media.id ?? media.mediaId, "media placement id", media.identityId);

function validateFixtureCopy(fixture: MeetingFixture, stress: MeetingStress) {
  const keySets = (["base", "short", "longLocale"] as const).map((key) => Object.keys(fixture.copy[key] ?? {}).sort().join("|"));
  if (!keySets[0] || keySets.some((value) => value !== keySets[0])) throw new Error(`${fixture.sourceKey} copy stress keys drift.`);
  for (const copyStress of ["base", "short", "longLocale"] as const) for (const [key, value] of Object.entries(fixture.copy[copyStress])) {
    required(value, `${copyStress} copy ${key}`, fixture.sourceKey);
    if (/[\u2013\u2014]/u.test(value)) throw new Error(`${fixture.sourceKey} ${copyStress} copy ${key} contains a banned dash.`);
  }
  const copy = fixture.copy[stress];
  if (!copy) throw new Error(`${fixture.sourceKey} lacks ${stress} copy.`);
  return copy;
}

function validateClosedVector(fixture: MeetingFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown video call source ${fixture.sourceKey}.`);
  const roster = (fixture.rosterSections ?? []).map(({ participantIds }) => participantIds.length).join("|");
  const messages = (fixture.messages ?? []).map(({ direction }) => direction).join("|");
  if (
    fixture.owner !== "MeetingShell" || fixture.packet !== "video-call-contract-v1" || fixture.schemaVersion !== 1 ||
    fixture.preset !== expected.preset || fixture.availablePanels.join("|") !== expected.panels || fixture.initialPanel !== expected.initialPanel ||
    fixture.participants.length !== expected.participants || fixture.streamSeats.length !== expected.streams ||
    fixture.mediaPlacements.length !== expected.placements || fixture.controlIds.join("|") !== expected.controls ||
    roster !== expected.roster || messages !== expected.messages || (fixture.compactParticipantIds?.length ?? 0) !== expected.compact ||
    (fixture.typingParticipantIds?.length ?? 0) !== expected.typing
  ) throw new Error(`${fixture.sourceKey} drifts from its closed source mapping.`);
}

export function resolveMeetingFixture(fixture: MeetingFixture, stress: MeetingStress = "base"): ResolvedMeetingFixture {
  validateClosedVector(fixture);
  const copy = validateFixtureCopy(fixture, stress);
  const sourceKey = fixture.sourceKey;
  unique(fixture.participants.map(({ id }) => id), "participant owner", sourceKey);
  unique(fixture.streamSeats.map(({ id }) => id), "stream owner", sourceKey);
  unique(fixture.controlIds, "control owner", sourceKey);
  unique(fixture.actions.map(({ id }) => id), "action owner", sourceKey);
  unique(fixture.messageIds, "message owner", sourceKey);
  unique(fixture.mediaPlacements.map(mediaId), "media placement owner", sourceKey);
  if (fixture.initialPanel && !fixture.availablePanels.includes(fixture.initialPanel)) throw new Error(`${sourceKey} initial panel is unavailable.`);

  const participantIds = new Set(fixture.participants.map(({ id }) => id));
  const actionIds = new Set(fixture.actions.map(({ id }) => id));
  const mediaPlacements = fixture.mediaPlacements.map((media) => {
    const id = mediaId(media);
    if (!participantIds.has(media.identityId)) throw new Error(`${sourceKey} media ${id} has a dangling identity.`);
    if (!media.localPath.startsWith("assets-library/") || !media.publicPath.startsWith("apps/preview/public/media/") || /^(?:https?:)?\/\//i.test(media.localPath + media.publicPath)) throw new Error(`${sourceKey} media ${id} lacks local provenance.`);
    if (!/^[a-f0-9]{64}$/.test(media.sha256)) throw new Error(`${sourceKey} media ${id} lacks an exact SHA.`);
    const basename = media.publicPath.slice("apps/preview/public/media/".length);
    if (!basename || basename.includes("/") || !/\.(?:avif|webp|jpe?g|png)$/i.test(basename)) throw new Error(`${sourceKey} media ${id} has an unsafe public path.`);
    return { ...media, id, src: `/media/${basename}`, alt: copyValue(copy, media.altKey, `media ${id} alt`, sourceKey) };
  });
  const mediaById = new Map(mediaPlacements.map((media) => [media.id, media]));

  const participants = fixture.participants.map((participant) => {
    const media = mediaById.get(participant.identityMediaId);
    if (!media) throw new Error(`${sourceKey} participant ${participant.id} has a dangling identity media ID.`);
    return { ...participant, displayName: copyValue(copy, participant.displayNameKey, `participant ${participant.id} name`, sourceKey), media };
  });
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const streamSeats = fixture.streamSeats.map((stream) => {
    const participant = participantById.get(stream.participantId);
    const media = mediaById.get(stream.posterMediaId);
    if (!participant || !media || media.identityId !== participant.id) throw new Error(`${sourceKey} stream ${stream.id} has a dangling participant or poster.`);
    return { ...stream, participant, media };
  });

  for (const section of fixture.rosterSections ?? []) {
    unique(section.participantIds, `roster member in ${section.id}`, sourceKey);
    if (section.participantIds.some((id) => !participantIds.has(id))) throw new Error(`${sourceKey} roster ${section.id} has a dangling participant.`);
  }
  for (const id of [...(fixture.compactParticipantIds ?? []), ...(fixture.typingParticipantIds ?? [])]) if (!participantIds.has(id)) throw new Error(`${sourceKey} has a dangling compact or typing participant.`);
  if ((fixture.messages ?? []).map(({ id }) => id).join("|") !== fixture.messageIds.join("|")) throw new Error(`${sourceKey} message IDs drift from the thread.`);

  const actions = fixture.actions.map((action) => {
    if (action.targetParticipantId && !participantIds.has(action.targetParticipantId)) throw new Error(`${sourceKey} action ${action.id} has a dangling participant.`);
    return {
      ...action,
      label: copyValue(copy, action.labelKey ?? action.labelKeyOff ?? action.confirmation?.confirmKey, `action ${action.id} label`, sourceKey),
      labelOn: action.labelKeyOn ? copyValue(copy, action.labelKeyOn, `action ${action.id} on label`, sourceKey) : undefined,
      labelOff: action.labelKeyOff ? copyValue(copy, action.labelKeyOff, `action ${action.id} off label`, sourceKey) : undefined,
    };
  });
  if (fixture.controlIds.some((id) => !actionIds.has(id))) throw new Error(`${sourceKey} has a control without an action.`);

  const messages = (fixture.messages ?? []).map((message) => {
    const author = participantById.get(message.authorId);
    const avatar = message.avatarMediaId ? mediaById.get(message.avatarMediaId) : undefined;
    if (!author || (message.avatarMediaId && (!avatar || avatar.identityId !== message.authorId))) throw new Error(`${sourceKey} message ${message.id} has a dangling author or avatar.`);
    return { ...message, author: author.displayName, body: copyValue(copy, message.bodyKey, `message ${message.id} body`, sourceKey), timestamp: copyValue(copy, message.timestampKey, `message ${message.id} timestamp`, sourceKey), avatar };
  });
  const rosterSections = (fixture.rosterSections ?? []).map((section) => ({ ...section, title: copyValue(copy, section.titleKey, `roster ${section.id} title`, sourceKey), count: copyValue(copy, section.countKey, `roster ${section.id} count`, sourceKey) }));

  for (const panel of fixture.panels) {
    const invite = panel.invite as { retainedValue?: unknown } | undefined;
    if (invite?.retainedValue && !String(invite.retainedValue).endsWith(".example")) throw new Error(`${sourceKey} invitation address must use .example.`);
  }

  const state = (name: string, fallback?: string) => fixture.stateKeys[name] ? copyValue(copy, fixture.stateKeys[name], `state ${name}`, sourceKey) : fallback;
  const endAction = actions.find(({ id }) => id === "end-call" || id === "leave-call");
  if (!endAction?.confirmation) throw new Error(`${sourceKey} requires end confirmation.`);
  const panelTitle = fixture.availablePanels.length ? copy.panel_title : undefined;
  return {
    ...fixture,
    activeStress: stress,
    copy,
    participants,
    streamSeats,
    actions,
    messages,
    rosterSections,
    mediaPlacements,
    labels: {
      meeting: copy.header_title ?? copy.label_active_speaker ?? "Meeting",
      activeSpeaker: copy.label_active_speaker ?? "Active speaker",
      peerRail: copy.label_peer_rail ?? "Other participants",
      panelTitle,
      panelClose: copy.panel_close,
      overflow: actions.find(({ id }) => id === "more-options")?.label ?? "More options",
      overflowClose: copy.panel_close ?? "Close options",
      captions: state("caption") ?? state("captionsSample"),
      typing: state("typing"),
      endTitle: copyValue(copy, endAction.confirmation.titleKey, "end title", sourceKey),
      endBody: copyValue(copy, endAction.confirmation.bodyKey, "end body", sourceKey),
      endCancel: copyValue(copy, endAction.confirmation.cancelKey, "end cancel", sourceKey),
      endConfirm: copyValue(copy, endAction.confirmation.confirmKey, "end confirm", sourceKey),
    },
  };
}

export type MeetingMessageState = ResolvedMeetingMessage & { status: "pending" | "sent" | "failed" };
export type MeetingSessionState = {
  availablePanels: MeetingPanelId[];
  activeStreamId: string;
  trackStates: Record<string, "live" | "ended" | "reconnecting" | "denied">;
  participantMicrophones: Record<string, "on" | "muted" | "unavailable">;
  participantCameras: Record<string, "on" | "off" | "unavailable">;
  microphone: "on" | "muted" | "unavailable";
  camera: "on" | "off" | "unavailable";
  captions: boolean;
  handRaised: boolean;
  recording: boolean;
  layout: "featured" | "grid";
  dockVisible: boolean;
  openPanel: MeetingPanelId | null;
  panelQuery: string;
  messages: MeetingMessageState[];
  draft: string;
  inviteValue: string;
  inviteStatus: "idle" | "invalid" | "pending" | "success" | "error";
  copyStatus: "idle" | "success" | "error";
  openMenu: string | null;
  reaction: string | null;
  pipCorner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  confirmation: { kind: "end" | "mute-all" | "remove"; participantId?: string; invokerId: string } | null;
  terminated: boolean;
  focusReturnId: string | null;
  reducedMotion: boolean;
  announcement: string;
};

export type MeetingSessionAction =
  | { type: "activate-stream"; streamId: string }
  | { type: "track-ended"; streamId: string; announcement: string }
  | { type: "reconnect-start"; streamId: string; announcement: string }
  | { type: "reconnect-success"; streamId: string; announcement: string }
  | { type: "toggle-microphone" } | { type: "toggle-camera" } | { type: "toggle-captions" } | { type: "toggle-hand" } | { type: "toggle-recording" }
  | { type: "set-media-unavailable"; media: "microphone" | "camera"; announcement: string }
  | { type: "toggle-participant-microphone"; participantId: string }
  | { type: "toggle-participant-camera"; participantId: string }
  | { type: "set-layout"; layout: "featured" | "grid" }
  | { type: "set-dock"; visible: boolean }
  | { type: "open-panel"; panel: MeetingPanelId; invokerId: string }
  | { type: "close-panel"; invokerId?: string }
  | { type: "set-query"; query: string }
  | { type: "set-draft"; draft: string }
  | { type: "send-start"; id: string; body: string; authorId: string; author: string; pending: string }
  | { type: "send-success"; id: string; announcement: string }
  | { type: "send-failure"; id: string; announcement: string }
  | { type: "send-retry"; id: string; announcement: string }
  | { type: "set-invite"; value: string }
  | { type: "invite-status"; status: MeetingSessionState["inviteStatus"]; announcement: string }
  | { type: "copy-status"; status: MeetingSessionState["copyStatus"]; announcement: string }
  | { type: "open-menu"; menu: string; invokerId: string } | { type: "close-menu"; invokerId?: string }
  | { type: "reaction"; reaction: string; announcement: string }
  | { type: "set-pip"; corner: MeetingSessionState["pipCorner"] }
  | { type: "request-confirmation"; confirmation: NonNullable<MeetingSessionState["confirmation"]> }
  | { type: "cancel-confirmation" }
  | { type: "confirm-end"; announcement: string }
  | { type: "confirm-mute-all"; announcement: string }
  | { type: "confirm-remove"; participantId: string; announcement: string }
  | { type: "clear-focus-return" }
  | { type: "set-reduced-motion"; value: boolean };

export function createMeetingSessionState(model: ResolvedMeetingFixture, options: Partial<MeetingSessionState> = {}): MeetingSessionState {
  const local = model.participants.find(({ role }) => role === "local") ?? model.participants[0];
  const invite = model.panels.map((panel) => (panel.invite as { retainedValue?: string } | undefined)?.retainedValue).find(Boolean) ?? "";
  return {
    availablePanels: [...model.availablePanels],
    activeStreamId: model.streamSeats.find(({ kind }) => kind === "featured")?.id ?? model.streamSeats[0]!.id,
    trackStates: Object.fromEntries(model.streamSeats.map(({ id }) => [id, "live"])),
    participantMicrophones: Object.fromEntries(model.participants.map(({ id, microphone }) => [id, microphone])),
    participantCameras: Object.fromEntries(model.participants.map(({ id, camera }) => [id, camera])),
    microphone: local.microphone,
    camera: local.camera,
    captions: false,
    handRaised: local.handRaised,
    recording: false,
    layout: "featured",
    dockVisible: true,
    openPanel: model.initialPanel,
    panelQuery: "",
    messages: model.messages.map((message) => ({ ...message })),
    draft: "",
    inviteValue: invite,
    inviteStatus: "idle",
    copyStatus: "idle",
    openMenu: null,
    reaction: null,
    pipCorner: "top-right",
    confirmation: null,
    terminated: false,
    focusReturnId: null,
    reducedMotion: false,
    announcement: "",
    ...options,
  };
}

export function meetingSessionReducer(state: MeetingSessionState, action: MeetingSessionAction): MeetingSessionState {
  switch (action.type) {
    case "activate-stream": return state.trackStates[action.streamId] ? { ...state, activeStreamId: action.streamId } : state;
    case "track-ended": return { ...state, trackStates: { ...state.trackStates, [action.streamId]: "ended" }, announcement: action.announcement };
    case "reconnect-start": return { ...state, trackStates: { ...state.trackStates, [action.streamId]: "reconnecting" }, announcement: action.announcement };
    case "reconnect-success": return { ...state, trackStates: { ...state.trackStates, [action.streamId]: "live" }, announcement: action.announcement };
    case "toggle-microphone": return state.microphone === "unavailable" ? state : { ...state, microphone: state.microphone === "on" ? "muted" : "on" };
    case "toggle-camera": return state.camera === "unavailable" ? state : { ...state, camera: state.camera === "on" ? "off" : "on" };
    case "toggle-captions": return { ...state, captions: !state.captions };
    case "toggle-hand": return { ...state, handRaised: !state.handRaised };
    case "toggle-recording": return { ...state, recording: !state.recording };
    case "set-media-unavailable": return { ...state, [action.media]: "unavailable", announcement: action.announcement };
    case "toggle-participant-microphone": {
      const value = state.participantMicrophones[action.participantId];
      return value === "unavailable" ? state : { ...state, participantMicrophones: { ...state.participantMicrophones, [action.participantId]: value === "on" ? "muted" : "on" } };
    }
    case "toggle-participant-camera": {
      const value = state.participantCameras[action.participantId];
      return value === "unavailable" ? state : { ...state, participantCameras: { ...state.participantCameras, [action.participantId]: value === "on" ? "off" : "on" } };
    }
    case "set-layout": return { ...state, layout: action.layout };
    case "set-dock": return { ...state, dockVisible: action.visible };
    case "open-panel": return state.availablePanels.includes(action.panel) ? { ...state, openPanel: action.panel, openMenu: null, focusReturnId: action.invokerId } : state;
    case "close-panel": return { ...state, openPanel: null, focusReturnId: action.invokerId ?? state.focusReturnId };
    case "set-query": return { ...state, panelQuery: action.query };
    case "set-draft": return { ...state, draft: action.draft };
    case "send-start": return !action.body.trim() ? state : { ...state, draft: "", messages: [...state.messages, { id: action.id, authorId: action.authorId, author: action.author, direction: "outgoing", bodyKey: "", timestampKey: "", body: action.body.trim(), timestamp: "Now", status: "pending" }], announcement: action.pending };
    case "send-success": return { ...state, messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "sent" } : message), announcement: action.announcement };
    case "send-failure": return { ...state, messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "failed" } : message), announcement: action.announcement };
    case "send-retry": return { ...state, messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "pending" } : message), announcement: action.announcement };
    case "set-invite": return { ...state, inviteValue: action.value, inviteStatus: "idle" };
    case "invite-status": return { ...state, inviteStatus: action.status, announcement: action.announcement };
    case "copy-status": return { ...state, copyStatus: action.status, announcement: action.announcement };
    case "open-menu": return { ...state, openMenu: action.menu, focusReturnId: action.invokerId };
    case "close-menu": return { ...state, openMenu: null, focusReturnId: action.invokerId ?? state.focusReturnId };
    case "reaction": return { ...state, reaction: action.reaction, announcement: action.announcement };
    case "set-pip": return { ...state, pipCorner: action.corner };
    case "request-confirmation": return { ...state, confirmation: action.confirmation, openMenu: null };
    case "cancel-confirmation": return { ...state, confirmation: null, focusReturnId: state.confirmation?.invokerId ?? state.focusReturnId };
    case "confirm-end": return state.terminated ? state : { ...state, confirmation: null, terminated: true, announcement: action.announcement };
    case "confirm-mute-all": return { ...state, confirmation: null, participantMicrophones: Object.fromEntries(Object.entries(state.participantMicrophones).map(([id, value]) => [id, value === "unavailable" ? value : "muted"])), announcement: action.announcement };
    case "confirm-remove": return { ...state, confirmation: null, participantMicrophones: { ...state.participantMicrophones, [action.participantId]: "unavailable" }, participantCameras: { ...state.participantCameras, [action.participantId]: "unavailable" }, announcement: action.announcement };
    case "clear-focus-return": return { ...state, focusReturnId: null };
    case "set-reduced-motion": return { ...state, reducedMotion: action.value };
  }
}

export function meetingShortcut(key: string, target: "editable" | "surface", availablePanels: readonly MeetingPanelId[]): "microphone" | "camera" | "captions" | "hand-signal" | "participants" | null {
  if (target === "editable") return null;
  const command = ({ m: "microphone", v: "camera", c: "captions", r: "hand-signal", p: "participants" } as const)[key.toLowerCase() as "m" | "v" | "c" | "r" | "p"];
  return command === "participants" && !availablePanels.includes("participants") ? null : command ?? null;
}

export function filterMeetingRoster(model: ResolvedMeetingFixture, query: string): ResolvedRosterSection[] {
  const normalized = query.trim().toLocaleLowerCase();
  const matches = new Set(model.participants.filter(({ displayName }) => displayName.toLocaleLowerCase().includes(normalized)).map(({ id }) => id));
  return model.rosterSections.map((section) => ({ ...section, participantIds: section.participantIds.filter((id) => matches.has(id)) }));
}
