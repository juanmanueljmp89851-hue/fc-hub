"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { addTeamMember } from "@/lib/actions/team";

interface Props {
  teamId: string;
  platform: string;
  mode: string;
  currentCount: number;
}

export function TeamRoster({ teamId, platform, mode, currentCount }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [shirtNumber, setShirtNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const maxMembers = mode === "CLUBS_PRO" ? 31 : 11;
  const isFull = currentCount >= maxMembers;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setMessage("");

    const result = await addTeamMember(
      teamId,
      username.trim(),
      position || undefined,
      shirtNumber ? parseInt(shirtNumber) : undefined,
    );

    if (result.error) {
      setMessage(result.error);
      setMessageType("error");
    } else {
      setMessage(`${username} agregado al equipo ✓`);
      setMessageType("success");
      setUsername("");
      setPosition("");
      setShirtNumber("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar jugador</CardTitle>
      </CardHeader>

      {isFull ? (
        <p className="text-sm text-foreground/50">Plantilla completa ({maxMembers} jugadores)</p>
      ) : (
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario en Modo Fosa"
              required
              className="col-span-5 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Posición (ej: MC, DC)"
              className="col-span-3 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              value={shirtNumber}
              onChange={(e) => setShirtNumber(e.target.value)}
              placeholder="#"
              min={1}
              max={99}
              className="col-span-2 rounded-lg border border-surface-light bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="col-span-2 rounded-lg bg-accent py-2 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : "Agregar"}
            </button>
          </div>
          <p className="text-xs text-foreground/40">
            El jugador debe estar registrado en Modo Fosa y tener su gamertag de {platform} configurado
          </p>
          {message && (
            <p className={`text-sm ${messageType === "error" ? "text-red-400" : "text-accent"}`}>
              {message}
            </p>
          )}
        </form>
      )}
    </Card>
  );
}
