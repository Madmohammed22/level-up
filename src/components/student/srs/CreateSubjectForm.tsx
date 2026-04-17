"use client";

import { useActionState, useState } from "react";
import { createSrsSubject, type SrsSubjectState } from "@/server/actions/student/srs";

const HUE_OPTIONS = [10, 40, 80, 140, 180, 220, 260, 300, 340];

export function CreateSubjectForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action, isPending] = useActionState<SrsSubjectState | undefined, FormData>(
    async (prev, formData) => {
      const result = await createSrsSubject(prev, formData);
      if (result.ok) onSuccess?.();
      return result;
    },
    undefined,
  );
  const [hue, setHue] = useState(220);

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Nom</label>
        <input
          name="name"
          required
          placeholder="ex. Anatomie"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Code (3-4 lettres)</label>
        <input
          name="code"
          required
          maxLength={10}
          placeholder="ex. ANAT"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm uppercase"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Description (optionnelle)</label>
        <input
          name="description"
          placeholder="ex. Système musculo-squelettique"
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Couleur</label>
        <div className="flex flex-wrap gap-2">
          {HUE_OPTIONS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHue(h)}
              className="w-8 h-8 rounded-full transition-all"
              style={{
                background: `oklch(0.7 0.14 ${h})`,
                border: hue === h ? "2px solid currentColor" : "2px solid transparent",
                outline: hue === h ? "2px solid oklch(0.7 0.14 " + h + ")" : "none",
                outlineOffset: "2px",
              }}
            />
          ))}
        </div>
        <input type="hidden" name="hue" value={hue} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending ? "Création…" : "Créer la matière"}
        </button>
      </div>
    </form>
  );
}
