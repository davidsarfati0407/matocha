import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { getStore } from "@/lib/store";
import type { LeadRow } from "@/lib/waitlist/service";
import { AdminShell, Table, fmtDate } from "../_ui";

export default async function LeadsPage() {
  const admin = await requireAdmin();
  const leads = await getStore()!.list<LeadRow>("leads", { orderBy: { column: "created_at", ascending: false } });
  const count = (s: LeadRow["status"]) => leads.filter((l) => l.status === s).length;

  return (
    <AdminShell email={admin.email} title="Liste d'attente">
      <p className="opacity-80">
        {count("confirmed")} confirmé(s) · {count("pending")} en attente de confirmation · {count("unsubscribed")}{" "}
        désinscrit(s)
      </p>
      <p className="mt-3">
        <Link href="/admin/inscrits/export" prefetch={false} className="underline underline-offset-4">
          Exporter les inscrits confirmés (CSV)
        </Link>
      </p>
      <div className="mt-6">
        <Table>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Statut</th>
              <th>Intérêts</th>
              <th>Tags</th>
              <th>Inscription</th>
              <th>Consentement</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.email}</td>
                <td>{{ pending: "En attente", confirmed: "Confirmé", unsubscribed: "Désinscrit" }[l.status]}</td>
                <td>{l.interests.join(", ") || "—"}</td>
                <td>{(l.tags ?? []).join(", ") || "—"}</td>
                <td>{fmtDate(l.created_at)}</td>
                <td className="font-mono text-xs">{l.consent_version}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
