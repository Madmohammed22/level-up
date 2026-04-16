"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CONTENT_TYPES = [
  "MICRO_LESSON",
  "EXERCISE",
  "PROTOCOL",
  "TEMPLATE",
] as const;
const CONTENT_CATEGORIES = [
  "STRESS",
  "METHODOLOGY",
  "TIME_MANAGEMENT",
  "EXAM_PREP",
] as const;

const ContentItemSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(120),
  type: z.enum(CONTENT_TYPES),
  category: z.enum(CONTENT_CATEGORIES),
  body: z.string().trim().min(1, "Contenu requis").max(10000),
  durationSec: z
    .union([z.string().trim(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    }),
  published: z
    .union([z.string(), z.boolean(), z.undefined()])
    .transform((v) => v === "on" || v === true),
});

export type ContentState = { error?: string; ok?: boolean };

function parseForm(formData: FormData) {
  return ContentItemSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    category: formData.get("category"),
    body: formData.get("body"),
    durationSec: formData.get("durationSec"),
    published: formData.get("published"),
  });
}

export async function createContentItem(
  _prev: ContentState | undefined,
  formData: FormData,
): Promise<ContentState> {
  await requireRole("ADMIN");
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await prisma.contentItem.create({
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      category: parsed.data.category,
      body: parsed.data.body,
      durationSec: parsed.data.durationSec,
      published: parsed.data.published,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/student/methodology");
  redirect("/admin/content");
}

export async function updateContentItem(
  _prev: ContentState | undefined,
  formData: FormData,
): Promise<ContentState> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return { error: "Identifiant manquant" };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  await prisma.contentItem.update({
    where: { id },
    data: {
      title: parsed.data.title,
      type: parsed.data.type,
      category: parsed.data.category,
      body: parsed.data.body,
      durationSec: parsed.data.durationSec,
      published: parsed.data.published,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${id}/edit`);
  revalidatePath("/student/methodology");
  redirect("/admin/content");
}

export async function toggleContentItemPublished(
  formData: FormData,
): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;
  const current = await prisma.contentItem.findUnique({
    where: { id },
    select: { published: true },
  });
  if (!current) return;
  await prisma.contentItem.update({
    where: { id },
    data: { published: !current.published },
  });
  revalidatePath("/admin/content");
  revalidatePath("/student/methodology");
}

export async function deleteContentItem(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;
  // ContentCompletion has onDelete: Cascade (students' "done" marks vanish).
  await prisma.contentItem.delete({ where: { id } });
  revalidatePath("/admin/content");
  revalidatePath("/student/methodology");
}
