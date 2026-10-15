"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Saisie du code TOTP (application d'authentification) pour atteindre le niveau aal2. */
export function MfaChallenge({ next }: { next: string }) {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => setFactorId(data?.totp.find((f) => f.status === "verified")?.id ?? null));
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await createClient().auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (err) return setError("Code incorrect ou expiré. Réessayez avec le code affiché maintenant.");
    router.replace(next);
    router.refresh();
  };
  return (
    <form onSubmit={submit} className="card w-full max-w-sm p-6">
      <h1 className="text-lg font-semibold">Double authentification</h1>
      <p className="mt-1 text-sm text-muted">Saisissez le code à 6 chiffres de votre application d'authentification.</p>
      <label className="mt-4 block text-[13px] font-medium">
        Code
        <input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1.5 w-full rounded-xl bg-white px-3 py-2 text-center font-mono text-xl tracking-[0.4em] ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-accent/50" />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-[#b3402a]">{error}</p>}
      <button disabled={busy || !factorId || code.replace(/\s/g, "").length !== 6} className="mt-4 w-full rounded-xl bg-accent px-3 py-2 font-medium text-white disabled:opacity-50">
        Vérifier
      </button>
    </form>
  );
}
