"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

/**
 * Obtiene o crea el usuario en nuestra DB a partir de la sesión de Supabase.
 * Se llama después del login/register para sincronizar.
 */
export async function syncUserWithDB() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const existing = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (existing) return existing;

  // Crear usuario nuevo — extraer datos de Supabase Auth
  const metadata = authUser.user_metadata;
  const email = authUser.email ?? "";
  const username =
    metadata?.username ??
    metadata?.full_name?.replace(/\s+/g, "").toLowerCase() ??
    email.split("@")[0];

  // Verificar username único
  let finalUsername = username;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  const newUser = await prisma.user.create({
    data: {
      supabaseId: authUser.id,
      email,
      username: finalUsername,
      avatarUrl: metadata?.avatar_url ?? null,
      bio: null,
    },
  });

  return newUser;
}

/**
 * Obtiene el usuario actual de la DB (requiere sesión activa).
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });
}

/**
 * Actualiza el perfil del usuario.
 */
export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autenticado" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
  });

  if (!dbUser) {
    return { error: "Usuario no encontrado" };
  }

  const username = formData.get("username") as string;
  const bio = formData.get("bio") as string | null;
  const psnUsername = formData.get("psnUsername") as string | null;
  const xboxUsername = formData.get("xboxUsername") as string | null;
  const pcUsername = formData.get("pcUsername") as string | null;
  const favoriteTeam = formData.get("favoriteTeam") as string | null;
  const nationality = formData.get("nationality") as string | null;
  const phone = formData.get("phone") as string | null;
  const location = formData.get("location") as string | null;
  const isDT = formData.get("isDT") === "true";

  // Validar username
  if (!username || username.length < 3) {
    return { error: "El nombre de usuario debe tener al menos 3 caracteres" };
  }

  if (username.length > 20) {
    return { error: "El nombre de usuario no puede tener más de 20 caracteres" };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: "El nombre de usuario solo puede tener letras, números y guión bajo" };
  }

  // Verificar username único (si cambió)
  if (username !== dbUser.username) {
    const existing = await prisma.user.findUnique({
      where: { username },
    });
    if (existing) {
      return { error: "Ese nombre de usuario ya está en uso" };
    }
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      username,
      bio: bio || null,
      psnUsername: psnUsername || null,
      xboxUsername: xboxUsername || null,
      pcUsername: pcUsername || null,
      favoriteTeam: favoriteTeam || null,
      nationality: nationality || null,
      phone: phone || null,
      location: location || null,
      isDT,
      profileCompleted: true,
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  return { success: true };
}

/**
 * Actualiza el avatar del usuario (URL de Supabase Storage).
 */
export async function updateAvatar(avatarUrl: string) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { error: "No autenticado" };
  }

  await prisma.user.update({
    where: { supabaseId: authUser.id },
    data: { avatarUrl },
  });

  revalidatePath("/perfil");
  revalidatePath("/perfil/editar");
  return { success: true };
}
