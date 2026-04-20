import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteSubject } from "@/server/actions/admin/subjects";
import { CreateSubjectForm } from "./CreateSubjectForm";
import { SubjectParamsForm } from "./SubjectParamsForm";

export default async function AdminSubjectsPage() {
  await requireRole("ADMIN");

  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { students: true, teachers: true, sessions: true },
      },
    },
  });

  return (
    <section>
      <AdminPageHeader
        title="Matières"
        description="Ajoute les matières enseignées au centre."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouvelle matière</h2>
          <CreateSubjectForm />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">Liste</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune matière.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {subjects.map((s) => {
                const refs =
                  s._count.students + s._count.teachers + s._count.sessions;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-zinc-500">
                        {s._count.students} élèves · {s._count.teachers} profs
                      </div>
                      <SubjectParamsForm
                        id={s.id}
                        minGroupSize={s.minGroupSize}
                        maxCapacity={s.maxCapacity}
                      />
                    </div>
                    {refs === 0 ? (
                      <form action={deleteSubject}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-400 shrink-0">
                        en usage
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
