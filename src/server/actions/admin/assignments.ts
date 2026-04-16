"use server";

// Assignment actions.
// - previewAssignments(weekStart) → runs proposeAssignments against live DB,
//   returns a UI-friendly, fully-serializable preview (no Maps, no Dates).
// - commitAssignments(weekStart) → re-runs the same deterministic proposal
//   (the algorithm is pure on DB state) and writes Session + Enrollment rows
//   inside a transaction. Sessions that would collide with existing rows
//   (roomId + startAt unique) are skipped so re-running is safe.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { DayOfWeek, Level } from "@/generated/prisma/enums";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { proposeAssignments } from "@/server/domain/scheduling/assignment";
import { loadAssignmentContext } from "@/server/domain/scheduling/load";
import {
  mondayOf,
  timeSlotToDates,
} from "@/server/domain/scheduling/weekDates";
import {
  frenchDateLabel,
  notifyMany,
  sessionAssignedInputs,
  sessionCancelledInputs,
} from "@/server/domain/notifications/create";
import { audit } from "@/server/domain/auditLog";

const WeekStartSchema = z.object({
  weekStart: z.string().min(8), // ISO date, e.g. "2026-04-13"
});

function parseWeekStart(input: unknown): Date {
  const parsed = WeekStartSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Date de semaine invalide");
  }
  const d = new Date(parsed.data.weekStart + "T00:00:00");
  if (Number.isNaN(d.getTime())) {
    throw new Error("Date invalide");
  }
  return mondayOf(d);
}

// ---- Preview ----

export type ProposedRow = {
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  timeSlotId: string;
  timeSlotLabel: string;
  startAt: string; // ISO for display
  endAt: string;
  levels: Level[];
  studentIds: string[];
  studentNames: string[];
  rationale: string;
  collidesWithExisting: boolean;
};

export type UnassignedRow = {
  studentId: string;
  studentName: string;
  level: Level;
  missingSubjectIds: string[];
  missingSubjectNames: string[];
};

export type PreviewResult = {
  weekStart: string; // ISO
  proposedSessions: ProposedRow[];
  unassigned: UnassignedRow[];
  score: {
    fillRate: number;
    mergedCount: number;
    unassignedCount: number;
  };
  warnings: string[];
};

export async function previewAssignments(
  weekStartISO: string,
): Promise<PreviewResult> {
  await requireRole("ADMIN");
  const weekStart = parseWeekStart({ weekStart: weekStartISO });

  const ctx = await loadAssignmentContext();

  const warnings: string[] = [];
  if (ctx.input.students.length === 0)
    warnings.push("Aucun élève — crée des élèves dans /admin/students.");
  if (ctx.input.teachers.length === 0)
    warnings.push("Aucun professeur — crée des profs dans /admin/teachers.");
  if (ctx.input.rooms.length === 0) warnings.push("Aucune salle.");
  if (ctx.input.timeSlots.length === 0) warnings.push("Aucun créneau.");

  const result = proposeAssignments(ctx.input);

  // Check collisions against persisted sessions in this week.
  const existingThisWeek = await prisma.session.findMany({
    where: {
      date: {
        gte: weekStart,
        lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
      status: { not: "CANCELLED" },
    },
    select: { roomId: true, startAt: true },
  });
  const existingKeys = new Set(
    existingThisWeek.map((s) => `${s.roomId}::${s.startAt.toISOString()}`),
  );

  const proposedSessions: ProposedRow[] = result.proposedSessions.map((p) => {
    const tsRaw = ctx.timeSlotsRaw.get(p.timeSlotId);
    const { startAt, endAt } = tsRaw
      ? timeSlotToDates(weekStart, {
          dayOfWeek: tsRaw.dayOfWeek as DayOfWeek,
          startTime: tsRaw.startTime,
          endTime: tsRaw.endTime,
        })
      : {
          startAt: new Date(0),
          endAt: new Date(0),
        };
    const key = `${p.roomId}::${startAt.toISOString()}`;
    return {
      subjectId: p.subjectId,
      subjectName: ctx.subjectNames.get(p.subjectId) ?? p.subjectId,
      teacherId: p.teacherId,
      teacherName: ctx.teacherNames.get(p.teacherId) ?? p.teacherId,
      roomId: p.roomId,
      roomName: ctx.roomNames.get(p.roomId) ?? p.roomId,
      timeSlotId: p.timeSlotId,
      timeSlotLabel: ctx.timeSlotLabels.get(p.timeSlotId) ?? p.timeSlotId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      levels: p.levels,
      studentIds: p.studentIds,
      studentNames: p.studentIds.map(
        (sid) => ctx.studentNames.get(sid) ?? sid,
      ),
      rationale: p.rationale,
      collidesWithExisting: existingKeys.has(key),
    };
  });

  const unassigned: UnassignedRow[] = result.unassignedStudents.map((u) => ({
    studentId: u.studentId,
    studentName: ctx.studentNames.get(u.studentId) ?? u.studentId,
    level: u.level,
    missingSubjectIds: u.subjectIds,
    missingSubjectNames: u.subjectIds.map(
      (id) => ctx.subjectNames.get(id) ?? id,
    ),
  }));

  return {
    weekStart: weekStart.toISOString(),
    proposedSessions,
    unassigned,
    score: result.score,
    warnings,
  };
}

// ---- Commit ----

export type CommitState = { error?: string; ok?: boolean; created?: number };

export async function commitAssignments(
  _prev: CommitState | undefined,
  formData: FormData,
): Promise<CommitState> {
  await requireRole("ADMIN");
  let weekStart: Date;
  try {
    weekStart = parseWeekStart({ weekStart: formData.get("weekStart") });
  } catch (e) {
    return { error: (e as Error).message };
  }

  const ctx = await loadAssignmentContext();
  const result = proposeAssignments(ctx.input);
  if (result.proposedSessions.length === 0) {
    return { error: "Aucune séance à créer." };
  }

  // Materialize each proposed session to concrete dates.
  const toCreate = result.proposedSessions.map((p) => {
    const raw = ctx.timeSlotsRaw.get(p.timeSlotId)!;
    const { date, startAt, endAt } = timeSlotToDates(weekStart, {
      dayOfWeek: raw.dayOfWeek as DayOfWeek,
      startTime: raw.startTime,
      endTime: raw.endTime,
    });
    return { p, date, startAt, endAt };
  });

  // Skip any that would collide with existing sessions (unique @ roomId+startAt).
  const existing = await prisma.session.findMany({
    where: {
      roomId: { in: toCreate.map((c) => c.p.roomId) },
      startAt: { in: toCreate.map((c) => c.startAt) },
    },
    select: { roomId: true, startAt: true },
  });
  const existingKeys = new Set(
    existing.map((s) => `${s.roomId}::${s.startAt.toISOString()}`),
  );

  const creatable = toCreate.filter(
    (c) => !existingKeys.has(`${c.p.roomId}::${c.startAt.toISOString()}`),
  );
  if (creatable.length === 0) {
    return { error: "Toutes les séances existent déjà pour cette semaine." };
  }

  let created = 0;
  const createdSessions: Array<{
    id: string;
    subjectId: string;
    studentIds: string[];
    startAt: Date;
  }> = [];
  await prisma.$transaction(async (tx) => {
    for (const c of creatable) {
      const session = await tx.session.create({
        data: {
          subjectId: c.p.subjectId,
          teacherId: c.p.teacherId,
          roomId: c.p.roomId,
          timeSlotId: c.p.timeSlotId,
          date: c.date,
          startAt: c.startAt,
          endAt: c.endAt,
          levels: c.p.levels,
          maxCapacity: 10,
          status: "CONFIRMED",
          enrollments: {
            create: c.p.studentIds.map((sid) => ({
              studentId: sid,
              status: "CONFIRMED" as const,
            })),
          },
        },
      });
      if (session) {
        created += 1;
        createdSessions.push({
          id: session.id,
          subjectId: c.p.subjectId,
          studentIds: c.p.studentIds,
          startAt: c.startAt,
        });
      }
    }
  });

  // Notifications: look up each enrolled student's User.id (for the notif row)
  // and emit SESSION_ASSIGNED. Failures here are logged but don't roll back.
  if (createdSessions.length > 0) {
    const allStudentProfileIds = Array.from(
      new Set(createdSessions.flatMap((s) => s.studentIds)),
    );
    const profileToUser = await prisma.studentProfile.findMany({
      where: { id: { in: allStudentProfileIds } },
      select: { id: true, userId: true },
    });
    const userIdByProfileId = new Map(
      profileToUser.map((p) => [p.id, p.userId]),
    );
    const inputs = createdSessions.flatMap((s) =>
      sessionAssignedInputs({
        enrolledUserIds: s.studentIds
          .map((sid) => userIdByProfileId.get(sid))
          .filter((v): v is string => Boolean(v)),
        subjectName: ctx.subjectNames.get(s.subjectId) ?? "une matière",
        dateLabel: frenchDateLabel(s.startAt),
        sessionId: s.id,
      }),
    );
    await notifyMany(inputs);
  }

  const admin = await requireRole("ADMIN");
  await audit({
    userId: admin.id,
    action: "assignment.commit",
    entityType: "Session",
    payload: { weekStart: weekStart.toISOString(), created },
  });

  revalidatePath("/admin/assignments");
  revalidatePath("/admin/sessions");
  return { ok: true, created };
}

// ---- Session cancellation ----

export async function cancelSession(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;

  // Look up session + enrolled students BEFORE cancelling so we can notify them.
  const session = await prisma.session.findUnique({
    where: { id },
    select: {
      id: true,
      startAt: true,
      subject: { select: { name: true } },
      enrollments: {
        where: { status: "CONFIRMED" },
        select: { student: { select: { userId: true } } },
      },
    },
  });

  await prisma.session.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  if (session) {
    await notifyMany(
      sessionCancelledInputs({
        enrolledUserIds: session.enrollments.map((e) => e.student.userId),
        subjectName: session.subject.name,
        dateLabel: frenchDateLabel(session.startAt),
        sessionId: session.id,
      }),
    );
  }

  await audit({
    userId: admin.id,
    action: "session.cancel",
    entityType: "Session",
    entityId: id,
    payload: { subjectName: session?.subject.name },
  });

  revalidatePath("/admin/sessions");
  revalidatePath("/student/schedule");
  revalidatePath("/teacher/schedule");
}
