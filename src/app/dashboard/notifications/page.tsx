import Link from "next/link";
import { requireUser } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { MarkAllReadButton } from "./MarkAllReadButton";

const TYPE_LABEL: Record<string, string> = {
  SESSION_ASSIGNED: "Séance affectée",
  SESSION_UPDATED: "Séance modifiée",
  SESSION_CANCELLED: "Séance annulée",
  NEW_MESSAGE: "Nouveau message",
  EXAM_APPROACHING: "Examen approche",
  MOOD_REMINDER: "Rappel humeur",
  GENERIC: "Info",
};

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(
    2,
    "0",
  )}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function NotificationsPage() {
  const user = await requireUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <section className="max-w-3xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-zinc-500">
            {unread > 0 ? `${unread} non lue(s)` : "Tout est à jour"}
          </p>
        </div>
        {unread > 0 ? <MarkAllReadButton /> : null}
      </header>

      {notifications.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune notification pour l&apos;instant.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {notifications.map((n) => {
            const data =
              n.data && typeof n.data === "object"
                ? (n.data as Record<string, unknown>)
                : {};
            const rawHref =
              typeof data.href === "string" ? (data.href as string) : null;
            // Migrate old notification hrefs that lack /dashboard prefix
            const href = rawHref && !rawHref.startsWith("/dashboard")
              ? `/dashboard${rawHref}`
              : rawHref;
            const inner = (
              <div
                className={`px-4 py-3 ${
                  n.read ? "opacity-70" : "bg-zinc-50 dark:bg-zinc-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                    {TYPE_LABEL[n.type] ?? n.type}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {fmt(n.createdAt)}
                  </span>
                </div>
                <div className="mt-1 font-medium">{n.title}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  {n.body}
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {href ? (
                  <Link href={href} className="block hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
