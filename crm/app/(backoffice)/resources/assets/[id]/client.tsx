"use client";
import { nowMs } from "@/lib/clock";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { setAssetStatus } from "../../actions";

export function AssetActions({ id, status, next }: { id: string; status: string; next: string | null }) {
  const t = useTranslations("resources.asset");
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (s: string, n?: string) => start(async () => { if (report(await setAssetStatus(id, s, n))) router.refresh(); });
  const in6m = new Date(nowMs() + 182 * 86400_000).toISOString().slice(0, 10);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {status === "ok" || status === "en_service" ? (
        <>
          <Button size="sm" icon="tool" disabled={pending} onClick={() => run("maintenance")}>
            {t("maintenance")}
          </Button>
          <Button size="sm" disabled={pending} onClick={() => run("panne")}>
            {t("breakdown")}
          </Button>
        </>
      ) : (
        <Button size="sm" variant="accent" icon="check" disabled={pending} onClick={() => run("ok", next && next > new Date().toISOString().slice(0, 10) ? undefined : in6m)}>
          {next && next > new Date().toISOString().slice(0, 10) ? t("backInService") : t("backInServiceNext")}
        </Button>
      )}
    </div>
  );
}
