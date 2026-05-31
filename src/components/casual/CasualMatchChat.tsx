"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendMatchMessage, invokeAdmin } from "@/lib/actions/casual";

interface ChatMessage {
  id: string;
  message: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}

interface CasualMatchChatProps {
  matchId: string;
  messages: ChatMessage[];
  currentUserId: string;
}

export function CasualMatchChat({ matchId, messages, currentUserId }: CasualMatchChatProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [invoking, setInvoking] = useState(false);
  const [invoked, setInvoked] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-refresh chat every 10s
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
    const result = await sendMatchMessage(matchId, text);
    if (result.error) {
      setError(result.error);
    } else {
      setText("");
      router.refresh();
    }
    setSending(false);
  }

  async function handleInvokeAdmin() {
    if (invoked) return;
    setInvoking(true);
    setError("");
    const result = await invokeAdmin(matchId);
    if (result.error) {
      setError(result.error);
    } else {
      setInvoked(true);
    }
    setInvoking(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground/70">💬 Chat del partido</h3>
        <button
          onClick={handleInvokeAdmin}
          disabled={invoking || invoked}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            invoked
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
          } disabled:opacity-50`}
        >
          {invoked ? "✓ Admin notificado" : invoking ? "..." : "⚠️ Invocar Admin"}
        </button>
      </div>

      {/* Messages */}
      <div className="max-h-64 min-h-[120px] overflow-y-auto rounded-lg border border-surface-light bg-background p-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-foreground/30">
            Sin mensajes. Escribí algo para coordinar con tu rival.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.user.id === currentUserId;
              const isAdmin = msg.user.role === "ADMIN";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 ${
                      isAdmin
                        ? "border border-red-500/30 bg-red-500/10"
                        : isMe
                          ? "bg-accent/10"
                          : "bg-surface-light"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold ${
                          isAdmin ? "text-red-400" : "text-accent"
                        }`}
                      >
                        {msg.user.username}
                        {isAdmin && " (ADMIN)"}
                      </span>
                      <span className="text-[10px] text-foreground/30">
                        {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-foreground/80">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
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

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
