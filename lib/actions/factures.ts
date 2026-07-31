"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFactureAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const client_id = String(formData.get("client_id") || "") || null;
  const numero = String(formData.get("numero") || "").trim() || null;
  const montant = parseFloat(String(formData.get("montant")));
  const echeance = String(formData.get("echeance"));
  const infos_paiement = String(formData.get("infos_paiement") || "").trim() || null;

  if (!montant || montant <= 0 || !echeance) {
    throw new Error("Montant et date d'échéance obligatoires.");
  }

  const { error } = await supabase.from("factures").insert({
    user_id: user.id,
    client_id,
    numero,
    montant,
    echeance,
    infos_paiement,
    statut: "impayee",
    niveau_relance: 1,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/factures");
}

export async function markFacturePayeeAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase
    .from("factures")
    .update({ statut: "payee" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  // Les rappels programmés non envoyés pour cette facture deviennent
  // obsolètes : la route de cron ignore de toute façon les factures dont
  // statut != 'impayee', mais on nettoie pour éviter des lignes mortes.
  await supabase
    .from("scheduled_reminders")
    .update({ status: "cancelled" })
    .eq("source_type", "facture")
    .eq("source_id", id)
    .eq("status", "pending");

  revalidatePath("/dashboard/factures");
}

export async function deleteFactureAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("factures").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/factures");
}
