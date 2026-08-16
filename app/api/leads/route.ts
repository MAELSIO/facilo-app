import { NextResponse, type NextRequest } from "next/server";
import { resend, FACILO_FROM_EMAIL } from "@/lib/resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Capture d'email depuis les outils gratuits du site marketing statique
 * (getfacilo.fr), appelée en cross-origin — voir assets/js/common.js
 * (facCaptureLead) sur ce dépôt-là. Remplace l'ancien webhook FormSubmit.co
 * de test par Resend, deja configure pour les relances automatiques.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const tool = typeof body.tool === "string" ? body.tool : "outil inconnu";

  if (!EMAIL_RE.test(email)) {
    return withCors(NextResponse.json({ error: "Email invalide." }, { status: 400 }), origin);
  }

  await resend.emails.send({
    from: FACILO_FROM_EMAIL,
    to: "maelsiohan01@gmail.com",
    subject: "Nouveau lead Facilo — " + tool,
    html: `<p>Email : ${email}</p><p>Outil : ${tool}</p>`,
  });

  return withCors(NextResponse.json({ ok: true }), origin);
}

export async function OPTIONS(request: NextRequest) {
  return withCors(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

const ALLOWED_ORIGINS = ["https://getfacilo.fr", "https://www.getfacilo.fr"];

function withCors(res: NextResponse, origin?: string | null) {
  res.headers.set(
    "Access-Control-Allow-Origin",
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  );
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
