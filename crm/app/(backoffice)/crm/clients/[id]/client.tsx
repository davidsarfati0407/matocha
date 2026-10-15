"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button, Card } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { createClientFolder, logInteraction } from "../../actions";

export function LogInteraction({ clientId, name }: { clientId: string; name: string }) {
  const t = useTranslations("crm.clients.log");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [channel, setChannel] = useState<"email" | "interne">("email");
  return (
    <Card title={t("title")}>
      <form
        className="flex flex-col gap-3"
        action={(fd) =>
          start(async () => {
            if (report(await logInteraction(clientId, channel, String(fd.get("subject")), String(fd.get("body"))))) router.refresh();
          })
        }
      >
        <Field label={t("type")}>
          <Select value={channel} onChange={(e) => setChannel(e.target.value as "email")}>
            <option value="email">{t("email")}</option>
            <option value="interne">{t("internal")}</option>
          </Select>
        </Field>
        <Field label={t("subject")}>
          <Input name="subject" required defaultValue={channel === "email" ? `${name} — suivi` : "Appel" /* objet enregistré / envoyé au client : langue de l'entreprise */} key={channel} />
        </Field>
        <Field label={t("body")}>
          <Textarea name="body" required placeholder={channel === "email" ? t("emailPlaceholder") : t("callPlaceholder")} />
        </Field>
        <Button variant="primary" disabled={pending}>
          {t("save")}
        </Button>
      </form>
    </Card>
  );
}

export function FolderButton({ clientId, url }: { clientId: string; url: string | null }) {
  const t = useTranslations("crm.clients");
  const router = useRouter();
  const [pending, start] = useTransition();
  if (url) return <a className="text-xs font-medium text-accent" href={url} target="_blank" rel="noreferrer">{t("folderOpen")}</a>;
  return (
    <button className="text-xs font-medium text-accent disabled:opacity-50" disabled={pending} onClick={() => start(async () => { if (report(await createClientFolder(clientId))) router.refresh(); })}>
      {t("folderCreate")}
    </button>
  );
}
