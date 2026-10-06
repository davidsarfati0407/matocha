import { requireAdmin } from "@/lib/admin-auth";
import { listApiTokens } from "@/lib/ops/tokens";
import { revokeTokenAction } from "../actions";
import { AdminShell, Table, fmtDate } from "../_ui";
import { CreateTokenForm } from "./CreateTokenForm";

export default async function TokensPage() {
  const admin = await requireAdmin();
  const tokens = await listApiTokens();
  return (
    <AdminShell email={admin.email} title="Jetons API">
      <p className="max-w-[70ch] opacity-80">
        Un jeton donne accès à l&apos;API Ops (<code>/api/ops/v1</code>) et au serveur MCP (<code>/mcp</code>). Il
        n&apos;est affiché qu&apos;une fois ; seule son empreinte est conservée.
      </p>
      <CreateTokenForm />

      <h2 className="mt-12 text-lg font-semibold">Jetons existants</h2>
      <Table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Préfixe</th>
            <th>Scopes</th>
            <th>Expire</th>
            <th>Dernier usage</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => {
            const expired = t.expires_at && new Date(t.expires_at) <= new Date();
            return (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className="font-mono text-xs">{t.prefix}…</td>
                <td className="text-xs">{t.scopes.join(", ")}</td>
                <td>{t.expires_at ? fmtDate(t.expires_at) : "Jamais"}</td>
                <td>{fmtDate(t.last_used_at)}</td>
                <td>
                  {t.revoked_at ? (
                    "Révoqué"
                  ) : expired ? (
                    "Expiré"
                  ) : (
                    <form action={revokeTokenAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <button className="underline underline-offset-4">Révoquer</button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </AdminShell>
  );
}
