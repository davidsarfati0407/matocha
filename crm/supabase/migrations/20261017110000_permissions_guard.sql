-- Édition de la matrice des droits depuis l'interface : garde-fous contre l'escalade de privilèges.
create or replace function app.guard_permissions() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.permissions := coalesce(new, old);
  my_role uuid := (select role_id from public.profiles where user_id = auth.uid());
begin
  if auth.uid() is null then return coalesce(new, old); end if; -- seed, maintenance (hors session)
  -- Le module « salaires » ne se distribue que par quelqu'un qui y a déjà accès
  if r.module = 'salaires' and not (app.can_see_salaries() and app.has_perm('salaires', 'update')) then
    raise exception 'seules la RH et la direction peuvent attribuer l''accès aux salaires' using errcode = '42501';
  end if;
  -- Pas de verrouillage : on ne retire pas à son propre rôle le droit d'administrer les droits
  if tg_op = 'DELETE' and old.role_id = my_role and old.module = 'organisation' and old.action in ('read', 'update') then
    raise exception 'impossible de retirer à votre propre rôle l''administration des droits' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
drop trigger if exists guard_permissions on public.permissions;
create trigger guard_permissions before insert or update or delete on public.permissions for each row execute function app.guard_permissions();

create or replace function app.guard_roles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if new.sees_salaries is distinct from old.sees_salaries and not app.can_see_salaries() then
    raise exception 'seules la RH et la direction peuvent modifier la visibilité des salaires' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists guard_roles on public.roles;
create trigger guard_roles before update on public.roles for each row execute function app.guard_roles();
