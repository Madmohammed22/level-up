import { describe, it, expect } from "vitest";
import { groupSessionsByWeek } from "@/server/domain/analytics/sessionsOverTime";

describe("groupSessionsByWeek", () => {
  it("returns empty for no sessions", () => {
    expect(groupSessionsByWeek([])).toEqual([]);
  });

  it("buckets sessions by Monday of their week", () => {
    // 2026-03-11 is a Wednesday, same week as Monday 2026-03-09.
    const sessions = [
      { startAt: new Date(2026, 2, 11, 16, 0), status: "CONFIRMED" as const },
      { startAt: new Date(2026, 2, 13, 16, 0), status: "CONFIRMED" as const },
      { startAt: new Date(2026, 2, 16, 16, 0), status: "CANCELLED" as const }, // next week Mon 2026-03-16
    ];
    const out = groupSessionsByWeek(sessions);
    expect(out).toHaveLength(2);
    expect(out[0].weekStart).toBe("2026-03-09");
    expect(out[0].total).toBe(2);
    expect(out[0].confirmed).toBe(2);
    expect(out[1].weekStart).toBe("2026-03-16");
    expect(out[1].cancelled).toBe(1);
  });

  it("fills empty weeks between first and last with zeros", () => {
    const sessions = [
      { startAt: new Date(2026, 2, 2, 16, 0), status: "CONFIRMED" as const }, // Mon 2026-03-02
      { startAt: new Date(2026, 2, 23, 16, 0), status: "CONFIRMED" as const }, // Mon 2026-03-23
    ];
    const out = groupSessionsByWeek(sessions);
    expect(out).toHaveLength(4);
    expect(out.map((b) => b.weekStart)).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-16",
      "2026-03-23",
    ]);
    expect(out[1].total).toBe(0);
    expect(out[2].total).toBe(0);
  });
});
