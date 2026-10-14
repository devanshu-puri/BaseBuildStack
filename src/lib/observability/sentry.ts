import * as Sentry from "@sentry/nextjs";

export interface ObservabilityContext {
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ObservabilityContext): string {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: {
      userId: context?.userId,
      ...context?.extra,
    },
    user: context?.userId ? { id: context.userId } : undefined,
  });
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
  context?: ObservabilityContext
): string {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: {
      userId: context?.userId,
      ...context?.extra,
    },
    user: context?.userId ? { id: context.userId } : undefined,
  });
}

export function trackLlmBreadcrumb(meta: {
  operation: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokensUsed?: { prompt: number; completion: number; total: number };
  success: boolean;
  error?: string;
}): void {
  Sentry.addBreadcrumb({
    category: "llm",
    message: `${meta.operation} via ${meta.provider}:${meta.model}`,
    level: meta.success ? "info" : "error",
    data: {
      latencyMs: meta.latencyMs,
      tokensUsed: meta.tokensUsed,
      error: meta.error,
    },
  });
}
