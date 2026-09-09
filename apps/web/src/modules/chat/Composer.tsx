import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, Square, Sparkles, ChevronDown } from "lucide-react";
import { useChatStore } from "./store";
import { AVAILABLE_MODELS, getModelConfig } from "./models";
import "../../shell/composer.css";

interface ComposerProps {
  onOpenModelSelector?: () => void;
}

export function Composer({ onOpenModelSelector }: ComposerProps) {
  const { sendMessage, isStreaming, stopStreaming, activeModelId, setActiveModelId } = useChatStore();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentModel = getModelConfig(activeModelId);

  useEffect(() => {
    if (textareaRef.current) {
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    await sendMessage(content);
  };

  return (
    <div className="chat-composer-dock">
      <div data-xp-composer className="chat-composer-box">
        <label data-composer-field className="chat-composer-field">
          <span className="chat-sr-only">Ask anything</span>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              const target = e.target;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 240)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Generating answer…" : "Ask OTP Chat anything…"}
            rows={1}
            aria-label="Message prompt"
          />
        </label>
        <div data-composer-row className="chat-composer-row">
          <div data-composer-tools className="chat-composer-tools">
            <button
              type="button"
              className="chat-model-selector-btn"
              data-composer-model
              onClick={onOpenModelSelector}
              aria-label={`Current model: ${currentModel.name}. Click to change model.`}
            >
              <Sparkles aria-hidden="true" className="chat-icon-s" />
              <span>{currentModel.name}</span>
              <ChevronDown aria-hidden="true" className="chat-icon-s" />
            </button>
          </div>
          <span data-composer-hint className="chat-composer-hint">Enter to send, Shift+Enter for newline</span>
          <div data-composer-send-cluster className="chat-composer-send-cluster">
            {isStreaming ? (
              <button
                type="button"
                className="chat-send-btn chat-send-btn--stop"
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
                className="chat-send-btn chat-send-btn--send"
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
