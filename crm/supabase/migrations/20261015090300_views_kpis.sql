-- =====================================================================
-- 04 · Vues calculées et KPI partagés par la map et le back-office
-- =====================================================================

-- Présence en direct : badges du jour + agenda en cours + congés validés
create or replace view public.presence_status with (security_invoker = true) as
with bounds as (
  select ((now() at time zone app.org_tz())::date::timestamp at time zone app.org_tz()) as day_start
),
last_badge as (
  select distinct on (b.employee_id) b.employee_id, b.kind, b.at
  from public.badge_events b, bounds
  where b.at >= bounds.day_start and b.at <= now()
  order by b.employee_id, b.at desc
),
first_in as (
  select b.employee_id, min(b.at) as first_in
  from public.badge_events b, bounds
  where b.kind = 'in' and b.at >= bounds.day_start and b.at <= now()
  group by b.employee_id
),
leave_today as (
  select distinct on (l.employee_id) l.employee_id, l.type
  from public.leave_requests l
  where l.status = 'approved' and (now() at time zone app.org_tz())::date between l.starts_on and l.ends_on
),
event_now as (
  select distinct on (e.id) e.id as employee_id, c.type, c.title, c.ends_at, c.resource_id
  from public.employees e
  join public.calendar_events c on (c.owner_id = e.id or e.id = any (c.attendees))
  where now() >= c.starts_at and now() < c.ends_at
  order by e.id, c.starts_at desc
)
select
  e.id as employee_id,
  e.org_id,
  case
    when l.employee_id is not null then 'absent'
    when ev.type = 'teletravail' then 'teletravail'
    when ev.type = 'deplacement' and (b.kind is null or b.kind = 'out') then 'deplacement'
    when b.kind is null then 'pas_badge'
    when b.kind = 'out' then 'parti'
    when b.kind = 'pause_start' then 'pause'
    when ev.type in ('reunion', 'client', 'tournage') then 'reunion'
    else 'au_poste'
  end as status,
  l.type as leave_type,
  b.at as since,
  f.first_in,
  ev.title as current_event,
  ev.ends_at as current_event_ends_at,
  case
    when b.kind = 'pause_start' then (select z.id from public.zones z where z.site_id = e.site_id and z.type = 'detente' limit 1)
    when ev.type in ('reunion', 'client', 'tournage') and ev.resource_id is not null then coalesce(
      (select a.zone_id from public.assets a where a.id = ev.resource_id), e.home_zone_id)
    when b.kind in ('in', 'pause_end') then e.home_zone_id
  end as zone_id
from public.employees e
left join last_badge b on b.employee_id = e.id
left join first_in f on f.employee_id = e.id
left join leave_today l on l.employee_id = e.id
left join event_now ev on ev.employee_id = e.id
where e.left_on is null;

-- ------------------------------------------------------------- KPI
-- security definer : chiffres agrégés visibles par tout membre, filtrés sur son organisation.
create or replace function public.kpi_orders_today() returns jsonb
language sql stable security definer set search_path = public as $$
  with b as (
    select app.current_org_id() as org,
           ((now() at time zone app.org_tz())::date::timestamp at time zone app.org_tz()) as d0
  ), today as (
    select count(*) as n from public.shop_orders s, b where s.org_id = b.org and s.ordered_at >= b.d0 and s.ordered_at <= now()
  ), yday as (
    select count(*) as n from public.shop_orders s, b
    where s.org_id = b.org and s.ordered_at >= b.d0 - interval '1 day' and s.ordered_at <= now() - interval '1 day'
  ), pros as (
    select count(*) as n from public.shop_orders s, b where s.org_id = b.org and s.ordered_at >= b.d0 and s.channel = 'pro'
  ), pending as (
    select count(*) as n from public.shop_orders s, b
    where s.org_id = b.org and s.status in ('payee', 'preparation', 'emballee') and s.ordered_at <= now()
  )
  select jsonb_build_object('value', today.n, 'delta', today.n - yday.n, 'pro', pros.n, 'to_ship', pending.n)
  from today, yday, pros, pending
$$;

create or replace function public.kpi_shipped_on_time() returns jsonb
language sql stable security definer set search_path = public as $$
  with cur as (
    select count(*) filter (where shipped_at <= ship_deadline)::numeric as ok, count(*)::numeric as n
    from public.shop_orders
    where org_id = app.current_org_id() and shipped_at >= now() - interval '30 days' and shipped_at <= now()
  ), prev as (
    select count(*) filter (where shipped_at <= ship_deadline)::numeric as ok, count(*)::numeric as n
    from public.shop_orders
    where org_id = app.current_org_id() and shipped_at >= now() - interval '60 days' and shipped_at < now() - interval '30 days'
  )
  select jsonb_build_object(
    'value', case when cur.n = 0 then null else round(cur.ok / cur.n, 4) end,
    'delta', case when cur.n = 0 or prev.n = 0 then null else round(cur.ok / cur.n - prev.ok / prev.n, 4) end,
    'shipped', cur.n)
  from cur, prev
$$;

create or replace function public.kpi_revenue_today() returns jsonb
language sql stable security definer set search_path = public as $$
  with b as (
    select app.current_org_id() as org,
           ((now() at time zone app.org_tz())::date::timestamp at time zone app.org_tz()) as d0
  ), today as (
    select coalesce(sum(s.total_ht), 0) as v, count(*) as n from public.shop_orders s, b
    where s.org_id = b.org and s.ordered_at >= b.d0 and s.ordered_at <= now() and s.status <> 'annulee'
  ), yday as (
    select coalesce(sum(s.total_ht), 0) as v from public.shop_orders s, b
    where s.org_id = b.org and s.ordered_at >= b.d0 - interval '1 day' and s.ordered_at <= now() - interval '1 day' and s.status <> 'annulee'
  )
  select jsonb_build_object(
    'value', today.v,
    'delta', case when yday.v = 0 then null else round((today.v - yday.v) / yday.v, 4) end,
    'orders', today.n,
    'target', (select (o.settings ->> 'daily_revenue_target')::numeric from public.orgs o where o.id = (select org from b)))
  from today, yday
$$;

revoke execute on function public.kpi_orders_today(), public.kpi_shipped_on_time(), public.kpi_revenue_today() from public, anon;
grant execute on function public.kpi_orders_today(), public.kpi_shipped_on_time(), public.kpi_revenue_today() to authenticated;

-- ------------------------------------------------------------- Page technique
-- Compte les lignes VISIBLES par l'utilisateur courant (security invoker → RLS appliquée).
create or replace function public.tech_table_counts() returns table (table_name text, visible bigint)
language plpgsql stable security invoker set search_path = public as $$
declare t text;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'r' order by c.relname
  loop
    table_name := t;
    execute format('select count(*) from public.%I', t) into visible;
    return next;
  end loop;
end $$;
revoke execute on function public.tech_table_counts() from public, anon;
grant execute on function public.tech_table_counts() to authenticated;

-- ------------------------------------------------------------- Temps réel (Supabase)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table
      public.activity_events, public.badge_events, public.work_orders, public.shop_orders,
      public.stock_items, public.lots, public.calendar_events, public.leave_requests, public.assets, public.map_objects;
  end if;
end $$;

-- Horodatage local : jour relatif à aujourd'hui + heure murale du fuseau donné.
-- Utilisé par le seed (dates toujours « relatives à aujourd'hui ») et le simulateur.
create or replace function app.local_ts(day_offset int, hm text, tz text default 'Europe/Paris') returns timestamptz
language sql stable as $$
  select (((now() at time zone tz)::date + day_offset) + hm::time) at time zone tz
$$;
create or replace function app.local_date(day_offset int, tz text default 'Europe/Paris') returns date
language sql stable as $$ select (now() at time zone tz)::date + day_offset $$;
