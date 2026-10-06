import { getAdminSession } from "@/lib/admin-auth";
import { audit } from "@/lib/ops/audit";
import { getOperation } from "@/lib/ops/service";

/** CSV of confirmed leads only, for an authenticated admin. */
export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return new Response("Non autorisé", { status: 401 });
  const result = await getOperation("leads_export")!.run({}, { token: null, actor: `admin:${admin.email}` });
  await audit({
    actor: `admin:${admin.email}`,
    token_id: null,
    action: "leads_export",
    method: "GET",
    route: "/admin/inscrits/export",
    status: 200,
    before: null,
    after: null,
  });
  return new Response(String(result.body), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="matocha-waitlist.csv"',
      "Cache-Control": "no-store",
    },
  });
}
