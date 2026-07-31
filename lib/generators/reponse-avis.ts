/** Porté depuis assets/js/tools/reponse-avis.js. */
export type TonAvis = "positif" | "negatif";

const NEG_WORDS = [
  "décevant", "deçu", "déçu", "nul", "horrible", "mauvais", "sale", "attente",
  "retard", "cher", "froid", "impoli", "erreur", "problème", "annulé", "sans réponse",
];
const POS_WORDS = [
  "super", "excellent", "parfait", "génial", "recommande", "merci", "top",
  "impeccable", "adorable", "rapide", "professionnel", "satisfait",
];

/** Heuristique simple par mots-clés — fast-follow évident pour une vraie IA de sentiment. */
export function detectTon(texte: string): TonAvis {
  const t = texte.toLowerCase();
  let score = 0;
  for (const w of POS_WORDS) if (t.includes(w)) score++;
  for (const w of NEG_WORDS) if (t.includes(w)) score--;
  return score < 0 ? "negatif" : "positif";
}

export interface ReponseAvisInput {
  commerce: string;
  ton: TonAvis;
  signataire?: string;
}

export function buildReponse(input: ReponseAvisInput): string {
  const greeting = "Bonjour";
  const sign = input.signataire
    ? `\n${input.signataire} — ${input.commerce}`
    : `\nL'équipe ${input.commerce}`;

  if (input.ton === "positif") {
    return (
      `${greeting},\n\n` +
      "Merci beaucoup pour ce retour, ça nous touche vraiment ! C'est un plaisir de vous compter parmi nos clients, et on espère vous revoir très bientôt." +
      "\n\nÀ très vite," +
      sign
    );
  }

  return (
    `${greeting},\n\n` +
    "Merci d'avoir pris le temps de nous faire ce retour. Nous sommes désolés que votre expérience n'ait pas été à la hauteur de ce que vous étiez en droit d'attendre." +
    "\n\nNous prenons cela très au sérieux : n'hésitez pas à nous contacter directement pour qu'on puisse comprendre ce qui s'est passé et faire en sorte que ça ne se reproduise pas." +
    "\n\nCordialement," +
    sign
  );
}
