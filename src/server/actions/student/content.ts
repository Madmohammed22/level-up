"use server";

// Mark a content item as completed (idempotent).

import { revalidatePath } from "next/cache";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

export async function markContentDone(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const contentItemId = formData.get("contentItemId") as string | null;
  if (!contentItemId) return;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return;

  await prisma.contentCompletion.upsert({
    where: {
      studentId_contentItemId: {
        studentId: profile.id,
        contentItemId,
      },
    },
    update: {},
    create: { studentId: profile.id, contentItemId },
  });
  revalidatePath("/student/methodology");
}

export async function unmarkContentDone(formData: FormData): Promise<void> {
  const user = await requireRole("STUDENT");
  const contentItemId = formData.get("contentItemId") as string | null;
  if (!contentItemId) return;

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return;

  await prisma.contentCompletion.deleteMany({
    where: { studentId: profile.id, contentItemId },
  });
  revalidatePath("/student/methodology");
}
