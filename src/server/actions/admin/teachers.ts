"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { audit } from "@/server/domain/auditLog";

const CreateTeacherSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  subjectIds: z.array(z.string().min(1)).min(1, "Au moins une matière"),
});

export type ActionState = { error?: string; ok?: boolean };

export async function createTeacher(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");

  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = CreateTeacherSchema.safeParse({
    email: (formData.get("email") as string | null)?.trim(),
    name: (formData.get("name") as string | null)?.trim(),
    bio: (formData.get("bio") as string | null) || undefined,
    subjectIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "Email déjà utilisé" };

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "TEACHER",
      teacherProfile: {
        create: {
          bio: parsed.data.bio,
          subjects: { connect: parsed.data.subjectIds.map((id) => ({ id })) },
        },
      },
    },
  });

  await audit({
    userId: admin.id,
    action: "teacher.create",
    entityType: "User",
    payload: { email: parsed.data.email, name: parsed.data.name },
  });

  revalidatePath("/admin/teachers");
  return { ok: true };
}

const UpdateTeacherSchema = z.object({
  userId: z.string().min(1),
  subjectIds: z.array(z.string().min(1)).min(1, "Au moins une matière"),
});

export async function updateTeacher(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = UpdateTeacherSchema.safeParse({
    userId: formData.get("userId"),
    subjectIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: parsed.data.userId },
    select: { id: true },
  });
  if (!profile) return { error: "Profil introuvable" };

  await prisma.teacherProfile.update({
    where: { id: profile.id },
    data: {
      subjects: { set: parsed.data.subjectIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/admin/teachers");
  return { ok: true };
}

export type DeleteState = { error?: string };

export async function deleteTeacher(
  _prev: DeleteState | undefined,
  formData: FormData,
): Promise<DeleteState> {
  const admin = await requireRole("ADMIN");
  const userId = formData.get("userId") as string | null;
  if (!userId) return { error: "ID manquant" };

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId },
    include: {
      _count: { select: { sessions: true, sessionTemplates: true } },
    },
  });
  if (!teacher) return { error: "Professeur introuvable" };

  const refs = teacher._count.sessions + teacher._count.sessionTemplates;
  if (refs > 0) {
    return {
      error: `Impossible : ${teacher._count.sessions} séance(s) et ${teacher._count.sessionTemplates} modèle(s) liés. Supprimez-les d'abord.`,
    };
  }

  await prisma.user.delete({ where: { id: userId } });

  await audit({
    userId: admin.id,
    action: "teacher.delete",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/teachers");
  return {};
}
