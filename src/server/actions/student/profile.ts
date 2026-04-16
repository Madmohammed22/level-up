"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  guardianEmail: z.string().trim().email("Email invalide").optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(20).optional().or(z.literal("")),
});

export type StudentProfileState = { error?: string; ok?: boolean };

export async function updateStudentProfile(
  _prev: StudentProfileState | undefined,
  formData: FormData,
): Promise<StudentProfileState> {
  const user = await requireRole("STUDENT");

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") ?? "",
    guardianEmail: formData.get("guardianEmail") ?? "",
    guardianPhone: formData.get("guardianPhone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil élève introuvable." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name },
    }),
    prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        phone: parsed.data.phone || null,
        guardianEmail: parsed.data.guardianEmail || null,
        guardianPhone: parsed.data.guardianPhone || null,
      },
    }),
  ]);

  revalidatePath("/student/profile");
  return { ok: true };
}
