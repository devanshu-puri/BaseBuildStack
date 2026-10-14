import { test, expect } from "@playwright/test";

test.describe("Auth Screens & User Flows", () => {
  test("renders sign-in page with social buttons and email inputs", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.locator("h1")).toContainText("Sign in to your account");
    await expect(page.locator("text=Continue with GitHub")).toBeVisible();
    await expect(page.locator("text=Continue with Google")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator("text=Instant Demo Candidate Sign In")).toBeVisible();
  });

  test("renders sign-up page with role selector", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(page.locator("h1")).toContainText("Create your account");
    await expect(page.locator("text=AI Engineer")).toBeVisible();
    await expect(page.locator("text=Full-Stack / Backend")).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("can navigate between sign-in and sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.click("text=Sign up");
    await expect(page).toHaveURL(/.*sign-up/);

    await page.click("text=Sign in");
    await expect(page).toHaveURL(/.*sign-in/);
  });
});
