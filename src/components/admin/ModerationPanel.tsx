"use client";

import { useState } from "react";
import Image from "next/image";
import {
  deleteTournament,
  deleteProde,
  deleteLobbyMessage,
  deleteLobbyMessagesBulk,
  searchUsersForNotification,
  adminSendMatchMessage,
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

interface DuelPlayer {
  id: string;
  username: string;
  avatarUrl: string | null;
  psnUsername: string | null;
  xboxUsername: string | null;
  pcUsername: string | null;
}

interface DuelMessage {
  id: string;
  message: string;
  createdAt: Date;
  user: { id: string; username: string };
}

interface Duel {
  id: string;
  status: string;
  createdAt: Date;
  resultChallenger: number | null;
  resultChallenged: number | null;
  challenger: DuelPlayer;
  challenged: DuelPlayer;
  messages: DuelMessage[];
}

interface Props {
  tournaments: Tournament[];
  deletedTournaments: DeletedTournament[];
  prodes: Prode[];
  deletedProdes: DeletedProde[];
  messages: Message[];
  duels: Duel[];
}

type Tab = "torneos" | "prodes" | "chat" | "duelos" | "notificar";

export function ModerationPanel({ tournaments, deletedTournaments, prodes, deletedProdes, messages, duels }: Props) {
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
  const [notifLinkUrl, setNotifLinkUrl] = useState("");

  // Duelos state
  const [expandedDuel, setExpandedDuel] = useState<string | null>(null);
  const [duelMsgText, setDuelMsgText] = useState("");
  const [sendingDuelMsg, setSendingDuelMsg] = useState(false);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "torneos", label: "Torneos", count: deletedTournaments.length },
    { key: "prodes", label: "Prodes", count: deletedProdes.length },
    { key: "chat", label: "Chat Lobby" },
    { key: "duelos", label: "Duelos", count: duels.length },
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

  async function handleSendDuelMessage(duelId: string) {
    if (!duelMsgText.trim()) return;
    setSendingDuelMsg(true);
    try {
      await adminSendMatchMessage(duelId, duelMsgText.trim());
      setDuelMsgText("");
      window.location.reload();
    } catch {
      alert("Error al enviar mensaje");
    }
    setSendingDuelMsg(false);
  }

  function duelStatusLabel(status: string) {
    switch (status) {
      case "PENDING": return "⏳ Pendiente";
      case "IN_PROGRESS": return "🎮 En juego";
      case "FINISHED": return "✅ Finalizado";
      case "REJECTED": return "❌ Rechazado";
      case "CANCELLED": return "🚫 Cancelado";
      default: return status;
    }
  }

  function duelStatusColor(status: string) {
    switch (status) {
      case "PENDING": return "text-yellow-400";
      case "IN_PROGRESS": return "text-blue-400";
      case "FINISHED": return "text-green-400";
      case "REJECTED": return "text-red-400";
      case "CANCELLED": return "text-foreground/40";
      default: return "text-foreground/60";
    }
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
      const linkVal = notifLinkUrl.trim() || undefined;
      if (notifMode === "self") {
        await sendAdminNotification({
          title: notifTitle,
          message: notifMessage,
          broadcast: false,
          targetUserId: "SELF",
          linkUrl: linkVal,
        });
      } else {
        await sendAdminNotification({
          title: notifTitle,
          message: notifMessage,
          broadcast: notifMode === "broadcast",
          targetUserId: notifMode === "specific" ? notifTargetId : undefined,
          linkUrl: linkVal,
        });
      }
      setNotifSent(true);
      setNotifTitle("");
      setNotifMessage("");
      setNotifLinkUrl("");
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

      {/* Duelos */}
      {activeTab === "duelos" && (
        <div className="space-y-3">
          <p className="mb-3 text-sm text-foreground/50">
            Últimos {duels.length} desafíos entre usuarios
          </p>

          {duels.length === 0 ? (
            <p className="py-8 text-center text-sm text-foreground/40">No hay duelos registrados</p>
          ) : (
            duels.map((d) => {
              const isExpanded = expandedDuel === d.id;
              return (
                <div
                  key={d.id}
                  className="overflow-hidden rounded-lg border border-surface-light"
                >
                  {/* Duel header */}
                  <button
                    onClick={() => setExpandedDuel(isExpanded ? null : d.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-light/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-accent">{d.challenger.username}</span>
                        <span className="text-xs text-foreground/40">vs</span>
                        <span className="font-semibold text-accent">{d.challenged.username}</span>
                        {d.resultChallenger != null && d.resultChallenged != null && (
                          <span className="ml-1 rounded bg-surface-light px-2 py-0.5 text-xs font-bold">
                            {d.resultChallenger} - {d.resultChallenged}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-foreground/40">
                        <span className={duelStatusColor(d.status)}>{duelStatusLabel(d.status)}</span>
                        <span>{new Date(d.createdAt).toLocaleString("es-AR")}</span>
                        {d.messages.length > 0 && (
                          <span>💬 {d.messages.length} msgs</span>
                        )}
                      </div>
                    </div>
                    <span className="text-foreground/30">{isExpanded ? "▲" : "▼"}</span>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-surface-light bg-surface/50 p-4">
                      {/* Player cards */}
                      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[d.challenger, d.challenged].map((player, idx) => (
                          <div key={player.id} className="rounded-lg border border-surface-light bg-background p-3">
                            <div className="mb-2 flex items-center gap-2">
                              {player.avatarUrl ? (
                                <Image src={player.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                                  {player.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className="text-sm font-bold">{player.username}</span>
                                <span className="ml-1 text-xs text-foreground/40">
                                  ({idx === 0 ? "Retador" : "Retado"})
                                </span>
                              </div>
                            </div>
                            <div className="space-y-0.5 text-xs text-foreground/50">
                              {player.psnUsername && (
                                <p>🎮 PSN: <span className="font-medium text-foreground/70">{player.psnUsername}</span></p>
                              )}
                              {player.xboxUsername && (
                                <p>🟢 Xbox: <span className="font-medium text-foreground/70">{player.xboxUsername}</span></p>
                              )}
                              {player.pcUsername && (
                                <p>💻 PC: <span className="font-medium text-foreground/70">{player.pcUsername}</span></p>
                              )}
                              {!player.psnUsername && !player.xboxUsername && !player.pcUsername && (
                                <p className="italic text-foreground/30">Sin gamertags</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat messages */}
                      <div className="mb-3">
                        <p className="mb-2 text-xs font-bold text-foreground/50">
                          Chat del duelo ({d.messages.length})
                        </p>
                        {d.messages.length === 0 ? (
                          <p className="py-3 text-center text-xs text-foreground/30">Sin mensajes</p>
                        ) : (
                          <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-surface-light bg-background p-2">
                            {d.messages.map((msg) => (
                              <div key={msg.id} className="rounded px-2 py-1.5 text-sm">
                                <span className="font-bold text-accent">{msg.user.username}</span>
                                <span className="ml-2 text-xs text-foreground/30">
                                  {new Date(msg.createdAt).toLocaleString("es-AR")}
                                </span>
                                <p className="mt-0.5 text-foreground/70">{msg.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Admin message input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Escribir como admin..."
                          value={expandedDuel === d.id ? duelMsgText : ""}
                          onChange={(e) => setDuelMsgText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendDuelMessage(d.id);
                            }
                          }}
                          className="flex-1 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
                        />
                        <button
                          onClick={() => handleSendDuelMessage(d.id)}
                          disabled={sendingDuelMsg || !duelMsgText.trim()}
                          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {sendingDuelMsg ? "..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
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

          <input
            type="url"
            placeholder="Link (opcional) — https://..."
            value={notifLinkUrl}
            onChange={(e) => setNotifLinkUrl(e.target.value)}
            className="w-full rounded-lg border border-surface-light bg-background px-3 py-2 text-sm"
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
