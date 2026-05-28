"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getInfluencerComments, addInfluencerComment } from "@/lib/actions/comments";
import { createClient } from "@/lib/supabase/client";

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days}d`;
  return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function CommentSection({ influencerId }: { influencerId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    // Check auth
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });

    // Load comments
    getInfluencerComments(influencerId)
      .then((data) => setComments(data as Comment[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [influencerId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuthPrompt(true);
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);
    setError("");
    const result = await addInfluencerComment(influencerId, text);

    if ("error" in result && result.error) {
      setError(result.error);
    } else if ("comment" in result && result.comment) {
      setComments((prev) => [result.comment as Comment, ...prev]);
      setText("");
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-6 border-t border-surface-light pt-6">
      <h4 className="mb-4 text-sm font-bold text-foreground/70">
        Comentarios ({comments.length})
      </h4>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
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
            placeholder={isLoggedIn ? "Dejá tu opinión..." : "Registrate para comentar..."}
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
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {showAuthPrompt && !isLoggedIn && (
          <div className="mt-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
            <p className="text-foreground/80">
              📝 <strong>Registrate</strong> para responder o participar de la conversación.
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
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-surface-light" />
                <div className="h-3 w-20 rounded bg-surface-light" />
              </div>
              <div className="ml-8 mt-1 h-3 w-3/4 rounded bg-surface-light" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-foreground/40">
          Sé el primero en comentar sobre este creador
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              <div className="flex items-center gap-2">
                <div className="relative h-6 w-6 overflow-hidden rounded-full bg-surface-light">
                  {comment.user.avatarUrl ? (
                    <Image
                      src={comment.user.avatarUrl}
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
                <span className="text-xs font-bold text-foreground/70">
                  {comment.user.username}
                </span>
                <span className="text-[10px] text-foreground/30">
                  {timeAgo(comment.createdAt)}
                </span>
              </div>
              <p className="ml-8 text-sm text-foreground/60">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
