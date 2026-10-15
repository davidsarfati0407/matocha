import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/kit";
import { TotpManager } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.security");
  return { title: t("metaTitle") };
}

export default function SecurityPage() {
  const t = useTranslations("settings.security");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <TotpManager />
    </>
  );
}
