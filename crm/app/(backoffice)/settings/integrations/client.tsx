"use client";
import { useRouter } from "next/navigation";
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
  const { pending, run } = useAct();
  return <Button icon="plug" disabled={pending} onClick={() => run(testConnection)}>Tester la connexion</Button>;
}
export function QueueRunner() {
  const { pending, run } = useAct();
  return <Button icon="zap" disabled={pending} onClick={() => run(runQueue)}>Traiter la file</Button>;
}
export function Disconnect({ provider }: { provider: Provider }) {
  const { pending, run } = useAct();
  return <Button disabled={pending} onClick={() => confirm("Déconnecter ce compte et supprimer ses jetons ?") && run(() => disconnect(provider))}>Déconnecter</Button>;
}
export function JobRetry({ id }: { id: string }) {
  const { pending, run } = useAct();
  return <Button size="sm" disabled={pending} onClick={() => run(() => retryJob(id))}>Relancer</Button>;
}
