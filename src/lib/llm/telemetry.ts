import { trackLlmBreadcrumb } from "@/lib/observability/sentry";

export interface LlmSpanMetadata {
  operation: "generate" | "generateJSON" | "embed";
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  success: boolean;
  error?: string;
  repairAttempted?: boolean;
}

export function recordLlmSpan(meta: LlmSpanMetadata): void {
  // Add Sentry breadcrumb
  try {
    trackLlmBreadcrumb({
      operation: meta.operation,
      provider: meta.provider,
      model: meta.model,
      latencyMs: meta.latencyMs,
      tokensUsed: meta.tokensUsed,
      success: meta.success,
      error: meta.error,
    });
  } catch {
    // Sentry not present or failed, continue silently
  }

  // Development logging
  if (process.env.NODE_ENV === "development" && process.env.DEBUG_LLM === "1") {
    console.debug(
      `[LLM Trace] ${meta.operation} (${meta.provider}/${meta.model}) ${meta.latencyMs}ms success=${meta.success}`
    );
  }
}
