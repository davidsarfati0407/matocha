-- =====================================================================
-- 01 · Socle : organisation, sites, rôles, permissions, profils, helpers
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- Modules et actions de la matrice de droits
create type app.module as enum (
  'pilotage', 'communication', 'commercial', 'operations', 'rh', 'salaires',
  'finance', 'ressources', 'ia', 'organisation', 'plan'
);
create type app.action as enum ('read', 'create', 'update', 'delete', 'export');

-- updated_at automatique
create or replace function app.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  legal_name text,
  country char(2) not null default 'FR',
  locale text not null default 'fr-FR',
  timezone text not null default 'Europe/Paris',
  currency char(3) not null default 'EUR',
  vat_standard numeric(5,4) not null default 0.2,
  vat_reduced numeric(5,4) not null default 0.055,
  rounding numeric(6,4) not null default 0.01,
  demo_mode boolean not null default true,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  sees_salaries boolean not null default false,
  edits_plan boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  unique (org_id, key)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  module app.module not null,
  action app.action not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  unique (role_id, module, action)
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  role_id uuid not null references public.roles(id),
  full_name text not null,
  locale text not null default 'fr',
  employee_id uuid, -- FK ajoutée après création de employees
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  slug text not null,
  name text not null,
  address text,
  timezone text not null default 'Europe/Paris',
  surface_m2 numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  unique (org_id, slug)
);

-- ---------------------------------------------------------------------
-- Helpers de droits (security definer : lisent profiles sans boucle RLS)
-- ---------------------------------------------------------------------
create or replace function app.current_profile() returns public.profiles
language sql stable security definer set search_path = public as $$
  select p.* from public.profiles p where p.user_id = auth.uid()
$$;

create or replace function app.current_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where user_id = auth.uid()
$$;

create or replace function app.current_role_key() returns text
language sql stable security definer set search_path = public as $$
  select r.key from public.profiles p join public.roles r on r.id = p.role_id
  where p.user_id = auth.uid()
$$;

create or replace function app.current_employee_id() returns uuid
language sql stable security definer set search_path = public as $$
  select employee_id from public.profiles where user_id = auth.uid()
$$;

create or replace function app.has_perm(m app.module, a app.action) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.permissions pe on pe.role_id = p.role_id
    where p.user_id = auth.uid() and pe.module = m and pe.action = a
  )
$$;

create or replace function app.can_see_salaries() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select r.sees_salaries from public.profiles p join public.roles r on r.id = p.role_id
    where p.user_id = auth.uid()
  ), false)
$$;

-- Date et heure locales de l'organisation (pour « aujourd'hui »)
create or replace function app.org_today() returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce(
    (select o.timezone from public.orgs o where o.id = app.current_org_id()), 'Europe/Paris'))::date
$$;

grant execute on all functions in schema app to authenticated, service_role;

-- Valeurs par défaut des colonnes communes
alter table public.roles alter column created_by set default auth.uid();
alter table public.permissions alter column created_by set default auth.uid();
alter table public.profiles alter column created_by set default auth.uid();
alter table public.sites alter column created_by set default auth.uid();
alter table public.sites alter column org_id set default app.current_org_id();
