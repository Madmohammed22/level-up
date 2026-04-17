"use client";

import { useState } from "react";

type SubjectDue = {
  id: string;
  name: string;
  hue: number;
  dueCounts: number[]; // due count per day
};

function dayLabel(i: number) {
  const d = new Date();
  d.setDate(d.getDate() + i);
  if (i === 0) return "AUJ";
  if (i === 1) return "DEM";
  return ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"][d.getDay()];
}

export function DueHistogram({
  subjects,
  days = 14,
}: {
  subjects: SubjectDue[];
  days?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const W = 780;
  const H = 220;
  const padL = 36;
  const padR = 12;
  const padT = 20;
  const padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  // Compute totals per day
  const totals: number[] = [];
  for (let i = 0; i < days; i++) {
    let t = 0;
    for (const s of subjects) t += s.dueCounts[i] ?? 0;
    totals.push(t);
  }

  const max = Math.max(10, ...totals);
  const niceMax = Math.ceil(max / 10) * 10;
  const bw = iw / days;
  const barW = Math.max(8, bw * 0.62);
  const barX = (i: number) => padL + i * bw + (bw - barW) / 2;
  const yFor = (v: number) => padT + ih - (v / niceMax) * ih;

  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block">
      {grid.map((g, i) => (
        <g key={i}>
          <line
            x1={padL} x2={W - padR} y1={yFor(g)} y2={yFor(g)}
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth="1"
            strokeDasharray={i === 0 ? "0" : "2 3"}
          />
          <text
            x={padL - 8} y={yFor(g) + 3}
            textAnchor="end" fontSize="10"
            className="fill-zinc-400 font-mono"
          >
            {Math.round(g)}
          </text>
        </g>
      ))}

      {Array.from({ length: days }).map((_, i) => {
        let yC = padT + ih;
        const segs = subjects.map((s) => {
          const v = s.dueCounts[i] ?? 0;
          const h = (v / niceMax) * ih;
          yC -= h;
          return { s, v, y: yC, h };
        });

        const total = totals[i];
        const isHover = hover === i;
        const isToday = i === 0;

        return (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="cursor-pointer"
          >
            {segs.map((seg, j) =>
              seg.h > 0.5 ? (
                <rect
                  key={j}
                  x={barX(i)} y={seg.y} width={barW} height={seg.h}
                  fill={`oklch(0.72 0.12 ${seg.s.hue})`}
                  stroke={isToday ? "currentColor" : "none"}
                  strokeWidth={isToday ? 1.25 : 0}
                  opacity={isHover || hover === null ? 1 : 0.55}
                />
              ) : null,
            )}
            <text
              x={barX(i) + barW / 2} y={H - 10}
              textAnchor="middle" fontSize="10"
              className={`font-mono ${isToday ? "fill-zinc-900 dark:fill-zinc-100 font-semibold" : "fill-zinc-400"}`}
            >
              {dayLabel(i)}
            </text>
            {isHover && total > 0 && (
              <text
                x={barX(i) + barW / 2} y={yC - 6}
                textAnchor="middle" fontSize="11"
                className="fill-zinc-900 dark:fill-zinc-100 font-semibold tabular-nums"
              >
                {total}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
