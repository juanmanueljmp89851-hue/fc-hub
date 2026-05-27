"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  acceptChallenge,
  rejectChallenge,
  cancelChallenge,
  submitCasualResult,
  confirmCasualResult,
  disputeCasualResult,
} from "@/lib/actions/casual";
import { uploadMatchProof } from "@/lib/actions/upload";
import { getCurrentUser } from "@/lib/actions/user";

interface CasualMatchActionsProps {
  matchId: string;
  status: string;
  challengerId: string;
  challengedId: string;
  resultChallenger: number | null;
  resultChallenged: number | null;
}

export function CasualMatchActions({
  matchId,
  status,
  challengerId,
  challengedId,
  resultChallenger,
  resultChallenged,
}: CasualMatchActionsProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user) setUserId(user.id);
    }
    load();
  }, []);

  if (!userId) return null;

  const isChallenger = userId === challengerId;
  const isChallenged = userId === challengedId;
  if (!isChallenger && !isChallenged) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Solo se permiten imágenes JPG, PNG o WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("La imagen no puede superar 5MB.");
      return;
    }

    setProofFile(file);
    setMessage("");

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAction(action: () => Promise<{ error?: string; success?: boolean; message?: string }>) {
    setLoading(true);
    setMessage("");
    const result = await action();
    if (result.error) {
      setMessage(result.error);
    } else {
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
    if (!proofFile) {
      setMessage("La foto de prueba es obligatoria. Subí una captura del resultado.");
      return;
    }

    setLoading(true);
    setUploading(true);
    setMessage("");

    // Upload proof image
    const formData = new FormData();
    formData.set("file", proofFile);
    const uploadResult = await uploadMatchProof(formData);

    if (uploadResult.error) {
      setMessage(uploadResult.error);
      setLoading(false);
      setUploading(false);
      return;
    }

    setUploading(false);

    // Submit result with proof URL
    const result = await submitCasualResult(
      matchId,
      parseInt(scoreA) || 0,
      parseInt(scoreB) || 0,
      uploadResult.url!,
    );

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Resultado cargado. Esperando confirmación del rival.");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* PENDING: challenged accepts/rejects, challenger cancels */}
      {status === "PENDING" && isChallenged && (
        <div className="flex gap-3">
          <button
            onClick={() => handleAction(() => acceptChallenge(matchId))}
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Aceptando..." : "Aceptar desafío"}
          </button>
          <button
            onClick={() => handleAction(() => rejectChallenge(matchId))}
            disabled={loading}
            className="rounded-lg border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      )}

      {status === "PENDING" && isChallenger && (
        <button
          onClick={() => handleAction(() => cancelChallenge(matchId))}
          disabled={loading}
          className="rounded-lg border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
        >
          {loading ? "Cancelando..." : "Cancelar desafío"}
        </button>
      )}

      {/* IN_PROGRESS or DISPUTED: submit result with proof */}
      {(status === "IN_PROGRESS" || status === "DISPUTED") && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground/70">
            {status === "DISPUTED" ? "Resultado disputado. Cargá de nuevo:" : "Cargá el resultado:"}
          </p>

          {/* Score inputs */}
          <div className="flex items-center gap-3">
            <div className="text-center">
              <label className="mb-1 block text-xs text-foreground/50">Retador</label>
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
              <label className="mb-1 block text-xs text-foreground/50">Desafiado</label>
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

          {/* Photo proof upload */}
          <div className="rounded-lg border border-dashed border-surface-light p-4">
            <p className="mb-2 text-xs font-medium text-foreground/60">
              📷 Foto de prueba <span className="text-red-400">*obligatoria</span>
            </p>
            <p className="mb-3 text-[11px] text-foreground/40">
              Subí una captura de pantalla del resultado final del partido.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {proofPreview ? (
              <div className="relative">
                <img
                  src={proofPreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg object-contain"
                />
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    setProofPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  ✕
                </button>
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

          {/* Submit button */}
          <button
            onClick={handleSubmitResult}
            disabled={loading || scoreA === "" || scoreB === "" || !proofFile}
            className="w-full rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? "Subiendo foto..." : loading ? "Cargando resultado..." : "Cargar resultado"}
          </button>
        </div>
      )}

      {/* PENDING_CONFIRMATION: other player confirms/disputes */}
      {status === "PENDING_CONFIRMATION" && (
        <div className="space-y-3">
          <p className="text-sm text-foreground/70">
            Resultado cargado:{" "}
            <span className="font-bold text-foreground">
              {resultChallenger} - {resultChallenged}
            </span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleAction(() => confirmCasualResult(matchId))}
              disabled={loading}
              className="rounded-lg bg-accent px-5 py-2.5 font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Confirmando..." : "Confirmar resultado"}
            </button>
            <button
              onClick={() => handleAction(() => disputeCasualResult(matchId))}
              disabled={loading}
              className="rounded-lg border border-red-500/50 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Disputar
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.includes("error") || message.includes("Error") || message.includes("obligatoria") || message.includes("No") || message.includes("Solo") || message.includes("superar")
              ? "text-red-400"
              : "text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
