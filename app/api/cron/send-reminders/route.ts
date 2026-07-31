import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resend, FACILO_FROM_EMAIL } from "@/lib/resend";
import { buildEmail as buildFactureEmail, buildSubject as buildFactureSubject } from "@/lib/generators/relance-facture";
import { buildEmail as buildRdvEmail } from "@/lib/generators/relance-rdv";

export const maxDuration = 60;

/**
 * Le cœur de la promesse "Facilo Pro" : envoie automatiquement, sans
 * action manuelle, les relances de factures (J+7/J+15/J+30) et les
 * rappels de rendez-vous (la veille) dus aujourd'hui.
 *
 * Planifiée quotidiennement par Vercel Cron (voir vercel.json). Protégée
 * par CRON_SECRET pour empêcher n'importe qui d'appeler cette route et de
 * déclencher des envois. Vercel Cron ajoute automatiquement l'en-tête
 * Authorization avec ce secret quand la variable d'env est configurée.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const results = { sent: 0, failed: 0, skipped: 0 };

  const { data: dueReminders, error } = await supabase
    .from("scheduled_reminders")
    .select("id, user_id, source_type, source_id, send_at")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .limit(200); // sécurité : une seule exécution ne traite pas un volume illimité

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const reminder of dueReminders ?? []) {
    try {
      const outcome =
        reminder.source_type === "facture"
          ? await sendFactureReminder(supabase, reminder)
          : await sendRdvReminder(supabase, reminder);

      await supabase
        .from("scheduled_reminders")
        .update({
          status: outcome.sent ? "sent" : "failed",
          attempt_count: 1,
          last_error: outcome.sent ? null : outcome.reason,
        })
        .eq("id", reminder.id);

      if (outcome.sent) results.sent++;
      else if (outcome.reason === "skipped") results.skipped++;
      else results.failed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue.";
      await supabase
        .from("scheduled_reminders")
        .update({ status: "failed", attempt_count: 1, last_error: message })
        .eq("id", reminder.id);
      results.failed++;
    }
  }

  return NextResponse.json({ processed: dueReminders?.length ?? 0, ...results });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendFactureReminder(supabase: any, reminder: { user_id: string; source_id: string; send_at: string }) {
  const { data: facture } = await supabase
    .from("factures")
    .select("id, numero, montant, echeance, statut, infos_paiement, client_id")
    .eq("id", reminder.source_id)
    .single();

  if (!facture || facture.statut !== "impayee") {
    return { sent: false, reason: "skipped" }; // payée/annulée entre-temps
  }

  const { data: client } = await supabase
    .from("clients")
    .select("nom, email, type")
    .eq("id", facture.client_id)
    .single();

  if (!client?.email) {
    return { sent: false, reason: "Aucun email renseigné pour ce client." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_entreprise")
    .eq("id", reminder.user_id)
    .single();

  const { data: authUser } = await supabase.auth.admin.getUserById(reminder.user_id);

  const echeance = new Date(facture.echeance);
  const diffDays = Math.round(
    (new Date(reminder.send_at).getTime() - echeance.getTime()) / 86400000
  );
  const level = diffDays <= 7 ? 1 : diffDays <= 15 ? 2 : 3;

  const input = {
    artisan: profile?.nom_entreprise || "Votre prestataire",
    client: client.nom,
    invoice: facture.numero ?? undefined,
    amount: facture.montant,
    dueDate: echeance,
    clientType: client.type as "particulier" | "professionnel",
    level: level as 1 | 2 | 3,
    payinfo: facture.infos_paiement ?? undefined,
  };

  await resend.emails.send({
    from: FACILO_FROM_EMAIL,
    to: client.email,
    replyTo: authUser?.user?.email,
    subject: buildFactureSubject(input),
    text: buildFactureEmail(input),
  });

  return { sent: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendRdvReminder(supabase: any, reminder: { user_id: string; source_id: string }) {
  const { data: rdv } = await supabase
    .from("rendez_vous")
    .select("id, date_heure, service, statut, client_id")
    .eq("id", reminder.source_id)
    .single();

  if (!rdv || rdv.statut !== "a_venir") {
    return { sent: false, reason: "skipped" };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("nom, email")
    .eq("id", rdv.client_id)
    .single();

  if (!client?.email) {
    return { sent: false, reason: "Aucun email renseigné pour ce client." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nom_entreprise")
    .eq("id", reminder.user_id)
    .single();

  const dateFormatted = new Date(rdv.date_heure).toLocaleString("fr-FR", {
    day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });

  const input = {
    typeMsg: "rappel" as const,
    pro: profile?.nom_entreprise || "Votre prestataire",
    client: client.nom,
    dateRdv: dateFormatted,
    ton: "formel" as const,
  };

  await resend.emails.send({
    from: FACILO_FROM_EMAIL,
    to: client.email,
    subject: `Rappel de rendez-vous — ${dateFormatted}`,
    text: buildRdvEmail(input),
  });

  return { sent: true };
}
