"use client";

import { AdaptiveOverlay, useDeviceClass, type DeviceClass } from "@xp/primitives";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  createMeetingSessionState,
  filterMeetingRoster,
  meetingSessionReducer,
  meetingShortcut,
  type MeetingPanelId,
  type MeetingSessionAction,
  type MeetingSessionState,
  type ResolvedMeetingAction,
  type ResolvedMeetingFixture,
  type ResolvedMeetingParticipant,
} from "./meeting-model";

export type MeetingScenario = Partial<MeetingSessionState> & {
  showPip?: boolean;
  sendOutcome?: "success" | "error";
  inviteOutcome?: "success" | "error";
};

export type MeetingSessionControllerValue = {
  state: MeetingSessionState;
  dispatch: (action: MeetingSessionAction) => void;
  invoke: (actionId: string, invokerId?: string) => void;
  submitMessage: (body: string) => void;
  retryMessage: (messageId: string) => void;
  submitInvite: (value: string) => void;
};

export type MeetingSessionControllerProperties = {
  model: ResolvedMeetingFixture;
  deviceClass?: DeviceClass;
  scenario?: MeetingScenario;
  children: (controller: MeetingSessionControllerValue) => ReactNode;
};

const editable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input,textarea,select,[contenteditable='true']"));

const stateCopy = (model: ResolvedMeetingFixture, key: string, fallback: string) => {
  const copyKey = model.stateKeys[key];
  return copyKey ? model.copy[copyKey] ?? fallback : fallback;
};

export function MeetingSessionController({ model, deviceClass, scenario, children }: MeetingSessionControllerProperties) {
  const initialScenario = useRef(scenario);
  const [state, dispatch] = useReducer(meetingSessionReducer, model, (value) => createMeetingSessionState(value, initialScenario.current));
  const serial = useRef(0);
  const focusTargets = useRef(new Map<string, HTMLElement>());

  const registerFocusTarget = useCallback((id: string, node: HTMLElement | null) => {
    if (node) focusTargets.current.set(id, node);
    else focusTargets.current.delete(id);
  }, []);

  useEffect(() => {
    const query = `[data-meeting-action="${CSS.escape(state.focusReturnId ?? "")}"]`;
    const target = state.focusReturnId ? focusTargets.current.get(state.focusReturnId) ?? document.querySelector<HTMLElement>(query) : null;
    if (!target || state.openPanel || state.openMenu || state.confirmation) return;
    requestAnimationFrame(() => target.focus());
    dispatch({ type: "clear-focus-return" });
  }, [state.confirmation, state.focusReturnId, state.openMenu, state.openPanel]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => dispatch({ type: "set-reduced-motion", value: media.matches });
    update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update);
  }, []);

  const actionById = useMemo(() => new Map(model.actions.map((action) => [action.id, action])), [model.actions]);
  const invoke = useCallback((actionId: string, invokerId = actionId) => {
    const action = actionById.get(actionId);
    if (!action) return;
    if (actionId === "microphone") dispatch({ type: "toggle-microphone" });
    else if (actionId === "camera") dispatch({ type: "toggle-camera" });
    else if (actionId === "captions") dispatch({ type: "toggle-captions" });
    else if (actionId === "hand-signal") dispatch({ type: "toggle-hand" });
    else if (actionId === "recording") dispatch({ type: "toggle-recording" });
    else if (actionId === "layout") dispatch({ type: "set-layout", layout: state.layout === "grid" ? "featured" : "grid" });
    else if (actionId === "participants" || actionId === "chat") dispatch({ type: "open-panel", panel: actionId, invokerId });
    else if (actionId === "end-call" || actionId === "leave-call") dispatch({ type: "request-confirmation", confirmation: { kind: "end", invokerId } });
    else if (actionId === "reactions") dispatch({ type: "reaction", reaction: "applause", announcement: action.label });
    else dispatch({ type: "reaction", reaction: null as never, announcement: action.label });
  }, [actionById, state.layout]);

  const submitMessage = useCallback((body: string) => {
    if (!body.trim()) {
      dispatch({ type: "reaction", reaction: "composer-error", announcement: model.copy.composer_whitespace ?? "Message is empty." });
      return;
    }
    dispatch({ type: "reaction", reaction: "composer-ready", announcement: "" });
    const local = model.participants.find(({ role }) => role === "local") ?? model.participants[0]!;
    const id = `message-local-${++serial.current}`;
    dispatch({ type: "send-start", id, body, authorId: local.id, author: local.displayName, pending: model.copy.msg_pending ?? "Sending message" });
    queueMicrotask(() => dispatch(scenario?.sendOutcome === "error"
      ? { type: "send-failure", id, announcement: model.copy.msg_error ?? "Message failed." }
      : { type: "send-success", id, announcement: model.copy.msg_sent ?? "Message sent." }));
  }, [model, scenario?.sendOutcome]);

  const retryMessage = useCallback((messageId: string) => {
    dispatch({ type: "send-retry", id: messageId, announcement: model.copy.msg_pending ?? "Sending message" });
    queueMicrotask(() => dispatch({ type: "send-success", id: messageId, announcement: model.copy.msg_sent ?? "Message sent." }));
  }, [model.copy]);

  const submitInvite = useCallback((value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.example$/i.test(value)) {
      dispatch({ type: "invite-status", status: "invalid", announcement: model.copy.invite_invalid ?? "Invalid address." });
      return;
    }
    dispatch({ type: "invite-status", status: "pending", announcement: model.copy.invite_pending ?? "Sending invitation" });
    queueMicrotask(() => dispatch(scenario?.inviteOutcome === "error"
      ? { type: "invite-status", status: "error", announcement: model.copy.invite_error ?? "Invitation failed." }
      : { type: "invite-status", status: "success", announcement: model.copy.invite_success ?? "Invitation sent." }));
  }, [model.copy, scenario?.inviteOutcome]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      const command = meetingShortcut(event.key, editable(event.target) ? "editable" : "surface", model.availablePanels);
      if (!command || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault(); invoke(command, command);
    };
    addEventListener("keydown", onKeyDown); return () => removeEventListener("keydown", onKeyDown);
  }, [invoke, model.availablePanels]);

  useEffect(() => {
    if (deviceClass !== "M" || state.openPanel || state.openMenu || state.confirmation || !state.dockVisible) return;
    const timer = setTimeout(() => dispatch({ type: "set-dock", visible: false }), 4000);
    return () => clearTimeout(timer);
  }, [deviceClass, state.confirmation, state.dockVisible, state.openMenu, state.openPanel]);

  return children({ state, dispatch, invoke, submitMessage, retryMessage, submitInvite, registerFocusTarget } as MeetingSessionControllerValue & { registerFocusTarget: typeof registerFocusTarget });
}

export type MeetingShellProperties = {
  model: ResolvedMeetingFixture;
  deviceClass?: DeviceClass;
  scenario?: MeetingScenario;
  streamSources?: Partial<Record<string, MediaStream | string>>;
};

function useInlineSize() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  const setReference = useCallback((nextNode: HTMLElement | null) => setNode(nextNode), []);
  useEffect(() => {
    if (!node) return;
    const update = () => setWidth(node.getBoundingClientRect().width);
    update(); const observer = new ResizeObserver(update); observer.observe(node); return () => observer.disconnect();
  }, [node]);
  return { setReference, width };
}

function MeetingIcon({ id }: { id: string }) {
  const path = id === "microphone" ? <><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M6.5 10.5a5.5 5.5 0 0 0 11 0M12 16v4M9 20h6"/></>
    : id === "camera" ? <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3Z"/></>
    : id === "captions" ? <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10H8a2 2 0 0 0 0 4h2M18 10h-2a2 2 0 0 0 0 4h2"/></>
    : id === "hand-signal" ? <path d="M7 12V6a1.5 1.5 0 0 1 3 0v4-6a1.5 1.5 0 0 1 3 0v6-5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v5c0 5-3 8-7 8s-7-3-7-7v-2a1 1 0 0 1 2 0Z"/>
    : id === "reactions" ? <><circle cx="12" cy="12" r="9"/><path d="M8.5 10h.01M15.5 10h.01M8.5 14a5 5 0 0 0 7 0"/></>
    : id === "participants" ? <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 16a5 5 0 0 1 7 4"/></>
    : id === "chat" ? <path d="M4 5h16v12H9l-5 4Z"/>
    : id === "layout" ? <><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></>
    : id === "fullscreen" ? <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>
    : id === "end-call" || id === "leave-call" ? <path d="M4 15c4-4 12-4 16 0l-3 4-4-3H11l-4 3Z"/>
    : id === "copy-id" ? <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>
    : <><circle cx="12" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>;
  return <svg className="xp-meeting__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>;
}

function StreamVideo({ streamId, poster, label, source }: { streamId: string; poster: string; label: string; source?: MediaStream | string }) {
  const reference = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = reference.current; if (!video || !source) return;
    if (typeof source === "string") {
      if (!source.startsWith("/media/") && !source.startsWith("blob:")) throw new Error(`Stream ${streamId} requires an approved local source.`);
      video.src = source;
    } else video.srcObject = source;
    void video.play().catch(() => undefined);
    return () => { if (video.srcObject === source) video.srcObject = null; };
  }, [source, streamId]);
  return <video ref={reference} poster={poster} aria-label={label} data-meeting-media-element={streamId} playsInline muted={false} />;
}

function StreamOptions({ model, controller, participant }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue; participant: ResolvedMeetingParticipant }) {
  const actions = model.actions.filter((action) => action.targetParticipantId === participant.id && ["pin-stream", "adjust-volume", "confirmation"].includes(action.type));
  return <AdaptiveOverlay intent="menu"><AdaptiveOverlay.Trigger className="xp-meeting__stream-options" aria-label={`${model.copy.tile_options}: ${participant.displayName}`}><MeetingIcon id="more-options"/></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-meeting__stream-menu"><AdaptiveOverlay.Header title={participant.displayName} closeLabel={model.labels.overflowClose}/><AdaptiveOverlay.Body><ul>{actions.map((action) => <li key={action.id}><button type="button" onClick={() => action.type === "confirmation" ? controller.dispatch({ type: "request-confirmation", confirmation: { kind: "remove", participantId: participant.id, invokerId: action.id } }) : controller.dispatch({ type: "reaction", reaction: action.type, announcement: action.label })}>{action.label}</button></li>)}</ul></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function StreamCollection({ model, controller, sources }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue; sources?: MeetingShellProperties["streamSources"] }) {
  const { state, dispatch } = controller;
  return <section className="xp-meeting__stream-region" aria-label={model.labels.activeSpeaker} data-layout={state.layout}>
    <div className="xp-meeting__streams" data-meeting-snaprail="peers" data-xp-primitive="snap-rail" aria-label={model.labels.peerRail}>
      {model.streamSeats.map((stream) => {
        const active = state.activeStreamId === stream.id;
        const track = state.trackStates[stream.id];
        const mic = state.participantMicrophones[stream.participant.id];
        return <article className="xp-meeting__stream" data-stream-id={stream.id} data-kind={stream.kind} data-active={active || undefined} data-track-state={track} key={stream.id}>
          <StreamVideo streamId={stream.id} poster={stream.media.src} label={stream.media.alt} source={sources?.[stream.id]}/>
          {track !== "live" ? <div className="xp-meeting__stream-state" role="status"><strong>{track === "reconnecting" ? stateCopy(model, "reconnecting", model.copy.state_reconnect ?? "Reconnecting") : stateCopy(model, "trackEnded", model.copy.state_track_ended ?? "Video feed ended")}</strong>{track === "ended" ? <button type="button" onClick={() => dispatch({ type: "reconnect-start", streamId: stream.id, announcement: stateCopy(model, "reconnecting", "Reconnecting") })}>{stateCopy(model, "reconnecting", "Reconnect")}</button> : null}</div> : null}
          <footer><span className="xp-meeting__participant-name">{stream.participant.displayName}</span><span className="xp-meeting__media-status">{mic === "on" ? model.copy.status_mic_on ?? model.copy.stream_mic_on ?? model.copy.mic_on : model.copy.status_mic_muted ?? model.copy.stream_mic_muted ?? model.copy.mic_muted}</span></footer>
          <button className="xp-meeting__focus-stream" type="button" aria-label={`${model.labels.activeSpeaker}: ${stream.participant.displayName}`} aria-pressed={active} onClick={() => dispatch({ type: "activate-stream", streamId: stream.id })}><span aria-hidden="true">◎</span></button>
          <div className="xp-meeting__stream-actions"><button type="button" aria-label={`${model.copy.tile_mic_status ?? model.copy.mic_action}: ${stream.participant.displayName}`} aria-pressed={mic === "muted"} onClick={() => dispatch({ type: "toggle-participant-microphone", participantId: stream.participant.id })}><MeetingIcon id="microphone"/></button>{model.sourceKey === "video-call-02" ? <StreamOptions model={model} controller={controller} participant={stream.participant}/> : null}</div>
        </article>;
      })}
    </div>
  </section>;
}

function MeetingHeader({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  const { state, dispatch } = controller;
  if (model.preset === "stage-focus") return <header className="xp-meeting__stage-meta"><h1>{model.labels.meeting}</h1><p role="status">{state.recording ? model.copy.record_announcement : model.copy.record_elapsed}</p></header>;
  const copyId = async () => {
    try { await navigator.clipboard.writeText(model.copy[model.meetingMeta.meetingIdKey ?? ""] ?? ""); dispatch({ type: "copy-status", status: "success", announcement: model.copy.copy_success }); }
    catch { dispatch({ type: "copy-status", status: "error", announcement: model.copy.copy_error }); }
  };
  return <header className="xp-meeting__header">
    <a className="xp-meeting__back" href={`/demo/${model.sourceKey}/back`} data-meeting-action="back" aria-label={model.copy.header_back}><span aria-hidden="true">←</span></a>
    <div><h1>{model.copy[model.meetingMeta.titleKey ?? ""]}</h1><p><span>{model.copy[model.meetingMeta.participantCountKey ?? ""] ?? model.copy.header_overflow}</span><span>{model.copy[model.meetingMeta.elapsedKey ?? ""]}: <time>{Math.floor(model.meetingMeta.startedAtOffsetSeconds / 60)}:{String(model.meetingMeta.startedAtOffsetSeconds % 60).padStart(2, "0")}</time></span></p></div>
    <div className="xp-meeting__meeting-id"><span>{model.copy[model.meetingMeta.meetingIdKey ?? ""]}</span><button type="button" data-meeting-action="copy-id" aria-label={model.copy.copy_action} onClick={() => void copyId()}><MeetingIcon id="copy-id"/></button>{state.copyStatus !== "idle" ? <small role="status">{state.copyStatus === "success" ? model.copy.copy_success : model.copy.copy_error}</small> : null}</div>
  </header>;
}

function ParticipantRow({ model, participant, controller }: { model: ResolvedMeetingFixture; participant: ResolvedMeetingParticipant; controller: MeetingSessionControllerValue }) {
  const microphone = controller.state.participantMicrophones[participant.id];
  const camera = controller.state.participantCameras[participant.id];
  const interactive = participant.presence === "in-meeting";
  return <li className="xp-meeting__roster-row" data-presence={participant.presence} data-participant-id={participant.id}>
    {participant.media ? <img src={participant.media.src} alt={participant.media.alt}/> : null}
    <div><strong>{participant.displayName}{participant.role === "local" ? ` (${model.copy.status_local})` : ""}</strong><span>{participant.presence === "in-meeting" ? model.copy.status_in_meeting : participant.presence === "invited" ? model.copy.status_invited : model.copy.status_offline}</span>{participant.handRaised ? <span>{model.copy.status_hand_raised}</span> : null}</div>
    {interactive ? <div className="xp-meeting__row-actions"><button type="button" aria-label={`${model.copy.row_mic_action}: ${participant.displayName}`} aria-pressed={microphone === "muted"} onClick={() => controller.dispatch({ type: "toggle-participant-microphone", participantId: participant.id })}><MeetingIcon id="microphone"/></button><button type="button" aria-label={`${model.copy.row_camera_action}: ${participant.displayName}`} aria-pressed={camera === "off"} onClick={() => controller.dispatch({ type: "toggle-participant-camera", participantId: participant.id })}><MeetingIcon id="camera"/></button><button type="button" data-meeting-action={`roster-${participant.id}-options`} aria-label={`${model.copy.row_options_action}: ${participant.displayName}`} onClick={() => controller.dispatch({ type: "request-confirmation", confirmation: { kind: "remove", participantId: participant.id, invokerId: `roster-${participant.id}-options` } })}><MeetingIcon id="more-options"/></button></div> : null}
  </li>;
}

function ParticipantsPanel({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  const sections = filterMeetingRoster(model, controller.state.panelQuery);
  const hasResults = sections.some(({ participantIds }) => participantIds.length);
  const submitInvite = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); controller.submitInvite(controller.state.inviteValue); };
  return <div className="xp-meeting__panel-body xp-meeting__participants" data-panel-owner="participants">
    <label className="xp-meeting__field" htmlFor={`${model.sourceKey}-participant-search`}><span>{model.copy.search_label}</span><input id={`${model.sourceKey}-participant-search`} type="search" placeholder={model.copy.search_hint} value={controller.state.panelQuery} onChange={(event) => controller.dispatch({ type: "set-query", query: event.currentTarget.value })}/></label>
    {!hasResults ? <p className="xp-meeting__empty" role="status">{model.copy.search_no_results}</p> : sections.map((section) => {
      const rows = section.participantIds.map((id) => model.participants.find((participant) => participant.id === id)!);
      return rows.length ? <section className="xp-meeting__roster-section" key={section.id}><h3>{section.title}<span>{section.count}</span></h3><ul>{rows.map((participant) => <ParticipantRow model={model} participant={participant} controller={controller} key={participant.id}/>)}</ul></section> : null;
    })}
    <button className="xp-meeting__mute-all" type="button" data-meeting-action="mute-all" onClick={() => controller.dispatch({ type: "request-confirmation", confirmation: { kind: "mute-all", invokerId: "mute-all" } })}>{model.copy.mute_all_action}</button>
    <form className="xp-meeting__invite" onSubmit={submitInvite}><label className="xp-meeting__field" htmlFor={`${model.sourceKey}-participant-invite`}><span>{model.copy.invite_label}</span><input id={`${model.sourceKey}-participant-invite`} type="email" inputMode="email" autoComplete="email" value={controller.state.inviteValue} aria-invalid={controller.state.inviteStatus === "invalid" || controller.state.inviteStatus === "error" || undefined} onChange={(event) => controller.dispatch({ type: "set-invite", value: event.currentTarget.value })}/></label><button type="submit" disabled={controller.state.inviteStatus === "pending"}>{controller.state.inviteStatus === "pending" ? model.copy.invite_pending : model.copy.invite_share}</button>{controller.state.inviteStatus !== "idle" && controller.state.inviteStatus !== "pending" ? <p role={controller.state.inviteStatus === "error" || controller.state.inviteStatus === "invalid" ? "alert" : "status"}>{model.copy[`invite_${controller.state.inviteStatus}`]}</p> : null}</form>
  </div>;
}

function ChatPanel({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  const scrollReference = useRef<HTMLDivElement>(null);
  const latestMessage = controller.state.messages.at(-1);
  useEffect(() => {
    const scrollRegion = scrollReference.current;
    if (scrollRegion) scrollRegion.scrollTop = scrollRegion.scrollHeight;
  }, [latestMessage?.id, latestMessage?.status]);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); controller.submitMessage(controller.state.draft); };
  const invite = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); controller.submitInvite(controller.state.inviteValue); };
  const composerInvalid = controller.state.reaction === "composer-error" && !controller.state.draft.trim();
  const composerErrorId = `${model.sourceKey}-composer-error`;
  return <div className="xp-meeting__panel-body xp-meeting__chat" data-panel-owner="chat">
    <div ref={scrollReference} className="xp-meeting__chat-scroll">
      <form className="xp-meeting__invite xp-meeting__invite--compact" onSubmit={invite}><label className="xp-meeting__field" htmlFor={`${model.sourceKey}-chat-invite`}><span>{model.copy.invite_label}</span><input id={`${model.sourceKey}-chat-invite`} type="email" inputMode="email" autoComplete="email" value={controller.state.inviteValue} aria-invalid={controller.state.inviteStatus === "invalid" || controller.state.inviteStatus === "error" || undefined} onChange={(event) => controller.dispatch({ type: "set-invite", value: event.currentTarget.value })}/></label><button type="submit" disabled={controller.state.inviteStatus === "pending"}>{controller.state.inviteStatus === "pending" ? model.copy.invite_pending : model.copy.invite_share}</button>{controller.state.inviteStatus !== "idle" && controller.state.inviteStatus !== "pending" ? <p role={controller.state.inviteStatus === "error" || controller.state.inviteStatus === "invalid" ? "alert" : "status"}>{model.copy[`invite_${controller.state.inviteStatus}`]}</p> : null}</form>
      <ol className="xp-meeting__messages" aria-label={model.copy.panel_log} aria-live="polite">{controller.state.messages.map((message) => <li data-direction={message.direction} data-status={message.status} key={message.id}>{message.avatar ? <img src={message.avatar.src} alt={message.avatar.alt}/> : null}<div><strong>{message.author}</strong><p>{message.body}</p><small>{message.timestamp} · {message.status === "pending" ? model.copy.msg_pending : message.status === "failed" ? model.copy.msg_error : message.direction === "outgoing" ? model.copy.msg_sent : ""}</small>{message.status === "failed" ? <button type="button" onClick={() => controller.retryMessage(message.id)}>{model.copy.msg_retry}</button> : null}</div></li>)}</ol>
      {model.typingParticipantIds?.length ? <p className="xp-meeting__typing" role="status">{model.copy.typing_multi}</p> : null}
    </div>
    <form className="xp-meeting__composer" data-invalid={composerInvalid || undefined} onSubmit={submit}><label htmlFor={`${model.sourceKey}-composer`}>{model.copy.composer_label}</label>{composerInvalid ? <p id={composerErrorId} className="xp-meeting__composer-error" role="alert">{model.copy.composer_whitespace}</p> : null}<textarea id={`${model.sourceKey}-composer`} rows={2} placeholder={model.copy.composer_hint} value={controller.state.draft} aria-invalid={composerInvalid || undefined} aria-describedby={composerInvalid ? composerErrorId : undefined} onChange={(event) => controller.dispatch({ type: "set-draft", draft: event.currentTarget.value })}/><button type="submit">{model.copy.composer_send}</button></form>
  </div>;
}

function PanelContent({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  return controller.state.openPanel === "participants" ? <ParticipantsPanel model={model} controller={controller}/> : controller.state.openPanel === "chat" ? <ChatPanel model={model} controller={controller}/> : null;
}

function MeetingPanel({ model, controller, inline, portalContainer }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue; inline: boolean; portalContainer: HTMLElement | null }) {
  const panel = controller.state.openPanel;
  if (!panel) return null;
  const close = () => controller.dispatch({ type: "close-panel" });
  if (inline) return <aside className="xp-meeting__panel xp-meeting__panel--inline" aria-label={model.labels.panelTitle} data-panel-presentation="persistent-aside"><header><h2>{model.labels.panelTitle}</h2><button type="button" aria-label={model.labels.panelClose} onClick={close}>×</button></header><PanelContent model={model} controller={controller}/></aside>;
  return <AdaptiveOverlay intent="inspect" open onOpenChange={(open) => { if (!open) close(); }} portalContainer={portalContainer} presentation={{ M: "bottom-sheet", TP: "sheet", TL: "side-drawer" }} why="Meeting support keeps one stateful panel portaled inside its local owner and adapts only its presentation by class."><AdaptiveOverlay.Content className="xp-meeting__panel" data-panel-presentation="overlay"><AdaptiveOverlay.Header title={model.labels.panelTitle} closeLabel={model.labels.panelClose}/><AdaptiveOverlay.Body><PanelContent model={model} controller={controller}/></AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function actionPressed(actionId: string, state: MeetingSessionState) {
  if (actionId === "microphone") return state.microphone === "on";
  if (actionId === "camera") return state.camera === "on";
  if (actionId === "captions") return state.captions;
  if (actionId === "hand-signal") return state.handRaised;
  if (actionId === "recording") return state.recording;
  if (actionId === "participants" || actionId === "chat") return state.openPanel === actionId;
  if (actionId === "layout") return state.layout === "grid";
  return undefined;
}

function Control({ action, controller, compact = false }: { action: ResolvedMeetingAction; controller: MeetingSessionControllerValue; compact?: boolean }) {
  const pressed = actionPressed(action.id, controller.state);
  const label = action.id === "recording" ? (controller.state.recording ? action.labelOn : action.labelOff) ?? action.label : action.label;
  return <button className="xp-meeting__control" type="button" data-meeting-action={action.id} data-compact={compact || undefined} aria-label={label} aria-pressed={pressed} aria-expanded={action.id === "participants" || action.id === "chat" ? pressed : undefined} onClick={() => controller.invoke(action.id)}><MeetingIcon id={action.id}/><span>{label}</span></button>;
}

function MeetingDock({ model, controller, form, width, avoidInlinePanel = false }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue; form: DeviceClass; width: number; avoidInlinePanel?: boolean }) {
  const controls = model.controlIds.map((id) => model.actions.find((action) => action.id === id)!).filter(Boolean);
  const end = controls.find(({ id }) => id === "end-call" || id === "leave-call")!;
  const more = controls.find(({ id }) => id === "more-options")!;
  const candidates = controls.filter(({ id }) => id !== end.id && id !== more.id);
  const classCapacity = { M: 3, TP: 4, TL: 5, DS: 5, DW: 7 }[form];
  const widthCapacity = avoidInlinePanel ? width < 900 ? 4 : 5 : width && width < 280 ? 2 : width && width < 420 ? 3 : width && width < 620 ? 4 : classCapacity;
  const capacity = Math.min(classCapacity, widthCapacity);
  const direct = candidates.slice(0, capacity);
  const overflow = candidates.slice(capacity);
  const open = controller.state.openMenu === "meeting-overflow";
  return <div className="xp-meeting__dock-wrap" data-dock-visible={controller.state.dockVisible} onFocus={() => controller.dispatch({ type: "set-dock", visible: true })}>
    {!controller.state.dockVisible ? <button className="xp-meeting__dock-restore" type="button" onClick={() => controller.dispatch({ type: "set-dock", visible: true })}>{model.copy.dock_show ?? model.labels.overflow}</button> : null}
    {controller.state.dockVisible ? <div className="xp-meeting__dock" role="toolbar" aria-label={model.labels.meeting} data-primary-count={direct.length + 2}>
      {direct.map((action) => <Control action={action} controller={controller} compact key={action.id}/>)}
      <AdaptiveOverlay intent="menu" open={open} onOpenChange={(next) => controller.dispatch(next ? { type: "open-menu", menu: "meeting-overflow", invokerId: more.id } : { type: "close-menu", invokerId: more.id })} why="One priority registry projects commands into a single overflow without hidden command twins."><AdaptiveOverlay.Trigger className="xp-meeting__control" data-meeting-action={more.id} data-compact={form === "M" || avoidInlinePanel && width < 900 || undefined} aria-label={more.label} aria-expanded={open}><MeetingIcon id={more.id}/><span>{more.label}</span></AdaptiveOverlay.Trigger><AdaptiveOverlay.Content className="xp-meeting__overflow"><AdaptiveOverlay.Header title={more.label} closeLabel={model.labels.overflowClose}/><AdaptiveOverlay.Body><ul>{overflow.map((action) => <li key={action.id}><Control action={action} controller={controller}/></li>)}</ul>{overflow.length === 0 ? <p>{model.copy.shortcut_command ?? model.copy.sec_info_action}</p> : null}</AdaptiveOverlay.Body></AdaptiveOverlay.Content></AdaptiveOverlay>
      <Control action={end} controller={controller} compact/>
    </div> : null}
  </div>;
}

function Confirmation({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  const confirmation = controller.state.confirmation;
  if (!confirmation) return null;
  const remove = confirmation.kind === "remove";
  const mute = confirmation.kind === "mute-all";
  const title = remove ? model.copy.remove_title : mute ? model.copy.mute_all_title : model.labels.endTitle;
  const body = remove ? model.copy.remove_body : mute ? model.copy.mute_all_body : model.labels.endBody;
  const cancel = remove ? model.copy.remove_cancel : mute ? model.copy.mute_all_cancel : model.labels.endCancel;
  const confirm = remove ? model.copy.remove_confirm : mute ? model.copy.mute_all_confirm : model.labels.endConfirm;
  const accept = () => {
    if (confirmation.kind === "end") controller.dispatch({ type: "confirm-end", announcement: model.labels.endConfirm });
    else if (confirmation.kind === "mute-all") controller.dispatch({ type: "confirm-mute-all", announcement: model.copy.mute_all_success });
    else controller.dispatch({ type: "confirm-remove", participantId: confirmation.participantId!, announcement: model.copy.remove_confirm });
  };
  return <AdaptiveOverlay intent="confirm" open onOpenChange={(open) => { if (!open) controller.dispatch({ type: "cancel-confirmation" }); }}><AdaptiveOverlay.Content className="xp-meeting__confirmation"><AdaptiveOverlay.Header title={title} description={body}/><AdaptiveOverlay.Footer><button type="button" onClick={() => controller.dispatch({ type: "cancel-confirmation" })}>{cancel}</button><button className="xp-meeting__danger" type="button" onClick={accept}>{confirm}</button></AdaptiveOverlay.Footer></AdaptiveOverlay.Content></AdaptiveOverlay>;
}

function SelfView({ model, controller }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue }) {
  const participant = model.participants.find((candidate) => candidate.role === "local" && !model.streamSeats.some((stream) => stream.participantId === candidate.id));
  if (!participant) return null;
  return <aside className="xp-meeting__pip" data-corner={controller.state.pipCorner} aria-label={`${participant.displayName}: ${model.copy.status_camera_off}`}><div><span aria-hidden="true">{participant.displayName.split(" ").map((part) => part[0]).join("")}</span><strong>{participant.displayName}</strong></div><details><summary>{model.copy.sec_layout_action}</summary><div>{(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((corner) => <button type="button" aria-pressed={controller.state.pipCorner === corner} onClick={() => controller.dispatch({ type: "set-pip", corner })} key={corner}>{corner.replace("-", " ")}</button>)}</div></details></aside>;
}

function MeetingSurface({ model, controller, form, scenario, streamSources }: { model: ResolvedMeetingFixture; controller: MeetingSessionControllerValue; form: DeviceClass; scenario?: MeetingScenario; streamSources?: MeetingShellProperties["streamSources"] }) {
  const { setReference, width } = useInlineSize();
  const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);
  const inlinePanel = (form === "DS" || form === "DW") && width >= 720;
  const avoidInlinePanel = inlinePanel && Boolean(controller.state.openPanel);
  const wake = () => { if (!controller.state.dockVisible) controller.dispatch({ type: "set-dock", visible: true }); };
  if (controller.state.terminated) return <section className="xp-meeting xp-meeting--ended" data-xp-owner="MeetingShell" data-source-key={model.sourceKey} data-device-class={form} role="status"><h1>{model.labels.endConfirm}</h1><p>{controller.state.announcement}</p></section>;
  return <section ref={setReference} className="xp-meeting" data-xp-owner="MeetingShell" data-controller-owner="MeetingSessionController" data-source-key={model.sourceKey} data-meeting-preset={model.preset} data-device-class={form} data-stress={model.activeStress} data-inline-panel={avoidInlinePanel || undefined} data-reduced-motion={controller.state.reducedMotion || undefined} style={{ containerType: "inline-size" }} onPointerDown={wake}>
    <a className="xp-meeting__skip" href={`#${model.sourceKey}-stage`}>Skip to active stage</a>
    <MeetingHeader model={model} controller={controller}/>
    <main id={`${model.sourceKey}-stage`} className="xp-meeting__main" tabIndex={-1}><StreamCollection model={model} controller={controller} sources={streamSources}/>{scenario?.showPip ? <SelfView model={model} controller={controller}/> : null}<MeetingPanel model={model} controller={controller} inline={inlinePanel} portalContainer={overlayHost}/></main>
    {controller.state.captions ? <div className="xp-meeting__captions" role="status">{model.copy.caption_sample ?? model.labels.captions}</div> : null}
    <MeetingDock model={model} controller={controller} form={form} width={width} avoidInlinePanel={avoidInlinePanel}/>
    <Confirmation model={model} controller={controller}/>
    <p className="xp-meeting__announcer" role="status" aria-live="polite">{controller.state.announcement}</p>
    <div ref={setOverlayHost} className="xp-meeting__overlay-host" data-overlay-owner={model.sourceKey}/>
  </section>;
}

export function MeetingShell({ model, deviceClass: explicitClass, scenario, streamSources }: MeetingShellProperties) {
  const contextClass = useDeviceClass();
  const deviceClass = explicitClass ?? contextClass;
  return <MeetingSessionController model={model} deviceClass={deviceClass} scenario={scenario}>{(controller) => <MeetingSurface model={model} controller={controller} form={deviceClass} scenario={scenario} streamSources={streamSources}/>}</MeetingSessionController>;
}
