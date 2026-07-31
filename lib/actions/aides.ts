"use server";

import { createClient } from "@/lib/supabase/server";
import type { Projet } from "@/lib/generators/simulateur-aides";

export async function saveAidesProfilAction(profil: {
  metier: string;
  region: string;
  departement?: string;
  anciennete: number;
  effectif: number;
  projets: Projet[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { error } = await supabase.from("aides_profils").upsert({
    user_id: user.id,
    metier: profil.metier,
    region: profil.region,
    departement: profil.departement || null,
    anciennete: profil.anciennete,
    effectif: profil.effectif,
    projets: profil.projets,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}
