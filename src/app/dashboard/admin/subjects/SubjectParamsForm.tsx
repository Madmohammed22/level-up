"use client";

import { useActionState } from "react";
import {
  updateSubjectParams,
  type ActionState,
} from "@/server/actions/admin/subjects";

const initial: ActionState = {};

export function SubjectParamsForm({
  id,
  minGroupSize,
  maxCapacity,
}: {
  id: string;
  minGroupSize: number | null;
  maxCapacity: number | null;
}) {
  const [state, action, pending] = useActionState(updateSubjectParams, initial);

  return (
    <form action={action} className="flex items-center gap-2 mt-1">
      <input type="hidden" name="id" value={id} />
      <label className="text-xs text-zinc-500">Min</label>
      <input
        name="minGroupSize"
        type="number"
        min={1}
        max={30}
        defaultValue={minGroupSize ?? ""}
        placeholder="4"
        className="w-14 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-0.5 text-xs"
      />
      <label className="text-xs text-zinc-500">Max</label>
      <input
        name="maxCapacity"
        type="number"
        min={1}
        max={30}
        defaultValue={maxCapacity ?? ""}
        placeholder="10"
        className="w-14 rounded border border-zinc-300 dark:border-zinc-700 bg-transparent px-1.5 py-0.5 text-xs"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50"
      >
        {pending ? "…" : "OK"}
      </button>
      {state.ok ? (
        <span className="text-xs text-green-600">✓</span>
      ) : null}
      {state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}
