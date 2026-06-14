"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getConversations, getUnreadDmCount, searchUsersForDm } from "@/lib/actions/dm";

type Conversation = {
  partnerId: string;
  partnerUsername: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastDate: Date;
  unreadCount: number;
};

type SearchUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function DmInbox() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"list" | "search">("list");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsersForDm(search);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search]);

  useEffect(() => {
    if (mode === "search" && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mode]);

  async function fetchUnreadCount() {
    try {
      const count = await getUnreadDmCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }

  async function handleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setMode("list");
    setSearch("");
    setSearchResults([]);
    setLoading(true);
    try {
      const convs = await getConversations();
      setConversations(convs);
    } catch {
      // silent
    }
    setLoading(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-foreground/60 transition-colors hover:bg-surface-light hover:text-accent"
        aria-label="Mensajes"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-background shadow-md shadow-accent/40">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-14 z-50 overflow-hidden rounded-xl border border-surface-light bg-surface shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-light px-4 py-3">
            <h3 className="text-sm font-bold">
              {mode === "list" ? "Mensajes" : "Nueva conversación"}
            </h3>
            {mode === "list" ? (
              <button
                onClick={() => setMode("search")}
                className="flex items-center gap-1 rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva
              </button>
            ) : (
              <button
                onClick={() => {
                  setMode("list");
                  setSearch("");
                  setSearchResults([]);
                }}
                className="text-xs font-medium text-foreground/50 hover:text-foreground"
              >
                ← Volver
              </button>
            )}
          </div>

          {/* Search mode */}
          {mode === "search" && (
            <div className="border-b border-surface-light px-3 py-2">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="w-full rounded-lg bg-surface-light px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {mode === "search" ? (
              // Search results
              search.trim().length < 2 ? (
                <div className="py-6 text-center text-sm text-foreground/40">
                  Escribí al menos 2 letras
                </div>
              ) : searching ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-foreground/40">
                  No se encontraron usuarios
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/mensajes/${user.id}`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-light"
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-foreground/30">👤</div>
                      )}
                    </div>
                    <span className="truncate text-sm font-semibold">{user.username}</span>
                  </button>
                ))
              )
            ) : (
              // Conversations list
              loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-foreground/40">Sin conversaciones</p>
                  <button
                    onClick={() => setMode("search")}
                    className="mt-2 text-xs font-semibold text-accent hover:underline"
                  >
                    Iniciar nueva conversación
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/mensajes/${conv.partnerId}`);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-light ${
                      conv.unreadCount > 0 ? "bg-accent/5" : ""
                    }`}
                  >
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-light">
                      {conv.partnerAvatar ? (
                        <Image src={conv.partnerAvatar} alt="" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-foreground/30">👤</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{conv.partnerUsername}</span>
                        <span className="shrink-0 text-[10px] text-foreground/30">{timeAgo(conv.lastDate)}</span>
                      </div>
                      <p className="truncate text-xs text-foreground/50">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-background">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                ))
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
