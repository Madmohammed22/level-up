import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { deleteRoom } from "@/server/actions/admin/rooms";
import { CreateRoomForm } from "./CreateRoomForm";

export default async function AdminRoomsPage() {
  await requireRole("ADMIN");

  const rooms = await prisma.room.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sessions: true, sessionTemplates: true } },
    },
  });

  return (
    <section>
      <AdminPageHeader
        title="Salles"
        description="Les salles physiques utilisées pour les séances."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-medium mb-3">Nouvelle salle</h2>
          <CreateRoomForm />
        </div>

        <div>
          <h2 className="text-sm font-medium mb-3">Liste</h2>
          {rooms.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune salle.</p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {rooms.map((r) => {
                const inUse =
                  r._count.sessions + r._count.sessionTemplates > 0;
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-zinc-500">
                        Capacité : {r.capacity}
                      </div>
                    </div>
                    {!inUse ? (
                      <form action={deleteRoom}>
                        <input type="hidden" name="id" value={r.id} />
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
