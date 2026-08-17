"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const ref = useSearchParams().get("ref");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const next = ref ? `/dashboard?ref=${encodeURIComponent(ref)}` : "/dashboard";
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-line bg-surface p-8 shadow-sm">
        <a href="https://getfacilo.fr" className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            F
          </span>
          Facilo
        </a>

        <h1 className="mb-2 text-2xl font-bold">Connexion à Facilo Pro</h1>
        <p className="mb-6 text-sm text-ink-soft">
          Pas de mot de passe à retenir : on vous envoie un lien de connexion par email.
        </p>

        {status === "sent" ? (
          <p className="rounded-[var(--radius-sm)] bg-primary-tint p-4 text-sm font-medium text-primary-dark">
            Vérifiez votre boîte mail : un lien de connexion vient de vous être envoyé à {email}.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr"
              className="rounded-[var(--radius-sm)] border-2 border-line px-4 py-3 text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-[var(--radius-sm)] bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)] transition disabled:opacity-60"
            >
              {status === "sending" ? "Envoi..." : "Recevoir mon lien de connexion"}
            </button>
            {status === "error" && (
              <p className="text-sm font-semibold text-warn">{errorMsg}</p>
            )}
          </form>
        )}

        <p className="mt-6 text-xs text-ink-faint">
          Pas encore de compte ? Le même lien crée votre compte automatiquement à la première connexion.
        </p>
      </div>
    </main>
  );
}
