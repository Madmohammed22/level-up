"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createTeacher,
  type ActionState,
} from "@/server/actions/admin/teachers";

const initial: ActionState = {};

type Subject = { id: string; name: string };

export function CreateTeacherForm({ subjects }: { subjects: Subject[] }) {
  const [state, action, pending] = useActionState(createTeacher, initial);
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
        <label className="block text-sm font-medium mb-1">Bio (optionnel)</label>
        <textarea
          name="bio"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
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
        {pending ? "Création…" : "Créer le professeur"}
      </button>
    </form>
  );
}
