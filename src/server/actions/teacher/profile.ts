"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});

export type TeacherProfileState = { error?: string; ok?: boolean };

export async function updateTeacherProfile(
  _prev: TeacherProfileState | undefined,
  formData: FormData,
): Promise<TeacherProfileState> {
  const user = await requireRole("TEACHER");

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil professeur introuvable." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    }),
    prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { bio: parsed.data.bio || null },
    }),
  ]);

  revalidatePath("/dashboard/teacher/profile");
  return { ok: true };
}
