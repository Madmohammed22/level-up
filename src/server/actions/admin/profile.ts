"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(100),
});

export type AdminProfileState = { error?: string; ok?: boolean };

export async function updateAdminProfile(
  _prev: AdminProfileState | undefined,
  formData: FormData,
): Promise<AdminProfileState> {
  const user = await requireRole("ADMIN");

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/admin/profile");
  return { ok: true };
}
