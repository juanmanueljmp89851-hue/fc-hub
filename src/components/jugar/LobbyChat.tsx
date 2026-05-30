"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getLobbyMessages, sendLobbyMessage } from "@/lib/actions/lobby";
import { challengeUser } from "@/lib/actions/casual";

interface LobbyMsg {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    rankingPoints: number;
  };
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

interface OnlineUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export function LobbyChat() {
  const [messages, setMessages] = useState<LobbyMsg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [challengeStatus, setChallengeStatus] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Check auth + get current user id
    const supabase = createClient();
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
      if (data.user) {
        // Fetch DB user id + join presence
        fetch("/api/me")
          .then((r) => r.json())
          .then((d) => {
            setCurrentUserId(d.id ?? null);
            if (d.id && d.username) {
              // Join presence channel
              presenceChannel = supabase.channel("lobby-presence");
              presenceChannel
                .on("presence", { event: "sync" }, () => {
                  const state = presenceChannel!.presenceState<OnlineUser>();
                  const users: OnlineUser[] = [];
                  const seen = new Set<string>();
                  for (const key of Object.keys(state)) {
                    for (const presence of state[key]) {
                      if (!seen.has(presence.id)) {
                        seen.add(presence.id);
                        users.push({ id: presence.id, username: presence.username, avatarUrl: presence.avatarUrl });
                      }
                    }
                  }
                  setOnlineUsers(users);
                })
                .subscribe(async (status) => {
                  if (status === "SUBSCRIBED") {
                    await presenceChannel!.track({
                      id: d.id,
                      username: d.username,
                      avatarUrl: d.avatarUrl ?? null,
                    });
                  }
                });
            }
          })
          .catch(() => {});
      }
    });

    // Load initial messages
    getLobbyMessages(100)
      .then((data) => {
        setMessages((data as LobbyMsg[]).reverse());
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Subscribe to realtime lobby channel
    const channel = supabase
      .channel("lobby-chat")
      .on("broadcast", { event: "new-message" }, (payload) => {
        const msg = payload.payload as LobbyMsg;
        setMessages((prev) => [...prev, msg]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, []);

  useEffect(() => {
    // Skip auto-scroll on initial message load (prevents page jumping to chat bottom)
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    // Auto-scroll to bottom only on NEW messages (not initial load)
    if (bottomRef.current && chatRef.current) {
      const chat = chatRef.current;
      const isNearBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 150;
      if (isNearBottom) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuthPrompt(true);
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);
    setError("");
    const result = await sendLobbyMessage(text);

    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("message" in result && result.message) {
      const newMsg = result.message as LobbyMsg;
      setMessages((prev) => [...prev, newMsg]);
      setText("");

      // Broadcast to other users via Supabase Realtime
      const supabase = createClient();
      await supabase.channel("lobby-chat").send({
        type: "broadcast",
        event: "new-message",
        payload: newMsg,
      });
    }
    setSubmitting(false);
  }

  async function handleChallenge(userId: string, username: string) {
    if (!isLoggedIn) {
      setShowAuthPrompt(true);
      return;
    }

    setChallengeStatus((prev) => ({ ...prev, [userId]: "sending" }));
    const result = await challengeUser(userId);

    if ("error" in result && result.error) {
      setChallengeStatus((prev) => ({ ...prev, [userId]: result.error as string }));
      setTimeout(() => {
        setChallengeStatus((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3000);
    } else {
      setChallengeStatus((prev) => ({ ...prev, [userId]: `¡Desafío enviado a ${username}!` }));
      setTimeout(() => {
        setChallengeStatus((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3000);
    }
  }

  return (
    <div className="flex rounded-xl border border-surface-light bg-surface">
      {/* Chat column */}
      <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <h3 className="font-bold">Lobby</h3>
          <span className="text-xs text-foreground/40">Chat general</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="text-xs text-foreground/50">En vivo</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 space-y-1 overflow-y-auto px-4 py-3"
        style={{ minHeight: "320px", maxHeight: "480px" }}
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-2">
                <div className="h-7 w-7 rounded-full bg-surface-light shrink-0" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded bg-surface-light mb-1" />
                  <div className="h-3 w-3/4 rounded bg-surface-light" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-foreground/40">
              Sé el primero en escribir en el lobby 🎮
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.user.id === currentUserId;
            const challengeSt = challengeStatus[msg.user.id];

            return (
              <div
                key={msg.id}
                className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-light/50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-light">
                  {msg.user.avatarUrl ? (
                    <Image
                      src={msg.user.avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-foreground/30">
                      👤
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isMe ? "text-accent" : "text-foreground/70"}`}>
                      {msg.user.username}
                    </span>
                    {msg.user.rankingPoints > 0 && (
                      <span className="text-[10px] text-accent/60">
                        {msg.user.rankingPoints}pts
                      </span>
                    )}
                    <span className="text-[10px] text-foreground/30">
                      {timeAgo(msg.createdAt)}
                    </span>

                    {/* Challenge button — hidden for self, shown on hover */}
                    {!isMe && currentUserId && (
                      <button
                        onClick={() => handleChallenge(msg.user.id, msg.user.username)}
                        disabled={!!challengeSt}
                        className="ml-auto hidden text-[10px] font-bold text-accent opacity-0 transition-opacity group-hover:inline-block group-hover:opacity-100 hover:text-accent/80 disabled:opacity-50"
                      >
                        {challengeSt === "sending"
                          ? "⏳"
                          : challengeSt
                            ? challengeSt
                            : "⚔️ Desafiar"}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/80 break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-surface-light px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setShowAuthPrompt(false);
            }}
            onFocus={() => {
              if (!isLoggedIn) setShowAuthPrompt(true);
            }}
            placeholder={isLoggedIn ? "Escribí algo..." : "Registrate para chatear..."}
            maxLength={500}
            className="flex-1 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "..." : "Enviar"}
          </button>
        </form>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {showAuthPrompt && !isLoggedIn && (
          <div className="mt-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
            <p className="text-foreground/80">
              🎮 <strong>Registrate</strong> para chatear y desafiar rivales.
            </p>
            <div className="mt-2 flex gap-2">
              <Link
                href="/auth/register"
                className="rounded-md bg-accent px-3 py-1 text-xs font-bold text-background hover:opacity-90"
              >
                Registrarse
              </Link>
              <Link
                href="/auth/login"
                className="rounded-md border border-surface-light px-3 py-1 text-xs font-medium text-foreground/70 hover:border-accent"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>{/* end chat column */}

      {/* Online users sidebar */}
      <div className="hidden w-44 shrink-0 border-l border-surface-light md:block">
        <div className="border-b border-surface-light px-3 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-xs font-bold text-foreground/70">
              Conectados{onlineUsers.length > 0 ? ` (${onlineUsers.length})` : ""}
            </span>
          </div>
        </div>
        <div className="overflow-y-auto p-2" style={{ maxHeight: "420px" }}>
          {onlineUsers.length === 0 ? (
            <p className="px-1 py-2 text-[10px] text-foreground/30">
              {isLoggedIn ? "Esperando usuarios..." : "Iniciá sesión para ver conectados"}
            </p>
          ) : (
            <div className="space-y-1">
              {onlineUsers.map((user) => {
                const isMe = user.id === currentUserId;
                const challengeSt = challengeStatus[user.id];
                return (
                  <div
                    key={user.id}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-light/50"
                  >
                    <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] text-foreground/30">👤</div>
                      )}
                    </div>
                    <span className={`flex-1 truncate text-[11px] font-medium ${isMe ? "text-accent" : "text-foreground/70"}`}>
                      {user.username}{isMe ? " (vos)" : ""}
                    </span>
                    {!isMe && currentUserId && !challengeSt && (
                      <button
                        onClick={() => handleChallenge(user.id, user.username)}
                        className="hidden text-[9px] font-bold text-accent group-hover:inline-block"
                        title={`Desafiar a ${user.username}`}
                      >
                        ⚔️
                      </button>
                    )}
                    {challengeSt && (
                      <span className="text-[9px] text-foreground/40">{challengeSt === "sending" ? "⏳" : "✓"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
