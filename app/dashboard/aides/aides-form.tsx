"use client";

import { useState, type FormEvent } from "react";
import { simulerAides, type Projet, type SimulationResult } from "@/lib/generators/simulateur-aides";
import { saveAidesProfilAction } from "@/lib/actions/aides";

interface AidesFormProps {
  initial?: {
    metier: string | null;
    region: string | null;
    departement: string | null;
    anciennete: number | null;
    effectif: number | null;
    projets: string[] | null;
  } | null;
}

const METIERS = [
  ["btp", "BTP / artisanat"],
  ["restauration", "Restauration"],
  ["coiffure", "Coiffure / beauté"],
  ["commerce", "Commerce de proximité"],
  ["immobilier", "Immobilier"],
  ["sante", "Santé / paramédical indépendant"],
  ["liberal", "Autre profession libérale"],
];

const REGIONS = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire",
  "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie",
  "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
];

const PROJETS: [Projet, string][] = [
  ["digitalisation", "Digitalisation"],
  ["materiel", "Matériel"],
  ["recrutement", "Recrutement"],
  ["energie", "Énergie"],
];

export function AidesForm({ initial }: AidesFormProps) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const metier = String(fd.get("metier"));
    const region = String(fd.get("region"));
    const departement = String(fd.get("departement") || "");
    const anciennete = parseFloat(String(fd.get("anciennete")));
    const effectif = parseFloat(String(fd.get("effectif")));
    const projets = fd.getAll("projets") as Projet[];

    if (!metier || !region || isNaN(anciennete) || isNaN(effectif) || projets.length === 0) {
      alert("Merci de compléter tous les champs, dont au moins un type de projet.");
      return;
    }

    setResult(simulerAides({ metier, region, anciennete, effectif, projets }));

    setSaving(true);
    await saveAidesProfilAction({ metier, region, departement, anciennete, effectif, projets });
    setSaving(false);
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-3 rounded-[var(--radius)] border border-line bg-surface p-5 sm:grid-cols-2"
      >
        <select
          name="metier"
          required
          defaultValue={initial?.metier ?? ""}
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Votre métier...</option>
          {METIERS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          name="region"
          required
          defaultValue={initial?.region ?? ""}
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Votre région...</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          name="anciennete"
          required
          defaultValue={initial?.anciennete ?? ""}
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Ancienneté de l&apos;entreprise...</option>
          <option value="0.5">Moins d&apos;1 an</option>
          <option value="2">1 à 3 ans</option>
          <option value="4">3 à 5 ans</option>
          <option value="10">Plus de 5 ans</option>
        </select>
        <select
          name="effectif"
          required
          defaultValue={initial?.effectif ?? ""}
          className="rounded-[var(--radius-sm)] border-2 border-line px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Effectif...</option>
          <option value="0">Seul(e) (0 salarié)</option>
          <option value="2">1 à 2 salariés</option>
          <option value="9">3 à 9 salariés</option>
          <option value="15">10 salariés ou plus</option>
        </select>

        <div className="sm:col-span-2 flex flex-wrap gap-3">
          {PROJETS.map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="projets"
                value={v}
                defaultChecked={initial?.projets?.includes(v)}
              />
              {l}
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="sm:col-span-2 rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
        >
          Découvrir mes aides potentielles
        </button>
      </form>

      {result && (
        <div>
          <div className="mb-4 rounded-[var(--radius)] border border-gold bg-[var(--gold-tint)] p-4">
            <p className="font-display text-lg font-bold">
              Total estimé : {result.total.toLocaleString("fr-FR")} €
            </p>
            <p className="text-sm text-ink-soft">
              {result.matches.length} dispositif{result.matches.length > 1 ? "s" : ""} potentiellement
              accessible{result.matches.length > 1 ? "s" : ""}
              {saving ? " · sauvegarde du profil..." : ""}
            </p>
          </div>
          <p className="mb-3 text-xs text-ink-faint">
            ⚠️ Sélection indicative et non exhaustive de dispositifs courants, à titre d&apos;exemple —
            montants, conditions d&apos;éligibilité et disponibilité à vérifier auprès de chaque organisme
            avant toute démarche.
          </p>
          <div className="flex flex-col gap-2">
            {result.matches.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
                <div>
                  <span className="mb-1 inline-block rounded-full bg-primary-tint px-2 py-0.5 text-[10px] font-bold uppercase text-primary-dark">
                    {a.type}
                  </span>
                  <p className="font-semibold">{a.nom}</p>
                  <p className="text-xs text-ink-faint">{a.desc}</p>
                </div>
                <p className="whitespace-nowrap font-display font-bold text-gold">
                  {a.montantMax.toLocaleString("fr-FR")} €
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
