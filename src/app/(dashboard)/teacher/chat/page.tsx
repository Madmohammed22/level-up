import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { markConversationRead, sendMessageAsTeacher } from "@/server/actions/chat";
import type { ThreadMessage } from "@/components/chat/MessageThread";
import { ChatThreadClient } from "@/components/chat/ChatThreadClient";

export default async function TeacherChatPage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Messages
        </h1>
        <p className="text-sm text-zinc-500">
          Profil professeur introuvable. Contactez un administrateur.
        </p>
      </section>
    );
  }

  const convo = await prisma.conversation.findUnique({
    where: { teacherId: profile.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (convo) {
    await markConversationRead(convo.id);
  }

  const messages: ThreadMessage[] =
    convo?.messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      mine: m.senderId === user.id,
      senderName: m.sender.role === "ADMIN" ? "Admin" : m.sender.name,
    })) ?? [];

  return (
    <section className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      <header className="mb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-zinc-500">
          Échangez avec l&apos;administration.
        </p>
      </header>

      <ChatThreadClient
        initialMessages={messages}
        currentUserId={user.id}
        senderName={user.name ?? "Moi"}
        serverAction={sendMessageAsTeacher}
        conversationId={convo?.id}
        placeholder="Écrivez votre message…"
      />
    </section>
  );
}
