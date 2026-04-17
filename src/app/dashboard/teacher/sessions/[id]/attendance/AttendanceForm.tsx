"use client";

import { useActionState, useEffect, useState } from "react";
import {
  markAttendanceBulk,
  type AttendanceState,
} from "@/server/actions/teacher/attendance";

const initial: AttendanceState = {};

type Enrollment = {
  id: string;
  attendance: string;
  studentName: string;
  studentLevel: string;
};

const ATTENDANCE_OPTIONS = [
  { value: "PENDING", label: "—" },
  { value: "PRESENT", label: "Présent" },
  { value: "LATE", label: "Retard" },
  { value: "ABSENT", label: "Absent" },
] as const;

export function AttendanceForm({
  sessionId,
  enrollments,
}: {
  sessionId: string;
  enrollments: Enrollment[];
}) {
  const [state, action, pending] = useActionState(markAttendanceBulk, initial);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-2 font-medium">Eleve</th>
              <th className="px-4 py-2 font-medium">Niveau</th>
              <th className="px-4 py-2 font-medium">Presence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {enrollments.map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-3 font-medium">{e.studentName}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {e.studentLevel}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className="inline-flex items-center gap-1 text-xs"
                      >
                        <input
                          type="radio"
                          name={`attendance_${e.id}`}
                          value={opt.value}
                          defaultChecked={e.attendance === opt.value}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {state.error}
        </p>
      ) : null}

      {showSuccess ? (
        <p className="text-sm text-green-600 font-medium" role="status">
          Presences enregistrees avec succes
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les presences"}
      </button>
    </form>
  );
}
