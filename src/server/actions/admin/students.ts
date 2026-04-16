"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { audit } from "@/server/domain/auditLog";
import { LevelSchema } from "@/types/schemas";

const CreateStudentSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2).max(100),
  level: LevelSchema,
  subjectIds: z.array(z.string().min(1)).min(1, "Au moins une matière"),
  phone: z
    .string()
    .trim()
    .min(0)
    .max(30)
    .optional()
    .or(z.literal("")),
  guardianEmail: z.string().email().optional().or(z.literal("")),
  guardianPhone: z.string().trim().max(30).optional().or(z.literal("")),
});

export type ActionState = { error?: string; ok?: boolean };

export async function createStudent(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");

  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = CreateStudentSchema.safeParse({
    email: (formData.get("email") as string | null)?.trim(),
    name: (formData.get("name") as string | null)?.trim(),
    level: formData.get("level"),
    subjectIds,
    phone: (formData.get("phone") as string | null) ?? "",
    guardianEmail: (formData.get("guardianEmail") as string | null) ?? "",
    guardianPhone: (formData.get("guardianPhone") as string | null) ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: "Email déjà utilisé" };

  // Seed StudentAvailability on every existing TimeSlot as AVAILABLE
  // so the scheduler has data to work with by default.
  const timeSlots = await prisma.timeSlot.findMany({ select: { id: true } });

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      role: "STUDENT",
      studentProfile: {
        create: {
          level: parsed.data.level,
          phone: parsed.data.phone || null,
          guardianEmail: parsed.data.guardianEmail || null,
          guardianPhone: parsed.data.guardianPhone || null,
          subjects: {
            connect: parsed.data.subjectIds.map((id) => ({ id })),
          },
          availabilities: {
            create: timeSlots.map((ts) => ({
              timeSlotId: ts.id,
              preference: "AVAILABLE" as const,
            })),
          },
        },
      },
    },
  });

  await audit({
    userId: admin.id,
    action: "student.create",
    entityType: "User",
    payload: { email: parsed.data.email, name: parsed.data.name },
  });

  revalidatePath("/admin/students");
  return { ok: true };
}

const UpdateStudentSchema = z.object({
  userId: z.string().min(1),
  level: LevelSchema,
  subjectIds: z.array(z.string().min(1)).min(1, "Au moins une matière"),
});

export async function updateStudent(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const subjectIds = formData.getAll("subjectIds").map(String);
  const parsed = UpdateStudentSchema.safeParse({
    userId: formData.get("userId"),
    level: formData.get("level"),
    subjectIds,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: parsed.data.userId },
    select: { id: true },
  });
  if (!profile) return { error: "Profil introuvable" };

  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: {
      level: parsed.data.level,
      subjects: { set: parsed.data.subjectIds.map((id) => ({ id })) },
    },
  });

  revalidatePath("/admin/students");
  return { ok: true };
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const admin = await requireRole("ADMIN");
  const userId = formData.get("userId") as string | null;
  if (!userId) return;

  // Guard: don't delete if student has confirmed enrollments.
  const student = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (student && student._count.enrollments > 0) return;

  await prisma.user.delete({ where: { id: userId } });

  await audit({
    userId: admin.id,
    action: "student.delete",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/students");
}
