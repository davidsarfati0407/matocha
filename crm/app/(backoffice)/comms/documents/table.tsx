"use client";
import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate } from "@/lib/format";

type R = { id: string; name: string; kind: string; owner: string; date: string; open: string | null; link: string | null; stored: boolean };

export function DocumentsTable({ rows }: { rows: R[] }) {
  const columns: Column<R>[] = [
    { key: "name", header: "Document", cell: (r) => (r.open ? <a className="font-medium hover:text-accent" href={r.open} target="_blank" rel="noreferrer">{r.name}</a> : <span className="font-medium">{r.name}</span>) },
    { key: "kind", header: "Type", cell: (r) => r.kind, filter: true },
    { key: "owner", header: "Rattaché à", cell: (r) => (r.link ? <Link className="text-accent" href={r.link}>{r.owner}</Link> : r.owner) },
    { key: "date", header: "Date", value: (r) => r.date, cell: (r) => (r.date ? formatDate(r.date) : "—") },
    { key: "src", header: "Source", value: (r) => (r.stored ? "Déposé" : "Généré"), filter: true, cell: (r) => (r.stored ? <Badge tone="muted">déposé · simulé</Badge> : <Badge tone="ok">généré</Badge>) },
  ];
  return <DataTable rows={rows} columns={columns} module="comms:documents" exportName="documents" />;
}
