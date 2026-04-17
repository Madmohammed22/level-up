"use client";

import { useActionState } from "react";
import { resetPassword, type AuthState } from "@/server/actions/auth";

const initial: AuthState = {};

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initial);

  if ((state as AuthState & { ok?: boolean }).ok) {
    return (
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 p-4">
        <p className="text-sm text-green-800 dark:text-green-300 font-medium">
          Mot de passe mis à jour !
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
          Tu peux maintenant te connecter avec ton nouveau mot de passe.
        </p>
        <a
          href="/login"
          className="mt-3 inline-block text-sm font-medium underline text-green-800 dark:text-green-300"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Mise à jour…" : "Réinitialiser"}
      </button>
    </form>
  );
}
