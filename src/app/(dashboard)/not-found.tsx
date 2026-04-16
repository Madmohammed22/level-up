import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <section className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Erreur 404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight mt-2">
        Ressource introuvable
      </h1>
      <p className="text-sm text-zinc-500 mt-2 max-w-md">
        Cette ressource n&apos;existe pas, a été supprimée, ou tu n&apos;as pas
        les droits d&apos;y accéder.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
      >
        Retour au tableau de bord
      </Link>
    </section>
  );
}
