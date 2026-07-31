"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const nom_entreprise = String(formData.get("nom_entreprise") || "").trim() || null;
  const metier = String(formData.get("metier") || "").trim() || null;
  const telephone = String(formData.get("telephone") || "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ nom_entreprise, metier, telephone })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/parametres");
}
