"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const SaveSchema = z.object({
  /** JSON-encoded array of { timeSlotId, available } */
  entries: z.string(),
});

const EntrySchema = z.array(
  z.object({
    timeSlotId: z.string().min(1),
    available: z.boolean(),
  }),
);

export type TeacherAvailabilityState = { error?: string; ok?: boolean };

export async function saveTeacherAvailability(
  _prev: TeacherAvailabilityState | undefined,
  formData: FormData,
): Promise<TeacherAvailabilityState> {
  const user = await requireRole("TEACHER");

  const raw = SaveSchema.safeParse({ entries: formData.get("entries") });
  if (!raw.success) {
    return { error: "Données invalides." };
  }

  let entries: z.infer<typeof EntrySchema>;
  try {
    entries = EntrySchema.parse(JSON.parse(raw.data.entries));
  } catch {
    return { error: "Format des créneaux invalide." };
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil professeur introuvable." };

  // Verify all timeSlotIds exist
  const validIds = await prisma.timeSlot.findMany({
    where: { id: { in: entries.map((e) => e.timeSlotId) } },
    select: { id: true },
  });
  const validSet = new Set(validIds.map((t) => t.id));
  const invalid = entries.filter((e) => !validSet.has(e.timeSlotId));
  if (invalid.length > 0) {
    return { error: `Créneau(x) inconnu(s) : ${invalid.length}` };
  }

  // Upsert all in a transaction
  await prisma.$transaction(
    entries.map((e) =>
      prisma.teacherAvailability.upsert({
        where: {
          teacherId_timeSlotId: {
            teacherId: profile.id,
            timeSlotId: e.timeSlotId,
          },
        },
        update: { available: e.available },
        create: {
          teacherId: profile.id,
          timeSlotId: e.timeSlotId,
          available: e.available,
        },
      }),
    ),
  );

  revalidatePath("/teacher/availability");
  return { ok: true };
}
