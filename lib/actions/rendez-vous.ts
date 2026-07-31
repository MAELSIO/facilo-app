"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRdvAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const client_id = String(formData.get("client_id") || "") || null;
  const date_heure = String(formData.get("date_heure"));
  const service = String(formData.get("service") || "").trim() || null;

  if (!date_heure) throw new Error("La date du rendez-vous est obligatoire.");

  const { error } = await supabase.from("rendez_vous").insert({
    user_id: user.id,
    client_id,
    date_heure,
    service,
    statut: "a_venir",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rendez-vous");
}

export async function updateRdvStatutAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const statut = String(formData.get("statut"));

  const { error } = await supabase
    .from("rendez_vous")
    .update({ statut })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  if (statut !== "a_venir") {
    await supabase
      .from("scheduled_reminders")
      .update({ status: "cancelled" })
      .eq("source_type", "rendez_vous")
      .eq("source_id", id)
      .eq("status", "pending");
  }

  revalidatePath("/dashboard/rendez-vous");
}

export async function deleteRdvAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("rendez_vous").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/rendez-vous");
}
