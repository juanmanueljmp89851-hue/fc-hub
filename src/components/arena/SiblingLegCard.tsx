"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  submitSiblingResult,
  confirmTournamentResult,
  disputeTournamentResult,
} from "@/lib/actions/tournament";
import { uploadMatchProof } from "@/lib/actions/upload";

interface SiblingMatch {
  id: string;
  leg: number | null;
  status: string;
  resultP1: number | null;
  resultP2: number | null;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  disputeCountP1: number;
  disputeCountP2: number;
  proofImageUrl: string | null;
  proofImageUrls: string[];
}

interface SiblingLegCardProps {
  currentMatch: {
    id: string;
    leg: number | null;
    resultP1: number | null;
    resultP2: number | null;
    status: string;
    player1Id: string | null;
    player2Id: string | null;
  };
  siblingMatches: SiblingMatch[];
  player1Username: string;
  player2Username: string;
  currentUserId: string;
  isPlayer: boolean;
  requireProof: boolean;
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: "Programado",
    READY_P1: "J1 listo",
    READY_P2: "J2 listo",
    IN_PROGRESS: "En curso",
    PENDING_CONFIRMATION: "Esperando confirmación",
    DISPUTED: "Disputado",
    FINISHED: "Finalizado",
    CANCELLED: "Cancelado",
  };
  return map[status] ?? status;
}

function normalizeScore(
  sibling: SiblingMatch,
  referenceP1Id: string | null
): { p1Score: number | null; p2Score: number | null } {
  if (sibling.resultP1 === null) return { p1Score: null, p2Score: null };
  if (sibling.player1Id === referenceP1Id) {
    return { p1Score: sibling.resultP1, p2Score: sibling.resultP2 };
  }
  return { p1Score: sibling.resultP2, p2Score: sibling.resultP1 };
}

export function SiblingLegCard({
  currentMatch,
  siblingMatches,
  player1Username,
  player2Username,
  currentUserId,
  isPlayer,
  requireProof,
}: SiblingLegCardProps) {
  const allLegs = [
    {
      id: currentMatch.id,
      leg: currentMatch.leg,
      status: currentMatch.status,
      resultP1: currentMatch.resultP1,
      resultP2: currentMatch.resultP2,
      player1Id: currentMatch.player1Id,
      player2Id: currentMatch.player2Id,
      isCurrent: true,
    },
    ...siblingMatches.map((s) => ({ ...s, isCurrent: false })),
  ].sort((a, b) => (a.leg ?? 0) - (b.leg ?? 0));

  // Calculate aggregate with normalized scores (always relative to currentMatch.player1)
  const refP1 = currentMatch.player1Id;
  let aggP1 = 0;
  let aggP2 = 0;
  let allFinished = true;
  for (const leg of allLegs) {
    if (leg.status !== "FINISHED") {
      allFinished = false;
      continue;
    }
    if (leg.isCurrent) {
      aggP1 += leg.resultP1 ?? 0;
      aggP2 += leg.resultP2 ?? 0;
    } else {
      const norm = normalizeScore(leg as SiblingMatch, refP1);
      aggP1 += norm.p1Score ?? 0;
      aggP2 += norm.p2Score ?? 0;
    }
  }

  return (
    <div className="border-t border-surface-light pt-6">
      <h3 className="mb-4 text-sm font-bold text-foreground/70">⚔️ Duelo completo (Ida y Vuelta)</h3>

      {/* Aggregate score */}
      <div className="mb-4 rounded-lg bg-surface p-3 text-center">
        <p className="mb-1 text-xs text-foreground/40">
          {allFinished ? "Resultado global" : "Global parcial"}
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-medium text-foreground/70">{player1Username}</span>
          <span className="text-2xl font-bold">
            <span className={aggP1 > aggP2 ? "text-accent" : ""}>{aggP1}</span>
            <span className="mx-1 text-foreground/30">-</span>
            <span className={aggP2 > aggP1 ? "text-accent" : ""}>{aggP2}</span>
          </span>
          <span className="text-sm font-medium text-foreground/70">{player2Username}</span>
        </div>
      </div>

      {/* Each leg */}
      <div className="space-y-3">
        {allLegs.map((leg) => {
          if (leg.isCurrent) {
            return (
              <div
                key={leg.id}
                className="rounded-lg border border-accent/30 bg-accent/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent">
                    {leg.leg === 1 ? "Ida" : "Vuelta"} (este partido)
                  </span>
                  <span className="text-xs text-foreground/40">{getStatusLabel(leg.status)}</span>
                </div>
                {leg.resultP1 !== null && (
                  <p className="mt-1 text-center text-lg font-bold">
                    {leg.resultP1} - {leg.resultP2}
                  </p>
                )}
              </div>
            );
          }

          return (
            <SiblingLegActions
              key={leg.id}
              sibling={leg as SiblingMatch}
              refP1Id={refP1}
              player1Username={player1Username}
              player2Username={player2Username}
              currentUserId={currentUserId}
              isPlayer={isPlayer}
              requireProof={requireProof}
            />
          );
        })}
      </div>
    </div>
  );
}

function SiblingLegActions({
  sibling,
  refP1Id,
  player1Username,
  player2Username,
  currentUserId,
  isPlayer,
  requireProof,
}: {
  sibling: SiblingMatch;
  refP1Id: string | null;
  player1Username: string;
  player2Username: string;
  currentUserId: string;
  isPlayer: boolean;
  requireProof: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isP1 = currentUserId === sibling.player1Id;
  const myDisputeCount = isP1 ? sibling.disputeCountP1 : sibling.disputeCountP2;
  const norm = normalizeScore(sibling, refP1Id);

  // Sibling labels: who is J1/J2 in sibling context
  const sibP1Label = sibling.player1Id === refP1Id ? player1Username : player2Username;
  const sibP2Label = sibling.player2Id === refP1Id ? player1Username : player2Username;

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

  async function handleSubmitResult() {
    if (scoreA === "" || scoreB === "") {
      setMessage("Completá ambos resultados.");
      return;
    }
    if (requireProof && proofFiles.length === 0) {
      setMessage("La foto de prueba es obligatoria.");
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

    const result = await submitSiblingResult(
      sibling.id,
      parseInt(scoreA) || 0,
      parseInt(scoreB) || 0,
      uploadedUrls[0] ?? "",
      uploadedUrls,
    );
    if (result.error) setMessage(result.error);
    else {
      setMessage("Resultado cargado.");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleConfirm() {
    setLoading(true);
    setMessage("");
    const result = await confirmTournamentResult(sibling.id);
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
    const result = await disputeTournamentResult(sibling.id);
    if (result.error) setMessage(result.error);
    else {
      setMessage(result.message ?? "Disputado");
      router.refresh();
    }
    setLoading(false);
  }

  const canLoadResult =
    isPlayer &&
    (sibling.status === "SCHEDULED" ||
     sibling.status === "READY_P1" ||
     sibling.status === "READY_P2" ||
     sibling.status === "IN_PROGRESS" ||
     sibling.status === "DISPUTED");

  const canConfirm = isPlayer && sibling.status === "PENDING_CONFIRMATION";

  return (
    <div className="rounded-lg border border-surface-light bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground/60">
          {sibling.leg === 1 ? "Ida" : "Vuelta"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/40">{getStatusLabel(sibling.status)}</span>
          <Link
            href={`/arena/${sibling.id}`}
            className="text-xs text-accent hover:underline"
          >
            Ver →
          </Link>
        </div>
      </div>

      {/* Show result if finished */}
      {sibling.status === "FINISHED" && norm.p1Score !== null && (
        <p className="mt-1 text-center text-lg font-bold">
          <span className="text-foreground/50">{player1Username}</span>{" "}
          {norm.p1Score} - {norm.p2Score}{" "}
          <span className="text-foreground/50">{player2Username}</span>
        </p>
      )}

      {/* Show pending result */}
      {sibling.status === "PENDING_CONFIRMATION" && sibling.resultP1 !== null && (
        <div className="mt-2">
          <p className="text-center text-sm">
            <span className="text-foreground/50">{sibP1Label}</span>{" "}
            <span className="font-bold">{sibling.resultP1} - {sibling.resultP2}</span>{" "}
            <span className="text-foreground/50">{sibP2Label}</span>
          </p>
          {canConfirm && (
            <div className="mt-2 flex justify-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="rounded bg-accent px-4 py-1.5 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "..." : "Confirmar"}
              </button>
              <button
                onClick={handleDispute}
                disabled={loading || myDisputeCount >= 2}
                className="rounded border border-red-500/50 px-4 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                {myDisputeCount >= 2 ? "Sin intentos" : "Disputar"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Load result inline */}
      {canLoadResult && (
        <div className="mt-2">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full rounded bg-accent/10 py-2 text-xs font-bold text-accent hover:bg-accent/20"
            >
              Cargar resultado de {sibling.leg === 1 ? "ida" : "vuelta"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="text-center">
                  <label className="mb-1 block text-[10px] text-foreground/50">{sibP1Label}</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-14 rounded border border-surface-light bg-surface px-2 py-1.5 text-center text-lg font-bold focus:border-accent focus:outline-none"
                  />
                </div>
                <span className="mt-4 text-foreground/40">-</span>
                <div className="text-center">
                  <label className="mb-1 block text-[10px] text-foreground/50">{sibP2Label}</label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-14 rounded border border-surface-light bg-surface px-2 py-1.5 text-center text-lg font-bold focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Proof upload */}
              <div className="rounded border border-dashed border-surface-light p-2">
                <p className="mb-1 text-[10px] text-foreground/50">
                  📷 Fotos{requireProof ? <span className="text-red-400"> *</span> : " (opcional)"}
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
                  <div className="flex flex-wrap gap-1">
                    {proofPreviews.map((preview, i) => (
                      <div key={i} className="relative">
                        <img src={preview} alt="" className="h-16 rounded object-contain" />
                        <button
                          type="button"
                          onClick={() => removeProof(i)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {proofFiles.length < 3 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-surface-light text-lg text-foreground/30 hover:border-accent hover:text-accent"
                      >
                        +
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded border border-surface-light px-3 py-1 text-xs text-foreground/50 hover:border-accent hover:text-accent"
                  >
                    Elegir imagen...
                  </button>
                )}
              </div>

              <button
                onClick={handleSubmitResult}
                disabled={loading || scoreA === "" || scoreB === "" || (requireProof && proofFiles.length === 0)}
                className="w-full rounded bg-accent py-2 text-xs font-bold text-background hover:opacity-90 disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : loading ? "Cargando..." : "Cargar resultado"}
              </button>
            </div>
          )}
        </div>
      )}

      {message && (
        <p className={`mt-1 text-xs ${message.includes("error") || message.includes("Error") || message.includes("obligatoria") ? "text-red-400" : "text-accent"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
