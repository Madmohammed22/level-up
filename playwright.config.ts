import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./src/tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  globalSetup: "./src/tests/e2e/global-setup.ts",
  projects: [
    // Smoke tests — no auth needed
    {
      name: "smoke",
      testMatch: "smoke.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // Auth setup — seeds DB and logs in as admin
    {
      name: "auth-setup",
      testMatch: "auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // Scheduling E2E — depends on auth
    {
      name: "scheduling",
      testMatch: "scheduling.spec.ts",
      dependencies: ["auth-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
