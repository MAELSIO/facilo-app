"use client";

import { useState } from "react";

export function ReferralLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/login?ref=${code}` : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      <input
        readOnly
        value={url}
        className="min-w-0 flex-1 rounded-[var(--radius-sm)] border-2 border-line bg-surface-alt px-3 py-2 text-sm text-ink-soft"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-sm font-bold text-white shadow-[0_4px_0_var(--primary-dark)]"
      >
        {copied ? "Copié !" : "Copier le lien"}
      </button>
    </div>
  );
}
