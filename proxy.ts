import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 a renommé "Middleware" en "Proxy" (même mécanisme, fichier
 * `proxy.ts` à la racine). Rôle ici : rafraîchir la session Supabase à
 * chaque navigation, et bloquer l'accès à /dashboard si non connecté.
 *
 * La vérification de l'abonnement actif (pas juste "connecté") se fait
 * dans app/dashboard/layout.tsx, pas ici — le proxy n'est pas censé faire
 * de requêtes lentes (voir doc Next.js), on se limite à un contrôle
 * optimiste de session.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
