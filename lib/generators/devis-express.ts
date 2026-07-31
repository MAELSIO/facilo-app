/** Porté depuis assets/js/tools/devis-express.js. */
export interface DevisInput {
  entreprise: string;
  clientNom: string;
  description: string;
  lieu?: string;
  tva: string; // "0" | "10" | "20" ...
}

function fmtDateFR(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function devisNumber(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `DEV-${y}${m}${day}-${rand}`;
}

/**
 * Découpage naïf par virgules / retours à la ligne / " et ". Aucun prix
 * n'est inventé — c'est volontaire, à l'artisan de compléter les montants.
 * Fast-follow IA évident : structurer plus finement une description libre.
 */
export function splitPostes(description: string): string[] {
  return description
    .split(/\n|,| et /i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

export function buildDevis(input: DevisInput, now: Date = new Date()): string {
  const validite = new Date(now.getTime() + 90 * 86400000);
  const postes = splitPostes(input.description);
  const tvaLabel =
    input.tva === "0" ? "TVA non applicable, art. 293 B du CGI" : `TVA ${input.tva} %`;

  const lignes = postes
    .map((poste, i) => {
      const libelle = poste.charAt(0).toUpperCase() + poste.slice(1);
      return `${i + 1}. ${libelle}\n   Quantité : à préciser   |   Prix unitaire : ______ €   |   Total : ______ €`;
    })
    .join("\n\n");

  return (
    `DEVIS N° ${devisNumber(now)}\n` +
    `Date : ${fmtDateFR(now)}   |   Validité : jusqu'au ${fmtDateFR(validite)}\n\n` +
    `Émetteur : ${input.entreprise}\n` +
    `Client : ${input.clientNom}${input.lieu ? `\nLieu de la prestation : ${input.lieu}` : ""}` +
    "\n\n----------------------------------------\nDÉTAIL DES PRESTATIONS\n----------------------------------------\n\n" +
    lignes +
    "\n\n----------------------------------------\n" +
    `Total HT : ______ €\n${tvaLabel}\nTotal TTC : ______ €\n` +
    "----------------------------------------\n\n" +
    "Devis gratuit, valable 90 jours. Un acompte pourra être demandé à la signature.\n\n" +
    "Bon pour accord (date et signature du client) :\n\n\n" +
    input.entreprise
  );
}
