import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/requireRole";
import { getSrsSubjectDetail, getSrsReviewHistory } from "@/server/actions/student/srs";
import { KpiCard } from "@/components/admin/analytics/KpiCard";
import { ClozeCardPreview } from "@/components/student/srs/ClozeCardPreview";
import { AccuracyTrend } from "@/components/student/srs/AccuracyTrend";
import { SubjectDetailClient } from "./SubjectDetailClient";

export default async function SrsSubjectDetailPage({
  params,
}: {
  params: Promise<{ subjectId: string }>;
}) {
  await requireRole("STUDENT");
  const { subjectId } = await params;

  const subject = await getSrsSubjectDetail(subjectId);
  if (!subject) notFound();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const cards = subject.cards;
  const total = cards.length;
  const mastered = cards.filter((c) => c.state === "REVIEW" && c.interval >= 21).length;
  const learning = cards.filter((c) => c.state === "LEARNING").length;
  const newCards = cards.filter((c) => c.state === "NEW").length;
  const due = cards.filter(
    (c) => (c.nextReviewAt && c.nextReviewAt <= now) || c.state === "NEW",
  ).length;

  // Retention estimate
  const stabilities = cards.filter((c) => c.stability > 0).map((c) => c.stability);
  const avgStability =
    stabilities.length > 0
      ? stabilities.reduce((a, b) => a + b, 0) / stabilities.length
      : 0;
  const retention = avgStability > 0 ? Math.round(Math.exp(-1 / avgStability) * 100) : 0;

  // Review history for accuracy chart
  let reviewHistory: Awaited<ReturnType<typeof getSrsReviewHistory>> = [];
  try {
    reviewHistory = await getSrsReviewHistory(subjectId);
  } catch {
    // no reviews yet
  }

  const accuracyData = (() => {
    const days: { dayOffset: number; accuracy: number | null }[] = [];
    const nowDate = new Date();
    for (let i = 0; i < 14; i++) {
      const dayStart = new Date(nowDate);
      dayStart.setDate(dayStart.getDate() - (13 - i));
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayReviews = reviewHistory.filter(
        (r) =>
          new Date(r.createdAt) >= dayStart && new Date(r.createdAt) < dayEnd,
      );

      if (dayReviews.length === 0) {
        days.push({ dayOffset: i, accuracy: null });
      } else {
        const correct = dayReviews.filter((r) => r.correct).length;
        days.push({ dayOffset: i, accuracy: correct / dayReviews.length });
      }
    }
    return [{ id: subject.id, hue: subject.hue, days }];
  })();

  // Interval distribution
  const buckets = [
    { label: "1j", min: 0, max: 1 },
    { label: "2-6j", min: 2, max: 6 },
    { label: "7-14j", min: 7, max: 14 },
    { label: "15-30j", min: 15, max: 30 },
    { label: "30j+", min: 31, max: 9999 },
  ];
  const bucketCounts = buckets.map(
    (b) =>
      cards.filter((c) => c.interval >= b.min && c.interval <= b.max).length,
  );

  return (
    <section className="space-y-6">
      {/* Breadcrumb + header */}
      <header>
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
          <Link
            href="/dashboard/student/revisions"
            className="hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← Révisions
          </Link>
          <span>/</span>
          <span className="text-zinc-700 dark:text-zinc-200">
            {subject.name}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold font-mono"
              style={{
                background: `oklch(0.92 0.05 ${subject.hue})`,
                color: `oklch(0.3 0.15 ${subject.hue})`,
              }}
            >
              {subject.code}
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {subject.name}
              </h1>
              {subject.description && (
                <p className="text-sm text-zinc-500">{subject.description}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <SubjectDetailClient subjectId={subject.id} showCreateCardButton />
            <SubjectDetailClient subjectId={subject.id} showReviewOptions totalCards={total} dueCards={due} />
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Cartes au total" value={total} hint={`${newCards} nouvelles`} />
        <KpiCard
          title="Maîtrisées"
          value={total > 0 ? `${Math.round((mastered / total) * 100)}%` : "—"}
          hint={`${mastered}/${total}`}
          accent="green"
        />
        <KpiCard
          title="Rétention"
          value={retention > 0 ? `${retention}%` : "—"}
          hint={avgStability > 0 ? `stabilité ~${Math.round(avgStability)}j` : undefined}
          accent={retention >= 80 ? "green" : retention >= 60 ? "amber" : "red"}
        />
        <KpiCard
          title="En apprentissage"
          value={learning}
          hint={`${due} à réviser auj.`}
          accent={due > 0 ? "amber" : undefined}
        />
      </div>

      {/* Interval distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold mb-1">Distribution des intervalles</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Répartition des cartes par intervalle actuel
          </p>
          <div className="flex items-end gap-3" style={{ height: 160 }}>
            {buckets.map((b, i) => {
              const max = Math.max(1, ...bucketCounts);
              const barHeight = Math.max(6, (bucketCounts[i] / max) * 120);
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center justify-end" style={{ height: "100%" }}>
                  <span className="text-xs font-semibold tabular-nums mb-1">
                    {bucketCounts[i]}
                  </span>
                  <div
                    className="w-full max-w-[48px] rounded-t-md"
                    style={{
                      height: barHeight,
                      background: `oklch(0.75 0.12 ${subject.hue})`,
                    }}
                  />
                  <span className="text-[10px] text-zinc-400 font-mono mt-2">
                    {b.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats summary */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h2 className="text-sm font-semibold mb-1">Répartition des cartes</h2>
          <p className="text-xs text-zinc-500 mb-4">Par état actuel</p>
          <div className="space-y-3">
            {[
              { label: "Maîtrisées", count: mastered, color: "#22c55e" },
              { label: "En apprentissage", count: learning, color: "#eab308" },
              { label: "À réviser", count: due, color: "#f97316" },
              { label: "Nouvelles", count: newCards, color: "#d1d5db" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accuracy trend */}
      {reviewHistory.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Précision · 14 jours</h2>
            <p className="text-xs text-zinc-500">
              Évolution des bonnes réponses sur {subject.name}
            </p>
          </div>
          <AccuracyTrend
            subjects={accuracyData}
            days={14}
            focusedSubjectId={subject.id}
          />
        </div>
      )}

      {/* Cards gallery */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Cartes à trous</h2>
            <p className="text-xs text-zinc-500">{cards.length} cartes</p>
          </div>
          <div className="flex items-center gap-2">
            <SubjectDetailClient subjectId={subject.id} showCreateCardButton />
            <SubjectDetailClient subjectId={subject.id} showReviewOptions totalCards={total} dueCards={due} />
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-zinc-500 mb-3">
              Aucune carte. Ajoute ta première carte à trous.
            </p>
            <SubjectDetailClient subjectId={subject.id} showCreateCardInline />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cards.map((card) => (
              <ClozeCardPreview
                key={card.id}
                card={{
                  id: card.id,
                  text: card.text,
                  tag: card.tag,
                  state: card.state,
                  interval: card.interval,
                  stability: card.stability,
                  nextReviewAt: card.nextReviewAt,
                }}
                hue={subject.hue}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
