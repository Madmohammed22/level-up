import Link from "next/link";
import {
  daysUntil,
  examUrgency,
  humanDaysUntil,
} from "@/server/domain/wellbeing/examCountdown";

export type ExamCountdownItem = {
  id: string;
  subjectName: string;
  date: Date;
  protocolActivated: boolean;
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const URGENCY_RING: Record<string, string> = {
  imminent: "ring-red-500/60",
  soon: "ring-amber-500/60",
  upcoming: "ring-blue-500/50",
  past: "ring-zinc-400/40",
};

const URGENCY_ACCENT: Record<string, string> = {
  imminent: "text-red-600 dark:text-red-400",
  soon: "text-amber-600 dark:text-amber-400",
  upcoming: "text-blue-600 dark:text-blue-400",
  past: "text-zinc-500",
};

export function ExamCountdown({ exams }: { exams: ExamCountdownItem[] }) {
  const upcoming = exams
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((e) => e.days >= 0)
    .sort((a, b) => a.days - b.days);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="font-medium">Prochain examen</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Aucune date d&apos;examen programmée. Ton admin peut en ajouter une.
        </p>
      </div>
    );
  }

  const next = upcoming[0]!;
  const rest = upcoming.slice(1, 3);
  const urgency = examUrgency(next.days);

  return (
    <div
      className={`rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 ring-2 ${URGENCY_RING[urgency] ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium">Prochain examen</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{next.subjectName}</p>
        </div>
        <div className="text-right">
          <div
            className={`text-2xl font-semibold leading-none ${URGENCY_ACCENT[urgency]}`}
          >
            {next.days === 0 ? "J" : `J-${next.days}`}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {humanDaysUntil(next.days)}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-zinc-500">{DATE_FMT.format(next.date)}</p>

      {urgency === "imminent" || next.protocolActivated ? (
        <Link
          href="/student/methodology?category=EXAM_PREP"
          className="mt-4 inline-block rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium"
        >
          Activer le protocole anti-stress
        </Link>
      ) : (
        <Link
          href="/student/methodology?category=EXAM_PREP"
          className="mt-4 inline-block text-xs text-blue-600 hover:underline"
        >
          Préparer cet examen →
        </Link>
      )}

      {rest.length > 0 ? (
        <ul className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
          {rest.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-zinc-700 dark:text-zinc-300">
                {e.subjectName}
              </span>
              <span className="text-zinc-500">{humanDaysUntil(e.days)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
