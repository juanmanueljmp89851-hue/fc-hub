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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten imágenes");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar 2MB");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `team-logos/${teamId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

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
        <p className="text-xs text-foreground/40">PNG sin fondo recomendado. Máx 2MB.</p>
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
