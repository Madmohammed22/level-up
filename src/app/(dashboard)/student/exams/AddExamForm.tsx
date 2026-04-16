"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createStudentExam,
  type StudentExamState,
} from "@/server/actions/student/exams";

type SubjectOption = { id: string; name: string };

const initial: StudentExamState = {};

export function AddExamForm({ subjects }: { subjects: SubjectOption[] }) {
  const [state, action, pending] = useActionState(createStudentExam, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  // Default date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = new Date().toISOString().split("T")[0];
  const defaultDate = tomorrow.toISOString().split("T")[0];

  return (
    <form ref={ref} action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Matière</label>
        {subjects.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune matière associée à ton profil.
          </p>
        ) : (
          <select
            name="subjectId"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Date de l&apos;examen
        </label>
        <input
          type="date"
          name="date"
          required
          min={minDate}
          defaultValue={defaultDate}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Examen ajouté !
        </p>
      )}

      <button
        type="submit"
        disabled={pending || subjects.length === 0}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}
