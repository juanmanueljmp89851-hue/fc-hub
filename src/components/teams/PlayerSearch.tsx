"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { searchUsers, sendTeamInvite } from "@/lib/actions/team";

interface SearchResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  psnUsername: string | null;
  xboxUsername: string | null;
  pcUsername: string | null;
}

interface Props {
  teamId: string;
  platform: string;
}

export function PlayerSearch({ teamId, platform }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const gamertagKey = platform === "PS5" ? "psnUsername" : platform === "XBOX" ? "xboxUsername" : "pcUsername";
  const gamertagLabel = platform === "PS5" ? "PSN" : platform === "XBOX" ? "Xbox GT" : "EA ID";

  async function handleSearch() {
    if (query.length < 2) return;
    setSearching(true);
    setMessage("");
    const users = await searchUsers(query);
    setResults(users);
    setSearching(false);
  }

  async function handleInvite(userId: string, username: string) {
    setInviting(userId);
    setMessage("");
    const result = await sendTeamInvite(teamId, userId);
    if (result.error) {
      setMessage(result.error);
      setMessageType("error");
    } else {
      setMessage(`Invitación enviada a ${username} ✓`);
      setMessageType("success");
      router.refresh();
    }
    setInviting(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar usuario por nombre..."
          className="flex-1 rounded-lg border border-surface-light bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={searching || query.length < 2}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {searching ? "..." : "Buscar"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${messageType === "error" ? "text-red-400" : "text-accent"}`}>
          {message}
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-1 rounded-lg border border-surface-light p-2">
          {results.map((user) => {
            const gamertag = user[gamertagKey as keyof SearchResult] as string | null;
            return (
              <div key={user.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-light">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm">👤</div>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium">{user.username}</span>
                    <span className="ml-2 text-xs text-foreground/40">
                      {gamertag ? `${gamertagLabel}: ${gamertag}` : `Sin ${gamertagLabel}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(user.id, user.username)}
                  disabled={inviting === user.id}
                  className="rounded-lg border border-accent px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
                >
                  {inviting === user.id ? "..." : "Invitar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
