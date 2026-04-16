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

export default async function AdminSessionsPage() {
  await requireRole("ADMIN");

  const sessions = await prisma.session.findMany({
    orderBy: [{ startAt: "asc" }],
    include: {
      subject: { select: { name: true } },
      room: { select: { name: true } },
      teacher: { include: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  });

  // Group by week (Monday-anchored).
  const byWeek = new Map<
    string,
    { label: string; sessions: typeof sessions }
  >();
  for (const s of sessions) {
    const key = weekKey(s.startAt);
    const mon = mondayOf(s.startAt);
    if (!byWeek.has(key))
      byWeek.set(key, {
        label: `Semaine du ${fmtDate(mon)}`,
        sessions: [],
      });
    byWeek.get(key)!.sessions.push(s);
  }

  return (
    <section>
      <AdminPageHeader
        title="Séances"
        description="Toutes les séances créées (brouillon, confirmées, annulées)."
      />

      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune séance. Utilise{" "}
          <a className="underline" href="/admin/assignments">
            Affectations
          </a>{" "}
          pour générer un planning.
        </p>
      ) : (
        <div className="space-y-8">
          {[...byWeek.entries()].map(([key, group]) => (
            <div key={key}>
              <h2 className="text-sm font-medium mb-3">{group.label}</h2>
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
