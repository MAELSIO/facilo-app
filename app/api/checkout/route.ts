import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, FACILO_PRO_PRICE_ID } from "@/lib/stripe";

/**
 * Crée une session Stripe Checkout pour l'utilisateur connecté.
 * Essai sans carte bancaire (payment_method_collection: "if_required" +
 * trial_period_days) — cohérent avec la promesse déjà faite sur le site
 * vitrine ("Sans carte bancaire requise").
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: FACILO_PRO_PRICE_ID, quantity: 1 }],
    customer: sub?.stripe_customer_id || undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    client_reference_id: user.id,
    subscription_data: {
      trial_period_days: 14,
      metadata: { user_id: user.id },
    },
    payment_method_collection: "if_required",
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
