"use client";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge, Button, Card } from "@/components/ui/kit";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/ui/toast";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string };

export function TotpManager() {
  const t = useTranslations("settings.security");
  const dateLocale = useLocale() === "en" ? "en-GB" : "fr-FR";
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
    const { data, error } = await sb().auth.mfa.enroll({ factorType: "totp", friendlyName: t("appName", { date: new Date().toLocaleDateString(dateLocale) }) });
    setBusy(false);
    if (error || !data) return toast({ title: t("enableFailed"), detail: error?.message, tone: "danger" });
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };
  const verify = async () => {
    if (!enroll) return;
    setBusy(true);
    const { error } = await sb().auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.replace(/\s/g, "") });
    setBusy(false);
    if (error) return toast({ title: t("wrongCode"), detail: t("wrongCodeHint"), tone: "danger" });
    toast({ title: t("enabled"), detail: t("enabledHint"), tone: "ok" });
    setEnroll(null);
    setCode("");
    load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("disableConfirm"))) return;
    const { error } = await sb().auth.mfa.unenroll({ factorId: id });
    if (error) return toast({ title: t("disableFailed"), detail: error.message, tone: "danger" });
    toast({ title: t("disabled"), tone: "ok" });
    load();
  };
  const verified = factors?.filter((f) => f.status === "verified") ?? [];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title={t("authApp")} action={verified.length ? <Badge tone="ok">{t("on")}</Badge> : <Badge tone="warn">{t("off")}</Badge>}>
        {verified.map((f) => (
          <div key={f.id} className="flex items-center justify-between py-1 text-sm">
            <span>{t("factor", { name: f.friendly_name ?? t("defaultName"), date: new Date(f.created_at).toLocaleDateString(dateLocale) })}</span>
            <Button size="sm" onClick={() => remove(f.id)}>{t("disable")}</Button>
          </div>
        ))}
        {!verified.length && !enroll && (
          <>
            <p className="mb-3 text-sm text-muted">{t("recommended")}</p>
            <Button variant="accent" icon="shield" disabled={busy || factors === null} onClick={start}>{t("enable")}</Button>
          </>
        )}
        {enroll && (
          <div className="space-y-3">
            <p className="text-sm">{t("scan")}</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- QR code SVG fourni en data URL par Supabase */}
            <img src={enroll.qr} alt={t("qrAlt")} width={180} height={180} className="rounded-xl bg-white p-2 ring-1 ring-black/10" />
            <p className="text-xs text-muted">
              {t.rich("orKey", { code: () => <code data-testid="totp-secret" className="select-all font-mono">{enroll.secret}</code> })}
            </p>
            <label className="block text-sm">
              {t("codeShown")}
              <input aria-label={t("codeLabel")} inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} className="mt-1 block w-40 rounded-xl px-3 py-2 text-center font-mono tracking-widest ring-1 ring-black/10" />
            </label>
            <Button variant="accent" disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={verify}>{t("verify")}</Button>
          </div>
        )}
      </Card>
      <Card title={t("how")}>
        <ul className="space-y-2 text-sm text-muted">
          <li>{t("how1")}</li>
          <li>{t("how2")}</li>
          <li>{t("how3")}</li>
        </ul>
      </Card>
    </div>
  );
}
