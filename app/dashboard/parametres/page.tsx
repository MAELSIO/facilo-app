import { createClient } from "@/lib/supabase/server";
import { updateProfileAction } from "@/lib/actions/profile";

export default async function ParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_entreprise, metier, telephone")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-md">
      <h1 className="mb-2 text-3xl font-bold">Paramètres</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Le nom de votre entreprise apparaît dans vos devis et vos relances — à renseigner avant
        de générer votre premier document.
      </p>

      <form
        action={updateProfileAction}
        className="flex flex-col gap-3 rounded-[var(--radius)] border border-line bg-surface p-5"
      >
        <label className="text-sm font-semibold">
          Nom de votre entreprise
          <input
            name="nom_entreprise"
            defaultValue={profile?.nom_entreprise ?? ""}
            placeholder="Ex : Dubois Rénovation"
            className="mt-1 w-full rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-sm font-semibold">
          Métier
          <input
            name="metier"
            defaultValue={profile?.metier ?? ""}
            placeholder="Ex : Plombier"
            className="mt-1 w-full rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
          />
        </label>
        <label className="text-sm font-semibold">
          Téléphone
          <input
            name="telephone"
            defaultValue={profile?.telephone ?? ""}
            placeholder="06 12 34 56 78"
            className="mt-1 w-full rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm font-normal focus:border-primary focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
