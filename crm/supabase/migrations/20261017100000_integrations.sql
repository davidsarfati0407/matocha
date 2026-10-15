-- Intégrations Microsoft 365 / Google Workspace : comptes, secrets chiffrés, abonnements webhooks,
-- file de synchronisation avec reprise. Les secrets ne sont JAMAIS lisibles par un client :
-- aucune politique RLS sur integration_secrets (seul le serveur, avec la clé service, y accède).

create table public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  provider text not null check (provider in ('microsoft', 'google')),
  account_email text,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  scopes text[] not null default '{}',
  expires_at timestamptz,
  cursors jsonb not null default '{}', -- deltaLink Graph, syncToken Google…
  last_sync_at timestamptz,
  last_error text,
  connected_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (org_id, provider)
);

create table public.integration_secrets (
  account_id uuid primary key references public.integration_accounts(id) on delete cascade,
  access_token_enc text not null,
  refresh_token_enc text,
  updated_at timestamptz not null default now()
);

create table public.integration_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.integration_accounts(id) on delete cascade,
  resource text not null,
  external_id text not null,
  client_state text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  provider text not null check (provider in ('microsoft', 'google', 'mock')),
  kind text not null,             -- mail.send, calendar.push, calendar.delta, mail.delta, files.folder, subscriptions.renew…
  payload jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'error', 'dead')),
  attempts int not null default 0,
  next_run_at timestamptz not null default now(),
  last_error text,
  result jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index sync_jobs_due on public.sync_jobs (status, next_run_at);

alter table public.integration_accounts enable row level security;
create policy ia_select on public.integration_accounts for select to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'read'));
create policy ia_write on public.integration_accounts for update to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'update'));
alter table public.integration_secrets enable row level security;        -- aucune politique : illisible
alter table public.integration_subscriptions enable row level security;  -- idem
alter table public.sync_jobs enable row level security;
create policy sj_select on public.sync_jobs for select to authenticated
  using (org_id = app.current_org_id() and (created_by = auth.uid() or app.has_perm('organisation', 'read')));
create policy sj_insert on public.sync_jobs for insert to authenticated
  with check (org_id = app.current_org_id());
create policy sj_retry on public.sync_jobs for update to authenticated
  using (org_id = app.current_org_id() and app.has_perm('organisation', 'update'));

-- Rendez-vous : identifiant de l'événement chez le fournisseur et réunion en ligne
alter table public.calendar_events add column if not exists online_meeting boolean not null default false;
alter table public.calendar_events add column if not exists join_url text;
