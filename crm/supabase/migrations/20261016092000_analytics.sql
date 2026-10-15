-- =====================================================================
-- 08 · Agrégats partagés (tableaux de bord) : chiffres agrégés visibles par tout
-- membre, comme les KPI d'en-tête ; jamais de ligne individuelle.
-- =====================================================================
create or replace function public.revenue_daily(days int default 30) returns table (day date, shop_ht numeric, pro_ht numeric, orders bigint)
language sql stable security definer set search_path = public as $$
  with d as (select generate_series(app.local_date(-days + 1), app.local_date(0), interval '1 day')::date as day),
  s as (
    select (ordered_at at time zone app.org_tz())::date as day, sum(total_ht) as ht, count(*) as n
    from public.shop_orders where org_id = app.current_org_id() and status <> 'annulee'
      and ordered_at >= app.local_ts(-days + 1, '00:00') and ordered_at <= now()
    group by 1),
  p as (
    select (received_at at time zone app.org_tz())::date as day, sum(amount_ht) as ht
    from public.work_orders where org_id = app.current_org_id() and received_at >= app.local_ts(-days + 1, '00:00') and received_at <= now()
    group by 1)
  select d.day, coalesce(s.ht, 0), coalesce(p.ht, 0), coalesce(s.n, 0)
  from d left join s using (day) left join p using (day) order by d.day
$$;
revoke execute on function public.revenue_daily(int) from public, anon;
grant execute on function public.revenue_daily(int) to authenticated;
