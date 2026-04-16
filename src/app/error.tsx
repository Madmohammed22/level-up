"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs already capture the stack; surface the digest for support.
    console.error("App error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-red-600">
          Une erreur est survenue
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Désolé pour la gêne. Tu peux réessayer ou revenir à l&apos;accueil.
        </p>
        {error.digest ? (
          <p className="text-xs text-zinc-400 font-mono">
            Réf : {error.digest}
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-3 pt-2">
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
      </div>
    </main>
  );
}
