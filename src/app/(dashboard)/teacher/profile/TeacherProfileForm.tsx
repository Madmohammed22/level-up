"use client";

import { useActionState } from "react";
import {
  updateTeacherProfile,
  type TeacherProfileState,
} from "@/server/actions/teacher/profile";

type Props = {
  name: string;
  bio: string;
};

const initial: TeacherProfileState = {};

export function TeacherProfileForm({ name, bio }: Props) {
  const [state, action, pending] = useActionState(
    updateTeacherProfile,
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
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          name="bio"
          rows={4}
          maxLength={500}
          defaultValue={bio}
          placeholder="Quelques mots sur vous, vos spécialités…"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
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
