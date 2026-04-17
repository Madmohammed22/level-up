import { requireRole } from "@/server/auth/requireRole";
import { AdminProfileForm } from "./AdminProfileForm";

export default async function AdminProfilePage() {
  const user = await requireRole("ADMIN");

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-sm text-zinc-500">
          Modifiez vos informations personnelles.
        </p>
      </header>

      <AdminProfileForm
        name={user.name ?? ""}
        email={user.email ?? ""}
      />
    </section>
  );
}
