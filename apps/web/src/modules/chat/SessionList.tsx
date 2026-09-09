import { useState, type MouseEvent } from "react";
import { useChatStore } from "./store";
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react";

interface SessionListProps {
  onSelectSession?: () => void;
}

export function SessionList({ onSelectSession }: SessionListProps) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createSession,
    deleteSession,
    pinSession,
    archiveSession,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
    filteredSessions,
    user,
  } = useChatStore();

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const regularSessions = filteredSessions.filter((s) => !s.isPinned);

  const handleSelect = (id: string) => {
    setActiveSessionId(id);
    onSelectSession?.();
  };

  const handleNewChat = () => {
    createSession();
    onSelectSession?.();
  };

  const handleDelete = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      deleteSession(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  const handleTogglePin = (e: MouseEvent, id: string, currentPin: boolean) => {
    e.stopPropagation();
    pinSession(id, !currentPin);
  };

  const handleToggleArchive = (e: MouseEvent, id: string, currentArchive: boolean) => {
    e.stopPropagation();
    archiveSession(id, !currentArchive);
  };

  return (
    <div className="chat-session-sidebar">
      {/* 1. Sidebar Header */}
      <div className="chat-sidebar-header">
        <button
          type="button"
          className="chat-new-chat-btn"
          onClick={handleNewChat}
          aria-label="New chat (Cmd+Shift+O)"
          title="New conversation"
        >
          <Plus aria-hidden="true" className="chat-icon-s" />
          <span>New Chat</span>
        </button>
        <button
          type="button"
          className="chat-action-btn"
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? "Show active chats" : "Show archived chats"}
          aria-label={showArchived ? "Show active chats" : "Show archived chats"}
        >
          {showArchived ? <ArchiveRestore aria-hidden="true" className="chat-icon-s" /> : <Archive aria-hidden="true" className="chat-icon-s" />}
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="chat-search-bar">
        <div className="chat-search-wrapper">
          <Search aria-hidden="true" className="chat-icon-s chat-search-icon" />
          <input
            type="search"
            className="chat-search-input"
            placeholder="Search conversations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button
              type="button"
              className="chat-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X aria-hidden="true" className="chat-icon-s" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Session Tree */}
      <div className="chat-session-tree" role="navigation" aria-label="Chat history">
        {filteredSessions.length === 0 ? (
          <div className="chat-empty-list">
            <p>{searchQuery ? "No matching conversations." : showArchived ? "No archived conversations." : "No chats yet. Start a conversation!"}</p>
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedSessions.length > 0 && (
              <div className="chat-session-group">
                <span className="chat-session-section-label">Pinned</span>
                {pinnedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="chat-session-item"
                    data-active={session.id === activeSessionId}
                    onClick={() => handleSelect(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSelect(session.id)}
                  >
                    <MessageSquare aria-hidden="true" className="chat-icon-s" />
                    <span className="chat-session-title">{session.title}</span>
                    <div className="chat-session-actions">
                      <button
                        type="button"
                        className="chat-item-action"
                        onClick={(e) => handleTogglePin(e, session.id, true)}
                        title="Unpin"
                        aria-label="Unpin conversation"
                      >
                        <PinOff aria-hidden="true" className="chat-icon-s" />
                      </button>
                      <button
                        type="button"
                        className="chat-item-action"
                        onClick={(e) => handleDelete(e, session.id)}
                        title={confirmDeleteId === session.id ? "Click to confirm deletion" : "Delete"}
                        aria-label="Delete conversation"
                      >
                        <Trash2 aria-hidden="true" className="chat-icon-s" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Regular Section */}
            {regularSessions.length > 0 && (
              <div className="chat-session-group">
                <span className="chat-session-section-label">
                  {showArchived ? "Archived Conversations" : "Recent Conversations"}
                </span>
                {regularSessions.map((session) => (
                  <div
                    key={session.id}
                    className="chat-session-item"
                    data-active={session.id === activeSessionId}
                    onClick={() => handleSelect(session.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleSelect(session.id)}
                  >
                    <MessageSquare aria-hidden="true" className="chat-icon-s" />
                    <span className="chat-session-title">{session.title}</span>
                    <div className="chat-session-actions">
                      <button
                        type="button"
                        className="chat-item-action"
                        onClick={(e) => handleTogglePin(e, session.id, false)}
                        title="Pin to top"
                        aria-label="Pin conversation"
                      >
                        <Pin aria-hidden="true" className="chat-icon-s" />
                      </button>
                      <button
                        type="button"
                        className="chat-item-action"
                        onClick={(e) => handleToggleArchive(e, session.id, session.isArchived)}
                        title={session.isArchived ? "Unarchive" : "Archive"}
                        aria-label={session.isArchived ? "Unarchive" : "Archive"}
                      >
                        {session.isArchived ? <ArchiveRestore aria-hidden="true" className="chat-icon-s" /> : <Archive aria-hidden="true" className="chat-icon-s" />}
                      </button>
                      <button
                        type="button"
                        className="chat-item-action"
                        onClick={(e) => handleDelete(e, session.id)}
                        title={confirmDeleteId === session.id ? "Click to confirm deletion" : "Delete"}
                        aria-label="Delete conversation"
                      >
                        <Trash2 aria-hidden="true" className="chat-icon-s" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. User Profile Footer */}
      <div className="chat-sidebar-user">
        <div className="chat-user-avatar">{user?.initials || "ML"}</div>
        <div className="chat-user-meta">
          <span className="chat-user-name">{user?.name || "Michał Lew"}</span>
          <span className="chat-user-email">{user?.email || "michaljerzylew@gmail.com"}</span>
        </div>
        <div className="chat-user-badge" title="Cloudflare Access Authenticated">
          <ShieldCheck aria-hidden="true" className="chat-icon-s" />
        </div>
      </div>
    </div>
  );
}
