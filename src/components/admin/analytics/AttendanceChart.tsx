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

export function AttendanceChart({
  data,
}: {
  data: Array<{ date: string; rate: number; present: number; total: number }>;
}) {
  if (data.every((d) => d.total === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        Aucune donnée de présence récente.
      </div>
    );
  }
  const chartData = data.map((d) => ({
    ...d,
    label: shortDate(d.date),
    // Keep rate as number (0 for no-data days) so line stays continuous
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, _name: any, entry: any) => {
              const t = entry?.payload?.total ?? 0;
              return t === 0 ? "Aucune donnée" : `${v}%`;
            }}
            labelFormatter={(l) => l}
          />
          <Area
            type="monotone"
            dataKey="rate"
            name="Présence"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#attendanceGradient)"
            dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22c55e" }}
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
