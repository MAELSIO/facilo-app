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

/** Nombre de filleuls inscrits via `code` (le code du parrain, déjà connu de l'appelant). */
export async function getReferralStats(code: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("referral_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("code", code);

  return { count: count ?? 0 };
}

/**
 * Appelé juste après la connexion (première visite du dashboard) si l'URL
 * contenait ?ref=CODE. Enregistre l'attribution du filleul au parrain.
 *
 * Ne crédite rien ici : la récompense (1 mois offert aux deux) est créditée
 * plus tard par le webhook Stripe, quand le filleul devient réellement
 * payant — voir lib/referral-reward.ts (grantReferralRewardIfDue).
 */
export async function redeemReferral(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !code) return;

  // service_role requis : le filleul cherche le code d'un AUTRE utilisateur
  // (le parrain), or la policy RLS de `referrals` ne permet de lire que sa
  // propre ligne (auth.uid() = user_id) — un client RLS-scopé ne trouverait
  // donc jamais le code d'autrui.
  const service = createServiceClient();

  const { data: referral } = await service
    .from("referrals")
    .select("user_id")
    .eq("code", code)
    .single();
  if (!referral || referral.user_id === user.id) return;

  await service
    .from("referral_redemptions")
    .insert({ code, referred_user_id: user.id });
  // Erreur silencieuse ignorée : déjà parrainé, ou code invalide entre-temps — non bloquant.
}
