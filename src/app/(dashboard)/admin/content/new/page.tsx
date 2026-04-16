import Link from "next/link";
import { requireRole } from "@/server/auth/requireRole";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ContentForm } from "../ContentForm";

export default async function NewContentPage() {
  await requireRole("ADMIN");
  return (
    <section>
      <AdminPageHeader
        title="Nouveau contenu"
        description="Ajoute une ressource pour les élèves."
      />
      <Link
        href="/admin/content"
        className="text-xs text-zinc-500 hover:underline inline-block mb-4"
      >
        ← Retour à la liste
      </Link>
      <ContentForm mode="create" />
    </section>
  );
}
