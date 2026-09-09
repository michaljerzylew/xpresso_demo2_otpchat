"use client";

import { AdaptiveOverlay, DeviceClassProvider, useDeviceClass, type DeviceClass } from "@xp/primitives";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type UIEvent,
} from "react";
import {
  activeChatPage,
  chatSessionReducer,
  createChatSessionState,
  type ChatSessionAction,
  type ChatSessionState,
  type ResolvedChatAction,
  type ResolvedChatMedia,
  type ResolvedChatSurface,
} from "./chat-surface-model";

export type ChatSurfaceScenario = Partial<ChatSessionState> & {
  initialOpen?: boolean;
  captureOutcome?: "success" | "error";
  inlineEmailOutcome?: "success" | "error";
  sendOutcome?: "success" | "error";
  hostPaneGrant?: boolean;
};

export type ChatSurfaceControllerValue = {
  state: ChatSessionState;
  dispatch: (action: ChatSessionAction) => void;
  open: () => void;
  minimize: () => void;
  invoke: (actionId: string) => void;
  submitCapture: () => void;
  submitInlineEmail: () => void;
  submitMessage: () => void;
  retryMessage: (id: string) => void;
};

export type ChatSurfaceProperties = {
  model: ResolvedChatSurface;
  deviceClass?: DeviceClass;
  scenario?: ChatSurfaceScenario;
};

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(value.trim());

function stateCopy(model: ResolvedChatSurface, key: string, fallback: string) {
  const copyKey = model.stateKeys[key];
  return copyKey ? model.copy[copyKey] ?? fallback : fallback;
}

export function ChatSurfaceController({
  model,
  scenario,
  children,
}: {
  model: ResolvedChatSurface;
  scenario?: ChatSurfaceScenario;
  children: (controller: ChatSurfaceControllerValue) => ReactNode;
}) {
  const initialScenario = useRef(scenario);
  const [state, dispatch] = useReducer(chatSessionReducer, model, (value) => createChatSessionState(value, initialScenario.current));
  const serial = useRef(0);

  useEffect(() => {
    if (scenario?.initialOpen || scenario?.hostPaneGrant) dispatch({ type: "open" });
  }, [scenario?.hostPaneGrant, scenario?.initialOpen]);

  const actions = useMemo(() => new Map(model.actions.map((action) => [action.id, action])), [model.actions]);
  const navigate = useCallback((action: ResolvedChatAction) => {
    if (!action.targetPageId) return;
    if (action.kind === "select-tab") dispatch({ type: "select-tab", id: action.id, pageId: action.targetPageId });
    else dispatch({ type: "navigate", pageId: action.targetPageId });
  }, []);

  const submitCapture = useCallback(() => {
    if (!validEmail(state.emailValue)) {
      dispatch({ type: "capture-status", status: "invalid", announcement: stateCopy(model, "emailInvalid", "Enter a valid email address.") });
      return;
    }
    if (!state.agreementChecked) {
      dispatch({ type: "capture-status", status: "invalid", announcement: stateCopy(model, "consentRequired", "Accept the terms to continue.") });
      return;
    }
    dispatch({ type: "capture-status", status: "pending", announcement: stateCopy(model, "capturePending", "Checking details.") });
    queueMicrotask(() => {
      if (scenario?.captureOutcome === "error") dispatch({ type: "capture-status", status: "error", announcement: stateCopy(model, "captureError", "Submission failed.") });
      else {
        dispatch({ type: "capture-status", status: "success", announcement: stateCopy(model, "captureSuccess", "Details confirmed.") });
        dispatch({ type: "navigate", pageId: "home" });
      }
    });
  }, [model, scenario?.captureOutcome, state.agreementChecked, state.emailValue]);

  const submitInlineEmail = useCallback(() => {
    if (!validEmail(state.inlineEmailValue)) {
      dispatch({ type: "inline-email-status", status: "invalid", announcement: stateCopy(model, "inlineEmailInvalid", "Enter a valid email address.") });
      return;
    }
    dispatch({ type: "inline-email-status", status: "pending", announcement: stateCopy(model, "inlineEmailPending", "Checking address.") });
    queueMicrotask(() => dispatch(scenario?.inlineEmailOutcome === "error"
      ? { type: "inline-email-status", status: "error", announcement: stateCopy(model, "inlineEmailError", "Address confirmation failed.") }
      : { type: "inline-email-status", status: "success", announcement: stateCopy(model, "inlineEmailSuccess", "Address confirmed.") }));
  }, [model, scenario?.inlineEmailOutcome, state.inlineEmailValue]);

  const submitMessage = useCallback(() => {
    const body = state.draft.trim();
    if (!body || state.sendStatus === "pending") {
      if (!body) dispatch({ type: "announce", announcement: stateCopy(model, "emptyDraft", "Write a message before sending.") });
      return;
    }
    const id = `message-local-${++serial.current}`;
    dispatch({
      type: "send-start",
      message: { id, sender: "user", text: body, status: "pending" },
      announcement: stateCopy(model, "sendPending", "Sending message."),
    });
    queueMicrotask(() => dispatch(scenario?.sendOutcome === "error"
      ? { type: "send-error", id, announcement: stateCopy(model, "sendError", "Message failed.") }
      : { type: "send-success", id, announcement: stateCopy(model, "sendSuccess", "Message sent.") }));
  }, [model, scenario?.sendOutcome, state.draft, state.sendStatus]);

  const retryMessage = useCallback((id: string) => {
    dispatch({ type: "send-retry", id, announcement: stateCopy(model, "sendPending", "Retrying message.") });
    queueMicrotask(() => dispatch({ type: "send-success", id, announcement: stateCopy(model, "sendSuccess", "Message sent.") }));
  }, [model]);

  const invoke = useCallback((actionId: string) => {
    const action = actions.get(actionId);
    if (!action) return;
    if (action.kind === "open") dispatch({ type: "open" });
    else if (action.kind === "minimize") dispatch({ type: "minimize" });
    else if (action.kind === "back") {
      const targetPageId = state.navigationStack.at(-2);
      const targetTab = targetPageId ? model.actions.find((candidate) => candidate.kind === "select-tab" && candidate.targetPageId === targetPageId) : undefined;
      dispatch({ type: "back" });
      if (targetPageId && targetTab) dispatch({ type: "select-tab", id: targetTab.id, pageId: targetPageId });
    }
    else if (action.kind === "navigate-page" || action.kind === "select-tab") {
      navigate(action);
      if (actionId === "open-chat" || actionId === "open-thread" || actionId === "start") {
        const tab = actions.get("tab-chat");
        if (tab?.targetPageId) dispatch({ type: "select-tab", id: tab.id, pageId: tab.targetPageId });
      } else if (actionId === "open-knowledge") {
        const tab = actions.get("tab-search");
        if (tab?.targetPageId) dispatch({ type: "select-tab", id: tab.id, pageId: tab.targetPageId });
      } else if (actionId === "next") {
        const tab = actions.get("tab-home");
        if (tab?.targetPageId) dispatch({ type: "select-tab", id: tab.id, pageId: tab.targetPageId });
      }
    }
    else if (action.kind === "submit-capture") model.sourceKey === "chat-bubble-02" ? submitInlineEmail() : submitCapture();
    else if (action.kind === "send-message") submitMessage();
    else if (action.kind === "toggle-disclosure") dispatch({ type: "toggle-answer", id: action.id });
    else if (action.kind === "select-assistant") dispatch({ type: "select-assistant", id: action.id, announcement: `${action.label}: ${stateCopy(model, "assistantSelected", "Selected")}` });
    else if (action.kind === "select-feature") dispatch({ type: "select-feature", id: action.id, announcement: `${action.label}: ${stateCopy(model, "featureSelected", "Selected")}` });
    else if (action.kind === "use-suggestion") dispatch({ type: "use-suggestion", id: action.id, text: action.label });
    else if (action.kind === "dismiss-notice") dispatch({ type: "dismiss-policy", announcement: stateCopy(model, "policyDismissed", "Notice dismissed.") });
  }, [actions, model, navigate, state.navigationStack, submitCapture, submitInlineEmail, submitMessage]);

  return children({
    state,
    dispatch,
    open: () => dispatch({ type: "open" }),
    minimize: () => dispatch({ type: "minimize" }),
    invoke,
    submitCapture,
    submitInlineEmail,
    submitMessage,
    retryMessage,
  });
}

function action(model: ResolvedChatSurface, id: string) {
  const value = model.actions.find((candidate) => candidate.id === id);
  if (!value) throw new Error(`${model.sourceKey} is missing action ${id}.`);
  return value;
}

function media(model: ResolvedChatSurface, id: string) {
  return model.media.find((candidate) => candidate.id === id);
}

function identity(model: ResolvedChatSurface, id: string) {
  return model.codeIdentities.find((candidate) => candidate.id === id);
}

function pageDescription(model: ResolvedChatSurface, controller: ChatSurfaceControllerValue) {
  const page = activeChatPage(model, controller.state);
  return page.kind === "thread" ? model.copy.threadStatus : page.body[0];
}

function Mark({ model }: { model: ResolvedChatSurface }) {
  const mark = model.codeIdentities.find(({ id }) => id.endsWith("surface-mark"));
  return mark ? <img className="xp-chat-surface__mark" src={mark.src} alt="" aria-hidden="true" /> : null;
}

function LocalMedia({ model, seat, className, forceFallback = false }: { model: ResolvedChatSurface; seat?: ResolvedChatMedia; className?: string; forceFallback?: boolean }) {
  const [failed, setFailed] = useState(false);
  const fallback = seat ? model.sourceKey === "chat-bubble-04" && seat.kind === "assistant-illustration"
    ? stateCopy(model, "illustrationFallback", "Illustration unavailable")
    : stateCopy(model, "mediaFallback", "Media unavailable") : "Media unavailable";
  return !seat || failed || forceFallback ? (
    <div className={["xp-chat-surface__media-status", className].filter(Boolean).join(" ")} data-media-status={failed || forceFallback ? "fallback" : "missing"} role="status">
      <strong>{fallback}</strong>
    </div>
  ) : (
    <img
      className={className}
      src={seat.src}
      alt={seat.alt}
      data-media-seat={seat.id}
      onError={() => setFailed(true)}
    />
  );
}

function Tabs({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const page = activeChatPage(model, controller.state);
  const candidates = model.sourceKey === "chat-bubble-02" ? ["tab-chat", "tab-assistants", "tab-search"] : model.actions.some(({ id }) => id === "tab-home") ? ["tab-home", "tab-chat"] : [];
  const ids = candidates.filter((id) => page.actionIds.includes(id));
  if (!ids.length) return null;
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % ids.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + ids.length) % ids.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = ids.length - 1;
    else return;
    event.preventDefault();
    const id = ids[next]!;
    controller.invoke(id);
    document.querySelector<HTMLButtonElement>(`[data-source-key="${model.sourceKey}"] [data-chat-tab="${id}"]`)?.focus();
  };
  return <div className="xp-chat-surface__tabs" role="tablist" aria-label={model.sourceKey === "chat-bubble-02" ? model.copy.threadTitle : model.copy.homeHeading}>
    {ids.map((id, index) => {
      const item = action(model, id);
      const selected = controller.state.activeTab === id;
      return <button key={id} id={`${model.sourceKey}-${id}`} type="button" role="tab" data-chat-tab={id} aria-controls={`${model.sourceKey}-chat-panel`} aria-selected={selected} tabIndex={selected ? 0 : -1} onKeyDown={(event) => onKeyDown(event, index)} onClick={() => controller.invoke(id)}>{item.label}</button>;
    })}
  </div>;
}

function TeamCluster({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  return <div className="xp-chat-surface__team" aria-label={model.copy.helpBody}>
    {model.media.map((seat) => <LocalMedia key={seat.id} model={model} seat={seat} forceFallback={controller.state.mediaFallbackIds.includes(seat.id)} className="xp-chat-surface__avatar" />)}
    <Mark model={model}/>
  </div>;
}

function CapturePage({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const status = controller.state.captureStatus;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); controller.submitCapture(); };
  return <form className="xp-chat-surface__capture" onSubmit={submit} noValidate>
    <p>{model.copy.captureBody}</p>
    <label className="xp-chat-surface__field" htmlFor={`${model.sourceKey}-email`}><span>{model.copy.emailLabel}</span><input data-chat-autofocus id={`${model.sourceKey}-email`} type="email" inputMode="email" autoComplete="email" value={controller.state.emailValue} placeholder={model.copy.emailPlaceholder} aria-invalid={status === "invalid" || status === "error" || undefined} aria-describedby={`${model.sourceKey}-capture-status`} onChange={(event) => controller.dispatch({ type: "set-email", value: event.currentTarget.value })}/></label>
    <label className="xp-chat-surface__check"><input type="checkbox" checked={controller.state.agreementChecked} onChange={(event) => controller.dispatch({ type: "set-agreement", value: event.currentTarget.checked })}/><span>{model.copy.agreementLabel}</span></label>
    <a className="xp-chat-surface__text-link" href={action(model, "policy").href}>{action(model, "policy").label}</a>
    <button className="xp-chat-surface__primary" type="submit" disabled={status === "pending"}>{status === "pending" ? model.copy.capturePending : action(model, "capture-submit").label}</button>
    <p id={`${model.sourceKey}-capture-status`} className="xp-chat-surface__status" role={status === "invalid" || status === "error" ? "alert" : "status"}>{status === "invalid" ? controller.state.announcement : status === "error" ? model.copy.captureError : status === "success" ? model.copy.captureSuccess : ""}</p>
  </form>;
}

function Answers({ model, controller, knowledge = false }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue; knowledge?: boolean }) {
  const prefix = knowledge ? "knowledge-answer" : "answer";
  const query = knowledge ? controller.state.knowledgeQuery : controller.state.answerQuery;
  const matches = [1, 2, 3].filter((number) => `${model.copy[`q${number}`]} ${model.copy[`a${number}`]}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="xp-chat-surface__answers" aria-label={knowledge ? model.copy.knowledgeHeading : model.copy.answerSearchLabel}>
    <label className="xp-chat-surface__field" htmlFor={`${model.sourceKey}-${knowledge ? "knowledge" : "answer"}-search`}><span>{knowledge ? model.copy.knowledgeSearchLabel : model.copy.answerSearchLabel}</span><input id={`${model.sourceKey}-${knowledge ? "knowledge" : "answer"}-search`} type="search" value={query} placeholder={knowledge ? model.copy.knowledgeSearchPlaceholder : model.copy.answerSearchPlaceholder} onChange={(event) => controller.dispatch({ type: knowledge ? "set-knowledge-query" : "set-answer-query", value: event.currentTarget.value })}/></label>
    {!matches.length ? <p className="xp-chat-surface__empty" role="status">{knowledge ? model.copy.knowledgeNoResults : model.copy.answerNoResults}</p> : <div>{matches.map((number) => {
      const id = `${prefix}-${number}`;
      const open = controller.state.openAnswerIds.includes(id);
      return <section key={id} className="xp-chat-surface__answer"><h3><button type="button" aria-expanded={open} aria-controls={`${model.sourceKey}-${id}-panel`} onClick={() => controller.invoke(id)}>{model.copy[`q${number}`]}<span aria-hidden="true">{open ? "−" : "+"}</span></button></h3>{open ? <p id={`${model.sourceKey}-${id}-panel`}>{model.copy[`a${number}`]}</p> : null}</section>;
    })}</div>}
  </section>;
}

function EmailAssistHome({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  return <div className="xp-chat-surface__home">
    <Tabs model={model} controller={controller}/>
    <p>{model.copy.homeBody}</p>
    <button className="xp-chat-surface__primary" type="button" onClick={() => controller.invoke("open-thread")}>{action(model, "open-thread").label}</button>
    <article className="xp-chat-surface__resource">
      <LocalMedia model={model} seat={media(model, "chat01-resource-visual")} forceFallback={controller.state.mediaFallbackIds.includes("chat01-resource-visual")} className="xp-chat-surface__resource-image"/>
      <div><h3>{model.copy.resourceHeading}</h3><p>{model.copy.resourceBody}</p><a href={action(model, "open-resource").href}>{action(model, "open-resource").label}</a></div>
    </article>
    <Answers model={model} controller={controller}/>
  </div>;
}

function TeamSupportHome({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  return <div className="xp-chat-surface__help">
    <p>{model.copy.helpBody}</p><strong className="xp-chat-surface__availability">{model.copy.availability}</strong>
    <TeamCluster model={model} controller={controller}/>
    <div className="xp-chat-surface__choices">
      <button className="xp-chat-surface__primary" type="button" onClick={() => controller.invoke("open-chat")}><span>{action(model, "open-chat").label}</span><small>{model.copy.chatChoiceBody}</small></button>
      <button type="button" onClick={() => controller.invoke("open-knowledge")}><span>{action(model, "open-knowledge").label}</span><small>{model.copy.knowledgeChoiceBody}</small></button>
    </div>
  </div>;
}

function AssistantHome({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const homeAgent = media(model, "chat03-home-agent");
  return <div className="xp-chat-surface__home xp-chat-surface__home--assistant">
    <Tabs model={model} controller={controller}/>
    <div className="xp-chat-surface__identity"><LocalMedia model={model} seat={homeAgent} forceFallback={controller.state.mediaFallbackIds.includes("chat03-home-agent")} className="xp-chat-surface__avatar"/><div><strong>{model.copy.homeAgentName}</strong><span>{model.copy.homeAgentRole}</span></div></div>
    <p>{model.copy.homeBody}</p>
    <button className="xp-chat-surface__primary" type="button" onClick={() => controller.invoke("start")}>{action(model, "start").label}</button>
    <nav className="xp-chat-surface__channels" aria-label={model.copy.homeHeading}>{[1, 2, 3, 4].map((number) => {
      const item = action(model, `channel-${number}`);
      const icon = identity(model, `chat03-channel-${number}`);
      return <a href={item.href} key={item.id}>{icon ? <img src={icon.src} alt=""/> : null}<span><strong>{model.copy[`channel${number}Name`]}</strong><small>{model.copy[`channel${number}Purpose`]}</small></span></a>;
    })}</nav>
  </div>;
}

function FeatureHome({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const choose = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!event.key.startsWith("Arrow")) return;
    event.preventDefault();
    const next = event.key === "ArrowRight" || event.key === "ArrowDown" ? (index + 1) % 4 : (index + 3) % 4;
    controller.invoke(`feature-${next + 1}`);
    document.querySelector<HTMLButtonElement>(`[data-source-key="${model.sourceKey}"] [data-feature-id="feature-${next + 1}"]`)?.focus();
  };
  return <div className="xp-chat-surface__home xp-chat-surface__home--features">
    <Tabs model={model} controller={controller}/><p>{model.copy.homeBody}</p>
    <button className="xp-chat-surface__primary" type="button" onClick={() => controller.invoke("start")}>{action(model, "start").label}</button>
    <div className="xp-chat-surface__features" role="radiogroup" aria-label={model.copy.featureGroupLabel}>{[1, 2, 3, 4].map((number, index) => {
      const id = `feature-${number}`;
      const selected = controller.state.selectedFeatureId === id;
      const icon = identity(model, `chat04-feature-${number}`);
      return <button type="button" role="radio" data-feature-id={id} aria-checked={selected} tabIndex={selected ? 0 : -1} key={id} onKeyDown={(event) => choose(event, index)} onClick={() => controller.invoke(id)}>{icon ? <img src={icon.src} alt=""/> : null}<span><strong>{model.copy[`feature${number}Name`]}</strong><small>{model.copy[`feature${number}Body`]}</small></span></button>;
    })}</div>
  </div>;
}

function OnboardingPage({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const illustration = media(model, "chat04-assistant-illustration");
  return <div className="xp-chat-surface__onboarding">
    <p>{model.copy.onboardingBody}</p>
    <LocalMedia model={model} seat={illustration} forceFallback={controller.state.mediaFallbackIds.includes("chat04-assistant-illustration")} className="xp-chat-surface__illustration"/>
    <button className="xp-chat-surface__primary" type="button" onClick={() => controller.invoke("next")}>{action(model, "next").label}<span aria-hidden="true">→</span></button>
  </div>;
}

function AssistantsDirectory({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  return <div className="xp-chat-surface__directory" role="list" aria-label={model.copy.assistantsTab}>{[1, 2, 3, 4, 5, 6].map((number) => {
    const id = `assistant-${number}`;
    const icon = identity(model, `chat02-assistant-${number}`);
    return <div role="listitem" key={id}><button type="button" aria-pressed={controller.state.selectedAssistantId === id} onClick={() => controller.invoke(id)}>{icon ? <img src={icon.src} alt=""/> : null}<span><strong>{model.copy[`assistant${number}Name`]}</strong><small>{model.copy[`assistant${number}Role`]}</small></span></button></div>;
  })}</div>;
}

function ThreadPage({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const assistantDirectory = model.sourceKey === "chat-bubble-02" && controller.state.activeTab === "tab-assistants";
  const threadAgent = model.sourceKey === "chat-bubble-03" ? media(model, "chat03-thread-agent") : model.sourceKey === "chat-bubble-04" ? media(model, "chat04-agent-portrait") : model.sourceKey === "chat-bubble-01" ? media(model, "chat01-agent-portrait") : undefined;
  const inlineStatus = controller.state.inlineEmailStatus;
  return <div className="xp-chat-surface__thread">
    <Tabs model={model} controller={controller}/>
    {assistantDirectory ? <AssistantsDirectory model={model} controller={controller}/> : <>
      {threadAgent ? <div className="xp-chat-surface__identity"><LocalMedia model={model} seat={threadAgent} forceFallback={controller.state.mediaFallbackIds.includes(threadAgent.id)} className="xp-chat-surface__avatar"/><div><strong>{model.copy.agentName ?? model.copy.threadAgentName}</strong><span>{model.copy.agentRole ?? model.copy.threadAgentRole}</span></div></div> : null}
      {model.sourceKey === "chat-bubble-02" ? <form className="xp-chat-surface__inline-email" onSubmit={(event) => { event.preventDefault(); controller.submitInlineEmail(); }} noValidate><label className="xp-chat-surface__field" htmlFor={`${model.sourceKey}-inline-email`}><span>{model.copy.inlineEmailLabel}</span><input id={`${model.sourceKey}-inline-email`} type="email" value={controller.state.inlineEmailValue} placeholder={model.copy.inlineEmailPlaceholder} aria-invalid={inlineStatus === "invalid" || inlineStatus === "error" || undefined} onChange={(event) => controller.dispatch({ type: "set-inline-email", value: event.currentTarget.value })}/></label><button type="submit" disabled={inlineStatus === "pending"}>{inlineStatus === "pending" ? model.copy.inlineEmailPending : model.copy.inlineEmailSubmit}</button>{inlineStatus !== "idle" && inlineStatus !== "pending" ? <p role={inlineStatus === "success" ? "status" : "alert"}>{inlineStatus === "success" ? model.copy.inlineEmailSuccess : controller.state.announcement}</p> : null}</form> : null}
      <ol className="xp-chat-surface__messages" data-chat-history aria-label={model.copy.threadTitle} aria-live="polite">{controller.state.messages.map((message) => <li key={message.id} data-sender={message.sender} data-status={message.status}><p>{message.text}</p><small>{message.status === "pending" ? model.copy.sendPending : message.status === "failed" ? model.copy.sendError : message.status === "sent" ? model.copy.sendSuccess : model.copy.threadStatus}</small>{message.retryable ? <button type="button" onClick={() => controller.retryMessage(message.id)}>{action(model, "send").label}</button> : null}</li>)}</ol>
      {model.sourceKey === "chat-bubble-03" ? <><div className="xp-chat-surface__suggestions" aria-label={model.copy.useSuggestion}>{[1, 2, 3, 4].filter((number) => !controller.state.usedSuggestionIds.includes(`suggestion-${number}`)).map((number) => <button type="button" key={number} onClick={() => controller.invoke(`suggestion-${number}`)}>{model.copy[`suggestion${number}`]}</button>)}</div>{!controller.state.policyDismissed ? <aside className="xp-chat-surface__notice"><p>{model.copy.policyNotice}</p><a href={action(model, "policy").href}>{action(model, "policy").label}</a><button type="button" onClick={() => controller.invoke("dismiss-policy")}>{action(model, "dismiss-policy").label}</button></aside> : null}</> : null}
    </>}
  </div>;
}

function KnowledgePage({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  return <div className="xp-chat-surface__knowledge"><Tabs model={model} controller={controller}/><p>{model.copy.knowledgeBody}</p><Answers model={model} controller={controller} knowledge/><aside><strong>{model.copy.contactLabel}</strong><p>{model.copy.contactBody}</p><a href={action(model, "contact").href}>{action(model, "contact").label}</a></aside></div>;
}

function PageBody({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const page = activeChatPage(model, controller.state);
  if (page.kind === "capture") return <CapturePage model={model} controller={controller}/>;
  if (page.kind === "onboarding") return <OnboardingPage model={model} controller={controller}/>;
  if (page.kind === "thread") return <ThreadPage model={model} controller={controller}/>;
  if (page.kind === "knowledge") return <KnowledgePage model={model} controller={controller}/>;
  if (model.sourceKey === "chat-bubble-01") return <EmailAssistHome model={model} controller={controller}/>;
  if (model.sourceKey === "chat-bubble-02") return <TeamSupportHome model={model} controller={controller}/>;
  if (model.sourceKey === "chat-bubble-03") return <AssistantHome model={model} controller={controller}/>;
  return <FeatureHome model={model} controller={controller}/>;
}

function PagePanel({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const page = activeChatPage(model, controller.state);
  const tabbed = page.actionIds.some((id) => id.startsWith("tab-"));
  return <div data-chat-content-owner="ChatSurface" data-chat-page={page.id} id={tabbed ? `${model.sourceKey}-chat-panel` : undefined} role={tabbed ? "tabpanel" : undefined} aria-labelledby={tabbed ? `${model.sourceKey}-${controller.state.activeTab}` : undefined}><PageBody model={model} controller={controller}/></div>;
}

function trackReaderPosition(event: UIEvent<HTMLDivElement>) {
  const owner = event.currentTarget;
  owner.dataset.chatReaderAboveEnd = String(owner.scrollHeight - owner.scrollTop - owner.clientHeight > 48);
}

function preserveLatestMessageContext(event: FocusEvent<HTMLTextAreaElement>) {
  const surface = event.currentTarget.closest<HTMLElement>(".xp-chat-surface");
  const owner = surface?.querySelector<HTMLElement>(".xp-overlay-body, .xp-chat-surface--pane > .xp-chat-surface__body");
  if (!owner || owner.dataset.chatReaderAboveEnd === "true") return;
  const reveal = () => {
    const latest = owner.querySelector<HTMLElement>("[data-chat-history] > li:last-child");
    if (!latest || owner.dataset.chatReaderAboveEnd === "true") return;
    const ownerBounds = owner.getBoundingClientRect();
    const latestBounds = latest.getBoundingClientRect();
    const hiddenBelow = latestBounds.bottom - (ownerBounds.bottom - 12);
    if (hiddenBelow > 0) owner.scrollTo({ top: Math.min(owner.scrollHeight - owner.clientHeight, owner.scrollTop + hiddenBelow), behavior: "auto" });
  };
  requestAnimationFrame(() => requestAnimationFrame(reveal));
}

function Composer({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const page = activeChatPage(model, controller.state);
  if (page.kind !== "thread" || (model.sourceKey === "chat-bubble-02" && controller.state.activeTab === "tab-assistants")) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); controller.submitMessage(); };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault(); controller.submitMessage();
  };
  return <form className="xp-chat-surface__composer" onSubmit={submit}><label htmlFor={`${model.sourceKey}-composer`}>{model.copy.composerLabel}</label><div><textarea id={`${model.sourceKey}-composer`} rows={2} value={controller.state.draft} placeholder={model.copy.composerPlaceholder} onFocus={preserveLatestMessageContext} onKeyDown={onKeyDown} onChange={(event) => controller.dispatch({ type: "set-draft", value: event.currentTarget.value })}/><button type="submit" disabled={controller.state.sendStatus === "pending"}>{action(model, "send").label}</button></div></form>;
}

function BackControl({ model, controller }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue }) {
  const page = activeChatPage(model, controller.state);
  const backAction = model.actions.find(({ id, kind }) => kind === "back" && page.actionIds.includes(id));
  if (controller.state.navigationStack.length <= 1 || !backAction) return null;
  return <button className="xp-chat-surface__back" type="button" aria-label={backAction.label} onClick={() => controller.invoke(backAction.id)}><span aria-hidden="true">←</span></button>;
}

function PaneSurface({ model, controller, deviceClass }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue; deviceClass: DeviceClass }) {
  const page = activeChatPage(model, controller.state);
  return <aside className="xp-chat-surface xp-chat-surface--pane" data-xp-owner="ChatSurface" data-controller-owner="ChatSurfaceController" data-source-key={model.sourceKey} data-chat-preset={model.preset} data-device-class={deviceClass} data-presentation="pane" data-stress={model.stress} aria-label={page.title}>
    <header className="xp-chat-surface__pane-header"><BackControl model={model} controller={controller}/><Mark model={model}/><div><h2 tabIndex={-1} data-chat-heading>{page.title}</h2><span>{pageDescription(model, controller)}</span></div></header>
    <div className="xp-chat-surface__body" data-chat-reader-above-end="false" onScroll={trackReaderPosition}><PagePanel model={model} controller={controller}/></div>
    <Composer model={model} controller={controller}/>
    <p className="xp-chat-surface__announcer" role="status" aria-live="polite">{controller.state.announcement}</p>
  </aside>;
}

function OverlaySurface({ model, controller, deviceClass }: { model: ResolvedChatSurface; controller: ChatSurfaceControllerValue; deviceClass: DeviceClass }) {
  const page = activeChatPage(model, controller.state);
  const launcher = action(model, "launcher");
  const wasOpen = useRef(false);
  useEffect(() => {
    if (controller.state.open) {
      requestAnimationFrame(() => {
        const required = document.querySelector<HTMLElement>(`[data-source-key="${model.sourceKey}"] [data-chat-autofocus]`);
        const heading = document.querySelector<HTMLElement>(`[data-source-key="${model.sourceKey}"] [data-chat-heading]`);
        (required ?? heading)?.focus();
      });
    } else if (wasOpen.current) requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-source-key="${model.sourceKey}"] [data-chat-action="launcher"]`)?.focus());
    wasOpen.current = controller.state.open;
  }, [controller.state.open, model.sourceKey, page.id]);

  return <div className="xp-chat-surface-host" data-xp-owner="ChatSurface" data-controller-owner="ChatSurfaceController" data-source-key={model.sourceKey} data-chat-preset={model.preset} data-device-class={deviceClass} data-stress={model.stress}>
    <AdaptiveOverlay
      intent="edit"
      open={controller.state.open}
      onOpenChange={(open) => open ? controller.open() : controller.minimize()}
      presentation={{ M: "full-screen", TP: "sheet", TL: "popover", DS: "popover", DW: "popover" }}
      why="Chat keeps one session while each device class receives its native assistance surface."
    >
      <AdaptiveOverlay.Trigger className="xp-chat-surface__launcher" aria-label={`${launcher.label}${controller.state.unreadCount ? `, ${controller.state.unreadCount} ${model.copy.unreadLabel}` : ""}`} data-chat-action="launcher">
        <Mark model={model}/><span className="xp-visually-hidden">{launcher.label}</span>{controller.state.unreadCount ? <span className="xp-chat-surface__badge" aria-hidden="true">{controller.state.unreadCount}</span> : null}
      </AdaptiveOverlay.Trigger>
      <AdaptiveOverlay.Content className="xp-chat-surface" data-source-key={model.sourceKey} data-chat-preset={model.preset} data-device-class={deviceClass} data-controller-owner="ChatSurfaceController" data-stress={model.stress} aria-label={page.title}>
        <AdaptiveOverlay.Header title={<span tabIndex={-1} data-chat-heading><Mark model={model}/>{page.title}</span>} description={pageDescription(model, controller)} closeLabel={action(model, "minimize").label}/>
        <BackControl model={model} controller={controller}/>
        <AdaptiveOverlay.Body className="xp-chat-surface__body" data-chat-reader-above-end="false" onScroll={trackReaderPosition}><PagePanel model={model} controller={controller}/></AdaptiveOverlay.Body>
        <AdaptiveOverlay.Footer className="xp-chat-surface__footer"><Composer model={model} controller={controller}/></AdaptiveOverlay.Footer>
      </AdaptiveOverlay.Content>
    </AdaptiveOverlay>
    <p className="xp-chat-surface__announcer" role="status" aria-live="polite">{controller.state.announcement}</p>
  </div>;
}

function ChatSurfaceOwned({ model, scenario }: Omit<ChatSurfaceProperties, "deviceClass">) {
  const deviceClass = useDeviceClass();
  const pane = deviceClass === "DW" && scenario?.hostPaneGrant === true;
  return <ChatSurfaceController model={model} scenario={scenario}>{(controller) => pane
    ? <PaneSurface model={model} controller={controller} deviceClass={deviceClass}/>
    : <OverlaySurface model={model} controller={controller} deviceClass={deviceClass}/>
  }</ChatSurfaceController>;
}

export function ChatSurface({ model, deviceClass, scenario }: ChatSurfaceProperties) {
  const surface = <ChatSurfaceOwned model={model} scenario={scenario}/>;
  return deviceClass ? <DeviceClassProvider deviceClass={deviceClass}>{surface}</DeviceClassProvider> : surface;
}
