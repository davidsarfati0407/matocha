import { requireAdmin } from "@/lib/admin-auth";
import type { AuditRow } from "@/lib/ops/audit";
import { getStore } from "@/lib/store";
import { AdminShell, Table, fmtDate } from "../_ui";

export default async function AuditPage() {
  const admin = await requireAdmin();
  const rows = await getStore()!.list<AuditRow>("audit_log", {
    orderBy: { column: "created_at", ascending: false },
    limit: 200,
  });
  return (
    <AdminShell email={admin.email} title="Journal d'audit">
      <p className="opacity-80">Les 200 derniers appels et décisions.</p>
      <div className="mt-6">
        <Table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Acteur</th>
              <th>Action</th>
              <th>Route</th>
              <th>Statut</th>
              <th>Avant / après</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
                <td>{r.actor}</td>
                <td className="font-mono text-xs">{r.action}</td>
                <td className="font-mono text-xs">
                  {r.method} {r.route}
                </td>
                <td>{r.status ?? "—"}</td>
                <td>
                  {r.before || r.after ? (
                    <details>
                      <summary className="cursor-pointer text-xs">Voir</summary>
                      <pre className="mt-1 max-w-md overflow-x-auto text-xs">
                        {JSON.stringify({ avant: r.before, apres: r.after }, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
