-- =====================================================================
-- 02 · Tables métier (vocabulaire générique ; libellés via sector.config)
-- Colonnes communes : org_id, created_at, updated_at, created_by
-- =====================================================================

-- ------------------------------------------------------------- Plan 3D
create table public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  layout jsonb not null default '{}',
  published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (site_id, version)
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  key text not null,
  code text not null,
  name text not null,
  type text not null,
  wing text,
  floor_material text,
  capacity int not null default 0,
  polygon jsonb not null default '[]',
  description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (site_id, key)
);

create table public.map_objects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  zone_id uuid references public.zones(id) on delete set null,
  type text not null,
  kit text not null,
  label text,
  position jsonb not null default '[0,0,0]',
  rotation numeric not null default 0,
  scale numeric not null default 1,
  params jsonb not null default '{}',
  entity_type text,
  entity_id uuid,
  visual_state text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);
create index on public.map_objects (entity_type, entity_id);

-- ------------------------------------------------------------- Personnes
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  key text not null,
  name text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, key)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid references public.sites(id),
  department_id uuid references public.departments(id),
  manager_id uuid references public.employees(id),
  home_zone_id uuid references public.zones(id),
  first_name text not null,
  last_name text not null,
  job_key text not null,
  job_title text not null,
  email text,
  phone text,
  contract_type text not null default 'CDI' check (contract_type in ('CDI', 'CDD', 'alternance', 'stage', 'freelance')),
  work_rate numeric(4,3) not null default 1,
  hired_on date not null,
  left_on date,
  skills text[] not null default '{}',
  avatar_color text,
  appearance jsonb not null default '{}',
  leave_balance_days numeric(5,2) not null default 0,
  overtime_hours numeric(6,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);
alter table public.profiles add constraint profiles_employee_fk foreign key (employee_id) references public.employees(id) on delete set null;

-- Table séparée : RLS RH + direction uniquement
create table public.employee_salaries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  effective_from date not null,
  gross_annual numeric(12,2) not null,
  months smallint not null default 12 check (months in (12, 13)),
  bonus_target numeric(12,2) not null default 0,
  note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

-- ------------------------------------------------------------- Présence
create type app.badge_kind as enum ('in', 'out', 'pause_start', 'pause_end');

create table public.badge_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  kind app.badge_kind not null,
  reader text not null default 'accueil',
  at timestamptz not null default now(),
  source text not null default 'badgeuse' check (source in ('badgeuse', 'simulateur', 'manuel', 'map')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);
create index on public.badge_events (employee_id, at desc);

-- ------------------------------------------------------------- Temps & absences
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  owner_id uuid references public.employees(id) on delete cascade,
  resource_id uuid, -- asset (salle, véhicule…) réservé
  type text not null check (type in ('reunion', 'client', 'focus', 'pause', 'teletravail', 'deplacement', 'tournage', 'livraison', 'autre')),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  attendees uuid[] not null default '{}',
  client_id uuid,
  external_source text,
  external_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  check (ends_at > starts_at)
);
create index on public.calendar_events (starts_at);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  type text not null check (type in ('conges', 'rtt', 'maladie', 'formation', 'sans_solde', 'parental')),
  starts_on date not null,
  ends_on date not null,
  days numeric(5,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id uuid references public.employees(id),
  decided_at timestamptz,
  comment text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  check (ends_on >= starts_on)
);

-- ------------------------------------------------------------- RH
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  reviewer_id uuid references public.employees(id),
  scheduled_on date,
  status text not null default 'planned' check (status in ('planned', 'done')),
  objectives jsonb not null default '[]',
  summary text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.trainings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  provider text,
  starts_on date,
  hours numeric(6,2),
  cost numeric(10,2),
  status text not null default 'planned' check (status in ('planned', 'done', 'cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.job_openings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  title text not null,
  department_id uuid references public.departments(id),
  criteria jsonb not null default '[]',
  status text not null default 'open' check (status in ('draft', 'open', 'closed')),
  opened_on date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  job_opening_id uuid not null references public.job_openings(id) on delete cascade,
  full_name text not null,
  email text,
  source text,
  score char(1) check (score in ('A', 'B', 'C')),
  ai_summary jsonb,
  stage text not null default 'nouveau' check (stage in ('nouveau', 'entretien_1', 'entretien_2', 'entretien_3', 'offre', 'embauche', 'refuse')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  kind text not null default 'onboarding' check (kind in ('onboarding', 'offboarding')),
  title text not null,
  due_on date,
  done_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

-- ------------------------------------------------------------- Commercial
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  kind text not null check (kind in ('entreprise', 'particulier')),
  segment text, -- café, hôtel, concept store, cadeaux d'entreprise…
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  preferred_channel text default 'email',
  language text not null default 'fr',
  owner_id uuid references public.employees(id),
  satisfaction smallint check (satisfaction between 1 and 5),
  internal_note text,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  language text not null default 'fr',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  stage text not null default 'froid' check (stage in ('froid', 'tiede', 'chaud', 'gagne', 'perdu')),
  value numeric(12,2) not null default 0,
  probability numeric(4,3) not null default 0.1,
  owner_id uuid references public.employees(id),
  expected_close_on date,
  source text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  sku text not null,
  name text not null,
  unit text not null default 'unité',
  unit_price numeric(12,2) not null,   -- prix client HT
  unit_cost numeric(12,2) not null,    -- coût interne HT
  vat_rate numeric(5,4) not null,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, sku)
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  number text not null,
  client_id uuid not null references public.clients(id),
  deal_id uuid references public.deals(id),
  status text not null default 'draft' check (status in ('draft', 'sent', 'opened', 'accepted', 'rejected', 'expired')),
  issued_on date,
  valid_until date,
  discount_pct numeric(5,4) not null default 0,
  total_ht numeric(12,2) not null default 0,
  total_vat numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz,
  owner_id uuid references public.employees(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);

create table public.quote_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id),
  label text not null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2) not null default 0,
  vat_rate numeric(5,4) not null,
  position int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

-- ------------------------------------------------------------- Opérations
create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid references public.sites(id),
  number text not null,
  client_id uuid not null references public.clients(id),
  quote_id uuid references public.quotes(id),
  title text not null,
  physical_object text,          -- ex. « 2 cartons · 18 kg »
  stage text not null,           -- clé d'étape de sector.config
  progress numeric(4,3) not null default 0,
  status text not null default 'en_cours' check (status in ('en_cours', 'attente', 'bloque', 'termine')),
  blocked_reason text,
  owner_id uuid references public.employees(id),
  zone_id uuid references public.zones(id),
  hours_budget numeric(8,2) not null default 0,
  due_at timestamptz,
  received_at timestamptz,
  amount_ht numeric(12,2) not null default 0,
  amount_ttc numeric(12,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);

create table public.work_order_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  stage text not null,
  entered_at timestamptz not null default now(),
  left_at timestamptz,
  actor_id uuid references public.employees(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  progress numeric(4,3) not null default 0,
  assignee_id uuid references public.employees(id),
  due_on date,
  position int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete cascade,
  title text not null,
  items jsonb not null default '[]', -- [{label, done, done_at}]
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_order_id uuid references public.work_orders(id) on delete set null,
  worked_on date not null,
  hours numeric(5,2) not null check (hours > 0 and hours <= 24),
  billable boolean not null default true,
  note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

-- Commandes en ligne des particuliers (flux agrégé, alimenté par l'adaptateur boutique)
create table public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  number text not null,
  channel text not null default 'boutique' check (channel in ('boutique', 'abonnement', 'pro')),
  customer_name text not null,
  city text,
  items int not null default 1,
  total_ht numeric(12,2) not null,
  total_ttc numeric(12,2) not null,
  status text not null default 'payee' check (status in ('payee', 'preparation', 'emballee', 'expediee', 'livree', 'annulee')),
  pack_station int,
  ordered_at timestamptz not null default now(),
  packed_at timestamptz,
  shipped_at timestamptz,
  ship_deadline timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);
create index on public.shop_orders (ordered_at desc);

-- ------------------------------------------------------------- Ressources
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  site_id uuid references public.sites(id),
  zone_id uuid references public.zones(id),
  type text not null check (type in ('vehicule', 'equipement', 'salle', 'poste_informatique', 'machine', 'imprimante', 'serveur', 'mobilier')),
  key text not null,
  name text not null,
  status text not null default 'ok' check (status in ('ok', 'en_service', 'maintenance', 'panne', 'hors_service')),
  assigned_employee_id uuid references public.employees(id),
  specs jsonb not null default '{}',
  telemetry jsonb not null default '{}',
  next_maintenance_on date,
  purchase_cost numeric(12,2),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, key)
);
alter table public.calendar_events add constraint calendar_events_resource_fk foreign key (resource_id) references public.assets(id) on delete set null;

create table public.asset_bookings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  employee_id uuid references public.employees(id),
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  check (ends_at > starts_at)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  name text not null,
  country char(2),
  category text,
  email text,
  lead_time_days int,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.stock_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id),
  supplier_id uuid references public.suppliers(id),
  reference text not null,
  name text not null,
  category text not null,
  unit text not null default 'unité',
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  location text,               -- ex. A-03 (rayonnage-niveau)
  zone_id uuid references public.zones(id),
  unit_cost numeric(12,4) not null default 0,
  on_order boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, reference)
);

-- Traçabilité alimentaire : un lot par réception
create table public.lots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  supplier_id uuid references public.suppliers(id),
  number text not null,
  quantity numeric(12,2) not null,
  received_at timestamptz,
  best_before date,
  status text not null default 'quarantaine' check (status in ('attendu', 'quarantaine', 'libere', 'bloque', 'epuise')),
  coa_ok boolean,
  qc_notes text,
  retained_samples int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  lot_id uuid references public.lots(id),
  work_order_id uuid references public.work_orders(id) on delete set null,
  kind text not null check (kind in ('entree', 'sortie', 'ajustement', 'inventaire')),
  quantity numeric(12,2) not null,
  reason text,
  at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'confirmed', 'in_transit', 'received', 'cancelled')),
  lines jsonb not null default '[]', -- [{stock_item_id, label, quantity, unit_cost}]
  total_ht numeric(12,2) not null default 0,
  expected_on date,
  received_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);

-- ------------------------------------------------------------- Finance
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  number text not null,
  client_id uuid not null references public.clients(id),
  work_order_id uuid references public.work_orders(id),
  quote_id uuid references public.quotes(id),
  kind text not null default 'facture' check (kind in ('facture', 'acompte', 'avoir')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
  issued_on date,
  due_on date,
  total_ht numeric(12,2) not null default 0,
  total_vat numeric(12,2) not null default 0,
  total_ttc numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, number)
);

create table public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  label text not null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,4) not null,
  position int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12,2) not null,
  received_on date not null,
  method text not null default 'virement',
  reference text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.dunning_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  level smallint not null check (level between 1 and 3),
  sent_at timestamptz,
  due_at timestamptz not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  employee_id uuid not null references public.employees(id),
  spent_on date not null,
  category text not null,
  label text not null,
  amount_ttc numeric(12,2) not null,
  vat_amount numeric(12,2) not null default 0,
  receipt_path text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'reimbursed')),
  approver_id uuid references public.employees(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.cash_forecast (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  week_start date not null,
  inflow numeric(12,2) not null default 0,
  outflow numeric(12,2) not null default 0,
  note text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid(),
  unique (org_id, week_start)
);

-- ------------------------------------------------------------- Communication
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  channel text not null check (channel in ('email', 'teams', 'chat', 'interne')),
  subject text not null,
  client_id uuid references public.clients(id) on delete set null,
  work_order_id uuid references public.work_orders(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'awaiting_reply', 'answered', 'closed')),
  last_message_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  thread_id uuid not null references public.threads(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  from_name text not null,
  body text not null,
  language text default 'fr',
  is_ai_draft boolean not null default false,
  sent_at timestamptz,
  external_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  name text not null,
  kind text,
  storage_path text,
  version int not null default 1,
  external_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, -- null = toute l'organisation
  kind text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

-- ------------------------------------------------------------- Pilotage & sécurité
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  type text not null,            -- ex. badge.in, work_order.stage, quote.accepted
  entity text not null,          -- ex. employees, work_orders
  entity_id uuid,
  payload jsonb not null default '{}',
  actor uuid default auth.uid(),
  at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);
create index on public.activity_events (org_id, at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.orgs(id) on delete cascade,
  table_name text not null,
  row_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  actor uuid default auth.uid(),
  at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  trigger jsonb not null,     -- {type: event|date|threshold, ...}
  conditions jsonb not null default '[]',
  actions jsonb not null default '[]',
  last_run_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.saved_views (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  module text not null,
  name text not null,
  filters jsonb not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default app.current_org_id() references public.orgs(id) on delete cascade,
  name text not null,
  schedule text,              -- cron
  recipients text[] not null default '{}',
  definition jsonb not null default '{}',
  last_sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid default auth.uid()
);
