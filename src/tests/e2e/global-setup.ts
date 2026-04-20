/**
 * Playwright globalSetup: shells out to tsx to run the seed script.
 * This runs BEFORE any test project starts.
 */
import { execSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

export default function globalSetup() {
  // Ensure auth storage dir exists
  const authDir = path.resolve("playwright/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  console.log("[global-setup] Seeding E2E database…");
  execSync(
    "NODE_OPTIONS='--dns-result-order=ipv4first' npx tsx src/tests/e2e/helpers/seed-scheduling.ts",
    {
      cwd: path.resolve(__dirname, "../../.."),
      stdio: "inherit",
      timeout: 60_000,
    },
  );
  console.log("[global-setup] Seed complete.");
}
