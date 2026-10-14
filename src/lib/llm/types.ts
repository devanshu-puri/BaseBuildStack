import { ZodType } from "zod";

export type LlmProviderName = "ollama" | "google-ai" | "mock";

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
  provider?: LlmProviderName;
  signal?: AbortSignal;
}

export interface GenerateResult {
  text: string;
  model: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
  provider: LlmProviderName;
}

export interface EmbedResult {
  embedding: number[];
  dimensions: number;
  latencyMs: number;
  model: string;
  provider: LlmProviderName;
}

export interface LlmProvider {
  name: LlmProviderName;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  embed(text: string, options?: GenerateOptions): Promise<EmbedResult>;
}

export interface GenerateJsonOptions<T> extends GenerateOptions {
  schema: ZodType<T>;
  fallback?: T;
  maxRetries?: number; // default 1 repair retry
}
