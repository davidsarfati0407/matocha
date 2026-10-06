import { requireAdmin } from "@/lib/admin-auth";
import { listChangeRequests } from "@/lib/ops/changes";
import { decideAction } from "./actions";
import { AdminShell, StatusBadge, Table, fmtDate } from "./_ui";

export default async function AdminHome() {
  const admin = await requireAdmin();
  const all = await listChangeRequests();
  const pending = all.filter((c) => c.status === "pending");
  const decided = all.filter((c) => c.status !== "pending").slice(0, 30);

  return (
    <AdminShell email={admin.email} title="Demandes à valider">
      {pending.length === 0 ? (
        <p className="opacity-70">Aucune demande en attente.</p>
      ) : (
        <ul className="space-y-4">
          {pending.map((cr) => (
            <li key={cr.id} className="border border-current/15 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{cr.summary}</p>
                <span className="text-xs opacity-60">
                  {cr.kind} · {cr.requested_by} · {fmtDate(cr.created_at)}
                </span>
              </div>
              <details className="mt-2 text-sm">
                <summary className="cursor-pointer opacity-80">Détail (avant / proposé)</summary>
                <pre className="mt-2 overflow-x-auto bg-black/5 p-3 text-xs">
                  {JSON.stringify({ avant: cr.before, propose: cr.payload }, null, 2)}
                </pre>
              </details>
              <form action={decideAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={cr.id} />
                <label className="sr-only" htmlFor={`note-${cr.id}`}>
                  Note
                </label>
                <input
                  id={`note-${cr.id}`}
                  name="note"
                  placeholder="Note (facultatif)"
                  className="min-w-0 flex-1 border border-current/25 bg-transparent px-2 py-1.5"
                />
                <button name="decision" value="approve" className="bg-[#1E3A2A] px-4 py-2 font-semibold text-[#EEEDE0]">
                  Approuver
                </button>
                <button name="decision" value="reject" className="border border-current/40 px-4 py-2 font-semibold">
                  Refuser
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-14 text-lg font-semibold">Décisions récentes</h2>
      <Table>
        <thead>
          <tr>
            <th>Demande</th>
            <th>Statut</th>
            <th>Décidée par</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {decided.map((cr) => (
            <tr key={cr.id}>
              <td>
                {cr.summary}
                {cr.error && <p className="text-xs text-[#7a2a2a]">{cr.error}</p>}
              </td>
              <td>
                <StatusBadge status={cr.status} />
              </td>
              <td>{cr.decided_by ?? "—"}</td>
              <td>{fmtDate(cr.decided_at)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminShell>
  );
}
