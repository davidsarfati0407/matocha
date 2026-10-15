-- =====================================================================
-- 06 · Flux métier sans ressaisie (back-office)
-- Les montants sont calculés par la couche domaine (lib/domain, testée) ;
-- ces fonctions font les écritures multi-tables de façon atomique, avec les
-- droits de l'utilisateur (security invoker) sauf mention contraire.
-- =====================================================================

alter table public.time_entries add column if not exists invoice_id uuid references public.invoices(id) on delete set null;
alter table public.invoices add column if not exists notes text;
alter table public.quotes add column if not exists notes text;
alter table public.work_orders add column if not exists notes text;

-- Numérotation continue par préfixe et année (Q-2026-0001, F-2026-0001, PO-2026-001…)
create or replace function app.next_number(o uuid, tbl text, prefix text, width int default 4) returns text
language plpgsql security definer set search_path = public as $$
declare
  y text := to_char(now() at time zone 'Europe/Paris', 'YYYY');
  n int;
begin
  execute format(
    'select coalesce(max(substring(number from ''(\d+)$'')::int), 0) + 1 from public.%I where org_id = $1 and number like $2', tbl)
    into n using o, prefix || '-' || y || '-%';
  return prefix || '-' || y || '-' || lpad(n::text, width, '0');
end $$;
grant execute on function app.next_number(uuid, text, text, int) to authenticated;

-- ---------------------------------------------------------------- devis
/** Crée ou met à jour un devis et remplace ses lignes (totaux fournis par la couche domaine). */
create or replace function public.save_quote(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  o uuid := app.current_org_id();
  qid uuid := nullif(payload ->> 'id', '')::uuid;
begin
  if qid is null then
    insert into public.quotes (org_id, number, client_id, deal_id, status, issued_on, valid_until, discount_pct, total_ht, total_vat, total_ttc, owner_id, notes)
    values (o, app.next_number(o, 'quotes', 'Q'), (payload ->> 'client_id')::uuid, nullif(payload ->> 'deal_id', '')::uuid, 'draft',
            app.local_date(0), app.local_date(30), coalesce((payload ->> 'discount_pct')::numeric, 0),
            (payload ->> 'total_ht')::numeric, (payload ->> 'total_vat')::numeric, (payload ->> 'total_ttc')::numeric,
            coalesce(nullif(payload ->> 'owner_id', '')::uuid, app.current_employee_id()), payload ->> 'notes')
    returning id into qid;
  else
    update public.quotes set
      client_id = (payload ->> 'client_id')::uuid,
      discount_pct = coalesce((payload ->> 'discount_pct')::numeric, 0),
      total_ht = (payload ->> 'total_ht')::numeric, total_vat = (payload ->> 'total_vat')::numeric, total_ttc = (payload ->> 'total_ttc')::numeric,
      notes = payload ->> 'notes'
    where id = qid and status in ('draft', 'sent', 'opened');
    if not found then raise exception 'devis non modifiable (accepté, refusé ou expiré)' using errcode = 'P0001'; end if;
    delete from public.quote_lines where quote_id = qid;
  end if;
  insert into public.quote_lines (org_id, quote_id, catalog_item_id, label, quantity, unit_price, unit_cost, vat_rate, position)
  select o, qid, nullif(l ->> 'catalog_item_id', '')::uuid, l ->> 'label', (l ->> 'quantity')::numeric, (l ->> 'unit_price')::numeric,
         coalesce((l ->> 'unit_cost')::numeric, 0), (l ->> 'vat_rate')::numeric, ord::int
  from jsonb_array_elements(payload -> 'lines') with ordinality as t(l, ord);
  return qid;
end $$;

/** Devis accepté → commande pro créée automatiquement (aucune ressaisie). */
create or replace function app.accept_quote(o uuid, q_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  q public.quotes;
  wo_id uuid;
begin
  update public.quotes set status = 'accepted', accepted_at = now()
   where org_id = o and id = q_id and status in ('draft', 'sent', 'opened')
   returning * into q;
  if q.id is null then return null; end if;
  update public.deals set stage = 'gagne', probability = 1 where id = q.deal_id;
  insert into public.work_orders (org_id, site_id, number, client_id, quote_id, title, stage, progress, owner_id, hours_budget, due_at, received_at, amount_ht, amount_ttc)
  select o, (select id from public.sites where org_id = o order by created_at limit 1),
         'CP-24-' || lpad((coalesce((select max(substring(number from '\d+$')::int) from public.work_orders where org_id = o), 600) + 1)::text, 4, '0'),
         q.client_id, q.id, coalesce((select title from public.deals where id = q.deal_id), 'Commande ' || q.number), 'confirmee', 0.05,
         (select id from public.employees where org_id = o and job_key = 'head_logistique' limit 1),
         greatest(1, round((select coalesce(sum(quantity), 0) from public.quote_lines where quote_id = q.id) / 40.0, 1)),
         app.local_ts(2, '15:00'), now(), q.total_ht, q.total_ttc
  returning id into wo_id;
  insert into public.checklists (org_id, work_order_id, title, items)
  values (o, wo_id, 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":false},{"label":"Picking et vérification des lots","done":false},{"label":"Pesée et photo du colis","done":false},{"label":"Étiquette transporteur","done":false},{"label":"Preuve de livraison","done":false}]');
  return wo_id;
end $$;

create or replace function public.accept_quote(q_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  if not app.has_perm('commercial', 'update') then raise exception 'acces refuse' using errcode = '42501'; end if;
  return app.accept_quote(app.current_org_id(), q_id);
end $$;

-- Le simulateur réutilise exactement la même règle
create or replace function public.demo_accept_quote_number(num text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o uuid := app.assert_demo();
begin
  return app.accept_quote(o, (select id from public.quotes where org_id = o and number = num));
end $$;

-- ---------------------------------------------------------------- facturation
/**
 * Crée une facture (lignes et totaux calculés par la couche domaine) et marque
 * les heures facturées : commande → heures → facture sans ressaisie.
 */
create or replace function public.create_invoice(payload jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  o uuid := app.current_org_id();
  inv uuid;
begin
  insert into public.invoices (org_id, number, client_id, work_order_id, quote_id, kind, status, issued_on, due_on, total_ht, total_vat, total_ttc, notes)
  values (o, app.next_number(o, 'invoices', case when payload ->> 'kind' = 'avoir' then 'AV' else 'F' end), (payload ->> 'client_id')::uuid,
          nullif(payload ->> 'work_order_id', '')::uuid, nullif(payload ->> 'quote_id', '')::uuid, coalesce(payload ->> 'kind', 'facture'),
          coalesce(payload ->> 'status', 'draft'), app.local_date(0), app.local_date(coalesce((payload ->> 'due_days')::int, 30)),
          (payload ->> 'total_ht')::numeric, (payload ->> 'total_vat')::numeric, (payload ->> 'total_ttc')::numeric, payload ->> 'notes')
  returning id into inv;
  insert into public.invoice_lines (org_id, invoice_id, label, quantity, unit_price, vat_rate, position)
  select o, inv, l ->> 'label', (l ->> 'quantity')::numeric, (l ->> 'unit_price')::numeric, (l ->> 'vat_rate')::numeric, ord::int
  from jsonb_array_elements(payload -> 'lines') with ordinality as t(l, ord);
  update public.time_entries set invoice_id = inv
   where id in (select (x #>> '{}')::uuid from jsonb_array_elements(coalesce(payload -> 'time_entry_ids', '[]')) x);
  if payload ->> 'work_order_id' is not null and coalesce(payload ->> 'kind', 'facture') = 'facture' then
    update public.work_orders set stage = 'facturee', status = 'termine', progress = 1 where id = (payload ->> 'work_order_id')::uuid and stage = 'livree';
  end if;
  return inv;
end $$;

-- Paiements → montant réglé et statut de la facture, toujours cohérents
create or replace function app.sync_invoice_payment() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv uuid := coalesce(new.invoice_id, old.invoice_id);
begin
  if inv is null then return null; end if;
  update public.invoices i set
    paid_amount = coalesce((select sum(amount) from public.payments p where p.invoice_id = inv), 0),
    status = case
      when coalesce((select sum(amount) from public.payments p where p.invoice_id = inv), 0) >= i.total_ttc then 'paid'
      when coalesce((select sum(amount) from public.payments p where p.invoice_id = inv), 0) > 0 then 'partial'
      when i.status in ('paid', 'partial') then case when i.due_on < app.local_date(0) then 'overdue' else 'sent' end
      else i.status end
  where i.id = inv;
  return null;
end $$;
create trigger sync_invoice_payment after insert or update or delete on public.payments
for each row execute function app.sync_invoice_payment();

-- Échéance dépassée → « en retard » (appelé par la page Finance et par le cron)
create or replace function public.refresh_overdue() returns int
language sql security invoker set search_path = public as $$
  with u as (
    update public.invoices set status = 'overdue'
     where org_id = app.current_org_id() and status = 'sent' and due_on < app.local_date(0)
     returning 1)
  select count(*)::int from u
$$;

-- ---------------------------------------------------------------- congés
-- Validation → solde décompté ; annulation d'un congé validé → solde recrédité
create or replace function app.leave_balance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type not in ('conges', 'rtt') then return new; end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.employees set leave_balance_days = leave_balance_days - new.days where id = new.employee_id;
  elsif old.status = 'approved' and new.status in ('rejected', 'cancelled') then
    update public.employees set leave_balance_days = leave_balance_days + new.days where id = new.employee_id;
  end if;
  return new;
end $$;
create trigger leave_balance after update on public.leave_requests for each row execute function app.leave_balance();

-- ---------------------------------------------------------------- paramètres
update public.orgs set settings = settings || '{"hourly_rate": 65, "payment_terms_days": 30, "dunning_days": [1, 15, 30]}'::jsonb;

-- Le simulateur passe désormais par la même règle d'acceptation
create or replace function public.demo_step(step text, params jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  o uuid := app.assert_demo();
  emp uuid;
  wo public.work_orders;
  wo_id uuid;
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
    wo_id := app.accept_quote(o, (select id from public.quotes where org_id = o and number = params ->> 'number'));
    if wo_id is not null then
      result := jsonb_build_object('work_order_id', wo_id, 'number', (select number from public.work_orders where id = wo_id));
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

revoke execute on function public.accept_quote(uuid), public.save_quote(jsonb), public.create_invoice(jsonb), public.refresh_overdue(), public.demo_accept_quote_number(text) from public, anon;
grant execute on function public.accept_quote(uuid), public.save_quote(jsonb), public.create_invoice(jsonb), public.refresh_overdue(), public.demo_accept_quote_number(text) to authenticated;
