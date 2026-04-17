"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CreateExamSchema = z.object({
  studentId: z.string().min(1, "Élève requis"),
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

export type ExamState = { error?: string; ok?: boolean };

export async function createExamDate(
  _prev: ExamState | undefined,
  formData: FormData,
): Promise<ExamState> {
  await requireRole("ADMIN");
  const parsed = CreateExamSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    date: formData.get("date"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await prisma.examDate.create({
    data: {
      studentId: parsed.data.studentId,
      subjectId: parsed.data.subjectId,
      date: parsed.data.date,
    },
  });

  revalidatePath("/dashboard/admin/exams");
  revalidatePath("/dashboard/student");
  return { ok: true };
}

export async function deleteExamDate(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;
  await prisma.examDate.delete({ where: { id } });
  revalidatePath("/dashboard/admin/exams");
  revalidatePath("/dashboard/student");
}

export async function toggleExamProtocol(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;
  const current = await prisma.examDate.findUnique({
    where: { id },
    select: { protocolActivated: true },
  });
  if (!current) return;
  await prisma.examDate.update({
    where: { id },
    data: { protocolActivated: !current.protocolActivated },
  });
  revalidatePath("/dashboard/admin/exams");
  revalidatePath("/dashboard/student");
}
