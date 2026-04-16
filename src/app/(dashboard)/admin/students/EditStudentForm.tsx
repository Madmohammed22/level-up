"use client";

import { useState, useActionState } from "react";
import { updateStudent, type ActionState } from "@/server/actions/admin/students";

type Props = {
  userId: string;
  currentLevel: string;
  currentSubjectIds: string[];
  allSubjects: { id: string; name: string }[];
};

const LEVELS = [
  { value: "GRADE_9", label: "3ème" },
  { value: "GRADE_10", label: "2nde" },
  { value: "GRADE_11", label: "1ère" },
  { value: "GRADE_12", label: "Terminale" },
];

const initial: ActionState = {};

export function EditStudentForm({
  userId,
  currentLevel,
  currentSubjectIds,
  allSubjects,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateStudent, initial);

  // Close form when save succeeds (server returns ok, page revalidates)
  const open = editing && !state.ok;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs text-blue-600 hover:underline"
      >
        Modifier
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <label className="block text-xs font-medium mb-1">Niveau</label>
        <select
          name="level"
          defaultValue={currentLevel}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-2 py-1 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Matières</label>
        <div className="flex flex-wrap gap-2">
          {allSubjects.map((s) => (
            <label key={s.id} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                name="subjectIds"
                value={s.id}
                defaultChecked={currentSubjectIds.includes(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      {state.error ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 text-xs font-medium disabled:opacity-60"
        >
          {pending ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-zinc-500 hover:underline"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
