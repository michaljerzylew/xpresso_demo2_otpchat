import type { ModelConfig } from "./types";

export const DEFAULT_MODEL_ID = "Qwen/Qwen2.5-72B-Instruct";

export const AVAILABLE_MODELS: readonly ModelConfig[] = [
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen 2.5 72B",
    badge: "Default",
    description: "Flagship open-weights foundation model. Excellent general reasoning, coding, and multilingual responses.",
    contextLength: 32768,
    isDefault: true,
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    name: "Deep-Seek R1 70B",
    badge: "Reasoning",
    description: "Distilled reasoning model with explicit chain-of-thought outputs for complex logic and mathematics.",
    contextLength: 32768,
    supportsReasoning: true,
  },
  {
    id: "zai-org/GLM-4.7-Flash",
    name: "GLM 4.7 Flash",
    badge: "Fast",
    description: "Ultra-low latency model optimized for agile interactive dialogue and rapid responses.",
    contextLength: 32768,
  },
  {
    id: "meta-llama/Meta-Llama-3.1-70B-Instruct",
    name: "Llama 3.1 70B",
    badge: "General",
    description: "Balanced foundation model engineered by Meta for general dialogue and analysis.",
    contextLength: 131072,
  },
  {
    id: "Qwen/Qwen2.5-Coder-32B-Instruct",
    name: "Qwen 2.5 Coder 32B",
    badge: "Coding",
    description: "Specialized model for code generation, software debugging, and technical queries.",
    contextLength: 32768,
  },
] as const;

export function getModelConfig(modelId?: string): ModelConfig {
  const match = AVAILABLE_MODELS.find(m => m.id === modelId);
  return match ?? AVAILABLE_MODELS[0];
}
