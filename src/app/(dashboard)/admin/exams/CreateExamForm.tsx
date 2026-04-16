"use client";

import { useActionState } from "react";
import {
  createExamDate,
  type ExamState,
} from "@/server/actions/admin/exams";

type StudentOption = {
  id: string;
  userName: string;
  level: string;
};

type SubjectOption = {
  id: string;
  name: string;
};

const initialState: ExamState = {};

export function CreateExamForm({
  students,
  subjects,
}: {
  students: StudentOption[];
  subjects: SubjectOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createExamDate,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Élève</label>
        <select
          name="studentId"
          required
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">— choisir un élève —</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.userName} ({s.level})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Matière</label>
        <select
          name="subjectId"
          required
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          <option value="">— choisir une matière —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date d&apos;examen</label>
        <input
          type="date"
          name="date"
          required
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-600" role="status">
          Examen enregistré.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Ajouter"}
      </button>
    </form>
  );
}
