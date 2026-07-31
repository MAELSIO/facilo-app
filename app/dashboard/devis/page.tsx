import { createClient } from "@/lib/supabase/server";
import { createDevisAction, deleteDevisAction } from "@/lib/actions/devis";

export default async function DevisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: clients }, { data: devis }] = await Promise.all([
    supabase.from("clients").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase
      .from("devis")
      .select("id, description, contenu, statut, created_at, clients(nom)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Devis</h1>

      <form
        action={createDevisAction}
        className="mb-8 grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            name="client_id"
            className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Client (optionnel)</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          <select
            name="tva"
            defaultValue="20"
            className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="20">TVA 20 %</option>
            <option value="10">TVA 10 %</option>
            <option value="5.5">TVA 5,5 %</option>
            <option value="0">TVA non applicable (art. 293 B)</option>
          </select>
        </div>
        <textarea
          name="description"
          required
          rows={3}
          placeholder="Décrivez la prestation en langage courant : peinture salon, pose de parquet..."
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Générer le devis
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {devis?.length ? (
          devis.map((d) => {
            const client = Array.isArray(d.clients) ? d.clients[0] : d.clients;
            return (
              <details key={d.id} className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
                <summary className="cursor-pointer font-semibold">
                  {client?.nom ?? "Sans client"} — {d.description.slice(0, 60)}
                  {d.description.length > 60 ? "..." : ""}
                </summary>
                <pre className="mt-3 whitespace-pre-wrap rounded-[var(--radius-sm)] bg-surface-alt p-3 text-xs">
                  {d.contenu}
                </pre>
                <form action={deleteDevisAction} className="mt-2">
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="text-xs font-semibold text-warn hover:underline">
                    Supprimer
                  </button>
                </form>
              </details>
            );
          })
        ) : (
          <p className="text-sm text-ink-faint">Aucun devis pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
