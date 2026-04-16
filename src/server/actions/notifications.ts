"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
  read: boolean;
  createdAt: string; // ISO
};

/** Fetch the most recent notifications for the current user. */
export async function fetchRecentNotifications(
  limit = 10,
): Promise<NotificationRow[]> {
  const user = await requireUser();
  const rows = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    data: r.data,
    read: r.read,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function unreadNotificationCount(): Promise<number> {
  const user = await requireUser();
  return prisma.notification.count({
    where: { userId: user.id, read: false },
  });
}

export async function markNotificationRead(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/notifications");
}
