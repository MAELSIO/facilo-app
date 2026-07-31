import { createClient } from "@/lib/supabase/server";
import { createRdvAction } from "@/lib/actions/rendez-vous";
import { RdvRow } from "./rdv-row";

export default async function RendezVousPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clients }, { data: rdvs }, { data: profile }] = await Promise.all([
    supabase.from("clients").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase
      .from("rendez_vous")
      .select("id, date_heure, service, statut, client_id, clients(nom)")
      .eq("user_id", user!.id)
      .order("date_heure", { ascending: true }),
    supabase.from("profiles").select("nom_entreprise").eq("id", user!.id).single(),
  ]);

  const entreprise = profile?.nom_entreprise || "Votre entreprise";

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Rendez-vous</h1>

      <form
        action={createRdvAction}
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
          name="service"
          placeholder="Service (optionnel)"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <input
          name="date_heure"
          type="datetime-local"
          required
          className="sm:col-span-2 rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="sm:col-span-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Ajouter ce rendez-vous
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {rdvs?.length ? (
          rdvs.map((r) => {
            const client = Array.isArray(r.clients) ? r.clients[0] : r.clients;
            return (
              <RdvRow
                key={r.id}
                id={r.id}
                dateHeure={r.date_heure}
                service={r.service}
                statut={r.statut}
                clientNom={client?.nom ?? "Client supprimé"}
                entreprise={entreprise}
              />
            );
          })
        ) : (
          <p className="text-sm text-ink-faint">Aucun rendez-vous pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
