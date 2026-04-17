import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">Inscription</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Crée ton compte élève. Un admin pourra t&apos;attribuer tes cours.
        </p>
        <RegisterForm />
        <p className="mt-6 text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="font-medium underline">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
