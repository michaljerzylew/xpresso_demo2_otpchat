import { useState } from "react";
import { useChatStore } from "./store";
import { getModelConfig } from "./models";
import { Cpu, FileDown, ShieldCheck, Hash, MessageSquare } from "lucide-react";

export function ChatInspector() {
  const { activeSession, exportSession, user } = useChatStore();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const model = getModelConfig(activeSession?.model);
  const messageCount = activeSession?.messages.length ?? 0;
  const tokenTotal = activeSession?.messages.reduce((acc, m) => acc + (m.tokensCompletion || 0), 0) ?? 0;

  const handleExport = (format: "markdown" | "json") => {
    const data = exportSession(format);
    const blob = new Blob([data], { type: format === "json" ? "application/json" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession?.title || "chat"}.${format === "json" ? "json" : "md"}`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <div className="chat-inspector-panel">
      {/* 1. Active Model */}
      <div className="chat-inspector-section">
        <h3 className="chat-inspector-title">Active Model</h3>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Model</span>
          <span className="chat-meta-value">{model.name}</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Context Window</span>
          <span className="chat-meta-value">{model.contextLength.toLocaleString()} tokens</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Specialization</span>
          <span className="chat-badge">{model.badge}</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Provider</span>
          <span className="chat-meta-value">Featherless AI</span>
        </div>
      </div>

      {/* 2. Session Metrics */}
      <div className="chat-inspector-section">
        <h3 className="chat-inspector-title">Session Metrics</h3>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Messages</span>
          <span className="chat-meta-value">{messageCount}</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Est. Completion Tokens</span>
          <span className="chat-meta-value">{tokenTotal.toLocaleString()}</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Persistence</span>
          <span className="chat-meta-value">IndexedDB (Local)</span>
        </div>
      </div>

      {/* 3. Security & Access */}
      <div className="chat-inspector-section">
        <h3 className="chat-inspector-title">Perimeter Security</h3>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Auth</span>
          <span className="chat-meta-value">Cloudflare Access OTP</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">Edge Proxy</span>
          <span className="chat-meta-value">workerd (Cloudflare)</span>
        </div>
        <div className="chat-meta-row">
          <span className="chat-meta-label">CSP Enforcement</span>
          <span className="chat-meta-value">connect-src 'self'</span>
        </div>
      </div>

      {/* 4. Export & Download */}
      <div className="chat-inspector-section">
        <h3 className="chat-inspector-title">Export Thread</h3>
        <div className="chat-export-buttons">
          <button
            type="button"
            className="chat-action-btn"
            onClick={() => handleExport("markdown")}
            disabled={!activeSession || activeSession.messages.length === 0}
          >
            <FileDown aria-hidden="true" className="chat-icon-s" />
            <span>{copiedFormat === "markdown" ? "Exported .md" : "Export Markdown"}</span>
          </button>
          <button
            type="button"
            className="chat-action-btn"
            onClick={() => handleExport("json")}
            disabled={!activeSession || activeSession.messages.length === 0}
          >
            <FileDown aria-hidden="true" className="chat-icon-s" />
            <span>{copiedFormat === "json" ? "Exported .json" : "Export JSON"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
