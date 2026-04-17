import { ResetPasswordForm } from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white/60 dark:bg-zinc-900/60 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-zinc-500 mb-6">
          Choisis un nouveau mot de passe pour ton compte.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
