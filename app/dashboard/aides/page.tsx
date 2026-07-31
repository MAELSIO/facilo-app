import { createClient } from "@/lib/supabase/server";
import { AidesForm } from "./aides-form";

export default async function AidesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("aides_profils")
    .select("metier, region, departement, anciennete, effectif, projets")
    .eq("user_id", user!.id)
    .single();

  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Simulateur d&apos;aides</h1>
      <p className="mb-6 text-sm text-ink-soft">
        Votre profil est sauvegardé automatiquement — relancez la simulation à tout moment pour
        vérifier si de nouveaux dispositifs correspondent à votre situation.
      </p>
      <AidesForm initial={profil} />
    </div>
  );
}
