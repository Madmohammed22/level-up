import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  previewAssignments,
  type PreviewResult,
} from "@/server/actions/admin/assignments";
import { mondayOf } from "@/server/domain/scheduling/weekDates";
import { CommitAssignmentsButton } from "./CommitAssignmentsButton";

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

export default async function AdminAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const defaultWeek = isoDate(mondayOf(new Date()));
  const weekISO = params.week ?? defaultWeek;
  const search = (params.q ?? "").trim();

  let preview: PreviewResult | null = null;
  let fatalError: string | null = null;
  try {
    preview = await previewAssignments(weekISO);
  } catch (e) {
    fatalError = (e as Error).message;
  }

  return (
    <section>
      <AdminPageHeader
        title="Affectations automatiques"
        description="Génère un planning optimisé pour une semaine, visualise le taux de remplissage, puis valide pour créer les séances."
      />

      <form method="get" className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            Semaine du (lundi)
          </label>
          <input
            type="date"
            name="week"
            defaultValue={weekISO}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm"
          />
        </div>
        {/* Hidden q to preserve search when changing week */}
        {search ? <input type="hidden" name="q" value={search} /> : null}
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
        >
          Prévisualiser
        </button>
      </form>

      {fatalError ? (
        <p className="text-sm text-red-600">{fatalError}</p>
      ) : preview ? (
        <PreviewPanel preview={preview} weekISO={weekISO} search={search} />
      ) : null}
    </section>
  );
}

function PreviewPanel({
  preview,
  weekISO,
  search,
}: {
  preview: PreviewResult;
  weekISO: string;
  search: string;
}) {
  const pct = Math.round(preview.score.fillRate * 100);
  const q = search.toLowerCase();
  const baseUrl = `/dashboard/admin/assignments?week=${weekISO}`;

  const filteredSessions = q
    ? preview.proposedSessions.filter((p) => {
        const haystack = [
          p.subjectName,
          p.teacherName,
          p.roomName,
          p.levels.join(" "),
          p.studentNames.join(" "),
          p.timeSlotLabel,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : preview.proposedSessions;

  const filteredUnassigned = q
    ? preview.unassigned.filter((u) => {
        const haystack = [
          u.studentName,
          u.level,
          u.missingSubjectNames.join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      })
    : preview.unassigned;

  return (
    <div className="space-y-6">
      {preview.warnings.length > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-sm space-y-1">
          {preview.warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          title="Taux de remplissage"
          value={`${pct}%`}
          hint={`${preview.proposedSessions.length} séance(s) proposée(s)`}
        />
        <Card
          title="Mutualisations"
          value={String(preview.score.mergedCount)}
          hint="Classes multi-niveaux"
        />
        <Card
          title="Non affectés"
          value={String(preview.score.unassignedCount)}
          hint="(élève × matière)"
          danger={preview.score.unassignedCount > 0}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-medium">
            Séances proposées ({filteredSessions.length})
          </h2>
          <div className="flex items-center gap-2">
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="week" value={weekISO} />
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" strokeWidth={2} />
                  <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
                </svg>
                <input
                  name="q"
                  type="text"
                  defaultValue={search}
                  placeholder="Matière, prof, élève…"
                  className="w-48 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent pl-10 pr-3 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth={2} />
                  <path strokeLinecap="round" strokeWidth={2} d="m21 21-4.35-4.35" />
                </svg>
                Chercher
              </button>
              {search ? (
                <Link
                  href={baseUrl}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </Link>
              ) : null}
            </form>
            {preview.proposedSessions.length > 0 ? (
              <CommitAssignmentsButton weekISO={weekISO} />
            ) : null}
          </div>
        </div>
        {filteredSessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {preview.proposedSessions.length === 0
              ? "Aucune séance ne peut être proposée avec les données actuelles."
              : "Aucune séance ne correspond à la recherche."}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="text-left bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <Th>Créneau</Th>
                  <Th>Matière</Th>
                  <Th>Prof</Th>
                  <Th>Salle</Th>
                  <Th>Niveaux</Th>
                  <Th>Élèves</Th>
                  <Th>Justification</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((p, i) => (
                  <tr
                    key={i}
                    className={`border-t border-zinc-200 dark:border-zinc-800 ${
                      p.collidesWithExisting
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : ""
                    }`}
                  >
                    <Td>
                      {p.timeSlotLabel}
                      <div className="text-xs text-zinc-500">
                        {formatTime(p.startAt)}–{formatTime(p.endAt)}
                      </div>
                    </Td>
                    <Td>{p.subjectName}</Td>
                    <Td>{p.teacherName}</Td>
                    <Td>{p.roomName}</Td>
                    <Td>{p.levels.join(" + ")}</Td>
                    <Td>
                      <span className="font-medium">
                        {p.studentIds.length}/10
                      </span>
                      <div className="text-xs text-zinc-500 truncate max-w-[200px]">
                        {p.studentNames.join(", ")}
                      </div>
                    </Td>
                    <Td>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {p.rationale}
                      </span>
                      {p.collidesWithExisting ? (
                        <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                          déjà créée
                        </div>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredUnassigned.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium mb-3">
            Élèves non affectés ({filteredUnassigned.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {filteredUnassigned.map((u) => (
              <li key={u.studentId} className="px-4 py-3">
                <div className="font-medium">{u.studentName}</div>
                <div className="text-xs text-zinc-500">
                  {u.level} — manque :{" "}
                  {u.missingSubjectNames.join(", ")}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-zinc-500">
            Causes fréquentes : pas de prof dispo, pas de salle libre, pas de
            créneau commun, ou règle de compatibilité trop stricte (
            <Link href="/dashboard/admin/subjects" className="underline">
              matières
            </Link>
            ).
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  title,
  value,
  hint,
  danger,
}: {
  title: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        danger
          ? "border-red-300 dark:border-red-800"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {title}
      </div>
      <div
        className={`mt-2 text-3xl font-semibold ${danger ? "text-red-600" : ""}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
