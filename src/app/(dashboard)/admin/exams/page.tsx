import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  deleteExamDate,
  toggleExamProtocol,
} from "@/server/actions/admin/exams";
import {
  daysUntil,
  examUrgency,
  humanDaysUntil,
} from "@/server/domain/wellbeing/examCountdown";
import { CreateExamForm } from "./CreateExamForm";

const LEVEL_LABELS: Record<string, string> = {
  GRADE_9: "3ème",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Terminale",
};

const URGENCY_BADGE: Record<string, string> = {
  past: "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  imminent:
    "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300",
  soon: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300",
  upcoming:
    "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300",
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function AdminExamsPage() {
  await requireRole("ADMIN");

  const [exams, students, subjects] = await Promise.all([
    prisma.examDate.findMany({
      orderBy: { date: "asc" },
      include: {
        student: {
          include: { user: { select: { name: true } } },
        },
        subject: { select: { name: true } },
      },
    }),
    prisma.studentProfile.findMany({
      orderBy: { user: { name: "asc" } },
      include: { user: { select: { name: true } } },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  const studentOptions = students.map((s) => ({
    id: s.id,
    userName: s.user.name,
    level: LEVEL_LABELS[s.level] ?? s.level,
  }));

  return (
    <section>
      <AdminPageHeader
        title="Examens"
        description="Dates d'examens par élève et matière — pour le compte à rebours et les protocoles anti-stress."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouvel examen</h2>
          {studentOptions.length === 0 || subjects.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Crée d&apos;abord au moins un élève et une matière.
            </p>
          ) : (
            <CreateExamForm
              students={studentOptions}
              subjects={subjects}
            />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">
            À venir & récents ({exams.length})
          </h2>
          {exams.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun examen enregistré.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {exams.map((e) => {
                const days = daysUntil(e.date);
                const urgency = examUrgency(days);
                return (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {e.student.user.name}
                          </span>
                          <span className="text-xs text-zinc-500">
                            · {e.subject.name}
                          </span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[urgency] ?? ""}`}
                          >
                            {humanDaysUntil(days)}
                          </span>
                          {e.protocolActivated ? (
                            <span className="inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                              Protocole actif
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {DATE_FMT.format(e.date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <form action={toggleExamProtocol}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                          >
                            {e.protocolActivated
                              ? "Désactiver protocole"
                              : "Activer protocole"}
                          </button>
                        </form>
                        <form action={deleteExamDate}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:underline"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </div>
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
