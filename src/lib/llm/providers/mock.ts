import { createHash } from "crypto";
import { GenerateOptions, GenerateResult, EmbedResult, LlmProvider } from "../types";

export class MockLlmProvider implements LlmProvider {
  readonly name = "mock" as const;

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const start = Date.now();
    const model = options?.model || "mock-model";

    let text = "Deterministic mock response.";

    // If the prompt explicitly asks for JSON, provide a structured object
    if (prompt.toLowerCase().includes("json") || prompt.includes("{")) {
      text = JSON.stringify({
        status: "ok",
        message: "Deterministic mock response",
        timestamp: new Date().toISOString(),
      });
    }

    const latencyMs = Date.now() - start;

    return {
      text,
      model,
      tokensUsed: {
        prompt: Math.ceil(prompt.length / 4),
        completion: Math.ceil(text.length / 4),
        total: Math.ceil((prompt.length + text.length) / 4),
      },
      latencyMs,
      provider: "mock",
    };
  }

  async embed(text: string, options?: GenerateOptions): Promise<EmbedResult> {
    const start = Date.now();
    const model = options?.model || "mock-embedding-768";
    const dimensions = 768;

    // Generate deterministic 768-float vector from hash
    const hash = createHash("sha256").update(text).digest();
    const embedding: number[] = new Array(dimensions);

    for (let i = 0; i < dimensions; i++) {
      const byte = hash[i % hash.length];
      embedding[i] = Number(((byte / 255) * 2 - 1).toFixed(4));
    }

    return {
      embedding,
      dimensions,
      latencyMs: Date.now() - start,
      model,
      provider: "mock",
    };
  }
}

export const mockLlmProvider = new MockLlmProvider();
