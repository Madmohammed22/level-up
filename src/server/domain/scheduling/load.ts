// Loads AssignmentInput from the database.
// Identifiers used in the algorithm match the persisted primary keys:
//   - studentId  = StudentProfile.id
//   - teacherId  = TeacherProfile.id
//   - roomId     = Room.id
//   - timeSlotId = TimeSlot.id
// This keeps the commit step a direct write, no ID remapping.

import { prisma } from "@/server/db/prisma";
import type {
  AssignmentInput,
  StudentDemand,
  TeacherInput,
  RoomInput,
  TimeSlotInput,
  SubjectOverrides,
} from "./assignment";
import type { CompatibilityRow } from "./compatibility";

export type LoadedAssignmentContext = {
  input: AssignmentInput;
  // Lookups for UI enrichment
  studentNames: Map<string, string>; // StudentProfile.id -> user.name
  teacherNames: Map<string, string>;
  roomNames: Map<string, string>;
  subjectNames: Map<string, string>;
  timeSlotLabels: Map<string, string>; // id -> "Lundi 16:00-17:30"
  timeSlotsRaw: Map<
    string,
    { dayOfWeek: string; startTime: string; endTime: string }
  >;
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

export async function loadAssignmentContext(): Promise<LoadedAssignmentContext> {
  const [studentUsers, teacherUsers, rooms, timeSlots, compat, subjects] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT", studentProfile: { isNot: null } },
        select: {
          name: true,
          studentProfile: {
            select: {
              id: true,
              level: true,
              subjects: { select: { id: true } },
              availabilities: {
                where: { preference: { in: ["AVAILABLE", "PREFERRED"] } },
                select: { timeSlotId: true },
              },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { role: "TEACHER", teacherProfile: { isNot: null } },
        select: {
          name: true,
          teacherProfile: {
            select: {
              id: true,
              subjects: { select: { id: true } },
              availabilities: {
                where: { available: true },
                select: { timeSlotId: true },
              },
            },
          },
        },
      }),
      prisma.room.findMany({
        select: { id: true, name: true, capacity: true },
      }),
      prisma.timeSlot.findMany({
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
        },
      }),
      prisma.levelCompatibility.findMany({
        select: {
          subjectId: true,
          levelA: true,
          levelB: true,
          compatible: true,
        },
      }),
      prisma.subject.findMany({
        select: { id: true, name: true, minGroupSize: true, maxCapacity: true },
      }),
    ]);

  const students: StudentDemand[] = studentUsers
    .filter((u) => u.studentProfile !== null)
    .map((u) => ({
      studentId: u.studentProfile!.id,
      level: u.studentProfile!.level,
      subjectIds: u.studentProfile!.subjects.map((s) => s.id),
      availableTimeSlotIds: u.studentProfile!.availabilities.map(
        (a) => a.timeSlotId,
      ),
    }));

  const teachers: TeacherInput[] = teacherUsers
    .filter((u) => u.teacherProfile !== null)
    .map((u) => ({
      teacherId: u.teacherProfile!.id,
      subjectIds: u.teacherProfile!.subjects.map((s) => s.id),
      availableTimeSlotIds: u.teacherProfile!.availabilities.map(
        (a) => a.timeSlotId,
      ),
    }));

  const roomInputs: RoomInput[] = rooms.map((r) => ({
    roomId: r.id,
    capacity: r.capacity,
  }));

  const timeSlotInputs: TimeSlotInput[] = timeSlots.map((ts) => ({
    timeSlotId: ts.id,
  }));

  const compatibilityMatrix: CompatibilityRow[] = compat.map((r) => ({
    subjectId: r.subjectId,
    levelA: r.levelA,
    levelB: r.levelB,
    compatible: r.compatible,
  }));

  // Build enrichment maps.
  const studentNames = new Map<string, string>();
  for (const u of studentUsers) {
    if (u.studentProfile) studentNames.set(u.studentProfile.id, u.name);
  }
  const teacherNames = new Map<string, string>();
  for (const u of teacherUsers) {
    if (u.teacherProfile) teacherNames.set(u.teacherProfile.id, u.name);
  }
  const roomNames = new Map(rooms.map((r) => [r.id, r.name]));
  const subjectNames = new Map(subjects.map((s) => [s.id, s.name]));
  const subjectOverrides = new Map<string, SubjectOverrides>();
  for (const s of subjects) {
    if (s.minGroupSize != null || s.maxCapacity != null) {
      subjectOverrides.set(s.id, {
        minGroupSize: s.minGroupSize,
        maxCapacity: s.maxCapacity,
      });
    }
  }
  const timeSlotLabels = new Map<string, string>();
  const timeSlotsRaw = new Map<
    string,
    { dayOfWeek: string; startTime: string; endTime: string }
  >();
  for (const ts of timeSlots) {
    timeSlotLabels.set(
      ts.id,
      `${DAY_LABELS[ts.dayOfWeek] ?? ts.dayOfWeek} ${ts.startTime}–${ts.endTime}`,
    );
    timeSlotsRaw.set(ts.id, {
      dayOfWeek: ts.dayOfWeek,
      startTime: ts.startTime,
      endTime: ts.endTime,
    });
  }

  return {
    input: {
      students,
      teachers,
      rooms: roomInputs,
      timeSlots: timeSlotInputs,
      compatibilityMatrix,
      subjectOverrides,
    },
    studentNames,
    teacherNames,
    roomNames,
    subjectNames,
    timeSlotLabels,
    timeSlotsRaw,
  };
}
