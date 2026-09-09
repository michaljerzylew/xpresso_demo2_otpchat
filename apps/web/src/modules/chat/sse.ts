import type { ChatStreamChunk } from "./types";

export interface StreamChatOptions {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  signal?: AbortSignal;
  onToken: (content: string) => void;
  onReasoning?: (reasoning: string) => void;
  onUsage?: (usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

export async function streamChatCompletion({
  model,
  messages,
  temperature = 0.7,
  signal,
  onToken,
  onReasoning,
  onUsage,
  onError,
  onDone,
}: StreamChatOptions): Promise<void> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Server returned status ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        const errorText = await response.text().catch(() => "");
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body available for streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        // 1. Discard keep-alive comment lines (e.g. ": FEATHERLESS PROCESSING")
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }

        // 2. Stream termination marker
        if (trimmed === "data: [DONE]") {
          onDone?.();
          return;
        }

        // 3. Process SSE data line
        if (trimmed.startsWith("data:")) {
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const chunk: ChatStreamChunk = JSON.parse(jsonStr);
            const choice = chunk.choices?.[0];
            if (choice?.delta?.content) {
              onToken(choice.delta.content);
            }
            if (choice?.delta?.reasoning && onReasoning) {
              onReasoning(choice.delta.reasoning);
            }
            if (chunk.usage && onUsage) {
              onUsage(chunk.usage);
            }
          } catch {
            // Tolerate non-JSON or partial frames safely
          }
        }
      }
    }

    // Flush any remainder
    if (buffer.trim().startsWith("data:")) {
      const jsonStr = buffer.trim().slice(5).trim();
      if (jsonStr && jsonStr !== "[DONE]") {
        try {
          const chunk: ChatStreamChunk = JSON.parse(jsonStr);
          const choice = chunk.choices?.[0];
          if (choice?.delta?.content) {
            onToken(choice.delta.content);
          }
        } catch {}
      }
    }

    onDone?.();
  } catch (err: any) {
    if (err.name === "AbortError") {
      // User aborted stream cleanly - retain partial text
      onDone?.();
      return;
    }
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}
