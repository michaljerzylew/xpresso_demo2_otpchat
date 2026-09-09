import { AVAILABLE_MODELS } from "./models";
import { useChatStore } from "./store";
import { Sparkles, Check } from "lucide-react";

interface ModelDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ModelDialog({ open, onClose }: ModelDialogProps) {
  const { activeModelId, setActiveModelId } = useChatStore();

  if (!open) return null;

  return (
    <div className="chat-dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="model-dialog-title">
      <div className="chat-dialog-card">
        <div className="chat-dialog-header">
          <div className="chat-dialog-title-row">
            <Sparkles aria-hidden="true" className="chat-icon-m" />
            <h2 id="model-dialog-title">Select Inference Model</h2>
          </div>
          <button type="button" className="chat-action-btn" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <p className="chat-dialog-desc">
          Powered by Featherless AI on the Cloudflare Workers edge. Choose the model optimized for your task.
        </p>
        <div className="chat-models-list">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = model.id === activeModelId;
            return (
              <button
                key={model.id}
                type="button"
                className="chat-model-card"
                data-selected={isSelected}
                onClick={() => {
                  setActiveModelId(model.id);
                  onClose();
                }}
              >
                <div className="chat-model-card-header">
                  <div className="chat-model-card-title">
                    <strong>{model.name}</strong>
                    <span className="chat-badge">{model.badge}</span>
                  </div>
                  {isSelected && <Check aria-hidden="true" className="chat-icon-s" />}
                </div>
                <p className="chat-model-card-desc">{model.description}</p>
                <div className="chat-model-card-footer">
                  <span>Context: {model.contextLength.toLocaleString()} tokens</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
