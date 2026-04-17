"use client";

type DayAccuracy = { dayOffset: number; accuracy: number | null };

type SubjectLine = {
  id: string;
  hue: number;
  days: DayAccuracy[];
};

export function AccuracyTrend({
  subjects,
  days = 30,
  focusedSubjectId = null,
}: {
  subjects: SubjectLine[];
  days?: number;
  focusedSubjectId?: string | null;
}) {
  const W = 780;
  const H = 220;
  const padL = 36;
  const padR = 12;
  const padT = 20;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const yFor = (v: number) => padT + ih - ((v - 0.4) / 0.6) * ih;
  const xFor = (i: number) => padL + (i / (days - 1)) * iw;
  const yGrid = [0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
      {yGrid.map((g, i) => (
        <g key={i}>
          <line
            x1={padL} x2={W - padR} y1={yFor(g)} y2={yFor(g)}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth="1"
            strokeDasharray={g === 1.0 ? "0" : "2 3"}
          />
          <text
            x={padL - 8} y={yFor(g) + 3}
            textAnchor="end" fontSize="10"
            className="fill-zinc-400 font-mono"
          >
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}

      {/* 80% target line */}
      <line
        x1={padL} x2={W - padR} y1={yFor(0.8)} y2={yFor(0.8)}
        stroke="#22c55e" strokeWidth="1" strokeDasharray="3 3" opacity="0.6"
      />
      <text
        x={W - padR} y={yFor(0.8) - 5}
        textAnchor="end" fontSize="9" fill="#15803d" className="font-mono"
      >
        CIBLE 80%
      </text>

      {subjects.map(({ id, hue, days: dayData }) => {
        const pts = dayData.filter((d) => d.accuracy !== null);
        if (pts.length < 2) return null;

        const focused =
          focusedSubjectId === null || focusedSubjectId === id;
        const d = pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"}${xFor(p.dayOffset)},${yFor(p.accuracy!)}`,
          )
          .join(" ");

        return (
          <g key={id} opacity={focused ? 1 : 0.15}>
            <path
              d={d}
              fill="none"
              stroke={`oklch(0.6 0.14 ${hue})`}
              strokeWidth={focused ? 1.6 : 1.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {focused &&
              pts.map((p, i) => (
                <circle
                  key={i}
                  cx={xFor(p.dayOffset)}
                  cy={yFor(p.accuracy!)}
                  r="1.8"
                  fill={`oklch(0.55 0.14 ${hue})`}
                />
              ))}
          </g>
        );
      })}

      {[0, Math.floor(days * 0.5), days - 1].map((i) => (
        <text
          key={i}
          x={xFor(i)} y={H - 10}
          textAnchor="middle" fontSize="10"
          className="fill-zinc-400 font-mono"
        >
          {i === days - 1 ? "AUJ" : `-${days - 1 - i}j`}
        </text>
      ))}
    </svg>
  );
}
