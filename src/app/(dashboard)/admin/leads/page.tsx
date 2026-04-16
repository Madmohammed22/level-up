import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  updateLeadStatus,
  deleteLead,
} from "@/server/actions/admin/leads";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté",
  ENROLLED: "Inscrit",
  CLOSED: "Clos",
};

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300",
  CONTACTED:
    "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
  ENROLLED:
    "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300",
  CLOSED: "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("ADMIN");
  const { status } = await searchParams;

  const where =
    status && ["NEW", "CONTACTED", "ENROLLED", "CLOSED"].includes(status)
      ? { status: status as "NEW" | "CONTACTED" | "ENROLLED" | "CLOSED" }
      : {};

  const [leads, counts] = await Promise.all([
    prisma.leadSubmission.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.leadSubmission.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const countsByStatus = new Map(
    counts.map((c) => [c.status, c._count._all]),
  );
  const totalCount = counts.reduce((sum, c) => sum + c._count._all, 0);

  const filters: Array<{ key: string; label: string; href: string }> = [
    { key: "ALL", label: `Tous (${totalCount})`, href: "/admin/leads" },
    ...(["NEW", "CONTACTED", "ENROLLED", "CLOSED"] as const).map((s) => ({
      key: s,
      label: `${STATUS_LABEL[s]} (${countsByStatus.get(s) ?? 0})`,
      href: `/admin/leads?status=${s}`,
    })),
  ];

  const activeKey = status ?? "ALL";

  return (
    <section>
      <AdminPageHeader
        title="Leads"
        description="Demandes reçues depuis la page d'accueil. Relance et suivi."
      />

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => {
          const active = activeKey === f.key;
          return (
            <a
              key={f.key}
              href={f.href}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${
                active
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent"
                  : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {f.label}
            </a>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun lead.</p>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{lead.name}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[lead.status] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                    {lead.source ? (
                      <span className="text-xs text-zinc-500">
                        · {lead.source}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 space-x-3">
                    <a
                      href={`mailto:${lead.email}`}
                      className="underline decoration-dotted hover:decoration-solid"
                    >
                      {lead.email}
                    </a>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="underline decoration-dotted hover:decoration-solid"
                      >
                        {lead.phone}
                      </a>
                    ) : null}
                  </div>
                  {lead.message ? (
                    <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                      {lead.message}
                    </p>
                  ) : null}
                  <div className="mt-2 text-xs text-zinc-500">
                    {DATE_FMT.format(lead.createdAt)}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <form action={updateLeadStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={lead.id} />
                    <select
                      name="status"
                      defaultValue={lead.status}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-xs"
                    >
                      {(["NEW", "CONTACTED", "ENROLLED", "CLOSED"] as const).map(
                        (s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 text-xs font-medium"
                    >
                      Mettre à jour
                    </button>
                  </form>
                  <form action={deleteLead}>
                    <input type="hidden" name="id" value={lead.id} />
                    <button
                      type="submit"
                      className="text-xs text-red-600 hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
