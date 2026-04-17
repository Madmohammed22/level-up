"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CreateSubjectForm } from "@/components/student/srs/CreateSubjectForm";

type SubjectInfo = { id: string; name: string; hue: number; due: number };

export function SrsDashboardClient({
  showCreateSubject,
  showCreateButton,
  showReviewDropdown,
  subjects,
}: {
  showCreateSubject?: boolean;
  showCreateButton?: boolean;
  showReviewDropdown?: boolean;
  subjects?: SubjectInfo[];
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

  if (showCreateSubject) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-2xl">
          📚
        </div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">
          Commence tes révisions espacées
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Crée une matière, ajoute des cartes à trous, et laisse
          l&apos;algorithme planifier tes révisions.
        </p>

        {!modalOpen ? (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-sm font-medium"
          >
            + Nouvelle matière
          </button>
        ) : (
          <div className="text-left">
            <CreateSubjectForm
              onSuccess={() => {
                setModalOpen(false);
                window.location.reload();
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (showReviewDropdown && subjects) {
    const totalDue = subjects.reduce((a, s) => a + s.due, 0);
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
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-lg z-30 py-1 overflow-hidden">
            {/* Review all */}
            <Link
              href="/dashboard/student/revisions/session"
              className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <span className="font-medium">Tout réviser</span>
              <span className="text-xs text-zinc-400 tabular-nums">{totalDue} cartes</span>
            </Link>

            {subjects.length > 1 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 my-1" />
            )}

            {/* Per-subject */}
            {subjects.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/student/revisions/session?subject=${s.id}`}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: `oklch(0.65 0.14 ${s.hue})` }}
                  />
                  <span>{s.name}</span>
                </div>
                <span className="text-xs text-zinc-400 tabular-nums">{s.due}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (showCreateButton) {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-full border border-zinc-200 dark:border-zinc-700 px-4 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          + Nouvelle matière
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
              <h3 className="text-lg font-semibold mb-1">Nouvelle matière</h3>
              <p className="text-sm text-zinc-500 mb-4">
                Crée un espace pour regrouper tes cartes par thème.
              </p>
              <CreateSubjectForm
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

  return null;
}
