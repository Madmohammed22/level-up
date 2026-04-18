import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { getSrsOverview, getSrsReviewHistory, getSrsDueHistogram } from "@/server/actions/student/srs";
import { KpiCard } from "@/components/admin/analytics/KpiCard";
import { MasteryBar } from "@/components/student/srs/MasteryBar";
import { ProgressRing } from "@/components/student/srs/ProgressRing";
import { TodaySessionRing } from "@/components/student/srs/TodaySessionRing";
import { DueHistogram } from "@/components/student/srs/DueHistogram";
import { AccuracyTrend } from "@/components/student/srs/AccuracyTrend";
import { SrsDashboardClient, DeleteSubjectButton } from "./SrsDashboardClient";

export default async function SrsRevisionsPage() {
  const user = await requireRole("STUDENT");

  let subjects: Awaited<ReturnType<typeof getSrsOverview>>;
  try {
    subjects = await getSrsOverview();
  } catch {
    subjects = [];
  }

  // Review history for accuracy chart
  let reviewHistory: Awaited<ReturnType<typeof getSrsReviewHistory>> = [];
  try {
    reviewHistory = await getSrsReviewHistory();
  } catch {
    // no reviews yet
  }

  const dueToday = subjects.reduce((a, s) => a + s.due, 0);
  const totalCards = subjects.reduce((a, s) => a + s.cardCount, 0);
  const avgRetention =
    subjects.length > 0
      ? Math.round(
          (subjects.reduce((a, s) => a + s.retention, 0) / subjects.length) *
            100,
        )
      : 0;

  // Build accuracy trend data from reviews (last 30 days)
  const now = new Date();
  const accuracyBySubject = subjects.map((s) => {
    const days: { dayOffset: number; accuracy: number | null }[] = [];
    for (let i = 0; i < 14; i++) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - (13 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayReviews = reviewHistory.filter(
        (r) =>
          r.card.subjectId === s.id &&
          new Date(r.createdAt) >= dayStart &&
          new Date(r.createdAt) < dayEnd,
      );

      if (dayReviews.length === 0) {
        days.push({ dayOffset: i, accuracy: null });
      } else {
        const correct = dayReviews.filter((r) => r.correct).length;
        days.push({ dayOffset: i, accuracy: correct / dayReviews.length });
      }
    }
    return { id: s.id, hue: s.hue, days };
  });

  // Build due histogram data from real card nextReviewAt dates
  let histogramSubjects: { id: string; name: string; hue: number; dueCounts: number[] }[] = [];
  try {
    histogramSubjects = await getSrsDueHistogram(14);
  } catch {
    // fallback: empty
    histogramSubjects = subjects.map((s) => ({
      id: s.id, name: s.name, hue: s.hue,
      dueCounts: [s.due, ...Array(13).fill(0)],
    }));
  }

  const hasSubjects = subjects.length > 0;

  return (
    <section className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Révisions espacées
          </h1>
          <p className="text-sm text-zinc-500">
            {dueToday} cartes à réviser aujourd&apos;hui · {totalCards} au total
          </p>
        </div>
        <div className="flex gap-2">
          {hasSubjects && <SrsDashboardClient showCreateButton />}
          {hasSubjects && dueToday > 0 && (
            <SrsDashboardClient
              showReviewDropdown
              subjects={subjects.map((s) => ({
                id: s.id,
                name: s.name,
                hue: s.hue,
                due: s.due,
              }))}
            />
          )}
        </div>
      </header>

      {!hasSubjects ? (
        <SrsDashboardClient showCreateSubject />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              title="À réviser aujourd'hui"
              value={dueToday}
              hint="Cartes en attente"
              accent={dueToday > 0 ? "amber" : "green"}
            />
            <KpiCard
              title="Rétention globale"
              value={avgRetention > 0 ? `${avgRetention}%` : "—"}
              hint="Estimation mémoire"
              accent={avgRetention >= 80 ? "green" : avgRetention >= 60 ? "amber" : "red"}
            />
            <KpiCard
              title="Cartes totales"
              value={totalCards}
              hint={`${subjects.length} matières`}
            />
            <KpiCard
              title="Maîtrisées"
              value={subjects.reduce((a, s) => a + s.mastered, 0)}
              hint={`${totalCards > 0 ? Math.round((subjects.reduce((a, s) => a + s.mastered, 0) / totalCards) * 100) : 0}%`}
              accent="green"
            />
          </div>

          {/* Main grid: Session ring + histogram */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Session du jour */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col">
              <div className="mb-2">
                <h2 className="text-sm font-semibold">Session du jour</h2>
                <p className="text-xs text-zinc-500">Cartes à réviser par matière</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <TodaySessionRing
                  subjects={subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    hue: s.hue,
                    due: s.due,
                  }))}
                  dueToday={dueToday}
                />
              </div>
              {dueToday > 0 && (
                <Link
                  href="/dashboard/student/revisions/session"
                  className="block text-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 text-sm font-medium mt-3"
                >
                  Commencer
                </Link>
              )}
            </div>

            {/* Due Histogram */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">Cartes à venir · par jour</h2>
                <p className="text-xs text-zinc-500">
                  Prochains 14 jours · données réelles
                </p>
              </div>
              <div className="flex-1 flex items-end">
                <DueHistogram subjects={histogramSubjects} days={14} />
              </div>
            </div>
          </div>

          {/* Accuracy trend */}
          {reviewHistory.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="mb-3">
                <h2 className="text-sm font-semibold">Précision · 14 jours</h2>
                <p className="text-xs text-zinc-500">Cible : 80% de bonnes réponses</p>
              </div>
              <AccuracyTrend subjects={accuracyBySubject} days={14} />
            </div>
          )}
          {/* Subjects table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Toutes les matières</h2>
                <p className="text-xs text-zinc-500">
                  {subjects.length} matières · {totalCards} cartes au total
                </p>
              </div>
            </div>

            {/* Header row */}
            <div className="hidden md:grid grid-cols-5 gap-3 text-[11px] uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>Matière</div>
              <div>Progression</div>
              <div>Rétention</div>
              <div>Cartes</div>
              <div className="text-center">À réviser</div>
            </div>

            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/student/revisions/${s.id}`}
                className="group relative grid grid-cols-1 md:grid-cols-5 gap-3 items-center py-3 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-lg px-2 -mx-2 transition-colors"
              >
                {/* Subject name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[11px] font-semibold font-mono"
                    style={{
                      background: `oklch(0.92 0.05 ${s.hue})`,
                      color: `oklch(0.3 0.15 ${s.hue})`,
                    }}
                  >
                    {s.code.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{s.name}</div>
                    {s.description && (
                      <div className="text-xs text-zinc-500 truncate">
                        {s.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Mastery bar */}
                <div>
                  <MasteryBar
                    mastered={s.mastered}
                    learning={s.learning}
                    due={s.due}
                    newCards={s.newCards}
                    total={s.cardCount}
                    width={140}
                  />
                  <div className="text-xs text-zinc-500 mt-1 tabular-nums">
                    {s.mastered}/{s.cardCount} maîtrisées
                  </div>
                </div>

                {/* Retention */}
                <div className="flex items-center gap-2">
                  <ProgressRing
                    value={s.retention}
                    size={36}
                    strokeWidth={3}
                    color={`oklch(0.6 0.14 ${s.hue})`}
                  />
                  <span className="text-sm font-semibold tabular-nums">
                    {Math.round(s.retention * 100)}%
                  </span>
                </div>

                {/* Card counts */}
                <div className="text-xs text-zinc-500 tabular-nums">
                  {s.cardCount} total · {s.newCards} nouvelles
                </div>

                {/* Due */}
                <div className="text-center pr-6">
                  <span className="text-lg font-bold tabular-nums">{s.due}</span>
                  <div className="text-xs text-zinc-500">à réviser</div>
                </div>

                {/* 3-dot menu — absolute top-right */}
                <div className="absolute top-2 right-2">
                  <DeleteSubjectButton subjectId={s.id} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
