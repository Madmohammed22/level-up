import Link from "next/link";
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

const URGENCY_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "imminent", label: "Imminent" },
  { value: "soon", label: "Bientôt" },
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passé" },
];

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; urgency?: string }>;
}) {
  await requireRole("ADMIN");
  const { q, urgency } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const urgencyFilter = urgency ?? "";

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

  // Filter exams
  const filtered = exams.filter((e) => {
    const days = daysUntil(e.date);
    const urg = examUrgency(days);
    if (urgencyFilter && urg !== urgencyFilter) return false;
    if (query) {
      const haystack = [
        e.student.user.name ?? "",
        e.subject.name,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const studentOptions = students.map((s) => ({
    id: s.id,
    userName: s.user.name,
    level: LEVEL_LABELS[s.level] ?? s.level,
  }));

  const hasFilters = query || urgencyFilter;

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
            À venir & récents ({filtered.length})
          </h2>

          {/* Search & filter */}
          <form className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
              </svg>
              <input
                name="q"
                type="text"
                defaultValue={q}
                placeholder="Élève, matière…"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent pl-10 pr-3 py-2 text-sm"
              />
            </div>
            <select
              name="urgency"
              defaultValue={urgencyFilter}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
            >
              {URGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
              </svg>
              Chercher
            </button>
            {hasFilters ? (
              <Link
                href="/dashboard/admin/exams"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Effacer
              </Link>
            ) : null}
          </form>

          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {exams.length === 0
                ? "Aucun examen enregistré."
                : "Aucun examen ne correspond aux filtres."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {filtered.map((e) => {
                const days = daysUntil(e.date);
                const urg = examUrgency(days);
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
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[urg] ?? ""}`}
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
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
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
