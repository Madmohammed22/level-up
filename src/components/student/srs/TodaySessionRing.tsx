"use client";

type SubjectDue = { id: string; name: string; hue: number; due: number };

export function TodaySessionRing({
  subjects,
  dueToday,
}: {
  subjects: SubjectDue[];
  dueToday: number;
}) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 78;
  const c = 2 * Math.PI * r;
  const total = subjects.reduce((a, s) => a + s.due, 0) || 1;

  let angle = -Math.PI / 2;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <svg width={size} height={size}>
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          className="stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth="8"
        />
        {subjects.map((s) => {
          const frac = s.due / total;
          const len = frac * c;
          const startOffset = angle;
          angle += frac * 2 * Math.PI;
          const offsetFromTop = ((startOffset + Math.PI / 2) / (2 * Math.PI)) * c;
          return (
            <circle
              key={s.id}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={`oklch(0.7 0.13 ${s.hue})`}
              strokeWidth="8"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offsetFromTop}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={50} fill="#d1fae5" opacity="0.6" />
        <circle cx={cx} cy={cy} r={50} fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
        <text
          x={cx} y={cy - 4}
          textAnchor="middle" fontSize="32" fontWeight={700}
          className="tabular-nums fill-zinc-900 dark:fill-zinc-100"
        >
          {dueToday}
        </text>
        <text
          x={cx} y={cy + 16}
          textAnchor="middle" fontSize="11"
          className="fill-zinc-400"
        >
          cartes
        </text>
      </svg>

      <div className="flex flex-wrap gap-3 justify-center text-xs text-zinc-500">
        {subjects
          .filter((s) => s.due > 0)
          .map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: `oklch(0.7 0.13 ${s.hue})` }}
              />
              {s.name}{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                {s.due}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
