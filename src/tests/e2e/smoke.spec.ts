import { test, expect } from "@playwright/test";

// ─── Landing page ───────────────────────────────────────────────
test("landing page loads and shows hero CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Réserver une séance" }),
  ).toBeVisible();
});

// ─── Auth pages render ──────────────────────────────────────────
test("login page renders form", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(
    page.getByRole("button", { name: /se connecter/i }),
  ).toBeVisible();
});

test("register page renders form", async ({ page }) => {
  await page.goto("/register");
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
});

// ─── Auth guard: protected routes redirect to /login ────────────
test("admin route redirects to login when unauthenticated", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
});

test("student route redirects to login when unauthenticated", async ({ page }) => {
  await page.goto("/student");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
});

test("teacher route redirects to login when unauthenticated", async ({ page }) => {
  await page.goto("/teacher");
  await page.waitForURL(/\/login/);
  expect(page.url()).toContain("/login");
});

// ─── Login with bad credentials shows error ─────────────────────
test("login with wrong credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "nobody@example.com");
  await page.fill('input[name="password"]', "wrongpassword");
  await page.getByRole("button", { name: /se connecter/i }).click();
  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
});

// ─── 404 page ───────────────────────────────────────────────────
test("unknown route shows 404 page", async ({ page }) => {
  const res = await page.goto("/this-does-not-exist");
  expect(res?.status()).toBe(404);
});
