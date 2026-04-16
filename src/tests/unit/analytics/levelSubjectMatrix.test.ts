import { describe, it, expect } from "vitest";
import { enrollmentMatrix } from "@/server/domain/analytics/levelSubjectMatrix";

describe("enrollmentMatrix", () => {
  it("returns a complete grid with zeros where no data", () => {
    const out = enrollmentMatrix([], ["math", "fr"], ["GRADE_10", "GRADE_11"]);
    expect(out).toHaveLength(4);
    expect(out.every((c) => c.count === 0)).toBe(true);
  });

  it("counts enrollments per (subject, level) cell", () => {
    const records = [
      { subjectId: "math", level: "GRADE_10" },
      { subjectId: "math", level: "GRADE_10" },
      { subjectId: "math", level: "GRADE_11" },
      { subjectId: "fr", level: "GRADE_10" },
    ];
    const out = enrollmentMatrix(
      records,
      ["math", "fr"],
      ["GRADE_10", "GRADE_11"],
    );
    const get = (s: string, l: string) =>
      out.find((c) => c.subjectId === s && c.level === l)!.count;
    expect(get("math", "GRADE_10")).toBe(2);
    expect(get("math", "GRADE_11")).toBe(1);
    expect(get("fr", "GRADE_10")).toBe(1);
    expect(get("fr", "GRADE_11")).toBe(0);
  });
});
