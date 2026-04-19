"use client";

import { useActionState, useState } from "react";
import {
  saveBulkCompatibility,
  type CompatibilityState,
} from "@/server/actions/admin/compatibility";
import { levelLabel } from "@/lib/levelLabels";

type Level = "GRADE_7" | "GRADE_8" | "GRADE_9" | "GRADE_10" | "GRADE_11" | "GRADE_12";

type SubjectData = {
  id: string;
  name: string;
};

type CompatRow = {
  subjectId: string;
  levelA: string;
  levelB: string;
  compatible: boolean;
};

type Props = {
  subjects: SubjectData[];
  existing: CompatRow[];
};

const LEVELS: Level[] = ["GRADE_7", "GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];


/** Generate all unique pairs (i < j) */
function levelPairs(): [Level, Level][] {
  const pairs: [Level, Level][] = [];
  for (let i = 0; i < LEVELS.length; i++) {
    for (let j = i + 1; j < LEVELS.length; j++) {
      pairs.push([LEVELS[i], LEVELS[j]]);
    }
  }
  return pairs;
}

const PAIRS = levelPairs();

function pairKey(subjectId: string, a: Level, b: Level): string {
  return a < b ? `${subjectId}|${a}|${b}` : `${subjectId}|${b}|${a}`;
}

const initial: CompatibilityState = {};

export function CompatibilityMatrix({ subjects, existing }: Props) {
  const [state, action, pending] = useActionState(
    saveBulkCompatibility,
    initial,
  );
  const [search, setSearch] = useState("");

  const filteredSubjects = search.trim()
    ? subjects.filter((s) =>
        s.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : subjects;

  // Build initial state from existing rows
  const [compat, setCompat] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    // Default all pairs to false
    for (const s of subjects) {
      for (const [a, b] of PAIRS) {
        init[pairKey(s.id, a, b)] = false;
      }
    }
    // Override with existing
    for (const row of existing) {
      const key = pairKey(row.subjectId, row.levelA as Level, row.levelB as Level);
      init[key] = row.compatible;
    }
    return init;
  });

  function toggle(subjectId: string, a: Level, b: Level) {
    const key = pairKey(subjectId, a, b);
    setCompat((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Build entries for submission
  const entries = subjects.flatMap((s) =>
    PAIRS.map(([a, b]) => ({
      subjectId: s.id,
      levelA: a,
      levelB: b,
      compatible: compat[pairKey(s.id, a, b)] ?? false,
    })),
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      {/* Search */}
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
          placeholder="Rechercher une matière…"
          className="w-full md:w-72 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
          Incompatible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 ring-1 ring-green-300 dark:ring-green-700" />
          Compatible (mutualisable)
        </span>
        <span className="text-zinc-400 ml-2">Cliquer pour basculer</span>
      </div>

      {subjects.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune matière. Créez des matières d&apos;abord.
        </p>
      ) : filteredSubjects.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Aucune matière trouvée pour « {search} »
        </p>
      ) : (
        <div className="space-y-6">
          {filteredSubjects.map((subject) => (
            <div
              key={subject.id}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
            >
              <h3 className="font-medium mb-3">{subject.name}</h3>
              <div className="overflow-x-auto">
                <table className="text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-1 pr-3 text-xs font-medium text-zinc-500">
                        Paire
                      </th>
                      <th className="py-1 px-2 text-center text-xs font-medium text-zinc-500">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAIRS.map(([a, b]) => {
                      const key = pairKey(subject.id, a, b);
                      const isCompat = compat[key] ?? false;
                      return (
                        <tr
                          key={`${a}-${b}`}
                          className="border-t border-zinc-200 dark:border-zinc-800"
                        >
                          <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400">
                            {levelLabel(a)} + {levelLabel(b)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggle(subject.id, a, b)}
                              className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors min-w-[100px] ${
                                isCompat
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-700"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                              }`}
                            >
                              {isCompat ? "Compatible" : "Incompatible"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Compatibilités enregistrées !
        </p>
      )}

      {subjects.length > 0 && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer tout"}
        </button>
      )}
    </form>
  );
}
