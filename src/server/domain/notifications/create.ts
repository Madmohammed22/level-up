// Typed helpers that create notification rows.
// Call these from server actions AFTER the primary write succeeds so a
// notification failure never blocks the main action (we log and continue).

import { prisma } from "@/server/db/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

export type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: inputs.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ? (n.data as object) : undefined,
      })),
    });
  } catch (err) {
    // Never let notification delivery block the primary action.
    console.error("[notifications] createMany failed:", err);
  }
}

// Convenience for a single notification.
export async function notify(input: NotifyInput): Promise<void> {
  await notifyMany([input]);
}

// ---- Domain-specific formatters ----

/** For each enrolled student, emit a SESSION_ASSIGNED notification. */
export function sessionAssignedInputs(params: {
  enrolledUserIds: string[];
  subjectName: string;
  dateLabel: string; // e.g. "lundi 13 avril à 16:00"
  sessionId: string;
}): NotifyInput[] {
  return params.enrolledUserIds.map((userId) => ({
    userId,
    type: "SESSION_ASSIGNED" as const,
    title: `Nouvelle séance de ${params.subjectName}`,
    body: `Tu as été affecté à une séance le ${params.dateLabel}.`,
    data: { sessionId: params.sessionId },
  }));
}

/** For each enrolled student, emit a SESSION_CANCELLED notification. */
export function sessionCancelledInputs(params: {
  enrolledUserIds: string[];
  subjectName: string;
  dateLabel: string;
  sessionId: string;
}): NotifyInput[] {
  return params.enrolledUserIds.map((userId) => ({
    userId,
    type: "SESSION_CANCELLED" as const,
    title: `Séance de ${params.subjectName} annulée`,
    body: `La séance prévue le ${params.dateLabel} a été annulée.`,
    data: { sessionId: params.sessionId },
  }));
}

export function newMessageInput(params: {
  recipientUserId: string;
  senderName: string;
  preview: string;
  conversationId: string;
  isAdminInbound: boolean; // true when an admin should click /admin/chat/[id]
  recipientChatHref?: string; // override href for non-admin recipient
}): NotifyInput {
  return {
    userId: params.recipientUserId,
    type: "NEW_MESSAGE" as const,
    title: `Nouveau message de ${params.senderName}`,
    body: params.preview.slice(0, 140),
    data: {
      conversationId: params.conversationId,
      href: params.isAdminInbound
        ? `/dashboard/admin/chat/${params.conversationId}`
        : (params.recipientChatHref ?? `/dashboard/student/chat`),
    },
  };
}

/** Short, readable French date for notification bodies. */
export function frenchDateLabel(d: Date): string {
  const days = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} à ${hh}:${mm}`;
}
