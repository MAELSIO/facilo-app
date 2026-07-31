"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createClientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const nom = String(formData.get("nom") || "").trim();
  const email = String(formData.get("email") || "").trim() || null;
  const telephone = String(formData.get("telephone") || "").trim() || null;
  const type = String(formData.get("type") || "particulier");

  if (!nom) throw new Error("Le nom du client est obligatoire.");

  const { error } = await supabase
    .from("clients")
    .insert({ user_id: user.id, nom, email, telephone, type });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clients");
}

export async function deleteClientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const id = String(formData.get("id"));
  const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/clients");
}
