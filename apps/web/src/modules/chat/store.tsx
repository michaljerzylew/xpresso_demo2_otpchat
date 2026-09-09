import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { ChatMessage, ChatSession, User } from "./types";
import { DEFAULT_MODEL_ID, getModelConfig } from "./models";
import { streamChatCompletion } from "./sse";

const DB_NAME = "xpresso_otpchat_db";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadSessionsFromStorage(userEmail: string): Promise<ChatSession[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: ChatSession[] = req.result || [];
        const filtered = all.filter(s => s.userEmail === userEmail);
        resolve(filtered);
      };
      req.onerror = () => {
        resolve(loadFallback(userEmail));
      };
    });
  } catch {
    return loadFallback(userEmail);
  }
}

async function saveSessionToStorage(session: ChatSession): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    saveFallback(session);
  }
}

async function deleteSessionFromStorage(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    deleteFallback(id);
  }
}

function loadFallback(userEmail: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(`xpresso:otpchat:${userEmail}:sessions`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallback(session: ChatSession): void {
  try {
    const key = `xpresso:otpchat:${session.userEmail}:sessions`;
    const existing = loadFallback(session.userEmail);
    const updated = existing.filter(s => s.id !== session.id).concat(session);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

function deleteFallback(id: string): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("xpresso:otpchat:")) {
        const items = JSON.parse(localStorage.getItem(key) || "[]") as ChatSession[];
        const filtered = items.filter(s => s.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    }
  } catch {}
}

export interface ChatContextValue {
  user: User | null;
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  activeSessionId: string | null;
  activeModelId: string;
  isStreaming: boolean;
  searchQuery: string;
  showArchived: boolean;
  filteredSessions: ChatSession[];
  setActiveSessionId: (id: string) => void;
  setActiveModelId: (modelId: string) => void;
  setSearchQuery: (query: string) => void;
  setShowArchived: (show: boolean) => void;
  createSession: (title?: string, modelId?: string) => ChatSession;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  pinSession: (id: string, isPinned: boolean) => void;
  archiveSession: (id: string, isArchived: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  regenerateMessage: (messageId?: string) => Promise<void>;
  exportSession: (format: "markdown" | "json") => string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeModelId, setActiveModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch user identity on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser({
            email: data.email || "michaljerzylew@gmail.com",
            name: data.displayName || "Michał Lew",
            initials: data.initials || "ML",
            authenticated: true,
            provider: data.provider || "cloudflare_access_otp",
          });
          return;
        }
      } catch {}
      // Fallback dev identity
      setUser({
        email: "michaljerzylew@gmail.com",
        name: "Michał Lew",
        initials: "ML",
        authenticated: true,
        provider: "dev_fallback",
      });
    }
    fetchUser();
  }, []);

  // 2. Load sessions when user is established
  useEffect(() => {
    if (!user) return;
    loadSessionsFromStorage(user.email).then((loaded) => {
      // Sort: pinned first, then newest updated
      const sorted = loaded.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
      setSessions(sorted);
      if (sorted.length > 0 && !activeSessionId) {
        setActiveSessionId(sorted[0].id);
        setActiveModelId(sorted[0].model || DEFAULT_MODEL_ID);
      }
    });
  }, [user]);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  // Create new session
  const createSession = useCallback((title = "New conversation", modelId = activeModelId) => {
    const userEmail = user?.email || "michaljerzylew@gmail.com";
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      userEmail,
      title,
      model: modelId,
      isPinned: false,
      isArchived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveModelId(modelId);
    saveSessionToStorage(newSession);
    return newSession;
  }, [user, activeModelId]);

  // Delete session
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const idx = prev.findIndex(s => s.id === id);
      const remaining = prev.filter(s => s.id !== id);
      if (activeSessionId === id) {
        if (remaining.length > 0) {
          const nextIdx = Math.min(idx, remaining.length - 1);
          setActiveSessionId(remaining[nextIdx].id);
          setActiveModelId(remaining[nextIdx].model || DEFAULT_MODEL_ID);
        } else {
          setActiveSessionId(null);
        }
      }
      deleteSessionFromStorage(id);
      return remaining;
    });
  }, [activeSessionId]);

  // Rename session
  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, title: newTitle.trim() || s.title, updatedAt: Date.now() };
      saveSessionToStorage(updated);
      return updated;
    }));
  }, []);

  // Pin session
  const pinSession = useCallback((id: string, isPinned: boolean) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, isPinned, updatedAt: Date.now() } : s);
      const target = updated.find(s => s.id === id);
      if (target) saveSessionToStorage(target);
      return updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    });
  }, []);

  // Archive session
  const archiveSession = useCallback((id: string, isArchived: boolean) => {
    setSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, isArchived, updatedAt: Date.now() };
      saveSessionToStorage(updated);
      return updated;
    }));
  }, []);

  // Stop active streaming
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Send message & stream completion
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let targetSession = activeSession;
    if (!targetSession) {
      targetSession = createSession(content.slice(0, 32));
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId: targetSession.id,
      role: "user",
      content: content.trim(),
      status: "complete",
      createdAt: Date.now(),
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      sessionId: targetSession.id,
      role: "assistant",
      content: "",
      reasoning: "",
      status: "streaming",
      createdAt: Date.now(),
    };

    // Auto-generate title if this is the first turn
    const isFirstTurn = targetSession.messages.length === 0;
    const sessionTitle = isFirstTurn
      ? content.trim().slice(0, 36) + (content.length > 36 ? "…" : "")
      : targetSession.title;

    const updatedSession: ChatSession = {
      ...targetSession,
      title: sessionTitle,
      model: activeModelId,
      updatedAt: Date.now(),
      messages: [...targetSession.messages, userMessage, assistantMessage],
    };

    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    saveSessionToStorage(updatedSession);

    // Setup streaming
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsStreaming(true);

    const messageHistory = [
      ...(targetSession.systemPrompt ? [{ role: "system", content: targetSession.systemPrompt }] : []),
      ...targetSession.messages.filter(m => m.status === "complete").map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: content.trim() },
    ];

    let accumulatedContent = "";
    let accumulatedReasoning = "";

    await streamChatCompletion({
      model: activeModelId,
      messages: messageHistory,
      signal: abortController.signal,
      onToken: (chunk) => {
        accumulatedContent += chunk;
        setSessions(prev => prev.map(s => {
          if (s.id !== targetSession.id) return s;
          return {
            ...s,
            messages: s.messages.map(m => m.id === assistantMessageId ? {
              ...m,
              content: accumulatedContent,
              status: "streaming",
            } : m),
          };
        }));
      },
      onReasoning: (reasoningChunk) => {
        accumulatedReasoning += reasoningChunk;
        setSessions(prev => prev.map(s => {
          if (s.id !== targetSession.id) return s;
          return {
            ...s,
            messages: s.messages.map(m => m.id === assistantMessageId ? {
              ...m,
              reasoning: accumulatedReasoning,
            } : m),
          };
        }));
      },
      onUsage: (usage) => {
        setSessions(prev => prev.map(s => {
          if (s.id !== targetSession.id) return s;
          return {
            ...s,
            messages: s.messages.map(m => m.id === assistantMessageId ? {
              ...m,
              tokensPrompt: usage.prompt_tokens,
              tokensCompletion: usage.completion_tokens,
            } : m),
          };
        }));
      },
      onError: (err) => {
        setSessions(prev => prev.map(s => {
          if (s.id !== targetSession.id) return s;
          const finalSession = {
            ...s,
            messages: s.messages.map(m => m.id === assistantMessageId ? {
              ...m,
              content: accumulatedContent || "Failed to generate response. Please check your network or try again.",
              status: "error" as const,
              error: err.message,
            } : m),
          };
          saveSessionToStorage(finalSession);
          return finalSession;
        }));
        setIsStreaming(false);
      },
      onDone: () => {
        setSessions(prev => prev.map(s => {
          if (s.id !== targetSession.id) return s;
          const finalSession = {
            ...s,
            messages: s.messages.map(m => m.id === assistantMessageId ? {
              ...m,
              content: accumulatedContent,
              reasoning: accumulatedReasoning,
              status: "complete" as const,
            } : m),
          };
          saveSessionToStorage(finalSession);
          return finalSession;
        }));
        setIsStreaming(false);
      },
    });
  }, [activeSession, activeModelId, createSession]);

  // Regenerate response
  const regenerateMessage = useCallback(async (messageId?: string) => {
    if (!activeSession) return;
    const msgs = activeSession.messages;
    const targetIdx = messageId ? msgs.findIndex(m => m.id === messageId) : msgs.length - 1;
    if (targetIdx < 0) return;

    // Find the last user prompt preceding or at targetIdx
    let userPrompt = "";
    for (let i = targetIdx; i >= 0; i--) {
      if (msgs[i].role === "user") {
        userPrompt = msgs[i].content;
        break;
      }
    }
    if (!userPrompt) return;

    // Truncate messages back to the user message
    const trimmed = msgs.slice(0, targetIdx);
    const updatedSession = { ...activeSession, messages: trimmed };
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    await sendMessage(userPrompt);
  }, [activeSession, sendMessage]);

  // Export session
  const exportSession = useCallback((format: "markdown" | "json") => {
    if (!activeSession) return "";
    if (format === "json") {
      return JSON.stringify(activeSession, null, 2);
    }
    const model = getModelConfig(activeSession.model);
    const header = `# ${activeSession.title}\n*Model: ${model.name} (${activeSession.model})*\n*Date: ${new Date(activeSession.createdAt).toLocaleString()}*\n\n---\n\n`;
    const body = activeSession.messages.map(m => {
      const author = m.role === "assistant" ? `### ${model.name}` : `### User`;
      const reasoning = m.reasoning ? `\n> **Thinking:**\n> ${m.reasoning.split("\n").join("\n> ")}\n\n` : "";
      return `${author}\n${reasoning}${m.content}\n\n`;
    }).join("");
    return header + body;
  }, [activeSession]);

  // Filtered sessions
  const filteredSessions = sessions.filter(s => {
    if (!showArchived && s.isArchived) return false;
    if (showArchived && !s.isArchived) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (s.title.toLowerCase().includes(q)) return true;
    return s.messages.some(m => m.content.toLowerCase().includes(q));
  });

  const value: ChatContextValue = {
    user,
    sessions,
    activeSession,
    activeSessionId,
    activeModelId,
    isStreaming,
    searchQuery,
    showArchived,
    filteredSessions,
    setActiveSessionId,
    setActiveModelId,
    setSearchQuery,
    setShowArchived,
    createSession,
    deleteSession,
    renameSession,
    pinSession,
    archiveSession,
    sendMessage,
    stopStreaming,
    regenerateMessage,
    exportSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatStore() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatStore must be used within a ChatProvider");
  return ctx;
}
