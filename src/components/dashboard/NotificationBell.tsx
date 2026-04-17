"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  fetchRecentNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
  type NotificationRow,
} from "@/server/actions/notifications";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

function hrefFor(n: NotificationRow): string | null {
  const data = (n.data ?? {}) as Record<string, unknown>;
  if (typeof data.href === "string") {
    // Migrate old notification hrefs that lack /dashboard prefix
    const raw = data.href as string;
    return raw.startsWith("/dashboard") ? raw : `/dashboard${raw}`;
  }
  if (n.type === "SESSION_ASSIGNED" || n.type === "SESSION_CANCELLED") {
    return "/dashboard/notifications";
  }
  return null;
}

export function NotificationBell({
  initial,
  initialUnread,
}: {
  initial: NotificationRow[];
  initialUnread: number;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [freshItems, freshCount] = await Promise.all([
          fetchRecentNotifications(),
          unreadNotificationCount(),
        ]);
        setItems(freshItems);
        setUnread(freshCount);
      } catch {
        // Silently ignore polling errors (e.g. session expired)
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function handleClick(n: NotificationRow) {
    if (!n.read) {
      // optimistic
      setItems((list) =>
        list.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id);
    }
    setOpen(false);
  }

  async function handleMarkAll() {
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center font-semibold">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg z-40">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Tout marquer lu
              </button>
            ) : null}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500 text-center">
              Aucune notification.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((n) => {
                const href = hrefFor(n);
                const content = (
                  <div
                    className={`px-4 py-3 text-sm ${
                      n.read
                        ? "opacity-60"
                        : "bg-zinc-50 dark:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read ? (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{n.title}</div>
                        <div className="text-xs text-zinc-500 truncate">
                          {n.body}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          {timeAgo(n.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {href ? (
                      <Link href={href} onClick={() => handleClick(n)}>
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className="w-full text-left"
                      >
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-xs text-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
