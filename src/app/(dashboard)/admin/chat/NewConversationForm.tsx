"use client";

import { useState } from "react";
import { useActionState } from "react";
import {
  startConversationAsAdmin,
  type ChatState,
} from "@/server/actions/chat";

type StudentOption = {
  userId: string;
  name: string;
  level: string;
  hasConversation: boolean;
};

const initialState: ChatState = {};

export function NewConversationForm({
  students,
}: {
  students: StudentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    startConversationAsAdmin,
    initialState,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
      >
        + Nouveau message
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 max-w-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Nouveau message</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:underline"
        >
          Annuler
        </button>
      </div>

      <form action={formAction} className="space-y-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
            Destinataire
          </label>
          <select
            name="studentUserId"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          >
            <option value="">— choisir un élève —</option>
            {students.map((s) => (
              <option key={s.userId} value={s.userId}>
                {s.name} ({s.level})
                {s.hasConversation ? " — conversation existante" : ""}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Si une conversation existe déjà avec cet élève, ton message y sera
            ajouté.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">
            Message
          </label>
          <textarea
            name="content"
            required
            rows={4}
            maxLength={4000}
            placeholder="Bonjour, …"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>

        {state.error ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
