import { describe, it, expect } from "vitest";
import { dailyMoodAverages } from "@/server/domain/analytics/moodTrends";

describe("dailyMoodAverages", () => {
  it("returns `days` entries, oldest first", () => {
    const today = new Date(2026, 3, 15, 12, 0); // 2026-04-15
    const out = dailyMoodAverages([], 7, today);
    expect(out).toHaveLength(7);
    expect(out[0].date).toBe("2026-04-09");
    expect(out[6].date).toBe("2026-04-15");
  });

  it("zeros days with no check-ins", () => {
    const today = new Date(2026, 3, 15, 12, 0);
    const out = dailyMoodAverages([], 3, today);
    expect(out.every((d) => d.average === 0 && d.count === 0)).toBe(true);
  });

  it("averages multiple check-ins on the same day", () => {
    const today = new Date(2026, 3, 15, 12, 0);
    const out = dailyMoodAverages(
      [
        { createdAt: new Date(2026, 3, 15, 8), score: 4 },
        { createdAt: new Date(2026, 3, 15, 18), score: 2 },
        { createdAt: new Date(2026, 3, 14, 8), score: 5 },
      ],
      2,
      today,
    );
    expect(out[0].date).toBe("2026-04-14");
    expect(out[0].average).toBe(5);
    expect(out[0].count).toBe(1);
    expect(out[1].date).toBe("2026-04-15");
    expect(out[1].average).toBe(3);
    expect(out[1].count).toBe(2);
  });
});
