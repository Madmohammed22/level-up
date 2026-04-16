import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteTimeSlot } from "@/server/actions/admin/timeslots";
import { CreateTimeSlotForm } from "./CreateTimeSlotForm";

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

export default async function AdminTimeSlotsPage() {
  await requireRole("ADMIN");

  const slots = await prisma.timeSlot.findMany({
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
          <h2 className="text-sm font-medium mb-3">Liste</h2>
          {slots.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun créneau.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {slots.map((s) => {
                const refs =
                  s._count.sessions +
                  s._count.sessionTemplates +
                  s._count.teacherAvailabilities +
                  s._count.studentAvailabilities;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">
                        {DAY_LABELS[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                      </div>
                    </div>
                    {refs === 0 ? (
                      <form action={deleteTimeSlot}>
                        <input type="hidden" name="id" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-zinc-400">en usage</span>
                    )}
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
