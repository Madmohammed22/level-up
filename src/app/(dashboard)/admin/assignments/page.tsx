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
  searchParams: Promise<{ week?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const defaultWeek = isoDate(mondayOf(new Date()));
  const weekISO = params.week ?? defaultWeek;

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

      <form method="get" className="flex items-end gap-3 mb-6">
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
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
        >
          Prévisualiser
        </button>
      </form>

      {fatalError ? (
        <p className="text-sm text-red-600">{fatalError}</p>
      ) : preview ? (
        <PreviewPanel preview={preview} weekISO={weekISO} />
      ) : null}
    </section>
  );
}

function PreviewPanel({
  preview,
  weekISO,
}: {
  preview: PreviewResult;
  weekISO: string;
}) {
  const pct = Math.round(preview.score.fillRate * 100);

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Séances proposées</h2>
          {preview.proposedSessions.length > 0 ? (
            <CommitAssignmentsButton weekISO={weekISO} />
          ) : null}
        </div>
        {preview.proposedSessions.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune séance ne peut être proposée avec les données actuelles.
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
                {preview.proposedSessions.map((p, i) => (
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

      {preview.unassigned.length > 0 ? (
        <div>
          <h2 className="text-sm font-medium mb-3">
            Élèves non affectés ({preview.unassigned.length})
          </h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {preview.unassigned.map((u) => (
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
            <Link href="/admin/subjects" className="underline">
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
