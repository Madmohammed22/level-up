"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createTimeSlot,
  type ActionState,
} from "@/server/actions/admin/timeslots";

const initial: ActionState = {};

const DAYS = [
  ["MONDAY", "Lundi"],
  ["TUESDAY", "Mardi"],
  ["WEDNESDAY", "Mercredi"],
  ["THURSDAY", "Jeudi"],
  ["FRIDAY", "Vendredi"],
  ["SATURDAY", "Samedi"],
  ["SUNDAY", "Dimanche"],
] as const;

export function CreateTimeSlotForm() {
  const [state, action, pending] = useActionState(createTimeSlot, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Jour</label>
        <select
          name="dayOfWeek"
          required
          defaultValue="MONDAY"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        >
          {DAYS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Début</label>
          <input
            name="startTime"
            type="time"
            required
            defaultValue="16:00"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fin</label>
          <input
            name="endTime"
            type="time"
            required
            defaultValue="17:30"
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
