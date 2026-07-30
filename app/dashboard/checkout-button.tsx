"use client";

import { useState } from "react";

export function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 inline-block rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)] disabled:opacity-60"
    >
      {loading ? "Redirection..." : "Démarrer l'essai gratuit"}
    </button>
  );
}

export function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded-[var(--radius-sm)] border-2 border-ink px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink hover:text-bg disabled:opacity-60"
    >
      {loading ? "..." : "Gérer mon abonnement"}
    </button>
  );
}
