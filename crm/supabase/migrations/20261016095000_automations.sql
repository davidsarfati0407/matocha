-- Automatisations : évaluation des règles « seuil » et « date » ; les règles « événement »
-- sont déjà exécutées en temps réel par les triggers et fonctions métier (accept_quote…).

create or replace function public.run_automations() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o uuid := app.current_org_id();
  a record;
  n int;
  href text;
  out jsonb := '[]';
  t jsonb;
begin
  if not app.has_perm('pilotage', 'update') and not app.has_perm('organisation', 'update') then
    raise exception 'acces refuse' using errcode = '42501';
  end if;
  for a in select * from public.automations where org_id = o and enabled order by created_at loop
    t := a.trigger;
    n := null; href := null;
    if t ->> 'type' = 'threshold' and t ->> 'table' = 'stock_items' then
      select count(*) into n from public.stock_items where org_id = o and quantity < min_quantity and not on_order;
      href := '/resources/stock?tab=low';
    elsif t ->> 'type' = 'date' and t ->> 'table' = 'lots' then
      select count(*) into n from public.lots where org_id = o and status in ('libere', 'quarantaine') and best_before < app.local_date((t ->> 'within_days')::int);
      href := '/resources/lots';
    elsif t ->> 'type' = 'date' and t ->> 'table' = 'quotes' then
      select count(*) into n from public.quotes where org_id = o and status = 'opened' and opened_at < now() - make_interval(days => (t ->> 'after_days')::int);
      href := '/crm/quotes?status=opened';
    elsif t ->> 'type' = 'date' and t ->> 'table' = 'invoices' then
      select count(*) into n from public.invoices where org_id = o and status in ('sent', 'partial', 'overdue') and due_on < app.local_date(-(t ->> 'after_days')::int);
      href := '/finance/dunning';
    elsif t ->> 'type' = 'date' and t ->> 'table' = 'clients' then
      select count(*) into n from public.clients where org_id = o and kind = 'entreprise' and (last_contact_at is null or last_contact_at < now() - make_interval(days => (t ->> 'after_days')::int));
      href := '/crm/clients';
    elsif t ->> 'type' = 'date' and t ->> 'table' = 'shop_orders' then
      select count(*) into n from public.shop_orders where org_id = o and status in ('payee', 'preparation') and ship_deadline < now();
      href := '/ops/shop-orders';
    end if;
    if n is not null then
      update public.automations set last_run_at = now() where id = a.id;
      if n > 0 then
        insert into public.notifications (org_id, user_id, kind, title, body, entity_type)
        values (o, null, 'automation', a.name, n || ' élément(s) concerné(s)', href); -- entity_type = lien direct
      end if;
    end if;
    out := out || jsonb_build_object('id', a.id, 'name', a.name, 'count', n, 'href', href, 'mode', case when n is null then 'temps_reel' else 'evaluee' end);
  end loop;
  return out;
end $$;
revoke execute on function public.run_automations() from public, anon;
grant execute on function public.run_automations() to authenticated;
