"use client";

import { useActionState } from "react";
import {
  updateAdminProfile,
  type AdminProfileState,
} from "@/server/actions/admin/profile";

type Props = {
  name: string;
  email: string;
};

const initial: AdminProfileState = {};

export function AdminProfileForm({ name, email }: Props) {
  const [state, action, pending] = useActionState(
    updateAdminProfile,
    initial,
  );

  return (
    <form action={action} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          name="name"
          required
          defaultValue={name}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          disabled
          value={email}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
        />
        <p className="text-[10px] text-zinc-400 mt-1">
          L&apos;email ne peut pas être modifié.
        </p>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Profil mis à jour !
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
