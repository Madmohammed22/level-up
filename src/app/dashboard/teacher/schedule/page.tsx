import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { groupByWeek } from "@/components/sessions/SessionsTable";

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
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Row = {
  id: string;
  startAt: Date;
  endAt: Date;
  subjectName: string;
  roomName: string;
  levels: string[];
  enrolledCount: number;
  maxCapacity: number;
  status: string;
  pendingAttendance: number;
  totalAttendance: number;
  isPast: boolean;
};

export default async function TeacherSchedulePage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Mon planning
        </h1>
        <p className="text-sm text-zinc-500">
          Profil professeur introuvable. Contacte un administrateur.
        </p>
      </section>
    );
  }

  const sessions = await prisma.session.findMany({
    where: { teacherId: profile.id },
    orderBy: { startAt: "asc" },
    include: {
      subject: { select: { name: true } },
      room: { select: { name: true } },
      enrollments: {
        where: { status: "CONFIRMED" },
        select: { attendance: true },
      },
    },
  });

  const now = new Date();
  const rows: Row[] = sessions.map((s) => {
    const total = s.enrollments.length;
    const pending = s.enrollments.filter(
      (e) => e.attendance === "PENDING",
    ).length;
    return {
      id: s.id,
      startAt: s.startAt,
      endAt: s.endAt,
      subjectName: s.subject.name,
      roomName: s.room.name,
      levels: s.levels,
      enrolledCount: total,
      maxCapacity: s.maxCapacity,
      status: s.status,
      pendingAttendance: pending,
      totalAttendance: total,
      isPast: s.endAt.getTime() < now.getTime(),
    };
  });

  const byWeek = groupByWeek(rows);

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon planning</h1>
        <p className="text-sm text-zinc-500">
          Toutes tes séances, groupées par semaine. Clique sur «&nbsp;Présences&nbsp;»
          pour saisir la présence après la séance.
        </p>
      </header>

      {byWeek.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune séance planifiée.</p>
      ) : (
        <div className="space-y-8">
          {byWeek.map((g) => (
            <div key={g.key}>
              <h2 className="text-sm font-medium mb-3">{g.label}</h2>
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-sm">
                  <thead className="text-left bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <Th>Jour</Th>
                      <Th>Horaire</Th>
                      <Th>Matière</Th>
                      <Th>Salle</Th>
                      <Th>Niveaux</Th>
                      <Th>Élèves</Th>
                      <Th>Statut</Th>
                      <Th>Action</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-t border-zinc-200 dark:border-zinc-800 ${s.status === "CANCELLED" ? "opacity-50 line-through" : ""}`}
                      >
                        <Td>{fmtDate(s.startAt)}</Td>
                        <Td>
                          {fmtTime(s.startAt)}–{fmtTime(s.endAt)}
                        </Td>
                        <Td className="font-medium">{s.subjectName}</Td>
                        <Td>{s.roomName}</Td>
                        <Td>{s.levels.join(" + ")}</Td>
                        <Td>
                          {s.enrolledCount}/{s.maxCapacity}
                        </Td>
                        <Td>
                          <StatusBadge status={s.status} />
                        </Td>
                        <Td>
                          {s.status === "CANCELLED" ? (
                            <span className="text-xs text-zinc-400">—</span>
                          ) : (
                            <AttendanceLink row={s} />
                          )}
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

function AttendanceLink({ row }: { row: Row }) {
  const label = row.isPast
    ? row.pendingAttendance === 0
      ? "Voir présences"
      : `Saisir (${row.pendingAttendance})`
    : "Préparer";
  const color =
    row.isPast && row.pendingAttendance > 0
      ? "text-amber-600"
      : "text-blue-600";
  return (
    <Link
      href={`/dashboard/teacher/sessions/${row.id}/attendance`}
      className={`text-xs ${color} hover:underline`}
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
    CONFIRMED:
      "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300",
    CANCELLED: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300",
  };
  const label: Record<string, string> = {
    DRAFT: "Brouillon",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}
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

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
