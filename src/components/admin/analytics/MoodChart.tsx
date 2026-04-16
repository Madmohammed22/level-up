"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function MoodChart({
  data,
}: {
  data: Array<{ date: string; average: number; count: number }>;
}) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        Aucun check-in récent.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    ...d,
    label: shortDate(d.date),
    // Only plot days that had data; recharts handles undefined by interpolating,
    // but we want explicit gaps. Using null renders as gap.
    average: d.count > 0 ? Number(d.average.toFixed(2)) : null,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} />
          <YAxis
            domain={[0, 5]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) =>
              v == null || typeof v !== "number" ? "—" : v.toFixed(1)
            }
          />
          <Area
            type="monotone"
            dataKey="average"
            name="Humeur moyenne"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#moodGradient)"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
