import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const PAGE_SIZE = 50;

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actionLabel(action: string): string {
  const MAP: Record<string, string> = {
    "assignment.commit": "Affectations validées",
    "session.cancel": "Séance annulée",
    "template.create": "Modèle créé",
    "template.delete": "Modèle supprimé",
    "template.generate": "Séances générées",
    "student.create": "Élève créé",
    "student.delete": "Élève supprimé",
    "teacher.create": "Professeur créé",
    "teacher.delete": "Professeur supprimé",
  };
  return MAP[action] ?? action;
}

// Keys to show with French labels. Keys not listed here are hidden.
const VISIBLE_FIELDS: Record<string, string> = {
  name: "Nom",
  email: "Email",
  subjectName: "Matière",
  recurrence: "Récurrence",
  created: "Séances créées",
};

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Hebdomadaire",
  ONE_OFF: "Ponctuel",
};

function fmtWeekStart(val: string): string {
  try {
    const d = new Date(val);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return val;
  }
}

function formatPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as Record<string, unknown>;
  const parts: string[] = [];

  // weekStart gets special formatting
  if (typeof obj.weekStart === "string") {
    parts.push(`Semaine du ${fmtWeekStart(obj.weekStart)}`);
  }

  for (const [key, val] of Object.entries(obj)) {
    if (key === "weekStart") continue; // already handled
    if (val === null || val === undefined || val === "") continue;
    const label = VISIBLE_FIELDS[key];
    if (!label) continue; // skip IDs and technical fields
    let display = String(val);
    if (key === "recurrence") display = RECURRENCE_LABELS[display] ?? display;
    parts.push(`${label} : ${display}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "";
}

function actionColor(action: string): string {
  if (action.includes("delete") || action.includes("cancel"))
    return "text-red-600 dark:text-red-400";
  if (action.includes("create") || action.includes("commit"))
    return "text-green-600 dark:text-green-400";
  return "text-blue-600 dark:text-blue-400";
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filterAction = params.action || undefined;

  const where = filterAction ? { action: filterAction } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Distinct actions for filter dropdown
  const distinctActions = await prisma.auditLog.findMany({
    distinct: ["action"],
    select: { action: true },
    orderBy: { action: "asc" },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Journal d&apos;audit
        </h1>
        <p className="text-sm text-zinc-500">
          {total} entrée{total !== 1 ? "s" : ""}
        </p>
      </header>

      {/* Filter */}
      <form className="flex items-center gap-3">
        <select
          name="action"
          defaultValue={filterAction ?? ""}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">Toutes les actions</option>
          {distinctActions.map((a) => (
            <option key={a.action} value={a.action}>
              {actionLabel(a.action)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          Filtrer
        </button>
        {filterAction && (
          <a
            href="/dashboard/admin/audit"
            className="text-xs text-blue-600 hover:underline"
          >
            Réinitialiser
          </a>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-500">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {fmtDate(log.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {log.user?.name ?? log.user?.email ?? "—"}
                </td>
                <td className={`px-4 py-3 whitespace-nowrap font-medium ${actionColor(log.action)}`}>
                  {actionLabel(log.action)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                  {log.entityType}
                  {log.entityId && (
                    <span className="ml-1 text-xs text-zinc-400">
                      {log.entityId.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500 max-w-xs">
                  {formatPayload(log.payload) || "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  Aucune entrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a
              href={`/dashboard/admin/audit?page=${page - 1}${filterAction ? `&action=${filterAction}` : ""}`}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              ← Précédent
            </a>
          )}
          <span className="text-sm text-zinc-500">
            {page}/{totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/dashboard/admin/audit?page=${page + 1}${filterAction ? `&action=${filterAction}` : ""}`}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Suivant →
            </a>
          )}
        </div>
      )}
    </section>
  );
}
