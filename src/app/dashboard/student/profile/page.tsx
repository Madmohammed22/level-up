import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { StudentProfileForm } from "./StudentProfileForm";

export default async function StudentProfilePage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: {
      phone: true,
      guardianEmail: true,
      guardianPhone: true,
    },
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-sm text-zinc-500">
          Modifie tes informations personnelles.
        </p>
      </header>

      <StudentProfileForm
        name={user.name ?? ""}
        phone={profile?.phone ?? ""}
        guardianEmail={profile?.guardianEmail ?? ""}
        guardianPhone={profile?.guardianPhone ?? ""}
      />
    </section>
  );
}
