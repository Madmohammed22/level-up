import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import {
  daysUntil,
  examUrgency,
  humanDaysUntil,
} from "@/server/domain/wellbeing/examCountdown";
import { deleteStudentExam } from "@/server/actions/student/exams";
import { AddExamForm } from "./AddExamForm";

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

export default async function StudentExamsPage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      subjects: { select: { id: true, name: true }, orderBy: { name: "asc" } },
    },
  });

  if (!profile) {
    return (
      <section>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Mes examens
        </h1>
        <p className="text-sm text-zinc-500">
          Profil élève introuvable. Contacte un administrateur.
        </p>
      </section>
    );
  }

  const exams = await prisma.examDate.findMany({
    where: { studentId: profile.id },
    orderBy: { date: "asc" },
    include: { subject: { select: { name: true } } },
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mes examens</h1>
        <p className="text-sm text-zinc-500">
          Ajoute tes dates d&apos;examen pour activer le compte à rebours et les
          protocoles anti-stress.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Ajouter un examen</h2>
          <AddExamForm subjects={profile.subjects} />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">
            Mes examens ({exams.length})
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
                          <span className="font-medium">{e.subject.name}</span>
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[urgency] ?? ""}`}
                          >
                            {humanDaysUntil(days)}
                          </span>
                          {e.protocolActivated && (
                            <span className="inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                              Protocole actif
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {DATE_FMT.format(e.date)}
                        </div>
                      </div>
                      <form action={deleteStudentExam} className="shrink-0">
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
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
