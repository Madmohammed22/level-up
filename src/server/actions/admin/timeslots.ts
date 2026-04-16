"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { DayOfWeekSchema } from "@/types/schemas";

const TimeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

const CreateTimeSlotSchema = z
  .object({
    dayOfWeek: DayOfWeekSchema,
    startTime: z.string().regex(TimeRe, "Format HH:MM"),
    endTime: z.string().regex(TimeRe, "Format HH:MM"),
  })
  .refine((d) => d.startTime < d.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

export type ActionState = { error?: string; ok?: boolean };

export async function createTimeSlot(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = CreateTimeSlotSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.timeSlot.findUnique({
    where: {
      dayOfWeek_startTime_endTime: {
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
    },
  });
  if (existing) return { error: "Créneau déjà existant" };

  await prisma.timeSlot.create({ data: parsed.data });
  revalidatePath("/admin/timeslots");
  return { ok: true };
}

export async function deleteTimeSlot(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;

  const slot = await prisma.timeSlot.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          sessions: true,
          sessionTemplates: true,
          teacherAvailabilities: true,
          studentAvailabilities: true,
        },
      },
    },
  });
  if (!slot) return;
  const refs =
    slot._count.sessions +
    slot._count.sessionTemplates +
    slot._count.teacherAvailabilities +
    slot._count.studentAvailabilities;
  if (refs > 0) return;

  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath("/admin/timeslots");
}
