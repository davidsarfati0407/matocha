"use client";
import { useRouter } from "next/navigation";
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
  const columns: Column<R>[] = [
    { key: "name", header: "Compte", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "segment", header: "Segment", cell: (r) => r.segment || (r.kind === "particulier" ? "Particulier" : "—"), filter: true },
    { key: "city", header: "Ville", cell: (r) => r.city || "—", filter: true, hideOnMobile: true },
    { key: "owner", header: "Responsable", cell: (r) => r.owner || "—", filter: true, hideOnMobile: true },
    { key: "ca", header: "CA facturé HT", align: "right", value: (r) => r.ca, cell: (r) => formatMoney(r.ca, "fr", 0) },
    { key: "due", header: "Reste dû", align: "right", value: (r) => r.due, cell: (r) => (r.due ? <span className="font-semibold text-[#b3402a]">{formatMoney(r.due, "fr", 0)}</span> : "—") },
    { key: "pipe", header: "Pipeline pondéré", align: "right", value: (r) => r.pipe, cell: (r) => (r.pipe ? formatMoney(r.pipe, "fr", 0) : "—"), hideOnMobile: true },
    { key: "satisfaction", header: "Satisfaction", value: (r) => r.satisfaction ?? 0, cell: (r) => (r.satisfaction ? "★".repeat(r.satisfaction) + "☆".repeat(5 - r.satisfaction) : "—"), hideOnMobile: true },
    { key: "last", header: "Dernier contact", value: (r) => r.last ?? "", cell: (r) => (r.last ? formatDate(r.last) : "—") },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/crm/clients/${r.id}`} module="crm:clients" exportName="comptes" initialSort={{ key: "ca", dir: "desc" }} />;
}

export function NewClient() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        Nouveau compte
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nouveau compte">
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              const r = await createClientAccount({ kind: fd.get("kind") as "entreprise", name: String(fd.get("name")), segment: String(fd.get("segment") || ""), email: String(fd.get("email") || ""), phone: String(fd.get("phone") || ""), city: String(fd.get("city") || "") });
              if (report(r) && r.ok && r.data) router.push(`/crm/clients/${r.data.id}`);
            })
          }
        >
          <Field label="Type">
            <Select name="kind">
              <option value="entreprise">Professionnel</option>
              <option value="particulier">Particulier</option>
            </Select>
          </Field>
          <Field label="Nom">
            <Input name="name" required autoFocus />
          </Field>
          <Field label="Segment" hint="café, hôtel, concept store, cadeaux d'entreprise…">
            <Input name="segment" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail">
              <Input name="email" type="email" />
            </Field>
            <Field label="Téléphone">
              <Input name="phone" />
            </Field>
          </div>
          <Field label="Ville">
            <Input name="city" />
          </Field>
          <Button variant="accent" disabled={pending}>
            Créer le compte
          </Button>
        </form>
      </Drawer>
    </>
  );
}
