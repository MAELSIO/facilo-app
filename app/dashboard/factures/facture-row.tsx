"use client";

import { useState } from "react";
import { buildEmail, buildSms, buildSubject, daysLate } from "@/lib/generators/relance-facture";
import { markFacturePayeeAction, deleteFactureAction } from "@/lib/actions/factures";

interface FactureRowProps {
  id: string;
  numero: string | null;
  montant: number;
  echeance: string;
  statut: "impayee" | "payee" | "annulee";
  infos_paiement: string | null;
  clientNom: string;
  clientType: "particulier" | "professionnel";
  entreprise: string;
}

export function FactureRow(props: FactureRowProps) {
  const [open, setOpen] = useState(false);

  const days = daysLate(new Date(props.echeance));
  const level = days > 21 ? 3 : days > 7 ? 2 : 1;

  const input = {
    artisan: props.entreprise,
    client: props.clientNom,
    invoice: props.numero || undefined,
    amount: props.montant,
    dueDate: new Date(props.echeance),
    clientType: props.clientType,
    level: level as 1 | 2 | 3,
    payinfo: props.infos_paiement || undefined,
  };

  return (
    <div className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {props.clientNom} {props.numero ? `— ${props.numero}` : ""}
          </p>
          <p className="text-xs text-ink-faint">
            {props.montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € · échéance{" "}
            {new Date(props.echeance).toLocaleDateString("fr-FR")}
            {props.statut === "impayee" && days > 0 ? ` · ${days} j de retard` : ""}
            {props.statut === "payee" ? " · Payée ✓" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {props.statut === "impayee" && (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="rounded-[var(--radius-sm)] border-2 border-ink px-3 py-1.5 text-xs font-bold"
              >
                {open ? "Masquer" : "Voir la relance"}
              </button>
              <form action={markFacturePayeeAction}>
                <input type="hidden" name="id" value={props.id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold text-white"
                >
                  Marquer payée
                </button>
              </form>
            </>
          )}
          <form action={deleteFactureAction}>
            <input type="hidden" name="id" value={props.id} />
            <button type="submit" className="text-xs font-semibold text-warn hover:underline">
              Supprimer
            </button>
          </form>
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-surface-alt p-3 text-xs">
          <p className="mb-1 font-bold">Objet : {buildSubject(input)}</p>
          <p className="whitespace-pre-wrap text-ink-soft">{buildEmail(input)}</p>
          <p className="mt-3 mb-1 font-bold">Version SMS</p>
          <p className="whitespace-pre-wrap text-ink-soft">{buildSms(input)}</p>
          <p className="mt-3 text-ink-faint">
            Cette relance sera envoyée automatiquement par email à J+7, J+15 et J+30 après
            l&apos;échéance tant que la facture n&apos;est pas marquée payée (Phase 3).
          </p>
        </div>
      )}
    </div>
  );
}
