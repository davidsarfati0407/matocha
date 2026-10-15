-- Diffusion instantanée des événements : pg_notify à chaque insertion dans activity_events.
-- Sert le flux SSE du serveur Next (stack sans serveur Supabase Realtime) ; inoffensif sinon.
create or replace function app.notify_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare msg text;
begin
  msg := json_build_object('id', new.id, 'org_id', new.org_id, 'type', new.type, 'entity', new.entity,
                           'entity_id', new.entity_id, 'payload', new.payload, 'at', new.at)::text;
  if octet_length(msg) > 7900 then -- limite de pg_notify : on envoie l'en-tête, le client relit la ligne
    msg := json_build_object('id', new.id, 'org_id', new.org_id, 'type', new.type, 'entity', new.entity,
                             'entity_id', new.entity_id, 'payload', '{}'::json, 'at', new.at, 'truncated', true)::text;
  end if;
  perform pg_notify('activity', msg);
  return new;
end $$;
drop trigger if exists notify_activity on public.activity_events;
create trigger notify_activity after insert on public.activity_events for each row execute function app.notify_activity();
