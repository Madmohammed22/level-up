// Headline stat tile — pure presentation.

export function KpiCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string | number;
  hint?: string;
  accent?: "green" | "amber" | "red" | "zinc";
}) {
  const accentClass =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : accent === "red"
          ? "text-red-600 dark:text-red-400"
          : "";
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <div className={`mt-2 text-3xl font-semibold ${accentClass}`}>
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
    </div>
  );
}
