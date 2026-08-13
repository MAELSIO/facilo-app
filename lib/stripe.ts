import Stripe from "stripe";

/** Lit le prix courant d'un item d'abonnement (fallback si absent au niveau item). */
export function itemCurrentPeriodEnd(
  subscription: Stripe.Subscription
): string {
  const raw =
    subscription.items.data[0]?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;
  return new Date((raw ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia",
  typescript: true,
});

/** ID du prix Stripe "Facilo Pro" — créé dans le Dashboard Stripe (Produits). */
export const FACILO_PRO_PRICE_ID = process.env.STRIPE_PRICE_ID!;

/**
 * Code promo optionnel réservé aux inscrits de la liste d'attente
 * ("tarif de lancement garanti" déjà promis sur offre.html). Créez un
 * Coupon + Promotion Code dans Stripe et renseignez son ID ici via env var.
 * Laissez STRIPE_WAITLIST_PROMO_CODE vide pour ne rien appliquer.
 */
export const WAITLIST_PROMO_CODE = process.env.STRIPE_WAITLIST_PROMO_CODE || undefined;
