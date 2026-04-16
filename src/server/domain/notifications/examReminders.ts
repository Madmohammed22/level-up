// Sends EXAM_APPROACHING notifications for exams happening in 7 days.
// Idempotent — safe to call multiple times per day.

import { prisma } from "@/server/db/prisma";
import { notifyMany, type NotifyInput } from "./create";

export async function sendExamReminders(): Promise<{
  sent: number;
  skipped: number;
}> {
  const now = new Date();
  const targetDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 7,
  );
  const dayAfter = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate() + 1,
  );

  const exams = await prisma.examDate.findMany({
    where: { date: { gte: targetDate, lt: dayAfter } },
    include: {
      student: { include: { user: { select: { id: true } } } },
      subject: { select: { name: true } },
    },
  });

  if (exams.length === 0) return { sent: 0, skipped: 0 };

  // Idempotency: skip exams already notified in the last 24 hours
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentNotifs = await prisma.notification.findMany({
    where: { type: "EXAM_APPROACHING", createdAt: { gte: yesterday } },
    select: { data: true },
  });

  const alreadyNotified = new Set<string>();
  for (const n of recentNotifs) {
    const d = n.data as Record<string, unknown> | null;
    if (d?.examDateId && typeof d.examDateId === "string") {
      alreadyNotified.add(d.examDateId);
    }
  }

  const inputs: NotifyInput[] = [];
  for (const exam of exams) {
    if (alreadyNotified.has(exam.id)) continue;
    const dd = String(exam.date.getDate()).padStart(2, "0");
    const mm = String(exam.date.getMonth() + 1).padStart(2, "0");
    const dateLabel = `${dd}/${mm}/${exam.date.getFullYear()}`;

    inputs.push({
      userId: exam.student.user.id,
      type: "EXAM_APPROACHING",
      title: `Examen de ${exam.subject.name} dans 7 jours`,
      body: `Ton examen de ${exam.subject.name} est prévu le ${dateLabel}. Pense à activer ton protocole anti-stress !`,
      data: { examDateId: exam.id, subjectName: exam.subject.name },
    });
  }

  if (inputs.length > 0) await notifyMany(inputs);

  return { sent: inputs.length, skipped: exams.length - inputs.length };
}
