import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Erreur 404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Page introuvable
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          La page que tu cherches n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
