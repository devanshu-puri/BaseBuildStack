import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  LlmGateway,
  generateJSON,
  embed,
  LlmValidationError,
} from "@/lib/llm";
import { MockLlmProvider } from "@/lib/llm/providers/mock";

describe("LLM Gateway", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.LLM_ENABLED = "true";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("operates in deterministic mock mode when LLM is disabled", async () => {
    process.env.LLM_ENABLED = "false";
    const gateway = new LlmGateway();

    expect(gateway.isLlmEnabled()).toBe(false);
    const provider = gateway.getProvider("google-ai");
    expect(provider.name).toBe("mock");

    const result = await gateway.generate("Explain dynamic programming");
    expect(result.provider).toBe("mock");
    expect(result.text).toBe("Deterministic mock response.");
  });

  it("generates deterministic 768-dim embeddings in mock mode", async () => {
    const res = await embed("Binary search algorithm in TypeScript", {
      provider: "mock",
    });

    expect(res.provider).toBe("mock");
    expect(res.dimensions).toBe(768);
    expect(res.embedding).toHaveLength(768);
    expect(typeof res.embedding[0]).toBe("number");
  });

  it("validates and parses structured JSON matching Zod schema", async () => {
    const TestSchema = z.object({
      status: z.string(),
      message: z.string(),
    });

    const parsed = await generateJSON(
      "Return status and message in json",
      TestSchema,
      { provider: "mock" }
    );

    expect(parsed.status).toBe("ok");
    expect(parsed.message).toBe("Deterministic mock response");
  });

  it("extracts JSON embedded inside markdown code blocks", async () => {
    const customGateway = new LlmGateway();
    const mockProvider = new MockLlmProvider();

    vi.spyOn(mockProvider, "generate").mockResolvedValueOnce({
      text: "Here is the data:\n```json\n{\"score\": 95, \"verdict\": \"pass\"}\n```",
      model: "mock-model",
      tokensUsed: { prompt: 10, completion: 20, total: 30 },
      latencyMs: 15,
      provider: "mock",
    });

    vi.spyOn(customGateway, "getProvider").mockReturnValue(mockProvider);

    const schema = z.object({
      score: z.number(),
      verdict: z.string(),
    });

    const result = await customGateway.generateJSON("test", schema);
    expect(result.score).toBe(95);
    expect(result.verdict).toBe("pass");
  });

  it("executes a repair retry when initial JSON fails schema validation", async () => {
    const customGateway = new LlmGateway();
    const mockProvider = new MockLlmProvider();

    // 1st call returns invalid schema (missing required fields)
    vi.spyOn(mockProvider, "generate")
      .mockResolvedValueOnce({
        text: '{"wrongKey": "bad data"}',
        model: "mock-model",
        tokensUsed: { prompt: 10, completion: 10, total: 20 },
        latencyMs: 10,
        provider: "mock",
      })
      // 2nd call (repair) returns valid schema
      .mockResolvedValueOnce({
        text: '{"requiredName": "Algorithm Mastery", "count": 12}',
        model: "mock-model",
        tokensUsed: { prompt: 15, completion: 15, total: 30 },
        latencyMs: 12,
        provider: "mock",
      });

    vi.spyOn(customGateway, "getProvider").mockReturnValue(mockProvider);

    const schema = z.object({
      requiredName: z.string(),
      count: z.number(),
    });

    const result = await customGateway.generateJSON("Extract topic", schema);
    expect(result.requiredName).toBe("Algorithm Mastery");
    expect(result.count).toBe(12);
  });

  it("returns configured fallback when repair fails and fallback is provided", async () => {
    const customGateway = new LlmGateway();
    const mockProvider = new MockLlmProvider();

    vi.spyOn(mockProvider, "generate").mockResolvedValue({
      text: "NOT JSON AT ALL",
      model: "mock-model",
      tokensUsed: { prompt: 5, completion: 5, total: 10 },
      latencyMs: 5,
      provider: "mock",
    });

    vi.spyOn(customGateway, "getProvider").mockReturnValue(mockProvider);

    const fallbackValue = { name: "fallback_item", ready: false };
    const schema = z.object({ name: z.string(), ready: z.boolean() });

    const result = await customGateway.generateJSON("invalid prompt", schema, {
      fallback: fallbackValue,
    });

    expect(result).toEqual(fallbackValue);
  });

  it("throws LlmValidationError when schema is violated and no fallback is provided", async () => {
    const customGateway = new LlmGateway();
    const mockProvider = new MockLlmProvider();

    vi.spyOn(mockProvider, "generate").mockResolvedValue({
      text: "Completely invalid text",
      model: "mock-model",
      tokensUsed: { prompt: 5, completion: 5, total: 10 },
      latencyMs: 5,
      provider: "mock",
    });

    vi.spyOn(customGateway, "getProvider").mockReturnValue(mockProvider);

    const schema = z.object({ id: z.number() });

    await expect(customGateway.generateJSON("fail", schema)).rejects.toThrow(
      LlmValidationError
    );
  });

  it("gracefully falls back to mock provider if real provider throws network error", async () => {
    const customGateway = new LlmGateway();
    const faultyProvider = {
      name: "ollama" as const,
      generate: vi.fn().mockRejectedValue(new Error("Connection refused: 11434")),
      embed: vi.fn().mockRejectedValue(new Error("Connection refused: 11434")),
    };

    vi.spyOn(customGateway, "getProvider").mockReturnValue(faultyProvider);

    // Should fall back to mock provider rather than crashing
    const result = await customGateway.generate("Hello world");
    expect(result.provider).toBe("mock");
    expect(result.text).toBe("Deterministic mock response.");
  });
});
