import { PortalButton } from "./checkout-button";
import { redeemReferral } from "@/lib/actions/referrals";

const TOOLS = [
  { icon: "📄", label: "Relances de factures", href: "/dashboard/factures" },
  { icon: "⭐", label: "Réponses aux avis", href: "/dashboard/avis" },
  { icon: "🧾", label: "Devis", href: "/dashboard/devis" },
  { icon: "📅", label: "Rendez-vous", href: "/dashboard/rendez-vous" },
  { icon: "💰", label: "Simulateur d'aides", href: "/dashboard/aides" },
  { icon: "👥", label: "Clients", href: "/dashboard/clients" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (ref) await redeemReferral(ref);

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Bienvenue sur Facilo Pro</h1>
      <p className="mb-8 text-ink-soft">
        Vos 5 outils, avec vos clients enregistrés une fois pour toutes.{" "}
        <a href="/dashboard/parametres" className="font-semibold text-primary underline">
          Complétez votre profil
        </a>{" "}
        pour que vos documents affichent le nom de votre entreprise.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <a
            key={tool.label}
            href={tool.href}
            className="flex flex-col gap-2 rounded-[var(--radius)] border border-line bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            <span className="text-2xl">{tool.icon}</span>
            <h3 className="font-display font-semibold">{tool.label}</h3>
            <span className="mt-auto text-xs font-bold text-primary">Ouvrir →</span>
          </a>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <PortalButton />
      </div>
    </div>
  );
}
