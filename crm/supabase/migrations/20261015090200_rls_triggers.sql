-- =====================================================================
-- 03 · Droits (RLS), triggers d'audit et d'événements, cohérence métier
-- =====================================================================

-- Pendant le seed, on coupe les effets de bord (événements « maintenant »)
create or replace function app.is_seeding() returns boolean
language sql stable as $$ select coalesce(current_setting('app.seeding', true), '') = 'on' $$;

create or replace function app.org_tz() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select timezone from public.orgs where id = app.current_org_id()), 'Europe/Paris')
$$;

-- ------------------------------------------------------------- RLS générique
-- Chaque table métier est rattachée à un module ; « lecture_org » = lisible par
-- tout membre de l'organisation (annuaire, plan, fil d'activité…).
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('sites', 'plan', true), ('floor_plans', 'plan', true), ('zones', 'plan', true), ('map_objects', 'plan', true),
      ('departments', 'rh', true), ('employees', 'rh', true),
      ('reviews', 'rh', false), ('trainings', 'rh', false), ('job_openings', 'rh', false),
      ('candidates', 'rh', false), ('onboarding_tasks', 'rh', false),
      ('clients', 'commercial', false), ('contacts', 'commercial', false), ('deals', 'commercial', false),
      ('catalog_items', 'commercial', true), ('quotes', 'commercial', false), ('quote_lines', 'commercial', false),
      ('work_orders', 'operations', true), ('work_order_stages', 'operations', true), ('tasks', 'operations', true),
      ('checklists', 'operations', true), ('shop_orders', 'operations', false),
      ('assets', 'ressources', true), ('asset_bookings', 'ressources', true), ('suppliers', 'ressources', false),
      ('stock_items', 'ressources', true), ('lots', 'ressources', true), ('stock_movements', 'ressources', false),
      ('purchase_orders', 'ressources', false),
      ('invoices', 'finance', false), ('invoice_lines', 'finance', false), ('payments', 'finance', false),
      ('dunning_steps', 'finance', false), ('cash_forecast', 'finance', false),
      ('threads', 'communication', false), ('messages', 'communication', false), ('documents', 'communication', false),
      ('automations', 'pilotage', false), ('reports', 'pilotage', false)
    ) as t(tbl, module, org_read)
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    if r.org_read then
      execute format('create policy %I on public.%I for select to authenticated using (org_id = app.current_org_id())', r.tbl || '_select', r.tbl);
    else
      execute format('create policy %I on public.%I for select to authenticated using (org_id = app.current_org_id() and app.has_perm(%L, ''read''))', r.tbl || '_select', r.tbl, r.module);
    end if;
    execute format('create policy %I on public.%I for insert to authenticated with check (org_id = app.current_org_id() and app.has_perm(%L, ''create''))', r.tbl || '_insert', r.tbl, r.module);
    execute format('create policy %I on public.%I for update to authenticated using (org_id = app.current_org_id() and app.has_perm(%L, ''update'')) with check (org_id = app.current_org_id())', r.tbl || '_update', r.tbl, r.module);
    execute format('create policy %I on public.%I for delete to authenticated using (org_id = app.current_org_id() and app.has_perm(%L, ''delete''))', r.tbl || '_delete', r.tbl, r.module);
  end loop;
end $$;

-- ------------------------------------------------------------- Cas particuliers
alter table public.orgs enable row level security;
create policy orgs_select on public.orgs for select to authenticated using (id = app.current_org_id());
create policy orgs_update on public.orgs for update to authenticated
  using (id = app.current_org_id() and app.has_perm('organisation', 'update'));

alter table public.roles enable row level security;
create policy roles_select on public.roles for select to authenticated using (org_id = app.current_org_id());
create policy roles_write on public.roles for all to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'update'))
  with check (org_id = app.current_org_id() and app.has_perm('organisation', 'update'));

alter table public.permissions enable row level security;
create policy permissions_select on public.permissions for select to authenticated using (org_id = app.current_org_id());
create policy permissions_write on public.permissions for all to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'update'))
  with check (org_id = app.current_org_id() and app.has_perm('organisation', 'update'));

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (org_id = app.current_org_id());
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and role_id = (select role_id from app.current_profile()));
create policy profiles_admin on public.profiles for all to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'update'))
  with check (org_id = app.current_org_id() and app.has_perm('organisation', 'update'));

-- Salaires : RLS stricte, jamais visibles sans le drapeau du rôle
alter table public.employee_salaries enable row level security;
create policy salaries_select on public.employee_salaries for select to authenticated
  using (org_id = app.current_org_id() and app.can_see_salaries() and app.has_perm('salaires', 'read'));
create policy salaries_write on public.employee_salaries for all to authenticated
  using (org_id = app.current_org_id() and app.can_see_salaries() and app.has_perm('salaires', 'update'))
  with check (org_id = app.current_org_id() and app.can_see_salaries() and app.has_perm('salaires', 'update'));

-- Badges : lisibles dans l'organisation (présence sur la map) ; chacun badge pour soi
alter table public.badge_events enable row level security;
create policy badge_select on public.badge_events for select to authenticated using (org_id = app.current_org_id());
create policy badge_insert on public.badge_events for insert to authenticated
  with check (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('rh', 'create')));
create policy badge_update on public.badge_events for update to authenticated
  using (org_id = app.current_org_id() and app.has_perm('rh', 'update'));
create policy badge_delete on public.badge_events for delete to authenticated
  using (org_id = app.current_org_id() and app.has_perm('rh', 'delete'));

-- Agendas : visibles dans l'organisation, modifiables par leur propriétaire ou la RH
alter table public.calendar_events enable row level security;
create policy cal_select on public.calendar_events for select to authenticated using (org_id = app.current_org_id());
create policy cal_write on public.calendar_events for all to authenticated
  using (org_id = app.current_org_id() and (owner_id = app.current_employee_id() or app.has_perm('rh', 'update')))
  with check (org_id = app.current_org_id() and (owner_id = app.current_employee_id() or app.has_perm('rh', 'update')));

-- Congés : les siens, ceux de son équipe (manager) ou tous (RH)
create or replace function app.manages(emp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.employees e where e.id = emp and e.manager_id = app.current_employee_id())
$$;
grant execute on function app.manages(uuid) to authenticated;

alter table public.leave_requests enable row level security;
create policy leave_select on public.leave_requests for select to authenticated
  using (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.manages(employee_id) or app.has_perm('rh', 'read')));
create policy leave_insert on public.leave_requests for insert to authenticated
  with check (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('rh', 'create')));
create policy leave_update on public.leave_requests for update to authenticated
  using (org_id = app.current_org_id() and (app.manages(employee_id) or app.has_perm('rh', 'update')
         or (employee_id = app.current_employee_id() and status = 'pending')));

-- Heures : les siennes, ou opérations
alter table public.time_entries enable row level security;
create policy time_select on public.time_entries for select to authenticated
  using (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('operations', 'read')));
create policy time_write on public.time_entries for all to authenticated
  using (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('operations', 'update')))
  with check (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('operations', 'update')));

-- Notes de frais : les siennes, ou finance
alter table public.expenses enable row level security;
create policy expenses_select on public.expenses for select to authenticated
  using (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('finance', 'read')));
create policy expenses_insert on public.expenses for insert to authenticated
  with check (org_id = app.current_org_id() and (employee_id = app.current_employee_id() or app.has_perm('finance', 'create')));
create policy expenses_update on public.expenses for update to authenticated
  using (org_id = app.current_org_id() and (app.has_perm('finance', 'update') or (employee_id = app.current_employee_id() and status = 'submitted')));

alter table public.notifications enable row level security;
create policy notif_select on public.notifications for select to authenticated
  using (org_id = app.current_org_id() and (user_id is null or user_id = auth.uid()));
create policy notif_update on public.notifications for update to authenticated
  using (org_id = app.current_org_id() and user_id = auth.uid());

alter table public.activity_events enable row level security;
create policy activity_select on public.activity_events for select to authenticated using (org_id = app.current_org_id());
-- Pas d'écriture directe : le fil est alimenté uniquement par les triggers métier
-- (security definer). Un client ne peut donc pas fabriquer un événement qui animerait la map.

alter table public.audit_log enable row level security;
create policy audit_select on public.audit_log for select to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'read'));

alter table public.saved_views enable row level security;
create policy views_own on public.saved_views for all to authenticated
  using (org_id = app.current_org_id() and user_id = auth.uid())
  with check (org_id = app.current_org_id() and user_id = auth.uid());

-- ------------------------------------------------------------- updated_at
do $$
declare t text;
begin
  for t in select table_name from information_schema.columns
           where table_schema = 'public' and column_name = 'updated_at'
  loop
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function app.touch_updated_at()', t);
  end loop;
end $$;

-- ------------------------------------------------------------- Audit (avant/après)
create or replace function app.audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return coalesce(new, old); end if;
  insert into public.audit_log (org_id, table_name, row_id, action, before, after)
  values (
    coalesce(new.org_id, old.org_id), tg_table_name, coalesce(new.id, old.id), lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['employees', 'employee_salaries', 'roles', 'permissions', 'profiles', 'quotes',
                           'work_orders', 'invoices', 'payments', 'leave_requests', 'lots', 'expenses', 'floor_plans']
  loop
    execute format('create trigger audit after insert or update or delete on public.%I for each row execute function app.audit()', t);
  end loop;
end $$;

-- ------------------------------------------------------------- Flux d'événements
create or replace function app.emit(o uuid, t text, e text, eid uuid, p jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.activity_events (org_id, type, entity, entity_id, payload) values (o, t, e, eid, p)
$$;

create or replace function app.on_badge() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  perform app.emit(new.org_id, 'badge.' || new.kind, 'employees', new.employee_id,
    jsonb_build_object('badge_event_id', new.id, 'reader', new.reader, 'at', new.at, 'source', new.source));
  return new;
end $$;
create trigger emit_badge after insert on public.badge_events for each row execute function app.on_badge();

-- Changement d'étape : historique horodaté + événement (aucune double saisie)
create or replace function app.on_work_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  if tg_op = 'INSERT' then
    insert into public.work_order_stages (org_id, work_order_id, stage, entered_at) values (new.org_id, new.id, new.stage, now());
    perform app.emit(new.org_id, 'work_order.created', 'work_orders', new.id, jsonb_build_object('number', new.number, 'stage', new.stage));
  elsif new.stage is distinct from old.stage then
    update public.work_order_stages set left_at = now() where work_order_id = new.id and left_at is null;
    insert into public.work_order_stages (org_id, work_order_id, stage, entered_at) values (new.org_id, new.id, new.stage, now());
    perform app.emit(new.org_id, 'work_order.stage', 'work_orders', new.id,
      jsonb_build_object('number', new.number, 'from', old.stage, 'to', new.stage));
  end if;
  return new;
end $$;
create trigger emit_work_order after insert or update on public.work_orders for each row execute function app.on_work_order();

create or replace function app.on_status_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    perform app.emit(new.org_id, tg_argv[0] || '.' || new.status, tg_table_name, new.id, jsonb_build_object('status', new.status));
  end if;
  return new;
end $$;
create trigger emit_quote after insert or update on public.quotes for each row execute function app.on_status_change('quote');
create trigger emit_leave after insert or update on public.leave_requests for each row execute function app.on_status_change('leave');
create trigger emit_lot after insert or update on public.lots for each row execute function app.on_status_change('lot');
create trigger emit_invoice after insert or update on public.invoices for each row execute function app.on_status_change('invoice');
create trigger emit_shop_order after insert or update on public.shop_orders for each row execute function app.on_status_change('shop_order');

-- Mouvement de stock → quantité à jour + événement
create or replace function app.on_stock_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  update public.stock_items
     set quantity = case when new.kind = 'inventaire' then new.quantity
                         when new.kind = 'sortie' then quantity - abs(new.quantity)
                         else quantity + new.quantity end
   where id = new.stock_item_id;
  perform app.emit(new.org_id, 'stock.' || new.kind, 'stock_items', new.stock_item_id,
    jsonb_build_object('quantity', new.quantity, 'lot_id', new.lot_id, 'reason', new.reason));
  return new;
end $$;
create trigger apply_stock_movement after insert on public.stock_movements for each row execute function app.on_stock_movement();

-- ------------------------------------------------------------- Salaire : révélation volontaire journalisée
create or replace function public.reveal_salary(emp uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.employee_salaries;
begin
  if not (app.can_see_salaries() and app.has_perm('salaires', 'read')) then
    raise exception 'acces refuse' using errcode = '42501';
  end if;
  select * into s from public.employee_salaries
   where employee_id = emp and org_id = app.current_org_id()
   order by effective_from desc limit 1;
  insert into public.audit_log (org_id, table_name, row_id, action)
  values (app.current_org_id(), 'employee_salaries', s.id, 'reveal');
  return case when s.id is null then null else jsonb_build_object(
    'gross_annual', s.gross_annual, 'months', s.months, 'bonus_target', s.bonus_target, 'effective_from', s.effective_from) end;
end $$;
revoke execute on function public.reveal_salary(uuid) from public, anon;
grant execute on function public.reveal_salary(uuid) to authenticated;
