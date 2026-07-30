import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Webhook Stripe. Écoute les events qui font foi pour `subscriptions.status`
 * — jamais le client, toujours ce webhook (voir supabase/migrations/0001_init.sql).
 *
 * Config Stripe Dashboard > Developers > Webhooks :
 *   URL : https://votre-domaine/api/webhooks/stripe
 *   Events : checkout.session.completed, customer.subscription.updated,
 *            customer.subscription.deleted, invoice.payment_failed, invoice.paid
 * En local : `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature invalide.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId || !session.customer || !session.subscription) break;

      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id ?? null,
        current_period_end: new Date(
          subscription.items.data[0]?.current_period_end * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          price_id: subscription.items.data[0]?.price.id ?? null,
          current_period_end: new Date(
            subscription.items.data[0]?.current_period_end * 1000
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : null;
      if (!subscriptionId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);
      // Fast-follow : envoyer un email via Resend ("mettez à jour votre carte").
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : null;
      if (!subscriptionId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
