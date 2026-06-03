"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { getProdeMessages, getNewProdeMessages, sendProdeMessage } from "@/lib/actions/prode";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl: string | null };
}

export function ProdeChat({ prodeId, currentUserId }: { prodeId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Initial load
  useEffect(() => {
    async function load() {
      const result = await getProdeMessages(prodeId);
      setMessages(result.messages as unknown as Message[]);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
    if (isOpen) load();
  }, [prodeId, isOpen, scrollToBottom]);

  // Poll for new messages
  useEffect(() => {
    if (!isOpen) return;

    pollRef.current = setInterval(async () => {
      if (messages.length === 0) return;
      const last = messages[messages.length - 1];
      const newMsgs = await getNewProdeMessages(prodeId, last.createdAt);
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const unique = (newMsgs as unknown as Message[]).filter((m) => !ids.has(m.id));
          return [...prev, ...unique];
        });
        scrollToBottom();
      }
    }, 8000);

    return () => clearInterval(pollRef.current);
  }, [prodeId, isOpen, messages, scrollToBottom]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);

    const result = await sendProdeMessage(prodeId, text.trim());
    if (result.success && result.message) {
      setMessages((prev) => [...prev, result.message as unknown as Message]);
      setText("");
      setTimeout(scrollToBottom, 50);
    }
    setSending(false);
  }

  // Collapsed state — show button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-surface-light bg-surface/50 px-4 py-3 transition-colors hover:border-accent/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="font-medium">Chat del Prode</span>
        </div>
        {messages.length > 0 && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-surface-light bg-surface/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-bold">Chat del Prode</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-foreground/40 hover:text-foreground/70"
        >
          Minimizar ▾
        </button>
      </div>

      {/* Messages */}
      <div className="flex h-80 flex-col overflow-y-auto px-3 py-2">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-foreground/30">Cargando...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="text-sm text-foreground/30">No hay mensajes. Sé el primero!</span>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMe = msg.user.id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface">
                    {msg.user.avatarUrl ? (
                      <Image src={msg.user.avatarUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-foreground/30">
                        👤
                      </div>
                    )}
                  </div>
                  <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                    <p className="text-[10px] text-foreground/40">{msg.user.username}</p>
                    <div
                      className={`inline-block rounded-xl px-3 py-1.5 text-sm ${
                        isMe
                          ? "bg-accent/20 text-accent"
                          : "bg-surface-light/50 text-foreground/80"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <p className="mt-0.5 text-[10px] text-foreground/20">
                      {new Date(msg.createdAt).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t border-surface-light p-2.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí un mensaje..."
          maxLength={500}
          className="flex-1 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
