"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createStudent,
  type ActionState,
} from "@/server/actions/admin/students";

const initial: ActionState = {};

type Subject = { id: string; name: string };

const LEVELS = [
  ["GRADE_9", "3ème"],
  ["GRADE_10", "2nde"],
  ["GRADE_11", "1ère"],
  ["GRADE_12", "Terminale"],
] as const;

export function CreateStudentForm({ subjects }: { subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createStudent, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nom complet</label>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Niveau</label>
        <select
          name="level"
          required
          defaultValue="GRADE_10"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          {LEVELS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Matières</label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <label
              key={s.id}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                name="subjectIds"
                value={s.id}
                className="accent-zinc-900 dark:accent-zinc-100"
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <details className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
        <summary className="cursor-pointer text-sm">
          Contact (optionnel)
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs mb-1">Téléphone</label>
            <input
              name="phone"
              type="tel"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Email parent</label>
            <input
              name="guardianEmail"
              type="email"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Téléphone parent</label>
            <input
              name="guardianPhone"
              type="tel"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            />
          </div>
        </div>
      </details>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Création…" : "Créer l'élève"}
      </button>
    </form>
  );
}
