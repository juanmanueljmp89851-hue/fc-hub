"use client";

import { useState } from "react";
import {
  deleteTournament,
  deleteProde,
  deleteLobbyMessage,
  deleteLobbyMessagesBulk,
  searchUsersForNotification,
} from "@/lib/actions/admin";
import { sendAdminNotification } from "@/lib/actions/notification";
import { restoreTournament } from "@/lib/actions/tournament";
import { restoreProde } from "@/lib/actions/prode";

interface Tournament {
  id: string;
  name: string;
  status: string;
  format: string;
  createdAt: Date;
  createdBy: { username: string };
  _count: { participants: number };
}

interface DeletedTournament {
  id: string;
  name: string;
  status: string;
  format: string;
  deletedAt: Date | null;
  createdBy: { username: string };
  _count: { participants: number };
}

interface Prode {
  id: string;
  name: string;
  createdAt: Date;
  createdBy: { username: string };
  _count: { participants: number };
}

interface DeletedProde {
  id: string;
  name: string;
  deletedAt: Date | null;
  createdBy: { username: string };
  _count: { participants: number };
}

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: { username: string };
}

interface UserOption {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface Props {
  tournaments: Tournament[];
  deletedTournaments: DeletedTournament[];
  prodes: Prode[];
  deletedProdes: DeletedProde[];
  messages: Message[];
}

type Tab = "torneos" | "prodes" | "chat" | "notificar";

export function ModerationPanel({ tournaments, deletedTournaments, prodes, deletedProdes, messages }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("torneos");
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifMode, setNotifMode] = useState<"broadcast" | "self" | "specific">("self");
  const [notifTargetId, setNotifTargetId] = useState("");
  const [notifSent, setNotifSent] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "torneos", label: "Torneos", count: deletedTournaments.length },
    { key: "prodes", label: "Prodes", count: deletedProdes.length },
    { key: "chat", label: "Chat Lobby" },
    { key: "notificar", label: "Notificar" },
  ];

  async function handleDeleteTournament(id: string, name: string) {
    if (!confirm(`Eliminar PERMANENTEMENTE el torneo "${name}"? No se puede deshacer.`)) return;
    setLoading(id);
    try {
      await deleteTournament(id);
      window.location.reload();
    } catch {
      alert("Error al eliminar torneo");
    }
    setLoading(null);
  }

  async function handleRestoreTournament(id: string) {
    setLoading(`restore-${id}`);
    try {
      await restoreTournament(id);
      window.location.reload();
    } catch {
      alert("Error al restaurar torneo");
    }
    setLoading(null);
  }

  async function handleDeleteProde(id: string, name: string) {
    if (!confirm(`Eliminar PERMANENTEMENTE el prode "${name}"? No se puede deshacer.`)) return;
    setLoading(id);
    try {
      await deleteProde(id);
      window.location.reload();
    } catch {
      alert("Error al eliminar prode");
    }
    setLoading(null);
  }

  async function handleRestoreProde(id: string) {
    setLoading(`restore-${id}`);
    try {
      await restoreProde(id);
      window.location.reload();
    } catch {
      alert("Error al restaurar prode");
    }
    setLoading(null);
  }

  async function handleDeleteMessage(id: string) {
    setLoading(id);
    try {
      await deleteLobbyMessage(id);
      window.location.reload();
    } catch {
      alert("Error al eliminar mensaje");
    }
    setLoading(null);
  }

  async function handleBulkDeleteMessages() {
    if (selectedMessages.size === 0) return;
    if (!confirm(`Eliminar ${selectedMessages.size} mensajes?`)) return;
    setLoading("bulk");
    try {
      await deleteLobbyMessagesBulk(Array.from(selectedMessages));
      window.location.reload();
    } catch {
      alert("Error al eliminar mensajes");
    }
    setLoading(null);
  }

  function toggleMessage(id: string) {
    setSelectedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleUserSearch(query: string) {
    setUserSearch(query);
    setSelectedUser(null);
    setNotifTargetId("");
    if (query.length < 2) {
      setUserResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const results = await searchUsersForNotification(query);
      setUserResults(results);
    } catch {
      setUserResults([]);
    }
    setSearchingUsers(false);
  }

  function selectUser(user: UserOption) {
    setSelectedUser(user);
    setNotifTargetId(user.id);
    setUserSearch(user.username);
    setUserResults([]);
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    if (notifMode === "specific" && !notifTargetId) {
      alert("Seleccioná un usuario");
      return;
    }
    setLoading("notif");
    try {
      if (notifMode === "self") {
        // Send to self — broadcast false, need own userId
        // Use broadcast with single target: we pass no targetUserId and broadcast=false → error
        // Instead just use the search to find self, or use broadcast to all (includes self)
        // Simplest: send as broadcast to all (includes self)
        await sendAdminNotification({
          title: notifTitle,
          message: notifMessage,
          broadcast: false,
          targetUserId: "SELF", // Special marker handled below
        });
      } else {
        await sendAdminNotification({
          title: notifTitle,
          message: notifMessage,
          broadcast: notifMode === "broadcast",
          targetUserId: notifMode === "specific" ? notifTargetId : undefined,
        });
      }
      setNotifSent(true);
      setNotifTitle("");
      setNotifMessage("");
      setTimeout(() => setNotifSent(false), 3000);
    } catch {
      alert("Error al enviar notificación");
    }
    setLoading(null);
  }

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-background"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span className="ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Torneos */}
      {activeTab === "torneos" && (
        <div className="space-y-4">
          {/* Active tournaments */}
          <div className="space-y-2">
            <p className="mb-3 text-sm text-foreground/50">
              {tournaments.length} torneos activos
            </p>
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-surface-light p-3"
              >
                <div>
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-xs text-foreground/40">
                    {t.status} · {t._count.participants} jugadores · por {t.createdBy.username}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTournament(t.id, t.name)}
                  disabled={loading === t.id}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {loading === t.id ? "..." : "Eliminar permanente"}
                </button>
              </div>
            ))}
          </div>

          {/* Deleted tournaments */}
          {deletedTournaments.length > 0 && (
            <div className="space-y-2">
              <p className="mb-3 text-sm font-medium text-red-400">
                🗑️ Eliminados ({deletedTournaments.length})
              </p>
              {deletedTournaments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                >
                  <div>
                    <span className="font-medium text-foreground/50 line-through">{t.name}</span>
                    <span className="ml-2 text-xs text-foreground/30">
                      por {t.createdBy.username} · eliminado {t.deletedAt ? new Date(t.deletedAt).toLocaleDateString("es-AR") : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreTournament(t.id)}
                      disabled={loading === `restore-${t.id}`}
                      className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                    >
                      {loading === `restore-${t.id}` ? "..." : "Recuperar"}
                    </button>
                    <button
                      onClick={() => handleDeleteTournament(t.id, t.name)}
                      disabled={loading === t.id}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {loading === t.id ? "..." : "Borrar definitivo"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prodes */}
      {activeTab === "prodes" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="mb-3 text-sm text-foreground/50">
              {prodes.length} prodes activos
            </p>
            {prodes.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-surface-light p-3"
              >
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-xs text-foreground/40">
                    {p._count.participants} participantes · por {p.createdBy.username}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteProde(p.id, p.name)}
                  disabled={loading === p.id}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                >
                  {loading === p.id ? "..." : "Eliminar permanente"}
                </button>
              </div>
            ))}
          </div>

          {/* Deleted prodes */}
          {deletedProdes.length > 0 && (
            <div className="space-y-2">
              <p className="mb-3 text-sm font-medium text-red-400">
                🗑️ Eliminados ({deletedProdes.length})
              </p>
              {deletedProdes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                >
                  <div>
                    <span className="font-medium text-foreground/50 line-through">{p.name}</span>
                    <span className="ml-2 text-xs text-foreground/30">
                      por {p.createdBy.username} · eliminado {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString("es-AR") : ""}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreProde(p.id)}
                      disabled={loading === `restore-${p.id}`}
                      className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
                    >
                      {loading === `restore-${p.id}` ? "..." : "Recuperar"}
                    </button>
                    <button
                      onClick={() => handleDeleteProde(p.id, p.name)}
                      disabled={loading === p.id}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {loading === p.id ? "..." : "Borrar definitivo"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Lobby */}
      {activeTab === "chat" && (
        <div className="space-y-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-foreground/50">
              Últimos {messages.length} mensajes del lobby
            </p>
            {selectedMessages.size > 0 && (
              <button
                onClick={handleBulkDeleteMessages}
                disabled={loading === "bulk"}
                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
              >
                Eliminar {selectedMessages.size} seleccionados
              </button>
            )}
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-lg border border-surface-light p-3"
            >
              <input
                type="checkbox"
                checked={selectedMessages.has(m.id)}
                onChange={() => toggleMessage(m.id)}
                className="h-4 w-4 rounded border-surface-light accent-accent"
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-accent">{m.user.username}</span>
                <span className="ml-2 text-xs text-foreground/30">
                  {new Date(m.createdAt).toLocaleString("es-AR")}
                </span>
                <p className="mt-0.5 truncate text-sm text-foreground/70">{m.text}</p>
              </div>
              <button
                onClick={() => handleDeleteMessage(m.id)}
                disabled={loading === m.id}
                className="shrink-0 rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
              >
                {loading === m.id ? "..." : "X"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Notificar */}
      {activeTab === "notificar" && (
        <form onSubmit={handleSendNotification} className="max-w-lg space-y-4">
          <p className="text-sm text-foreground/50">
            Enviar notificación custom a usuarios
          </p>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={notifMode === "self"}
                onChange={() => setNotifMode("self")}
                className="accent-accent"
              />
              A mí mismo (test)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={notifMode === "broadcast"}
                onChange={() => setNotifMode("broadcast")}
                className="accent-accent"
              />
              Todos los usuarios
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={notifMode === "specific"}
                onChange={() => setNotifMode("specific")}
                className="accent-accent"
              />
              Usuario específico
            </label>
          </div>

          {notifMode === "specific" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuario por nombre..."
                value={userSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
              />
              {searchingUsers && (
                <span className="absolute right-3 top-2.5 text-xs text-foreground/40">buscando...</span>
              )}
              {userResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-surface-light bg-surface shadow-xl">
                  {userResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-light"
                    >
                      <span className="font-medium">{u.username}</span>
                      <span className="text-xs text-foreground/30">{u.id.slice(0, 8)}...</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <p className="mt-1 text-xs text-accent">
                  Seleccionado: {selectedUser.username}
                </p>
              )}
            </div>
          )}

          <input
            type="text"
            placeholder="Título de la notificación"
            value={notifTitle}
            onChange={(e) => setNotifTitle(e.target.value)}
            className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
            required
          />

          <textarea
            placeholder="Mensaje"
            value={notifMessage}
            onChange={(e) => setNotifMessage(e.target.value)}
            className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
            rows={3}
            required
          />

          <button
            type="submit"
            disabled={loading === "notif"}
            className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading === "notif" ? "Enviando..." : "Enviar Notificación"}
          </button>

          {notifSent && (
            <p className="text-sm font-medium text-accent">Notificación enviada</p>
          )}
        </form>
      )}
    </div>
  );
}
