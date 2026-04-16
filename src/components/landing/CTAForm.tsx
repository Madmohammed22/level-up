"use client";

import { useState, useTransition } from "react";
import { submitLead } from "@/server/actions/leads";

export function CTAForm() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "ok" } | { kind: "error"; message: string }
  >({ kind: "idle" });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await submitLead(fd);
          if (res.ok) {
            setStatus({ kind: "ok" });
            (e.target as HTMLFormElement).reset();
          } else {
            setStatus({ kind: "error", message: res.error });
          }
        });
      }}
    >
      <input type="hidden" name="source" value="landing-cta" />
      <input
        name="name"
        placeholder="Nom complet"
        required
        minLength={2}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-zinc-900 dark:text-zinc-50"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-zinc-900 dark:text-zinc-50"
      />
      <input
        name="phone"
        placeholder="T&eacute;l&eacute;phone (optionnel)"
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-zinc-900 dark:text-zinc-50"
      />
      <textarea
        name="message"
        placeholder="Votre message (optionnel)"
        rows={3}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {pending ? "Envoi..." : "R\u00e9server ma s\u00e9ance"}
      </button>
      {status.kind === "ok" && (
        <p className="text-green-600 text-sm text-center">
          Merci ! Nous vous recontactons sous 24h.
        </p>
      )}
      {status.kind === "error" && (
        <p className="text-red-600 text-sm text-center">{status.message}</p>
      )}
    </form>
  );
}
