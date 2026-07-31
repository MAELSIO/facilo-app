import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

/**
 * Adresse d'envoi des relances automatiques. Nécessite un domaine vérifié
 * dans Resend (voir README, étape Resend) — sans ça, Resend refuse d'envoyer
 * depuis autre chose que le domaine de test "onboarding@resend.dev".
 */
export const FACILO_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Facilo <onboarding@resend.dev>";
