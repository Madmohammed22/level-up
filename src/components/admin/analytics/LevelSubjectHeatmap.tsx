// Pure CSS heatmap — no chart library needed for a small grid.

import type { MatrixCell } from "@/server/domain/analytics/levelSubjectMatrix";

const LEVEL_LABEL: Record<string, string> = {
  GRADE_9: "3e",
  GRADE_10: "2nde",
  GRADE_11: "1ère",
  GRADE_12: "Tle",
};

export function LevelSubjectHeatmap({
  subjects,
  levels,
  cells,
  max,
}: {
  subjects: Array<{ id: string; name: string }>;
  levels: string[];
  cells: MatrixCell[];
  max: number;
}) {
  if (subjects.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-zinc-500">
        Aucune matière.
      </div>
    );
  }
  const get = (subjectId: string, level: string): number =>
    cells.find((c) => c.subjectId === subjectId && c.level === level)?.count ??
    0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-zinc-500 pr-3 py-1">
              Matière
            </th>
            {levels.map((l) => (
              <th
                key={l}
                className="text-xs font-medium text-zinc-500 text-center px-2 py-1"
              >
                {LEVEL_LABEL[l] ?? l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subjects.map((s) => (
            <tr key={s.id}>
              <td className="text-sm font-medium pr-3 py-1">{s.name}</td>
              {levels.map((l) => {
                const n = get(s.id, l);
                const intensity = max > 0 ? n / max : 0;
                return (
                  <td
                    key={l}
                    className="text-center text-sm font-medium rounded-md"
                    style={{
                      backgroundColor:
                        n === 0
                          ? "rgba(161,161,170,0.08)"
                          : `rgba(16,185,129,${0.15 + intensity * 0.75})`,
                      color:
                        n === 0
                          ? "rgb(113, 113, 122)"
                          : intensity > 0.5
                            ? "white"
                            : "inherit",
                      minWidth: 56,
                      height: 36,
                    }}
                  >
                    {n}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
