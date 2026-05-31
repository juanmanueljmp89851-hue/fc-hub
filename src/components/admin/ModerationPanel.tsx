"use client";

import { useState } from "react";
import {
  deleteTournament,
  deleteProde,
  deleteLobbyMessage,
  deleteLobbyMessagesBulk,
} from "@/lib/actions/admin";
import { sendAdminNotification } from "@/lib/actions/notification";

interface Tournament {
  id: string;
  name: string;
  status: string;
  format: string;
  createdAt: Date;
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

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: { username: string };
}

interface Props {
  tournaments: Tournament[];
  prodes: Prode[];
  messages: Message[];
}

type Tab = "torneos" | "prodes" | "chat" | "notificar";

export function ModerationPanel({ tournaments, prodes, messages }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("torneos");
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  // Notification form
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifBroadcast, setNotifBroadcast] = useState(true);
  const [notifTargetUsername, setNotifTargetUsername] = useState("");
  const [notifSent, setNotifSent] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: "torneos", label: "Torneos" },
    { key: "prodes", label: "Prodes" },
    { key: "chat", label: "Chat Lobby" },
    { key: "notificar", label: "Notificar" },
  ];

  async function handleDeleteTournament(id: string, name: string) {
    if (!confirm(`Eliminar torneo "${name}"? Esta acción es irreversible.`)) return;
    setLoading(id);
    try {
      await deleteTournament(id);
      window.location.reload();
    } catch {
      alert("Error al eliminar torneo");
    }
    setLoading(null);
  }

  async function handleDeleteProde(id: string, name: string) {
    if (!confirm(`Eliminar prode "${name}"? Esta acción es irreversible.`)) return;
    setLoading(id);
    try {
      await deleteProde(id);
      window.location.reload();
    } catch {
      alert("Error al eliminar prode");
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

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setLoading("notif");
    try {
      await sendAdminNotification({
        title: notifTitle,
        message: notifMessage,
        broadcast: notifBroadcast,
        targetUserId: notifBroadcast ? undefined : notifTargetUsername,
      });
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
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-background"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Torneos */}
      {activeTab === "torneos" && (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-foreground/50">
            {tournaments.length} torneos (últimos 30)
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
                {loading === t.id ? "..." : "Eliminar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Prodes */}
      {activeTab === "prodes" && (
        <div className="space-y-2">
          <p className="mb-3 text-sm text-foreground/50">
            {prodes.length} prodes
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
                {loading === p.id ? "..." : "Eliminar"}
              </button>
            </div>
          ))}
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

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={notifBroadcast}
                onChange={() => setNotifBroadcast(true)}
                className="accent-accent"
              />
              Todos los usuarios
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!notifBroadcast}
                onChange={() => setNotifBroadcast(false)}
                className="accent-accent"
              />
              Usuario específico
            </label>
          </div>

          {!notifBroadcast && (
            <input
              type="text"
              placeholder="ID del usuario"
              value={notifTargetUsername}
              onChange={(e) => setNotifTargetUsername(e.target.value)}
              className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
            />
          )}

          <input
            type="text"
            placeholder="Título"
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
