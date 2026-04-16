import Link from "next/link";
import type { UserRole } from "@/generated/prisma/enums";

type NavLink = { href: string; label: string };

const LINKS: Record<UserRole, NavLink[]> = {
  ADMIN: [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/students", label: "Élèves" },
    { href: "/admin/teachers", label: "Professeurs" },
    { href: "/admin/subjects", label: "Matières" },
    { href: "/admin/compatibility", label: "Compatibilité" },
    { href: "/admin/rooms", label: "Salles" },
    { href: "/admin/timeslots", label: "Créneaux" },
    { href: "/admin/sessions", label: "Séances" },
    { href: "/admin/assignments", label: "Affectations" },
    { href: "/admin/content", label: "Contenus" },
    { href: "/admin/exams", label: "Examens" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/chat", label: "Messages" },
  ],
  TEACHER: [
    { href: "/teacher", label: "Accueil" },
    { href: "/teacher/schedule", label: "Planning" },
    { href: "/teacher/availability", label: "Disponibilités" },
    { href: "/teacher/students", label: "Mes élèves" },
    { href: "/teacher/chat", label: "Messages" },
    { href: "/teacher/profile", label: "Mon profil" },
  ],
  STUDENT: [
    { href: "/student", label: "Accueil" },
    { href: "/student/schedule", label: "Mon planning" },
    { href: "/student/availability", label: "Disponibilités" },
    { href: "/student/methodology", label: "Méthodologie" },
    { href: "/student/exams", label: "Examens" },
    { href: "/student/mood", label: "Humeur" },
    { href: "/student/chat", label: "Messages" },
    { href: "/student/profile", label: "Mon profil" },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const links = LINKS[role] ?? [];
  return (
    <aside className="hidden md:block w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 px-3 py-6">
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
