"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const ATTENDANCE_VALUES = ["PENDING", "PRESENT", "ABSENT", "LATE"] as const;
const AttendanceSchema = z.enum(ATTENDANCE_VALUES);

/**
 * Teacher marks attendance for a single enrollment on one of their sessions.
 * Verifies ownership to prevent cross-teacher writes.
 */
export async function markAttendance(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");
  const enrollmentId = formData.get("enrollmentId") as string | null;
  const statusRaw = formData.get("attendance") as string | null;
  if (!enrollmentId || !statusRaw) return;

  const parsed = AttendanceSchema.safeParse(statusRaw);
  if (!parsed.success) return;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      session: { select: { id: true, teacherId: true } },
    },
  });
  if (!enrollment) return;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!teacher || enrollment.session.teacherId !== teacher.id) return;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { attendance: parsed.data },
  });

  revalidatePath(`/teacher/sessions/${enrollment.session.id}/attendance`);
  revalidatePath("/teacher/schedule");
  revalidatePath("/teacher/students");
}

/**
 * Bulk-mark attendance for all enrollments in a session at once.
 * Form field naming: `attendance_<enrollmentId>` with a valid enum value.
 */
export async function markAttendanceBulk(formData: FormData): Promise<void> {
  const user = await requireRole("TEACHER");
  const sessionId = formData.get("sessionId") as string | null;
  if (!sessionId) return;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!teacher) return;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { teacherId: true, enrollments: { select: { id: true } } },
  });
  if (!session || session.teacherId !== teacher.id) return;

  const updates: Array<{ id: string; value: (typeof ATTENDANCE_VALUES)[number] }> =
    [];
  for (const enrollment of session.enrollments) {
    const raw = formData.get(`attendance_${enrollment.id}`);
    if (typeof raw !== "string") continue;
    const parsed = AttendanceSchema.safeParse(raw);
    if (parsed.success) {
      updates.push({ id: enrollment.id, value: parsed.data });
    }
  }

  if (updates.length === 0) return;

  await prisma.$transaction(
    updates.map((u) =>
      prisma.enrollment.update({
        where: { id: u.id },
        data: { attendance: u.value },
      }),
    ),
  );

  revalidatePath(`/teacher/sessions/${sessionId}/attendance`);
  revalidatePath("/teacher/schedule");
  revalidatePath("/teacher/students");
}
