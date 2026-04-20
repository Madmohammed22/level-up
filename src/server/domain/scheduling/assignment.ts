// Auto-assignment algorithm (pure).
// Input: student demand + teachers + rooms + time slots + compatibility matrix.
// Output: proposed sessions + unassigned students + score.
//
// MVP strategy: greedy with compatibility check.
//   1. For each subject, group students by level.
//   2. Try to merge small adjacent/compatible groups (mutualization).
//   3. Fill sessions up to maxCapacity (default 10).
//   4. Slot each group into a (teacher, room, time-slot) triple without
//      conflicts with already-placed proposals.
// Not optimal — but deterministic, testable, and explainable to the admin.
// Upgrade path: swap this for an ILP / OR-Tools solver later.

import type { Level } from "@/generated/prisma/enums";
import { isLevelGroupCompatible, type CompatibilityRow } from "./compatibility";
import { levelLabel, levelsLabel } from "@/lib/levelLabels";

// ---- Input types ----

export type StudentDemand = {
  studentId: string;
  level: Level;
  subjectIds: string[]; // subjects the student needs
  availableTimeSlotIds: string[]; // time slots the student can attend
};

export type TeacherInput = {
  teacherId: string;
  subjectIds: string[];
  availableTimeSlotIds: string[];
};

export type RoomInput = {
  roomId: string;
  capacity: number;
};

export type TimeSlotInput = {
  timeSlotId: string;
};

export type SubjectOverrides = {
  minGroupSize?: number | null;
  maxCapacity?: number | null;
};

export type AssignmentInput = {
  students: StudentDemand[];
  teachers: TeacherInput[];
  rooms: RoomInput[];
  timeSlots: TimeSlotInput[];
  compatibilityMatrix: CompatibilityRow[];
  minGroupSize?: number; // global default, below this try to mutualize (default 4)
  maxCapacity?: number; // global default, per-session cap (default 10)
  subjectOverrides?: Map<string, SubjectOverrides>; // per-subject overrides
};

// ---- Output types ----

export type ProposedSession = {
  subjectId: string;
  teacherId: string;
  roomId: string;
  timeSlotId: string;
  levels: Level[];
  studentIds: string[];
  rationale: string;
};

export type AssignmentScore = {
  fillRate: number; // 0..1, weighted across proposed sessions
  mergedCount: number; // number of multi-level sessions
  unassignedCount: number;
};

export type AssignmentOutput = {
  proposedSessions: ProposedSession[];
  unassignedStudents: StudentDemand[];
  score: AssignmentScore;
};

// ---- Algorithm ----

type ResourceUsage = {
  roomSlot: Set<string>; // `${roomId}::${timeSlotId}`
  teacherSlot: Set<string>; // `${teacherId}::${timeSlotId}`
  studentSlot: Set<string>; // `${studentId}::${timeSlotId}`
};

function makeEmptyUsage(): ResourceUsage {
  return {
    roomSlot: new Set(),
    teacherSlot: new Set(),
    studentSlot: new Set(),
  };
}

function tryFindSlot(
  subjectId: string,
  studentIds: string[],
  studentAvailabilityBySlot: Map<string, Set<string>>,
  teachers: TeacherInput[],
  rooms: RoomInput[],
  timeSlots: TimeSlotInput[],
  capacityNeeded: number,
  usage: ResourceUsage,
): { teacherId: string; roomId: string; timeSlotId: string } | null {
  for (const ts of timeSlots) {
    // All candidate students must be free at this slot.
    const freeStudents = studentIds.every((sid) =>
      studentAvailabilityBySlot.get(ts.timeSlotId)?.has(sid),
    );
    if (!freeStudents) continue;

    // Find a teacher for this subject available at this slot.
    const teacher = teachers.find(
      (t) =>
        t.subjectIds.includes(subjectId) &&
        t.availableTimeSlotIds.includes(ts.timeSlotId) &&
        !usage.teacherSlot.has(`${t.teacherId}::${ts.timeSlotId}`),
    );
    if (!teacher) continue;

    // Find a room with enough capacity not double-booked.
    const room = rooms.find(
      (r) =>
        r.capacity >= capacityNeeded &&
        !usage.roomSlot.has(`${r.roomId}::${ts.timeSlotId}`),
    );
    if (!room) continue;

    // Students must not already be booked in this slot.
    const studentFree = studentIds.every(
      (sid) => !usage.studentSlot.has(`${sid}::${ts.timeSlotId}`),
    );
    if (!studentFree) continue;

    return {
      teacherId: teacher.teacherId,
      roomId: room.roomId,
      timeSlotId: ts.timeSlotId,
    };
  }
  return null;
}

function commitUsage(
  usage: ResourceUsage,
  teacherId: string,
  roomId: string,
  timeSlotId: string,
  studentIds: string[],
): void {
  usage.teacherSlot.add(`${teacherId}::${timeSlotId}`);
  usage.roomSlot.add(`${roomId}::${timeSlotId}`);
  for (const sid of studentIds) {
    usage.studentSlot.add(`${sid}::${timeSlotId}`);
  }
}

export function proposeAssignments(input: AssignmentInput): AssignmentOutput {
  const maxCap = input.maxCapacity ?? 10;
  const minGroup = input.minGroupSize ?? 4;

  // Build reverse lookup: timeSlotId -> set of studentIds available.
  const studentAvailabilityBySlot = new Map<string, Set<string>>();
  for (const s of input.students) {
    for (const tsId of s.availableTimeSlotIds) {
      if (!studentAvailabilityBySlot.has(tsId)) {
        studentAvailabilityBySlot.set(tsId, new Set());
      }
      studentAvailabilityBySlot.get(tsId)!.add(s.studentId);
    }
  }

  const usage = makeEmptyUsage();
  const proposed: ProposedSession[] = [];
  const assignedFor = new Map<string, Set<string>>(); // studentId -> set<subjectId>

  const markAssigned = (studentId: string, subjectId: string) => {
    if (!assignedFor.has(studentId)) assignedFor.set(studentId, new Set());
    assignedFor.get(studentId)!.add(subjectId);
  };

  // Collect all (subject, level) demand.
  const allSubjects = Array.from(
    new Set(input.students.flatMap((s) => s.subjectIds)),
  );

  for (const subjectId of allSubjects) {
    // Per-subject overrides (fall back to global defaults).
    const overrides = input.subjectOverrides?.get(subjectId);
    const subjectMaxCap = overrides?.maxCapacity ?? maxCap;
    const subjectMinGroup = overrides?.minGroupSize ?? minGroup;

    // students needing this subject
    const need = input.students.filter((s) => s.subjectIds.includes(subjectId));
    // group by level
    const byLevel = new Map<Level, StudentDemand[]>();
    for (const s of need) {
      if (!byLevel.has(s.level)) byLevel.set(s.level, []);
      byLevel.get(s.level)!.push(s);
    }

    // Sort levels by demand descending so largest group goes first.
    const levelsDesc = Array.from(byLevel.keys()).sort(
      (a, b) => (byLevel.get(b)!.length - byLevel.get(a)!.length),
    );

    for (const level of levelsDesc) {
      let pool = byLevel.get(level)!;
      while (pool.length > 0) {
        // Try to build a group: start with current level students (up to cap).
        let groupLevels: Level[] = [level];
        let groupStudents = pool.slice(0, subjectMaxCap);

        // If under minGroup, try to mutualize with a compatible level.
        if (groupStudents.length < subjectMinGroup) {
          for (const other of levelsDesc) {
            if (other === level) continue;
            const otherPool = byLevel.get(other) ?? [];
            if (otherPool.length === 0) continue;
            if (
              !isLevelGroupCompatible(input.compatibilityMatrix, subjectId, [
                ...groupLevels,
                other,
              ])
            ) {
              continue;
            }
            const room = subjectMaxCap - groupStudents.length;
            const take = otherPool.slice(0, room);
            if (take.length === 0) continue;
            groupStudents = [...groupStudents, ...take];
            groupLevels = [...groupLevels, other];
            // remove from the other pool
            byLevel.set(other, otherPool.slice(take.length));
            if (groupStudents.length >= subjectMaxCap) break;
          }
        }

        const studentIds = groupStudents.map((s) => s.studentId);

        const slot = tryFindSlot(
          subjectId,
          studentIds,
          studentAvailabilityBySlot,
          input.teachers,
          input.rooms,
          input.timeSlots,
          groupStudents.length,
          usage,
        );

        if (!slot) {
          // Can't place this group — leave students unassigned for this subject.
          pool = pool.slice(groupStudents.length);
          byLevel.set(level, pool);
          continue;
        }

        commitUsage(
          usage,
          slot.teacherId,
          slot.roomId,
          slot.timeSlotId,
          studentIds,
        );

        const rationale =
          groupLevels.length > 1
            ? `Mutualisation ${levelsLabel(groupLevels, "+")} (${groupStudents.length}/${subjectMaxCap})`
            : `Classe standard ${levelLabel(level)} (${groupStudents.length}/${subjectMaxCap})`;

        proposed.push({
          subjectId,
          teacherId: slot.teacherId,
          roomId: slot.roomId,
          timeSlotId: slot.timeSlotId,
          levels: groupLevels,
          studentIds,
          rationale,
        });

        for (const sid of studentIds) markAssigned(sid, subjectId);

        // Remove placed students from the current level's pool.
        pool = pool.slice(groupStudents.length);
        byLevel.set(level, pool);
      }
    }
  }

  // Compute unassigned: students who still have unmet subjects.
  const unassigned: StudentDemand[] = [];
  for (const s of input.students) {
    const done = assignedFor.get(s.studentId) ?? new Set<string>();
    const unmet = s.subjectIds.filter((sid) => !done.has(sid));
    if (unmet.length > 0) {
      unassigned.push({ ...s, subjectIds: unmet });
    }
  }

  // Score.
  const totalSeats = proposed.length * maxCap;
  const totalFilled = proposed.reduce((a, p) => a + p.studentIds.length, 0);
  const fillRate = totalSeats > 0 ? totalFilled / totalSeats : 0;
  const mergedCount = proposed.filter((p) => p.levels.length > 1).length;

  return {
    proposedSessions: proposed,
    unassignedStudents: unassigned,
    score: {
      fillRate,
      mergedCount,
      unassignedCount: unassigned.reduce((a, u) => a + u.subjectIds.length, 0),
    },
  };
}
