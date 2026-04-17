"use client";

export function ProgressRing({
  value,
  size = 46,
  strokeWidth = 4,
  color = "var(--color-green-500)",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(1, Math.max(0, value));

  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        className="text-zinc-200 dark:text-zinc-700"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 3}
        textAnchor="middle"
        fontSize="10"
        fontWeight={600}
        fill="currentColor"
        className="tabular-nums"
      >
        {Math.round(value * 100)}
      </text>
    </svg>
  );
}
