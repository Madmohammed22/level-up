import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">Connexion</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Accède à ton espace élève, prof ou admin.
        </p>
        <LoginForm />
        <div className="mt-4 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <p className="mt-4 text-sm text-zinc-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium underline">
            Inscription
          </Link>
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
