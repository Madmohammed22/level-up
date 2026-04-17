// Helper to create notifications for all admin users.
// Fire-and-forget — errors are logged, never thrown.

import { prisma } from "@/server/db/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export async function notifyAdmins(params: {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) return;

    const jsonData = params.data
      ? JSON.parse(JSON.stringify(params.data))
      : undefined;

    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: params.type,
        title: params.title,
        body: params.body,
        data: jsonData,
      })),
    });
  } catch (err) {
    console.error("[notifyAdmins]", err);
  }
}

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data
          ? JSON.parse(JSON.stringify(params.data))
          : undefined,
      },
    });
  } catch (err) {
    console.error("[notifyUser]", err);
  }
}
