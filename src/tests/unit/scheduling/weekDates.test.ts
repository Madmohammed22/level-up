import { describe, it, expect } from "vitest";
import { mondayOf, timeSlotToDates } from "@/server/domain/scheduling/weekDates";

describe("mondayOf", () => {
  it("returns the Monday of the same week for a Wednesday", () => {
    // Wed 2026-04-15
    const wed = new Date(2026, 3, 15);
    const mon = mondayOf(wed);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(13);
    expect(mon.getHours()).toBe(0);
    expect(mon.getMinutes()).toBe(0);
  });

  it("returns previous Monday when date is a Sunday", () => {
    const sun = new Date(2026, 3, 19); // Sun 2026-04-19
    const mon = mondayOf(sun);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(13);
  });

  it("returns same date when date is already Monday", () => {
    const m = new Date(2026, 3, 13, 14, 30);
    const mon = mondayOf(m);
    expect(mon.getDate()).toBe(13);
    expect(mon.getHours()).toBe(0);
  });
});

describe("timeSlotToDates", () => {
  it("computes Tuesday 16:00-17:30 from a Monday week start", () => {
    const weekStart = new Date(2026, 3, 13); // Mon 2026-04-13
    const result = timeSlotToDates(weekStart, {
      dayOfWeek: "TUESDAY",
      startTime: "16:00",
      endTime: "17:30",
    });
    expect(result.date.getDate()).toBe(14);
    expect(result.startAt.getHours()).toBe(16);
    expect(result.startAt.getMinutes()).toBe(0);
    expect(result.endAt.getHours()).toBe(17);
    expect(result.endAt.getMinutes()).toBe(30);
  });

  it("rejects malformed time", () => {
    const weekStart = new Date(2026, 3, 13);
    expect(() =>
      timeSlotToDates(weekStart, {
        dayOfWeek: "MONDAY",
        startTime: "25:00",
        endTime: "17:00",
      }),
    ).toThrow(/Invalid time/);
  });
});
