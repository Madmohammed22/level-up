"use client";

import { useActionState } from "react";
import { createSrsCard, type SrsCardState } from "@/server/actions/student/srs";

export function CreateCardForm({
  subjectId,
  onSuccess,
}: {
  subjectId: string;
  onSuccess?: () => void;
}) {
  const [state, action, isPending] = useActionState<SrsCardState | undefined, FormData>(
    async (prev, formData) => {
      const result = await createSrsCard(prev, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="subjectId" value={subjectId} />

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">
          Texte de la carte (utilise {"{{réponse}}"} pour le trou)
        </label>
        <textarea
          name="text"
          required
          rows={3}
          placeholder="Le muscle {{deltoïde}} est innervé par le nerf axillaire."
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">
          Tag (optionnel)
        </label>
        <input
          name="tag"
          placeholder="ex. Épaule"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Ajout…" : "Ajouter la carte"}
        </button>
      </div>
    </form>
  );
}
