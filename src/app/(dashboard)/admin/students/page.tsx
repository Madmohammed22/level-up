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

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const [students, subjects] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        ...(query
          ? { name: { contains: query, mode: "insensitive" as const } }
          : {}),
      },
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              Liste ({students.length})
            </h2>
          </div>
          <form className="mb-3 flex gap-2">
            <input
              name="q"
              type="text"
              placeholder="Rechercher par nom..."
              defaultValue={query}
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Chercher
            </button>
            {query && (
              <a
                href="/admin/students"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Effacer
              </a>
            )}
          </form>
          {students.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {query ? `Aucun résultat pour « ${query} ».` : "Aucun élève."}
            </p>
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
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12l2 2 4-4" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        inscrit
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
