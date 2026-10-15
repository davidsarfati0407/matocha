"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/kit";
import type { Provider } from "@/lib/integrations/providers";
import { report } from "@/lib/ui/toast";
import { disconnect, retryJob, runQueue, testConnection } from "./actions";

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return { pending, run: (fn: () => Promise<Parameters<typeof report>[0]>) => start(async () => { report(await fn()); router.refresh(); }) };
}

export function TestButton() {
  const t = useTranslations("settings.integrations");
  const { pending, run } = useAct();
  return <Button icon="plug" disabled={pending} onClick={() => run(testConnection)}>{t("test")}</Button>;
}
export function QueueRunner() {
  const t = useTranslations("settings.integrations");
  const { pending, run } = useAct();
  return <Button icon="zap" disabled={pending} onClick={() => run(runQueue)}>{t("runQueue")}</Button>;
}
export function Disconnect({ provider }: { provider: Provider }) {
  const t = useTranslations("settings.integrations");
  const { pending, run } = useAct();
  return <Button disabled={pending} onClick={() => confirm(t("disconnectConfirm")) && run(() => disconnect(provider))}>{t("disconnect")}</Button>;
}
export function JobRetry({ id }: { id: string }) {
  const t = useTranslations("settings.integrations");
  const { pending, run } = useAct();
  return <Button size="sm" disabled={pending} onClick={() => run(() => retryJob(id))}>{t("retry")}</Button>;
}
