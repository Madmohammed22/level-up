"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { CreateSubjectForm } from "@/components/student/srs/CreateSubjectForm";
import { deleteSrsSubject } from "@/server/actions/student/srs";

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
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="text-zinc-500 dark:text-zinc-400">
            {/* Back card */}
            <rect x="6" y="3" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            {/* Front card */}
            <rect x="3" y="7" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
            {/* Lines on front card */}
            <line x1="7" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            {/* Small clock */}
            <circle cx="22.5" cy="22.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="22.5,20 22.5,22.5 24.5,24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

export function DeleteSubjectButton({ subjectId }: { subjectId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
    setConfirmDelete(false);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", subjectId);
      await deleteSrsSubject(fd);
      window.location.reload();
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleToggle}
        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-20 py-1"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {!confirmDelete ? (
            <button
              onClick={handleDeleteClick}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Supprimer
            </button>
          ) : (
            <button
              onClick={handleDeleteClick}
              disabled={isPending}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
            >
              {isPending ? "…" : "Confirmer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
