"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  readyToPlay,
  submitTournamentResult,
  confirmTournamentResult,
  disputeTournamentResult,
} from "@/lib/actions/tournament";
import { uploadMatchProof } from "@/lib/actions/upload";

interface ArenaMatchActionsProps {
  matchId: string;
  status: string;
  player1Id: string;
  player2Id: string;
  resultP1: number | null;
  resultP2: number | null;
  currentUserId: string;
  disputeCountP1: number;
  disputeCountP2: number;
  requireProof?: boolean;
}

export function ArenaMatchActions({
  matchId,
  status,
  player1Id,
  player2Id,
  resultP1,
  resultP2,
  currentUserId,
  disputeCountP1,
  disputeCountP2,
  requireProof = false,
}: ArenaMatchActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isP1 = currentUserId === player1Id;
  const isP2 = currentUserId === player2Id;
  const myDisputeCount = isP1 ? disputeCountP1 : disputeCountP2;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 3 - proofFiles.length;
    const toAdd = files.slice(0, remaining);
    for (const file of toAdd) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setMessage("Solo se permiten imágenes JPG, PNG o WebP.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage("La imagen no puede superar 5MB.");
        return;
      }
    }
    setMessage("");
    const newFiles = [...proofFiles, ...toAdd];
    setProofFiles(newFiles);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setProofPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeProof(index: number) {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
    setProofPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleReady() {
    setLoading(true);
    setMessage("");
    const result = await readyToPlay(matchId);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Listo");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleSubmitResult() {
    if (scoreA === "" || scoreB === "") {
      setMessage("Completá ambos resultados.");
      return;
    }
    if (requireProof && proofFiles.length === 0) {
      setMessage("La foto de prueba es obligatoria en este torneo.");
      return;
    }
    setLoading(true);
    setUploading(true);
    setMessage("");

    const uploadedUrls: string[] = [];
    for (const file of proofFiles) {
      const formData = new FormData();
      formData.set("file", file);
      const uploadResult = await uploadMatchProof(formData);
      if (uploadResult.error) {
        setMessage(uploadResult.error);
        setLoading(false);
        setUploading(false);
        return;
      }
      uploadedUrls.push(uploadResult.url!);
    }
    setUploading(false);

    const result = await submitTournamentResult(
      matchId,
      parseInt(scoreA) || 0,
      parseInt(scoreB) || 0,
      uploadedUrls[0] ?? "",
      uploadedUrls,
    );
    if (result.error) setMessage(result.error);
    else {
      setMessage("Resultado cargado. Esperando confirmación del rival.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleConfirm() {
    setLoading(true);
    setMessage("");
    const result = await confirmTournamentResult(matchId);
    if (result.error) setMessage(result.error);
    else {
      setMessage("Resultado confirmado");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDispute() {
    setLoading(true);
    setMessage("");
    const result = await disputeTournamentResult(matchId);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Disputado");
      router.refresh();
    }
    setLoading(false);
  }

  // Determine if current player already clicked ready
  const alreadyReady =
    (status === "READY_P1" && isP1) || (status === "READY_P2" && isP2);

  return (
    <div className="space-y-4">
      {/* SCHEDULED / READY: show "Jugar ahora" button */}
      {(status === "SCHEDULED" || status === "READY_P1" || status === "READY_P2") && (
        <div className="text-center">
          {alreadyReady ? (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                Esperando al rival...
              </div>
            </div>
          ) : (
            <button
              onClick={handleReady}
              disabled={loading}
              className="rounded-lg bg-accent px-8 py-3 text-lg font-bold text-background transition-all hover:scale-105 hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : "🎮 Jugar ahora"}
            </button>
          )}
          {status === "SCHEDULED" && (
            <p className="mt-2 text-xs text-foreground/40">
              Ambos jugadores deben presionar &quot;Jugar ahora&quot; para comenzar
            </p>
          )}
        </div>
      )}

      {/* IN_PROGRESS or DISPUTED: submit result */}
      {(status === "IN_PROGRESS" || status === "DISPUTED") && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground/70">
            {status === "DISPUTED" ? "Resultado disputado. Cargá de nuevo:" : "Cargá el resultado:"}
          </p>

          <div className="flex items-center gap-3">
            <div className="text-center">
              <label className="mb-1 block text-xs text-foreground/50">Jugador 1</label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-16 rounded-lg border border-surface-light bg-background px-3 py-2 text-center text-lg font-bold text-foreground focus:border-accent focus:outline-none"
              />
            </div>
            <span className="mt-5 text-foreground/40">-</span>
            <div className="text-center">
              <label className="mb-1 block text-xs text-foreground/50">Jugador 2</label>
              <input
                type="number"
                min="0"
                max="99"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-16 rounded-lg border border-surface-light bg-background px-3 py-2 text-center text-lg font-bold text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Photo proof */}
          <div className="rounded-lg border border-dashed border-surface-light p-4">
            <p className="mb-2 text-xs font-medium text-foreground/60">
              📷 Fotos de prueba (máx. 3)
              {requireProof
                ? <span className="text-red-400"> *obligatoria</span>
                : <span className="text-foreground/40"> — opcional</span>
              }
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            {proofPreviews.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {proofPreviews.map((preview, i) => (
                  <div key={i} className="relative">
                    <img src={preview} alt={`Proof ${i + 1}`} className="h-24 rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={() => removeProof(i)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {proofFiles.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-surface-light text-2xl text-foreground/30 transition-colors hover:border-accent hover:text-accent"
                  >
                    +
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-surface-light bg-background px-4 py-2 text-sm text-foreground/60 transition-colors hover:border-accent hover:text-accent"
              >
                Elegir imagen...
              </button>
            )}
          </div>

          <button
            onClick={handleSubmitResult}
            disabled={loading || scoreA === "" || scoreB === "" || (requireProof && proofFiles.length === 0)}
            className="w-full rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Subiendo fotos..." : loading ? "Cargando..." : "Cargar resultado"}
          </button>
        </div>
      )}

      {/* PENDING_CONFIRMATION */}
      {status === "PENDING_CONFIRMATION" && (
        <div className="space-y-3">
          <p className="text-sm text-foreground/70">
            Resultado cargado:{" "}
            <span className="font-bold text-foreground">{resultP1} - {resultP2}</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : "Confirmar resultado"}
            </button>
            <button
              onClick={handleDispute}
              disabled={loading || myDisputeCount >= 2}
              className="rounded-lg border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              {myDisputeCount >= 2 ? "Sin intentos" : "Disputar"}
            </button>
          </div>
          {myDisputeCount > 0 && (
            <p className="text-xs text-foreground/40">
              Disputas usadas: {myDisputeCount}/2
              {myDisputeCount >= 2 && " — Se notificará al admin si ambos agotan intentos."}
            </p>
          )}
        </div>
      )}

      {message && (
        <p className={`text-sm ${
          message.includes("error") || message.includes("Error") || message.includes("obligatoria") || message.includes("inválido")
            ? "text-red-400"
            : "text-accent"
        }`}>
          {message}
        </p>
      )}
    </div>
  );
}
