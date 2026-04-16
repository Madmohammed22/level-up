"use client";

import { useTransition } from "react";
import { markAllNotificationsRead } from "@/server/actions/notifications";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      onClick={() => start(() => markAllNotificationsRead())}
      disabled={pending}
      className="text-xs rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
    >
      {pending ? "…" : "Tout marquer lu"}
    </button>
  );
}
