-- MATOCHA — schéma initial (Supabase / Postgres).
-- Toutes les tables ont la RLS activée SANS politique publique :
-- seule la clé service-role (serveur uniquement) peut lire ou écrire.
-- Les colonnes reprennent src/lib/store/types.ts et les modules qui les utilisent.

create extension if not exists pgcrypto;

-- Réglages clé/valeur (site_mode, legal_pages_complete, shipping_configured…)
create table if not exists public.settings (
  id text primary key,
  value jsonb,
  updated_at timestamptz not null default now()
);

-- Liste d'attente (double opt-in)
create table if not exists public.leads (
  id text primary key default gen_random_uuid()::text,
  email text not null unique,
  interests text[] not null default '{}',
  tags text[] not null default '{}',
  source text,
  consent_version text not null,
  consent_text text not null,
  status text not null check (status in ('pending', 'confirmed', 'unsubscribed')),
  ip_hash text,
  confirm_token_hash text unique,
  unsubscribe_token_hash text not null unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_email_sent_at timestamptz
);
create index if not exists leads_status_idx on public.leads (status);

-- Jetons de l'API Ops (seule l'empreinte SHA-256 est stockée)
create table if not exists public.api_tokens (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  token_hash text not null unique,
  prefix text not null,
  scopes text[] not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null,
  last_used_at timestamptz
);

-- Journal d'audit
create table if not exists public.audit_log (
  id text primary key default gen_random_uuid()::text,
  actor text not null,
  token_id text,
  action text not null,
  method text,
  route text,
  status integer,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- Idempotence (id = sha256(token_id:clé))
create table if not exists public.idempotency_keys (
  id text primary key,
  token_id text not null,
  fingerprint text not null,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- File de validation humaine
create table if not exists public.change_requests (
  id text primary key default gen_random_uuid()::text,
  kind text not null check (kind in ('recipe.proof', 'pack.price', 'pack.status', 'content.publish', 'order.refund', 'media.publish', 'settings.mode')),
  target text not null,
  summary text not null,
  payload jsonb not null default '{}',
  before jsonb,
  status text not null check (status in ('pending', 'approved', 'rejected', 'applied', 'failed')),
  requested_by text not null,
  token_id text,
  created_at timestamptz not null default now(),
  decided_by text,
  decided_at timestamptz,
  decision_note text,
  applied_at timestamptz,
  error text
);
create index if not exists change_requests_status_idx on public.change_requests (status, created_at desc);

-- Surcharges du catalogue (id = entity:key)
create table if not exists public.catalog_overrides (
  id text primary key,
  entity text not null check (entity in ('recipe', 'pack', 'family', 'company', 'shipping', 'socials')),
  key text not null,
  patch jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Blocs de contenu (FAQ, bandeau, sections)
create table if not exists public.content_blocks (
  id text primary key default gen_random_uuid()::text,
  key text not null,
  kind text not null check (kind in ('faq', 'announcement', 'section')),
  title text,
  body text not null,
  locale text not null default 'fr',
  status text not null check (status in ('draft', 'published')),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

-- Médias déposés par l'agent (en attente de validation)
create table if not exists public.media_items (
  id text primary key,
  manifest_id text not null,
  family text,
  recipe text,
  status text not null check (status in ('real', 'concept')),
  kind text not null,
  source text not null,
  license jsonb not null,
  files jsonb not null,
  alt text not null default '',
  decorative boolean not null default false,
  used_in text[] not null default '{}',
  notes text not null default '',
  publish_status text not null check (publish_status in ('pending_review', 'published')),
  submitted_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Commandes (mode vente uniquement)
create table if not exists public.orders (
  id text primary key,
  status text not null check (status in ('pending', 'paid', 'payment_failed', 'refunded', 'shipped')),
  email text,
  lines jsonb not null default '[]',
  amount_total_cents integer,
  currency text,
  checkout_session_id text unique,
  payment_intent_id text,
  refund_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders (id),
  mode text not null,
  carrier text,
  tracking_number text,
  tracking_url text,
  created_at timestamptz not null default now()
);

-- Webhooks sortants vers l'agent
create table if not exists public.webhook_deliveries (
  id text primary key,
  event text not null,
  payload jsonb not null,
  status text not null check (status in ('pending', 'delivered', 'retrying', 'failed', 'skipped')),
  attempts integer not null default 0,
  next_attempt_at timestamptz,
  last_status_code integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_due_idx on public.webhook_deliveries (status, next_attempt_at);

-- Compteurs de limitation de débit (fenêtres fixes)
create table if not exists public.rate_limits (
  id text primary key,
  count integer not null default 0,
  window_start timestamptz not null
);

-- Liens magiques et sessions du back-office (empreintes uniquement)
create table if not exists public.admin_sessions (
  id text primary key default gen_random_uuid()::text,
  kind text not null check (kind in ('link', 'session')),
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS : activée partout, aucune politique => inaccessible avec la clé anon.
do $$
declare t text;
begin
  foreach t in array array[
    'settings', 'leads', 'api_tokens', 'audit_log', 'idempotency_keys', 'change_requests',
    'catalog_overrides', 'content_blocks', 'media_items', 'orders', 'shipments',
    'webhook_deliveries', 'rate_limits', 'admin_sessions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- Valeur initiale : pré-lancement.
insert into public.settings (id, value) values ('site_mode', '"prelaunch"') on conflict (id) do nothing;
