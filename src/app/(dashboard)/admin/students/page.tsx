import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteStudent } from "@/server/actions/admin/students";
import { CreateStudentForm } from "./CreateStudentForm";
import { EditStudentForm } from "./EditStudentForm";

const LEVEL_LABELS: Record<string, string> = {
  GRADE_9: "3ème",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Terminale",
};

export default async function AdminStudentsPage() {
  await requireRole("ADMIN");

  const [students, subjects] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      include: {
        studentProfile: {
          include: {
            subjects: { select: { id: true, name: true } },
            _count: { select: { enrollments: true, availabilities: true } },
            availabilities: {
              where: { preference: { in: ["AVAILABLE", "PREFERRED"] } },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <section>
      <AdminPageHeader
        title="Élèves"
        description="Inscription d'un élève : niveau, matières, contact."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouvel élève</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Crée d&apos;abord au moins une matière.
            </p>
          ) : (
            <CreateStudentForm subjects={subjects} />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">
            Liste ({students.length})
          </h2>
          {students.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun élève.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {students.map((u) => {
                const p = u.studentProfile;
                const inUse = (p?._count.enrollments ?? 0) > 0;
                return (
                  <li
                    key={u.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{u.name}</div>
                      <div className="text-xs text-zinc-500 truncate">
                        {u.email} ·{" "}
                        {p ? LEVEL_LABELS[p.level] ?? p.level : "—"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {p?.subjects.map((s) => s.name).join(" · ") ||
                          "Aucune matière"}
                      </div>
                      {p && (
                        <div className="mt-1">
                          {p.availabilities.length > 0 ? (
                            <span className="inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                              {p.availabilities.length} créneaux dispo
                            </span>
                          ) : (
                            <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-xs font-medium">
                              Aucune disponibilité
                            </span>
                          )}
                        </div>
                      )}
                      {p ? (
                        <EditStudentForm
                          userId={u.id}
                          currentLevel={p.level}
                          currentSubjectIds={p.subjects.map((s) => s.id)}
                          allSubjects={subjects}
                        />
                      ) : null}
                    </div>
                    {!inUse ? (
                      <form action={deleteStudent}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-400">inscrit</span>
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
