"use server";
/** Recherche globale (palette ⌘K) et notifications, avec les droits de l'utilisateur. */
import { createClient } from "@/lib/supabase/server";

export interface SearchHit {
  group: string;
  label: string;
  sub?: string;
  href: string;
}

export async function searchAll(q: string): Promise<SearchHit[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const like = `%${term.replace(/[%_]/g, "")}%`;
  const [emps, clients, wos, quotes, invoices, stock, assets] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, job_title").or(`first_name.ilike.${like},last_name.ilike.${like},job_title.ilike.${like}`).limit(6),
    supabase.from("clients").select("id, name, city, segment").or(`name.ilike.${like},city.ilike.${like}`).limit(6),
    supabase.from("work_orders").select("id, number, title, clients(name)").or(`number.ilike.${like},title.ilike.${like}`).limit(6),
    supabase.from("quotes").select("id, number, status, clients(name)").ilike("number", like).limit(5),
    supabase.from("invoices").select("id, number, status, clients(name)").ilike("number", like).limit(5),
    supabase.from("stock_items").select("id, reference, name, location").or(`name.ilike.${like},reference.ilike.${like}`).limit(5),
    supabase.from("assets").select("id, name, type").ilike("name", like).limit(5),
  ]);
  const name = (x: unknown) => (x as { name?: string } | null)?.name ?? "";
  return [
    ...(emps.data ?? []).map((e) => ({ group: "Collaborateurs", label: `${e.first_name} ${e.last_name}`, sub: e.job_title, href: `/hr/employees/${e.id}` })),
    ...(clients.data ?? []).flatMap((c) => [
      { group: "Comptes", label: c.name, sub: [c.segment, c.city].filter(Boolean).join(" · "), href: `/crm/clients/${c.id}` },
      { group: "Actions", label: `Nouveau devis pour ${c.name}`, sub: "Devis guidé", href: `/crm/quotes/new?client=${c.id}` },
    ]),
    ...(wos.data ?? []).map((w) => ({ group: "Commandes pro", label: `${w.number} · ${name(w.clients)}`, sub: w.title, href: `/ops/work-orders/${w.id}` })),
    ...(quotes.data ?? []).map((x) => ({ group: "Devis", label: `${x.number} · ${name(x.clients)}`, sub: x.status, href: `/crm/quotes/${x.id}` })),
    ...(invoices.data ?? []).map((x) => ({ group: "Factures", label: `${x.number} · ${name(x.clients)}`, sub: x.status, href: `/finance/invoices/${x.id}` })),
    ...(stock.data ?? []).map((s) => ({ group: "Stock", label: s.name, sub: `${s.reference} · ${s.location}`, href: `/resources/stock/${s.id}` })),
    ...(assets.data ?? []).map((a) => ({ group: "Équipements", label: a.name, sub: a.type, href: `/resources/assets/${a.id}` })),
  ];
}

export async function listNotifications() {
  const supabase = await createClient();
  const { data } = await supabase.from("notifications").select("id, kind, title, body, entity_type, entity_id, read_at, created_at").order("created_at", { ascending: false }).limit(20);
  return data ?? [];
}

export async function markNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("user_id", user!.id);
}
