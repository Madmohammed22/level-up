import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { NotificationBell } from "./NotificationBell";
import type { NotificationRow } from "@/server/actions/notifications";

type NavUser = { name: string | null; email: string; role: string };

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Professeur",
  STUDENT: "Élève",
};

export function Navbar({
  user,
  notifications,
  unreadCount,
}: {
  user: NavUser;
  notifications: NotificationRow[];
  unreadCount: number;
}) {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 md:px-10 h-14">
        <Link href="/" className="font-semibold tracking-tight">
          LEVEL UP
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <NotificationBell
            initial={notifications}
            initialUnread={unreadCount}
          />
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="font-medium">{user.name ?? user.email}</span>
            <span className="text-xs text-zinc-500">
              {roleLabel[user.role] ?? user.role}
            </span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
