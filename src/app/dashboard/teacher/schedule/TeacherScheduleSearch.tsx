"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { groupByWeek } from "@/components/sessions/SessionsTable";
import { levelsLabel, levelLabel } from "@/lib/levelLabels";

type Row = {
  id: string;
  startAt: string;
  endAt: string;
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

const DAY_LABELS: Record<number, string> = {
  0: "Dim", 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam",
};

function fmtDate(d: Date): string {
  return `${DAY_LABELS[d.getDay()]} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function TeacherScheduleSearch({ rows }: { rows: Row[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const hydrated = rows.map((r) => ({
      ...r,
      _startAt: new Date(r.startAt),
      _endAt: new Date(r.endAt),
    }));

    const q = search.trim().toLowerCase();
    const matched = q
      ? hydrated.filter(
          (r) =>
            r.subjectName.toLowerCase().includes(q) ||
            r.roomName.toLowerCase().includes(q) ||
            r.levels.some((l) => l.toLowerCase().includes(q) || levelLabel(l).toLowerCase().includes(q)),
        )
      : hydrated;

    return groupByWeek(
      matched.map((r) => ({ ...r, startAt: r._startAt })),
    ).map((g) => ({
      ...g,
      items: g.items.map((item) => {
        const orig = matched.find((r) => r.id === item.id)!;
        return { ...orig, _startAt: orig._startAt, _endAt: orig._endAt };
      }),
    }));
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par matière, salle ou niveau…"
          className="w-full md:w-80 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {search.trim()
            ? `Aucune séance trouvée pour « ${search} »`
            : "Aucune séance planifiée."}
        </p>
      ) : (
        <div className="space-y-8">
          {filtered.map((g) => (
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
                        <Td>{fmtDate(s._startAt)}</Td>
                        <Td>{fmtTime(s._startAt)}–{fmtTime(s._endAt)}</Td>
                        <Td className="font-medium">{s.subjectName}</Td>
                        <Td>{s.roomName}</Td>
                        <Td>{levelsLabel(s.levels)}</Td>
                        <Td>{s.enrolledCount}/{s.maxCapacity}</Td>
                        <Td><StatusBadge status={s.status} /></Td>
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
    </div>
  );
}

function AttendanceLink({ row }: { row: Row & { isPast: boolean } }) {
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
    CONFIRMED: "bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300",
    CANCELLED: "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300",
  };
  const label: Record<string, string> = {
    DRAFT: "Brouillon",
    CONFIRMED: "Confirmée",
    CANCELLED: "Annulée",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
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

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
