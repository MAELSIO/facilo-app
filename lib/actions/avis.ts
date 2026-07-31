"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildReponse, detectTon, type TonAvis } from "@/lib/generators/reponse-avis";

export async function createAvisAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const texte_avis = String(formData.get("texte_avis") || "").trim();
  const tonChoice = String(formData.get("ton") || "auto");
  const plateforme = String(formData.get("plateforme") || "").trim() || null;

  if (!texte_avis) throw new Error("Le texte de l'avis est obligatoire.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_entreprise")
    .eq("id", user.id)
    .single();

  const ton: TonAvis = tonChoice === "auto" ? detectTon(texte_avis) : (tonChoice as TonAvis);
  const reponse_generee = buildReponse({
    commerce: profile?.nom_entreprise || "notre établissement",
    ton,
  });

  const { error } = await supabase.from("avis").insert({
    user_id: user.id,
    texte_avis,
    ton,
    reponse_generee,
    plateforme,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/avis");
}

export async function deleteAvisAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("avis").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/avis");
}
