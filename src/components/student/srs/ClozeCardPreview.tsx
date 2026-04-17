"use client";

type CardData = {
  id: string;
  text: string;
  tag: string | null;
  state: "NEW" | "LEARNING" | "REVIEW";
  interval: number;
  stability: number;
  nextReviewAt: Date | null;
};

const STATE_LABELS: Record<string, string> = {
  NEW: "Nouvelle",
  LEARNING: "Apprentissage",
  REVIEW: "Révision",
};

const STATE_COLORS: Record<string, string> = {
  NEW: "bg-zinc-400",
  LEARNING: "bg-amber-400",
  REVIEW: "bg-green-500",
};

export function ClozeCardPreview({
  card,
  hue,
}: {
  card: CardData;
  hue: number;
}) {
  const parts = card.text.split(/(\{\{[^}]+\}\})/g);
  const daysUntil = card.nextReviewAt
    ? Math.round(
        (new Date(card.nextReviewAt).getTime() - Date.now()) / 86400000,
      )
    : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between mb-2.5">
        {card.tag && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              background: `oklch(0.95 0.03 ${hue})`,
              color: `oklch(0.3 0.15 ${hue})`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: `oklch(0.65 0.14 ${hue})` }}
            />
            {card.tag}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <span className={`w-1.5 h-1.5 rounded-full ${STATE_COLORS[card.state]}`} />
          {STATE_LABELS[card.state]}
        </span>
      </div>

      <div className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300 mb-3">
        {parts.map((p, i) =>
          p.startsWith("{{") ? (
            <span
              key={i}
              className="inline-block px-1.5 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded font-medium"
            >
              {p.slice(2, -2)}
            </span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
        <span>intervalle : {card.interval}j</span>
        <span>stabilité : {Math.round(card.stability)}j</span>
        <span>
          prochaine : {daysUntil > 0 ? `+${daysUntil}j` : "auj."}
        </span>
      </div>
    </div>
  );
}
