"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const PreferenceEnum = z.enum(["PREFERRED", "AVAILABLE", "UNAVAILABLE"]);

const SaveSchema = z.object({
  /** JSON-encoded array of { timeSlotId, preference } */
  entries: z.string(),
});

const EntrySchema = z.array(
  z.object({
    timeSlotId: z.string().min(1),
    preference: PreferenceEnum,
  }),
);

export type AvailabilityState = { error?: string; ok?: boolean };

export async function saveStudentAvailability(
  _prev: AvailabilityState | undefined,
  formData: FormData,
): Promise<AvailabilityState> {
  const user = await requireRole("STUDENT");

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

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil élève introuvable." };

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
      prisma.studentAvailability.upsert({
        where: {
          studentId_timeSlotId: {
            studentId: profile.id,
            timeSlotId: e.timeSlotId,
          },
        },
        update: { preference: e.preference },
        create: {
          studentId: profile.id,
          timeSlotId: e.timeSlotId,
          preference: e.preference,
        },
      }),
    ),
  );

  revalidatePath("/student/availability");
  return { ok: true };
}
