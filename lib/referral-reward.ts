import { stripe } from "./stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Crédite 1 mois offert (via Stripe customer balance, appliqué
 * automatiquement à la prochaine facture) au parrain ET au filleul, la
 * première fois que le filleul devient réellement payant.
 *
 * Le "claim" (marquer reward_granted_at) se fait par un UPDATE conditionnel
 * atomique AVANT tout appel Stripe : si deux webhooks arrivent en même
 * temps pour le même filleul, un seul gagne la course et personne n'est
 * crédité deux fois.
 */
export async function grantReferralRewardIfDue(
  supabase: SupabaseClient,
  referredUserId: string,
  amountCents: number,
  currency: string
): Promise<void> {
  if (!amountCents || amountCents <= 0) return;

  const { data: claimed } = await supabase
    .from("referral_redemptions")
    .update({ reward_granted_at: new Date().toISOString() })
    .eq("referred_user_id", referredUserId)
    .is("reward_granted_at", null)
    .select("id, code")
    .maybeSingle();

  if (!claimed) return; // pas de parrainage en attente, ou déjà récompensé

  const { data: referral } = await supabase
    .from("referrals")
    .select("user_id")
    .eq("code", claimed.code)
    .maybeSingle();

  if (!referral) {
    console.error("[referral-reward] code introuvable dans referrals", claimed.code);
    return;
  }

  const [{ data: referredSub }, { data: referrerSub }] = await Promise.all([
    supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", referredUserId).maybeSingle(),
    supabase.from("subscriptions").select("stripe_customer_id").eq("user_id", referral.user_id).maybeSingle(),
  ]);

  if (!referredSub?.stripe_customer_id) {
    console.error("[referral-reward] filleul sans stripe_customer_id", referredUserId);
    return;
  }

  let referrerCustomerId = referrerSub?.stripe_customer_id;
  if (!referrerCustomerId) {
    // Le parrain n'a jamais lancé de paiement : pas encore de client Stripe.
    const { data: referrerUser } = await supabase.auth.admin.getUserById(referral.user_id);
    const email = referrerUser?.user?.email;
    if (!email) {
      console.error("[referral-reward] parrain sans email", referral.user_id);
      return;
    }
    const customer = await stripe.customers.create({
      email,
      metadata: { user_id: referral.user_id, source: "referral_reward" },
    });
    referrerCustomerId = customer.id;
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: referrerCustomerId })
      .eq("user_id", referral.user_id);
  }

  const description = "Récompense parrainage Facilo — 1 mois offert";
  await Promise.all([
    stripe.customers.createBalanceTransaction(referredSub.stripe_customer_id, {
      amount: -amountCents,
      currency,
      description: `${description} (vous avez utilisé un lien de parrainage)`,
    }),
    stripe.customers.createBalanceTransaction(referrerCustomerId, {
      amount: -amountCents,
      currency,
      description: `${description} (un de vos filleuls est passé Pro)`,
    }),
  ]);
}
