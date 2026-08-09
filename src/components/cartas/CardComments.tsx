"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { addCardComment, deleteCardComment } from "@/lib/actions/card-comments";

interface CommentUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  text: string;
  createdAt: Date | string;
  user: CommentUser;
  replies: Comment[];
}

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function Avatar({ user }: { user: CommentUser }) {
  if (user.avatarUrl) {
    return (
      <Image src={user.avatarUrl} alt={user.username} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
      {user.username.charAt(0).toUpperCase()}
    </div>
  );
}

function CommentItem({
  comment,
  cardEaId,
  currentUserId,
  onRefresh,
  isReply = false,
}: {
  comment: Comment;
  cardEaId: number;
  currentUserId: string | null;
  onRefresh: () => void;
  isReply?: boolean;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReply = () => {
    if (!replyText.trim()) return;
    startTransition(async () => {
      const res = await addCardComment(cardEaId, replyText, comment.id);
      if (!("error" in res)) {
        setReplyText("");
        setShowReply(false);
        onRefresh();
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteCardComment(comment.id);
      onRefresh();
    });
  };

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      <Avatar user={comment.user} />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{comment.user.username}</span>
          <span className="text-[11px] text-foreground/40">{timeAgo(comment.createdAt)}</span>
        </div>
        <p className="mt-0.5 text-sm text-foreground/80">{comment.text}</p>
        <div className="mt-1 flex gap-3 text-[11px] text-foreground/40">
          {!isReply && currentUserId && (
            <button onClick={() => setShowReply(!showReply)} className="hover:text-accent">
              Responder
            </button>
          )}
          {currentUserId === comment.user.id && (
            <button onClick={handleDelete} disabled={isPending} className="hover:text-red-400">
              Eliminar
            </button>
          )}
        </div>

        {showReply && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Tu respuesta..."
              maxLength={500}
              className="flex-1 rounded-lg border border-surface-light bg-background/50 px-3 py-1.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
            />
            <button
              onClick={handleReply}
              disabled={isPending || !replyText.trim()}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        )}

        {comment.replies?.map((r) => (
          <CommentItem
            key={r.id}
            comment={r}
            cardEaId={cardEaId}
            currentUserId={currentUserId}
            onRefresh={onRefresh}
            isReply
          />
        ))}
      </div>
    </div>
  );
}

export function CardComments({
  cardEaId,
  initialComments,
  currentUserId,
}: {
  cardEaId: number;
  initialComments: Comment[];
  currentUserId: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newText, setNewText] = useState("");
  const [isPending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      const { getCardComments } = await import("@/lib/actions/card-comments");
      const fresh = await getCardComments(cardEaId);
      setComments(fresh as unknown as Comment[]);
    });
  };

  const handleSubmit = () => {
    if (!newText.trim()) return;
    startTransition(async () => {
      const res = await addCardComment(cardEaId, newText);
      if (!("error" in res)) {
        setNewText("");
        refresh();
      }
    });
  };

  return (
    <div>
      {currentUserId ? (
        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Opiná sobre esta carta..."
            maxLength={500}
            className="flex-1 rounded-xl border border-surface-light bg-surface/30 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-accent focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !newText.trim()}
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-background transition-colors hover:bg-accent/80 disabled:opacity-50"
          >
            Comentar
          </button>
        </div>
      ) : (
        <p className="mb-6 text-sm text-foreground/50">Iniciá sesión para comentar.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-foreground/40">Sin comentarios todavía. Sé el primero.</p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              cardEaId={cardEaId}
              currentUserId={currentUserId}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
