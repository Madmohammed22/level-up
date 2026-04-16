"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const CreateRoomSchema = z.object({
  name: z.string().min(1, "Nom requis").max(60),
  capacity: z.coerce.number().int().min(1).max(50),
});

export type ActionState = { error?: string; ok?: boolean };

export async function createRoom(
  _prev: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("ADMIN");

  const parsed = CreateRoomSchema.safeParse({
    name: (formData.get("name") as string | null)?.trim(),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const existing = await prisma.room.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) return { error: "Salle déjà existante" };

  await prisma.room.create({ data: parsed.data });
  revalidatePath("/admin/rooms");
  return { ok: true };
}

export async function deleteRoom(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = formData.get("id") as string | null;
  if (!id) return;

  const room = await prisma.room.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true, sessionTemplates: true } } },
  });
  if (!room) return;
  if (room._count.sessions + room._count.sessionTemplates > 0) return;

  await prisma.room.delete({ where: { id } });
  revalidatePath("/admin/rooms");
}
