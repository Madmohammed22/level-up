import Link from "next/link";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Entre ton email pour recevoir un lien de réinitialisation.
        </p>
        <ForgotPasswordForm />
        <Link
          href="/auth/login"
          className="mt-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
