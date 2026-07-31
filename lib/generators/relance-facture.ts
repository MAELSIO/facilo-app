/**
 * Porté depuis assets/js/tools/relance-facture.js (site vitrine).
 * Génération 100% déterministe — voir README pour brancher une vraie IA
 * (remplacer le corps de buildEmail/buildSms en gardant la signature).
 */
export type NiveauRelance = 1 | 2 | 3;
export type TypeClient = "particulier" | "professionnel";

export interface RelanceFactureInput {
  artisan: string;
  client: string;
  invoice?: string;
  amount: number;
  dueDate: Date;
  clientType: TypeClient;
  level: NiveauRelance;
  payinfo?: string;
  phone?: string;
}

export const LEVEL_DESCRIPTIONS: Record<NiveauRelance, string> = {
  1: "Message léger et bienveillant, comme si c'était un simple oubli.",
  2: "Ton plus ferme : nouveau délai fixé et conséquences rappelées clairement.",
  3: "Courrier officiel de mise en demeure, à envoyer si possible en recommandé avec accusé de réception.",
};

function fmtDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtAmount(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function daysLate(dueDate: Date, now: Date = new Date()): number {
  const d0 = new Date(dueDate);
  d0.setHours(0, 0, 0, 0);
  const d1 = new Date(now);
  d1.setHours(0, 0, 0, 0);
  return Math.round((d1.getTime() - d0.getTime()) / 86400000);
}

export function buildSubject(input: Pick<RelanceFactureInput, "invoice" | "level">): string {
  const invoiceRef = input.invoice ? " " + input.invoice : "";
  if (input.level === 1) return "Petit rappel au sujet de votre facture" + invoiceRef;
  if (input.level === 2) return "Facture" + invoiceRef + " : toujours en attente de règlement";
  return "Mise en demeure de payer — facture" + invoiceRef;
}

export function buildEmail(input: RelanceFactureInput): string {
  const days = daysLate(input.dueDate);
  const greeting =
    input.clientType === "particulier" ? `Bonjour ${input.client},` : "Bonjour,";
  const invoiceRef = input.invoice ? ` (référence ${input.invoice})` : "";
  const lateText =
    days > 0
      ? `le délai de paiement est dépassé de ${days} jour${days > 1 ? "s" : ""} (échéance fixée au ${fmtDateFR(input.dueDate)})`
      : `l'échéance du ${fmtDateFR(input.dueDate)} approche`;
  const payinfo = input.payinfo
    ? `\n\nVoici de nouveau les coordonnées utiles pour régler cette facture :\n${input.payinfo}`
    : "";
  const signature = `\n\nBien cordialement,\n${input.artisan}${input.phone ? "\n" + input.phone : ""}`;

  if (input.level === 1) {
    return (
      `${greeting}\n\n` +
      `Un point rapide sur la facture${invoiceRef} de ${fmtAmount(input.amount)} : ${lateText} et je n'ai pas encore reçu le règlement.\n\n` +
      "Ce genre d'oubli arrive à tout le monde, aucun souci. Pourriez-vous simplement y jeter un œil dans les prochains jours ? Et si ce paiement est déjà parti de votre côté, ce message n'a plus lieu d'être — merci de l'ignorer." +
      payinfo +
      signature
    );
  }

  if (input.level === 2) {
    const penalite =
      input.clientType === "professionnel"
        ? "\n\nSans retour de votre part, sachez que des pénalités de retard ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement deviendront exigibles, comme le prévoit l'article L441-10 du Code de commerce."
        : "\n\nÀ défaut de régularisation, des frais de recouvrement pourront s'appliquer, conformément à nos conditions générales de vente.";
    return (
      `${greeting}\n\n` +
      `Je reviens vers vous une seconde fois au sujet de la facture${invoiceRef} de ${fmtAmount(input.amount)}, toujours en attente de paiement : ${lateText}.\n\n` +
      "Merci de procéder au règlement sous 8 jours à compter de ce message." +
      penalite +
      payinfo +
      signature
    );
  }

  const legalRef =
    input.clientType === "professionnel"
      ? "Je vous rappelle qu'en application de l'article L441-10 du Code de commerce, les pénalités de retard et l'indemnité forfaitaire de 40 € pour frais de recouvrement sont d'ores et déjà acquises de plein droit."
      : "À défaut de paiement dans ce délai, des frais de recouvrement pourront être appliqués conformément à nos conditions générales de vente.";
  return (
    `${input.client},\n\n` +
    `Les relances précédentes concernant la facture${invoiceRef} de ${fmtAmount(input.amount)} étant restées sans effet — ${lateText} —, je vous adresse cette mise en demeure de payer.\n\n` +
    "Je vous demande de régler l'intégralité de cette somme dans un délai de 8 jours à réception du présent courrier.\n\n" +
    legalRef +
    "\n\nPassé ce délai, et sans nouvelle de votre part, j'engagerai les démarches nécessaires au recouvrement de cette créance, y compris par voie judiciaire si besoin." +
    payinfo +
    "\n\nJe reste disponible pour trouver une solution rapide avec vous," +
    signature
  );
}

export function buildSms(input: RelanceFactureInput): string {
  const days = daysLate(input.dueDate);
  const invoiceRef = input.invoice ? ` (${input.invoice})` : "";
  const lateText = days > 0 ? `${days} j de retard` : `échéance le ${fmtDateFR(input.dueDate)}`;

  if (input.level === 1) {
    return `Bonjour, un rapide rappel : la facture${invoiceRef} de ${fmtAmount(input.amount)} est encore en attente de règlement (${lateText}). Merci d'y penser dès que possible ! ${input.artisan}`;
  }
  if (input.level === 2) {
    return `Bonjour, la facture${invoiceRef} de ${fmtAmount(input.amount)} n'a toujours pas été réglée (${lateText}). Merci de régulariser sous 8 jours pour éviter des frais supplémentaires. ${input.artisan}`;
  }
  return `Mise en demeure envoyée pour la facture${invoiceRef} de ${fmtAmount(input.amount)}, impayée (${lateText}). Un courrier officiel suit. Merci de régulariser sous 8 jours. ${input.artisan}`;
}
