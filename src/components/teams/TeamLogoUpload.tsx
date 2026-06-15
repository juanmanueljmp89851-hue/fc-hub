"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateTeam } from "@/lib/actions/team";

interface TeamLogoUploadProps {
  teamId: string;
  currentUrl: string | null;
}

export function TeamLogoUpload({ teamId, currentUrl }: TeamLogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function resizeImage(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Canvas toBlob failed"))),
          "image/webp",
          0.85,
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede superar 5MB");
      return;
    }

    setUploading(true);

    try {
      const resized = await resizeImage(file, 512);
      const supabase = createClient();
      const path = `team-logos/${teamId}/${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, contentType: "image/webp" });

      if (uploadError) {
        alert("Error al subir imagen: " + uploadError.message);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      await updateTeam(teamId, { logoUrl: publicUrl });
      setPreview(publicUrl);
    } catch {
      alert("Error al subir imagen");
    }

    setUploading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-surface-light transition-colors hover:border-accent"
      >
        {preview ? (
          <Image src={preview} alt="Logo" fill className="object-contain p-1" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-2xl text-foreground/30">
            🛡️
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium text-white">
            {uploading ? "Subiendo..." : "Cambiar"}
          </span>
        </div>
      </button>
      <div>
        <p className="text-sm font-medium text-foreground/70">Escudo del equipo</p>
        <p className="text-xs text-foreground/40">PNG sin fondo recomendado. Se redimensiona a 512px.</p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/webp,image/jpeg"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
