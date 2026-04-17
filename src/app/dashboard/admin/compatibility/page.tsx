import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CompatibilityMatrix } from "./CompatibilityMatrix";

export default async function AdminCompatibilityPage() {
  await requireRole("ADMIN");

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const existing = await prisma.levelCompatibility.findMany({
    select: {
      subjectId: true,
      levelA: true,
      levelB: true,
      compatible: true,
    },
  });

  return (
    <section>
      <AdminPageHeader
        title="Compatibilité des niveaux"
        description="Définissez quels niveaux peuvent être mutualisés dans une même séance, par matière. Le moteur d'affectation utilise cette matrice."
      />

      <CompatibilityMatrix subjects={subjects} existing={existing} />
    </section>
  );
}
