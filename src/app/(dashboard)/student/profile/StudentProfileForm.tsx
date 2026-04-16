"use client";

import { useActionState } from "react";
import {
  updateStudentProfile,
  type StudentProfileState,
} from "@/server/actions/student/profile";

type Props = {
  name: string;
  phone: string;
  guardianEmail: string;
  guardianPhone: string;
};

const initial: StudentProfileState = {};

export function StudentProfileForm({
  name,
  phone,
  guardianEmail,
  guardianPhone,
}: Props) {
  const [state, action, pending] = useActionState(
    updateStudentProfile,
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
        <label className="block text-sm font-medium mb-1">Téléphone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={phone}
          placeholder="06 12 34 56 78"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Email du responsable
        </label>
        <input
          name="guardianEmail"
          type="email"
          defaultValue={guardianEmail}
          placeholder="parent@email.com"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Téléphone du responsable
        </label>
        <input
          name="guardianPhone"
          type="tel"
          defaultValue={guardianPhone}
          placeholder="06 12 34 56 78"
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
