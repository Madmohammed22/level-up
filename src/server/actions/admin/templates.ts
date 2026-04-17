"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { audit } from "@/server/domain/auditLog";

// ---- helpers ----

const DAY_INDEX: Record<string, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

function nextDateForDay(dayOfWeek: string, afterDate: Date): Date {
  const target = DAY_INDEX[dayOfWeek];
  if (target === undefined) throw new Error(`Unknown day: ${dayOfWeek}`);
  const d = new Date(afterDate);
  d.setHours(0, 0, 0, 0);
  const current = d.getDay();
  const diff = (target - current + 7) % 7 || 7; // next occurrence (skip same day)
  d.setDate(d.getDate() + diff);
  return d;
}

function dateForDayInWeek(dayOfWeek: string, monday: Date): Date {
  const target = DAY_INDEX[dayOfWeek];
  if (target === undefined) throw new Error(`Unknown day: ${dayOfWeek}`);
  const d = new Date(monday);
  // monday.getDay() === 1
  const offset = target === 0 ? 6 : target - 1; // 0=Sun→6, 1=Mon→0, etc.
  d.setDate(d.getDate() + offset);
  return d;
}

// ---- create template ----

const CreateSchema = z.object({
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  roomId: z.string().min(1),
  timeSlotId: z.string().min(1),
  maxCapacity: z.coerce.number().int().min(1).max(50).default(10),
  levels: z.string().min(1), // comma-separated
  recurrence: z.enum(["WEEKLY", "ONE_OFF"]),
  validFrom: z.string().min(1), // ISO date
  validUntil: z.string().optional(),
});

export async function createSessionTemplate(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = CreateSchema.safeParse({
    subjectId: formData.get("subjectId"),
    teacherId: formData.get("teacherId"),
    roomId: formData.get("roomId"),
    timeSlotId: formData.get("timeSlotId"),
    maxCapacity: formData.get("maxCapacity"),
    levels: formData.get("levels"),
    recurrence: formData.get("recurrence"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Entrée invalide");
  }

  const levels = parsed.data.levels
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean) as Array<
    "GRADE_9" | "GRADE_10" | "GRADE_11" | "GRADE_12"
  >;

  await prisma.sessionTemplate.create({
    data: {
      subjectId: parsed.data.subjectId,
      teacherId: parsed.data.teacherId,
      roomId: parsed.data.roomId,
      timeSlotId: parsed.data.timeSlotId,
      maxCapacity: parsed.data.maxCapacity,
      levels,
      recurrence: parsed.data.recurrence,
      validFrom: new Date(parsed.data.validFrom),
      validUntil: parsed.data.validUntil
        ? new Date(parsed.data.validUntil)
        : null,
    },
  });

  await audit({
    userId: admin.id,
    action: "template.create",
    entityType: "SessionTemplate",
    payload: { subjectId: parsed.data.subjectId, recurrence: parsed.data.recurrence },
  });

  revalidatePath("/dashboard/admin/templates");
}

// ---- delete template ----

export async function deleteSessionTemplate(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = formData.get("id") as string;
  if (!id) return;

  // Only delete if no sessions linked
  const count = await prisma.session.count({ where: { templateId: id } });
  if (count > 0) {
    throw new Error(
      "Impossible de supprimer : des séances existent pour ce modèle.",
    );
  }

  await prisma.sessionTemplate.delete({ where: { id } });

  await audit({
    userId: admin.id,
    action: "template.delete",
    entityType: "SessionTemplate",
    entityId: id,
  });

  revalidatePath("/dashboard/admin/templates");
}

// ---- generate sessions from template ----

const GenerateSchema = z.object({
  templateId: z.string().min(1),
  weeks: z.coerce.number().int().min(1).max(12).default(4),
  startDate: z.string().min(1), // ISO date — first Monday of the range
});

export async function generateSessionsFromTemplate(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = GenerateSchema.safeParse({
    templateId: formData.get("templateId"),
    weeks: formData.get("weeks"),
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Entrée invalide");
  }

  const template = await prisma.sessionTemplate.findUnique({
    where: { id: parsed.data.templateId },
    include: { timeSlot: true },
  });

  if (!template) throw new Error("Modèle introuvable");

  const startMonday = new Date(parsed.data.startDate);
  startMonday.setHours(0, 0, 0, 0);
  // Snap to Monday
  const dayOff = (startMonday.getDay() + 6) % 7;
  startMonday.setDate(startMonday.getDate() - dayOff);

  const weekCount =
    template.recurrence === "ONE_OFF" ? 1 : parsed.data.weeks;

  const sessionsToCreate: Array<{
    templateId: string;
    subjectId: string;
    teacherId: string;
    roomId: string;
    timeSlotId: string;
    date: Date;
    startAt: Date;
    endAt: Date;
    maxCapacity: number;
    levels: typeof template.levels;
    status: "DRAFT";
  }> = [];

  for (let w = 0; w < weekCount; w++) {
    const weekMonday = new Date(startMonday);
    weekMonday.setDate(weekMonday.getDate() + w * 7);

    const sessionDate = dateForDayInWeek(
      template.timeSlot.dayOfWeek,
      weekMonday,
    );

    // Check validFrom / validUntil
    if (sessionDate < template.validFrom) continue;
    if (template.validUntil && sessionDate > template.validUntil) continue;

    // Parse time "HH:MM"
    const [startH, startM] = template.timeSlot.startTime.split(":").map(Number);
    const [endH, endM] = template.timeSlot.endTime.split(":").map(Number);

    const startAt = new Date(sessionDate);
    startAt.setHours(startH, startM, 0, 0);
    const endAt = new Date(sessionDate);
    endAt.setHours(endH, endM, 0, 0);

    // Skip if session already exists for same template + date
    const existing = await prisma.session.findFirst({
      where: {
        templateId: template.id,
        date: sessionDate,
      },
    });
    if (existing) continue;

    sessionsToCreate.push({
      templateId: template.id,
      subjectId: template.subjectId,
      teacherId: template.teacherId,
      roomId: template.roomId,
      timeSlotId: template.timeSlotId,
      date: sessionDate,
      startAt,
      endAt,
      maxCapacity: template.maxCapacity,
      levels: template.levels,
      status: "DRAFT",
    });
  }

  if (sessionsToCreate.length > 0) {
    await prisma.session.createMany({ data: sessionsToCreate });
  }

  await audit({
    userId: admin.id,
    action: "template.generate",
    entityType: "Session",
    payload: { templateId: parsed.data.templateId, created: sessionsToCreate.length },
  });

  revalidatePath("/dashboard/admin/templates");
  revalidatePath("/dashboard/admin/sessions");

  return { created: sessionsToCreate.length };
}
