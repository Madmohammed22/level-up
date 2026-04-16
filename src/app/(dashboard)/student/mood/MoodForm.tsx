"use client";

import { useActionState, useEffect, useRef, useState } from "react";
// Note: score state deliberately persists across submissions; the user
// explicitly chooses each time. Resetting inside the effect would trigger
// the `react-hooks/set-state-in-effect` rule.
import { submitMoodCheckIn, type MoodState } from "@/server/actions/student/mood";

const initial: MoodState = {};

const EMOJI = ["😞", "🙁", "😐", "🙂", "😄"];

export function MoodForm() {
  const [state, action, pending] = useActionState(submitMoodCheckIn, initial);
  const [score, setScore] = useState<number>(3);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Note ton humeur
        </label>
        <div className="flex items-center gap-2">
          {EMOJI.map((e, i) => {
            const v = i + 1;
            const active = v === score;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setScore(v)}
                aria-pressed={active}
                className={`text-3xl leading-none rounded-full p-2 transition ${
                  active
                    ? "bg-zinc-900 dark:bg-zinc-100"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {e}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="score" value={score} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Une note ? (optionnel)
        </label>
        <textarea
          name="note"
          rows={3}
          maxLength={500}
          placeholder="Ex: un peu stressé pour le contrôle de maths demain."
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          Check-in enregistré. Bonne journée 💪
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Enregistrer"}
      </button>
    </form>
  );
}
