import { test, expect } from "@playwright/test";

test.describe("AppShell responsive navigation and accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-e2e-test": "1" });
  });

  test("skip-to-content link exists and targets #main-content", async ({ page }) => {
    await page.goto("/home");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toHaveCount(1);
  });

  test("renders home page content correctly", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("text=Ready to continue")).toBeVisible();
    await expect(page.locator("text=Core Modules")).toBeVisible();
  });

  test("can navigate to progress, bookmarks, and settings", async ({ page }) => {
    await page.goto("/progress");
    await expect(page.locator("text=Candidate Progress & Mastery")).toBeVisible();

    await page.goto("/bookmarks");
    await expect(page.locator("text=Saved Bookmarks & Revisions")).toBeVisible();

    await page.goto("/settings");
    await expect(page.locator("text=Account & Preferences")).toBeVisible();
  });
});
