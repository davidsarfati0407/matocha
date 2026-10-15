"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Select } from "@/components/ui/Form";
import { btn } from "@/components/ui/kit";

export function ExportPicker({ people }: { people: { id: string; name: string }[] }) {
  const t = useTranslations("settings.privacy");
  const [id, setId] = useState(people[0]?.id ?? "");
  return (
    <div className="flex gap-2">
      <Select aria-label={t("employee")} value={id} onChange={(e) => setId(e.target.value)}>{people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      <a className={btn("primary")} href={`/settings/privacy/export/${id}`} download>{t("export")}</a>
    </div>
  );
}
