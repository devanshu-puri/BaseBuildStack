import { test, expect } from "@playwright/test";

test.describe("Security Headers Verification", () => {
  test("health endpoint returns status ok, rate limit headers, and security headers", async ({
    request,
  }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-ratelimit-limit"]).toBeDefined();
    expect(headers["x-ratelimit-remaining"]).toBeDefined();

    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.deterministicEngine).toBe("active");
  });

  test("web pages include strict security headers", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response).not.toBeNull();

    const headers = response!.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
