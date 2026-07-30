import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutButton } from "./checkout-button";

/**
 * Le proxy (proxy.ts) ne vérifie que la session (connecté ou non) — le
 * contrôle "abonnement actif" (plus lent, une requête DB) se fait ici,
 * au niveau du layout du dashboard, pour chaque page sous /dashboard.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  const hasAccess = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/dashboard" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              F
            </span>
            Facilo Pro
          </a>
          <span className="text-xs text-ink-faint">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        {hasAccess ? (
          children
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-gold bg-[var(--gold-tint)] p-8 text-center">
            <p className="font-display text-lg font-semibold">
              {subscription?.status === "canceled" || subscription?.status === "past_due"
                ? "Votre abonnement Facilo Pro n'est plus actif."
                : "Votre abonnement Facilo Pro n'est pas encore actif."}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              14 jours d&apos;essai, sans carte bancaire requise.
            </p>
            <CheckoutButton />
          </div>
        )}
      </main>
    </div>
  );
}
