/** Porté depuis assets/js/tools/relance-rdv.js. */
export type TypeMessageRdv = "rappel" | "no-show";
export type TonRdv = "amical" | "formel";

export interface RelanceRdvInput {
  typeMsg: TypeMessageRdv;
  pro: string;
  client: string;
  dateRdv: string;
  lien?: string;
  ton: TonRdv;
}

export function buildSms(input: RelanceRdvInput): string {
  const lienTxt = input.lien ? " " + input.lien : "";

  if (input.typeMsg === "rappel") {
    return input.ton === "amical"
      ? `Coucou ${input.client} ! Petit rappel de votre RDV avec ${input.pro} ${input.dateRdv}. À très vite !${lienTxt}`
      : `Bonjour ${input.client}, nous vous rappelons votre rendez-vous avec ${input.pro} ${input.dateRdv}. Merci de nous prévenir en cas d'empêchement.${lienTxt}`;
  }

  return input.ton === "amical"
    ? `Coucou ${input.client}, on ne vous a pas vu(e) pour votre RDV ${input.dateRdv} ! Tout va bien ? Vous pouvez reprendre RDV quand vous voulez.${lienTxt}`
    : `Bonjour ${input.client}, nous n'avons pas pu vous accueillir pour votre rendez-vous du ${input.dateRdv}. N'hésitez pas à reprendre RDV.${lienTxt}`;
}

export function buildEmail(input: RelanceRdvInput): string {
  const lienTxt = input.lien ? `\n\nVous pouvez reprendre rendez-vous ici : ${input.lien}` : "";
  const signature = `\n\nÀ bientôt,\n${input.pro}`;

  if (input.typeMsg === "rappel") {
    return (
      `Bonjour ${input.client},\n\n` +
      `Nous vous confirmons votre rendez-vous ${input.dateRdv}.\n\n` +
      "Merci de nous prévenir au plus vite en cas d'empêchement, afin que nous puissions proposer ce créneau à un autre client." +
      lienTxt +
      signature
    );
  }

  return (
    `Bonjour ${input.client},\n\n` +
    `Nous n'avons pas eu le plaisir de vous accueillir pour votre rendez-vous ${input.dateRdv}.\n\n` +
    "Si c'est un oubli ou un empêchement de dernière minute, pas de souci : n'hésitez pas à reprendre rendez-vous quand cela vous arrange." +
    lienTxt +
    signature
  );
}
