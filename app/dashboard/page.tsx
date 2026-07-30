import { PortalButton } from "./checkout-button";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Bienvenue sur Facilo Pro</h1>
      <p className="mb-8 text-ink-soft">
        Votre abonnement est actif. Les 5 outils avec sauvegarde de vos clients et
        l&apos;automatisation des relances arrivent dans les prochaines mises à jour
        (Phase 2 et 3 du chantier).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: "📄", label: "Relance de facture" },
          { icon: "⭐", label: "Réponse à un avis" },
          { icon: "🧾", label: "Devis express" },
          { icon: "📅", label: "Relance de rendez-vous" },
          { icon: "💰", label: "Simulateur d'aides" },
        ].map((tool) => (
          <div
            key={tool.label}
            className="flex flex-col gap-2 rounded-[var(--radius)] border border-line bg-surface p-5 opacity-60"
          >
            <span className="text-2xl">{tool.icon}</span>
            <h3 className="font-display font-semibold">{tool.label}</h3>
            <p className="text-xs text-ink-faint">Bientôt disponible ici, avec sauvegarde automatique.</p>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-line pt-6">
        <PortalButton />
      </div>
    </div>
  );
}
