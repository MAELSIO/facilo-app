import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée du lien magique envoyé par email (voir app/login).
 * Configurez le template "Magic Link" dans Supabase (Auth > Email
 * Templates) pour qu'il pointe vers :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 * (Le template par défaut de Supabase fonctionne déjà ainsi dans la
 * plupart des cas récents — vérifiez simplement le champ "Redirect URL"
 * dans la config Auth pointe vers votre domaine.)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/auth/error");
}
