"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/actions/notification";
import type { Notification } from "@prisma/client";

const PAGE_SIZE = 30;

function getNotifIcon(type: string) {
  switch (type) {
    case "CASUAL_CHALLENGE": return "⚔️";
    case "CASUAL_RESULT": return "📊";
    case "TOURNAMENT_INSCRIPTION": return "📝";
    case "TOURNAMENT_STARTING": return "🏁";
    case "MATCH_ASSIGNED": return "🎮";
    case "RESULT_LOADED": return "📤";
    case "ADVANCED_ROUND": return "⬆️";
    case "ELIMINATED": return "❌";
    case "TOURNAMENT_FINISHED": return "🏆";
    case "ADMIN_MESSAGE": return "📢";
    case "DISPUTE_OPENED": return "⚖️";
    case "SANCTION": return "🚫";
    case "TOURNAMENT_CHAT": return "💬";
    case "MATCH_REMINDER": return "⏰";
    case "RESULT_CONFIRMED": return "✅";
    case "NEW_TOURNAMENT": return "🆕";
    case "TOURNAMENT_JOIN_REQUEST": return "📩";
    case "TOURNAMENT_JOIN_ACCEPTED": return "✅";
    case "TOURNAMENT_JOIN_REJECTED": return "❌";
    case "TEAM_INVITE": return "🛡️";
    case "TEAM_INVITE_ACCEPTED":
    case "TEAM_JOIN_ACCEPTED": return "✅";
    case "TEAM_INVITE_REJECTED":
    case "TEAM_JOIN_REJECTED": return "❌";
    case "TEAM_JOIN_REQUEST": return "📩";
    case "TEAM_PLAYER_LEFT": return "🚪";
    case "WO_REQUESTED": return "🏳️";
    case "WO_APPROVED": return "🏳️";
    case "WO_REJECTED": return "🚫";
    default: return "🔔";
  }
}

function getNotifLink(notif: Notification): string | null {
  if (notif.linkUrl) return notif.linkUrl;
  if (!notif.relatedId) return null;
  switch (notif.type) {
    case "CASUAL_CHALLENGE": return `/duelo/${notif.relatedId}`;
    case "CASUAL_RESULT": return `/casual/${notif.relatedId}`;
    case "TOURNAMENT_INSCRIPTION":
    case "TOURNAMENT_STARTING":
    case "MATCH_ASSIGNED":
    case "ADVANCED_ROUND":
    case "ELIMINATED":
    case "TOURNAMENT_FINISHED":
      return `/torneos/${notif.relatedId}`;
    case "DISPUTE_OPENED":
      return `/arena/${notif.relatedId}`;
    case "TEAM_INVITE":
      return "/equipos/invitaciones";
    case "TEAM_INVITE_ACCEPTED":
    case "TEAM_INVITE_REJECTED":
    case "TEAM_JOIN_REQUEST":
    case "TEAM_JOIN_ACCEPTED":
    case "TEAM_JOIN_REJECTED":
    case "TEAM_PLAYER_LEFT":
      return notif.relatedId ? `/equipos/${notif.relatedId}` : null;
    default: return null;
  }
}

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  const loadMore = useCallback(async (offset: number) => {
    const batch = await getMyNotifications(PAGE_SIZE, offset);
    if (batch.length < PAGE_SIZE) setHasMore(false);
    return batch;
  }, []);

  useEffect(() => {
    (async () => {
      const initial = await loadMore(0);
      setNotifications(initial);
      setLoading(false);
    })();
  }, [loadMore]);

  async function handleLoadMore() {
    const batch = await loadMore(notifications.length);
    setNotifications((prev) => [...prev, ...batch]);
  }

  async function handleMarkRead(id: string) {
    await markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black">Notificaciones</h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="rounded-lg bg-accent/10 px-4 py-2 text-xs font-medium text-accent hover:bg-accent/20"
            >
              Marcar todas leídas
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-foreground/40">
            No tenés notificaciones
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-surface-light">
            {notifications.map((notif) => {
              const link = getNotifLink(notif);
              return (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif.id);
                    if (link) {
                      if (link.startsWith("http")) {
                        window.open(link, "_blank", "noopener,noreferrer");
                      } else {
                        router.push(link);
                      }
                    }
                  }}
                  className={`flex w-full gap-3 border-b border-surface-light px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-light ${
                    !notif.read ? "bg-accent/5" : ""
                  } ${link ? "cursor-pointer" : ""}`}
                >
                  <span className="mt-0.5 text-lg">{getNotifIcon(notif.type)}</span>
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
                    <span className="mt-1 text-[11px] text-foreground/30">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {hasMore && !loading && notifications.length > 0 && (
          <button
            onClick={handleLoadMore}
            className="mt-4 w-full rounded-lg border border-surface-light py-3 text-sm font-medium text-foreground/60 hover:border-accent hover:text-accent"
          >
            Cargar más
          </button>
        )}
      </div>
    </div>
  );
}
