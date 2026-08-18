/**
 * Porté depuis assets/js/tools/simulateur-aides.js.
 * Base de démonstration (PLACEHOLDER_AIDES_DB) — à remplacer par des
 * données réelles et à jour (France Num, Bpifrance, régions, OPCO, ARS...)
 * avant un vrai lancement. Voir guide-demarrage/4-base-aides.html sur le
 * site vitrine pour les sources recommandées.
 */
export type TypeAide = "national" | "regional" | "sectoriel";
export type Projet = "digitalisation" | "materiel" | "recrutement" | "energie";

export interface Aide {
  id: string;
  nom: string;
  type: TypeAide;
  metiers: string[]; // ["all"] ou liste de métiers
  regions: string[]; // ["all"] ou liste de régions
  projets: (Projet | "all")[];
  ancienneteMax: number; // Infinity si aucune limite
  effectifMax: number; // Infinity si aucune limite
  montantMax: number;
  montantLabel: string;
  desc: string;
}

export interface ProfilAide {
  metier: string;
  region: string;
  anciennete: number;
  effectif: number;
  projets: Projet[];
}

export const AIDES_DB: Aide[] = [
  {
    id: "france-num",
    nom: "Aide à la digitalisation des TPE (France Num)",
    type: "national",
    metiers: ["all"], regions: ["all"], projets: ["digitalisation"],
    ancienneteMax: Infinity, effectifMax: 49,
    montantMax: 2500, montantLabel: "Jusqu'à 2 500 €",
    desc: "Diagnostic numérique gratuit et chèque pour financer un site, une caisse connectée ou un logiciel de gestion.",
  },
  {
    id: "acre",
    nom: "Exonération de charges jeune entreprise (ACRE)",
    type: "national",
    metiers: ["all"], regions: ["all"], projets: ["all"],
    ancienneteMax: 1, effectifMax: Infinity,
    montantMax: 3500, montantLabel: "Jusqu'à 50 % de charges sociales en moins la 1ère année",
    desc: "Réduction des cotisations sociales pendant les premiers mois d'activité pour les entreprises récentes.",
  },
  {
    id: "aide-embauche",
    nom: "Aide à l'embauche d'un premier salarié ou apprenti",
    type: "national",
    metiers: ["all"], regions: ["all"], projets: ["recrutement"],
    ancienneteMax: Infinity, effectifMax: 10,
    montantMax: 6000, montantLabel: "Jusqu'à 6 000 € par contrat",
    desc: "Aide versée sur un à deux ans pour l'embauche d'un apprenti ou d'un premier salarié en contrat pro.",
  },
  {
    id: "opco-formation",
    nom: "Prise en charge d'une formation par votre OPCO",
    type: "sectoriel",
    metiers: ["all"], regions: ["all"], projets: ["all"],
    ancienneteMax: Infinity, effectifMax: Infinity,
    montantMax: 1800, montantLabel: "Jusqu'à 100 % du coût pédagogique",
    desc: "Formation du dirigeant ou des salariés financée en tout ou partie par votre opérateur de compétences.",
  },
  {
    id: "renov-energie",
    nom: "Aide à la rénovation énergétique des locaux professionnels",
    type: "national",
    metiers: ["btp", "commerce", "restauration", "coiffure", "immobilier"], regions: ["all"], projets: ["energie"],
    ancienneteMax: Infinity, effectifMax: 49,
    montantMax: 10000, montantLabel: "Jusqu'à 10 000 €",
    desc: "Financement de travaux d'isolation, de chauffage ou d'équipements moins énergivores pour votre local.",
  },
  {
    id: "aide-regionale-invest",
    nom: "Aide régionale à l'investissement des TPE",
    type: "regional",
    metiers: ["all"], regions: ["all"], projets: ["materiel", "digitalisation", "energie"],
    ancienneteMax: Infinity, effectifMax: 20,
    montantMax: 8000, montantLabel: "De 2 000 € à 8 000 € selon votre région",
    desc: "Subvention ou avance remboursable pour l'achat de matériel ou la modernisation de votre activité, selon votre conseil régional.",
  },
  {
    id: "credit-impot-formation",
    nom: "Crédit d'impôt formation du chef d'entreprise",
    type: "national",
    metiers: ["all"], regions: ["all"], projets: ["all"],
    ancienneteMax: Infinity, effectifMax: 10,
    montantMax: 486, montantLabel: "Jusqu'à 486 €",
    desc: "Crédit d'impôt calculé sur les heures de formation suivies par le dirigeant, à déduire de l'impôt sur les sociétés ou le revenu.",
  },
  {
    id: "rge-btp",
    nom: "Accompagnement à la qualification RGE",
    type: "sectoriel",
    metiers: ["btp"], regions: ["all"], projets: ["all"],
    ancienneteMax: Infinity, effectifMax: 49,
    montantMax: 1200, montantLabel: "Jusqu'à 1 200 € de prise en charge",
    desc: "Accompagnement et financement partiel de la formation menant à la qualification RGE, qui ouvre l'accès aux chantiers aidés.",
  },
  {
    id: "ars-zone-sous-dotee",
    nom: "Aide à l'installation en zone sous-dotée (ARS)",
    type: "regional",
    metiers: ["sante"], regions: ["all"], projets: ["all"],
    ancienneteMax: 3, effectifMax: Infinity,
    montantMax: 50000, montantLabel: "Jusqu'à 50 000 €",
    desc: "Aide à l'installation pour les professionnels de santé indépendants qui s'installent dans une zone identifiée comme sous-dotée.",
  },
  {
    id: "commerce-proximite",
    nom: "Fonds de soutien au commerce de proximité",
    type: "regional",
    metiers: ["commerce", "restauration", "coiffure"], regions: ["all"], projets: ["materiel", "digitalisation", "energie"],
    ancienneteMax: Infinity, effectifMax: 10,
    montantMax: 20000, montantLabel: "Jusqu'à 20 000 €",
    desc: "Subvention locale pour la modernisation, la mise aux normes ou la rénovation de vitrine d'un commerce de centre-ville.",
  },
  {
    id: "pret-honneur",
    nom: "Prêt d'honneur à taux zéro (jeunes entreprises)",
    type: "national",
    metiers: ["all"], regions: ["all"], projets: ["all"],
    ancienneteMax: 3, effectifMax: Infinity,
    montantMax: 15000, montantLabel: "Jusqu'à 15 000 € à taux zéro",
    desc: "Prêt personnel sans garantie ni intérêt, qui renforce vos fonds propres et facilite l'accès à un prêt bancaire complémentaire.",
  },
  {
    id: "liberal-cpf",
    nom: "Financement CPF pour indépendants et professions libérales",
    type: "sectoriel",
    metiers: ["liberal", "sante"], regions: ["all"], projets: ["all"],
    ancienneteMax: Infinity, effectifMax: Infinity,
    montantMax: 1500, montantLabel: "Jusqu'à 1 500 € de droits mobilisables",
    desc: "Droits à la formation mobilisables sur votre compte personnel pour développer ou faire évoluer votre activité.",
  },
];

export function matchAide(a: Aide, profil: ProfilAide): boolean {
  if (!a.metiers.includes("all") && !a.metiers.includes(profil.metier)) return false;
  if (!a.regions.includes("all") && !a.regions.includes(profil.region)) return false;
  if (a.ancienneteMax < profil.anciennete) return false;
  if (a.effectifMax < profil.effectif) return false;
  if (!a.projets.includes("all") && !profil.projets.some((p) => a.projets.includes(p))) return false;
  return true;
}

export interface SimulationResult {
  matches: Aide[];
  total: number;
}

export function simulerAides(profil: ProfilAide): SimulationResult {
  let matches = AIDES_DB.filter((a) => matchAide(a, profil)).sort(
    (a, b) => b.montantMax - a.montantMax
  );

  if (matches.length === 0) {
    matches = AIDES_DB.filter((a) => a.metiers.includes("all") && a.projets.includes("all"))
      .sort((a, b) => b.montantMax - a.montantMax)
      .slice(0, 3);
  }

  const total = matches.reduce((sum, a) => sum + a.montantMax, 0);
  return { matches, total };
}
