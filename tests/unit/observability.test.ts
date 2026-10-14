import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  captureException,
  captureMessage,
  trackLlmBreadcrumb,
} from "@/lib/observability/sentry";
import { recordLlmSpan } from "@/lib/llm/telemetry";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn().mockReturnValue("mock_event_id"),
  captureMessage: vi.fn().mockReturnValue("mock_message_id"),
  addBreadcrumb: vi.fn(),
  init: vi.fn(),
}));

describe("Sentry Observability & Telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures exceptions with user context and custom tags", () => {
    const error = new Error("Database timeout");
    const eventId = captureException(error, {
      userId: "user_obs_1",
      tags: { module: "m1", environment: "test" },
      extra: { query: "findOne" },
    });

    expect(eventId).toBe("mock_event_id");
    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        user: { id: "user_obs_1" },
        tags: { module: "m1", environment: "test" },
      })
    );
  });

  it("captures messages with severity level and context", () => {
    const msgId = captureMessage("High memory alert", "warning", {
      userId: "user_obs_2",
      tags: { worker: "sandbox" },
    });

    expect(msgId).toBe("mock_message_id");
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "High memory alert",
      expect.objectContaining({
        level: "warning",
        user: { id: "user_obs_2" },
      })
    );
  });

  it("records LLM breadcrumbs with model, latency, and token metrics", () => {
    trackLlmBreadcrumb({
      operation: "generateJSON",
      provider: "google-ai",
      model: "gemini-1.5-flash",
      latencyMs: 420,
      tokensUsed: { prompt: 150, completion: 80, total: 230 },
      success: true,
    });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "llm",
        message: "generateJSON via google-ai:gemini-1.5-flash",
        level: "info",
        data: expect.objectContaining({
          latencyMs: 420,
          tokensUsed: { prompt: 150, completion: 80, total: 230 },
        }),
      })
    );
  });

  it("records failed LLM traces with error levels", () => {
    recordLlmSpan({
      operation: "generate",
      provider: "ollama",
      model: "gemma2:9b",
      latencyMs: 1500,
      success: false,
      error: "Connection refused",
    });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "llm",
        level: "error",
        data: expect.objectContaining({
          error: "Connection refused",
        }),
      })
    );
  });
});
