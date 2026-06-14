"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendDirectMessage } from "@/lib/actions/dm";

export function DmChatInput({ receiverId }: { receiverId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const result = await sendDirectMessage(receiverId, text);
    if (result.error) {
      setError(result.error);
    } else {
      setText("");
      router.refresh();
    }
    setSending(false);
  }

  return (
    <div className="border-t border-surface-light p-3">
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
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
