import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateTimeSlotForm } from "./CreateTimeSlotForm";
import { DeleteSlotButton } from "./DeleteSlotButton";
import type { DayOfWeek } from "@/generated/prisma/enums";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export default async function AdminTimeSlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const dayFilter = params.day ?? "";

  const slots = await prisma.timeSlot.findMany({
    where: dayFilter ? { dayOfWeek: dayFilter as DayOfWeek } : undefined,
    include: {
      _count: {
        select: {
          sessions: true,
          sessionTemplates: true,
          teacherAvailabilities: true,
          studentAvailabilities: true,
        },
      },
    },
  });

  // Order: day, then startTime
  slots.sort((a, b) => {
    const d = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
    return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
  });

  return (
    <section>
      <AdminPageHeader
        title="Créneaux horaires"
        description="Les plages horaires récurrentes. Utilisées pour les disponibilités et le planning."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouveau créneau</h2>
          <CreateTimeSlotForm />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              Liste ({slots.length})
            </h2>
          </div>
          <form className="mb-3 flex gap-2">
            <select
              name="day"
              defaultValue={dayFilter}
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            >
              <option value="">Tous les jours</option>
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>{DAY_LABELS[d]}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Filtrer
            </button>
            {dayFilter && (
              <a
                href="/dashboard/admin/timeslots"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                Effacer
              </a>
            )}
          </form>
          {slots.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {dayFilter ? `Aucun créneau pour ${DAY_LABELS[dayFilter] ?? dayFilter}.` : "Aucun créneau."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {slots.map((s) => {
                const hardRefs = s._count.sessions + s._count.sessionTemplates;
                const availRefs = s._count.teacherAvailabilities + s._count.studentAvailabilities;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">
                        {DAY_LABELS[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                      </div>
                      {(hardRefs > 0 || availRefs > 0) && (
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {hardRefs > 0 && `${s._count.sessions} séance(s), ${s._count.sessionTemplates} modèle(s)`}
                          {hardRefs > 0 && availRefs > 0 && " · "}
                          {availRefs > 0 && `${availRefs} disponibilité(s)`}
                        </div>
                      )}
                    </div>
                    <DeleteSlotButton id={s.id} hasHardRefs={hardRefs > 0} />
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
