"use server";

// Chat actions.
// - sendMessageAsStudent: ensures Conversation exists (one per student), creates Message.
// - sendMessageAsAdmin: posts to an existing Conversation, assigns adminId if missing.
// - startConversationAsAdmin: admin-initiated — upserts Conversation for a given
//   student, claims it, posts the first message, redirects to the thread.
// - markConversationRead: marks all unread inbound messages as read for the viewer.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, requireUser } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import {
  newMessageInput,
  notify,
} from "@/server/domain/notifications/create";

const SendSchema = z.object({
  content: z.string().trim().min(1, "Message vide").max(4000),
});

export type ChatState = { error?: string; ok?: boolean };

export async function sendMessageAsStudent(
  _prev: ChatState | undefined,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireRole("STUDENT");
  const parsed = SendSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil élève introuvable" };

  const convo = await prisma.conversation.upsert({
    where: { studentId: profile.id },
    update: {},
    create: { studentId: profile.id },
  });

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  // Notify the assigned admin (if any). If the conversation isn't claimed yet,
  // no-op — the inbox badge on /admin/chat still surfaces it.
  const convoWithAdmin = await prisma.conversation.findUnique({
    where: { id: convo.id },
    select: { adminId: true },
  });
  if (convoWithAdmin?.adminId) {
    await notify(
      newMessageInput({
        recipientUserId: convoWithAdmin.adminId,
        senderName: user.name ?? "Un élève",
        preview: parsed.data.content,
        conversationId: convo.id,
        isAdminInbound: true,
      }),
    );
  }

  revalidatePath("/student/chat");
  revalidatePath("/admin/chat");
  return { ok: true };
}

export async function sendMessageAsTeacher(
  _prev: ChatState | undefined,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireRole("TEACHER");
  const parsed = SendSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) return { error: "Profil professeur introuvable" };

  const convo = await prisma.conversation.upsert({
    where: { teacherId: profile.id },
    update: {},
    create: { teacherId: profile.id },
  });

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  // Notify assigned admin if any
  const convoWithAdmin = await prisma.conversation.findUnique({
    where: { id: convo.id },
    select: { adminId: true },
  });
  if (convoWithAdmin?.adminId) {
    await notify(
      newMessageInput({
        recipientUserId: convoWithAdmin.adminId,
        senderName: user.name ?? "Un professeur",
        preview: parsed.data.content,
        conversationId: convo.id,
        isAdminInbound: true,
      }),
    );
  }

  revalidatePath("/teacher/chat");
  revalidatePath("/admin/chat");
  return { ok: true };
}

export async function sendMessageAsAdmin(
  _prev: ChatState | undefined,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireRole("ADMIN");
  const conversationId = formData.get("conversationId") as string | null;
  const parsed = SendSchema.safeParse({ content: formData.get("content") });
  if (!conversationId) return { error: "Conversation manquante" };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, adminId: true },
  });
  if (!convo) return { error: "Conversation introuvable" };

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: convo.id,
        senderId: user.id,
        content: parsed.data.content,
      },
    }),
    ...(convo.adminId
      ? []
      : [
          prisma.conversation.update({
            where: { id: convo.id },
            data: { adminId: user.id },
          }),
        ]),
  ]);

  // Notify the other participant (student or teacher).
  const convoFull = await prisma.conversation.findUnique({
    where: { id: convo.id },
    select: {
      student: { select: { userId: true } },
      teacher: { select: { userId: true } },
    },
  });
  const recipientUserId =
    convoFull?.student?.userId ?? convoFull?.teacher?.userId;
  if (recipientUserId) {
    await notify(
      newMessageInput({
        recipientUserId,
        senderName: "L'admin",
        preview: parsed.data.content,
        conversationId: convo.id,
        isAdminInbound: false,
      }),
    );
  }

  revalidatePath(`/admin/chat/${conversationId}`);
  revalidatePath("/admin/chat");
  revalidatePath("/student/chat");
  return { ok: true };
}

const StartConvoSchema = z.object({
  studentUserId: z.string().min(1, "Élève requis"),
  content: z.string().trim().min(1, "Message vide").max(4000),
});

/**
 * Admin-initiated conversation. Upserts a Conversation (one per student),
 * claims it for the current admin, posts the first message, notifies the
 * student, and redirects the admin to the thread.
 */
export async function startConversationAsAdmin(
  _prev: ChatState | undefined,
  formData: FormData,
): Promise<ChatState> {
  const user = await requireRole("ADMIN");
  const parsed = StartConvoSchema.safeParse({
    studentUserId: formData.get("studentUserId"),
    content: formData.get("content"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Entrée invalide" };
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: parsed.data.studentUserId },
    select: { id: true, userId: true },
  });
  if (!profile) return { error: "Élève introuvable" };

  const convo = await prisma.conversation.upsert({
    where: { studentId: profile.id },
    update: { adminId: user.id },
    create: { studentId: profile.id, adminId: user.id },
  });

  await prisma.message.create({
    data: {
      conversationId: convo.id,
      senderId: user.id,
      content: parsed.data.content,
    },
  });

  await notify(
    newMessageInput({
      recipientUserId: profile.userId,
      senderName: "L'admin",
      preview: parsed.data.content,
      conversationId: convo.id,
      isAdminInbound: false,
    }),
  );

  revalidatePath("/admin/chat");
  revalidatePath(`/admin/chat/${convo.id}`);
  revalidatePath("/student/chat");
  redirect(`/admin/chat/${convo.id}`);
}

export async function markConversationRead(
  conversationId: string,
): Promise<void> {
  const user = await requireUser();
  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}
