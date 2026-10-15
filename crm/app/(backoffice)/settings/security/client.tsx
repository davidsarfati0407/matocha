"use client";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui/kit";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/ui/toast";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string };

export function TotpManager() {
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const sb = () => createClient();
  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);
  useEffect(() => {
    let live = true;
    void createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => live && setFactors((data?.all ?? []).filter((f) => f.factor_type === "totp") as Factor[]));
    return () => {
      live = false;
    };
  }, [version]);
  const start = async () => {
    setBusy(true);
    // Un facteur non vérifié précédent bloquerait un nouvel enrôlement : on le retire
    for (const f of factors ?? []) if (f.status !== "verified") await sb().auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb().auth.mfa.enroll({ factorType: "totp", friendlyName: `Application ${new Date().toLocaleDateString("fr-FR")}` });
    setBusy(false);
    if (error || !data) return toast({ title: "Activation impossible", detail: error?.message, tone: "danger" });
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };
  const verify = async () => {
    if (!enroll) return;
    setBusy(true);
    const { error } = await sb().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) return toast({ title: "Code incorrect", detail: "Vérifiez l'heure de votre téléphone et réessayez.", tone: "danger" });
    toast({ title: "Double authentification activée", detail: "Le code sera demandé à chaque connexion.", tone: "ok" });
    setEnroll(null);
    setCode("");
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Désactiver la double authentification ?")) return;
    const { error } = await sb().auth.mfa.unenroll({ factorId: id });
    if (error) return toast({ title: "Désactivation impossible", detail: error.message, tone: "danger" });
    toast({ title: "Double authentification désactivée", tone: "ok" });
    load();
  };
  const verified = factors?.filter((f) => f.status === "verified") ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Application d'authentification" action={verified.length ? <Badge tone="ok">Activée</Badge> : <Badge tone="warn">Désactivée</Badge>}>
        {verified.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-1 text-sm">
            <span>{f.friendly_name ?? "Application"} · depuis le {new Date(f.created_at).toLocaleDateString("fr-FR")}</span>
            <Button size="sm" onClick={() => remove(f.id)}>Désactiver</Button>
          </div>
        ))}
        {!verified.length && !enroll && (
          <>
            <p className="mb-3 text-sm text-muted">Recommandé pour les rôles qui voient les salaires ou la finance.</p>
            <Button variant="accent" icon="shield" disabled={busy || factors === null} onClick={start}>Activer</Button>
          </>
        )}
        {enroll && (
          <div className="space-y-3">
            <p className="text-sm">1. Scannez ce QR code avec votre application.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code SVG fourni en data URL par Supabase */}
            <img src={enroll.qr} alt="QR code d'enrôlement TOTP" width={180} height={180} className="rounded-xl bg-white p-2 ring-1 ring-black/10" />
            <p className="text-xs text-muted">
              Ou saisissez la clé : <code data-testid="totp-secret" className="select-all font-mono">{enroll.secret}</code>
            </p>
            <label className="block text-sm">
              2. Code affiché
              <input aria-label="Code de vérification" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 block w-40 rounded-xl px-3 py-2 text-center font-mono tracking-widest ring-1 ring-black/10" />
            </label>
            <Button variant="accent" disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={verify}>Vérifier et activer</Button>
          </div>
        )}
      </Card>
      <Card title="Comment ça marche">
        <ul className="space-y-2 text-sm text-muted">
          <li>• À la connexion, après le mot de passe, le code à 6 chiffres de l'application est demandé.</li>
          <li>• Tant que le code n'est pas saisi, aucune page ni aucune API n'est accessible (vérifié côté serveur).</li>
          <li>• Le secret est stocké par le service d'authentification, jamais par l'application.</li>
        </ul>
      </Card>
    </div>
  );
}
