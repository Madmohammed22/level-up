import { describe, it, expect } from "vitest";
import { proposeAssignments } from "@/server/domain/scheduling/assignment";

// Minimal "builder" helpers for readability.
const TS = (id: string) => ({ timeSlotId: id });
const ROOM = (roomId: string, capacity = 10) => ({ roomId, capacity });

describe("proposeAssignments", () => {
  it("returns an empty result when there are no students", () => {
    const out = proposeAssignments({
      students: [],
      teachers: [],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    expect(out.proposedSessions).toHaveLength(0);
    expect(out.unassignedStudents).toHaveLength(0);
    expect(out.score.fillRate).toBe(0);
  });

  it("assigns a single full-level class within capacity", () => {
    const students = Array.from({ length: 8 }, (_, i) => ({
      studentId: `s${i}`,
      level: "GRADE_10" as const,
      subjectIds: ["math"],
      availableTimeSlotIds: ["t1"],
    }));
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    expect(out.proposedSessions).toHaveLength(1);
    expect(out.proposedSessions[0].studentIds).toHaveLength(8);
    expect(out.proposedSessions[0].levels).toEqual(["GRADE_10"]);
    expect(out.unassignedStudents).toHaveLength(0);
  });

  it("splits groups that exceed capacity into multiple sessions", () => {
    const students = Array.from({ length: 15 }, (_, i) => ({
      studentId: `s${i}`,
      level: "GRADE_10" as const,
      subjectIds: ["math"],
      availableTimeSlotIds: ["t1", "t2"],
    }));
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1", "t2"],
        },
        {
          teacherId: "tch2",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1", "t2"],
        },
      ],
      rooms: [ROOM("r1"), ROOM("r2")],
      timeSlots: [TS("t1"), TS("t2")],
      compatibilityMatrix: [],
    });
    const totalAssigned = out.proposedSessions.reduce(
      (a, p) => a + p.studentIds.length,
      0,
    );
    expect(totalAssigned).toBe(15);
    expect(out.proposedSessions.length).toBeGreaterThanOrEqual(2);
    for (const p of out.proposedSessions) {
      expect(p.studentIds.length).toBeLessThanOrEqual(10);
    }
  });

  it("mutualizes two compatible levels when groups are small", () => {
    const students = [
      ...Array.from({ length: 3 }, (_, i) => ({
        studentId: `a${i}`,
        level: "GRADE_10" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1"],
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        studentId: `b${i}`,
        level: "GRADE_11" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1"],
      })),
    ];
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [
        {
          subjectId: "math",
          levelA: "GRADE_10",
          levelB: "GRADE_11",
          compatible: true,
        },
      ],
    });
    expect(out.proposedSessions).toHaveLength(1);
    expect(out.proposedSessions[0].levels.sort()).toEqual([
      "GRADE_10",
      "GRADE_11",
    ]);
    expect(out.proposedSessions[0].studentIds).toHaveLength(6);
    expect(out.score.mergedCount).toBe(1);
  });

  it("does NOT merge levels that are incompatible", () => {
    const students = [
      {
        studentId: "a1",
        level: "GRADE_9" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1", "t2"],
      },
      {
        studentId: "b1",
        level: "GRADE_12" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1", "t2"],
      },
    ];
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1", "t2"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1"), TS("t2")],
      compatibilityMatrix: [], // no compat defined
    });
    expect(out.proposedSessions).toHaveLength(2);
    const allLevels = out.proposedSessions.map((p) => p.levels);
    expect(allLevels).toContainEqual(["GRADE_9"]);
    expect(allLevels).toContainEqual(["GRADE_12"]);
  });

  it("leaves students unassigned when no teacher covers the subject", () => {
    const students = [
      {
        studentId: "s1",
        level: "GRADE_10" as const,
        subjectIds: ["physics"],
        availableTimeSlotIds: ["t1"],
      },
    ];
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"], // wrong subject
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    expect(out.proposedSessions).toHaveLength(0);
    expect(out.unassignedStudents).toHaveLength(1);
  });

  it("does not double-book a room at the same time slot", () => {
    const students = [
      ...Array.from({ length: 5 }, (_, i) => ({
        studentId: `m${i}`,
        level: "GRADE_10" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1"],
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        studentId: `p${i}`,
        level: "GRADE_10" as const,
        subjectIds: ["physics"],
        availableTimeSlotIds: ["t1"],
      })),
    ];
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
        {
          teacherId: "tch2",
          subjectIds: ["physics"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    // Only one room, one slot → only one of the two subjects fits.
    expect(out.proposedSessions).toHaveLength(1);
    expect(out.unassignedStudents.length).toBeGreaterThan(0);
  });

  it("does not place a student in two sessions at the same slot", () => {
    // Same student needs math AND physics; only one time slot exists.
    const student = {
      studentId: "s1",
      level: "GRADE_10" as const,
      subjectIds: ["math", "physics"],
      availableTimeSlotIds: ["t1"],
    };
    const out = proposeAssignments({
      students: [student],
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
        {
          teacherId: "tch2",
          subjectIds: ["physics"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1"), ROOM("r2")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    // Student can only be in one session at t1 — one subject remains unassigned.
    expect(out.proposedSessions.length).toBeLessThanOrEqual(1);
    expect(out.unassignedStudents).toHaveLength(1);
  });

  it("respects teacher availability", () => {
    const students = [
      {
        studentId: "s1",
        level: "GRADE_10" as const,
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1", "t2"],
      },
    ];
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t2"], // not available at t1
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1"), TS("t2")],
      compatibilityMatrix: [],
    });
    expect(out.proposedSessions).toHaveLength(1);
    expect(out.proposedSessions[0].timeSlotId).toBe("t2");
  });

  it("computes a correct fill rate score", () => {
    const students = Array.from({ length: 5 }, (_, i) => ({
      studentId: `s${i}`,
      level: "GRADE_10" as const,
      subjectIds: ["math"],
      availableTimeSlotIds: ["t1"],
    }));
    const out = proposeAssignments({
      students,
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1", 10)],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [],
    });
    expect(out.proposedSessions).toHaveLength(1);
    expect(out.score.fillRate).toBeCloseTo(0.5, 5);
  });

  it("is deterministic for identical inputs", () => {
    const makeInput = () => ({
      students: Array.from({ length: 6 }, (_, i) => ({
        studentId: `s${i}`,
        level: i % 2 === 0 ? ("GRADE_10" as const) : ("GRADE_11" as const),
        subjectIds: ["math"],
        availableTimeSlotIds: ["t1"],
      })),
      teachers: [
        {
          teacherId: "tch1",
          subjectIds: ["math"],
          availableTimeSlotIds: ["t1"],
        },
      ],
      rooms: [ROOM("r1")],
      timeSlots: [TS("t1")],
      compatibilityMatrix: [
        {
          subjectId: "math",
          levelA: "GRADE_10" as const,
          levelB: "GRADE_11" as const,
          compatible: true,
        },
      ],
    });
    const a = proposeAssignments(makeInput());
    const b = proposeAssignments(makeInput());
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});
