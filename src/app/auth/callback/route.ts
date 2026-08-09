import { createClient } from "@/lib/supabase/server";
import { syncUserWithDB } from "@/lib/actions/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";
  const ref = searchParams.get("ref") ?? undefined;

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Leer referral_code de metadata (email signup) o query param (OAuth)
      const referralCode = ref ?? data.user?.user_metadata?.referral_code ?? undefined;

      // Sincronizar usuario con nuestra DB
      const user = await syncUserWithDB(referralCode);

      // Si es usuario nuevo (perfil no completado), redirigir a editar perfil
      if (user && !user.profileCompleted) {
        return NextResponse.redirect(`${origin}/perfil/editar?bienvenida=1`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
