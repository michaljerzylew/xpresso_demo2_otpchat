export interface User {
  email: string;
  name: string;
  initials: string;
  role?: "member" | "admin";
  authenticated: boolean;
  provider?: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  badge: string;
  description: string;
  contextLength: number;
  supportsReasoning?: boolean;
  isDefault?: boolean;
}

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "streaming" | "complete" | "error";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  reasoning?: string;
  status: MessageStatus;
  tokensPrompt?: number;
  tokensCompletion?: number;
  error?: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  userEmail: string;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatStreamChunk {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    delta?: {
      role?: string;
      content?: string;
      reasoning?: string;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
