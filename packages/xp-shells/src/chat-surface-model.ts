export const CHAT_SURFACE_SOURCE_KEYS = [
  "chat-bubble-01",
  "chat-bubble-02",
  "chat-bubble-03",
  "chat-bubble-04",
] as const;

export type ChatSurfaceSourceKey = (typeof CHAT_SURFACE_SOURCE_KEYS)[number];
export type ChatSurfacePreset = "email-assist" | "team-support" | "assistant-home" | "companion-onboarding";
export type ChatSurfaceStress = "base" | "short" | "longLocale";
export type ChatPageKind = "capture" | "home" | "thread" | "knowledge" | "assistant-directory" | "onboarding";
export type ChatActionKind =
  | "open"
  | "minimize"
  | "back"
  | "navigate-page"
  | "navigate-route"
  | "submit-capture"
  | "send-message"
  | "select-tab"
  | "select-assistant"
  | "select-feature"
  | "use-suggestion"
  | "toggle-disclosure"
  | "dismiss-notice";

export type ChatControl = {
  id: string;
  type: "email" | "checkbox" | "search" | "textarea";
  required?: boolean;
  labelKey: string;
  placeholderKey?: string;
};

export type ChatPage = {
  id: string;
  kind: ChatPageKind;
  titleKey: string;
  bodyKeys: string[];
  actionIds: string[];
  messageIds?: string[];
  controls?: ChatControl[];
};

export type ChatAction = {
  id: string;
  kind: ChatActionKind;
  labelKey: string;
  href?: string;
  targetPageId?: string;
};

export type ChatMessage = {
  id: string;
  sender: "assistant" | "user" | "system";
  textKey: string;
  status?: "pending" | "sent" | "delivered" | "failed";
};

export type ChatMediaSeat = {
  id: string;
  kind: "portrait" | "resource-visual" | "assistant-illustration";
  assetId: string;
  altKey: string;
};

export type ChatCodeIdentity = {
  id: string;
  kind: "currentColor-vector";
  assetId: string;
};

export type ChatSurfaceFixture = {
  schemaVersion: 1;
  sourceKey: ChatSurfaceSourceKey;
  owner: "ChatSurface";
  preset: ChatSurfacePreset;
  initialPageId: string;
  pages: ChatPage[];
  actions: ChatAction[];
  initialMessages: ChatMessage[];
  media: ChatMediaSeat[];
  codeIdentities: ChatCodeIdentity[];
  stateKeys: Record<string, string>;
  copy: Record<ChatSurfaceStress, Record<string, string>>;
};

export type ResolvedChatAction = ChatAction & { label: string };
export type ResolvedChatMessage = Omit<ChatMessage, "textKey"> & { text: string };
export type ResolvedChatControl = ChatControl & { label: string; placeholder?: string };
export type ResolvedChatPage = Omit<ChatPage, "titleKey" | "bodyKeys" | "controls"> & {
  title: string;
  body: string[];
  controls: ResolvedChatControl[];
};
export type ResolvedChatMedia = ChatMediaSeat & {
  status: "ready";
  src: string;
  alt: string;
};
export type ResolvedChatIdentity = ChatCodeIdentity & { src: string };

export type ResolvedChatSurface = Omit<ChatSurfaceFixture, "pages" | "actions" | "initialMessages" | "media" | "codeIdentities" | "copy"> & {
  stress: ChatSurfaceStress;
  copy: Record<string, string>;
  pages: ResolvedChatPage[];
  actions: ResolvedChatAction[];
  initialMessages: ResolvedChatMessage[];
  media: ResolvedChatMedia[];
  codeIdentities: ResolvedChatIdentity[];
};

const EXPECTED: Record<ChatSurfaceSourceKey, {
  preset: ChatSurfacePreset;
  pages: string;
  actions: string;
  actionVector: string;
  pageVector: string;
  controls: string;
  messages: string;
  media: string;
  identities: string;
}> = {
  "chat-bubble-01": {
    preset: "email-assist",
    pages: "capture|home|thread",
    actions: "launcher|minimize|policy|capture-submit|open-thread|open-resource|tab-home|tab-chat|answer-1|answer-2|answer-3|back|send",
    actionVector: "launcher:open::|minimize:minimize::|policy:navigate-route::/demo/chat-bubble-01/privacy|capture-submit:submit-capture::|open-thread:navigate-page:thread:|open-resource:navigate-route::/demo/chat-bubble-01/resource|tab-home:select-tab:home:|tab-chat:select-tab:thread:|answer-1:toggle-disclosure::|answer-2:toggle-disclosure::|answer-3:toggle-disclosure::|back:back::|send:send-message::",
    pageVector: "capture:policy,capture-submit::email,agreement|home:open-thread,open-resource,tab-home,tab-chat,answer-1,answer-2,answer-3::answer-search|thread:back,send:message-1,message-2,message-3:composer",
    controls: "email:email:1|agreement:checkbox:1|answer-search:search:0|composer:textarea:1",
    messages: "message-1|message-2|message-3",
    media: "chat01-agent-portrait|chat01-resource-visual",
    identities: "chat01-surface-mark",
  },
  "chat-bubble-02": {
    preset: "team-support",
    pages: "help|thread|knowledge",
    actions: "launcher|minimize|open-chat|open-knowledge|tab-chat|tab-assistants|tab-search|assistant-1|assistant-2|assistant-3|assistant-4|assistant-5|assistant-6|back-thread|inline-email-submit|send|back-knowledge|knowledge-answer-1|knowledge-answer-2|knowledge-answer-3|contact",
    actionVector: "launcher:open::|minimize:minimize::|open-chat:navigate-page:thread:|open-knowledge:navigate-page:knowledge:|tab-chat:select-tab:thread:|tab-assistants:select-tab:thread:|tab-search:select-tab:knowledge:|assistant-1:select-assistant::|assistant-2:select-assistant::|assistant-3:select-assistant::|assistant-4:select-assistant::|assistant-5:select-assistant::|assistant-6:select-assistant::|back-thread:back::|inline-email-submit:submit-capture::|send:send-message::|back-knowledge:back::|knowledge-answer-1:toggle-disclosure::|knowledge-answer-2:toggle-disclosure::|knowledge-answer-3:toggle-disclosure::|contact:navigate-route::/demo/chat-bubble-02/contact",
    pageVector: "help:open-chat,open-knowledge::|thread:tab-chat,tab-assistants,tab-search,assistant-1,assistant-2,assistant-3,assistant-4,assistant-5,assistant-6,back-thread,inline-email-submit,send:message-1,message-2,message-3:inline-email,composer|knowledge:back-knowledge,knowledge-answer-1,knowledge-answer-2,knowledge-answer-3,contact::knowledge-search",
    controls: "inline-email:email:1|composer:textarea:1|knowledge-search:search:0",
    messages: "message-1|message-2|message-3",
    media: "chat02-team-1|chat02-team-2|chat02-team-3|chat02-team-4",
    identities: "chat02-surface-mark|chat02-assistant-1|chat02-assistant-2|chat02-assistant-3|chat02-assistant-4|chat02-assistant-5|chat02-assistant-6",
  },
  "chat-bubble-03": {
    preset: "assistant-home",
    pages: "home|thread",
    actions: "launcher|minimize|start|channel-1|channel-2|channel-3|channel-4|tab-home|tab-chat|back|suggestion-1|suggestion-2|suggestion-3|suggestion-4|policy|dismiss-policy|send",
    actionVector: "launcher:open::|minimize:minimize::|start:navigate-page:thread:|channel-1:navigate-route::/demo/chat-bubble-03/system-access|channel-2:navigate-route::/demo/chat-bubble-03/tool-requests|channel-3:navigate-route::/demo/chat-bubble-03/facilities|channel-4:navigate-route::/demo/chat-bubble-03/equipment|tab-home:select-tab:home:|tab-chat:select-tab:thread:|back:back::|suggestion-1:use-suggestion::|suggestion-2:use-suggestion::|suggestion-3:use-suggestion::|suggestion-4:use-suggestion::|policy:navigate-route::/demo/chat-bubble-03/retention|dismiss-policy:dismiss-notice::|send:send-message::",
    pageVector: "home:start,channel-1,channel-2,channel-3,channel-4,tab-home,tab-chat::|thread:back,suggestion-1,suggestion-2,suggestion-3,suggestion-4,policy,dismiss-policy,send:message-1:composer",
    controls: "composer:textarea:1",
    messages: "message-1",
    media: "chat03-home-agent|chat03-thread-agent",
    identities: "chat03-surface-mark|chat03-channel-1|chat03-channel-2|chat03-channel-3|chat03-channel-4",
  },
  "chat-bubble-04": {
    preset: "companion-onboarding",
    pages: "onboarding|home|thread",
    actions: "launcher|minimize|next|start|feature-1|feature-2|feature-3|feature-4|tab-home|tab-chat|back|send",
    actionVector: "launcher:open::|minimize:minimize::|next:navigate-page:home:|start:navigate-page:thread:|feature-1:select-feature::|feature-2:select-feature::|feature-3:select-feature::|feature-4:select-feature::|tab-home:select-tab:home:|tab-chat:select-tab:thread:|back:back::|send:send-message::",
    pageVector: "onboarding:next::|home:start,feature-1,feature-2,feature-3,feature-4,tab-home,tab-chat::|thread:back,send:message-1,message-2,message-3:composer",
    controls: "composer:textarea:1",
    messages: "message-1|message-2|message-3",
    media: "chat04-assistant-illustration|chat04-agent-portrait",
    identities: "chat04-surface-mark|chat04-feature-1|chat04-feature-2|chat04-feature-3|chat04-feature-4",
  },
};

const PUBLIC_MEDIA: Record<string, string> = {
  "dashboard-dialog-nadia-hassan": "/media/dashboard-dialog-nadia-hassan-avatar-256.avif",
  "about-us-origin-drafts": "/media/about-us-origin-drafts-1280.avif",
  "dashboard-dialog-beatriz-costa": "/media/dashboard-dialog-beatriz-costa-avatar-256.avif",
  "dashboard-dialog-darius-vasile": "/media/dashboard-dialog-darius-vasile-avatar-256.avif",
  "dashboard-dialog-aisha-khan": "/media/dashboard-dialog-aisha-khan-avatar-256.avif",
  "dashboard-dialog-hiroshi-tanaka": "/media/dashboard-dialog-hiroshi-tanaka-avatar-256.avif",
  "about-us-elara-vance": "/media/about-us-elara-vance-avatar-256.avif",
  "about-us-marco-silva": "/media/about-us-marco-silva-avatar-256.avif",
  "chat04-assistant-illustration": "/media/chat04-assistant-illustration.svg",
  "about-us-nina-tomas": "/media/about-us-nina-tomas-avatar-256.avif",
};

const ACTION_KINDS = new Set<ChatActionKind>([
  "open", "minimize", "back", "navigate-page", "navigate-route", "submit-capture", "send-message",
  "select-tab", "select-assistant", "select-feature", "use-suggestion", "toggle-disclosure", "dismiss-notice",
]);

function required(value: unknown, label: string, sourceKey: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${sourceKey} requires ${label}.`);
  return value;
}

function unique(values: string[], label: string, sourceKey: string) {
  if (new Set(values).size !== values.length) throw new Error(`${sourceKey} repeats ${label}.`);
}

function validateCopy(fixture: ChatSurfaceFixture, stress: ChatSurfaceStress) {
  const sets = (["base", "short", "longLocale"] as const).map((key) => Object.keys(fixture.copy[key] ?? {}).sort().join("|"));
  if (!sets[0] || sets.some((set) => set !== sets[0])) throw new Error(`${fixture.sourceKey} copy stress keys drift.`);
  for (const level of ["base", "short", "longLocale"] as const) {
    for (const [key, value] of Object.entries(fixture.copy[level])) {
      required(value, `${level} copy ${key}`, fixture.sourceKey);
      if (/[\u2013\u2014]/u.test(value)) throw new Error(`${fixture.sourceKey} ${level} copy ${key} contains a banned dash.`);
    }
  }
  return fixture.copy[stress];
}

function validateClosedVector(fixture: ChatSurfaceFixture) {
  const expected = EXPECTED[fixture.sourceKey];
  if (!expected) throw new Error(`Unknown ChatSurface source ${fixture.sourceKey}.`);
  const controls = fixture.pages.flatMap((page) => page.controls ?? []).map(({ id, type, required }) => `${id}:${type}:${required ? "1" : "0"}`).join("|");
  const actionVector = fixture.actions.map(({ id, kind, targetPageId, href }) => `${id}:${kind}:${targetPageId ?? ""}:${href ?? ""}`).join("|");
  const pageVector = fixture.pages.map(({ id, actionIds, messageIds, controls: pageControls }) => `${id}:${actionIds.join(",")}:${(messageIds ?? []).join(",")}:${(pageControls ?? []).map(({ id: controlId }) => controlId).join(",")}`).join("|");
  if (
    fixture.schemaVersion !== 1 || fixture.owner !== "ChatSurface" || fixture.preset !== expected.preset ||
    fixture.pages.map(({ id }) => id).join("|") !== expected.pages ||
    fixture.actions.map(({ id }) => id).join("|") !== expected.actions || actionVector !== expected.actionVector ||
    pageVector !== expected.pageVector || controls !== expected.controls ||
    fixture.initialMessages.map(({ id }) => id).join("|") !== expected.messages ||
    fixture.media.map(({ id }) => id).join("|") !== expected.media ||
    fixture.codeIdentities.map(({ id }) => id).join("|") !== expected.identities
  ) throw new Error(`${fixture.sourceKey} drifts from its closed source mapping.`);
}

export function resolveChatSurfaceFixture(fixture: ChatSurfaceFixture, stress: ChatSurfaceStress = "base"): ResolvedChatSurface {
  validateClosedVector(fixture);
  const sourceKey = fixture.sourceKey;
  const copy = validateCopy(fixture, stress);
  unique(fixture.pages.map(({ id }) => id), "page owner", sourceKey);
  unique(fixture.actions.map(({ id }) => id), "action owner", sourceKey);
  const pages = new Set(fixture.pages.map(({ id }) => id));
  const actions = new Map(fixture.actions.map((action) => [action.id, action]));
  unique(fixture.initialMessages.map(({ id }) => id), "message owner", sourceKey);
  unique(fixture.media.map(({ id }) => id), "media owner", sourceKey);
  unique(fixture.codeIdentities.map(({ id }) => id), "code identity", sourceKey);
  if (!pages.has(fixture.initialPageId)) throw new Error(`${sourceKey} initial page is missing.`);

  for (const page of fixture.pages) {
    required(copy[page.titleKey], `page title ${page.titleKey}`, sourceKey);
    for (const key of page.bodyKeys) required(copy[key], `page body ${key}`, sourceKey);
    for (const actionId of page.actionIds) if (!actions.has(actionId)) throw new Error(`${sourceKey} page ${page.id} references missing action ${actionId}.`);
    for (const messageId of page.messageIds ?? []) if (!fixture.initialMessages.some(({ id }) => id === messageId)) throw new Error(`${sourceKey} page ${page.id} references missing message ${messageId}.`);
    for (const control of page.controls ?? []) {
      required(copy[control.labelKey], `control label ${control.labelKey}`, sourceKey);
      if (control.placeholderKey) required(copy[control.placeholderKey], `control placeholder ${control.placeholderKey}`, sourceKey);
    }
  }

  for (const action of fixture.actions) {
    if (!ACTION_KINDS.has(action.kind)) throw new Error(`${sourceKey} action ${action.id} has no implementation.`);
    required(copy[action.labelKey], `action label ${action.labelKey}`, sourceKey);
    if (action.kind === "navigate-page" || action.kind === "select-tab") {
      if (!action.targetPageId || !pages.has(action.targetPageId)) throw new Error(`${sourceKey} action ${action.id} has a dangling page.`);
    }
    if (action.kind === "navigate-route" && (!action.href?.startsWith(`/demo/${sourceKey}/`) || action.href.includes("#") || /^(?:https?:)?\/\//i.test(action.href))) {
      throw new Error(`${sourceKey} action ${action.id} has an unsafe route.`);
    }
  }

  for (const message of fixture.initialMessages) required(copy[message.textKey], `message ${message.id}`, sourceKey);
  for (const key of Object.values(fixture.stateKeys)) required(copy[key], `state copy ${key}`, sourceKey);

  const resolvedMedia = fixture.media.map((media): ResolvedChatMedia => {
    const alt = required(copy[media.altKey], `media alt ${media.altKey}`, sourceKey);
    const src = PUBLIC_MEDIA[media.assetId];
    if (!src) throw new Error(`${sourceKey} media ${media.id} has no approved local delivery.`);
    return { ...media, status: "ready", src, alt };
  });

  return {
    ...fixture,
    stress,
    copy,
    pages: fixture.pages.map((page) => ({
      ...page,
      title: copy[page.titleKey]!,
      body: page.bodyKeys.map((key) => copy[key]!),
      controls: (page.controls ?? []).map((control) => ({
        ...control,
        label: copy[control.labelKey]!,
        placeholder: control.placeholderKey ? copy[control.placeholderKey] : undefined,
      })),
    })),
    actions: fixture.actions.map((action) => ({ ...action, label: copy[action.labelKey]! })),
    initialMessages: fixture.initialMessages.map(({ textKey, ...message }) => ({ ...message, text: copy[textKey]! })),
    media: resolvedMedia,
    codeIdentities: fixture.codeIdentities.map((identity) => ({ ...identity, src: `/media/${identity.assetId}.svg` })),
  };
}

export type ChatSubmitStatus = "idle" | "pending" | "success" | "error";
export type ChatCaptureStatus = "idle" | "invalid" | "pending" | "success" | "error";
export type ChatRuntimeMessage = ResolvedChatMessage & { retryable?: boolean };

export type ChatSessionState = {
  open: boolean;
  navigationStack: string[];
  draft: string;
  messages: ChatRuntimeMessage[];
  sendStatus: ChatSubmitStatus;
  unreadCount: number;
  emailValue: string;
  agreementChecked: boolean;
  captureStatus: ChatCaptureStatus;
  answerQuery: string;
  openAnswerIds: string[];
  activeTab: string;
  selectedAssistantId: string;
  inlineEmailValue: string;
  inlineEmailStatus: ChatCaptureStatus;
  knowledgeQuery: string;
  usedSuggestionIds: string[];
  policyDismissed: boolean;
  selectedFeatureId: string;
  mediaFallbackIds: string[];
  announcement: string;
};

export type ChatSessionAction =
  | { type: "open" }
  | { type: "minimize" }
  | { type: "navigate"; pageId: string }
  | { type: "back" }
  | { type: "set-draft"; value: string }
  | { type: "set-email"; value: string }
  | { type: "set-agreement"; value: boolean }
  | { type: "capture-status"; status: ChatCaptureStatus; announcement: string }
  | { type: "set-answer-query"; value: string }
  | { type: "toggle-answer"; id: string }
  | { type: "select-tab"; id: string; pageId: string }
  | { type: "select-assistant"; id: string; announcement: string }
  | { type: "set-inline-email"; value: string }
  | { type: "inline-email-status"; status: ChatCaptureStatus; announcement: string }
  | { type: "set-knowledge-query"; value: string }
  | { type: "use-suggestion"; id: string; text: string }
  | { type: "dismiss-policy"; announcement: string }
  | { type: "select-feature"; id: string; announcement: string }
  | { type: "send-start"; message: ChatRuntimeMessage; announcement: string }
  | { type: "send-success"; id: string; announcement: string }
  | { type: "send-error"; id: string; announcement: string }
  | { type: "send-retry"; id: string; announcement: string }
  | { type: "media-error"; id: string; announcement: string }
  | { type: "announce"; announcement: string };

export function createChatSessionState(model: ResolvedChatSurface, scenario: Partial<ChatSessionState> = {}): ChatSessionState {
  const defaults: ChatSessionState = {
    open: false,
    navigationStack: [model.initialPageId],
    draft: "",
    messages: model.initialMessages,
    sendStatus: "idle",
    unreadCount: 0,
    emailValue: "",
    agreementChecked: false,
    captureStatus: "idle",
    answerQuery: "",
    openAnswerIds: [],
    activeTab: model.sourceKey === "chat-bubble-02" ? "tab-chat" : "tab-home",
    selectedAssistantId: "assistant-1",
    inlineEmailValue: "",
    inlineEmailStatus: "idle",
    knowledgeQuery: "",
    usedSuggestionIds: [],
    policyDismissed: false,
    selectedFeatureId: "feature-1",
    mediaFallbackIds: [],
    announcement: "",
  };
  const scenarioState = Object.fromEntries(Object.entries(scenario).filter(([key, value]) => key !== "open" && key in defaults && value !== undefined)) as Partial<ChatSessionState>;
  return { ...defaults, ...scenarioState };
}

export function chatSessionReducer(state: ChatSessionState, action: ChatSessionAction): ChatSessionState {
  if (action.type === "open") return { ...state, open: true, unreadCount: 0 };
  if (action.type === "minimize") return { ...state, open: false };
  if (action.type === "navigate") return state.navigationStack.at(-1) === action.pageId ? state : { ...state, navigationStack: [...state.navigationStack, action.pageId] };
  if (action.type === "back") return state.navigationStack.length > 1 ? { ...state, navigationStack: state.navigationStack.slice(0, -1) } : state;
  if (action.type === "set-draft") return { ...state, draft: action.value };
  if (action.type === "set-email") return { ...state, emailValue: action.value, captureStatus: "idle" };
  if (action.type === "set-agreement") return { ...state, agreementChecked: action.value, captureStatus: "idle" };
  if (action.type === "capture-status") return { ...state, captureStatus: action.status, announcement: action.announcement };
  if (action.type === "set-answer-query") return { ...state, answerQuery: action.value };
  if (action.type === "toggle-answer") return { ...state, openAnswerIds: state.openAnswerIds.includes(action.id) ? state.openAnswerIds.filter((id) => id !== action.id) : [...state.openAnswerIds, action.id] };
  if (action.type === "select-tab") return { ...state, activeTab: action.id, navigationStack: [...state.navigationStack.slice(0, -1), action.pageId] };
  if (action.type === "select-assistant") return { ...state, selectedAssistantId: action.id, announcement: action.announcement };
  if (action.type === "set-inline-email") return { ...state, inlineEmailValue: action.value, inlineEmailStatus: "idle" };
  if (action.type === "inline-email-status") return { ...state, inlineEmailStatus: action.status, announcement: action.announcement };
  if (action.type === "set-knowledge-query") return { ...state, knowledgeQuery: action.value };
  if (action.type === "use-suggestion") {
    if (state.usedSuggestionIds.includes(action.id)) return state;
    return { ...state, usedSuggestionIds: [...state.usedSuggestionIds, action.id], messages: [...state.messages, { id: `used-${action.id}`, sender: "user", text: action.text, status: "delivered" }], announcement: action.text };
  }
  if (action.type === "dismiss-policy") return { ...state, policyDismissed: true, announcement: action.announcement };
  if (action.type === "select-feature") return { ...state, selectedFeatureId: action.id, announcement: action.announcement };
  if (action.type === "send-start") return { ...state, draft: "", sendStatus: "pending", messages: [...state.messages, action.message], announcement: action.announcement };
  if (action.type === "send-success") return { ...state, sendStatus: "success", messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "sent", retryable: false } : message), announcement: action.announcement };
  if (action.type === "send-error") return { ...state, sendStatus: "error", messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "failed", retryable: true } : message), announcement: action.announcement };
  if (action.type === "send-retry") return { ...state, sendStatus: "pending", messages: state.messages.map((message) => message.id === action.id ? { ...message, status: "pending", retryable: false } : message), announcement: action.announcement };
  if (action.type === "media-error") return state.mediaFallbackIds.includes(action.id) ? state : { ...state, mediaFallbackIds: [...state.mediaFallbackIds, action.id], announcement: action.announcement };
  if (action.type === "announce") return { ...state, announcement: action.announcement };
  return state;
}

export function activeChatPage(model: ResolvedChatSurface, state: ChatSessionState) {
  const id = state.navigationStack.at(-1) ?? model.initialPageId;
  return model.pages.find((page) => page.id === id) ?? model.pages[0]!;
}
