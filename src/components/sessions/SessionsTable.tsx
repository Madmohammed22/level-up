// Reusable sessions table for student/teacher/admin views.
// Shows time, subject, teacher, room, levels, enrollment count, status.

import { mondayOf } from "@/server/domain/scheduling/weekDates";
import { levelsLabel } from "@/lib/levelLabels";

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
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(
    2,
    "0",
  )}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export type SessionRow = {
  id: string;
  startAt: Date;
  endAt: Date;
  subjectName: string;
  teacherName: string;
  roomName: string;
  levels: string[];
  enrolledCount: number;
  maxCapacity: number;
  status: string;
};

export function groupByWeek<T extends { startAt: Date }>(
  rows: T[],
): Array<{ key: string; label: string; items: T[] }> {
  const groups = new Map<string, { label: string; items: T[] }>();
  for (const r of rows) {
    const mon = mondayOf(r.startAt);
    const key = mon.toISOString().slice(0, 10);
    if (!groups.has(key)) {
      groups.set(key, {
        label: `Semaine du ${fmtDate(mon)}`,
        items: [],
      });
    }
    groups.get(key)!.items.push(r);
  }
  return [...groups.entries()].map(([key, v]) => ({
    key,
    label: v.label,
    items: v.items,
  }));
}

export function SessionsTable({
  sessions,
  showEnrollment = true,
}: {
  sessions: SessionRow[];
  showEnrollment?: boolean;
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-zinc-500">Aucune séance.</p>;
  }

  return (
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
            {showEnrollment ? <Th>Élèves</Th> : null}
            <Th>Statut</Th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className={`border-t border-zinc-200 dark:border-zinc-800 ${
                s.status === "CANCELLED" ? "opacity-50 line-through" : ""
              }`}
            >
              <Td>{fmtDate(s.startAt)}</Td>
              <Td>
                {fmtTime(s.startAt)}–{fmtTime(s.endAt)}
              </Td>
              <Td className="font-medium">{s.subjectName}</Td>
              <Td>{s.teacherName}</Td>
              <Td>{s.roomName}</Td>
              <Td>{levelsLabel(s.levels)}</Td>
              {showEnrollment ? (
                <Td>
                  {s.enrolledCount}/{s.maxCapacity}
                </Td>
              ) : null}
              <Td>
                <StatusBadge status={s.status} />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
