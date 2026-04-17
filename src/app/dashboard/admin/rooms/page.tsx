import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreateRoomForm } from "./CreateRoomForm";
import { DeleteRoomButton } from "./DeleteRoomButton";

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;
  const query = (params.q ?? "").trim();

  const rooms = await prisma.room.findMany({
    where: query
      ? { name: { contains: query, mode: "insensitive" as const } }
      : undefined,
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium">
              Liste ({rooms.length})
            </h2>
          </div>
          <form className="mb-3 flex gap-2">
            <input
              name="q"
              type="text"
              placeholder="Rechercher par nom..."
              defaultValue={query}
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Chercher
            </button>
            {query && (
              <a
                href="/dashboard/admin/rooms"
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
          {rooms.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {query ? `Aucun résultat pour « ${query} ».` : "Aucune salle."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {rooms.map((r) => {
                const refs = r._count.sessions + r._count.sessionTemplates;
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
                      {refs > 0 && (
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {r._count.sessions} séance(s), {r._count.sessionTemplates} modèle(s)
                        </div>
                      )}
                    </div>
                    <DeleteRoomButton id={r.id} />
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
