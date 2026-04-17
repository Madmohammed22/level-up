"use client";

import { useActionState, useEffect, useRef } from "react";
import { createRoom, type ActionState } from "@/server/actions/admin/rooms";

const initial: ActionState = {};

export function CreateRoomForm() {
  const [state, action, pending] = useActionState(createRoom, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ex: Salle A"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Capacité</label>
        <input
          name="capacity"
          type="number"
          min={1}
          max={50}
          defaultValue={10}
          required
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
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
