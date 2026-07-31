import { createClient } from "@/lib/supabase/server";
import { createAvisAction, deleteAvisAction } from "@/lib/actions/avis";

export default async function AvisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: avis } = await supabase
    .from("avis")
    .select("id, texte_avis, ton, reponse_generee, plateforme, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Réponses aux avis</h1>

      <form
        action={createAvisAction}
        className="mb-8 grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-5"
      >
        <textarea
          name="texte_avis"
          required
          rows={3}
          placeholder="Collez ici le texte de l'avis reçu"
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            name="ton"
            defaultValue="auto"
            className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="auto">Détection automatique du ton</option>
            <option value="positif">Positif</option>
            <option value="negatif">Négatif</option>
          </select>
          <input
            name="plateforme"
            placeholder="Plateforme (Google, Facebook...)"
            className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Générer la réponse
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {avis?.length ? (
          avis.map((a) => (
            <details key={a.id} className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
              <summary className="cursor-pointer font-semibold">
                {a.ton === "positif" ? "🟢" : "🔴"} {a.texte_avis.slice(0, 70)}
                {a.texte_avis.length > 70 ? "..." : ""}
              </summary>
              <pre className="mt-3 whitespace-pre-wrap rounded-[var(--radius-sm)] bg-surface-alt p-3 text-xs">
                {a.reponse_generee}
              </pre>
              <form action={deleteAvisAction} className="mt-2">
                <input type="hidden" name="id" value={a.id} />
                <button type="submit" className="text-xs font-semibold text-warn hover:underline">
                  Supprimer
                </button>
              </form>
            </details>
          ))
        ) : (
          <p className="text-sm text-ink-faint">Aucun avis pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
