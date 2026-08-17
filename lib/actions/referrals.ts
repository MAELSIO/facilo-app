"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

function generateCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Retourne le code de parrainage de l'utilisateur connecté, en le créant s'il n'existe pas encore. */
export async function getOrCreateReferralCode(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("referrals")
    .select("code")
    .eq("user_id", user.id)
    .single();
  if (existing) return existing.code;

  // Boucle courte pour éviter une collision improbable sur la clé primaire `code`.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await supabase.from("referrals").insert({ code, user_id: user.id });
    if (!error) return code;
  }
  throw new Error("Impossible de générer un code de parrainage.");
}

export async function getReferralStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: referral } = await supabase
    .from("referrals")
    .select("code")
    .eq("user_id", user.id)
    .single();
  if (!referral) return { code: null, count: 0 };

  const { count } = await supabase
    .from("referral_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("code", referral.code);

  return { code: referral.code, count: count ?? 0 };
}

/**
 * Appelé juste après la connexion (première visite du dashboard) si l'URL
 * contenait ?ref=CODE. Enregistre l'attribution du filleul au parrain.
 *
 * Ne crédite AUCUNE récompense pour l'instant — le montant/la durée de
 * l'offre de parrainage doit être validé avant d'être codé en dur (voir
 * rapport de chantier). Une fois validé, créditer ici (service_role
 * requis pour écrire dans subscriptions, RLS l'interdit côté client).
 */
export async function redeemReferral(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !code) return;

  const { data: referral } = await supabase
    .from("referrals")
    .select("user_id")
    .eq("code", code)
    .single();
  if (!referral || referral.user_id === user.id) return;

  const service = createServiceClient();

  await service
    .from("referral_redemptions")
    .insert({ code, referred_user_id: user.id });
  // Erreur silencieuse ignorée : déjà parrainé, ou code invalide entre-temps — non bloquant.
}
