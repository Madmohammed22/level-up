"use client";

export function MasteryBar({
  mastered,
  learning,
  due,
  newCards,
  total,
  width = 180,
}: {
  mastered: number;
  learning: number;
  due: number;
  newCards: number;
  total: number;
  width?: number;
}) {
  if (total === 0) return null;

  const segs = [
    { v: mastered, color: "#22c55e" },
    { v: learning, color: "#eab308" },
    { v: due, color: "#f97316" },
    { v: newCards, color: "#d1d5db" },
  ];

  let x = 0;
  return (
    <svg viewBox={`0 0 ${width} 8`} width={width} height={8}>
      <rect width={width} height={8} rx={4} className="fill-zinc-100 dark:fill-zinc-800" />
      <clipPath id={`mastery-clip-${total}-${mastered}`}>
        <rect width={width} height={8} rx={4} />
      </clipPath>
      <g clipPath={`url(#mastery-clip-${total}-${mastered})`}>
        {segs.map((s, i) => {
          const w = (s.v / total) * width;
          const el = (
            <rect key={i} x={x} y={0} width={w} height={8} fill={s.color} />
          );
          x += w;
          return el;
        })}
      </g>
    </svg>
  );
}
