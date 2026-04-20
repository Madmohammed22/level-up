/**
 * Playwright setup project: seeds the DB, logs in as admin, saves storageState.
 */
import { test as setup, expect } from "@playwright/test";

const E2E_ADMIN_EMAIL = "e2e-admin@levelup.test";
const E2E_ADMIN_PASSWORD = "E2eTest!2026";
const STORAGE_STATE = "playwright/.auth/admin.json";

setup("seed database and authenticate as admin", async ({ page }) => {
  // Navigate to login
  await page.goto("/auth/login");
  await expect(page.locator('input[name="email"]')).toBeVisible({
    timeout: 30_000,
  });

  // Fill login form (French UI)
  await page.fill('input[name="email"]', E2E_ADMIN_EMAIL);
  await page.fill('input[name="password"]', E2E_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /se connecter/i }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL(/\/dashboard\/admin/, { timeout: 15_000 });
  await expect(page.locator("body")).toBeVisible();

  // Save auth state
  await page.context().storageState({ path: STORAGE_STATE });
});
