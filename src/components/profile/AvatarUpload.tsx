"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatar } from "@/lib/actions/user";

interface AvatarUploadProps {
  currentUrl: string | null;
  userId: string;
}

export function AvatarUpload({ currentUrl, userId }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño
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
      const path = `avatars/${userId}/${Date.now()}.${ext}`;

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

      await updateAvatar(publicUrl);
      setPreview(publicUrl);
    } catch {
      alert("Error al subir imagen");
    }

    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-surface-light transition-colors hover:border-accent"
      >
        {preview ? (
          <Image
            src={preview}
            alt="Avatar"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface text-3xl text-foreground/30">
            👤
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-xs font-medium text-white">
            {uploading ? "Subiendo..." : "Cambiar"}
          </span>
        </div>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <p className="text-xs text-foreground/40">
        JPG, PNG o WebP. Máximo 2MB.
      </p>
    </div>
  );
}
