-- =====================================================================
-- 05 · Map vivante : simulateur de démo et KPI élargi
-- Le simulateur passe par les MÊMES tables que l'application : la map ne
-- fait que réagir aux changements de données (activity_events).
-- =====================================================================

-- Mise en sourdine des événements ligne à ligne pendant une opération groupée
create or replace function app.is_seeding() returns boolean
language sql stable as $$
  select coalesce(current_setting('app.seeding', true), '') = 'on'
      or coalesce(current_setting('app.quiet', true), '') = 'on'
$$;

-- CA du jour : commandes en ligne + commandes pro reçues aujourd'hui
create or replace function public.kpi_revenue_today() returns jsonb
language sql stable security definer set search_path = public as $$
  with b as (
    select app.current_org_id() as org,
           ((now() at time zone app.org_tz())::date::timestamp at time zone app.org_tz()) as d0
  ), shop as (
    select coalesce(sum(s.total_ht) filter (where s.ordered_at >= b.d0 and s.ordered_at <= now()), 0) as today,
           coalesce(sum(s.total_ht) filter (where s.ordered_at >= b.d0 - interval '1 day' and s.ordered_at <= now() - interval '1 day'), 0) as yday,
           count(*) filter (where s.ordered_at >= b.d0 and s.ordered_at <= now()) as n
    from public.shop_orders s, b
    where s.org_id = b.org and s.status <> 'annulee' and s.ordered_at >= b.d0 - interval '1 day'
  ), pro as (
    select coalesce(sum(w.amount_ht) filter (where w.received_at >= b.d0 and w.received_at <= now()), 0) as today,
           coalesce(sum(w.amount_ht) filter (where w.received_at >= b.d0 - interval '1 day' and w.received_at <= now() - interval '1 day'), 0) as yday
    from public.work_orders w, b
    where w.org_id = b.org and w.received_at >= b.d0 - interval '1 day'
  )
  select jsonb_build_object(
    'value', shop.today + pro.today,
    'delta', case when shop.yday + pro.yday = 0 then null else round((shop.today + pro.today - shop.yday - pro.yday) / (shop.yday + pro.yday), 4) end,
    'orders', shop.n,
    'pro', pro.today,
    'target', (select (o.settings ->> 'daily_revenue_target')::numeric from public.orgs o where o.id = (select org from b)))
  from shop, pro
$$;

create or replace function app.assert_demo() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare o uuid := app.current_org_id();
begin
  if o is null or not exists (select 1 from public.orgs where id = o and demo_mode) then
    raise exception 'simulateur réservé aux organisations en mode démo' using errcode = '42501';
  end if;
  return o;
end $$;

-- Collaborateur par clé de poste (« preparateur:0 »)
create or replace function app.employee_by_slot(o uuid, slot text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.employees where org_id = o and appearance ->> 'slot' = slot limit 1
$$;

/**
 * Une étape du scénario de démo. Écritures métier réelles, horodatées maintenant.
 * step : badge | work_order_stage | lot_received | quote_accepted | pickup | ambient
 */
create or replace function public.demo_step(step text, params jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o uuid := app.assert_demo();
  emp uuid;
  wo public.work_orders;
  q public.quotes;
  new_number text;
  n_orders int;
  n_wo int;
  zone uuid;
  result jsonb := '{}';
begin
  case step
  when 'badge' then
    emp := coalesce((params ->> 'employee_id')::uuid, app.employee_by_slot(o, params ->> 'slot'));
    if emp is null then raise exception 'collaborateur introuvable'; end if;
    insert into public.badge_events (org_id, employee_id, kind, reader, source)
    values (o, emp, (params ->> 'kind')::app.badge_kind, coalesce(params ->> 'reader', 'accueil'), 'simulateur');
    result := jsonb_build_object('employee_id', emp);

  when 'work_order_stage' then
    select z.id into zone from public.zones z where z.org_id = o and z.key = params ->> 'zone';
    update public.work_orders
       set stage = params ->> 'stage', zone_id = zone,
           progress = greatest(progress, coalesce((params ->> 'progress')::numeric, progress))
     where org_id = o and number = params ->> 'number'
     returning * into wo;
    result := jsonb_build_object('work_order_id', wo.id);

  when 'lot_received' then
    update public.lots set status = 'quarantaine', received_at = now()
     where org_id = o and number = params ->> 'lot' and status = 'attendu';
    update public.purchase_orders set status = 'received', received_at = now()
     where org_id = o and status = 'in_transit' and lines::text like '%' || (params ->> 'lot') || '%';

  when 'quote_accepted' then
    update public.quotes set status = 'accepted', accepted_at = now()
     where org_id = o and number = params ->> 'number' and status <> 'accepted'
     returning * into q;
    if q.id is not null then
      update public.deals set stage = 'gagne', probability = 1 where id = q.deal_id;
      select 'CP-24-' || lpad((coalesce(max(substring(number from '\d+$')::int), 600) + 1)::text, 4, '0') into new_number
        from public.work_orders where org_id = o;
      insert into public.work_orders (org_id, site_id, number, client_id, quote_id, title, stage, progress, owner_id, hours_budget, due_at, received_at, amount_ht, amount_ttc)
      select o, (select id from public.sites where org_id = o limit 1), new_number, q.client_id, q.id,
             coalesce((select title from public.deals where id = q.deal_id), 'Commande ' || q.number), 'confirmee', 0.05,
             (select id from public.employees where org_id = o and job_key = 'head_logistique' limit 1), 3,
             app.local_ts(2, '15:00'), now(), q.total_ht, q.total_ttc
      returning * into wo;
      result := jsonb_build_object('work_order_id', wo.id, 'number', new_number);
    end if;

  when 'pickup' then
    perform set_config('app.quiet', 'on', true);
    update public.shop_orders set status = 'expediee', shipped_at = now()
     where org_id = o and status in ('emballee', 'preparation') and ship_deadline <= app.local_ts(0, '23:59');
    get diagnostics n_orders = row_count;
    update public.work_orders set zone_id = null
     where org_id = o and stage = 'expedition' and zone_id is not null;
    get diagnostics n_wo = row_count;
    perform set_config('app.quiet', 'off', true);
    perform app.emit(o, 'expedition.pickup', 'shop_orders', null, jsonb_build_object('orders', n_orders, 'work_orders', n_wo));
    result := jsonb_build_object('orders', n_orders, 'work_orders', n_wo);

  when 'ambient' then
    insert into public.notifications (org_id, kind, title) values (o, 'ambiance', params ->> 'text');
    perform app.emit(o, 'notification.ambient', 'notifications', null, jsonb_build_object('title', params ->> 'text'));
    -- Quelques commandes en ligne arrivent (chacune émet shop_order.payee)
    insert into public.shop_orders (org_id, number, channel, customer_name, city, items, total_ht, total_ttc, status, pack_station, ordered_at, ship_deadline)
    select o, 'W' || to_char(now() at time zone 'Europe/Paris', 'YYMMDD') || '-S' || substr(md5(random()::text), 1, 5),
           'boutique', (array['Lina B.', 'Paul R.', 'Zoé M.', 'Adam K.', 'Inès T.'])[1 + floor(random() * 5)::int],
           (array['Paris', 'Lyon', 'Nantes', 'Lille', 'Bordeaux'])[1 + floor(random() * 5)::int], 1, 37.82, 39.90, 'payee',
           1 + floor(random() * 4)::int, now(),
           case when (now() at time zone 'Europe/Paris')::time < '13:00' then app.local_ts(0, '15:00') else app.local_ts(1, '15:00') end
    from generate_series(1, 1 + floor(random() * 3)::int);
  else
    raise exception 'étape inconnue : %', step;
  end case;
  return result;
end $$;

/** Remet le scénario dans son état initial (rejouable à chaque ouverture de la map). */
create or replace function public.demo_reset(params jsonb default '{}') returns void
language plpgsql security definer set search_path = public as $$
declare
  o uuid := app.assert_demo();
  wo_number text := params ->> 'work_order';
  wo_from text := coalesce(params ->> 'work_order_from', 'preparation');
  q_number text := params ->> 'quote';
  lot_number text := params ->> 'lot';
begin
  perform set_config('app.quiet', 'on', true);
  delete from public.badge_events where org_id = o and source = 'simulateur' and at >= app.local_ts(0, '00:00');
  if lot_number is not null then
    update public.lots set status = 'attendu', received_at = null where org_id = o and number = lot_number;
    update public.purchase_orders set status = 'in_transit', received_at = null
     where org_id = o and status = 'received' and lines::text like '%' || lot_number || '%';
  end if;
  if wo_number is not null then
    update public.work_orders set stage = wo_from, zone_id = (select id from public.zones where org_id = o and key = wo_from)
     where org_id = o and number = wo_number;
    delete from public.work_order_stages s using public.work_orders w
     where w.id = s.work_order_id and w.number = wo_number and s.stage <> wo_from and s.entered_at >= app.local_ts(0, '00:00');
    update public.work_order_stages s set left_at = null from public.work_orders w
     where w.id = s.work_order_id and w.number = wo_number and s.stage = wo_from;
  end if;
  if q_number is not null then
    delete from public.work_orders w using public.quotes q
     where q.id = w.quote_id and q.number = q_number and q.org_id = o and w.received_at >= app.local_ts(0, '00:00');
    update public.quotes set status = 'opened', accepted_at = null where org_id = o and number = q_number;
    update public.deals d set stage = 'chaud', probability = 0.7 from public.quotes q where q.deal_id = d.id and q.number = q_number;
  end if;
  update public.shop_orders set status = 'emballee', shipped_at = null
   where org_id = o and status = 'expediee' and shipped_at >= app.local_ts(0, '00:00');
  update public.work_orders set zone_id = (select id from public.zones where org_id = o and key = 'expedition')
   where org_id = o and stage = 'expedition' and zone_id is null;
  perform set_config('app.quiet', 'off', true);
end $$;

revoke execute on function public.demo_step(text, jsonb), public.demo_reset(jsonb) from public, anon;
grant execute on function public.demo_step(text, jsonb), public.demo_reset(jsonb) to authenticated;
