import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { cancelSession } from "@/server/actions/admin/assignments";
import { mondayOf } from "@/server/domain/scheduling/weekDates";

const DAY_LABELS: Record<number, string> = {
  0: "Dim",
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "CANCELLED", label: "Annulée" },
];

function fmtDate(d: Date): string {
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function weekKey(d: Date): string {
  const mon = mondayOf(d);
  return `${mon.getFullYear()}-W${mon.toISOString().slice(0, 10)}`;
}

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireRole("ADMIN");
  const { q, status } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const statusFilter = status ?? "";

  const sessions = await prisma.session.findMany({
    orderBy: [{ startAt: "asc" }],
    include: {
      subject: { select: { name: true } },
      room: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

  // Filter
  const filtered = sessions.filter((s) => {
    if (statusFilter && s.status !== statusFilter) return false;
    if (query) {
      const haystack = [
        s.subject.name,
        s.teacher.user.name ?? "",
        s.room.name,
        s.levels.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  // Group by week (Monday-anchored).
  const byWeek = new Map<
    string,
    { label: string; sessions: typeof filtered }
  >();
  for (const s of filtered) {
    const key = weekKey(s.startAt);
    const mon = mondayOf(s.startAt);
    if (!byWeek.has(key))
      byWeek.set(key, {
        label: `Semaine du ${fmtDate(mon)}`,
        sessions: [],
      });
    byWeek.get(key)!.sessions.push(s);
  }

  const hasFilters = query || statusFilter;

  return (
    <section>
      <AdminPageHeader
        title={`Séances (${filtered.length})`}
        description="Toutes les séances créées (brouillon, confirmées, annulées)."
      />

      {/* Search & filter bar */}
      <form className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
          </svg>
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Chercher matière, prof, salle…"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent pl-10 pr-3 py-2 text-sm"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
          </svg>
          Chercher
        </button>
        {hasFilters ? (
          <Link
            href="/dashboard/admin/sessions"
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Effacer
          </Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {sessions.length === 0 ? (
            <>
              Aucune séance. Utilise{" "}
              <a className="underline" href="/dashboard/admin/assignments">
                Affectations
              </a>{" "}
              pour générer un planning.
            </>
          ) : (
            "Aucune séance ne correspond aux filtres."
          )}
        </p>
      ) : (
        <div className="space-y-8">
          {[...byWeek.entries()].map(([key, group]) => (
            <div key={key}>
              <h2 className="text-sm font-medium mb-3">
                {group.label}{" "}
                <span className="text-zinc-400 font-normal">
                  ({group.sessions.length})
                </span>
              </h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="text-left bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <Th>Jour</Th>
                      <Th>Horaire</Th>
                      <Th>Matière</Th>
                      <Th>Prof</Th>
                      <Th>Salle</Th>
                      <Th>Niveaux</Th>
                      <Th>Élèves</Th>
                      <Th>Statut</Th>
                      <Th> </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.sessions.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-t border-zinc-200 dark:border-zinc-800 ${
                          s.status === "CANCELLED"
                            ? "opacity-50 line-through"
                            : ""
                        }`}
                      >
                        <Td>{fmtDate(s.startAt)}</Td>
                        <Td>
                          {fmtTime(s.startAt)}–{fmtTime(s.endAt)}
                        </Td>
                        <Td>{s.subject.name}</Td>
                        <Td>{s.teacher.user.name}</Td>
                        <Td>{s.room.name}</Td>
                        <Td>{s.levels.join(" + ")}</Td>
                        <Td>
                          {s._count.enrollments}/{s.maxCapacity}
                        </Td>
                        <Td>
                          <StatusBadge status={s.status} />
                        </Td>
                        <Td>
                          {s.status !== "CANCELLED" ? (
                            <form action={cancelSession}>
                              <input type="hidden" name="id" value={s.id} />
                              <button
                                type="submit"
                                className="text-xs text-red-600 hover:underline"
                              >
                                Annuler
                              </button>
                            </form>
                          ) : null}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT:
      "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    CONFIRMED:
      "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300",
    CANCELLED:
      "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300",
  };
  const label: Record<string, string> = {
    DRAFT: "Brouillon",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] ?? ""
      }`}
    >
      {label[status] ?? status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
