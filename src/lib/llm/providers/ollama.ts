import { GenerateOptions, GenerateResult, EmbedResult, LlmProvider } from "../types";

export class OllamaProvider implements LlmProvider {
  readonly name = "ollama" as const;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    this.defaultModel = process.env.OLLAMA_MODEL || "gemma2:9b";
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const start = Date.now();
    const model = options?.model || this.defaultModel;
    const timeoutMs = options?.timeoutMs || 30_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt,
          system: options?.systemPrompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.2,
            num_predict: options?.maxTokens ?? 1024,
          },
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama generate failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - start;

      return {
        text: data.response || "",
        model,
        tokensUsed: {
          prompt: data.prompt_eval_count || Math.ceil(prompt.length / 4),
          completion: data.eval_count || Math.ceil((data.response || "").length / 4),
          total: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        latencyMs,
        provider: "ollama",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async embed(text: string, options?: GenerateOptions): Promise<EmbedResult> {
    const start = Date.now();
    const model = options?.model || "all-minilm";
    const timeoutMs = options?.timeoutMs || 15_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          prompt: text,
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ollama embed failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.embedding || [];

      return {
        embedding,
        dimensions: embedding.length,
        latencyMs: Date.now() - start,
        model,
        provider: "ollama",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const ollamaProvider = new OllamaProvider();
