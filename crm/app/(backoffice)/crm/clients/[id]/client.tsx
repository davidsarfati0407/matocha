"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button, Card } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { createClientFolder, logInteraction } from "../../actions";

export function LogInteraction({ clientId, name }: { clientId: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [channel, setChannel] = useState<"email" | "interne">("email");
  return (
    <Card title="Nouvel échange">
      <form
        className="flex flex-col gap-3"
        action={(fd) =>
          start(async () => {
            if (report(await logInteraction(clientId, channel, String(fd.get("subject")), String(fd.get("body"))))) router.refresh();
          })
        }
      >
        <Field label="Type">
          <Select value={channel} onChange={(e) => setChannel(e.target.value as "email")}>
            <option value="email">E-mail au client (simulé)</option>
            <option value="interne">Note interne / appel</option>
          </Select>
        </Field>
        <Field label="Objet">
          <Input name="subject" required defaultValue={channel === "email" ? `${name} — suivi` : "Appel"} key={channel} />
        </Field>
        <Field label="Contenu">
          <Textarea name="body" required placeholder={channel === "email" ? "Bonjour, …" : "Compte rendu de l'appel…"} />
        </Field>
        <Button variant="primary" disabled={pending}>
          Enregistrer
        </Button>
      </form>
    </Card>
  );
}

export function FolderButton({ clientId, url }: { clientId: string; url: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (url) return <a className="text-xs font-medium text-accent" href={url} target="_blank" rel="noreferrer">Dossier partagé →</a>;
  return (
    <button className="text-xs font-medium text-accent disabled:opacity-50" disabled={pending} onClick={() => start(async () => { if (report(await createClientFolder(clientId))) router.refresh(); })}>
      Créer le dossier partagé
    </button>
  );
}
