"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  text: string;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

export function DmMessages({ messages, currentUserId }: { messages: Message[]; currentUserId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <p className="py-12 text-center text-sm text-foreground/30">Empezá la conversación</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe ? "rounded-br-md bg-accent/15" : "rounded-bl-md bg-surface-light"
                  }`}
                >
                  <p className="text-sm text-foreground/90">{msg.text}</p>
                  <span className="mt-1 block text-right text-[10px] text-foreground/30">
                    {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
