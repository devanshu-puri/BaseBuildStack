import { ZodType, ZodError } from "zod";
import {
  GenerateOptions,
  GenerateResult,
  EmbedResult,
  LlmProvider,
  LlmProviderName,
} from "./types";
import { mockLlmProvider } from "./providers/mock";
import { ollamaProvider } from "./providers/ollama";
import { googleAiProvider } from "./providers/google-ai";
import { recordLlmSpan } from "./telemetry";

export class LlmValidationError extends Error {
  readonly zodError: ZodError;
  readonly rawText: string;

  constructor(message: string, zodError: ZodError, rawText: string) {
    super(message);
    this.name = "LlmValidationError";
    this.zodError = zodError;
    this.rawText = rawText;
  }
}

export class LlmGateway {
  private providers: Map<LlmProviderName, LlmProvider> = new Map();

  constructor() {
    this.providers.set("mock", mockLlmProvider);
    this.providers.set("ollama", ollamaProvider);
    this.providers.set("google-ai", googleAiProvider);
  }

  isLlmEnabled(): boolean {
    return process.env.LLM_ENABLED !== "false";
  }

  getProvider(preferred?: LlmProviderName): LlmProvider {
    if (!this.isLlmEnabled()) {
      return mockLlmProvider;
    }

    if (preferred && this.providers.has(preferred)) {
      return this.providers.get(preferred)!;
    }

    const envProvider = process.env.LLM_PROVIDER as LlmProviderName | undefined;
    if (envProvider && this.providers.has(envProvider)) {
      return this.providers.get(envProvider)!;
    }

    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY) {
      return googleAiProvider;
    }

    return ollamaProvider;
  }

  /**
   * Primary text generation method with telemetry and graceful fallback.
   */
  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    const provider = this.getProvider(options?.provider);
    const start = Date.now();

    try {
      const result = await provider.generate(prompt, options);
      recordLlmSpan({
        operation: "generate",
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        tokensUsed: result.tokensUsed,
        success: true,
      });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      recordLlmSpan({
        operation: "generate",
        provider: provider.name,
        model: options?.model || "unknown",
        latencyMs: Date.now() - start,
        success: false,
        error: errorMessage,
      });

      // Fall back gracefully to mock provider if real provider throws network error
      if (provider.name !== "mock") {
        return mockLlmProvider.generate(prompt, options);
      }

      throw err;
    }
  }

  /**
   * Generates structured JSON, validates against Zod schema, and performs 1 repair retry on failure.
   */
  async generateJSON<T>(
    prompt: string,
    schema: ZodType<T>,
    options?: GenerateOptions & { fallback?: T }
  ): Promise<T> {
    const systemPrompt = [
      options?.systemPrompt || "",
      "Respond strictly with valid JSON. Do not include explanation outside the JSON object.",
    ]
      .filter(Boolean)
      .join(" ");

    // Step 1: Initial generation
    const response = await this.generate(prompt, {
      ...options,
      systemPrompt,
    });

    const parsedFirst = this.extractAndParseJson(response.text);

    if (parsedFirst.success) {
      const validated = schema.safeParse(parsedFirst.data);
      if (validated.success) {
        return validated.data;
      }
    }

    // Step 2: Repair retry with schema error details
    const validationErrors = parsedFirst.success
      ? (schema.safeParse(parsedFirst.data) as { error: ZodError }).error?.message || "Schema mismatch"
      : `JSON parse error: ${parsedFirst.error}`;

    const repairPrompt = [
      `Your previous response failed JSON schema validation with the following errors:`,
      validationErrors,
      `Original instruction:`,
      prompt,
      `Output ONLY the corrected JSON object.`,
    ].join("\n\n");

    const repaired = await this.generate(repairPrompt, {
      ...options,
      systemPrompt: "You are a JSON repair tool. Output strictly valid JSON matching schema.",
    });

    const parsedRepaired = this.extractAndParseJson(repaired.text);
    if (parsedRepaired.success) {
      const validatedRepaired = schema.safeParse(parsedRepaired.data);
      if (validatedRepaired.success) {
        recordLlmSpan({
          operation: "generateJSON",
          provider: repaired.provider,
          model: repaired.model,
          latencyMs: repaired.latencyMs,
          success: true,
          repairAttempted: true,
        });
        return validatedRepaired.data;
      }
    }

    // Step 3: Handle terminal failure or provide fallback
    if (options?.fallback !== undefined) {
      return options.fallback;
    }

    const dummyError = new ZodError([
      {
        code: "custom",
        path: [],
        message: `Failed to generate valid JSON: ${validationErrors}`,
      },
    ]);

    throw new LlmValidationError(
      `LLM failed schema validation after repair attempt: ${validationErrors}`,
      dummyError,
      repaired.text
    );
  }

  /**
   * Generate text embedding vector with fallback.
   */
  async embed(text: string, options?: GenerateOptions): Promise<EmbedResult> {
    const provider = this.getProvider(options?.provider);
    const start = Date.now();

    try {
      const result = await provider.embed(text, options);
      recordLlmSpan({
        operation: "embed",
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        success: true,
      });
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      recordLlmSpan({
        operation: "embed",
        provider: provider.name,
        model: options?.model || "unknown",
        latencyMs: Date.now() - start,
        success: false,
        error: errorMessage,
      });

      if (provider.name !== "mock") {
        return mockLlmProvider.embed(text, options);
      }
      throw err;
    }
  }

  /**
   * Utility to extract JSON from raw model output (handles markdown ```json ... ``` blocks).
   */
  private extractAndParseJson(raw: string): { success: true; data: unknown } | { success: false; error: string } {
    try {
      // 1. Try direct parse
      return { success: true, data: JSON.parse(raw.trim()) };
    } catch {
      // 2. Try regex extraction from markdown fences
      const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match && match[1]) {
        try {
          return { success: true, data: JSON.parse(match[1].trim()) };
        } catch (e: unknown) {
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      }

      // 3. Try finding outer braces/brackets
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return { success: true, data: JSON.parse(raw.substring(firstBrace, lastBrace + 1)) };
        } catch (e: unknown) {
          return { success: false, error: e instanceof Error ? e.message : String(e) };
        }
      }

      return { success: false, error: "No JSON structure found in output" };
    }
  }
}

export const llmGateway = new LlmGateway();

// Export convenience functions matching docs/PRD interface
export const generate = (prompt: string, options?: GenerateOptions) =>
  llmGateway.generate(prompt, options);

export const generateJSON = <T>(
  prompt: string,
  schema: ZodType<T>,
  options?: GenerateOptions & { fallback?: T }
) => llmGateway.generateJSON(prompt, schema, options);

export const embed = (text: string, options?: GenerateOptions) =>
  llmGateway.embed(text, options);
