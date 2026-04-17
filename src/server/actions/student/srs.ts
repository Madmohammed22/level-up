"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getStudentProfile() {
  const user = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) throw new Error("Profil élève introuvable.");
  return { user, profile };
}

const REVALIDATE_PATHS = [
  "/dashboard/student/revisions",
  "/dashboard/student",
];

function revalidateSrs() {
  for (const p of REVALIDATE_PATHS) revalidatePath(p);
}

// ---------------------------------------------------------------------------
// SRS Algorithm (simplified SM-2 / FSRS hybrid)
// ---------------------------------------------------------------------------

function computeNextReview(
  grade: number,
  currentInterval: number,
  easeFactor: number,
  repetitions: number,
): { interval: number; easeFactor: number; repetitions: number } {
  let newEf = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (newEf < 1.3) newEf = 1.3;

  if (grade < 3) {
    // Failed — reset
    return { interval: 1, easeFactor: newEf, repetitions: 0 };
  }

  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentInterval * newEf);
  }

  // Grade 4 (easy) bonus
  if (grade === 4) {
    newInterval = Math.round(newInterval * 1.3);
  }

  return {
    interval: Math.max(1, Math.min(newInterval, 365)),
    easeFactor: newEf,
    repetitions: repetitions + 1,
  };
}

// ---------------------------------------------------------------------------
// Subject CRUD
// ---------------------------------------------------------------------------

export type SrsSubjectState = { error?: string; ok?: boolean };

const CreateSubjectSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  code: z.string().min(1, "Code requis").max(10),
  description: z.string().max(200).optional(),
  hue: z.coerce.number().int().min(0).max(360).default(220),
});

export async function createSrsSubject(
  _prev: SrsSubjectState | undefined,
  formData: FormData,
): Promise<SrsSubjectState> {
  const { profile } = await getStudentProfile();

  const parsed = CreateSubjectSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    description: formData.get("description") || undefined,
    hue: formData.get("hue"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.srsSubject.findUnique({
    where: { studentId_name: { studentId: profile.id, name: parsed.data.name } },
  });
  if (existing) return { error: "Une matière avec ce nom existe déjà." };

  await prisma.srsSubject.create({
    data: { studentId: profile.id, ...parsed.data },
  });

  revalidateSrs();
  return { ok: true };
}

export async function deleteSrsSubject(formData: FormData): Promise<void> {
  const { profile } = await getStudentProfile();
  const id = formData.get("id") as string | null;
  if (!id) return;

  await prisma.srsSubject.deleteMany({
    where: { id, studentId: profile.id },
  });
  revalidateSrs();
}

// ---------------------------------------------------------------------------
// Card CRUD
// ---------------------------------------------------------------------------

export type SrsCardState = { error?: string; ok?: boolean };

const CreateCardSchema = z.object({
  subjectId: z.string().min(1),
  text: z.string().min(1, "Texte requis").max(2000),
  tag: z.string().max(50).optional(),
});

export async function createSrsCard(
  _prev: SrsCardState | undefined,
  formData: FormData,
): Promise<SrsCardState> {
  const { profile } = await getStudentProfile();

  const parsed = CreateCardSchema.safeParse({
    subjectId: formData.get("subjectId"),
    text: formData.get("text"),
    tag: formData.get("tag") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  // Verify subject belongs to student
  const subject = await prisma.srsSubject.findFirst({
    where: { id: parsed.data.subjectId, studentId: profile.id },
  });
  if (!subject) return { error: "Matière introuvable." };

  // Validate cloze format
  if (!parsed.data.text.includes("{{") || !parsed.data.text.includes("}}")) {
    return { error: "Le texte doit contenir au moins un trou {{réponse}}." };
  }

  await prisma.srsCard.create({
    data: {
      subjectId: parsed.data.subjectId,
      text: parsed.data.text,
      tag: parsed.data.tag,
    },
  });

  revalidateSrs();
  revalidatePath(`/dashboard/student/revisions/${parsed.data.subjectId}`);
  return { ok: true };
}

export async function deleteSrsCard(formData: FormData): Promise<void> {
  const { profile } = await getStudentProfile();
  const id = formData.get("id") as string | null;
  if (!id) return;

  // Verify ownership through subject
  const card = await prisma.srsCard.findUnique({
    where: { id },
    include: { subject: { select: { studentId: true, id: true } } },
  });
  if (!card || card.subject.studentId !== profile.id) return;

  await prisma.srsCard.delete({ where: { id } });
  revalidateSrs();
  revalidatePath(`/dashboard/student/revisions/${card.subject.id}`);
}

// ---------------------------------------------------------------------------
// Review submission
// ---------------------------------------------------------------------------

export type ReviewResult = {
  cardId: string;
  newInterval: number;
  newState: "NEW" | "LEARNING" | "REVIEW";
};

export async function submitSrsReview(
  cardId: string,
  grade: number,
): Promise<ReviewResult | { error: string }> {
  const { profile } = await getStudentProfile();

  if (grade < 1 || grade > 4) return { error: "Grade invalide." };

  const card = await prisma.srsCard.findUnique({
    where: { id: cardId },
    include: { subject: { select: { studentId: true } } },
  });
  if (!card || card.subject.studentId !== profile.id) {
    return { error: "Carte introuvable." };
  }

  const correct = grade >= 3;
  const { interval, easeFactor, repetitions } = computeNextReview(
    grade,
    card.interval,
    card.easeFactor,
    card.repetitions,
  );

  const now = new Date();
  const nextReviewAt = new Date(now.getTime() + interval * 86400000);
  const stability = interval * (correct ? 1.2 : 0.5);

  let newState: "NEW" | "LEARNING" | "REVIEW";
  if (repetitions === 0) newState = "LEARNING";
  else if (repetitions <= 2) newState = "LEARNING";
  else newState = "REVIEW";

  await prisma.$transaction([
    prisma.srsCard.update({
      where: { id: cardId },
      data: {
        interval,
        easeFactor,
        repetitions,
        stability,
        state: newState,
        lapses: correct ? card.lapses : card.lapses + 1,
        lastReviewAt: now,
        nextReviewAt,
      },
    }),
    prisma.srsReview.create({
      data: { cardId, grade, correct },
    }),
  ]);

  // NOTE: Do NOT revalidatePath here — it resets client state mid-session.
  // Use finishSrsSession() when session completes.
  return { cardId, newInterval: interval, newState };
}

export async function finishSrsSession(): Promise<void> {
  await getStudentProfile(); // auth check
  revalidateSrs();
}

// ---------------------------------------------------------------------------
// Fetch helpers (for server components)
// ---------------------------------------------------------------------------

export async function getSrsOverview() {
  const { profile } = await getStudentProfile();

  const subjects = await prisma.srsSubject.findMany({
    where: { studentId: profile.id },
    include: {
      cards: {
        select: {
          id: true,
          state: true,
          interval: true,
          stability: true,
          nextReviewAt: true,
          lapses: true,
          repetitions: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return subjects.map((s) => {
    const total = s.cards.length;
    const mastered = s.cards.filter((c) => c.state === "REVIEW" && c.interval >= 21).length;
    const learning = s.cards.filter((c) => c.state === "LEARNING").length;
    const newCards = s.cards.filter((c) => c.state === "NEW").length;
    const due = s.cards.filter(
      (c) => c.nextReviewAt && c.nextReviewAt <= now || c.state === "NEW",
    ).length;

    // Compute retention estimate from average stability
    const stabilities = s.cards.filter((c) => c.stability > 0).map((c) => c.stability);
    const avgStability = stabilities.length > 0
      ? stabilities.reduce((a, b) => a + b, 0) / stabilities.length
      : 0;
    const retention = avgStability > 0 ? Math.exp(-1 / avgStability) : 0;

    return {
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      hue: s.hue,
      cardCount: total,
      mastered,
      learning,
      newCards,
      due,
      retention,
    };
  });
}

export async function getSrsSubjectDetail(subjectId: string) {
  const { profile } = await getStudentProfile();

  const subject = await prisma.srsSubject.findFirst({
    where: { id: subjectId, studentId: profile.id },
    include: {
      cards: {
        include: {
          reviews: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return subject;
}

export async function getSrsSessionCards(subjectId?: string) {
  const { profile } = await getStudentProfile();
  const now = new Date();

  // Get all due cards + new cards (limit 20 per session)
  const cards = await prisma.srsCard.findMany({
    where: {
      subject: {
        studentId: profile.id,
        ...(subjectId ? { id: subjectId } : {}),
      },
      OR: [
        { nextReviewAt: { lte: now } },
        { state: "NEW" },
      ],
    },
    include: {
      subject: { select: { id: true, name: true, code: true, hue: true } },
    },
    orderBy: [
      { state: "asc" }, // NEW first, then LEARNING, then REVIEW
      { nextReviewAt: "asc" },
    ],
    take: 20,
  });

  return cards;
}

export async function getSrsAllSubjectCards(subjectId: string) {
  const { profile } = await getStudentProfile();

  const cards = await prisma.srsCard.findMany({
    where: {
      subject: {
        id: subjectId,
        studentId: profile.id,
      },
    },
    include: {
      subject: { select: { id: true, name: true, code: true, hue: true } },
    },
    orderBy: [
      { state: "asc" },
      { nextReviewAt: "asc" },
    ],
    take: 50,
  });

  return cards;
}

export async function getSrsDueHistogram(days = 14) {
  const { profile } = await getStudentProfile();

  // Get all cards with nextReviewAt for the next N days
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const subjects = await prisma.srsSubject.findMany({
    where: { studentId: profile.id },
    select: {
      id: true,
      name: true,
      hue: true,
      cards: {
        select: { nextReviewAt: true, state: true },
      },
    },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return subjects.map((s) => {
    const dueCounts: number[] = [];
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      let count: number;
      if (i === 0) {
        // Today: due + new cards
        count = s.cards.filter(
          (c) =>
            c.state === "NEW" ||
            (c.nextReviewAt && c.nextReviewAt <= dayEnd),
        ).length;
      } else {
        // Future days: cards with nextReviewAt in that day range
        count = s.cards.filter(
          (c) =>
            c.nextReviewAt &&
            c.nextReviewAt >= dayStart &&
            c.nextReviewAt < dayEnd,
        ).length;
      }
      dueCounts.push(count);
    }
    return { id: s.id, name: s.name, hue: s.hue, dueCounts };
  });
}

export async function getSrsReviewHistory(subjectId?: string) {
  const { profile } = await getStudentProfile();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const reviews = await prisma.srsReview.findMany({
    where: {
      card: {
        subject: {
          studentId: profile.id,
          ...(subjectId ? { id: subjectId } : {}),
        },
      },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      grade: true,
      correct: true,
      createdAt: true,
      card: { select: { subjectId: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return reviews;
}
