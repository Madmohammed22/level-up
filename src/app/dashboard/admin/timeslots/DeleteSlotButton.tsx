"use client";

import { useActionState, useEffect, useState } from "react";
import { deleteTimeSlot, type DeleteState } from "@/server/actions/admin/timeslots";

const initial: DeleteState = {};

export function DeleteSlotButton({
  id,
  hasHardRefs,
}: {
  id: string;
  hasHardRefs: boolean;
}) {
  const [state, action, pending] = useActionState(deleteTimeSlot, initial);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (state.error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        {pending ? "…" : "Supprimer"}
      </button>
      {hasHardRefs && !state.error && (
        <span className="text-[10px] text-zinc-400">séances/modèles liés</span>
      )}
      {showError && state.error && (
        <span className="text-[10px] text-red-500 max-w-[200px] text-right animate-fade-out">{state.error}</span>
      )}
    </form>
  );
}
