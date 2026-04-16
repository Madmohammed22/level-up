import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { NewConversationForm } from "./NewConversationForm";

const LEVEL_LABELS: Record<string, string> = {
  GRADE_9: "3ème",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Terminale",
};

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export default async function AdminChatInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();

  const [conversations, students] = await Promise.all([
    prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        student: {
          include: { user: { select: { id: true, name: true } } },
        },
        teacher: {
          include: { user: { select: { id: true, name: true } } },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            messages: {
              where: { readAt: null, senderId: { not: admin.id } },
            },
          },
        },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const filteredConversations = query
    ? conversations.filter((c) => {
        const name = (c.student?.user.name ?? c.teacher?.user.name ?? "").toLowerCase();
        return name.includes(query);
      })
    : conversations;

  const convoStudentUserIds = new Set(
    conversations.filter((c) => c.student).map((c) => c.student!.user.id),
  );
  const studentOptions = students.map((s) => ({
    userId: s.user.id,
    name: s.user.name,
    level: LEVEL_LABELS[s.level] ?? s.level,
    hasConversation: convoStudentUserIds.has(s.user.id),
  }));

  return (
    <section>
      <AdminPageHeader
        title="Messages"
        description="Conversations avec les élèves et les professeurs."
      />

      <div className="mb-5">
        {studentOptions.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Crée d&apos;abord au moins un élève pour pouvoir écrire.
          </p>
        ) : (
          <NewConversationForm students={studentOptions} />
        )}
      </div>

      {conversations.length > 0 && (
        <form className="mb-4 flex gap-2">
          <input
            name="q"
            type="text"
            placeholder="Rechercher par nom..."
            defaultValue={query}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
          >
            Chercher
          </button>
          {query && (
            <a
              href="/admin/chat"
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Effacer
            </a>
          )}
        </form>
      )}

      {filteredConversations.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {query
            ? `Aucun résultat pour « ${query} ».`
            : "Aucune conversation. Utilise « Nouveau message » pour en démarrer une."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {filteredConversations.map((c) => {
            const last = c.messages[0];
            const unread = c._count.messages;
            return (
              <li key={c.id}>
                <Link
                  href={`/admin/chat/${c.id}`}
                  className="block px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="font-medium truncate">
                        {c.student?.user.name ?? c.teacher?.user.name ?? "—"}
                        {c.teacher && !c.student ? (
                          <span className="ml-1.5 text-xs font-normal text-zinc-500">(prof)</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        {last
                          ? last.content.length > 80
                            ? last.content.slice(0, 80) + "…"
                            : last.content
                          : "— aucun message —"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unread > 0 ? (
                        <span className="rounded-full bg-red-600 text-white text-xs font-medium px-2 py-0.5">
                          {unread}
                        </span>
                      ) : null}
                      {last ? (
                        <span className="text-xs text-zinc-500">
                          {fmt(last.createdAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
