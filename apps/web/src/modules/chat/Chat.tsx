import { useEffect, useRef, useState, type UIEvent } from "react";
import { useDeviceClass } from "@xp/runtime";
import { RoutePanes } from "../../shell/AppShell";
import { Sheet } from "../../shell/Sheet";
import { useChatStore, ChatProvider } from "./store";
import { Composer } from "./Composer";
import { SessionList } from "./SessionList";
import { ChatInspector } from "./ChatInspector";
import { ModelDialog } from "./ModelDialog";
import { StreamingMarkdown } from "./markdown";
import { getModelConfig } from "./models";
import "./chat.css";
import {
  Menu,
  Plus,
  ArrowDown,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";

function ChatInner() {
  const deviceClass = useDeviceClass();
  const {
    activeSession,
    isStreaming,
    createSession,
    regenerateMessage,
    activeModelId,
    setActiveModelId,
  } = useChatStore();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  const isMobile = deviceClass === "M";
  const isTablet = deviceClass === "TP" || deviceClass === "TL";
  const model = getModelConfig(activeModelId);

  // Auto-scroll logic during streaming
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    if (autoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeSession?.messages, isStreaming]);

  // Handle user scroll detection
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceToBottom < 64;
    autoScrollRef.current = isAtBottom;
    setShowScrollBottom(!isAtBottom && (activeSession?.messages.length ?? 0) > 0);
  };

  const scrollToBottom = () => {
    const el = transcriptRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      autoScrollRef.current = true;
      setShowScrollBottom(false);
    }
  };

  // Keyboard shortcuts (Cmd+K for model, Cmd+Shift+O for new chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModelDialogOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "o" || e.key === "O")) {
        e.preventDefault();
        createSession();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createSession]);

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch {}
  };

  const messages = activeSession?.messages ?? [];

  return (
    <RoutePanes
      list={<SessionList onSelectSession={() => setMobileDrawerOpen(false)} />}
      inspector={<ChatInspector />}
      inspectorLabels={{
        title: "Session Details",
        description: "Active inference model, token statistics, and export options.",
        show: "Show details",
        hide: "Hide details",
        close: "Close details",
        text: "Details",
      }}
      inspectorDefaultOpen={deviceClass === "DW"}
    >
      <div className="chat-workspace">
        <h1 className="chat-sr-only">OTP Chat</h1>
        {/* Top Action Bar */}
        <header className="chat-header">
          <div className="chat-header-cluster">
            {isMobile && (
              <button
                type="button"
                className="chat-action-btn"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open conversation history"
              >
                <Menu aria-hidden="true" className="chat-icon-m" />
              </button>
            )}
            <button
              type="button"
              className="chat-model-selector-btn"
              onClick={() => setModelDialogOpen(true)}
              aria-label={`Active model: ${model.name}. Click to switch model.`}
            >
              <Sparkles aria-hidden="true" className="chat-icon-s" />
              <span>{model.name}</span>
              <ChevronDown aria-hidden="true" className="chat-icon-s" />
            </button>
          </div>

          <div className="chat-header-cluster">
            <button
              type="button"
              className="chat-action-btn"
              onClick={() => createSession()}
              title="New Chat (Cmd+Shift+O)"
              aria-label="Create new conversation"
            >
              <Plus aria-hidden="true" className="chat-icon-m" />
            </button>
          </div>
        </header>

        {/* Message Transcript */}
        <div
          ref={transcriptRef}
          className="chat-transcript"
          onScroll={handleScroll}
          role="log"
          aria-label="Chat conversation messages"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <Bot aria-hidden="true" className="chat-empty-icon" />
              <h1 className="chat-empty-title">How can I help you today?</h1>
              <p className="chat-empty-desc">
                Powered by Featherless AI streaming inference on Cloudflare Workers edge. Markdown, KaTeX math, and code highlighting enabled.
              </p>
              <div className="chat-prompts-grid">
                <button
                  type="button"
                  className="chat-prompt-card"
                  onClick={() => {
                    const store = useChatStore;
                  }}
                >
                  <strong>Code & Architecture</strong>
                  <span>Explain the difference between SSE and WebSockets</span>
                </button>
                <button
                  type="button"
                  className="chat-prompt-card"
                  onClick={() => {}}
                >
                  <strong>Mathematics & Formulas</strong>
                  <span>Calculate roots of quadratic equation with LaTeX</span>
                </button>
                <button
                  type="button"
                  className="chat-prompt-card"
                  onClick={() => {}}
                >
                  <strong>Data & System Design</strong>
                  <span>Draft a Cloudflare Workers edge caching architecture</span>
                </button>
                <button
                  type="button"
                  className="chat-prompt-card"
                  onClick={() => {}}
                >
                  <strong>Creative Writing</strong>
                  <span>Write a concise executive brief for project delivery</span>
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <article key={msg.id} className="chat-message-row" data-role={msg.role}>
                <div className="chat-message-header">
                  <div className="chat-message-author">
                    {msg.role === "assistant" ? (
                      <>
                        <Bot aria-hidden="true" className="chat-icon-s" />
                        <span>{model.name}</span>
                      </>
                    ) : (
                      <>
                        <User aria-hidden="true" className="chat-icon-s" />
                        <span>You</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="chat-message-bubble">
                  {/* Reasoning disclosure if model emitted reasoning */}
                  {msg.reasoning && (
                    <details className="chat-reasoning" open={msg.status === "streaming"}>
                      <summary className="chat-reasoning-summary">
                        <Sparkles aria-hidden="true" className="chat-icon-s" />
                        <span>{msg.status === "streaming" ? "Thinking…" : "Thought process"}</span>
                      </summary>
                      <div className="chat-reasoning-content">{msg.reasoning}</div>
                    </details>
                  )}

                  {/* Markdown rendered body */}
                  <StreamingMarkdown content={msg.content} />
                </div>

                {/* Assistant turn actions */}
                {msg.role === "assistant" && (
                  <div className="chat-message-actions" role="group" aria-label="Message actions">
                    <button
                      type="button"
                      className="chat-action-btn"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      aria-label="Copy response text"
                    >
                      {copiedMessageId === msg.id ? (
                        <>
                          <Check aria-hidden="true" className="chat-icon-s" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy aria-hidden="true" className="chat-icon-s" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {!isStreaming && (
                      <button
                        type="button"
                        className="chat-action-btn"
                        onClick={() => regenerateMessage(msg.id)}
                        aria-label="Regenerate response"
                      >
                        <RotateCcw aria-hidden="true" className="chat-icon-s" />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Jump to bottom button */}
        {showScrollBottom && (
          <button
            type="button"
            className="chat-jump-bottom"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <ArrowDown aria-hidden="true" className="chat-icon-s" />
            <span>Latest message</span>
          </button>
        )}

        {/* Composer */}
        <Composer onOpenModelSelector={() => setModelDialogOpen(true)} />

        {/* Mobile Session Drawer Sheet */}
        {isMobile && (
          <Sheet
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            axis="y"
            title="Conversations"
            description="Switch or search your conversations."
            closeLabel="Close conversations"
          >
            <SessionList onSelectSession={() => setMobileDrawerOpen(false)} />
          </Sheet>
        )}

        {/* Model Selection Dialog */}
        <ModelDialog
          open={modelDialogOpen}
          onClose={() => setModelDialogOpen(false)}
        />
      </div>
    </RoutePanes>
  );
}

export function Chat() {
  return (
    <ChatProvider>
      <ChatInner />
    </ChatProvider>
  );
}
