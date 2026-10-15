"use client";
import { nowMs } from "@/lib/clock";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { setAssetStatus } from "../../actions";

export function AssetActions({ id, status, next }: { id: string; status: string; next: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (s: string, n?: string) => start(async () => { if (report(await setAssetStatus(id, s, n))) router.refresh(); });
  const in6m = new Date(nowMs() + 182 * 86400_000).toISOString().slice(0, 10);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {status === "ok" || status === "en_service" ? (
        <>
          <Button size="sm" icon="tool" disabled={pending} onClick={() => run("maintenance")}>
            Mettre en maintenance
          </Button>
          <Button size="sm" disabled={pending} onClick={() => run("panne")}>
            Signaler une panne
          </Button>
        </>
      ) : (
        <Button size="sm" variant="accent" icon="check" disabled={pending} onClick={() => run("ok", next && next > new Date().toISOString().slice(0, 10) ? undefined : in6m)}>
          Remettre en service{next && next > new Date().toISOString().slice(0, 10) ? "" : " (prochaine visite dans 6 mois)"}
        </Button>
      )}
    </div>
  );
}
