-- =====================================================================
-- 07 · Compteurs du back-office (security invoker : on ne compte que ce que
-- l'utilisateur a le droit de voir)
-- =====================================================================
create or replace function public.backoffice_counters() returns jsonb
language sql stable security invoker set search_path = public as $$
  with me as (select app.current_employee_id() as emp),
  wo_hours as (
    select w.id, w.hours_budget, coalesce(sum(t.hours), 0) as used, w.status, w.due_at, w.stage
    from public.work_orders w left join public.time_entries t on t.work_order_id = w.id
    group by w.id
  )
  select jsonb_build_object(
    'to_answer', (select count(*) from public.threads where status = 'awaiting_reply'),
    'quotes_to_send', (select count(*) from public.quotes where status = 'draft'),
    'events_today', (select count(*) from public.calendar_events c, me
                     where (c.owner_id = me.emp or me.emp = any (c.attendees))
                       and c.starts_at >= app.local_ts(0, '00:00') and c.starts_at < app.local_ts(1, '00:00')),
    'wo_alerts', (select count(*) from wo_hours where stage not in ('livree', 'facturee')
                    and (status in ('attente', 'bloque') or (hours_budget > 0 and used / hours_budget >= 0.8) or due_at < now())),
    'leaves_pending', (select count(*) from public.leave_requests where status = 'pending'),
    'invoices_overdue', (select count(*) from public.invoices where status = 'overdue'),
    'dunning_due', (select count(*) from public.invoices i where i.status in ('overdue', 'partial') and i.due_on < app.local_date(0)
                      and not exists (select 1 from public.dunning_steps d where d.invoice_id = i.id and d.sent_at > now() - interval '14 days')),
    'expenses_pending', (select count(*) from public.expenses where status = 'submitted'),
    'stock_low', (select count(*) from public.stock_items where quantity < min_quantity and not on_order),
    'notifications', (select count(*) from public.notifications where read_at is null)
  )
$$;
revoke execute on function public.backoffice_counters() from public, anon;
grant execute on function public.backoffice_counters() to authenticated;
