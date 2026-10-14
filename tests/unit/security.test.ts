import { describe, it, expect } from "vitest";
import { SECURITY_HEADERS, applySecurityHeaders } from "@/lib/security/headers";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("Security Headers & Rate Limiting", () => {
  it("defines required security headers (CSP, HSTS, X-Frame-Options, etc.)", () => {
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(SECURITY_HEADERS["Content-Security-Policy"]).toContain("default-src 'self'");
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=");

    const headers = new Headers();
    applySecurityHeaders(headers);
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("enforces rate limits and computes remaining budget", async () => {
    const key = `test_client_${Date.now()}`;
    const limit = 3;

    const res1 = await checkRateLimit(key, limit, 10_000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(key, limit, 10_000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(key, limit, 10_000);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = await checkRateLimit(key, limit, 10_000);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
  });
});
