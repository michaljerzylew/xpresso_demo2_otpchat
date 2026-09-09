import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, Square, Sparkles, ChevronDown } from "lucide-react";
import { useChatStore } from "./store";
import { AVAILABLE_MODELS, getModelConfig } from "./models";

interface ComposerProps {
  onOpenModelSelector?: () => void;
}

export function Composer({ onOpenModelSelector }: ComposerProps) {
  const { sendMessage, isStreaming, stopStreaming, activeModelId, setActiveModelId } = useChatStore();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentModel = getModelConfig(activeModelId);

  useEffect(() => {
    // Focus textarea on mount on non-mobile screens
    if (window.innerWidth >= 840 && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && text.trim()) {
        handleSubmit();
      }
    } else if (e.key === "Escape" && isStreaming) {
      e.preventDefault();
      stopStreaming();
    }
  };

  const handleSubmit = async () => {
    if (isStreaming) {
      stopStreaming();
      return;
    }
    const content = text.trim();
    if (!content) return;
    setText("");
    await sendMessage(content);
  };

  return (
    <div className="chat-composer-dock">
      <div data-xp-composer className="chat-composer-box">
        <label data-composer-field>
          <span>Ask anything</span>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Generating answer…" : "Ask OTP Chat anything…"}
            rows={1}
            aria-label="Message prompt"
          />
        </label>
        <div data-composer-row>
          <div data-composer-tools>
            <button
              type="button"
              className="chat-model-selector-btn"
              data-composer-tool
              onClick={onOpenModelSelector}
              aria-label={`Current model: ${currentModel.name}. Click to change model.`}
            >
              <Sparkles aria-hidden="true" className="chat-icon-s" />
              <span>{currentModel.name}</span>
              <ChevronDown aria-hidden="true" className="chat-icon-s" />
            </button>
          </div>
          <span data-composer-hint>Enter to send, Shift+Enter for newline</span>
          <div data-composer-send-cluster>
            {isStreaming ? (
              <button
                type="button"
                data-composer-send
                onClick={stopStreaming}
                aria-label="Stop generation"
                title="Stop generation (Escape)"
              >
                <Square aria-hidden="true" className="chat-icon-s" />
              </button>
            ) : (
              <button
                type="button"
                data-composer-send
                disabled={!text.trim()}
                onClick={handleSubmit}
                aria-label="Send message"
                title="Send message (Enter)"
              >
                <ArrowUp aria-hidden="true" className="chat-icon-m" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
