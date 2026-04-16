import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { MoodForm } from "./MoodForm";

const EMOJI: Record<number, string> = {
  1: "😞",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function fmt(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export default async function StudentMoodPage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const recent = profile
    ? await prisma.moodCheckIn.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 7,
      })
    : [];

  const avg =
    recent.length > 0
      ? (
          recent.reduce((a, m) => a + m.score, 0) / recent.length
        ).toFixed(1)
      : "—";

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Comment tu te sens ?
        </h1>
        <p className="text-sm text-zinc-500">
          Un petit check-in quotidien. Ça aide à prendre du recul.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Aujourd&apos;hui</h2>
          <MoodForm />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">7 derniers check-ins</h2>
            <span className="text-xs text-zinc-500">
              Moyenne&nbsp;: <span className="font-medium">{avg}</span>/5
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aucun check-in pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {recent.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-2xl leading-none">
                    {EMOJI[m.score]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs text-zinc-500">
                      {fmt(m.createdAt)} · {m.score}/5
                    </div>
                    {m.note ? (
                      <div className="text-sm mt-0.5">{m.note}</div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
