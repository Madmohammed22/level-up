import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  deleteContentItem,
  toggleContentItemPublished,
} from "@/server/actions/admin/content";

const CATEGORY_LABEL: Record<string, string> = {
  STRESS: "Stress",
  METHODOLOGY: "Méthodologie",
  TIME_MANAGEMENT: "Gestion du temps",
  EXAM_PREP: "Prép. examen",
};
const TYPE_LABEL: Record<string, string> = {
  MICRO_LESSON: "Micro-leçon",
  EXERCISE: "Exercice",
  PROTOCOL: "Protocole",
  TEMPLATE: "Modèle",
};

export default async function AdminContentPage() {
  await requireRole("ADMIN");

  const items = await prisma.contentItem.findMany({
    orderBy: [{ published: "desc" }, { category: "asc" }, { title: "asc" }],
    include: { _count: { select: { completions: true } } },
  });

  return (
    <section>
      <AdminPageHeader
        title="Contenus"
        description="Méthodologie, gestion du stress, techniques d'examen — visibles par les élèves."
      />

      <div className="mb-4">
        <Link
          href="/dashboard/admin/content/new"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
        >
          + Nouveau contenu
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucun contenu.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-2 font-medium">Titre</th>
                <th className="px-4 py-2 font-medium">Catégorie</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Lu</th>
                <th className="px-4 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-zinc-500 line-clamp-1">
                      {item.body.slice(0, 90)}
                      {item.body.length > 90 ? "…" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {CATEGORY_LABEL[item.category] ?? item.category}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {TYPE_LABEL[item.type] ?? item.type}
                    {item.durationSec
                      ? ` · ${Math.round(item.durationSec / 60)} min`
                      : ""}
                  </td>
                  <td className="px-4 py-3">
                    {item.published ? (
                      <span className="inline-block rounded-full bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs font-medium">
                        Publié
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 text-xs">
                        Brouillon
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {item._count.completions}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/admin/content/${item.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Modifier
                      </Link>
                      <form action={toggleContentItemPublished}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-zinc-600 dark:text-zinc-400 hover:underline"
                        >
                          {item.published ? "Dépublier" : "Publier"}
                        </button>
                      </form>
                      <form action={deleteContentItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
