import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteTeacher } from "@/server/actions/admin/teachers";
import { CreateTeacherForm } from "./CreateTeacherForm";
import { EditTeacherForm } from "./EditTeacherForm";

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const [teachers, subjects] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "TEACHER",
        ...(query
          ? { name: { contains: query, mode: "insensitive" as const } }
          : {}),
      },
      orderBy: { name: "asc" },
      include: {
        teacherProfile: {
          include: {
            subjects: { select: { id: true, name: true } },
            _count: { select: { sessions: true, sessionTemplates: true, availabilities: true } },
            availabilities: {
              where: { available: true },
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
        title="Professeurs"
        description="Ajoute un professeur, ses matières, et sa bio."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouveau professeur</h2>
          {subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Crée d&apos;abord au moins une matière.
            </p>
          ) : (
            <CreateTeacherForm subjects={subjects} />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              Liste ({teachers.length})
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
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              Chercher
            </button>
            {query && (
              <a
                href="/admin/teachers"
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Effacer
              </a>
            )}
          </form>
          {teachers.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {query ? `Aucun résultat pour « ${query} ».` : "Aucun professeur."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {teachers.map((t) => {
                const p = t.teacherProfile;
                const inUse =
                  (p?._count.sessions ?? 0) +
                    (p?._count.sessionTemplates ?? 0) >
                  0;
                return (
                  <li
                    key={t.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{t.name}</div>
                      <div className="text-xs text-zinc-500 truncate">
                        {t.email}
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
                        <EditTeacherForm
                          userId={t.id}
                          currentSubjectIds={p.subjects.map((s) => s.id)}
                          allSubjects={subjects}
                        />
                      ) : null}
                    </div>
                    {!inUse ? (
                      <form action={deleteTeacher}>
                        <input type="hidden" name="userId" value={t.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-400">en usage</span>
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
