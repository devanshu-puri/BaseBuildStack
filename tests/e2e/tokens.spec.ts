import { test, expect } from "@playwright/test";

test.describe("Tokens page visual and layout check", () => {
  test("renders dot-grid canvas, primitives, and sample components without horizontal scroll", async ({
    page,
  }) => {
    await page.goto("/dev/tokens");

    // Check heading
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Core Component");

    // Check sample primitives
    await expect(page.locator("text=Segmented Tabs")).toBeVisible();
    await expect(page.locator("text=CodeBlock")).toBeVisible();
    await expect(page.locator("text=Option Button States")).toBeVisible();
    await expect(page.getByRole("heading", { name: "5-Part FeedbackCard", exact: true })).toBeVisible();

    // Verify no horizontal overflow/scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
