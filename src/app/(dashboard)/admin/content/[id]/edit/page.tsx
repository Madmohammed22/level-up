import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/requireRole";
import { prisma } from "@/server/db/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentForm } from "../../ContentForm";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const item = await prisma.contentItem.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <section>
      <AdminPageHeader
        title="Modifier le contenu"
        description={item.title}
      />
      <Link
        href="/admin/content"
        className="text-xs text-zinc-500 hover:underline inline-block mb-4"
      >
        ← Retour à la liste
      </Link>
      <ContentForm
        mode="edit"
        initial={{
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category,
          body: item.body,
          durationSec: item.durationSec,
          published: item.published,
        }}
      />
    </section>
  );
}
