"use client";

import { useTransition } from "react";
import { createSessionTemplate } from "@/server/actions/admin/templates";

type Option = { id: string; label: string };

export function CreateTemplateForm({
  subjects,
  teachers,
  rooms,
  timeSlots,
}: {
  subjects: Option[];
  teachers: Option[];
  rooms: Option[];
  timeSlots: Option[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await createSessionTemplate(fd);
          (e.target as HTMLFormElement).reset();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <select
          name="subjectId"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">Matière...</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          name="teacherId"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">Professeur...</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          name="roomId"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">Salle...</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>

        <select
          name="timeSlotId"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="">Créneau...</option>
          {timeSlots.map((ts) => (
            <option key={ts.id} value={ts.id}>
              {ts.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <input
          name="maxCapacity"
          type="number"
          min={1}
          max={50}
          defaultValue={10}
          placeholder="Capacité"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        />
        <select
          name="recurrence"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <option value="WEEKLY">Hebdomadaire</option>
          <option value="ONE_OFF">Ponctuel</option>
        </select>
        <select
          name="levels"
          required
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
        >
          <optgroup label="Collège">
            <option value="GRADE_7">1ère année collège</option>
            <option value="GRADE_8">2ème année collège</option>
            <option value="GRADE_9">3ème</option>
          </optgroup>
          <optgroup label="Lycée">
            <option value="GRADE_10">2nde</option>
            <option value="GRADE_11">1ère</option>
            <option value="GRADE_12">Terminale</option>
          </optgroup>
          <optgroup label="Combinés">
            <option value="GRADE_7,GRADE_8,GRADE_9">Tout collège</option>
            <option value="GRADE_10,GRADE_11,GRADE_12">Tout lycée</option>
            <option value="GRADE_7,GRADE_8,GRADE_9,GRADE_10,GRADE_11,GRADE_12">
              Tous niveaux
            </option>
          </optgroup>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-zinc-500">Valide à partir du</label>
          <input
            name="validFrom"
            type="date"
            required
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">
            Valide jusqu&apos;au (optionnel)
          </label>
          <input
            name="validUntil"
            type="date"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-50"
      >
        {pending ? "Création..." : "Créer le modèle"}
      </button>
    </form>
  );
}
