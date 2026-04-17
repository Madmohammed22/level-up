import Link from "next/link";
import type { UserRole } from "@/generated/prisma/enums";
import { ThemeToggle } from "@/components/ThemeToggle";

export type NavLink = { href: string; label: string };

export const LINKS: Record<UserRole, NavLink[]> = {
  ADMIN: [
    { href: "/admin", label: "Tableau de bord" },
    { href: "/admin/students", label: "\u00c9l\u00e8ves" },
    { href: "/admin/teachers", label: "Professeurs" },
    { href: "/admin/subjects", label: "Mati\u00e8res" },
    { href: "/admin/compatibility", label: "Compatibilit\u00e9" },
    { href: "/admin/rooms", label: "Salles" },
    { href: "/admin/timeslots", label: "Cr\u00e9neaux" },
    { href: "/admin/sessions", label: "S\u00e9ances" },
    { href: "/admin/templates", label: "Mod\u00e8les" },
    { href: "/admin/assignments", label: "Affectations" },
    { href: "/admin/content", label: "Contenus" },
    { href: "/admin/exams", label: "Examens" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/audit", label: "Journal" },
    { href: "/admin/chat", label: "Messages" },
    { href: "/admin/profile", label: "Mon profil" },
  ],
  TEACHER: [
    { href: "/teacher", label: "Accueil" },
    { href: "/teacher/schedule", label: "Planning" },
    { href: "/teacher/availability", label: "Disponibilit\u00e9s" },
    { href: "/teacher/students", label: "Mes \u00e9l\u00e8ves" },
    { href: "/teacher/chat", label: "Messages" },
    { href: "/teacher/profile", label: "Mon profil" },
  ],
  STUDENT: [
    { href: "/student", label: "Accueil" },
    { href: "/student/schedule", label: "Mon planning" },
    { href: "/student/availability", label: "Disponibilit\u00e9s" },
    { href: "/student/methodology", label: "M\u00e9thodologie" },
    { href: "/student/exams", label: "Examens" },
    { href: "/student/mood", label: "Humeur" },
    { href: "/student/chat", label: "Messages" },
    { href: "/student/profile", label: "Mon profil" },
  ],
};

export function Sidebar({ role }: { role: UserRole }) {
  const links = LINKS[role] ?? [];
  return (
    <aside className="hidden md:flex md:flex-col md:justify-between w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 px-3 py-6">
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
      <div className="mt-4 px-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
