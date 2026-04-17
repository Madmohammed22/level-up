"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const MoodSchema = z.object({
  score: z.coerce.number().int().min(1).max(5),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MoodState = { error?: string; ok?: boolean };

export async function submitMoodCheckIn(
  _prev: MoodState | undefined,
  formData: FormData,
): Promise<MoodState> {
  const user = await requireRole("STUDENT");
  const parsed = MoodSchema.safeParse({
    score: formData.get("score"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil élève introuvable" };

  await prisma.moodCheckIn.create({
    data: {
      studentId: profile.id,
      type: "DAILY",
      score: parsed.data.score,
      note: parsed.data.note || null,
    },
  });

  revalidatePath("/dashboard/student/mood");
  return { ok: true };
}
