/**
 * Tests des droits (RLS) contre une vraie API Supabase (locale) :
 *   pnpm test:rls   (après `pnpm db:reset`)
 * Chaque compte de démo se connecte par mot de passe ; on vérifie ce qu'il voit.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it } from "vitest";
import { sectorConfig } from "@/config/sector.config";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const PASSWORD = "matocha-demo";

const clients: Record<string, SupabaseClient> = {};
async function as(role: string) {
  if (clients[role]) return clients[role];
  const email = sectorConfig.roles.find((r) => r.id === role)!.compteDemo.email;
  const c = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`${role} : ${error.message}`);
  return (clients[role] = c);
}
const count = async (c: SupabaseClient, table: string) => {
  const { count: n, error } = await c.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return n ?? 0;
};

beforeAll(() => {
  if (!ANON) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY manquant (voir .env.example)");
});

describe("anonyme", () => {
  it("ne voit aucune donnée", async () => {
    const anon = createClient(URL, ANON, { auth: { persistSession: false } });
    expect(await count(anon, "employees")).toBe(0);
    expect(await count(anon, "employee_salaries")).toBe(0);
    expect(await count(anon, "orgs")).toBe(0);
  });
});

describe("salaires", () => {
  it.each(["employe", "commercial", "finance", "operations", "manager", "admin", "lecture"])("%s ne voit aucun salaire", async (role) => {
    const c = await as(role);
    expect(await count(c, "employee_salaries")).toBe(0);
    const { data: emp } = await c.from("employees").select("id").limit(1).single();
    const { error } = await c.rpc("reveal_salary", { emp: emp!.id });
    expect(error?.code).toBe("42501");
  });

  it.each(["rh", "direction"])("%s voit les salaires et la révélation est journalisée", async (role) => {
    const c = await as(role);
    expect(await count(c, "employee_salaries")).toBeGreaterThan(30);
    const { data: emp } = await c.from("employees").select("id").eq("job_key", "preparateur").limit(1).single();
    const { data, error } = await c.rpc("reveal_salary", { emp: emp!.id });
    expect(error).toBeNull();
    expect(data.gross_annual).toBeGreaterThan(20000);
    const direction = await as("direction");
    const { data: logs } = await direction.from("audit_log").select("action,row_id").eq("action", "reveal").limit(5);
    expect(logs!.length).toBeGreaterThan(0);
  });
});

describe("cloisonnement par module", () => {
  it("l'annuaire et la présence sont visibles de tous les membres", async () => {
    const c = await as("employe");
    expect(await count(c, "employees")).toBe(31);
    expect(await count(c, "presence_status")).toBe(31);
  });
  it("finance : factures oui, devis en lecture seule", async () => {
    const c = await as("finance");
    expect(await count(c, "invoices")).toBeGreaterThan(5);
    const { error } = await c.from("quotes").update({ status: "rejected" }).eq("number", "Q-2026-0143").select();
    const { data } = await (await as("direction")).from("quotes").select("status").eq("number", "Q-2026-0143").single();
    expect(error === null && data!.status).toBe("draft"); // mise à jour filtrée par RLS, aucune ligne touchée
  });
  it("collaborateur : ni factures, ni devis, ni comptes", async () => {
    const c = await as("employe");
    expect(await count(c, "invoices")).toBe(0);
    expect(await count(c, "quotes")).toBe(0);
    expect(await count(c, "clients")).toBe(0);
  });
  it("personne ne peut fabriquer un événement du fil (réservé aux triggers)", async () => {
    for (const role of ["lecture", "direction"]) {
      const c = await as(role);
      const { error } = await c.from("activity_events").insert({ type: "faux", entity: "employees" });
      expect(error?.code).toBe("42501");
    }
  });
  it("lecture seule : ne peut modifier ni commande pro ni stock", async () => {
    const c = await as("lecture");
    const { data } = await c.from("work_orders").update({ stage: "livree" }).eq("number", "CP-24-0607").select();
    expect(data).toEqual([]);
    const { error } = await c.from("stock_movements").insert({ stock_item_id: "00000000-0000-0000-0000-000000000000", kind: "entree", quantity: 1 });
    expect(error?.code).toBe("42501");
  });
  it("congés : un collaborateur ne voit que les siens", async () => {
    const c = await as("employe");
    const { data } = await c.from("leave_requests").select("employee_id");
    const ids = new Set(data!.map((r) => r.employee_id));
    expect(ids.size).toBeLessThanOrEqual(1);
    const rh = await as("rh");
    expect(await count(rh, "leave_requests")).toBeGreaterThan(5);
  });
});

describe("badge → événement (flux unique)", () => {
  it("un collaborateur badge pour lui-même et l'événement apparaît dans le fil", async () => {
    const c = await as("employe");
    const { data: me } = await c.from("profiles").select("employee_id").not("employee_id", "is", null).eq("full_name", "Manon Girard").single();
    const { error } = await c.from("badge_events").insert({ employee_id: me!.employee_id, kind: "in", reader: "accueil", source: "manuel" });
    expect(error).toBeNull();
    const { data: ev } = await c.from("activity_events").select("type").eq("entity_id", me!.employee_id).order("at", { ascending: false }).limit(1).single();
    expect(ev!.type).toBe("badge.in");
  });
  it("mais ne peut pas badger pour un collègue", async () => {
    const c = await as("employe");
    const { data: other } = await c.from("employees").select("id").eq("job_key", "daf").single();
    const { error } = await c.from("badge_events").insert({ employee_id: other!.id, kind: "in" });
    expect(error).not.toBeNull();
  });
});

describe("KPI partagés", () => {
  it("renvoient des valeurs pour tout membre", async () => {
    const c = await as("lecture");
    const [a, b, k] = await Promise.all([c.rpc("kpi_orders_today"), c.rpc("kpi_shipped_on_time"), c.rpc("kpi_revenue_today")]);
    expect(a.data.value).toBeGreaterThan(0);
    expect(b.data.value).toBeGreaterThan(0.9);
    expect(k.data.value).toBeGreaterThan(0);
  });
});
