"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const LEAD_STATUSES = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"] as const;
const LeadStatusSchema = z.enum(LEAD_STATUSES);

export async function updateLeadStatus(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  const statusRaw = formData.get("status") as string | null;
  if (!id || !statusRaw) return;

  const parsed = LeadStatusSchema.safeParse(statusRaw);
  if (!parsed.success) return;

  await prisma.leadSubmission.update({
    where: { id },
    data: { status: parsed.data },
  });

  revalidatePath("/admin/leads");
}

export async function deleteLead(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;
  await prisma.leadSubmission.delete({ where: { id } });
  revalidatePath("/admin/leads");
}
