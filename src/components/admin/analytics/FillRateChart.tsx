"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function FillRateChart({
  data,
}: {
  data: Array<{ subject: string; fillRate: number }>;
}) {
  if (data.length === 0) {
    return <EmptyState message="Aucune séance pour l'instant." />;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="subject" tickLine={false} />
          <YAxis
            unit="%"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [`${v}%`, "Taux"]}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="fillRate" radius={[6, 6, 0, 0]} fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
