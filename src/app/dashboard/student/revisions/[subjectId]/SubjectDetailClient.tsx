"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CreateCardForm } from "@/components/student/srs/CreateCardForm";

export function SubjectDetailClient({
  subjectId,
  totalCards,
  dueCards,
  showCreateCardButton,
  showCreateCardInline,
  showReviewOptions,
}: {
  subjectId: string;
  totalCards?: number;
  dueCards?: number;
  showCreateCardButton?: boolean;
  showCreateCardInline?: boolean;
  showReviewOptions?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (showReviewOptions) {
    const hasDue = (dueCards ?? 0) > 0;
    const hasCards = (totalCards ?? 0) > 0;
    if (!hasCards) return null;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 text-sm font-medium flex items-center gap-2"
        >
          Réviser
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg z-30 py-1 overflow-hidden">
            {hasDue && (
              <Link
                href={`/dashboard/student/revisions/session?subject=${subjectId}`}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <span className="font-medium">Cartes échues</span>
                <span className="text-xs text-zinc-400 tabular-nums">{dueCards}</span>
              </Link>
            )}
            <Link
              href={`/dashboard/student/revisions/session?subject=${subjectId}&all=1`}
              className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <span className="font-medium">Toutes les cartes</span>
              <span className="text-xs text-zinc-400 tabular-nums">{totalCards}</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (showCreateCardButton) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          + Nouvelle carte
        </button>

        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-1">Nouvelle carte à trous</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Utilise {"{{réponse}}"} pour créer un trou dans le texte.
              </p>
              <CreateCardForm
                subjectId={subjectId}
                onSuccess={() => {
                  setModalOpen(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  if (showCreateCardInline) {
    return (
      <>
        {!modalOpen ? (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2 text-sm font-medium"
          >
            + Ajouter une carte
          </button>
        ) : (
          <div className="max-w-md mx-auto text-left">
            <CreateCardForm
              subjectId={subjectId}
              onSuccess={() => {
                setModalOpen(false);
                window.location.reload();
              }}
            />
          </div>
        )}
      </>
    );
  }

  return null;
}
