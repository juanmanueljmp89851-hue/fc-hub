import { createClient } from "@/lib/supabase/server";
import { syncUserWithDB } from "@/lib/actions/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Sincronizar usuario con nuestra DB
      const user = await syncUserWithDB();

      // Si es usuario nuevo (perfil no completado), redirigir a editar perfil
      if (user && !user.profileCompleted) {
        return NextResponse.redirect(`${origin}/perfil/editar?bienvenida=1`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
