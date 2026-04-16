"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-red-600">
        Erreur
      </p>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">
        Impossible d&apos;afficher cette page
      </h1>
      <p className="text-sm text-zinc-500 mt-2 max-w-md">
        Une erreur s&apos;est produite pendant le chargement. Réessaie ou
        reviens à ton tableau de bord.
      </p>
      {error.digest ? (
        <p className="text-xs text-zinc-400 font-mono mt-2">
          Réf : {error.digest}
        </p>
      ) : null}
      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
        >
          Accueil
        </Link>
      </div>
    </section>
  );
}
