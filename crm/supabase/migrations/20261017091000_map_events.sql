-- Événements manquants pour que la map voie en direct : réservations de salle, réservations
-- d'équipement, affectation / état d'un équipement ou d'un véhicule.

create or replace function app.on_calendar() returns trigger
language plpgsql security definer set search_path = public as $$
declare r public.calendar_events := coalesce(new, old);
begin
  if app.is_seeding() then return r; end if;
  if r.resource_id is not null then
    perform app.emit(r.org_id, 'room.' || lower(tg_op), 'assets', r.resource_id,
      jsonb_build_object('title', r.title, 'starts_at', r.starts_at, 'ends_at', r.ends_at, 'owner_id', r.owner_id));
  end if;
  return r;
end $$;
drop trigger if exists emit_calendar on public.calendar_events;
create trigger emit_calendar after insert or update or delete on public.calendar_events for each row execute function app.on_calendar();

create or replace function app.on_booking() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  perform app.emit(new.org_id, 'booking.created', 'assets', new.asset_id,
    jsonb_build_object('title', new.title, 'starts_at', new.starts_at, 'ends_at', new.ends_at, 'employee_id', new.employee_id));
  return new;
end $$;
drop trigger if exists emit_booking on public.asset_bookings;
create trigger emit_booking after insert on public.asset_bookings for each row execute function app.on_booking();

create or replace function app.on_asset() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if app.is_seeding() then return new; end if;
  if new.assigned_employee_id is distinct from old.assigned_employee_id then
    perform app.emit(new.org_id, 'asset.assigned', 'assets', new.id, jsonb_build_object('employee_id', new.assigned_employee_id, 'previous', old.assigned_employee_id, 'name', new.name));
  end if;
  if new.status is distinct from old.status then
    perform app.emit(new.org_id, 'asset.' || new.status, 'assets', new.id, jsonb_build_object('name', new.name, 'status', new.status));
  end if;
  return new;
end $$;
drop trigger if exists emit_asset on public.assets;
create trigger emit_asset after update on public.assets for each row execute function app.on_asset();
