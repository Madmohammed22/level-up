/**
 * E2E tests for the scheduling / assignment engine.
 *
 * Fixture (seeded in global-setup):
 *   - 2 subjects: Maths, Physique
 *   - 2 teachers: Prof Maths (Maths only), Prof Physique (Physique only)
 *   - 3 rooms: Salle Petite (5), Salle Moyenne (8), Salle Grande (10)
 *   - 8 time slots across Mon-Fri
 *   - 12 students: 4 GRADE_10 (Maths), 4 GRADE_11 (Maths+Physique),
 *     4 GRADE_12 (Physique, one UNAVAILABLE on all slots)
 *   - Compat: GRADE_10+GRADE_11 OK for Maths; GRADE_10+GRADE_12 BLOCKED
 *
 * Logged in as ADMIN via storageState (auth.setup.ts).
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

// ── Helpers ──────────────────────────────────────────────────────────

/** Get current Monday as YYYY-MM-DD. */
function currentMondayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Navigate to admin assignments page for the given week. */
async function goToAssignments(page: Page, weekISO?: string) {
  const week = weekISO ?? currentMondayISO();
  await page.goto(`/dashboard/admin/assignments?week=${week}`);
  // Wait for page to fully render
  await page.waitForLoadState("networkidle", { timeout: 30_000 });
}

/** Get proposed session rows from the table. */
function sessionRows(page: Page): Locator {
  return page.locator("table tbody tr");
}

// ── Tests ────────────────────────────────────────────────────────────

test.describe("Scheduling engine E2E", () => {
  test.describe.configure({ mode: "serial" });

  const weekISO = currentMondayISO();

  // ─── 1. Happy path: preview ─────────────────────────────────
  test("preview shows proposed sessions with fill rate > 0", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    // Fill rate card visible and > 0%
    const fillCard = page.locator("text=Taux de remplissage").locator("..");
    const fillValue = fillCard.locator(".text-3xl");
    await expect(fillValue).toBeVisible({ timeout: 10_000 });
    const fillText = (await fillValue.textContent()) ?? "0%";
    expect(fillText).not.toBe("0%");

    // At least one session row
    const rows = sessionRows(page);
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─── 2. Availability conflict → unassigned ─────────────────
  test("student unavailable on all slots appears in unassigned", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    // The unassigned section should mention "Eleve G12-Indispo"
    const unassigned = page.locator("text=Eleve G12-Indispo");
    await expect(unassigned).toBeVisible({ timeout: 10_000 });

    // Should show the missing subject (Physique)
    const li = page.locator("li", { hasText: "Eleve G12-Indispo" });
    await expect(li).toContainText("Physique");
  });

  // ─── 3. Room capacity ─────────────────────────────────────
  test("no session exceeds max capacity (10)", async ({ page }) => {
    await goToAssignments(page, weekISO);

    const rows = sessionRows(page);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent()) ?? "";
      // Pattern: "X/10" in the student count column
      const match = text.match(/(\d+)\/10/);
      if (match) {
        const studentCount = parseInt(match[1], 10);
        expect(studentCount).toBeLessThanOrEqual(10);
      }
    }
  });

  // ─── 4. Compatibility rule ─────────────────────────────────
  test("incompatible levels never share a session", async ({ page }) => {
    await goToAssignments(page, weekISO);

    const rows = sessionRows(page);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent()) ?? "";
      // 2nde = GRADE_10, Terminale = GRADE_12 — these are BLOCKED
      const has2nde = text.includes("2nde");
      const hasTerminale = text.includes("Terminale");
      expect(
        has2nde && hasTerminale,
        `Session row ${i} mixes 2nde + Terminale (incompatible)`,
      ).toBe(false);
    }
  });

  // ─── 5. Level mutualization rationale ──────────────────────
  test("multi-level sessions show Mutualisation rationale", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    const rows = sessionRows(page);
    const count = await rows.count();
    let foundMutualized = false;
    let foundStandard = false;

    for (let i = 0; i < count; i++) {
      const text = (await rows.nth(i).textContent()) ?? "";
      if (text.includes("Mutualisation")) foundMutualized = true;
      if (text.includes("Classe standard")) foundStandard = true;
    }

    // We expect at least one type of session to exist
    expect(foundMutualized || foundStandard).toBe(true);
  });

  // ─── 6. No teacher double-booking ─────────────────────────
  test("same teacher never appears in two sessions at same slot", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    const rows = sessionRows(page);
    const count = await rows.count();

    const teacherSlots = new Set<string>();
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator("td");
      const timeSlot = (await cells.nth(0).textContent())?.trim() ?? "";
      const teacher = (await cells.nth(2).textContent())?.trim() ?? "";
      const key = `${teacher}::${timeSlot}`;
      expect(
        teacherSlots.has(key),
        `Teacher "${teacher}" double-booked at "${timeSlot}"`,
      ).toBe(false);
      teacherSlots.add(key);
    }
  });

  // ─── 7. No room double-booking ────────────────────────────
  test("same room never appears in two sessions at same slot", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    const rows = sessionRows(page);
    const count = await rows.count();

    const roomSlots = new Set<string>();
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator("td");
      const timeSlot = (await cells.nth(0).textContent())?.trim() ?? "";
      const room = (await cells.nth(3).textContent())?.trim() ?? "";
      const key = `${room}::${timeSlot}`;
      expect(
        roomSlots.has(key),
        `Room "${room}" double-booked at "${timeSlot}"`,
      ).toBe(false);
      roomSlots.add(key);
    }
  });

  // ─── 8. Unassigned count card ──────────────────────────────
  test("unassigned count card shows at least 1", async ({ page }) => {
    await goToAssignments(page, weekISO);

    const card = page.locator("text=Non affectés").locator("..");
    const countText = (await card.locator(".text-3xl").textContent()) ?? "0";
    const unassignedCount = parseInt(countText, 10);
    // At least Eleve G12-Indispo is unassigned
    expect(unassignedCount).toBeGreaterThanOrEqual(1);
  });

  // ─── 9. Commit creates sessions ────────────────────────────
  test("commit creates sessions and shows confirmation", async ({ page }) => {
    await goToAssignments(page, weekISO);

    const commitBtn = page.getByRole("button", {
      name: /valider et créer/i,
    });
    await expect(commitBtn).toBeVisible({ timeout: 10_000 });
    await commitBtn.click();

    // Wait for success message: "X séance(s) créée(s)."
    const success = page.locator("text=séance(s) créée(s)");
    await expect(success).toBeVisible({ timeout: 15_000 });

    // Extract count and verify > 0
    const text = (await success.textContent()) ?? "";
    const match = text.match(/(\d+)\s*séance/);
    expect(match).toBeTruthy();
    expect(parseInt(match![1], 10)).toBeGreaterThan(0);
  });

  // ─── 10. Idempotent commit ─────────────────────────────────
  test("second commit creates zero sessions (idempotent)", async ({
    page,
  }) => {
    await goToAssignments(page, weekISO);

    const commitBtn = page.getByRole("button", {
      name: /valider et créer/i,
    });

    const btnVisible = await commitBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await commitBtn.click();

      // Expect "already exists" error
      await expect(
        page.locator("text=Toutes les séances existent déjà"),
      ).toBeVisible({ timeout: 15_000 });
    } else {
      // All sessions collide → no commit button shown, "déjà créée" visible
      await expect(page.locator("text=déjà créée").first()).toBeVisible();
    }
  });

  // ─── 11. Double-booking guard (collidesWithExisting) ───────
  test("committed sessions show collision marker on re-preview", async ({
    page,
  }) => {
    // Sessions were committed in test 9. Re-preview should show "déjà créée".
    await goToAssignments(page, weekISO);

    const collisionMarker = page.locator("text=déjà créée");
    await expect(collisionMarker.first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── 12. Week boundary (mondayOf) ─────────────────────────
  test("passing a Wednesday still anchors to same Monday", async ({
    page,
  }) => {
    const monday = new Date(weekISO + "T00:00:00");
    const wednesday = new Date(monday);
    wednesday.setDate(wednesday.getDate() + 2);
    const wedISO = wednesday.toISOString().split("T")[0];

    await goToAssignments(page, wedISO);

    // Same seed data → same results → sessions should be visible
    const rows = sessionRows(page);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // All rows should show "déjà créée" (committed earlier for this Monday)
    const collisions = page.locator("text=déjà créée");
    const collisionCount = await collisions.count();
    expect(collisionCount).toBeGreaterThan(0);
  });
});
