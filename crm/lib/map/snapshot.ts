/**
 * Instantané des données affichées par la map. La même fonction sert côté
 * serveur (premier rendu) et côté navigateur (rafraîchissement après un
 * événement) : la map lit exactement les tables du back-office, avec la RLS
 * de l'utilisateur. Aucune donnée propre à la map, sauf la géométrie du plan.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sectorConfig } from "@/config/sector.config";
import type { FloorPlanLayout } from "./layout";

export type PresenceStatus = "au_poste" | "reunion" | "pause" | "teletravail" | "absent" | "deplacement" | "pas_badge" | "parti";

export interface MapEmployee {
  id: string;
  slot: string;
  firstName: string;
  lastName: string;
  jobKey: string;
  jobTitle: string;
  department: string | null;
  managerId: string | null;
  hiredOn: string;
  email: string | null;
  phone: string | null;
  skills: string[];
  avatarColor: string | null;
  appearance: Record<string, string>;
  leaveBalance: number;
  overtime: number;
  contract: string;
  workRate: number;
  status: PresenceStatus;
  since: string | null;
  firstIn: string | null;
  currentEvent: string | null;
  currentEventEndsAt: string | null;
  leaveType: string | null;
  zoneId: string | null;
}

export interface MapAsset {
  id: string;
  key: string;
  type: string;
  name: string;
  status: string;
  zoneId: string | null;
  assignedEmployeeId: string | null;
  specs: Record<string, unknown>;
  telemetry: Record<string, unknown>;
  nextMaintenanceOn: string | null;
}

export interface MapWorkOrder {
  id: string;
  number: string;
  title: string;
  stage: string;
  status: string;
  blockedReason: string | null;
  progress: number;
  physicalObject: string | null;
  clientId: string;
  clientName: string | null;
  ownerId: string | null;
  zoneId: string | null;
  dueAt: string | null;
  receivedAt: string | null;
  amountHt: number;
  amountTtc: number;
  hoursBudget: number;
  quoteId: string | null;
  stages: { stage: string; enteredAt: string; leftAt: string | null }[];
  checklist: { label: string; done: boolean; progress?: number | null }[];
}

export interface MapStockItem {
  id: string;
  reference: string;
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  location: string | null;
  unitCost: number;
  onOrder: boolean;
}

export interface MapLot {
  id: string;
  number: string;
  stockItemId: string;
  quantity: number;
  status: string;
  receivedAt: string | null;
  bestBefore: string | null;
}

export interface MapCalendarEvent {
  id: string;
  ownerId: string | null;
  resourceId: string | null;
  type: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendees: string[];
}

export interface Kpi {
  value: number | null;
  delta: number | null;
  [k: string]: unknown;
}

export interface MapSnapshot {
  fetchedAt: string;
  org: { id: string; name: string; demoMode: boolean; settings: Record<string, unknown> };
  site: { id: string; slug: string; name: string; address: string | null };
  plan: { id: string; version: number; status: string; layout: FloorPlanLayout };
  zones: { id: string; key: string; code: string; name: string; type: string; capacity: number; description: string | null }[];
  employees: MapEmployee[];
  assets: MapAsset[];
  workOrders: MapWorkOrder[];
  stock: MapStockItem[];
  lots: MapLot[];
  calendar: MapCalendarEvent[];
  bookings: { assetId: string; title: string | null; startsAt: string; endsAt: string; employeeId: string | null }[];
  kpis: Record<string, Kpi>;
  shopToday: { total: number; toPack: number; packed: number; byStation: Record<string, number> };
  me: { userId: string; fullName: string; employeeId: string | null; role: string; roleLabel: string; seesSalaries: boolean; editsPlan: boolean; permissions: string[] };
}

const n = (v: unknown) => (v == null ? 0 : Number(v));

export async function loadSnapshot(supabase: SupabaseClient, siteSlug: string, opts: { planId?: string } = {}): Promise<MapSnapshot | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: site } = await supabase.from("sites").select("id, slug, name, address, org_id").eq("slug", siteSlug).maybeSingle();
  if (!site) return null;

  const planQuery = opts.planId
    ? supabase.from("floor_plans").select("id, version, status, layout").eq("id", opts.planId).single()
    : supabase.from("floor_plans").select("id, version, status, layout").eq("site_id", site.id).eq("status", "published").order("version", { ascending: false }).limit(1).single();

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 36 * 3600_000);

  // KPI : la fiche indique la fonction Postgres qui calcule chaque indicateur
  const kpiCalls = Promise.all(sectorConfig.kpisEnTete.map((k) => supabase.rpc(k.source.replace(/\(\)$/, ""))));
  const [org, plan, profile, zones, employees, presence, depts, assets, wos, stages, checklists, stock, lots, calendar, bookings, kpiResults, shop] = await Promise.all([
    supabase.from("orgs").select("id, name, demo_mode, settings").eq("id", site.org_id).single(),
    planQuery,
    supabase.from("profiles").select("full_name, employee_id, role_id, roles(key, label, sees_salaries, edits_plan)").eq("user_id", user.id).single(),
    supabase.from("zones").select("id, key, code, name, type, capacity, description").eq("site_id", site.id),
    supabase.from("employees").select("id, first_name, last_name, job_key, job_title, department_id, manager_id, hired_on, email, phone, skills, avatar_color, appearance, leave_balance_days, overtime_hours, contract_type, work_rate").eq("site_id", site.id).is("left_on", null),
    supabase.from("presence_status").select("employee_id, status, since, first_in, current_event, current_event_ends_at, leave_type, zone_id"),
    supabase.from("departments").select("id, name"),
    supabase.from("assets").select("id, key, type, name, status, zone_id, assigned_employee_id, specs, telemetry, next_maintenance_on").eq("site_id", site.id),
    supabase.from("work_orders").select("id, number, title, stage, status, blocked_reason, progress, physical_object, client_id, owner_id, zone_id, due_at, received_at, amount_ht, amount_ttc, hours_budget, quote_id, clients(name)").order("number"),
    supabase.from("work_order_stages").select("work_order_id, stage, entered_at, left_at").order("entered_at"),
    supabase.from("checklists").select("work_order_id, items"),
    supabase.from("stock_items").select("id, reference, name, category, quantity, min_quantity, location, unit_cost, on_order").order("location"),
    supabase.from("lots").select("id, number, stock_item_id, quantity, status, received_at, best_before"),
    supabase.from("calendar_events").select("id, owner_id, resource_id, type, title, starts_at, ends_at, attendees").gte("ends_at", dayStart.toISOString()).lte("starts_at", dayEnd.toISOString()).order("starts_at"),
    supabase.from("asset_bookings").select("asset_id, title, starts_at, ends_at, employee_id").gte("ends_at", dayStart.toISOString()).lte("starts_at", dayEnd.toISOString()),
    kpiCalls,
    supabase.from("shop_orders").select("status, pack_station").gte("ordered_at", dayStart.toISOString()).lte("ordered_at", new Date().toISOString()),
  ]);
  if (!plan.data || !org.data) return null;

  const role = profile.data?.roles as unknown as { key: string; label: string; sees_salaries: boolean; edits_plan: boolean } | null;
  const { data: perms } = await supabase.from("permissions").select("module, action").eq("role_id", profile.data?.role_id ?? "");
  const deptBy = new Map((depts.data ?? []).map((d) => [d.id, d.name]));
  const presBy = new Map((presence.data ?? []).map((p) => [p.employee_id, p]));
  const stagesBy = new Map<string, MapWorkOrder["stages"]>();
  for (const s of stages.data ?? []) {
    const list = stagesBy.get(s.work_order_id) ?? [];
    list.push({ stage: s.stage, enteredAt: s.entered_at, leftAt: s.left_at });
    stagesBy.set(s.work_order_id, list);
  }
  const checklistBy = new Map((checklists.data ?? []).map((c) => [c.work_order_id, c.items as MapWorkOrder["checklist"]]));
  const shopRows = shop.data ?? [];
  const byStation: Record<string, number> = {};
  for (const r of shopRows) if (r.status === "preparation" && r.pack_station) byStation[r.pack_station] = (byStation[r.pack_station] ?? 0) + 1;

  return {
    fetchedAt: new Date().toISOString(),
    org: { id: org.data.id, name: org.data.name, demoMode: org.data.demo_mode, settings: org.data.settings ?? {} },
    site: { id: site.id, slug: site.slug, name: site.name, address: site.address },
    plan: { id: plan.data.id, version: plan.data.version, status: plan.data.status, layout: plan.data.layout as FloorPlanLayout },
    zones: zones.data ?? [],
    employees: (employees.data ?? []).map((e) => {
      const p = presBy.get(e.id);
      return {
        id: e.id,
        slot: (e.appearance as Record<string, string>)?.slot ?? e.job_key,
        firstName: e.first_name,
        lastName: e.last_name,
        jobKey: e.job_key,
        jobTitle: e.job_title,
        department: deptBy.get(e.department_id) ?? null,
        managerId: e.manager_id,
        hiredOn: e.hired_on,
        email: e.email,
        phone: e.phone,
        skills: e.skills ?? [],
        avatarColor: e.avatar_color,
        appearance: (e.appearance ?? {}) as Record<string, string>,
        leaveBalance: n(e.leave_balance_days),
        overtime: n(e.overtime_hours),
        contract: e.contract_type,
        workRate: n(e.work_rate),
        status: (p?.status ?? "absent") as PresenceStatus,
        since: p?.since ?? null,
        firstIn: p?.first_in ?? null,
        currentEvent: p?.current_event ?? null,
        currentEventEndsAt: p?.current_event_ends_at ?? null,
        leaveType: p?.leave_type ?? null,
        zoneId: p?.zone_id ?? null,
      };
    }),
    assets: (assets.data ?? []).map((a) => ({
      id: a.id,
      key: a.key,
      type: a.type,
      name: a.name,
      status: a.status,
      zoneId: a.zone_id,
      assignedEmployeeId: a.assigned_employee_id,
      specs: a.specs ?? {},
      telemetry: a.telemetry ?? {},
      nextMaintenanceOn: a.next_maintenance_on,
    })),
    workOrders: (wos.data ?? []).map((w) => ({
      id: w.id,
      number: w.number,
      title: w.title,
      stage: w.stage,
      status: w.status,
      blockedReason: w.blocked_reason,
      progress: n(w.progress),
      physicalObject: w.physical_object,
      clientId: w.client_id,
      clientName: (w.clients as unknown as { name: string } | null)?.name ?? null,
      ownerId: w.owner_id,
      zoneId: w.zone_id,
      dueAt: w.due_at,
      receivedAt: w.received_at,
      amountHt: n(w.amount_ht),
      amountTtc: n(w.amount_ttc),
      hoursBudget: n(w.hours_budget),
      quoteId: w.quote_id,
      stages: stagesBy.get(w.id) ?? [],
      checklist: checklistBy.get(w.id) ?? [],
    })),
    stock: (stock.data ?? []).map((s) => ({ id: s.id, reference: s.reference, name: s.name, category: s.category, quantity: n(s.quantity), minQuantity: n(s.min_quantity), location: s.location, unitCost: n(s.unit_cost), onOrder: s.on_order })),
    lots: (lots.data ?? []).map((l) => ({ id: l.id, number: l.number, stockItemId: l.stock_item_id, quantity: n(l.quantity), status: l.status, receivedAt: l.received_at, bestBefore: l.best_before })),
    calendar: (calendar.data ?? []).map((c) => ({ id: c.id, ownerId: c.owner_id, resourceId: c.resource_id, type: c.type, title: c.title, startsAt: c.starts_at, endsAt: c.ends_at, attendees: c.attendees ?? [] })),
    bookings: (bookings.data ?? []).map((b) => ({ assetId: b.asset_id, title: b.title, startsAt: b.starts_at, endsAt: b.ends_at, employeeId: b.employee_id })),
    kpis: Object.fromEntries(sectorConfig.kpisEnTete.map((k, i) => [k.id, (kpiResults[i].data ?? { value: null, delta: null }) as Kpi])),
    shopToday: {
      total: shopRows.length,
      toPack: shopRows.filter((r) => r.status === "payee" || r.status === "preparation").length,
      packed: shopRows.filter((r) => r.status === "emballee").length,
      byStation,
    },
    me: {
      userId: user.id,
      fullName: profile.data?.full_name ?? "",
      employeeId: profile.data?.employee_id ?? null,
      role: role?.key ?? "lecture",
      roleLabel: role?.label ?? "",
      seesSalaries: Boolean(role?.sees_salaries),
      editsPlan: Boolean(role?.edits_plan),
      permissions: (perms ?? []).map((p) => `${p.module}:${p.action}`),
    },
  };
}
