"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendTournamentChatMessage } from "@/lib/actions/tournament";

interface ChatMessage {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface Props {
  tournamentId: string;
  messages: ChatMessage[];
  currentUserId: string;
  creatorId: string;
}

export function TournamentChat({ tournamentId, messages, currentUserId, creatorId }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [router]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const result = await sendTournamentChatMessage(tournamentId, text);
    if (result.error) {
      setError(result.error);
    } else {
      setText("");
      router.refresh();
    }
    setSending(false);
  }

  return (
    <div className="flex h-full flex-col">
      <h3 className="mb-3 text-sm font-bold text-foreground/70">💬 Chat del torneo</h3>

      <div className="flex-1 overflow-y-auto rounded-lg border border-surface-light bg-background p-3" style={{ maxHeight: "360px", minHeight: "200px" }}>
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-foreground/30">
            Sin mensajes. Coordiná horarios y partidos acá.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.user.id === currentUserId;
              const isCreatorMsg = msg.user.id === creatorId;
              const isAdmin = msg.user.role === "ADMIN" && !isCreatorMsg;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isAdmin
                        ? "border border-red-500/30 bg-red-500/10"
                        : isCreatorMsg
                          ? "border border-gold/30 bg-gold/10"
                          : isMe
                            ? "bg-accent/10"
                            : "bg-surface-light"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isAdmin ? "text-red-400" : isCreatorMsg ? "text-gold" : "text-accent"}`}>
                        {msg.user.username}
                        {isAdmin && " (ADMIN)"}
                        {isCreatorMsg && " (ORG)"}
                      </span>
                      <span className="text-[10px] text-foreground/30">
                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/80">{msg.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {currentUserId ? (
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribir mensaje..."
            maxLength={500}
            className="flex-1 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "..." : "Enviar"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-center text-xs text-foreground/40">Iniciá sesión para chatear</p>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
