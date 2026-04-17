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
  revalidatePath("/dashboard/admin/timeslots");
  return { ok: true };
}

export type DeleteState = { error?: string };

export async function deleteTimeSlot(
  _prev: DeleteState | undefined,
  formData: FormData,
): Promise<DeleteState> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return { error: "ID manquant" };

  const slot = await prisma.timeSlot.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          sessions: true,
          sessionTemplates: true,
        },
      },
    },
  });
  if (!slot) return { error: "Créneau introuvable" };

  // Block if sessions or templates reference this slot
  const hardRefs = slot._count.sessions + slot._count.sessionTemplates;
  if (hardRefs > 0) {
    return {
      error: `Impossible : ${slot._count.sessions} séance(s) et ${slot._count.sessionTemplates} modèle(s) utilisent ce créneau. Supprimez-les d'abord.`,
    };
  }

  // Availabilities cascade-delete automatically (onDelete: Cascade in schema)
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath("/dashboard/admin/timeslots");
  return {};
}
