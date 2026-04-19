import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteSessionTemplate } from "@/server/actions/admin/templates";
import { levelsLabel } from "@/lib/levelLabels";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { GenerateButton } from "./GenerateButton";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mer",
  THURSDAY: "Jeu",
  FRIDAY: "Ven",
  SATURDAY: "Sam",
  SUNDAY: "Dim",
};

const RECURRENCE_LABELS: Record<string, string> = {
  WEEKLY: "Hebdo",
  ONE_OFF: "Ponctuel",
};

export default async function AdminTemplatesPage() {
  await requireRole("ADMIN");

  const [templates, subjects, teacherProfiles, rooms, timeSlots] =
    await Promise.all([
      prisma.sessionTemplate.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          subject: { select: { name: true } },
          teacher: { include: { user: { select: { name: true } } } },
          room: { select: { name: true } },
          timeSlot: true,
          _count: { select: { sessions: true } },
        },
      }),
      prisma.subject.findMany({ orderBy: { name: "asc" } }),
      prisma.teacherProfile.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.room.findMany({ orderBy: { name: "asc" } }),
      prisma.timeSlot.findMany({
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      }),
    ]);

  const subjectOpts = subjects.map((s) => ({ id: s.id, label: s.name }));
  const teacherOpts = teacherProfiles.map((t) => ({
    id: t.id,
    label: t.user.name ?? t.userId,
  }));
  const roomOpts = rooms.map((r) => ({ id: r.id, label: r.name }));
  const timeSlotOpts = timeSlots.map((ts) => ({
    id: ts.id,
    label: `${DAY_LABELS[ts.dayOfWeek] ?? ts.dayOfWeek} ${ts.startTime}–${ts.endTime}`,
  }));

  return (
    <section>
      <AdminPageHeader
        title="Modèles de séances"
        description="Crée des modèles récurrents et génère les séances automatiquement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouveau modèle</h2>
          {subjects.length === 0 ||
          teacherProfiles.length === 0 ||
          rooms.length === 0 ||
          timeSlots.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Crée d&apos;abord des matières, professeurs, salles et créneaux.
            </p>
          ) : (
            <CreateTemplateForm
              subjects={subjectOpts}
              teachers={teacherOpts}
              rooms={roomOpts}
              timeSlots={timeSlotOpts}
            />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">
            Modèles ({templates.length})
          </h2>
          {templates.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun modèle.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {templates.map((t) => {
                const hasSessionsLinked = t._count.sessions > 0;
                return (
                  <li key={t.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm">
                          {t.subject.name}
                          <span className="ml-2 text-xs text-zinc-500 font-normal">
                            {t.teacher.user.name}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">
                          {DAY_LABELS[t.timeSlot.dayOfWeek]}{" "}
                          {t.timeSlot.startTime}–{t.timeSlot.endTime} ·{" "}
                          {t.room.name} · Max {t.maxCapacity}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {levelsLabel(t.levels)}{" "}
                          ·{" "}
                          <span className="font-medium">
                            {RECURRENCE_LABELS[t.recurrence]}
                          </span>{" "}
                          · {t._count.sessions} séance(s)
                        </div>
                      </div>
                      {!hasSessionsLinked ? (
                        <form action={deleteSessionTemplate}>
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Supprimer
                          </button>
                        </form>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 12l2 2 4-4" />
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                          en usage
                        </span>
                      )}
                    </div>
                    <GenerateButton templateId={t.id} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
