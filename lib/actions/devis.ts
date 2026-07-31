"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildDevis } from "@/lib/generators/devis-express";

export async function createDevisAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const client_id = String(formData.get("client_id") || "") || null;
  const description = String(formData.get("description") || "").trim();
  const tva = String(formData.get("tva") || "20");

  if (!description) throw new Error("La description de la prestation est obligatoire.");

  let clientNom = "Client";
  if (client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("nom")
      .eq("id", client_id)
      .single();
    if (client) clientNom = client.nom;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_entreprise")
    .eq("id", user.id)
    .single();

  const contenu = buildDevis({
    entreprise: profile?.nom_entreprise || "Votre entreprise",
    clientNom,
    description,
    tva,
  });

  const validite = new Date();
  validite.setDate(validite.getDate() + 90);

  const { error } = await supabase.from("devis").insert({
    user_id: user.id,
    client_id,
    description,
    contenu,
    statut: "brouillon",
    validite_jusquau: validite.toISOString().slice(0, 10),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/devis");
}

export async function deleteDevisAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("devis").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/devis");
}
