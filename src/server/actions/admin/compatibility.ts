"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const LevelEnum = z.enum(["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"]);

const ToggleSchema = z.object({
  subjectId: z.string().min(1),
  levelA: LevelEnum,
  levelB: LevelEnum,
  compatible: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type CompatibilityState = { error?: string; ok?: boolean };

export async function toggleLevelCompatibility(
  _prev: CompatibilityState | undefined,
  formData: FormData,
): Promise<CompatibilityState> {
  await requireRole("ADMIN");

  const parsed = ToggleSchema.safeParse({
    subjectId: formData.get("subjectId"),
    levelA: formData.get("levelA"),
    levelB: formData.get("levelB"),
    compatible: formData.get("compatible"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide." };
  }

  const { subjectId, levelA, levelB, compatible } = parsed.data;

  if (levelA === levelB) {
    return { error: "Même niveau — toujours compatible." };
  }

  // Normalize order so we always store (smaller, bigger)
  const [normA, normB] =
    levelA < levelB ? [levelA, levelB] : [levelB, levelA];

  // Verify subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });
  if (!subject) return { error: "Matière introuvable." };

  await prisma.levelCompatibility.upsert({
    where: {
      subjectId_levelA_levelB: {
        subjectId,
        levelA: normA,
        levelB: normB,
      },
    },
    update: { compatible },
    create: {
      subjectId,
      levelA: normA,
      levelB: normB,
      compatible,
    },
  });

  revalidatePath("/dashboard/admin/compatibility");
  return { ok: true };
}

const BulkSchema = z.object({
  /** JSON-encoded array of { subjectId, levelA, levelB, compatible } */
  entries: z.string(),
});

const BulkEntrySchema = z.array(
  z.object({
    subjectId: z.string().min(1),
    levelA: LevelEnum,
    levelB: LevelEnum,
    compatible: z.boolean(),
  }),
);

export async function saveBulkCompatibility(
  _prev: CompatibilityState | undefined,
  formData: FormData,
): Promise<CompatibilityState> {
  await requireRole("ADMIN");

  const raw = BulkSchema.safeParse({ entries: formData.get("entries") });
  if (!raw.success) return { error: "Données invalides." };

  let entries: z.infer<typeof BulkEntrySchema>;
  try {
    entries = BulkEntrySchema.parse(JSON.parse(raw.data.entries));
  } catch {
    return { error: "Format invalide." };
  }

  // Normalize and deduplicate
  const normalized = entries.map((e) => {
    const [a, b] =
      e.levelA < e.levelB
        ? [e.levelA, e.levelB]
        : [e.levelB, e.levelA];
    return { subjectId: e.subjectId, levelA: a, levelB: b, compatible: e.compatible };
  });

  // Chunk into batches of 10 to avoid transaction timeout on Supabase
  const BATCH_SIZE = 10;
  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const chunk = normalized.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      chunk.map((e) =>
        prisma.levelCompatibility.upsert({
          where: {
            subjectId_levelA_levelB: {
              subjectId: e.subjectId,
              levelA: e.levelA,
              levelB: e.levelB,
            },
          },
          update: { compatible: e.compatible },
          create: {
            subjectId: e.subjectId,
            levelA: e.levelA,
            levelB: e.levelB,
            compatible: e.compatible,
          },
        }),
      ),
    );
  }

  revalidatePath("/dashboard/admin/compatibility");
  return { ok: true };
}
