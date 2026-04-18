"use client";

import { useState, useRef, useEffect, useActionState, useTransition } from "react";
import { updateSrsCard, deleteSrsCard, type SrsCardState } from "@/server/actions/student/srs";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  const [editState, editAction, isEditing] = useActionState<SrsCardState | undefined, FormData>(
    async (prev, formData) => {
      const result = await updateSrsCard(prev, formData);
      if (result.ok) {
        setEditing(false);
        window.location.reload();
      }
      return result;
    },
    undefined,
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const parts = card.text.split(/(\{\{[^}]+\}\})/g);
  const daysUntil = card.nextReviewAt
    ? Math.round(
        (new Date(card.nextReviewAt).getTime() - Date.now()) / 86400000,
      )
    : 0;

  function handleDelete() {
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", card.id);
      await deleteSrsCard(fd);
      window.location.reload();
    });
  }

  // Edit mode
  if (editing) {
    return (
      <div className="rounded-xl border border-blue-200 dark:border-blue-800 p-4 bg-white dark:bg-zinc-900">
        <form action={editAction} className="space-y-3">
          <input type="hidden" name="id" value={card.id} />

          {editState?.error && (
            <p className="text-xs text-red-600">{editState.error}</p>
          )}

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Texte</label>
            <textarea
              name="text"
              required
              rows={3}
              defaultValue={card.text}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500 mb-1">Tag</label>
            <input
              name="tag"
              defaultValue={card.tag ?? ""}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-zinc-200 dark:border-zinc-700 px-3 py-1 text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isEditing}
              className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1 text-xs font-medium disabled:opacity-50"
            >
              {isEditing ? "…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900 group relative">
      {/* Menu button */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-20 py-1">
            <button
              onClick={() => { setEditing(true); setMenuOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Modifier
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Supprimer
              </button>
            ) : (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full text-left px-3 py-1.5 text-sm text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
              >
                {isDeleting ? "…" : "Confirmer"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-2.5 pr-6">
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
