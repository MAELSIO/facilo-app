import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Client Supabase pour Server Components, Server Actions et Route Handlers.
 * `cookies()` est asynchrone depuis Next.js 15+ — voir AGENTS.md.
 * Créez un nouveau client à chaque requête, ne le partagez jamais entre requêtes.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (pas une Route Handler ou
            // Server Action) : les cookies ne peuvent pas être écrits ici.
            // Sans conséquence tant que proxy.ts rafraîchit la session.
          }
        },
      },
    }
  );
}

/**
 * Client Supabase avec la clé service_role — accès complet, ignore les
 * policies RLS. Réservé au serveur (webhooks Stripe, cron d'automatisation).
 * Ne jamais exposer cette clé au navigateur.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
