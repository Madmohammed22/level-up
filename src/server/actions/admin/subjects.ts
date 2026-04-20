"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  minGroupSize: z.coerce.number().int().min(1).max(30).nullable().optional(),
  maxCapacity: z.coerce.number().int().min(1).max(30).nullable().optional(),
}).refine(
  (d) => (d.minGroupSize ?? 4) <= (d.maxCapacity ?? 10),
  { message: "Min. groupe ne peut pas dépasser Max. élèves", path: ["minGroupSize"] },
);

export type ActionState = { error?: string; ok?: boolean };

export async function createSubject(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const rawMin = formData.get("minGroupSize") as string | null;
  const rawMax = formData.get("maxCapacity") as string | null;
  const parsed = CreateSubjectSchema.safeParse({
    name: (formData.get("name") as string | null)?.trim(),
    minGroupSize: rawMin ? Number(rawMin) : null,
    maxCapacity: rawMax ? Number(rawMax) : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.subject.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return { error: "Matière déjà existante" };

  await prisma.subject.create({
    data: {
      name: parsed.data.name,
      minGroupSize: parsed.data.minGroupSize ?? undefined,
      maxCapacity: parsed.data.maxCapacity ?? undefined,
    },
  });
  revalidatePath("/dashboard/admin/subjects");
  return { ok: true };
}

const UpdateSubjectSchema = z.object({
  id: z.string().min(1),
  minGroupSize: z.coerce.number().int().min(1).max(30).nullable(),
  maxCapacity: z.coerce.number().int().min(1).max(30).nullable(),
}).refine(
  (d) => (d.minGroupSize ?? 4) <= (d.maxCapacity ?? 10),
  { message: "Min. groupe ne peut pas dépasser Max. élèves", path: ["minGroupSize"] },
);

export async function updateSubjectParams(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const rawMin = formData.get("minGroupSize") as string | null;
  const rawMax = formData.get("maxCapacity") as string | null;
  const parsed = UpdateSubjectSchema.safeParse({
    id: formData.get("id"),
    minGroupSize: rawMin ? Number(rawMin) : null,
    maxCapacity: rawMax ? Number(rawMax) : null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await prisma.subject.update({
    where: { id: parsed.data.id },
    data: {
      minGroupSize: parsed.data.minGroupSize,
      maxCapacity: parsed.data.maxCapacity,
    },
  });
  revalidatePath("/dashboard/admin/subjects");
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
  revalidatePath("/dashboard/admin/subjects");
}
