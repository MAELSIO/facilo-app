import { createClient } from "@/lib/supabase/server";
import { createClientAction, deleteClientAction } from "@/lib/actions/clients";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, nom, email, telephone, type, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Vos clients</h1>

      <form
        action={createClientAction}
        className="mb-8 grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-5 sm:grid-cols-2"
      >
        <input
          name="nom"
          required
          placeholder="Nom du client *"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <select
          name="type"
          defaultValue="particulier"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="particulier">Particulier</option>
          <option value="professionnel">Professionnel</option>
        </select>
        <input
          name="email"
          type="email"
          placeholder="Email (optionnel)"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <input
          name="telephone"
          placeholder="Téléphone (optionnel)"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          className="sm:col-span-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Ajouter ce client
        </button>
      </form>

      <div className="flex flex-col gap-2">
        {clients?.length ? (
          clients.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3"
            >
              <div>
                <p className="font-semibold">{c.nom}</p>
                <p className="text-xs text-ink-faint">
                  {c.type === "professionnel" ? "Professionnel" : "Particulier"}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.telephone ? ` · ${c.telephone}` : ""}
                </p>
              </div>
              <form action={deleteClientAction}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-xs font-semibold text-warn hover:underline">
                  Supprimer
                </button>
              </form>
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-faint">Aucun client pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
