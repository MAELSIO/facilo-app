import { createClient } from "@/lib/supabase/server";
import { createFactureAction } from "@/lib/actions/factures";
import { FactureRow } from "./facture-row";

export default async function FacturesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clients }, { data: factures }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("id, nom, type").eq("user_id", user!.id).order("nom"),
    supabase
      .from("factures")
      .select("id, numero, montant, echeance, statut, infos_paiement, client_id, clients(nom, type)")
      .eq("user_id", user!.id)
      .order("echeance", { ascending: true }),
    supabase.from("profiles").select("nom_entreprise").eq("id", user!.id).single(),
  ]);

  const entreprise = profile?.nom_entreprise || "Votre entreprise";

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Factures</h1>

      <form
        action={createFactureAction}
        className="mb-8 grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-5 sm:grid-cols-2"
      >
        <select
          name="client_id"
          required
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Sélectionner un client...</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nom}
            </option>
          ))}
        </select>
        <input
          name="numero"
          placeholder="N° de facture (optionnel)"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <input
          name="montant"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Montant (€) *"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <input
          name="echeance"
          type="date"
          required
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <textarea
          name="infos_paiement"
          placeholder="Infos de paiement à rappeler (optionnel)"
          className="sm:col-span-2 rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {clients?.length === 0 && (
          <p className="sm:col-span-2 text-xs text-warn">
            Ajoutez d&apos;abord un client dans l&apos;onglet Clients.
          </p>
        )}
        <button
          type="submit"
          className="sm:col-span-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Ajouter cette facture
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {factures?.length ? (
          factures.map((f) => {
            const client = Array.isArray(f.clients) ? f.clients[0] : f.clients;
            return (
              <FactureRow
                key={f.id}
                id={f.id}
                numero={f.numero}
                montant={f.montant}
                echeance={f.echeance}
                statut={f.statut}
                infos_paiement={f.infos_paiement}
                clientNom={client?.nom ?? "Client supprimé"}
                clientType={client?.type ?? "particulier"}
                entreprise={entreprise}
              />
            );
          })
        ) : (
          <p className="text-sm text-ink-faint">Aucune facture pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
