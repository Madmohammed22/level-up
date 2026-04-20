"use client";

import { useActionState, useEffect, useRef } from "react";
import { createSubject, type ActionState } from "@/server/actions/admin/subjects";

const initial: ActionState = {};

export function CreateSubjectForm() {
  const [state, action, pending] = useActionState(createSubject, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input
        name="name"
        type="text"
        required
        placeholder="Ex: Maths"
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">Min. groupe</label>
          <input
            name="minGroupSize"
            type="number"
            min={1}
            max={30}
            placeholder="4"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">Max. élèves</label>
          <input
            name="maxCapacity"
            type="number"
            min={1}
            max={30}
            placeholder="10"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
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
        {pending ? "Ajout…" : "Ajouter"}
      </button>
    </form>
  );
}
