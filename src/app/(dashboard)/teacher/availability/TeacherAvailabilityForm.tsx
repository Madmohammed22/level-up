"use client";

import { useActionState, useState } from "react";
import {
  saveTeacherAvailability,
  type TeacherAvailabilityState,
} from "@/server/actions/teacher/availability";

type TimeSlotRow = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

type Props = {
  timeSlots: TimeSlotRow[];
  /** Current saved availability keyed by timeSlotId */
  saved: Record<string, boolean>;
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mer",
  THURSDAY: "Jeu",
  FRIDAY: "Ven",
  SATURDAY: "Sam",
  SUNDAY: "Dim",
};

const initial: TeacherAvailabilityState = {};

export function TeacherAvailabilityForm({ timeSlots, saved }: Props) {
  const [state, action, pending] = useActionState(
    saveTeacherAvailability,
    initial,
  );

  const [avail, setAvail] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const slot of timeSlots) {
      init[slot.id] = saved[slot.id] ?? false;
    }
    return init;
  });

  function toggle(slotId: string) {
    setAvail((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  }

  // Group unique time ranges
  const timeRanges = Array.from(
    new Set(timeSlots.map((s) => `${s.startTime}-${s.endTime}`)),
  ).sort();

  // Build lookup: day+range → slot
  const slotMap = new Map<string, TimeSlotRow>();
  for (const s of timeSlots) {
    slotMap.set(`${s.dayOfWeek}|${s.startTime}-${s.endTime}`, s);
  }

  const activeDays = DAY_ORDER.filter((d) =>
    timeSlots.some((s) => s.dayOfWeek === d),
  );

  const entries = Object.entries(avail).map(([timeSlotId, available]) => ({
    timeSlotId,
    available,
  }));

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="entries" value={JSON.stringify(entries)} />

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700" />
          Indisponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 ring-1 ring-green-300 dark:ring-green-700" />
          Disponible
        </span>
        <span className="text-zinc-400 ml-2">Cliquer pour basculer</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2 pr-3 text-xs font-medium text-zinc-500">
                Créneau
              </th>
              {activeDays.map((d) => (
                <th
                  key={d}
                  className="py-2 px-1 text-center text-xs font-medium text-zinc-500"
                >
                  {DAY_LABELS[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeRanges.map((range) => (
              <tr
                key={range}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="py-2 pr-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                  {range.replace("-", " – ")}
                </td>
                {activeDays.map((day) => {
                  const slot = slotMap.get(`${day}|${range}`);
                  if (!slot) {
                    return (
                      <td key={day} className="py-2 px-1 text-center">
                        <span className="text-zinc-300 dark:text-zinc-700">
                          ·
                        </span>
                      </td>
                    );
                  }
                  const isAvail = avail[slot.id] ?? false;
                  return (
                    <td key={day} className="py-2 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(slot.id)}
                        className={`inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium transition-colors min-w-[60px] ${
                          isAvail
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 ring-1 ring-green-300 dark:ring-green-700"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        {isAvail ? "Dispo" : "—"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {timeSlots.length === 0 && (
        <p className="text-sm text-zinc-500">
          Aucun créneau horaire configuré. Contactez un administrateur.
        </p>
      )}

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Disponibilités enregistrées !
        </p>
      )}

      {timeSlots.length > 0 && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      )}
    </form>
  );
}
