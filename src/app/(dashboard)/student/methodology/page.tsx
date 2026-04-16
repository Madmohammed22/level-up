import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { markContentDone, unmarkContentDone } from "@/server/actions/student/content";

const CATEGORY_LABELS: Record<string, string> = {
  STRESS: "Stress",
  METHODOLOGY: "Méthodologie",
  TIME_MANAGEMENT: "Gestion du temps",
  EXAM_PREP: "Préparation examen",
};

const TYPE_LABELS: Record<string, string> = {
  MICRO_LESSON: "Micro-leçon",
  EXERCISE: "Exercice",
  PROTOCOL: "Protocole",
  TEMPLATE: "Modèle",
};

const CATEGORIES = [
  "ALL",
  "STRESS",
  "METHODOLOGY",
  "TIME_MANAGEMENT",
  "EXAM_PREP",
] as const;

type Category = (typeof CATEGORIES)[number];

export default async function StudentMethodologyPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const user = await requireRole("STUDENT");
  const params = await searchParams;
  const active = (CATEGORIES as readonly string[]).includes(
    params.category ?? "",
  )
    ? (params.category as Category)
    : "ALL";

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const [items, completions] = await Promise.all([
    prisma.contentItem.findMany({
      where: {
        published: true,
        ...(active !== "ALL" ? { category: active } : {}),
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
    }),
    profile
      ? prisma.contentCompletion.findMany({
          where: { studentId: profile.id },
          select: { contentItemId: true },
        })
      : Promise.resolve([]),
  ]);

  const done = new Set(completions.map((c) => c.contentItemId));

  // --- Progress stats (all published items, not filtered) ---
  const allItems = active !== "ALL"
    ? await prisma.contentItem.findMany({
        where: { published: true },
        select: { id: true, category: true },
      })
    : items.map((i) => ({ id: i.id, category: i.category }));

  const totalAll = allItems.length;
  const doneAll = allItems.filter((i) => done.has(i.id)).length;
  const pct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // Per-category stats
  const catStats = (["STRESS", "METHODOLOGY", "TIME_MANAGEMENT", "EXAM_PREP"] as const).map((cat) => {
    const catItems = allItems.filter((i) => i.category === cat);
    const catDone = catItems.filter((i) => done.has(i.id)).length;
    return { cat, label: CATEGORY_LABELS[cat], total: catItems.length, done: catDone };
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Méthodologie & bien-être
        </h1>
        <p className="text-sm text-zinc-500">
          Des techniques courtes pour mieux réviser, gérer le stress et
          gagner en confiance.
        </p>
      </header>

      {/* Progress overview */}
      <div className="mb-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium">Progression</h2>
          <span className="text-sm font-medium">{doneAll}/{totalAll} ({pct}%)</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {catStats.map((s) => (
            <div key={s.cat} className="text-center">
              <div className="text-xs text-zinc-500">{s.label}</div>
              <div className="text-sm font-medium">
                {s.done}/{s.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((c) => {
          const label = c === "ALL" ? "Tout" : CATEGORY_LABELS[c];
          const current = c === active;
          return (
            <a
              key={c}
              href={c === "ALL" ? "/student/methodology" : `?category=${c}`}
              className={`rounded-full px-3 py-1 text-sm border ${
                current
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {label}
            </a>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun contenu disponible.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => {
            const completed = done.has(item.id);
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <span>{TYPE_LABELS[item.type]}</span>
                      {item.durationSec ? (
                        <span>· {Math.round(item.durationSec / 60)} min</span>
                      ) : null}
                    </div>
                    <h2 className="mt-1 font-semibold text-lg">{item.title}</h2>
                  </div>
                  {completed ? (
                    <span className="shrink-0 rounded-full bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                      Fait
                    </span>
                  ) : null}
                </div>

                <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {item.body}
                </p>

                <div className="mt-4">
                  {!completed ? (
                    <form action={markContentDone}>
                      <input
                        type="hidden"
                        name="contentItemId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        Marquer comme fait
                      </button>
                    </form>
                  ) : (
                    <form action={unmarkContentDone}>
                      <input
                        type="hidden"
                        name="contentItemId"
                        value={item.id}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-500 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        Annuler
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
