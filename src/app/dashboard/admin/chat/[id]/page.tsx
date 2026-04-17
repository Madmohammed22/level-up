import { notFound } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { markConversationRead, sendMessageAsAdmin } from "@/server/actions/chat";
import type { ThreadMessage } from "@/components/chat/MessageThread";
import { ChatThreadClient } from "@/components/chat/ChatThreadClient";

export default async function AdminChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
      teacher: { include: { user: { select: { name: true, email: true } } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true } } },
      },
    },
  });

  if (!convo) notFound();

  await markConversationRead(convo.id);

  const messages: ThreadMessage[] = convo.messages.map((m) => ({
    id: m.id,
    content: m.content,
    createdAt: m.createdAt,
    mine: m.senderId === admin.id,
    senderName: m.sender.role === "ADMIN" ? "Admin" : m.sender.name,
  }));

  return (
    <section className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl">
      <header className="mb-3">
        <Link
          href="/dashboard/admin/chat"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← Toutes les conversations
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {convo.student?.user.name ?? convo.teacher?.user.name ?? "—"}
          {convo.teacher && !convo.student ? (
            <span className="ml-2 text-sm font-normal text-zinc-500">(professeur)</span>
          ) : null}
        </h1>
        <p className="text-sm text-zinc-500">
          {convo.student?.user.email ?? convo.teacher?.user.email ?? ""}
        </p>
      </header>

      <ChatThreadClient
        initialMessages={messages}
        currentUserId={admin.id}
        senderName="Admin"
        serverAction={sendMessageAsAdmin}
        conversationId={convo.id}
        placeholder="Répondre…"
      />
    </section>
  );
}
