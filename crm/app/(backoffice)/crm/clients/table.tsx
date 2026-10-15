"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { createClientAccount } from "../actions";

type R = { id: string; name: string; kind: string; segment: string; city: string; owner: string; satisfaction: number | null; last: string | null; ca: number; due: number; pipe: number };

export function ClientsTable({ rows }: { rows: R[] }) {
  const t = useTranslations("crm.clients");
  const columns: Column<R>[] = [
    { key: "name", header: t("table.account"), cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "segment", header: t("table.segment"), cell: (r) => r.segment || (r.kind === "particulier" ? t("individual") : "—"), filter: true },
    { key: "city", header: t("table.city"), cell: (r) => r.city || "—", filter: true, hideOnMobile: true },
    { key: "owner", header: t("table.owner"), cell: (r) => r.owner || "—", filter: true, hideOnMobile: true },
    { key: "ca", header: t("table.revenue"), align: "right", value: (r) => r.ca, cell: (r) => formatMoney(r.ca, "fr", 0) },
    { key: "due", header: t("table.due"), align: "right", value: (r) => r.due, cell: (r) => (r.due ? <span className="font-semibold text-[#b3402a]">{formatMoney(r.due, "fr", 0)}</span> : "—") },
    { key: "pipe", header: t("table.pipeline"), align: "right", value: (r) => r.pipe, cell: (r) => (r.pipe ? formatMoney(r.pipe, "fr", 0) : "—"), hideOnMobile: true },
    { key: "satisfaction", header: t("table.satisfaction"), value: (r) => r.satisfaction ?? 0, cell: (r) => (r.satisfaction ? "★".repeat(r.satisfaction) + "☆".repeat(5 - r.satisfaction) : "—"), hideOnMobile: true },
    { key: "last", header: t("table.lastContact"), value: (r) => r.last ?? "", cell: (r) => (r.last ? formatDate(r.last) : "—") },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/crm/clients/${r.id}`} module="crm:clients" exportName={t("table.exportName")} initialSort={{ key: "ca", dir: "desc" }} />;
}

export function NewClient() {
  const t = useTranslations("crm.clients");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        {t("new")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("new")}>
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              const r = await createClientAccount({ kind: fd.get("kind") as "entreprise", name: String(fd.get("name")), segment: String(fd.get("segment") || ""), email: String(fd.get("email") || ""), phone: String(fd.get("phone") || ""), city: String(fd.get("city") || "") });
              if (report(r) && r.ok && r.data) router.push(`/crm/clients/${r.data.id}`);
            })
          }
        >
          <Field label={t("form.type")}>
            <Select name="kind">
              <option value="entreprise">{t("professional")}</option>
              <option value="particulier">{t("individual")}</option>
            </Select>
          </Field>
          <Field label={t("form.name")}>
            <Input name="name" required autoFocus />
          </Field>
          <Field label={t("table.segment")} hint={t("form.segmentHint")}>
            <Input name="segment" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("form.email")}>
              <Input name="email" type="email" />
            </Field>
            <Field label={t("form.phone")}>
              <Input name="phone" />
            </Field>
          </div>
          <Field label={t("table.city")}>
            <Input name="city" />
          </Field>
          <Button variant="accent" disabled={pending}>
            {t("form.submit")}
          </Button>
        </form>
      </Drawer>
    </>
  );
}
