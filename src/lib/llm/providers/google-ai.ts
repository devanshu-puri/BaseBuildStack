import { GenerateOptions, GenerateResult, EmbedResult, LlmProvider } from "../types";

export class GoogleAiProvider implements LlmProvider {
  readonly name = "google-ai" as const;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "";
    this.defaultModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    if (!this.apiKey) {
      throw new Error("Google AI provider requires GEMINI_API_KEY or GOOGLE_AI_KEY");
    }

    const start = Date.now();
    const model = options?.model || this.defaultModel;
    const timeoutMs = options?.timeoutMs || 30_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    try {
      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens ?? 1024,
        },
      };

      if (options?.systemPrompt) {
        body.systemInstruction = {
          parts: [{ text: options.systemPrompt }],
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Google AI generate failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const latencyMs = Date.now() - start;

      const promptTokens = data.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
      const completionTokens =
        data.usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4);

      return {
        text,
        model,
        tokensUsed: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        latencyMs,
        provider: "google-ai",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async embed(text: string, options?: GenerateOptions): Promise<EmbedResult> {
    if (!this.apiKey) {
      throw new Error("Google AI provider requires GEMINI_API_KEY or GOOGLE_AI_KEY");
    }

    const start = Date.now();
    const model = options?.model || "text-embedding-004";
    const timeoutMs = options?.timeoutMs || 15_000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${model}`,
          content: { parts: [{ text }] },
        }),
        signal: options?.signal || controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Google AI embed failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.embedding?.values || [];

      return {
        embedding,
        dimensions: embedding.length,
        latencyMs: Date.now() - start,
        model,
        provider: "google-ai",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const googleAiProvider = new GoogleAiProvider();
