"use client";

import { useState, useMemo } from "react";
import {
  SessionsTable,
  groupByWeek,
  type SessionRow,
} from "@/components/sessions/SessionsTable";

type SerializedRow = Omit<SessionRow, "startAt" | "endAt"> & {
  startAt: string;
  endAt: string;
};

export function ScheduleSearch({ rows }: { rows: SerializedRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const hydrated: SessionRow[] = rows.map((r) => ({
      ...r,
      startAt: new Date(r.startAt),
      endAt: new Date(r.endAt),
    }));

    if (!search.trim()) return groupByWeek(hydrated);

    const q = search.trim().toLowerCase();
    const matched = hydrated.filter(
      (r) =>
        r.subjectName.toLowerCase().includes(q) ||
        r.teacherName.toLowerCase().includes(q) ||
        r.roomName.toLowerCase().includes(q),
    );
    return groupByWeek(matched);
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
          placeholder="Rechercher par matière, prof ou salle…"
          className="w-full md:w-80 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {search.trim()
            ? `Aucune séance trouvée pour « ${search} »`
            : "Aucune séance assignée pour le moment."}
        </p>
      ) : (
        <div className="space-y-8">
          {filtered.map((g) => (
            <div key={g.key}>
              <h2 className="text-sm font-medium mb-3">{g.label}</h2>
              <SessionsTable sessions={g.items} showEnrollment={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
