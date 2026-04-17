"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitSrsReview, finishSrsSession } from "@/server/actions/student/srs";

type SessionCard = {
  id: string;
  text: string;
  tag: string | null;
  interval: number;
  stability: number;
  state: string;
  subject: {
    id: string;
    name: string;
    code: string;
    hue: number;
  };
};

const GRADES = [
  { label: "À revoir", hint: "< 10 min", grade: 1, style: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" },
  { label: "Difficile", hint: "1 j", grade: 2, style: "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300" },
  { label: "Correct", hint: "", grade: 3, style: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300" },
  { label: "Facile", hint: "", grade: 4, style: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" },
];

export function ReviewSession({ cards }: { cards: SessionCard[] }) {
  const [idx, setIdx] = useState(0);
  const [showAns, setShowAns] = useState(false);
  const [results, setResults] = useState<{ cardId: string; grade: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  const card = cards[idx];
  const done = idx >= cards.length;

  function handleGrade(grade: number) {
    if (!card || isPending) return;
    const isLastCard = idx === cards.length - 1;
    startTransition(async () => {
      await submitSrsReview(card.id, grade);
      setResults((r) => [...r, { cardId: card.id, grade }]);
      setShowAns(false);
      setIdx((i) => i + 1);
      if (isLastCard) {
        await finishSrsSession();
      }
    });
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-green-50 dark:bg-green-950 rounded-full">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l4 4L19 7" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Rien à réviser</h2>
          <p className="text-sm text-zinc-500 mt-2">Toutes tes cartes sont à jour. Reviens plus tard !</p>
          <Link
            href="/dashboard/student/revisions"
            className="inline-flex mt-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
          >
            Retour
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    const correct = results.filter((r) => r.grade >= 3).length;
    return (
      <div className="max-w-lg mx-auto mt-12">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-green-50 dark:bg-green-950 rounded-full">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l4 4L19 7" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Session terminée</h2>
          <p className="text-sm text-zinc-500 mt-2">
            {results.length} cartes révisées · {correct} correctes ({Math.round((correct / results.length) * 100)}%)
          </p>
          <Link
            href="/dashboard/student/revisions"
            className="inline-flex mt-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const parts = card.text.split(/(\{\{[^}]+\}\})/g);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
          <Link
            href="/dashboard/student/revisions"
            className="hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            ← Quitter
          </Link>
          <span>·</span>
          <span className="tabular-nums">
            Carte {idx + 1} sur {cards.length}
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Session de révision
        </h1>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Progression</span>
          <span className="text-sm text-zinc-400 tabular-nums">
            {idx}/{cards.length} ({Math.round((idx / cards.length) * 100)}%)
          </span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(idx / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 min-h-[320px]">
        <div className="flex items-center justify-between mb-6">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: `oklch(0.95 0.03 ${card.subject.hue})`,
              color: `oklch(0.3 0.15 ${card.subject.hue})`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: `oklch(0.65 0.14 ${card.subject.hue})` }}
            />
            {card.subject.name}
            {card.tag ? ` · ${card.tag}` : ""}
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">
            intervalle {card.interval}j · stab. {Math.round(card.stability)}j
          </span>
        </div>

        {/* Cloze text */}
        <div className="text-lg leading-relaxed py-5">
          {parts.map((p, i) =>
            p.startsWith("{{") ? (
              showAns ? (
                <span
                  key={i}
                  className="inline-block px-2 py-0.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md font-semibold"
                >
                  {p.slice(2, -2)}
                </span>
              ) : (
                <span
                  key={i}
                  className="inline-block min-w-[80px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-md text-zinc-400 font-mono text-base"
                >
                  [ … ]
                </span>
              )
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          {!showAns ? (
            <button
              onClick={() => setShowAns(true)}
              className="w-full rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-3.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Afficher la réponse
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((b) => (
                <button
                  key={b.grade}
                  onClick={() => handleGrade(b.grade)}
                  disabled={isPending}
                  className={`rounded-xl border py-3.5 px-2 cursor-pointer transition-opacity disabled:opacity-50 ${b.style}`}
                >
                  <div className="text-sm font-semibold">{b.label}</div>
                  <div className="text-[11px] opacity-70 mt-0.5 font-mono">
                    {b.grade === 3
                      ? `${card.interval}j`
                      : b.grade === 4
                        ? `${Math.round(card.interval * 2.5)}j`
                        : b.hint}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
