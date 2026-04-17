import Link from "next/link";
import type { UserRole } from "@/generated/prisma/enums";
import { ThemeToggle } from "@/components/ThemeToggle";

export type NavLink = { href: string; label: string };

export const LINKS: Record<UserRole, NavLink[]> = {
  ADMIN: [
    { href: "/dashboard/admin", label: "Tableau de bord" },
    { href: "/dashboard/admin/students", label: "\u00c9l\u00e8ves" },
    { href: "/dashboard/admin/teachers", label: "Professeurs" },
    { href: "/dashboard/admin/subjects", label: "Mati\u00e8res" },
    { href: "/dashboard/admin/compatibility", label: "Compatibilit\u00e9" },
    { href: "/dashboard/admin/rooms", label: "Salles" },
    { href: "/dashboard/admin/timeslots", label: "Cr\u00e9neaux" },
    { href: "/dashboard/admin/sessions", label: "S\u00e9ances" },
    { href: "/dashboard/admin/templates", label: "Mod\u00e8les" },
    { href: "/dashboard/admin/assignments", label: "Affectations" },
    { href: "/dashboard/admin/content", label: "Contenus" },
    { href: "/dashboard/admin/exams", label: "Examens" },
    { href: "/dashboard/admin/leads", label: "Leads" },
    { href: "/dashboard/admin/audit", label: "Journal" },
    { href: "/dashboard/admin/chat", label: "Messages" },
    { href: "/dashboard/admin/profile", label: "Mon profil" },
  ],
  TEACHER: [
    { href: "/dashboard/teacher", label: "Accueil" },
    { href: "/dashboard/teacher/schedule", label: "Planning" },
    { href: "/dashboard/teacher/availability", label: "Disponibilit\u00e9s" },
    { href: "/dashboard/teacher/students", label: "Mes \u00e9l\u00e8ves" },
    { href: "/dashboard/teacher/chat", label: "Messages" },
    { href: "/dashboard/teacher/profile", label: "Mon profil" },
  ],
  STUDENT: [
    { href: "/dashboard/student", label: "Accueil" },
    { href: "/dashboard/student/schedule", label: "Mon planning" },
    { href: "/dashboard/student/availability", label: "Disponibilit\u00e9s" },
    { href: "/dashboard/student/methodology", label: "M\u00e9thodologie" },
    { href: "/dashboard/student/exams", label: "Examens" },
    { href: "/dashboard/student/mood", label: "Humeur" },
    { href: "/dashboard/student/chat", label: "Messages" },
    { href: "/dashboard/student/profile", label: "Mon profil" },
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
