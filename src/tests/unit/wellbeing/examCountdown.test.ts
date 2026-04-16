import { describe, it, expect } from "vitest";
import {
  daysUntil,
  humanDaysUntil,
  examUrgency,
} from "@/server/domain/wellbeing/examCountdown";

describe("examCountdown", () => {
  const today = new Date(2026, 3, 15); // 15 Apr 2026

  it("returns 0 for same day regardless of time", () => {
    const examLate = new Date(2026, 3, 15, 23, 0);
    const fromEarly = new Date(2026, 3, 15, 1, 0);
    expect(daysUntil(examLate, fromEarly)).toBe(0);
  });

  it("counts whole days forward", () => {
    expect(daysUntil(new Date(2026, 3, 20), today)).toBe(5);
  });

  it("returns negative for past exams", () => {
    expect(daysUntil(new Date(2026, 3, 10), today)).toBe(-5);
  });

  it("formats human strings in French", () => {
    expect(humanDaysUntil(0)).toBe("aujourd'hui");
    expect(humanDaysUntil(1)).toBe("demain");
    expect(humanDaysUntil(-1)).toBe("hier");
    expect(humanDaysUntil(5)).toBe("dans 5 jours");
    expect(humanDaysUntil(-3)).toBe("il y a 3 jours");
  });

  it("classifies urgency buckets", () => {
    expect(examUrgency(-1)).toBe("past");
    expect(examUrgency(0)).toBe("imminent");
    expect(examUrgency(3)).toBe("imminent");
    expect(examUrgency(4)).toBe("soon");
    expect(examUrgency(14)).toBe("soon");
    expect(examUrgency(15)).toBe("upcoming");
  });
});
