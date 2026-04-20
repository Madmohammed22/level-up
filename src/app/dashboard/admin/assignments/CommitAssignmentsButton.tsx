"use client";

import { useActionState } from "react";
import {
  commitAssignments,
  type CommitState,
} from "@/server/actions/admin/assignments";

const initial: CommitState = {};

export function CommitAssignmentsButton({
  weekISO,
  minGroupSize,
  maxCapacity,
}: {
  weekISO: string;
  minGroupSize?: number;
  maxCapacity?: number;
}) {
  const [state, action, pending] = useActionState(commitAssignments, initial);

  return (
    <form action={action} className="flex items-center gap-3">
      <input type="hidden" name="weekStart" value={weekISO} />
      {minGroupSize != null && (
        <input type="hidden" name="minGroupSize" value={minGroupSize} />
      )}
      {maxCapacity != null && (
        <input type="hidden" name="maxCapacity" value={maxCapacity} />
      )}
      {state.ok ? (
        <span className="text-sm text-green-700 dark:text-green-400">
          {state.created} séance(s) créée(s).
        </span>
      ) : null}
      {state.error ? (
        <span className="text-sm text-red-600">{state.error}</span>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Création…" : "Valider et créer les séances"}
      </button>
    </form>
  );
}
