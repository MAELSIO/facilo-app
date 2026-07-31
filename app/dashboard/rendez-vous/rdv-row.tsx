"use client";

import { useState } from "react";
import { buildSms, buildEmail } from "@/lib/generators/relance-rdv";
import { updateRdvStatutAction, deleteRdvAction } from "@/lib/actions/rendez-vous";

interface RdvRowProps {
  id: string;
  dateHeure: string;
  service: string | null;
  statut: string;
  clientNom: string;
  entreprise: string;
}

export function RdvRow(props: RdvRowProps) {
  const [open, setOpen] = useState(false);

  const dateFormatted = new Date(props.dateHeure).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const input = {
    typeMsg: "rappel" as const,
    pro: props.entreprise,
    client: props.clientNom,
    dateRdv: dateFormatted,
    ton: "formel" as const,
  };

  return (
    <div className="rounded-[var(--radius-sm)] border border-line bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">
            {props.clientNom} {props.service ? `— ${props.service}` : ""}
          </p>
          <p className="text-xs text-ink-faint">
            {dateFormatted} ·{" "}
            {{ a_venir: "À venir", honore: "Honoré ✓", manque: "Manqué", annule: "Annulé" }[props.statut]}
          </p>
        </div>
        <div className="flex gap-2">
          {props.statut === "a_venir" && (
            <>
              <button
                onClick={() => setOpen((o) => !o)}
                className="rounded-[var(--radius-sm)] border-2 border-ink px-3 py-1.5 text-xs font-bold"
              >
                {open ? "Masquer" : "Voir le rappel"}
              </button>
              <form action={updateRdvStatutAction}>
                <input type="hidden" name="id" value={props.id} />
                <input type="hidden" name="statut" value="honore" />
                <button type="submit" className="rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold text-white">
                  Honoré
                </button>
              </form>
              <form action={updateRdvStatutAction}>
                <input type="hidden" name="id" value={props.id} />
                <input type="hidden" name="statut" value="manque" />
                <button type="submit" className="rounded-[var(--radius-sm)] border-2 border-warn px-3 py-1.5 text-xs font-bold text-warn">
                  Manqué
                </button>
              </form>
            </>
          )}
          <form action={deleteRdvAction}>
            <input type="hidden" name="id" value={props.id} />
            <button type="submit" className="text-xs font-semibold text-warn hover:underline">
              Supprimer
            </button>
          </form>
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-surface-alt p-3 text-xs">
          <p className="mb-1 font-bold">SMS</p>
          <p className="whitespace-pre-wrap text-ink-soft">{buildSms(input)}</p>
          <p className="mt-3 mb-1 font-bold">Email</p>
          <p className="whitespace-pre-wrap text-ink-soft">{buildEmail(input)}</p>
          <p className="mt-3 text-ink-faint">
            Ce rappel sera envoyé automatiquement par email la veille du rendez-vous (Phase 3).
          </p>
        </div>
      )}
    </div>
  );
}
