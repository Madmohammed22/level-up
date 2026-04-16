import { requireUser } from "@/server/auth/requireRole";
import { Navbar } from "@/components/dashboard/Navbar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import {
  fetchRecentNotifications,
  unreadNotificationCount,
} from "@/server/actions/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [notifications, unreadCount] = await Promise.all([
    fetchRecentNotifications(10),
    unreadNotificationCount(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        user={{ name: user.name, email: user.email, role: user.role }}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <div className="flex-1 flex">
        <Sidebar role={user.role} />
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
