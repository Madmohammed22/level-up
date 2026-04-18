"use client";

type DayAccuracy = { dayOffset: number; accuracy: number | null };

type SubjectLine = {
  id: string;
  hue: number;
  days: DayAccuracy[];
};

function dayLabel(dayOffset: number, totalDays: number) {
  const d = new Date();
  d.setDate(d.getDate() - (totalDays - 1 - dayOffset));
  if (dayOffset === totalDays - 1) return "AUJ";
  const days = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  return days[d.getDay()];
}

export function AccuracyTrend({
  subjects,
  days = 14,
  focusedSubjectId = null,
}: {
  subjects: SubjectLine[];
  days?: number;
  focusedSubjectId?: string | null;
}) {
  const W = 780;
  const H = 280;
  const padL = 44;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  // Auto-scale Y axis based on actual data
  const allValues = subjects.flatMap((s) =>
    s.days.filter((d) => d.accuracy !== null).map((d) => d.accuracy!),
  );
  const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const dataMax = allValues.length > 0 ? Math.max(...allValues) : 1;

  // Y range: at least 0-100%, clamp nicely
  const yMin = Math.max(0, Math.floor(dataMin * 10 - 1) / 10); // e.g. 0.4 → 0.3
  const yMax = 1.0;
  const yRange = yMax - yMin || 0.5;

  const yFor = (v: number) => padT + ih - ((v - yMin) / yRange) * ih;
  const xFor = (i: number) => padL + (i / (days - 1)) * iw;

  // Y grid lines
  const gridStep = yRange <= 0.3 ? 0.05 : yRange <= 0.5 ? 0.1 : 0.2;
  const yGrid: number[] = [];
  for (let v = Math.ceil(yMin / gridStep) * gridStep; v <= yMax; v += gridStep) {
    yGrid.push(Math.round(v * 100) / 100);
  }

  // X-axis: show label every 2 days for 14-day view
  const xLabels: number[] = [];
  const step = days <= 7 ? 1 : days <= 14 ? 2 : 7;
  for (let i = 0; i < days; i += step) xLabels.push(i);
  if (!xLabels.includes(days - 1)) xLabels.push(days - 1);

  // Check if we have any data at all
  const hasData = allValues.length > 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full h-auto"
      style={{ minHeight: 180 }}
    >
      {/* Grid lines */}
      {yGrid.map((g, i) => (
        <g key={i}>
          <line
            x1={padL} x2={W - padR} y1={yFor(g)} y2={yFor(g)}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth="0.8"
            strokeDasharray={g === 1.0 ? "0" : "3 4"}
          />
          <text
            x={padL - 10} y={yFor(g) + 4}
            textAnchor="end" fontSize="11"
            className="fill-zinc-400 font-mono"
          >
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}

      {/* 80% target line */}
      <line
        x1={padL} x2={W - padR} y1={yFor(0.8)} y2={yFor(0.8)}
        stroke="#22c55e" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.5"
      />
      <rect
        x={W - padR - 62} y={yFor(0.8) - 14}
        width={58} height={16} rx={4}
        fill="#dcfce7" opacity="0.8"
      />
      <text
        x={W - padR - 33} y={yFor(0.8) - 3}
        textAnchor="middle" fontSize="9" fill="#15803d"
        className="font-mono" fontWeight={600}
      >
        CIBLE 80%
      </text>

      {/* Vertical day markers */}
      {xLabels.map((i) => (
        <line
          key={`vline-${i}`}
          x1={xFor(i)} x2={xFor(i)}
          y1={padT} y2={padT + ih}
          className="stroke-zinc-100 dark:stroke-zinc-800"
          strokeWidth="0.5"
        />
      ))}

      {/* No data message */}
      {!hasData && (
        <text
          x={W / 2} y={H / 2}
          textAnchor="middle" fontSize="13"
          className="fill-zinc-400"
        >
          Pas encore de données — révise des cartes pour voir ta progression
        </text>
      )}

      {/* Data lines */}
      {subjects.map(({ id, hue, days: dayData }) => {
        const pts = dayData.filter((d) => d.accuracy !== null);
        if (pts.length === 0) return null;

        const focused =
          focusedSubjectId === null || focusedSubjectId === id;
        const color = `oklch(0.55 0.14 ${hue})`;
        const lightColor = `oklch(0.85 0.08 ${hue})`;

        // Single point — show dot only
        if (pts.length === 1) {
          const p = pts[0];
          return (
            <g key={id} opacity={focused ? 1 : 0.2}>
              <circle
                cx={xFor(p.dayOffset)} cy={yFor(p.accuracy!)}
                r={focused ? 5 : 3}
                fill={color}
              />
              {focused && (
                <text
                  x={xFor(p.dayOffset)} y={yFor(p.accuracy!) - 10}
                  textAnchor="middle" fontSize="11" fontWeight={600}
                  fill={color}
                >
                  {Math.round(p.accuracy! * 100)}%
                </text>
              )}
            </g>
          );
        }

        // Multiple points — draw line + fill + dots
        const pathD = pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"}${xFor(p.dayOffset)},${yFor(p.accuracy!)}`,
          )
          .join(" ");

        // Area fill under line
        const firstPt = pts[0];
        const lastPt = pts[pts.length - 1];
        const areaD = `${pathD} L${xFor(lastPt.dayOffset)},${yFor(yMin)} L${xFor(firstPt.dayOffset)},${yFor(yMin)} Z`;

        return (
          <g key={id} opacity={focused ? 1 : 0.12}>
            {/* Fill area */}
            {focused && (
              <path d={areaD} fill={lightColor} opacity="0.3" />
            )}
            {/* Line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={focused ? 2.2 : 1.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Dots with value labels */}
            {focused &&
              pts.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={xFor(p.dayOffset)} cy={yFor(p.accuracy!)}
                    r="4"
                    fill="white" stroke={color} strokeWidth="2"
                  />
                  <text
                    x={xFor(p.dayOffset)}
                    y={yFor(p.accuracy!) - 10}
                    textAnchor="middle" fontSize="10" fontWeight={600}
                    fill={color} className="tabular-nums"
                  >
                    {Math.round(p.accuracy! * 100)}%
                  </text>
                </g>
              ))}
          </g>
        );
      })}

      {/* X-axis labels */}
      {xLabels.map((i) => (
        <text
          key={i}
          x={xFor(i)} y={H - 12}
          textAnchor="middle" fontSize="10"
          className="fill-zinc-400 font-mono"
          fontWeight={i === days - 1 ? 600 : 400}
        >
          {dayLabel(i, days)}
        </text>
      ))}
    </svg>
  );
}
