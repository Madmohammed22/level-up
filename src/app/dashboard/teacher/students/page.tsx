import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";

const LEVEL_LABELS: Record<string, string> = {
  GRADE_7: "1AC",
  GRADE_8: "2AC",
  GRADE_9: "3ème",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Terminale",
};

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("TEACHER");
  const params = await searchParams;
  const query = (params.q ?? "").trim().toLowerCase();

  const profile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!profile) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Mes élèves
        </h1>
        <p className="text-sm text-zinc-500">
          Profil professeur introuvable. Contacte un administrateur.
        </p>
      </section>
    );
  }

  // Distinct students enrolled in any of this teacher's sessions.
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "CONFIRMED",
      session: { teacherId: profile.id, status: { not: "CANCELLED" } },
    },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          subjects: { select: { name: true } },
        },
      },
      session: {
        select: { id: true, subject: { select: { name: true } } },
      },
    },
  });

  // Deduplicate by studentId, collect list of subjects they take with this teacher.
  type Agg = {
    id: string;
    name: string;
    email: string;
    level: string;
    allSubjects: Set<string>;
    teacherSubjects: Set<string>;
    sessionCount: number;
    present: number;
    absent: number;
    late: number;
    pending: number;
  };
  const byId = new Map<string, Agg>();
  for (const e of enrollments) {
    const sid = e.studentId;
    if (!byId.has(sid)) {
      byId.set(sid, {
        id: sid,
        name: e.student.user.name,
        email: e.student.user.email,
        level: e.student.level,
        allSubjects: new Set(e.student.subjects.map((s) => s.name)),
        teacherSubjects: new Set([e.session.subject.name]),
        sessionCount: 0,
        present: 0,
        absent: 0,
        late: 0,
        pending: 0,
      });
    }
    const a = byId.get(sid)!;
    a.teacherSubjects.add(e.session.subject.name);
    a.sessionCount += 1;
    if (e.attendance === "PRESENT") a.present += 1;
    else if (e.attendance === "ABSENT") a.absent += 1;
    else if (e.attendance === "LATE") a.late += 1;
    else a.pending += 1;
  }

  const students = [...byId.values()]
    .filter((s) => !query || s.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mes élèves</h1>
        <p className="text-sm text-zinc-500">
          Tous les élèves inscrits dans tes séances ({students.length}).
        </p>
      </header>

      <form className="mb-4 flex gap-2">
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
            href="/dashboard/teacher/students"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            Effacer
          </a>
        )}
      </form>

      {students.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {query ? `Aucun résultat pour « ${query} ».` : "Aucun élève inscrit."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {students.map((s) => {
            const marked = s.present + s.absent + s.late;
            const attendanceRate =
              marked > 0
                ? Math.round(((s.present + s.late) / marked) * 100)
                : null;
            return (
              <li key={s.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-zinc-500">
                      {s.email} · {LEVEL_LABELS[s.level] ?? s.level} ·{" "}
                      {s.sessionCount} séance(s)
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Matière(s) avec toi : {[...s.teacherSubjects].join(", ")}
                    </div>
                  </div>
                  <div className="text-xs text-right shrink-0">
                    {attendanceRate !== null ? (
                      <>
                        <div
                          className={`font-semibold ${attendanceRate >= 85 ? "text-green-600" : attendanceRate >= 60 ? "text-amber-600" : "text-red-600"}`}
                        >
                          {attendanceRate}% présent
                        </div>
                        <div className="text-zinc-500">
                          {s.present}P · {s.late}R · {s.absent}A
                          {s.pending > 0 ? ` · ${s.pending} à saisir` : ""}
                        </div>
                      </>
                    ) : (
                      <span className="text-zinc-400">
                        {s.pending > 0
                          ? `${s.pending} à saisir`
                          : "Pas de données"}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
