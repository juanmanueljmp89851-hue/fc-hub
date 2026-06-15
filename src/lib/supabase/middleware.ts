import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that require authentication — redirect to /auth/login if no session */
const PROTECTED_ROUTES = [
  "/actualidad",
  "/jugadores",
  "/jugar",
  "/prode/crear",
  "/torneos/crear",
  "/equipos/crear",
  "/influencers",
  "/mensajes",
];

const PROTECTED_DYNAMIC = [
  "/prode/",
  "/escena/",
  "/equipos/",
  "/torneos/",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users from protected routes
  const pathname = request.nextUrl.pathname;
  const isExactProtected = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  const isDynamicProtected = PROTECTED_DYNAMIC.some((prefix) => pathname.startsWith(prefix) && pathname !== prefix.slice(0, -1));
  if (!user && (isExactProtected || isDynamicProtected)) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
