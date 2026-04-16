import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { TeacherProfileForm } from "./TeacherProfileForm";

export default async function TeacherProfilePage() {
  const user = await requireRole("TEACHER");

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { bio: true },
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-sm text-zinc-500">
          Modifiez vos informations personnelles.
        </p>
      </header>

      <TeacherProfileForm
        name={user.name ?? ""}
        bio={profile?.bio ?? ""}
      />
    </section>
  );
}
