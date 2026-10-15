import { getTranslations } from "next-intl/server";
import { AiChat } from "@/components/backoffice/AiChat";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { AI_MODEL, aiConfigured } from "@/lib/ai/assistant";
import { requirePerm } from "@/lib/backoffice/context";

export async function generateMetadata() {
  const t = await getTranslations("ai");
  return { title: t("page.title") };
}

export default async function AiPage() {
  const { allowed } = await requirePerm("ia");
  const t = await getTranslations("ai.page");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const on = aiConfigured();
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} actions={on ? <Badge tone="ok">{t("connected", { model: AI_MODEL })}</Badge> : <Badge tone="warn">{t("notConfigured")}</Badge>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false} className="flex flex-col lg:col-span-2"><AiChat /></Card>
        <Card title={t("howTitle")}>
          <ul className="space-y-2 text-sm text-muted">
            {(["how1", "how2", "how3", "how4"] as const).map((k) => <li key={k}>• {t(k)}</li>)}
          </ul>
        </Card>
      </div>
    </>
  );
}
