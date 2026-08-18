import { timingSafeEqual } from "crypto";

/** Comparaison de secrets en temps constant (évite les attaques par timing sur les clés admin). */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
