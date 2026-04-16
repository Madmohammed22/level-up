"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  createContentItem,
  updateContentItem,
  type ContentState,
} from "@/server/actions/admin/content";

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "STRESS", label: "Stress" },
  { value: "METHODOLOGY", label: "Méthodologie" },
  { value: "TIME_MANAGEMENT", label: "Gestion du temps" },
  { value: "EXAM_PREP", label: "Préparation examen" },
];

const TYPES: Array<{ value: string; label: string }> = [
  { value: "MICRO_LESSON", label: "Micro-leçon" },
  { value: "EXERCISE", label: "Exercice" },
  { value: "PROTOCOL", label: "Protocole" },
  { value: "TEMPLATE", label: "Modèle" },
];

export type ContentInitial = {
  id?: string;
  title: string;
  type: string;
  category: string;
  body: string;
  durationSec: number | null;
  published: boolean;
};

const initialState: ContentState = {};

export function ContentForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ContentInitial;
}) {
  const action = mode === "create" ? createContentItem : updateContentItem;
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-5 max-w-xl">
      {initial?.id ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : null}

      <div>
        <label className="block text-sm font-medium mb-1">Titre</label>
        <input
          name="title"
          required
          maxLength={120}
          defaultValue={initial?.title ?? ""}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <select
            name="category"
            required
            defaultValue={initial?.category ?? "METHODOLOGY"}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            name="type"
            required
            defaultValue={initial?.type ?? "MICRO_LESSON"}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Contenu (markdown)
        </label>
        <textarea
          name="body"
          required
          rows={10}
          maxLength={10000}
          defaultValue={initial?.body ?? ""}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm font-mono"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Le contenu est affiché tel quel aux élèves. Tu peux utiliser des
          listes, des paragraphes et de la mise en forme simple.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Durée (secondes, optionnel)
        </label>
        <input
          name="durationSec"
          type="number"
          min={0}
          defaultValue={initial?.durationSec ?? ""}
          className="w-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Pour les exercices chronométrés (respiration, etc.). Laisse vide
          sinon.
        </p>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          name="published"
          type="checkbox"
          defaultChecked={initial?.published ?? true}
          className="rounded border-zinc-300"
        />
        Visible par les élèves (publié)
      </label>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {pending
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer"
              : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/content")}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
