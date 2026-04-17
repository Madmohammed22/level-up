"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CreateExamSchema = z.object({
  subjectId: z.string().min(1, "Matière requise"),
  date: z
    .string()
    .min(1, "Date requise")
    .transform((v, ctx) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: "custom", message: "Date invalide" });
        return z.NEVER;
      }
      return d;
    }),
});

export type StudentExamState = { error?: string; ok?: boolean };

export async function createStudentExam(
  _prev: StudentExamState | undefined,
  formData: FormData,
): Promise<StudentExamState> {
  const user = await requireRole("STUDENT");

  const parsed = CreateExamSchema.safeParse({
    subjectId: formData.get("subjectId"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, subjects: { select: { id: true } } },
  });
  if (!profile) return { error: "Profil élève introuvable." };

  // Verify student is enrolled in this subject
  const enrolled = profile.subjects.some((s) => s.id === parsed.data.subjectId);
  if (!enrolled) {
    return { error: "Tu n'es pas inscrit dans cette matière." };
  }

  // Check date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed.data.date < today) {
    return { error: "La date doit être dans le futur." };
  }

  await prisma.examDate.create({
    data: {
      studentId: profile.id,
      subjectId: parsed.data.subjectId,
      date: parsed.data.date,
    },
  });

  revalidatePath("/dashboard/student/exams");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/exams");
  return { ok: true };
}

export async function deleteStudentExam(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const id = formData.get("id") as string | null;
  if (!id) return;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return;

  // Only delete if exam belongs to this student
  await prisma.examDate.deleteMany({
    where: { id, studentId: profile.id },
  });

  revalidatePath("/dashboard/student/exams");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/exams");
}
