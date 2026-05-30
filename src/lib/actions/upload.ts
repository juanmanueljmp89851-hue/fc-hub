"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Upload tournament banner to Supabase Storage.
 * Returns public URL or error.
 */
export async function uploadTournamentBanner(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió archivo." };

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Solo se permiten imágenes JPG, PNG o WebP." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "La imagen no puede superar 5MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `tournaments/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("tournament-banners")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Error al subir: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from("tournament-banners")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}

/**
 * Upload match proof image to Supabase Storage.
 * Returns public URL or error.
 */
export async function uploadMatchProof(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "No se recibió archivo." };

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "Solo se permiten imágenes JPG, PNG o WebP." };
  }

  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "La imagen no puede superar 5MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado." };

  // Generate unique filename
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("match-proofs")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Error al subir: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from("match-proofs")
    .getPublicUrl(fileName);

  return { url: urlData.publicUrl };
}
