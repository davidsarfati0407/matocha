import { NextResponse, type NextRequest } from "next/server";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";

/** Export RGPD d'un collaborateur : uniquement ce que le rôle du demandeur peut lire (RLS). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const me = await getCtx();
  if (!me.can("organisation") && me.employeeId !== id) return NextResponse.json({ error: "droit organisation requis" }, { status: 403 });
  const supabase = await createClient();
  const q = (t: string) => supabase.from(t).select("*").eq("employee_id", id);
  const [emp, badges, leaves, time, expenses, reviews, trainings, onboarding, salaries] = await Promise.all([supabase.from("employees").select("*").eq("id", id).maybeSingle(), q("badge_events"), q("leave_requests"), q("time_entries"), q("expenses"), q("reviews"), q("trainings"), q("onboarding_tasks"), q("employee_salaries")]);
  if (!emp.data) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const body = { exporte_le: new Date().toISOString(), par: me.fullName, collaborateur: emp.data, badges: badges.data, conges: leaves.data, heures: time.data, notes_de_frais: expenses.data, entretiens: reviews.data, formations: trainings.data, integration: onboarding.data, salaires: salaries.data?.length ? salaries.data : "non accessible avec ce rôle" };
  return new NextResponse(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="rgpd-${emp.data.last_name}-${emp.data.first_name}.json"` } });
}
