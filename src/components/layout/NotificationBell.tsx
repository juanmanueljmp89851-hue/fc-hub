"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification";
import type { Notification } from "@prisma/client";

function getNotifIcon(type: string) {
  switch (type) {
    case "CASUAL_CHALLENGE":
      return "⚔️";
    case "CASUAL_RESULT":
      return "📊";
    case "TOURNAMENT_INSCRIPTION":
      return "📝";
    case "TOURNAMENT_STARTING":
      return "🏁";
    case "MATCH_ASSIGNED":
      return "🎮";
    case "RESULT_LOADED":
      return "📤";
    case "ADVANCED_ROUND":
      return "⬆️";
    case "ELIMINATED":
      return "❌";
    case "TOURNAMENT_FINISHED":
      return "🏆";
    case "ADMIN_MESSAGE":
      return "📢";
    case "SANCTION":
      return "🚫";
    default:
      return "🔔";
  }
}

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function getNotifLink(notif: Notification & { linkUrl?: string | null }): string | null {
  // Admin notifications with custom link
  if (notif.linkUrl) return notif.linkUrl;
  if (!notif.relatedId) return null;
  switch (notif.type) {
    case "CASUAL_CHALLENGE":
      return `/duelo/${notif.relatedId}`;
    case "CASUAL_RESULT":
      return `/casual/${notif.relatedId}`;
    case "TOURNAMENT_INSCRIPTION":
    case "TOURNAMENT_STARTING":
    case "MATCH_ASSIGNED":
    case "ADVANCED_ROUND":
    case "ELIMINATED":
    case "TOURNAMENT_FINISHED":
      return `/torneos/${notif.relatedId}`;
    default:
      return null;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch unread count on mount + poll every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUnreadCount() {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const notifs = await getMyNotifications(20);
      setNotifications(notifs);
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-foreground/60 transition-colors hover:bg-surface-light hover:text-accent"
        aria-label="Notificaciones"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md shadow-red-500/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-14 z-50 overflow-hidden rounded-xl border border-surface-light bg-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-light px-4 py-3">
            <h3 className="text-sm font-bold">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-accent hover:underline"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-foreground/40">
                No tenés notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif.id);
                    const link = getNotifLink(notif);
                    if (link) {
                      setOpen(false);
                      if (link.startsWith("http")) {
                        window.open(link, "_blank", "noopener,noreferrer");
                      } else {
                        router.push(link);
                      }
                    }
                  }}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-light ${
                    !notif.read ? "bg-accent/5" : ""
                  } ${getNotifLink(notif) ? "cursor-pointer" : ""}`}
                >
                  <span className="mt-0.5 text-base">{getNotifIcon(notif.type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground/90">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/50">
                      {notif.message}
                    </p>
                    <span className="mt-1 text-[10px] text-foreground/30">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
