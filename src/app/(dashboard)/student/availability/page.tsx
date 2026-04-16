import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AvailabilityForm } from "./AvailabilityForm";

export default async function StudentAvailabilityPage() {
  const user = await requireRole("STUDENT");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  const timeSlots = await prisma.timeSlot.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
  });

  // Load existing preferences
  const existing = profile
    ? await prisma.studentAvailability.findMany({
        where: { studentId: profile.id },
        select: { timeSlotId: true, preference: true },
      })
    : [];

  const saved: Record<string, "PREFERRED" | "AVAILABLE" | "UNAVAILABLE"> = {};
  for (const row of existing) {
    saved[row.timeSlotId] = row.preference;
  }

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Mes disponibilités
        </h1>
        <p className="text-sm text-zinc-500">
          Indique tes créneaux disponibles pour que le planning soit adapté à
          ton emploi du temps.
        </p>
      </header>

      <AvailabilityForm timeSlots={timeSlots} saved={saved} />
    </section>
  );
}
