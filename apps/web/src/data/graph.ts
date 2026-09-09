/** Extend this vocabulary in MODEL before adding records. */
export type EntityKind = "record" | "user" | "chat-session" | "chat-message" | "model-config";
export type EntityRef = { kind: EntityKind; id: string };
export type SessionEntity = { kind: EntityKind; id: string; title: string; links: EntityRef[] };

export interface UserEntity {
  kind: "user";
  email: string;
  name: string;
  initials: string;
  role: "member" | "admin";
  firstSeenAt: string;
  lastActiveAt: string;
}

export interface ChatSessionEntity {
  kind: "chat-session";
  id: string;
  userEmail: string;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface ChatMessageEntity {
  kind: "chat-message";
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  status: "pending" | "streaming" | "complete" | "error";
  tokensPrompt?: number;
  tokensCompletion?: number;
  latencyMs?: number;
  createdAt: string;
}

export interface ModelConfigEntity {
  kind: "model-config";
  id: string;
  displayName: string;
  contextWindow: number;
  supportsReasoning: boolean;
  isDefault: boolean;
}

export const entities: SessionEntity[] = [];

