"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
});

export type ActionState = { error?: string; ok?: boolean };

export async function createSubject(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = CreateSubjectSchema.safeParse({
    name: (formData.get("name") as string | null)?.trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.subject.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return { error: "Matière déjà existante" };

  await prisma.subject.create({ data: { name: parsed.data.name } });
  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function deleteSubject(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;

  // Refuse to delete if referenced (keeps data integrity simple).
  const inUse = await prisma.subject.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          sessions: true,
          sessionTemplates: true,
        },
      },
    },
  });
  if (!inUse) return;
  const refs =
    inUse._count.students +
    inUse._count.teachers +
    inUse._count.sessions +
    inUse._count.sessionTemplates;
  if (refs > 0) return; // Silent: UI hides delete when inUse

  await prisma.subject.delete({ where: { id } });
  revalidatePath("/admin/subjects");
}
