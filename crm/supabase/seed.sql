-- =====================================================================
-- SEED DE DÉMONSTRATION — MATOCHA SAS
-- Projection fictive an 3 — données de démonstration
-- Généré par scripts/gen-seed.ts depuis config/sector.config.ts : ne pas éditer à la main.
-- Toutes les personnes, entreprises, plaques et numéros sont fictifs.
-- =====================================================================
select set_config('app.seeding', 'on', false);

insert into public.orgs (id, slug, name, legal_name, country, locale, timezone, currency, vat_standard, vat_reduced, rounding, demo_mode, settings) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'matocha', 'MATOCHA', 'MATOCHA SAS', 'FR', 'fr-FR', 'Europe/Paris', 'EUR', 0.2, 0.055, 0.01, true, '{"daily_revenue_target":9000,"pickup_time":"15:00","demo_notice":"Projection fictive an 3 — données de démonstration"}'::jsonb);

insert into public.roles (id, org_id, key, label, description, sees_salaries, edits_plan) values
  ('dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'direction', 'Direction', 'Accès complet, salaires inclus.', true, true),
  ('76026bba-8369-4d5f-aa0c-961a8136b3e4', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'admin', 'Administrateur', 'Paramètres, plan 3D, utilisateurs. Pas les salaires.', false, true),
  ('0f398108-1636-4d28-b35a-fb71c3f1a485', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'rh', 'RH', 'Collaborateurs, présences, congés, salaires, recrutement.', true, false),
  ('8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'finance', 'Finance', 'Factures, paiements, frais, trésorerie, masse salariale agrégée.', false, false),
  ('f3e862cd-a845-4ba7-831f-520ce91f4abe', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'operations', 'Opérations', 'Commandes pro, stock, lots, expéditions, équipements.', false, false),
  ('29e28b67-c766-436a-8aa3-9edc595fc90e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'commercial', 'Commercial', 'Comptes, pipeline, devis, commandes pro.', false, false),
  ('0db91244-0a1a-4b70-985b-5fef7e98cd75', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'manager', 'Manager', 'Son équipe : présences, congés à valider, heures.', false, false),
  ('7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'employe', 'Collaborateur', 'Ses propres données, map, annuaire.', false, false),
  ('74126852-86a8-4541-a6e3-c1789c15999c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'lecture', 'Lecture seule', 'Map et tableaux de bord, sans données personnelles sensibles.', false, false);

insert into public.permissions (org_id, role_id, module, action) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'pilotage', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'pilotage', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'pilotage', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'pilotage', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'communication', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'communication', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'commercial', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'commercial', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'commercial', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'commercial', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'commercial', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'operations', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'operations', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'operations', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'operations', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'rh', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'rh', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'rh', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'rh', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'rh', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'salaires', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'salaires', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'salaires', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'salaires', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'salaires', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'finance', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'finance', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'finance', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'finance', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'finance', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ressources', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ressources', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ressources', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ressources', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ia', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ia', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'ia', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'organisation', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'organisation', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'organisation', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'organisation', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'organisation', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'plan', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'plan', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'plan', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'plan', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'pilotage', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'pilotage', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'pilotage', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'pilotage', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'communication', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'communication', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'commercial', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'commercial', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'commercial', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'commercial', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'commercial', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'operations', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'operations', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'operations', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'operations', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'rh', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'finance', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ressources', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ressources', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ressources', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ressources', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ia', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ia', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'ia', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'organisation', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'organisation', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'organisation', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'organisation', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'organisation', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'plan', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'plan', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'plan', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'plan', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'rh', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'rh', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'rh', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'rh', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'rh', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'salaires', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'salaires', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'salaires', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'salaires', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'salaires', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'pilotage', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'commercial', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'commercial', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'finance', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'finance', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'finance', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'finance', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'finance', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'rh', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'commercial', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'operations', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'operations', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'operations', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'operations', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ressources', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ressources', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ressources', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ressources', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'communication', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'communication', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'commercial', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'commercial', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'commercial', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'commercial', 'delete'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'commercial', 'export'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'operations', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'operations', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'finance', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'communication', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'operations', 'update'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'rh', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'communication', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'communication', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'operations', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'ressources', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'ia', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'ia', 'create'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'plan', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '74126852-86a8-4541-a6e3-c1789c15999c', 'pilotage', 'read'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '74126852-86a8-4541-a6e3-c1789c15999c', 'plan', 'read');

insert into public.sites (id, org_id, slug, name, address, timezone, surface_m2) values
  ('e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'maison_montreuil', 'Maison MATOCHA', '14 rue des Glycines, 93100 Montreuil (adresse fictive)', 'Europe/Paris', 1450);

insert into public.zones (id, org_id, site_id, key, code, name, type, wing, floor_material, capacity, description) values
  ('afcff762-ae96-4ce5-a38a-f84c23dca33e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'bar', 'BAR', 'Bar à matcha & showroom', 'bar', 'bureaux', 'parquet_clair', 14, 'Accueil des visiteurs et des pros, dégustation, comptoir en bois, étagère des boîtes.'),
  ('8a3a8282-9240-4028-997c-33c94e0569c9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'accueil', 'ACC', 'Accueil', 'accueil', 'bureaux', 'parquet_clair', 4, 'Badgeuse, banque d''accueil, salle d''attente visiteurs.'),
  ('9a544330-9496-40ae-ae9f-88df58347448', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'open_space', 'OS', 'Open space', 'open_space', 'bureaux', 'parquet_clair', 16, 'Marketing, e-commerce, ventes pros, service client, finance.'),
  ('eab5c75c-b7ae-49eb-9907-a98453270b4d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'studio', 'STU', 'Studio contenu', 'studio', 'bureaux', 'beton_cire', 5, 'Tournage TikTok/Instagram : fond infini ivoire, softbox, caméra sur trépied, plan de travail.'),
  ('861849fb-44c2-4377-a94f-657e203f2c47', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'salle_uji', 'UJI', 'Salle Uji', 'reunion', 'bureaux', 'tatami', 8, 'Grande salle de réunion, écran mural, table basse en bois.'),
  ('e7f3ac89-a9a6-43bb-a348-c6848099aa5c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'salle_shizuoka', 'SHZ', 'Salle Shizuoka', 'reunion', 'bureaux', 'moquette', 4, 'Petite salle / visio.'),
  ('23964487-0d37-4a62-a01a-7b82f9546a14', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'direction', 'DIR', 'Bureau direction', 'direction', 'bureaux', 'parquet_clair', 2, 'Bureau du fondateur et de la DG.'),
  ('e4a0df23-aac3-40b4-ac72-2032e1c96326', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'labo', 'LAB', 'Labo dégustation & R&D', 'labo', 'bureaux', 'carrelage', 4, 'Dégustation à l''aveugle, grille de notation, balance de précision, nouvelles recettes.'),
  ('8c49ef91-34f8-4c5c-b8a7-012f10fe52f7', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'detente', 'DET', 'Espace détente', 'detente', 'bureaux', 'parquet_clair', 10, 'Cuisine, ping-pong, canapés, machine à café pour les irréductibles.'),
  ('6dbb8a4c-74bf-4465-836f-955d11b24920', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'technique', 'TEC', 'Local technique', 'technique', 'bureaux', 'resine', 1, 'Baie serveur, imprimante multifonction.'),
  ('dbbf13dd-b734-4bd5-8234-4cd511ab3f8c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'quai', 'QUA', 'Quai de réception', 'reception', 'atelier', 'beton_cire', 3, 'Arrivée des lots du Japon et des consommables, déchargement des palettes.'),
  ('21e17cbe-91d9-41a2-89f9-b35a4f4ecef1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'quarantaine', 'QC', 'Quarantaine & contrôle qualité', 'quarantaine', 'atelier', 'resine', 3, 'Lots bloqués jusqu''à validation : COA, pesée, test d''ouverture, dégustation.'),
  ('c11707ce-11b8-4237-99a8-0614dfb2e6f9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'stock', 'STK', 'Stock', 'stock', 'atelier', 'resine', 2, 'Rayonnages A à D : boîtes, sticks, coffrets, accessoires, consommables d''emballage. Local tempéré, relevé de température.'),
  ('e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'preparation', 'PRE', 'Préparation des commandes', 'preparation', 'atelier', 'beton_cire', 8, 'Quatre tables de pack, imprimante d''étiquettes, carte manuscrite.'),
  ('f18ad8e6-4aa3-4f31-99a7-71e37a84aadf', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'expedition', 'EXP', 'Expédition', 'expedition', 'atelier', 'beton_cire', 3, 'Colis triés par transporteur, palettes pros filmées, enlèvement à 15 h.'),
  ('2947eb41-c6ee-47a2-99a3-e03a4dcb45a6', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'echantillotheque', 'ECH', 'Échantillothèque', 'echantillotheque', 'atelier', 'resine', 1, '3 boîtes scellées par lot, conservées jusqu''à DDM + 6 mois, armoire à température suivie.'),
  ('209a230a-22bc-4ea7-816f-19de8a7d8abf', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'vestiaire', 'VES', 'Vestiaire atelier', 'vestiaire', 'atelier', 'carrelage', 6, 'Casiers, tabliers verts.'),
  ('5ba709c2-8e11-4af7-954e-80b78a575489', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'cour', 'COU', 'Cour aux bambous', 'exterieur', 'exterieur', 'paves', 20, 'Cour intérieure plantée, tables extérieures, vélos.'),
  ('dcfe8439-b065-4ebc-a632-45b694ed2d25', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'parking', 'PAR', 'Cour de service & parking', 'exterieur', 'exterieur', 'enrobe', 6, 'Utilitaire électrique, vélo-cargo, place camion transporteur.'),
  ('e81847b9-cabb-49fe-8cce-04442ea8b3d8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'rue', 'RUE', 'Rue des Glycines', 'exterieur', 'exterieur', 'enrobe', 0, 'Circulation de fond, trottoir, arbres d''alignement.');

insert into public.floor_plans (id, org_id, site_id, version, status, layout) values
  ('2af60e88-f7f0-43c7-8630-66e55b0db1ff', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 1, 'draft', '{"generated":false,"note":"Plan généré en phase 2 depuis la fiche secteur"}'::jsonb);

insert into public.departments (id, org_id, key, name) values
  ('846ea426-7976-40d3-8fad-e0ad2875f0e2', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'direction', 'Direction'),
  ('32996d02-27b3-4c92-a73f-019c462c0c28', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'marque', 'Marque & contenu'),
  ('f4628d21-e5b2-4e74-8b6b-df587a942191', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'growth', 'Growth & e-commerce'),
  ('2eb9a8ca-8a8d-43a0-bf28-a0c3a5fd5f2e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'ventes', 'Ventes pros'),
  ('d267df1a-ced9-4c60-a7a0-af77ac231142', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'service_client', 'Service client'),
  ('15d72363-d815-447c-947c-96470589cdc1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'produit', 'Produit & qualité'),
  ('03a6616e-66e4-4a30-bab6-da423f1a0558', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'logistique', 'Logistique'),
  ('80835073-fd67-47aa-bd72-f2bd560704e2', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'finance_rh', 'Finance & RH'),
  ('278b80bb-06e3-4844-a310-eb7281f0ae87', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'bar', 'Bar & showroom');

insert into public.employees (id, org_id, site_id, department_id, manager_id, home_zone_id, first_name, last_name, job_key, job_title, email, phone, contract_type, work_rate, hired_on, skills, avatar_color, appearance, leave_balance_days, overtime_hours) values
  ('e299d35e-e668-441c-92de-5d926c18a842', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '846ea426-7976-40d3-8fad-e0ad2875f0e2', null, '23964487-0d37-4a62-a01a-7b82f9546a14', 'Hugo', 'Marchal', 'fondateur', 'Fondateur & président', 'hugo.marchal@matocha.demo', '+33 6 10 20 30 40', 'CDI', 1, app.local_date(-1168), array['Vision produit','Sourcing Japon','Contenu fondateur']::text[], '#E07A5F', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"pull","accessory":"aucun"}'::jsonb, 13, 7.75),
  ('31b317c4-f360-471d-be77-6b994d2d46f5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '846ea426-7976-40d3-8fad-e0ad2875f0e2', null, '23964487-0d37-4a62-a01a-7b82f9546a14', 'Claire', 'Ostrowski', 'dg', 'Directrice générale', 'claire.ostrowski@matocha.demo', '+33 6 11 27 43 57', 'CDI', 1, app.local_date(-949), array['Pilotage','Finance','Organisation']::text[], '#3D5A80', '{"skin":"#E8BF9A","hair":"#2B2B2B","hairStyle":"court","outfit":"chemise","accessory":"tablette"}'::jsonb, 20, 4.25),
  ('8450f908-aefc-44e1-9c57-809a590462f3', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Inès', 'Belkacem', 'head_brand', 'Responsable marque', 'ines.belkacem@matocha.demo', '+33 6 12 34 56 74', 'CDI', 1, app.local_date(-58), array['Direction artistique','Plateforme de marque','Partenariats']::text[], '#79A84B', '{"skin":"#C98E64","hair":"#D9B77A","hairStyle":"chignon","outfit":"pull","accessory":"aucun"}'::jsonb, 21, 12.5),
  ('b806d19f-8aaf-45b3-a031-b8bd9d055028', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'Léo', 'Garnier', 'createur', 'Créateur de contenu', 'leo.garnier@matocha.demo', '+33 6 13 41 69 41', 'CDI', 1, app.local_date(-715), array['TikTok','Tournage','Scénarisation']::text[], '#E07A5F', '{"skin":"#A86B45","hair":"#A57A4C","hairStyle":"long","outfit":"tshirt_ivoire","accessory":"camera"}'::jsonb, 22, 9),
  ('3d39b499-a3b5-41a0-b30d-0a0281e36614', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'Maëlle', 'Tran', 'createur', 'Créatrice de contenu', 'maelle.tran@matocha.demo', '+33 6 14 48 82 58', 'CDI', 1, app.local_date(-873), array['TikTok','Tournage','Scénarisation']::text[], '#173D2B', '{"skin":"#7A4A2E","hair":"#6B4A2F","hairStyle":"court","outfit":"tshirt_ivoire","accessory":"camera"}'::jsonb, 11, 4.25),
  ('07244853-26b8-4246-bca2-88eb372772a5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'Sacha', 'Lemoine', 'monteur', 'Monteur vidéo', 'sacha.lemoine@matocha.demo', '+33 6 15 55 35 75', 'CDI', 1, app.local_date(-538), array['Montage','Motion design','Étalonnage']::text[], '#173D2B', '{"skin":"#F5DCC6","hair":"#3B2A20","hairStyle":"chignon","outfit":"tshirt_ivoire","accessory":"casque"}'::jsonb, 13, 10.5),
  ('7529eaf4-427a-4a7a-8acb-10c82103f435', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Jade', 'Morel', 'designer', 'Designer graphique', 'jade.morel@matocha.demo', '+33 6 16 62 48 42', 'CDI', 1, app.local_date(-549), array['Packaging','Illustration','Figma']::text[], '#79A84B', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"pull","accessory":"aucun"}'::jsonb, 8, 2.75),
  ('eaeb7a28-0a05-4d42-adca-61652b663f76', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '32996d02-27b3-4c92-a73f-019c462c0c28', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Yanis', 'Haddad', 'community', 'Community manager', 'yanis.haddad@matocha.demo', '+33 6 17 69 61 59', 'CDI', 1, app.local_date(-906), array['Community management','UGC','Modération']::text[], '#3D5A80', '{"skin":"#E8BF9A","hair":"#2B2B2B","hairStyle":"court","outfit":"tshirt_ivoire","accessory":"aucun"}'::jsonb, 16, 0.75),
  ('2e9bff21-61bb-4804-be86-567c86112536', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'f4628d21-e5b2-4e74-8b6b-df587a942191', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Camille', 'Vasseur', 'ecom_manager', 'Responsable e-commerce', 'camille.vasseur@matocha.demo', '+33 6 18 76 74 76', 'CDI', 1, app.local_date(-209), array['Boutique en ligne','Conversion','Merchandising']::text[], '#5C6B73', '{"skin":"#C98E64","hair":"#D9B77A","hairStyle":"chignon","outfit":"chemise","accessory":"aucun"}'::jsonb, 14, 8),
  ('79df8327-dc68-45af-91ca-eb123b1e0800', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'f4628d21-e5b2-4e74-8b6b-df587a942191', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Théo', 'Brunet', 'media_buyer', 'Media buyer', 'theo.brunet@matocha.demo', '+33 6 19 83 87 43', 'CDI', 1, app.local_date(-902), array['Meta Ads','TikTok Ads','Attribution']::text[], '#8E7DBE', '{"skin":"#A86B45","hair":"#A57A4C","hairStyle":"long","outfit":"pull","accessory":"aucun"}'::jsonb, 17.5, 1.5),
  ('f6810c8e-0c82-4158-a3b4-ef30696a3635', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'f4628d21-e5b2-4e74-8b6b-df587a942191', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Sarah', 'Cohen', 'crm_manager', 'Chargée CRM & e-mailing', 'sarah.cohen@matocha.demo', '+33 6 20 20 40 60', 'CDI', 1, app.local_date(-475), array['E-mailing','Segmentation','Rétention']::text[], '#173D2B', '{"skin":"#7A4A2E","hair":"#6B4A2F","hairStyle":"court","outfit":"chemise","accessory":"aucun"}'::jsonb, 11, 8.75),
  ('ef9e6394-fa22-448f-a3b5-6aae527ad95e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'f4628d21-e5b2-4e74-8b6b-df587a942191', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Antoine', 'Nakamura', 'dev_shop', 'Développeur boutique', 'antoine.nakamura@matocha.demo', '+33 6 21 27 53 77', 'CDI', 1, app.local_date(-217), array['Liquid','TypeScript','Intégrations']::text[], '#8E7DBE', '{"skin":"#F5DCC6","hair":"#3B2A20","hairStyle":"chignon","outfit":"tshirt_ivoire","accessory":"casque"}'::jsonb, 15, 12.5),
  ('54372e8d-a51b-4a16-b51d-7ee323109ad8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '2eb9a8ca-8a8d-43a0-bf28-a0c3a5fd5f2e', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Julien', 'Mercier', 'head_sales', 'Responsable ventes pros', 'julien.mercier@matocha.demo', '+33 6 22 34 66 44', 'CDI', 1, app.local_date(-625), array['Négociation','CHR','Grands comptes']::text[], '#E07A5F', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"chemise","accessory":"tablette"}'::jsonb, 8.5, 0.75),
  ('00a93219-9541-4aaf-a937-4f10626b787b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '2eb9a8ca-8a8d-43a0-bf28-a0c3a5fd5f2e', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Nadia', 'Benali', 'account_manager', 'Chargée de comptes pros', 'nadia.benali@matocha.demo', '+33 6 23 41 79 61', 'CDI', 1, app.local_date(-987), array['Prospection','Suivi de comptes','Dégustation']::text[], '#173D2B', '{"skin":"#E8BF9A","hair":"#2B2B2B","hairStyle":"court","outfit":"chemise","accessory":"aucun"}'::jsonb, 11.5, 1),
  ('684f1aef-fe42-4a07-a090-caabf27681bb', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '2eb9a8ca-8a8d-43a0-bf28-a0c3a5fd5f2e', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Romain', 'Faure', 'account_manager', 'Chargé de comptes pros', 'romain.faure@matocha.demo', '+33 6 24 48 32 78', 'CDI', 1, app.local_date(-341), array['Prospection','Suivi de comptes','Dégustation']::text[], '#C9A227', '{"skin":"#C98E64","hair":"#D9B77A","hairStyle":"chignon","outfit":"chemise","accessory":"aucun"}'::jsonb, 19, 5.25),
  ('f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'd267df1a-ced9-4c60-a7a0-af77ac231142', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Lucie', 'Perrin', 'service_client', 'Conseillère service client', 'lucie.perrin@matocha.demo', '+33 6 25 55 45 45', 'CDI', 1, app.local_date(-357), array['Relation client','SAV','Anglais']::text[], '#5C6B73', '{"skin":"#A86B45","hair":"#A57A4C","hairStyle":"long","outfit":"tshirt_ivoire","accessory":"casque"}'::jsonb, 17, 4),
  ('1a5069b7-38ae-4145-8a6c-3224105b9282', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'd267df1a-ced9-4c60-a7a0-af77ac231142', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Moussa', 'Diallo', 'service_client', 'Conseiller service client', 'moussa.diallo@matocha.demo', '+33 6 26 62 58 62', 'CDI', 0.8, app.local_date(-865), array['Relation client','SAV','Anglais']::text[], '#3D5A80', '{"skin":"#7A4A2E","hair":"#6B4A2F","hairStyle":"court","outfit":"tshirt_ivoire","accessory":"casque"}'::jsonb, 17.5, 14),
  ('e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '15d72363-d815-447c-947c-96470589cdc1', null, '21e17cbe-91d9-41a2-89f9-b35a4f4ecef1', 'Hélène', 'Roussel', 'qualite', 'Responsable qualité & conformité', 'helene.roussel@matocha.demo', '+33 6 27 69 71 79', 'CDI', 1, app.local_date(-658), array['HACCP','Traçabilité','Étiquetage']::text[], '#E07A5F', '{"skin":"#F5DCC6","hair":"#3B2A20","hairStyle":"chignon","outfit":"veste_cuisine","accessory":"classeur"}'::jsonb, 10, 11.75),
  ('9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '15d72363-d815-447c-947c-96470589cdc1', null, 'e4a0df23-aac3-40b4-ac72-2032e1c96326', 'Kenji', 'Watanabe', 'sourcing', 'Responsable sourcing Japon', 'kenji.watanabe@matocha.demo', '+33 6 28 76 84 46', 'CDI', 1, app.local_date(-110), array['Japonais','Négociation fournisseurs','Dégustation']::text[], '#3D5A80', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"pull","accessory":"aucun"}'::jsonb, 6.5, 12.75),
  ('3fff2701-e274-487e-adf3-0a816c15f823', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '15d72363-d815-447c-947c-96470589cdc1', null, 'e4a0df23-aac3-40b4-ac72-2032e1c96326', 'Emma', 'Lefèvre', 'rd', 'Chargée R&D & dégustation', 'emma.lefevre@matocha.demo', '+33 6 29 83 37 63', 'CDI', 1, app.local_date(-790), array['Analyse sensorielle','Recettes','Préparation barista']::text[], '#173D2B', '{"skin":"#E8BF9A","hair":"#2B2B2B","hairStyle":"court","outfit":"veste_cuisine","accessory":"fouet"}'::jsonb, 14.5, 3.75),
  ('2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'Karim', 'Saïdi', 'head_logistique', 'Responsable logistique', 'karim.saidi@matocha.demo', '+33 6 30 20 50 80', 'CDI', 1, app.local_date(-468), array['Gestion d''entrepôt','Transporteurs','Planification']::text[], '#C9A227', '{"skin":"#C98E64","hair":"#D9B77A","hairStyle":"chignon","outfit":"gilet_securite","accessory":"tablette"}'::jsonb, 4.5, 4.5),
  ('693f6830-7cf4-491b-8151-aa3e76aa447f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'Manon', 'Girard', 'preparateur', 'Préparatrice de commandes', 'manon.girard@matocha.demo', '+33 6 31 27 63 47', 'CDI', 1, app.local_date(-473), array['Préparation de commandes','Contrôle qualité','Emballage soigné']::text[], '#173D2B', '{"skin":"#A86B45","hair":"#A57A4C","hairStyle":"long","outfit":"tablier_vert","accessory":"scanner"}'::jsonb, 15, 3.75),
  ('0dfa6efc-2640-4e37-8e12-fda790dfcf75', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'Bastien', 'Roy', 'preparateur', 'Préparateur de commandes', 'bastien.roy@matocha.demo', '+33 6 32 34 76 64', 'CDI', 1, app.local_date(-347), array['Préparation de commandes','Contrôle qualité','Emballage soigné']::text[], '#8E7DBE', '{"skin":"#7A4A2E","hair":"#6B4A2F","hairStyle":"court","outfit":"tablier_vert","accessory":"scanner"}'::jsonb, 7.5, 0.25),
  ('601e64df-026e-48e0-8f61-92c62f5c4bd6', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'Aïcha', 'Koné', 'preparateur', 'Préparatrice de commandes', 'aicha.kone@matocha.demo', '+33 6 33 41 89 81', 'CDI', 1, app.local_date(-756), array['Préparation de commandes','Contrôle qualité','Emballage soigné']::text[], '#8E7DBE', '{"skin":"#F5DCC6","hair":"#3B2A20","hairStyle":"chignon","outfit":"tablier_vert","accessory":"scanner"}'::jsonb, 9, 13),
  ('c72b2403-bb4a-4b94-9f4a-052810718b0f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'Lucas', 'Fontaine', 'preparateur', 'Préparateur de commandes', 'lucas.fontaine@matocha.demo', '+33 6 34 48 42 48', 'CDD', 1, app.local_date(-985), array['Préparation de commandes','Contrôle qualité','Emballage soigné']::text[], '#173D2B', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"tablier_vert","accessory":"scanner"}'::jsonb, 7, 13.25),
  ('03a1ca78-3b43-4d30-b55e-7ab858b975ad', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '03a6616e-66e4-4a30-bab6-da423f1a0558', null, 'dbbf13dd-b734-4bd5-8234-4cd511ab3f8c', 'David', 'Pereira', 'receptionnaire', 'Réceptionnaire / cariste', 'david.pereira@matocha.demo', '+33 6 35 55 55 65', 'CDI', 1, app.local_date(-960), array['CACES 1','Réception','Inventaire']::text[], '#173D2B', '{"skin":"#E8BF9A","hair":"#2B2B2B","hairStyle":"court","outfit":"gilet_securite","accessory":"carton"}'::jsonb, 11.5, 7.75),
  ('4197e349-3a73-4c60-af89-f528a198e011', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '80835073-fd67-47aa-bd72-f2bd560704e2', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Olivier', 'Chevalier', 'daf', 'Directeur administratif & financier', 'olivier.chevalier@matocha.demo', '+33 6 36 62 68 82', 'CDI', 1, app.local_date(-266), array['Contrôle de gestion','Trésorerie','Levée de fonds']::text[], '#3D5A80', '{"skin":"#C98E64","hair":"#D9B77A","hairStyle":"chignon","outfit":"chemise","accessory":"aucun"}'::jsonb, 21.5, 10.25),
  ('8737ca5b-9296-4260-8c81-5d0d9ef3644f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '80835073-fd67-47aa-bd72-f2bd560704e2', null, '9a544330-9496-40ae-ae9f-88df58347448', 'Nathalie', 'Blanc', 'comptable', 'Comptable', 'nathalie.blanc@matocha.demo', '+33 6 37 69 81 49', 'CDI', 1, app.local_date(-282), array['Comptabilité','TVA','Rapprochement']::text[], '#79A84B', '{"skin":"#A86B45","hair":"#A57A4C","hairStyle":"long","outfit":"pull","accessory":"classeur"}'::jsonb, 5, 0.5),
  ('8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '80835073-fd67-47aa-bd72-f2bd560704e2', null, '8a3a8282-9240-4028-997c-33c94e0569c9', 'Sophie', 'Lambert', 'rh', 'Responsable RH & office manager', 'sophie.lambert@matocha.demo', '+33 6 38 76 34 66', 'CDI', 1, app.local_date(-154), array['Paie','Recrutement','Droit social']::text[], '#E07A5F', '{"skin":"#7A4A2E","hair":"#6B4A2F","hairStyle":"court","outfit":"chemise","accessory":"aucun"}'::jsonb, 21, 3.75),
  ('2aa2466d-8726-4fa9-86f8-5f1cfd379d8d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '278b80bb-06e3-4844-a310-eb7281f0ae87', null, 'afcff762-ae96-4ce5-a38a-f84c23dca33e', 'Chloé', 'Martin', 'barista', 'Barista & hôtesse showroom', 'chloe.martin@matocha.demo', '+33 6 39 83 47 83', 'CDI', 1, app.local_date(-704), array['Préparation matcha','Accueil','Latte art']::text[], '#5C6B73', '{"skin":"#F5DCC6","hair":"#3B2A20","hairStyle":"chignon","outfit":"tablier_vert","accessory":"fouet"}'::jsonb, 14.5, 1.25),
  ('6d146678-5d87-4c3f-94b8-7d5ae9453b9d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '278b80bb-06e3-4844-a310-eb7281f0ae87', null, 'afcff762-ae96-4ce5-a38a-f84c23dca33e', 'Tomás', 'Rivera', 'barista', 'Barista & hôte showroom', 'tomas.rivera@matocha.demo', '+33 6 40 20 60 50', 'CDI', 1, app.local_date(-755), array['Préparation matcha','Accueil','Latte art']::text[], '#C9A227', '{"skin":"#F2D3B8","hair":"#1E1A17","hairStyle":"long","outfit":"tablier_vert","accessory":"fouet"}'::jsonb, 16.5, 5.25);

update public.employees set manager_id = 'e299d35e-e668-441c-92de-5d926c18a842' where id = '31b317c4-f360-471d-be77-6b994d2d46f5';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '8450f908-aefc-44e1-9c57-809a590462f3';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = 'b806d19f-8aaf-45b3-a031-b8bd9d055028';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = '3d39b499-a3b5-41a0-b30d-0a0281e36614';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = '07244853-26b8-4246-bca2-88eb372772a5';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = '7529eaf4-427a-4a7a-8acb-10c82103f435';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = 'eaeb7a28-0a05-4d42-adca-61652b663f76';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '2e9bff21-61bb-4804-be86-567c86112536';

update public.employees set manager_id = '2e9bff21-61bb-4804-be86-567c86112536' where id = '79df8327-dc68-45af-91ca-eb123b1e0800';

update public.employees set manager_id = '2e9bff21-61bb-4804-be86-567c86112536' where id = 'f6810c8e-0c82-4158-a3b4-ef30696a3635';

update public.employees set manager_id = '2e9bff21-61bb-4804-be86-567c86112536' where id = 'ef9e6394-fa22-448f-a3b5-6aae527ad95e';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '54372e8d-a51b-4a16-b51d-7ee323109ad8';

update public.employees set manager_id = '54372e8d-a51b-4a16-b51d-7ee323109ad8' where id = '00a93219-9541-4aaf-a937-4f10626b787b';

update public.employees set manager_id = '54372e8d-a51b-4a16-b51d-7ee323109ad8' where id = '684f1aef-fe42-4a07-a090-caabf27681bb';

update public.employees set manager_id = '2e9bff21-61bb-4804-be86-567c86112536' where id = 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b';

update public.employees set manager_id = '2e9bff21-61bb-4804-be86-567c86112536' where id = '1a5069b7-38ae-4145-8a6c-3224105b9282';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b';

update public.employees set manager_id = 'e299d35e-e668-441c-92de-5d926c18a842' where id = '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41';

update public.employees set manager_id = '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41' where id = '3fff2701-e274-487e-adf3-0a816c15f823';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849';

update public.employees set manager_id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849' where id = '693f6830-7cf4-491b-8151-aa3e76aa447f';

update public.employees set manager_id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849' where id = '0dfa6efc-2640-4e37-8e12-fda790dfcf75';

update public.employees set manager_id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849' where id = '601e64df-026e-48e0-8f61-92c62f5c4bd6';

update public.employees set manager_id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849' where id = 'c72b2403-bb4a-4b94-9f4a-052810718b0f';

update public.employees set manager_id = '2d5fddf7-d60a-4061-8aca-bedc0ccb6849' where id = '03a1ca78-3b43-4d30-b55e-7ab858b975ad';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '4197e349-3a73-4c60-af89-f528a198e011';

update public.employees set manager_id = '4197e349-3a73-4c60-af89-f528a198e011' where id = '8737ca5b-9296-4260-8c81-5d0d9ef3644f';

update public.employees set manager_id = '31b317c4-f360-471d-be77-6b994d2d46f5' where id = '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = '2aa2466d-8726-4fa9-86f8-5f1cfd379d8d';

update public.employees set manager_id = '8450f908-aefc-44e1-9c57-809a590462f3' where id = '6d146678-5d87-4c3f-94b8-7d5ae9453b9d';

insert into public.employee_salaries (org_id, employee_id, effective_from, gross_annual, months, bonus_target, note) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e299d35e-e668-441c-92de-5d926c18a842', app.local_date(-120), 88500, 12, 7000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31b317c4-f360-471d-be77-6b994d2d46f5', app.local_date(-120), 85000, 12, 7000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8450f908-aefc-44e1-9c57-809a590462f3', app.local_date(-120), 55500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', app.local_date(-120), 37000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', app.local_date(-485), 35000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3d39b499-a3b5-41a0-b30d-0a0281e36614', app.local_date(-120), 41000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '07244853-26b8-4246-bca2-88eb372772a5', app.local_date(-120), 38000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '07244853-26b8-4246-bca2-88eb372772a5', app.local_date(-485), 36000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7529eaf4-427a-4a7a-8acb-10c82103f435', app.local_date(-120), 41000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'eaeb7a28-0a05-4d42-adca-61652b663f76', app.local_date(-120), 36000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e9bff21-61bb-4804-be86-567c86112536', app.local_date(-120), 57500, 12, 4500, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e9bff21-61bb-4804-be86-567c86112536', app.local_date(-485), 54500, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '79df8327-dc68-45af-91ca-eb123b1e0800', app.local_date(-120), 49000, 12, 4000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6810c8e-0c82-4158-a3b4-ef30696a3635', app.local_date(-120), 41500, 12, 3500, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'ef9e6394-fa22-448f-a3b5-6aae527ad95e', app.local_date(-120), 54500, 12, 4500, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'ef9e6394-fa22-448f-a3b5-6aae527ad95e', app.local_date(-485), 52000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(-120), 60000, 12, 5000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(-485), 57000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '00a93219-9541-4aaf-a937-4f10626b787b', app.local_date(-120), 37000, 12, 3000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '00a93219-9541-4aaf-a937-4f10626b787b', app.local_date(-485), 35000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(-120), 36500, 12, 3000, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(-485), 34500, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', app.local_date(-120), 27500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', app.local_date(-485), 26000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '1a5069b7-38ae-4145-8a6c-3224105b9282', app.local_date(-120), 30000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '1a5069b7-38ae-4145-8a6c-3224105b9282', app.local_date(-485), 28500, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', app.local_date(-120), 48500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', app.local_date(-120), 52000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', app.local_date(-485), 49500, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', app.local_date(-120), 37000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', app.local_date(-485), 35000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', app.local_date(-120), 48000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '693f6830-7cf4-491b-8151-aa3e76aa447f', app.local_date(-120), 23000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '693f6830-7cf4-491b-8151-aa3e76aa447f', app.local_date(-485), 22000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', app.local_date(-120), 24000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', app.local_date(-485), 23000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '601e64df-026e-48e0-8f61-92c62f5c4bd6', app.local_date(-120), 24000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', app.local_date(-120), 25000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', app.local_date(-120), 25000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4197e349-3a73-4c60-af89-f528a198e011', app.local_date(-120), 71500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4197e349-3a73-4c60-af89-f528a198e011', app.local_date(-485), 68000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', app.local_date(-120), 38000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', app.local_date(-485), 36000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', app.local_date(-120), 48000, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2aa2466d-8726-4fa9-86f8-5f1cfd379d8d', app.local_date(-120), 26500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2aa2466d-8726-4fa9-86f8-5f1cfd379d8d', app.local_date(-485), 25000, 12, 0, 'Avant revue annuelle'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6d146678-5d87-4c3f-94b8-7d5ae9453b9d', app.local_date(-120), 26500, 12, 0, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6d146678-5d87-4c3f-94b8-7d5ae9453b9d', app.local_date(-485), 25000, 12, 0, 'Avant revue annuelle');

-- Comptes de démo : mot de passe commun « matocha-demo »

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '669fe27b-00cb-4bd5-a8e7-7e12298c1838', 'authenticated', 'authenticated', 'direction@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Hugo Marchal"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('669fe27b-00cb-4bd5-a8e7-7e12298c1838', '669fe27b-00cb-4bd5-a8e7-7e12298c1838', '{"sub":"669fe27b-00cb-4bd5-a8e7-7e12298c1838","email":"direction@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('669fe27b-00cb-4bd5-a8e7-7e12298c1838', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd6cfe10-dd62-4f72-9ce2-67ae1900b27a', 'Hugo Marchal', 'fr', 'e299d35e-e668-441c-92de-5d926c18a842');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '2c5c2779-4b05-4887-8438-3f5eef180011', 'authenticated', 'authenticated', 'admin@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Antoine Nakamura"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('2c5c2779-4b05-4887-8438-3f5eef180011', '2c5c2779-4b05-4887-8438-3f5eef180011', '{"sub":"2c5c2779-4b05-4887-8438-3f5eef180011","email":"admin@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('2c5c2779-4b05-4887-8438-3f5eef180011', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '76026bba-8369-4d5f-aa0c-961a8136b3e4', 'Antoine Nakamura', 'fr', 'ef9e6394-fa22-448f-a3b5-6aae527ad95e');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', 'bcf16957-c9fb-4dab-9af8-c47eb80b9305', 'authenticated', 'authenticated', 'rh@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sophie Lambert"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('bcf16957-c9fb-4dab-9af8-c47eb80b9305', 'bcf16957-c9fb-4dab-9af8-c47eb80b9305', '{"sub":"bcf16957-c9fb-4dab-9af8-c47eb80b9305","email":"rh@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('bcf16957-c9fb-4dab-9af8-c47eb80b9305', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0f398108-1636-4d28-b35a-fb71c3f1a485', 'Sophie Lambert', 'fr', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '770d33c8-5d05-40c3-8a12-fa2acf2826f1', 'authenticated', 'authenticated', 'finance@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Olivier Chevalier"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('770d33c8-5d05-40c3-8a12-fa2acf2826f1', '770d33c8-5d05-40c3-8a12-fa2acf2826f1', '{"sub":"770d33c8-5d05-40c3-8a12-fa2acf2826f1","email":"finance@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('770d33c8-5d05-40c3-8a12-fa2acf2826f1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cb1da52-d7dc-4cc0-953e-6d530eeb72d1', 'Olivier Chevalier', 'fr', '4197e349-3a73-4c60-af89-f528a198e011');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '878cd7a8-be46-4b57-b789-7e1e357cb8e5', 'authenticated', 'authenticated', 'operations@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Karim Saïdi"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('878cd7a8-be46-4b57-b789-7e1e357cb8e5', '878cd7a8-be46-4b57-b789-7e1e357cb8e5', '{"sub":"878cd7a8-be46-4b57-b789-7e1e357cb8e5","email":"operations@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('878cd7a8-be46-4b57-b789-7e1e357cb8e5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f3e862cd-a845-4ba7-831f-520ce91f4abe', 'Karim Saïdi', 'fr', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '895025b6-4b5b-496c-a309-7480574df2a9', 'authenticated', 'authenticated', 'commercial@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Julien Mercier"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('895025b6-4b5b-496c-a309-7480574df2a9', '895025b6-4b5b-496c-a309-7480574df2a9', '{"sub":"895025b6-4b5b-496c-a309-7480574df2a9","email":"commercial@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('895025b6-4b5b-496c-a309-7480574df2a9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29e28b67-c766-436a-8aa3-9edc595fc90e', 'Julien Mercier', 'fr', '54372e8d-a51b-4a16-b51d-7ee323109ad8');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '9287a707-1d72-4649-a8aa-3c8dbb63a023', 'authenticated', 'authenticated', 'manager@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Inès Belkacem"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('9287a707-1d72-4649-a8aa-3c8dbb63a023', '9287a707-1d72-4649-a8aa-3c8dbb63a023', '{"sub":"9287a707-1d72-4649-a8aa-3c8dbb63a023","email":"manager@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('9287a707-1d72-4649-a8aa-3c8dbb63a023', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0db91244-0a1a-4b70-985b-5fef7e98cd75', 'Inès Belkacem', 'fr', '8450f908-aefc-44e1-9c57-809a590462f3');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', '693c9813-1c90-40b6-9bfb-aae6dcf29d59', 'authenticated', 'authenticated', 'employe@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Manon Girard"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('693c9813-1c90-40b6-9bfb-aae6dcf29d59', '693c9813-1c90-40b6-9bfb-aae6dcf29d59', '{"sub":"693c9813-1c90-40b6-9bfb-aae6dcf29d59","email":"employe@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('693c9813-1c90-40b6-9bfb-aae6dcf29d59', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7490281f-9dcf-4c86-ab2a-c59ddac3b7b5', 'Manon Girard', 'fr', '693f6830-7cf4-491b-8151-aa3e76aa447f');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, phone_change, phone_change_token, reauthentication_token)
values ('00000000-0000-0000-0000-000000000000', 'e45dc722-a866-41ce-9ff6-b97162ab126e', 'authenticated', 'authenticated', 'lecture@matocha.demo',
  extensions.crypt('matocha-demo', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lecture seule (MATOCHA)"}', now(), now(),
  '', '', '', '', '', '', '', '');
insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values ('e45dc722-a866-41ce-9ff6-b97162ab126e', 'e45dc722-a866-41ce-9ff6-b97162ab126e', '{"sub":"e45dc722-a866-41ce-9ff6-b97162ab126e","email":"lecture@matocha.demo","email_verified":true}', 'email', now(), now(), now());

insert into public.profiles (user_id, org_id, role_id, full_name, locale, employee_id) values
  ('e45dc722-a866-41ce-9ff6-b97162ab126e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '74126852-86a8-4541-a6e3-c1789c15999c', 'Lecture seule (MATOCHA)', 'fr', null);

insert into public.assets (id, org_id, site_id, zone_id, type, key, name, status, assigned_employee_id, specs, telemetry, next_maintenance_on, purchase_cost) values
  ('523265ec-0494-4702-9890-e886605c5e86', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '861849fb-44c2-4377-a94f-657e203f2c47', 'salle', 'salle_uji', 'Salle Uji', 'ok', null, '{"places":8,"equipement":["Écran 75\"","Visio","Tableau blanc"]}'::jsonb, '{}'::jsonb, null, null),
  ('b779279d-5551-4eb7-8fb6-416d616a545f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e7f3ac89-a9a6-43bb-a348-c6848099aa5c', 'salle', 'salle_shizuoka', 'Salle Shizuoka', 'ok', null, '{"places":4,"equipement":["Écran 55\"","Visio"]}'::jsonb, '{}'::jsonb, null, null),
  ('4cfdc325-c571-4df7-8c11-c5a7f5a9324f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'dcfe8439-b065-4ebc-a632-45b694ed2d25', 'vehicule', 'utilitaire', 'Utilitaire électrique', 'ok', null, '{"plaque":"FM-284-QT","energie":"électrique","charge_utile_kg":900}'::jsonb, '{"km":18420,"batterie":0.76,"en_charge":true}'::jsonb, app.local_date(38), 41800),
  ('2a9d6391-39cb-4b55-be4c-83a67d723e82', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'dcfe8439-b065-4ebc-a632-45b694ed2d25', 'vehicule', 'velo_cargo', 'Vélo-cargo de livraison', 'ok', null, '{"energie":"électrique assistée","charge_utile_kg":120}'::jsonb, '{"km":3210,"batterie":0.54}'::jsonb, app.local_date(12), 6900),
  ('4f81d793-3088-4d35-af77-12e838d4cb23', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'machine', 'table_pack_1', 'Table de pack 1', 'ok', null, '{"imprimante_etiquettes":true,"scanner":true}'::jsonb, '{"colis_jour":0}'::jsonb, null, null),
  ('0c3d8a0f-110f-4328-908f-5dd6ca9eae48', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'machine', 'table_pack_2', 'Table de pack 2', 'ok', null, '{"imprimante_etiquettes":true,"scanner":true}'::jsonb, '{"colis_jour":0}'::jsonb, null, null),
  ('38f3d719-c67c-4b44-aaac-57f8db52b1c4', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'machine', 'table_pack_3', 'Table de pack 3', 'ok', null, '{"imprimante_etiquettes":true,"scanner":true}'::jsonb, '{"colis_jour":0}'::jsonb, null, null),
  ('a5fb4eaa-a77a-454a-94da-84d245b08503', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'machine', 'table_pack_4', 'Table de pack 4', 'ok', null, '{"imprimante_etiquettes":true,"scanner":true}'::jsonb, '{"colis_jour":0}'::jsonb, null, null),
  ('c8152171-fcdc-4242-97dd-e99b2c99e714', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'f18ad8e6-4aa3-4f31-99a7-71e37a84aadf', 'imprimante', 'imprimante_etiquettes', 'Imprimante d''étiquettes transporteur', 'ok', null, '{}'::jsonb, '{"rouleau":0.42,"etiquettes_jour":0}'::jsonb, null, null),
  ('bd5bb11a-e23d-4bff-9c21-90425c25f2d3', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e4a0df23-aac3-40b4-ac72-2032e1c96326', 'equipement', 'balance_labo', 'Balance de précision (labo)', 'ok', null, '{"precision_g":0.01}'::jsonb, '{}'::jsonb, app.local_date(60), null),
  ('5df41b1d-11bf-4759-9cb5-5d109d100b90', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '21e17cbe-91d9-41a2-89f9-b35a4f4ecef1', 'equipement', 'balance_controle', 'Balance de contrôle', 'ok', null, '{"precision_g":0.1}'::jsonb, '{}'::jsonb, app.local_date(45), null),
  ('370a7454-20f5-481a-a9c9-08820c6212b9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 'machine', 'thermoscelleuse', 'Thermoscelleuse', 'ok', null, '{}'::jsonb, '{"temperature_c":165,"cycles_jour":0}'::jsonb, app.local_date(21), null),
  ('1e58baf4-40b5-4185-ac0b-ba124785eeec', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'dbbf13dd-b734-4bd5-8234-4cd511ab3f8c', 'equipement', 'transpalette', 'Transpalette électrique', 'ok', null, '{}'::jsonb, '{"batterie":0.88}'::jsonb, app.local_date(90), null),
  ('30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'equipement', 'set_tournage', 'Set de tournage', 'ok', null, '{"camera":"Hybride plein format","lumiere":"2 softbox + 1 tube"}'::jsonb, '{}'::jsonb, null, null),
  ('103e101a-1319-42bd-9fcc-0cc31da62646', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'afcff762-ae96-4ce5-a38a-f84c23dca33e', 'machine', 'machine_matcha', 'Machine à matcha du bar', 'ok', null, '{}'::jsonb, '{"boissons_jour":0,"eau_l":3.2}'::jsonb, app.local_date(14), null),
  ('2c7cc175-2ab8-4dfc-a8f0-e777d273495d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '6dbb8a4c-74bf-4465-836f-955d11b24920', 'imprimante', 'imprimante_mfp', 'Imprimante multifonction', 'ok', null, '{}'::jsonb, '{"bacs":[{"nom":"A4","niveau":0.62},{"nom":"A3","niveau":0.18}],"toner":{"noir":0.44,"cyan":0.71,"magenta":0.12,"jaune":0.58},"pages_jour":0,"cout_page":0.012}'::jsonb, null, null),
  ('782e7c88-2ead-4ef9-8571-64600c30950e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '6dbb8a4c-74bf-4465-836f-955d11b24920', 'serveur', 'baie_serveur', 'Baie serveur & réseau', 'ok', null, '{}'::jsonb, '{"cpu":0.21,"temperature_c":24.5}'::jsonb, null, null),
  ('39216dee-b5f9-4687-be01-d4a6e8f0ff74', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '2947eb41-c6ee-47a2-99a3-e03a4dcb45a6', 'equipement', 'armoire_echantillons', 'Armoire de l''échantillothèque', 'ok', null, '{}'::jsonb, '{"temperature_c":17.8,"humidite":0.41,"boites":27}'::jsonb, null, null),
  ('b01d6e61-974a-41d9-be5c-b3f16dabc5bf', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '8a3a8282-9240-4028-997c-33c94e0569c9', 'equipement', 'badgeuse', 'Badgeuse d''accueil', 'ok', null, '{}'::jsonb, '{}'::jsonb, null, null),
  ('7beb5b11-9337-449d-8c54-16e3fc016358', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '23964487-0d37-4a62-a01a-7b82f9546a14', 'poste_informatique', 'pc_fondateur_0', 'Poste Hugo M.', 'ok', 'e299d35e-e668-441c-92de-5d926c18a842', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"code","cpu":0.32,"ram":0.68,"maj_en_attente":false}'::jsonb, null, null),
  ('966cf9ab-35d0-4177-8516-70f000b8fd1d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '23964487-0d37-4a62-a01a-7b82f9546a14', 'poste_informatique', 'pc_dg_0', 'Poste Claire O.', 'ok', '31b317c4-f360-471d-be77-6b994d2d46f5', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"tableur","cpu":0.45,"ram":0.32,"maj_en_attente":false}'::jsonb, null, null),
  ('5681ebc3-a279-4f6d-9459-5888b719a363', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_head_brand_0', 'Poste Inès B.', 'ok', '8450f908-aefc-44e1-9c57-809a590462f3', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"mail","cpu":0.09,"ram":0.74,"maj_en_attente":true}'::jsonb, null, null),
  ('7e631388-c314-4888-ba58-1bb72a803af5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'poste_informatique', 'pc_createur_0', 'Poste Léo G.', 'ok', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"terminal","cpu":0.23,"ram":0.38,"maj_en_attente":false}'::jsonb, null, null),
  ('7096c6ce-f77d-4268-83f3-96b09a178927', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'poste_informatique', 'pc_createur_1', 'Poste Maëlle T.', 'ok', '3d39b499-a3b5-41a0-b30d-0a0281e36614', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"terminal","cpu":0.56,"ram":0.32,"maj_en_attente":true}'::jsonb, null, null),
  ('ce58d815-c43d-48f6-932d-d89b74a47557', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'eab5c75c-b7ae-49eb-9907-a98453270b4d', 'poste_informatique', 'pc_monteur_0', 'Poste Sacha L.', 'ok', '07244853-26b8-4246-bca2-88eb372772a5', '{"modele":"Station 32 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"crm","cpu":0.4,"ram":0.4,"maj_en_attente":true}'::jsonb, null, null),
  ('a54daab3-465e-4107-bb2e-a435b3d05443', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_designer_0', 'Poste Jade M.', 'ok', '7529eaf4-427a-4a7a-8acb-10c82103f435', '{"modele":"Station 32 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"design","cpu":0.53,"ram":0.56,"maj_en_attente":false}'::jsonb, null, null),
  ('113a8896-ca44-4503-9391-537d66dc1284', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_community_0', 'Poste Yanis H.', 'ok', 'eaeb7a28-0a05-4d42-adca-61652b663f76', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"terminal","cpu":0.6,"ram":0.62,"maj_en_attente":false}'::jsonb, null, null),
  ('b52a7d0b-eaee-4572-807b-3df1bf5aa374', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_ecom_manager_0', 'Poste Camille V.', 'ok', '2e9bff21-61bb-4804-be86-567c86112536', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"crm","cpu":0.44,"ram":0.77,"maj_en_attente":false}'::jsonb, null, null),
  ('d8a8986b-e513-45ff-ba79-1b64660df9a1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_media_buyer_0', 'Poste Théo B.', 'ok', '79df8327-dc68-45af-91ca-eb123b1e0800', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"visio","cpu":0.22,"ram":0.72,"maj_en_attente":false}'::jsonb, null, null),
  ('0c68157a-5ab5-463e-aba1-6ac81108c652', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_crm_manager_0', 'Poste Sarah C.', 'ok', 'f6810c8e-0c82-4158-a3b4-ef30696a3635', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"crm","cpu":0.48,"ram":0.73,"maj_en_attente":false}'::jsonb, null, null),
  ('7fde27af-0f95-4929-a7ed-9935a5ac9a72', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_dev_shop_0', 'Poste Antoine N.', 'ok', 'ef9e6394-fa22-448f-a3b5-6aae527ad95e', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"code","cpu":0.49,"ram":0.32,"maj_en_attente":false}'::jsonb, null, null),
  ('d64f8da5-43ba-4dea-b5af-33c7bd43034d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_head_sales_0', 'Poste Julien M.', 'ok', '54372e8d-a51b-4a16-b51d-7ee323109ad8', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"mail","cpu":0.35,"ram":0.5,"maj_en_attente":false}'::jsonb, null, null),
  ('c621407e-1d26-4974-adc5-f33737ffa192', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_account_manager_0', 'Poste Nadia B.', 'ok', '00a93219-9541-4aaf-a937-4f10626b787b', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"crm","cpu":0.21,"ram":0.59,"maj_en_attente":true}'::jsonb, null, null),
  ('8d667dd7-0ec1-44a3-a9f0-38bac580b9a1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_account_manager_1', 'Poste Romain F.', 'ok', '684f1aef-fe42-4a07-a090-caabf27681bb', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"tableur","cpu":0.17,"ram":0.68,"maj_en_attente":false}'::jsonb, null, null),
  ('22b4106a-7fd7-4467-afd8-a5e7fb5a3a1a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_service_client_0', 'Poste Lucie P.', 'ok', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"mail","cpu":0.19,"ram":0.41,"maj_en_attente":true}'::jsonb, null, null),
  ('ef6e5d70-8390-4f5c-a39a-b2dfe11d0cdf', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_service_client_1', 'Poste Moussa D.', 'ok', '1a5069b7-38ae-4145-8a6c-3224105b9282', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"code","cpu":0.28,"ram":0.66,"maj_en_attente":true}'::jsonb, null, null),
  ('c51a0be7-454c-4458-b698-d622cbf3a605', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e4a0df23-aac3-40b4-ac72-2032e1c96326', 'poste_informatique', 'pc_sourcing_0', 'Poste Kenji W.', 'ok', '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"terminal","cpu":0.33,"ram":0.55,"maj_en_attente":false}'::jsonb, null, null),
  ('7acbd61a-b07d-4929-9039-999e28710435', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'e4a0df23-aac3-40b4-ac72-2032e1c96326', 'poste_informatique', 'pc_rd_0', 'Poste Emma L.', 'ok', '3fff2701-e274-487e-adf3-0a816c15f823', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"code","cpu":0.5,"ram":0.54,"maj_en_attente":false}'::jsonb, null, null),
  ('7fccd31b-5f7c-4813-a58f-27660f64a591', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_daf_0', 'Poste Olivier C.', 'ok', '4197e349-3a73-4c60-af89-f528a198e011', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"crm","cpu":0.3,"ram":0.68,"maj_en_attente":false}'::jsonb, null, null),
  ('eafc4623-27c5-4977-b213-aa26b1ac273a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '9a544330-9496-40ae-ae9f-88df58347448', 'poste_informatique', 'pc_comptable_0', 'Poste Nathalie B.', 'ok', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"design","cpu":0.17,"ram":0.63,"maj_en_attente":false}'::jsonb, null, null),
  ('440ef914-0005-42bb-a63a-946e3da15258', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', '8a3a8282-9240-4028-997c-33c94e0569c9', 'poste_informatique', 'pc_rh_0', 'Poste Sophie L.', 'ok', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', '{"modele":"Portable 16 Go","os":"macOS"}'::jsonb, '{"session":"active","app":"tableur","cpu":0.56,"ram":0.38,"maj_en_attente":false}'::jsonb, null, null);

insert into public.badge_events (org_id, employee_id, kind, reader, at, source) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e299d35e-e668-441c-92de-5d926c18a842', 'in', 'accueil', app.local_ts(0, '08:39'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31b317c4-f360-471d-be77-6b994d2d46f5', 'in', 'accueil', app.local_ts(0, '09:18'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8450f908-aefc-44e1-9c57-809a590462f3', 'in', 'accueil', app.local_ts(0, '08:59'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', 'in', 'accueil', app.local_ts(0, '08:06'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3d39b499-a3b5-41a0-b30d-0a0281e36614', 'in', 'accueil', app.local_ts(0, '09:35'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '07244853-26b8-4246-bca2-88eb372772a5', 'in', 'accueil', app.local_ts(0, '08:24'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'eaeb7a28-0a05-4d42-adca-61652b663f76', 'in', 'accueil', app.local_ts(0, '09:05'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e9bff21-61bb-4804-be86-567c86112536', 'in', 'accueil', app.local_ts(0, '08:53'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '79df8327-dc68-45af-91ca-eb123b1e0800', 'in', 'accueil', app.local_ts(0, '08:30'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6810c8e-0c82-4158-a3b4-ef30696a3635', 'in', 'accueil', app.local_ts(0, '08:15'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '54372e8d-a51b-4a16-b51d-7ee323109ad8', 'in', 'accueil', app.local_ts(0, '08:40'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '00a93219-9541-4aaf-a937-4f10626b787b', 'in', 'accueil', app.local_ts(0, '08:09'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '684f1aef-fe42-4a07-a090-caabf27681bb', 'in', 'accueil', app.local_ts(0, '08:11'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', 'in', 'accueil', app.local_ts(0, '08:11'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '1a5069b7-38ae-4145-8a6c-3224105b9282', 'in', 'accueil', app.local_ts(0, '09:01'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', 'in', 'accueil', app.local_ts(0, '06:50'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', 'in', 'accueil', app.local_ts(0, '08:05'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'in', 'accueil', app.local_ts(0, '07:16'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', 'in', 'accueil', app.local_ts(0, '07:00'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '601e64df-026e-48e0-8f61-92c62f5c4bd6', 'in', 'accueil', app.local_ts(0, '07:05'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'in', 'accueil', app.local_ts(0, '07:06'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', 'in', 'accueil', app.local_ts(0, '07:15'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4197e349-3a73-4c60-af89-f528a198e011', 'in', 'accueil', app.local_ts(0, '08:16'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', 'in', 'accueil', app.local_ts(0, '08:47'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', 'in', 'accueil', app.local_ts(0, '08:09'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2aa2466d-8726-4fa9-86f8-5f1cfd379d8d', 'in', 'accueil', app.local_ts(0, '07:43'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6d146678-5d87-4c3f-94b8-7d5ae9453b9d', 'in', 'accueil', app.local_ts(0, '07:41'), 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '1a5069b7-38ae-4145-8a6c-3224105b9282', 'pause_start', 'detente', now() + interval '-9 minutes', 'badgeuse'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', 'pause_start', 'detente', now() + interval '-4 minutes', 'badgeuse');

-- Historique de badges : 30 jours ouvrés, horaires pseudo-aléatoires stables
insert into public.badge_events (org_id, employee_id, kind, reader, at, source)
select 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', e.id, k.kind::app.badge_kind, k.reader,
       app.local_ts(-d, '00:00') + make_interval(mins => k.base + (abs(hashtext(e.id::text || d || k.kind)) % k.spread)), 'badgeuse'
from public.employees e
cross join generate_series(1, 30) as d
cross join (values ('in', 'accueil', 440, 110), ('pause_start', 'detente', 735, 40), ('pause_end', 'detente', 790, 30), ('out', 'accueil', 1030, 105))
     as k(kind, reader, base, spread)
where e.org_id = 'af42ec17-371d-4e1a-91bd-e0c06be6ab01'
  and extract(isodow from app.local_date(-d)) < 6
  and abs(hashtext(e.id::text || d)) % 23 <> 0;  -- ~4 % d'absences ponctuelles

insert into public.calendar_events (id, org_id, owner_id, resource_id, type, title, starts_at, ends_at, attendees) values
  ('554d3359-f0bc-4519-8c73-7a9f6928cd58', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8450f908-aefc-44e1-9c57-809a590462f3', '523265ec-0494-4702-9890-e886605c5e86', 'reunion', 'Revue hebdo des campagnes', now() + interval '-25 minutes', now() + interval '35 minutes', array['8450f908-aefc-44e1-9c57-809a590462f3','2e9bff21-61bb-4804-be86-567c86112536','79df8327-dc68-45af-91ca-eb123b1e0800','f6810c8e-0c82-4158-a3b4-ef30696a3635']::uuid[]),
  ('2805d983-a5ff-46e3-a5a9-0e5b238a030e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '54372e8d-a51b-4a16-b51d-7ee323109ad8', 'b779279d-5551-4eb7-8fb6-416d616a545f', 'client', 'Visio réassort — Hôtel des Tilleuls', now() + interval '-10 minutes', now() + interval '20 minutes', array['54372e8d-a51b-4a16-b51d-7ee323109ad8']::uuid[]),
  ('cf515377-4b5a-4b8d-82b0-28c19b88d11d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3d39b499-a3b5-41a0-b30d-0a0281e36614', '30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'tournage', 'Tournage « Open. Pour. Whisk. » — 6 vidéos', now() + interval '-50 minutes', now() + interval '70 minutes', array['3d39b499-a3b5-41a0-b30d-0a0281e36614','07244853-26b8-4246-bca2-88eb372772a5']::uuid[]),
  ('864d1c07-d840-4c60-9159-2a102aff7eff', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'ef9e6394-fa22-448f-a3b5-6aae527ad95e', default, 'teletravail', 'Télétravail', app.local_ts(0, '00:00'), app.local_ts(0, '23:59'), default),
  ('308df2e2-ffb7-4e5a-abde-a65e196d4009', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', default, 'deplacement', 'Salon professionnel du thé — Lyon', app.local_ts(0, '06:30'), app.local_ts(0, '21:00'), default),
  ('ddb42f66-67fe-4ca4-a161-99689fac3107', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8450f908-aefc-44e1-9c57-809a590462f3', '523265ec-0494-4702-9890-e886605c5e86', 'reunion', 'Point lancement Discovery Box', app.local_ts(0, '14:00'), app.local_ts(0, '15:00'), array['8450f908-aefc-44e1-9c57-809a590462f3','e299d35e-e668-441c-92de-5d926c18a842','2e9bff21-61bb-4804-be86-567c86112536','7529eaf4-427a-4a7a-8acb-10c82103f435']::uuid[]),
  ('8ff4c990-4727-4124-b2ef-6ffb6210c3b9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', default, 'focus', 'Dégustation à l''aveugle — lot L2026-10C', app.local_ts(0, '16:00'), app.local_ts(0, '17:00'), array['3fff2701-e274-487e-adf3-0a816c15f823','e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b','e299d35e-e668-441c-92de-5d926c18a842']::uuid[]),
  ('a2dfcff8-ea5e-45be-811a-6fc7c2be67d8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31b317c4-f360-471d-be77-6b994d2d46f5', '523265ec-0494-4702-9890-e886605c5e86', 'reunion', 'Comité de direction', app.local_ts(1, '09:30'), app.local_ts(1, '11:00'), array['31b317c4-f360-471d-be77-6b994d2d46f5','e299d35e-e668-441c-92de-5d926c18a842','4197e349-3a73-4c60-af89-f528a198e011','8450f908-aefc-44e1-9c57-809a590462f3','54372e8d-a51b-4a16-b51d-7ee323109ad8','2d5fddf7-d60a-4061-8aca-bedc0ccb6849']::uuid[]),
  ('1b9339c3-ba07-4caa-9454-d248d0bff50b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '00a93219-9541-4aaf-a937-4f10626b787b', default, 'client', 'Rendez-vous Kissa Mori — formation barista', app.local_ts(1, '15:00'), app.local_ts(1, '17:00'), default),
  ('d9549e3d-28bd-430b-864b-ba28dc9ad375', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', 'b779279d-5551-4eb7-8fb6-416d616a545f', 'reunion', 'Entretien — candidat préparateur (2e tour)', app.local_ts(0, '11:30'), app.local_ts(0, '12:15'), array['8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f','2d5fddf7-d60a-4061-8aca-bedc0ccb6849']::uuid[]),
  ('3548d108-fc4f-4cfe-b643-f705e413efc4', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', '4cfdc325-c571-4df7-8c11-c5a7f5a9324f', 'livraison', 'Livraison Café Hinoki (utilitaire)', app.local_ts(0, '13:30'), app.local_ts(0, '14:30'), default),
  ('772db3af-3305-4994-9462-74cc6985bd40', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', default, 'reunion', 'Brief préparation du jour', app.local_ts(1, '07:15'), app.local_ts(1, '07:30'), default),
  ('f8e33b62-b05b-4e9c-aad7-4440dbd9b38b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3d39b499-a3b5-41a0-b30d-0a0281e36614', '30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'tournage', 'Session de tournage', app.local_ts(1, '10:00'), app.local_ts(1, '12:00'), default),
  ('52d30f9c-d0af-4912-983a-4b8722a830d8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', default, 'reunion', 'Brief préparation du jour', app.local_ts(2, '07:15'), app.local_ts(2, '07:30'), default),
  ('51c13234-b2d5-4a32-9784-b8a65abda8ad', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', '30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'tournage', 'Session de tournage', app.local_ts(2, '10:00'), app.local_ts(2, '12:00'), default),
  ('f392c41f-d94c-4fcb-9b4b-88081555b408', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', default, 'reunion', 'Brief préparation du jour', app.local_ts(3, '07:15'), app.local_ts(3, '07:30'), default),
  ('394609b8-d0f5-490a-98cf-034ba4f01fca', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3d39b499-a3b5-41a0-b30d-0a0281e36614', '30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'tournage', 'Session de tournage', app.local_ts(3, '10:00'), app.local_ts(3, '12:00'), default),
  ('0be5be2b-684c-4f42-b706-a9658a093173', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', default, 'reunion', 'Brief préparation du jour', app.local_ts(4, '07:15'), app.local_ts(4, '07:30'), default),
  ('c8d9f14e-fca2-4f0d-a29e-e67c4837fd1a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', '30ccd44d-e17a-48fc-aff0-6a636f0fa258', 'tournage', 'Session de tournage', app.local_ts(4, '10:00'), app.local_ts(4, '12:00'), default);

insert into public.asset_bookings (org_id, asset_id, employee_id, title, starts_at, ends_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4cfdc325-c571-4df7-8c11-c5a7f5a9324f', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', 'Livraison Café Hinoki', app.local_ts(0, '13:30'), app.local_ts(0, '14:30')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2a9d6391-39cb-4b55-be4c-83a67d723e82', '684f1aef-fe42-4a07-a090-caabf27681bb', 'Tournée échantillons Paris 3e/4e', app.local_ts(1, '10:00'), app.local_ts(1, '13:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '523265ec-0494-4702-9890-e886605c5e86', '8450f908-aefc-44e1-9c57-809a590462f3', 'Point lancement Discovery Box', app.local_ts(0, '14:00'), app.local_ts(0, '15:00'));

insert into public.leave_requests (org_id, employee_id, type, starts_on, ends_on, days, status, approver_id, decided_at, comment) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7529eaf4-427a-4a7a-8acb-10c82103f435', 'conges', app.local_date(-2), app.local_date(3), 4, 'approved', '8450f908-aefc-44e1-9c57-809a590462f3', app.local_ts(-20, '10:12'), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '684f1aef-fe42-4a07-a090-caabf27681bb', 'conges', app.local_date(21), app.local_date(25), 5, 'pending', default, default, 'Vacances de la Toussaint'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', 'rtt', app.local_date(9), app.local_date(9), 1, 'pending', default, default, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'conges', app.local_date(14), app.local_date(15), 2, 'pending', default, default, 'Déménagement'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '07244853-26b8-4246-bca2-88eb372772a5', 'conges', app.local_date(-40), app.local_date(-33), 6, 'approved', '8450f908-aefc-44e1-9c57-809a590462f3', app.local_ts(-70, '09:00'), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', 'formation', app.local_date(-12), app.local_date(-12), 1, 'approved', '4197e349-3a73-4c60-af89-f528a198e011', app.local_ts(-30, '14:00'), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6d146678-5d87-4c3f-94b8-7d5ae9453b9d', 'maladie', app.local_date(-8), app.local_date(-7), 2, 'approved', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', app.local_ts(-8, '08:30'), default);

insert into public.catalog_items (id, org_id, sku, name, unit, unit_price, unit_cost, vat_rate) values
  ('954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'DB30', 'Daily Box — 30 sticks × 2 g', 'boîte', 25.5, 14.2, 0.055),
  ('89b17144-958d-4821-8e79-0d522b04e28f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'DB10', 'Discovery Box — 10 sticks × 2 g', 'boîte', 10.2, 5.4, 0.055),
  ('4aee711f-cb26-4d28-bdaa-e5580475c48e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'DB60', 'Value Box — 60 sticks × 2 g', 'boîte', 49, 27.1, 0.055),
  ('3ae3d2c9-70e9-4aff-ab5f-60503d422f1d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'VR250', 'Matcha cérémonie — vrac 250 g', 'sachet', 62, 34, 0.055),
  ('29a518c5-19ac-45cb-acda-58c8a944dd82', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'VR1K', 'Matcha barista — vrac 1 kg', 'sachet', 118, 61, 0.055),
  ('dc4f7459-ac01-4744-936e-61e897620690', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'VERRE', 'Verre MATOCHA', 'pièce', 9.9, 3.1, 0.2),
  ('3ef36525-b4e6-4b1c-8e3e-9bd942b12963', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'FOUET', 'Fouet électrique', 'pièce', 14.9, 5.8, 0.2),
  ('f950033f-56ca-442a-ae35-8a64961a8351', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'COFFRET', 'Coffret cadeau (Daily Box + verre + fouet)', 'coffret', 52, 25.4, 0.2),
  ('660f375c-14b3-47d3-a0ac-a37d1ef64d5c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'PLV', 'Présentoir comptoir', 'pièce', 35, 12, 0.2),
  ('992777eb-7aa2-4f8e-a09c-cbf6a491483a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'FORM', 'Formation barista matcha (2 h)', 'session', 180, 60, 0.2),
  ('5b5a9fa6-2390-4d2a-9624-23372928562e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'PORT', 'Livraison palette', 'forfait', 45, 38, 0.2);

insert into public.clients (id, org_id, kind, segment, name, email, phone, city, language, preferred_channel, owner_id, satisfaction, last_contact_at, internal_note) values
  ('94b65127-0743-4653-adb2-e03ea5cbe445', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Café', 'Café Hinoki', 'contact@cafehinoki.example', '+33 1 40 10 20 30', 'Paris 11e', 'fr', 'telephone', '00a93219-9541-4aaf-a937-4f10626b787b', 5, app.local_ts(-2, '10:00'), null),
  ('fefc675c-0584-4c08-af0a-b0f89f283f56', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Hôtel', 'Hôtel des Tilleuls', 'contact@hoteldestilleuls.example', '+33 1 41 13 22 31', 'Paris 6e', 'fr', 'email', '54372e8d-a51b-4a16-b51d-7ee323109ad8', 4, app.local_ts(-1, '10:00'), null),
  ('134f7a81-56d2-456a-9dec-f594e6b49081', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Concept store', 'Maison Kōen', 'contact@maisonkoen.example', '+33 1 42 16 24 32', 'Lyon 2e', 'fr', 'email', '684f1aef-fe42-4a07-a090-caabf27681bb', 5, app.local_ts(-6, '10:00'), null),
  ('ff9babee-e7bd-4c08-a345-79648d7aadb1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Bien-être', 'Studio Pilates Ondine', 'contact@studiopilatesondine.example', '+33 1 43 19 26 33', 'Paris 17e', 'fr', 'telephone', '00a93219-9541-4aaf-a937-4f10626b787b', 4, app.local_ts(-12, '10:00'), null),
  ('191dc1cb-584d-4b40-aa23-ffbf57d06080', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Café torréfacteur', 'La Brûlerie du Canal', 'contact@labrulerieducanal.example', '+33 1 44 22 28 34', 'Paris 10e', 'fr', 'email', '684f1aef-fe42-4a07-a090-caabf27681bb', 3, app.local_ts(-34, '10:00'), 'Sensible au prix ; préfère les commandes groupées en début de mois.'),
  ('bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Hôtel', 'Hôtel Belvédère', 'contact@hotelbelvedere.example', '+33 1 45 25 30 35', 'Annecy', 'fr', 'email', '54372e8d-a51b-4a16-b51d-7ee323109ad8', 4, app.local_ts(-9, '10:00'), null),
  ('7ca02feb-f82e-4e38-b939-c87e00416d7e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Épicerie fine', 'Atelier Sève', 'contact@atelierseve.example', '+33 1 46 28 32 36', 'Bordeaux', 'fr', 'telephone', '684f1aef-fe42-4a07-a090-caabf27681bb', 5, app.local_ts(-18, '10:00'), null),
  ('5298333f-f85d-4c01-ab7a-c5a82d66ccc5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Cadeaux d''entreprise', 'Altaïr Conseil', 'contact@altairconseil.example', '+33 1 47 31 34 37', 'La Défense', 'fr', 'email', '54372e8d-a51b-4a16-b51d-7ee323109ad8', null, app.local_ts(-3, '10:00'), null),
  ('a7a9fea8-04a5-4842-ae7e-cb059b38d1eb', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Salon de thé', 'Kissa Mori', 'contact@kissamori.example', '+33 1 48 34 36 38', 'Paris 3e', 'fr', 'email', '00a93219-9541-4aaf-a937-4f10626b787b', 5, app.local_ts(-1, '10:00'), null),
  ('7d288bff-b5a0-46ae-a53e-db12e29a8279', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Coffee shops (3 adresses)', 'Le Comptoir Zen', 'contact@lecomptoirzen.example', '+33 1 49 37 38 39', 'Lille', 'fr', 'telephone', '54372e8d-a51b-4a16-b51d-7ee323109ad8', 4, app.local_ts(-5, '10:00'), null),
  ('407cdb1b-ff2f-4a3a-be88-b43646722e01', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Bien-être', 'Yoga Shala Marais', 'contact@yogashalamarais.example', '+33 1 50 40 40 40', 'Paris 4e', 'en', 'email', '684f1aef-fe42-4a07-a090-caabf27681bb', null, app.local_ts(-41, '10:00'), null),
  ('4eabdaea-c8ce-4b37-9a01-4d9e57da8e0c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'entreprise', 'Cadeaux d''entreprise', 'Verlaine & Associés', 'contact@verlaineassocies.example', '+33 1 51 43 42 41', 'Paris 8e', 'fr', 'email', '00a93219-9541-4aaf-a937-4f10626b787b', 4, app.local_ts(-22, '10:00'), null),
  ('601aa767-027b-44e9-a117-69febabcd843', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'particulier', 'Abonnée fidèle', 'Inès Valadier', 'contact@inesvaladier.example', '+33 1 52 46 44 42', 'Nantes', 'fr', 'telephone', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', 5, app.local_ts(-15, '10:00'), null),
  ('a0ead974-0774-4222-b15b-eb20de32cdc6', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'particulier', 'Abonné (UK)', 'Mark Ellison', 'contact@markellison.example', '+33 1 53 49 46 43', 'Londres', 'en', 'email', '1a5069b7-38ae-4145-8a6c-3224105b9282', 4, app.local_ts(-60, '10:00'), null);

insert into public.contacts (org_id, client_id, full_name, role, email, language, is_primary) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '94b65127-0743-4653-adb2-e03ea5cbe445', 'Mathilde Aubry', 'Gérante', 'mathilde@cafehinoki.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fefc675c-0584-4c08-af0a-b0f89f283f56', 'Pierre-Alain Dussart', 'Directeur F&B', 'pierrealain@hoteldestilleuls.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '134f7a81-56d2-456a-9dec-f594e6b49081', 'Aiko Bernard', 'Acheteuse', 'aiko@maisonkoen.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'ff9babee-e7bd-4c08-a345-79648d7aadb1', 'Ondine Carrel', 'Fondatrice', 'ondine@studiopilatesondine.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '191dc1cb-584d-4b40-aa23-ffbf57d06080', 'Malik Ferrand', 'Associé', 'malik@labrulerieducanal.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', 'Laura Steiner', 'Responsable achats', 'laura@hotelbelvedere.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7ca02feb-f82e-4e38-b939-c87e00416d7e', 'Julie Dorval', 'Gérante', 'julie@atelierseve.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5298333f-f85d-4c01-ab7a-c5a82d66ccc5', 'Benoît Schaller', 'Office manager', 'benoit@altairconseil.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'a7a9fea8-04a5-4842-ae7e-cb059b38d1eb', 'Yuna Leclerc', 'Cheffe barista', 'yuna@kissamori.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7d288bff-b5a0-46ae-a53e-db12e29a8279', 'Thomas Delvaux', 'Directeur des opérations', 'thomas@lecomptoirzen.example', 'fr', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '407cdb1b-ff2f-4a3a-be88-b43646722e01', 'Priya Morin', 'Gérante', 'priya@yogashalamarais.example', 'en', true),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4eabdaea-c8ce-4b37-9a01-4d9e57da8e0c', 'Agnès Roche', 'Assistante de direction', 'agnes@verlaineassocies.example', 'fr', true);

insert into public.deals (id, org_id, client_id, title, stage, value, probability, owner_id, expected_close_on, source) values
  ('bdbd4179-fbf7-4127-8a1a-e6490b91d13b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', 'Carte hiver — matcha latte au bar', 'chaud', 6800, 0.7, '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(10), 'Salon'),
  ('432226f7-8630-47cc-b9dd-e74a3c6435bd', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5298333f-f85d-4c01-ab7a-c5a82d66ccc5', 'Coffrets de fin d''année (220 collaborateurs)', 'chaud', 11440, 0.6, '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(20), 'Recommandation'),
  ('344a4c21-b272-4d7d-824f-380d4bd4fc9c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7d288bff-b5a0-46ae-a53e-db12e29a8279', 'Référencement 3 coffee shops', 'tiede', 9200, 0.4, '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(30), 'Formulaire web'),
  ('2f37efe4-8150-40b3-a71e-a11a2b929533', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '407cdb1b-ff2f-4a3a-be88-b43646722e01', 'Vente au comptoir + ateliers', 'froid', 1800, 0.15, '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(45), 'Recommandation'),
  ('1426cd6e-2188-4df1-b6af-bf0c5d2a492d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4eabdaea-c8ce-4b37-9a01-4d9e57da8e0c', 'Cadeaux clients 2027', 'tiede', 4200, 0.35, '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(40), 'Formulaire web'),
  ('608b0933-5bd5-4398-9287-1df2e62f6db4', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '134f7a81-56d2-456a-9dec-f594e6b49081', 'Corner retail Discovery Box', 'gagne', 3100, 1, '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(-6), 'Salon'),
  ('977728fc-f3c8-4f69-a94f-2e7cdc1fc6ea', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '191dc1cb-584d-4b40-aa23-ffbf57d06080', 'Passage au vrac barista 1 kg', 'perdu', 2400, 0, '684f1aef-fe42-4a07-a090-caabf27681bb', app.local_date(-12), 'Formulaire web'),
  ('86205355-b44c-4c55-907f-8311b6b20534', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fefc675c-0584-4c08-af0a-b0f89f283f56', 'Réassort trimestriel', 'gagne', 2950, 1, '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(0), 'Salon');

insert into public.quotes (id, org_id, number, client_id, deal_id, status, issued_on, valid_until, discount_pct, total_ht, total_vat, total_ttc, sent_at, opened_at, accepted_at, owner_id) values
  ('69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0141', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', 'bdbd4179-fbf7-4127-8a1a-e6490b91d13b', 'opened', app.local_date(-4), app.local_date(26), 0, 2383.2, 226.08, 2609.28, app.local_ts(-4, '11:20'), app.local_ts(-3, '09:05'), null, '54372e8d-a51b-4a16-b51d-7ee323109ad8'),
  ('877ef1f4-1446-4a6e-9d29-ce5c8576f540', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0142', '5298333f-f85d-4c01-ab7a-c5a82d66ccc5', '432226f7-8630-47cc-b9dd-e74a3c6435bd', 'sent', app.local_date(-2), app.local_date(28), 0.08, 10607.6, 2121.52, 12729.12, app.local_ts(-2, '11:20'), null, null, '54372e8d-a51b-4a16-b51d-7ee323109ad8'),
  ('764848c9-ddb8-494d-81da-482d0fa9362a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0143', '7d288bff-b5a0-46ae-a53e-db12e29a8279', '344a4c21-b272-4d7d-824f-380d4bd4fc9c', 'draft', app.local_date(0), app.local_date(30), 0, 3237, 271.56, 3508.56, null, null, null, '54372e8d-a51b-4a16-b51d-7ee323109ad8'),
  ('85730170-c851-4649-a074-4b09e0dbe8c8', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0139', '4eabdaea-c8ce-4b37-9a01-4d9e57da8e0c', '1426cd6e-2188-4df1-b6af-bf0c5d2a492d', 'sent', app.local_date(-9), app.local_date(21), 0, 4344, 691.32, 5035.32, app.local_ts(-9, '11:20'), null, null, '00a93219-9541-4aaf-a937-4f10626b787b'),
  ('c08b6236-0321-47b4-a15c-20cd3deea56b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0137', '407cdb1b-ff2f-4a3a-be88-b43646722e01', null, 'expired', app.local_date(-38), app.local_date(-8), 0, 647, 40.66, 687.66, app.local_ts(-38, '11:20'), null, null, '684f1aef-fe42-4a07-a090-caabf27681bb'),
  ('1a9bc83d-67d8-48ed-9e5a-ddef6f291665', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0135', '191dc1cb-584d-4b40-aa23-ffbf57d06080', '977728fc-f3c8-4f69-a94f-2e7cdc1fc6ea', 'rejected', app.local_date(-15), app.local_date(15), 0, 1180, 64.9, 1244.9, app.local_ts(-15, '11:20'), null, null, '684f1aef-fe42-4a07-a090-caabf27681bb'),
  ('c58eb12d-ee37-472e-8ef3-3be541aae10d', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0144', 'fefc675c-0584-4c08-af0a-b0f89f283f56', '86205355-b44c-4c55-907f-8311b6b20534', 'accepted', app.local_date(-1), app.local_date(29), 0, 2263.6, 158.95, 2422.55, app.local_ts(-1, '11:20'), app.local_ts(0, '09:05'), app.local_ts(0, '08:40'), '54372e8d-a51b-4a16-b51d-7ee323109ad8'),
  ('3238b4c7-6598-4f69-acec-74915f11153b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0138', '134f7a81-56d2-456a-9dec-f594e6b49081', '608b0933-5bd5-4398-9287-1df2e62f6db4', 'accepted', app.local_date(-7), app.local_date(23), 0, 2875, 168.28, 3043.28, app.local_ts(-7, '11:20'), app.local_ts(-6, '09:05'), app.local_ts(-6, '08:40'), '684f1aef-fe42-4a07-a090-caabf27681bb'),
  ('5818b6a5-1fa0-420b-8f6e-8618f80b2d7f', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0140', '94b65127-0743-4653-adb2-e03ea5cbe445', null, 'accepted', app.local_date(-3), app.local_date(27), 0, 982, 54.01, 1036.01, app.local_ts(-3, '11:20'), app.local_ts(-2, '09:05'), app.local_ts(-2, '08:40'), '00a93219-9541-4aaf-a937-4f10626b787b'),
  ('6cf78cfa-8977-4e3e-98dd-9231e15c780c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0136', 'a7a9fea8-04a5-4842-ae7e-cb059b38d1eb', null, 'accepted', app.local_date(-10), app.local_date(20), 0, 800, 70.1, 870.1, app.local_ts(-10, '11:20'), app.local_ts(-9, '09:05'), app.local_ts(-9, '08:40'), '00a93219-9541-4aaf-a937-4f10626b787b'),
  ('d1f9747d-cbec-4fbb-835e-fc0845639fa3', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0133', '7ca02feb-f82e-4e38-b939-c87e00416d7e', null, 'accepted', app.local_date(-16), app.local_date(14), 0, 1526.4, 101.18, 1627.58, app.local_ts(-16, '11:20'), app.local_ts(-15, '09:05'), app.local_ts(-15, '08:40'), '684f1aef-fe42-4a07-a090-caabf27681bb'),
  ('f2d66dc7-1df3-47e6-b5d1-7f92a2b984be', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Q-2026-0131', 'ff9babee-e7bd-4c08-a345-79648d7aadb1', null, 'accepted', app.local_date(-21), app.local_date(9), 0, 701.4, 51.54, 752.94, app.local_ts(-21, '11:20'), app.local_ts(-20, '09:05'), app.local_ts(-20, '08:40'), '00a93219-9541-4aaf-a937-4f10626b787b');

insert into public.quote_lines (org_id, quote_id, catalog_item_id, label, quantity, unit_price, unit_cost, vat_rate, position) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', '29a518c5-19ac-45cb-acda-58c8a944dd82', 'Matcha barista — vrac 1 kg', 6, 118, 61, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 40, 25.5, 14.2, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', 'dc4f7459-ac01-4744-936e-61e897620690', 'Verre MATOCHA', 48, 9.9, 3.1, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', '992777eb-7aa2-4f8e-a09c-cbf6a491483a', 'Formation barista matcha (2 h)', 1, 180, 60, 0.2, 3),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '877ef1f4-1446-4a6e-9d29-ce5c8576f540', 'f950033f-56ca-442a-ae35-8a64961a8351', 'Coffret cadeau (Daily Box + verre + fouet)', 220, 52, 25.4, 0.2, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '877ef1f4-1446-4a6e-9d29-ce5c8576f540', '5b5a9fa6-2390-4d2a-9624-23372928562e', 'Livraison palette', 2, 45, 38, 0.2, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '764848c9-ddb8-494d-81da-482d0fa9362a', '29a518c5-19ac-45cb-acda-58c8a944dd82', 'Matcha barista — vrac 1 kg', 9, 118, 61, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '764848c9-ddb8-494d-81da-482d0fa9362a', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 60, 25.5, 14.2, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '764848c9-ddb8-494d-81da-482d0fa9362a', '660f375c-14b3-47d3-a0ac-a37d1ef64d5c', 'Présentoir comptoir', 3, 35, 12, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '764848c9-ddb8-494d-81da-482d0fa9362a', '992777eb-7aa2-4f8e-a09c-cbf6a491483a', 'Formation barista matcha (2 h)', 3, 180, 60, 0.2, 3),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '85730170-c851-4649-a074-4b09e0dbe8c8', 'f950033f-56ca-442a-ae35-8a64961a8351', 'Coffret cadeau (Daily Box + verre + fouet)', 60, 52, 25.4, 0.2, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '85730170-c851-4649-a074-4b09e0dbe8c8', '89b17144-958d-4821-8e79-0d522b04e28f', 'Discovery Box — 10 sticks × 2 g', 120, 10.2, 5.4, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c08b6236-0321-47b4-a15c-20cd3deea56b', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 12, 25.5, 14.2, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c08b6236-0321-47b4-a15c-20cd3deea56b', '89b17144-958d-4821-8e79-0d522b04e28f', 'Discovery Box — 10 sticks × 2 g', 30, 10.2, 5.4, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c08b6236-0321-47b4-a15c-20cd3deea56b', '660f375c-14b3-47d3-a0ac-a37d1ef64d5c', 'Présentoir comptoir', 1, 35, 12, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '1a9bc83d-67d8-48ed-9e5a-ddef6f291665', '29a518c5-19ac-45cb-acda-58c8a944dd82', 'Matcha barista — vrac 1 kg', 10, 118, 61, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c58eb12d-ee37-472e-8ef3-3be541aae10d', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 60, 25.5, 14.2, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c58eb12d-ee37-472e-8ef3-3be541aae10d', '3ae3d2c9-70e9-4aff-ab5f-60503d422f1d', 'Matcha cérémonie — vrac 250 g', 8, 62, 34, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c58eb12d-ee37-472e-8ef3-3be541aae10d', 'dc4f7459-ac01-4744-936e-61e897620690', 'Verre MATOCHA', 24, 9.9, 3.1, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3238b4c7-6598-4f69-acec-74915f11153b', '89b17144-958d-4821-8e79-0d522b04e28f', 'Discovery Box — 10 sticks × 2 g', 150, 10.2, 5.4, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3238b4c7-6598-4f69-acec-74915f11153b', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 50, 25.5, 14.2, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3238b4c7-6598-4f69-acec-74915f11153b', '660f375c-14b3-47d3-a0ac-a37d1ef64d5c', 'Présentoir comptoir', 2, 35, 12, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5818b6a5-1fa0-420b-8f6e-8618f80b2d7f', '29a518c5-19ac-45cb-acda-58c8a944dd82', 'Matcha barista — vrac 1 kg', 4, 118, 61, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5818b6a5-1fa0-420b-8f6e-8618f80b2d7f', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 20, 25.5, 14.2, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6cf78cfa-8977-4e3e-98dd-9231e15c780c', '3ae3d2c9-70e9-4aff-ab5f-60503d422f1d', 'Matcha cérémonie — vrac 250 g', 10, 62, 34, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '6cf78cfa-8977-4e3e-98dd-9231e15c780c', '992777eb-7aa2-4f8e-a09c-cbf6a491483a', 'Formation barista matcha (2 h)', 1, 180, 60, 0.2, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd1f9747d-cbec-4fbb-835e-fc0845639fa3', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 36, 25.5, 14.2, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd1f9747d-cbec-4fbb-835e-fc0845639fa3', '89b17144-958d-4821-8e79-0d522b04e28f', 'Discovery Box — 10 sticks × 2 g', 48, 10.2, 5.4, 0.055, 1),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd1f9747d-cbec-4fbb-835e-fc0845639fa3', 'dc4f7459-ac01-4744-936e-61e897620690', 'Verre MATOCHA', 12, 9.9, 3.1, 0.2, 2),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f2d66dc7-1df3-47e6-b5d1-7f92a2b984be', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'Daily Box — 30 sticks × 2 g', 24, 25.5, 14.2, 0.055, 0),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f2d66dc7-1df3-47e6-b5d1-7f92a2b984be', '3ef36525-b4e6-4b1c-8e3e-9bd942b12963', 'Fouet électrique', 6, 14.9, 5.8, 0.2, 1);

insert into public.work_orders (id, org_id, site_id, number, client_id, quote_id, title, physical_object, stage, progress, status, blocked_reason, owner_id, zone_id, hours_budget, due_at, received_at, amount_ht, amount_ttc) values
  ('129438d1-c195-4153-80f1-25fd131fb188', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0612', 'fefc675c-0584-4c08-af0a-b0f89f283f56', 'c58eb12d-ee37-472e-8ef3-3be541aae10d', 'Réassort trimestriel', '3 cartons · ~14 kg', 'confirmee', 0.05, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', null, 3, app.local_ts(1, '15:00'), app.local_ts(0, '09:30'), 2263.6, 2422.55),
  ('57900149-6379-469c-9b7d-09fdb6ad5c7b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0611', '7d288bff-b5a0-46ae-a53e-db12e29a8279', null, 'Échantillons 3 coffee shops', '1 carton · 2 kg', 'confirmee', 0, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', null, 1, app.local_ts(2, '15:00'), app.local_ts(0, '09:30'), 304, 320.72),
  ('2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0608', '134f7a81-56d2-456a-9dec-f594e6b49081', '3238b4c7-6598-4f69-acec-74915f11153b', 'Corner retail Discovery Box', 'Palette · 6 cartons', 'preparation', 0.55, 'en_cours', null, '601e64df-026e-48e0-8f61-92c62f5c4bd6', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 4, app.local_ts(0, '15:00'), app.local_ts(-2, '09:30'), 2875, 3043.28),
  ('5be750a2-ce65-4499-85d2-a54ad7198708', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0609', '7ca02feb-f82e-4e38-b939-c87e00416d7e', null, 'Réassort épicerie — Daily Box', '4 cartons', 'preparation', 0.3, 'attente', 'Cartons S en rupture — livraison fournisseur demain 9 h', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'e9ec2a66-c1d7-4498-99cd-885b12bf68c8', 2, app.local_ts(0, '15:00'), app.local_ts(-1, '09:30'), 555, 585.53),
  ('257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0607', '94b65127-0743-4653-adb2-e03ea5cbe445', '5818b6a5-1fa0-420b-8f6e-8618f80b2d7f', 'Vrac barista + Daily Box', '2 cartons · 9,6 kg', 'controle', 0.7, 'en_cours', null, 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', '21e17cbe-91d9-41a2-89f9-b35a4f4ecef1', 2.5, app.local_ts(0, '13:30'), app.local_ts(-3, '09:30'), 982, 1036.01),
  ('31a26bba-eee7-48ac-b244-96ff647edf51', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0605', 'a7a9fea8-04a5-4842-ae7e-cb059b38d1eb', '6cf78cfa-8977-4e3e-98dd-9231e15c780c', 'Vrac cérémonie + formation', '1 carton · 3 kg', 'expedition', 0.85, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'f18ad8e6-4aa3-4f31-99a7-71e37a84aadf', 1.5, app.local_ts(0, '15:00'), app.local_ts(-6, '09:30'), 800, 870.1),
  ('e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0604', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', null, 'Échantillons carte hiver', '1 colis · 1,2 kg', 'expedition', 0.9, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'f18ad8e6-4aa3-4f31-99a7-71e37a84aadf', 0.5, app.local_ts(0, '15:00'), app.local_ts(-2, '09:30'), 723, 762.77),
  ('c2262234-8968-4086-b421-caf3035d575a', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0601', '7ca02feb-f82e-4e38-b939-c87e00416d7e', 'd1f9747d-cbec-4fbb-835e-fc0845639fa3', 'Commande d''ouverture', '3 cartons', 'livree', 0.95, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', null, 2.5, app.local_ts(-10, '15:00'), app.local_ts(-14, '09:30'), 1526.4, 1627.58),
  ('feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0598', 'ff9babee-e7bd-4c08-a345-79648d7aadb1', 'f2d66dc7-1df3-47e6-b5d1-7f92a2b984be', 'Daily Box + fouets', '2 cartons', 'livree', 0.95, 'en_cours', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', null, 1.5, app.local_ts(-16, '15:00'), app.local_ts(-19, '09:30'), 701.4, 752.94),
  ('81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e1291a1a-3def-4ad8-8bf0-04c624dbbc0a', 'CP-24-0590', 'fefc675c-0584-4c08-af0a-b0f89f283f56', null, 'Réassort mensuel', '3 cartons', 'facturee', 1, 'termine', null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', null, 3, app.local_ts(-28, '15:00'), app.local_ts(-31, '09:30'), 370, 390.35);

insert into public.work_order_stages (org_id, work_order_id, stage, entered_at, left_at, actor_id) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '129438d1-c195-4153-80f1-25fd131fb188', 'confirmee', app.local_ts(0, '09:30'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '57900149-6379-469c-9b7d-09fdb6ad5c7b', 'confirmee', app.local_ts(0, '09:30'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', 'confirmee', app.local_ts(-2, '09:30'), app.local_ts(-1, '08:50'), '601e64df-026e-48e0-8f61-92c62f5c4bd6'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', 'preparation', app.local_ts(-1, '08:50'), null, '601e64df-026e-48e0-8f61-92c62f5c4bd6'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5be750a2-ce65-4499-85d2-a54ad7198708', 'confirmee', app.local_ts(-1, '09:30'), app.local_ts(0, '08:50'), 'c72b2403-bb4a-4b94-9f4a-052810718b0f'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5be750a2-ce65-4499-85d2-a54ad7198708', 'preparation', app.local_ts(0, '08:50'), null, 'c72b2403-bb4a-4b94-9f4a-052810718b0f'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'confirmee', app.local_ts(-3, '09:30'), app.local_ts(-2, '08:50'), 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'preparation', app.local_ts(-2, '08:50'), app.local_ts(-1, '09:40'), 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'controle', app.local_ts(-1, '09:40'), null, 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31a26bba-eee7-48ac-b244-96ff647edf51', 'confirmee', app.local_ts(-6, '09:30'), app.local_ts(-5, '08:50'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31a26bba-eee7-48ac-b244-96ff647edf51', 'preparation', app.local_ts(-5, '08:50'), app.local_ts(-4, '09:40'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31a26bba-eee7-48ac-b244-96ff647edf51', 'controle', app.local_ts(-4, '09:40'), app.local_ts(-3, '10:30'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31a26bba-eee7-48ac-b244-96ff647edf51', 'expedition', app.local_ts(-3, '10:30'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'confirmee', app.local_ts(-2, '09:30'), app.local_ts(-1, '08:50'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'preparation', app.local_ts(-1, '08:50'), app.local_ts(0, '09:40'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'controle', app.local_ts(0, '09:40'), app.local_ts(0, '10:30'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'expedition', app.local_ts(0, '10:30'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'confirmee', app.local_ts(-14, '09:30'), app.local_ts(-13, '08:50'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'preparation', app.local_ts(-13, '08:50'), app.local_ts(-12, '09:40'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'controle', app.local_ts(-12, '09:40'), app.local_ts(-11, '10:30'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'expedition', app.local_ts(-11, '10:30'), app.local_ts(-10, '11:20'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'livree', app.local_ts(-10, '11:20'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'confirmee', app.local_ts(-19, '09:30'), app.local_ts(-18, '08:50'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'preparation', app.local_ts(-18, '08:50'), app.local_ts(-17, '09:40'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'controle', app.local_ts(-17, '09:40'), app.local_ts(-16, '10:30'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'expedition', app.local_ts(-16, '10:30'), app.local_ts(-15, '11:20'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'livree', app.local_ts(-15, '11:20'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'confirmee', app.local_ts(-31, '09:30'), app.local_ts(-30, '08:50'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'preparation', app.local_ts(-30, '08:50'), app.local_ts(-29, '09:40'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'controle', app.local_ts(-29, '09:40'), app.local_ts(-28, '10:30'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'expedition', app.local_ts(-28, '10:30'), app.local_ts(-27, '11:20'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'livree', app.local_ts(-27, '11:20'), app.local_ts(-26, '12:10'), '2d5fddf7-d60a-4061-8aca-bedc0ccb6849'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'facturee', app.local_ts(-26, '12:10'), null, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849');

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '129438d1-c195-4153-80f1-25fd131fb188', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":false,"done_at":null,"progress":5},{"label":"Picking et vérification des lots","done":false,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":false,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '57900149-6379-469c-9b7d-09fdb6ad5c7b', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":false,"done_at":null,"progress":0},{"label":"Picking et vérification des lots","done":false,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":false,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":false,"done_at":null,"progress":55},{"label":"Pesée et photo du colis","done":false,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5be750a2-ce65-4499-85d2-a54ad7198708', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":false,"done_at":null,"progress":30},{"label":"Pesée et photo du colis","done":false,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":false,"done_at":null,"progress":70},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '31a26bba-eee7-48ac-b244-96ff647edf51', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":true,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":85},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":true,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":false,"done_at":null,"progress":90},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":null}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c2262234-8968-4086-b421-caf3035d575a', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":true,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":true,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":95}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":true,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":true,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":false,"done_at":null,"progress":95}]'::jsonb);

insert into public.checklists (org_id, work_order_id, title, items) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', 'Contrôle de la commande', '[{"label":"Réserver le stock (FEFO)","done":true,"done_at":null,"progress":null},{"label":"Picking et vérification des lots","done":true,"done_at":null,"progress":null},{"label":"Pesée et photo du colis","done":true,"done_at":null,"progress":null},{"label":"Étiquette transporteur","done":true,"done_at":null,"progress":null},{"label":"Preuve de livraison","done":true,"done_at":null,"progress":null}]'::jsonb);

insert into public.tasks (org_id, work_order_id, title, status, progress, assignee_id, due_on) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5be750a2-ce65-4499-85d2-a54ad7198708', 'Relancer le fournisseur de cartons S', 'doing', 0.5, '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', app.local_date(0)),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'Joindre le certificat d''analyse du lot', 'todo', default, 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', app.local_date(0)),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', 'Ajouter 2 présentoirs au colis', 'done', 1, '601e64df-026e-48e0-8f61-92c62f5c4bd6', app.local_date(0)),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '129438d1-c195-4153-80f1-25fd131fb188', 'Confirmer le créneau de livraison hôtel', 'todo', default, '00a93219-9541-4aaf-a937-4f10626b787b', app.local_date(1));

insert into public.time_entries (org_id, employee_id, work_order_id, worked_on, hours, billable, note) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '601e64df-026e-48e0-8f61-92c62f5c4bd6', '2e66b245-9818-4c87-8d94-4ed8d9d9a3d1', app.local_date(-1), 1.25, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', '5be750a2-ce65-4499-85d2-a54ad7198708', app.local_date(0), 0.5, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', app.local_date(-2), 1.25, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', '31a26bba-eee7-48ac-b244-96ff647edf51', app.local_date(-5), 1.5, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'e0e7fea4-3ffa-42c3-a0bd-16512168f044', app.local_date(-1), 0.5, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'c2262234-8968-4086-b421-caf3035d575a', app.local_date(-13), 1.25, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', app.local_date(-18), 1.25, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', app.local_date(-30), 1.75, false, 'Préparation'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', '31a26bba-eee7-48ac-b244-96ff647edf51', app.local_date(-1), 2, true, 'Formation barista Kissa Mori');

-- Commandes en ligne des particuliers : 30 jours d'historique (+ jour en cours jusqu'à « maintenant »)
create temporary table _names (k int, first text, last text, city text);
insert into _names values
 (0,'Alice','Martin','Paris'),(1,'Baptiste','Durand','Lyon'),(2,'Clara','Petit','Marseille'),(3,'Diane','Leroy','Toulouse'),
 (4,'Elias','Moreau','Nantes'),(5,'Fanny','Simon','Bordeaux'),(6,'Gabriel','Laurent','Lille'),(7,'Hana','Michel','Paris'),
 (8,'Ilyes','Garcia','Montpellier'),(9,'Jeanne','David','Rennes'),(10,'Kevin','Bertrand','Strasbourg'),(11,'Léa','Roux','Paris'),
 (12,'Mehdi','Vincent','Nice'),(13,'Noémie','Fournier','Grenoble'),(14,'Oscar','Morel','Paris'),(15,'Pauline','Girard','Lyon'),
 (16,'Quentin','André','Dijon'),(17,'Rose','Mercier','Angers'),(18,'Samuel','Dupont','Paris'),(19,'Taïna','Lambert','Brest'),
 (20,'Ugo','Bonnet','Annecy'),(21,'Victoire','François','Paris'),(22,'Wassim','Martinez','Reims'),(23,'Yasmine','Legrand','Tours');

with days as (
  select d, app.local_ts(-d, '00:00') as d0,
         -- volume : croissance douce, creux le week-end, bruit stable
         greatest(40, round((128 + (30 - d) * 0.9) * case when extract(isodow from app.local_date(-d)) >= 6 then 0.72 else 1 end
                            + (abs(hashtext('vol' || d)) % 30) - 15))::int as n
  from generate_series(1, 30) d
), orders as (
  select d, i,
         d0 + make_interval(secs => (abs(hashtext('t' || d || '-' || i)) % 86400)) as ordered_at,
         abs(hashtext('b' || d || '-' || i)) % 100 as basket,
         abs(hashtext('c' || d || '-' || i)) % 24 as who
  from days, generate_series(1, n) i
), priced as (
  select *, case when basket < 52 then 39.90 when basket < 70 then 14.90 when basket < 82 then 74.90
                 when basket < 94 then 35.91 else 54.80 end as ttc,
            case when basket < 82 then 1 when basket < 94 then 1 else 2 end as items,
            case when basket between 82 and 93 then 'abonnement' else 'boutique' end as channel
  from orders
)
insert into public.shop_orders (org_id, number, channel, customer_name, city, items, total_ht, total_ttc, status, pack_station, ordered_at, packed_at, shipped_at, ship_deadline)
select 'af42ec17-371d-4e1a-91bd-e0c06be6ab01',
       'W' || to_char(ordered_at at time zone 'Europe/Paris', 'YYMMDD') || '-' || lpad(i::text, 4, '0'),
       channel, n.first || ' ' || left(n.last, 1) || '.', n.city, items,
       round(ttc / 1.055, 2), ttc,
       case when d >= 3 then 'livree' else 'expediee' end,
       1 + (abs(hashtext('s' || d || '-' || i)) % 4),
       ordered_at,
       dl - interval '50 minutes',
       case when abs(hashtext('late' || d || '-' || i)) % 100 < 4 then dl + interval '1 day' else dl - interval '20 minutes' end,
       dl
from priced
join _names n on n.k = priced.who
cross join lateral (
  -- commande avant 13 h : expédiée à l'enlèvement de 15 h le jour même, sinon le lendemain
  select case when (ordered_at at time zone 'Europe/Paris')::time < '13:00'
              then app.local_ts(-d, '15:00') else app.local_ts(-d + 1, '15:00') end as dl
) x;

-- Jour en cours : volume au prorata de l'heure, aucune commande dans le futur
with b as (select app.local_ts(0, '00:00') as d0, now() as t1),
     n as (select greatest(3, round(165 * extract(epoch from (t1 - d0)) / 86400.0))::int as n from b),
     orders as (
       select i, b.d0 + (b.t1 - b.d0) * ((abs(hashtext('today-' || i)) % 10000) / 10000.0) as ordered_at,
              abs(hashtext('tb' || i)) % 100 as basket, abs(hashtext('tc' || i)) % 24 as who
       from b, n, generate_series(1, n.n) i)
insert into public.shop_orders (org_id, number, channel, customer_name, city, items, total_ht, total_ttc, status, pack_station, ordered_at, packed_at, ship_deadline)
select 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'W' || to_char(now() at time zone 'Europe/Paris', 'YYMMDD') || '-' || lpad(i::text, 4, '0'),
       case when basket between 82 and 93 then 'abonnement' else 'boutique' end,
       nm.first || ' ' || left(nm.last, 1) || '.', nm.city,
       case when basket >= 94 then 2 else 1 end,
       round(p.ttc / 1.055, 2), p.ttc,
       case when ordered_at < now() - interval '3 hours' then 'emballee'
            when ordered_at < now() - interval '1 hour' then 'preparation' else 'payee' end,
       1 + (abs(hashtext('ts' || i)) % 4), ordered_at,
       case when ordered_at < now() - interval '3 hours' then ordered_at + interval '2 hours' end,
       case when (ordered_at at time zone 'Europe/Paris')::time < '13:00' then app.local_ts(0, '15:00') else app.local_ts(1, '15:00') end
from orders
join _names nm on nm.k = orders.who
cross join lateral (select case when basket < 52 then 39.90 when basket < 70 then 14.90 when basket < 82 then 74.90
                                 when basket < 94 then 35.91 else 54.80 end as ttc) p;
drop table _names;

insert into public.suppliers (id, org_id, name, country, category, email, lead_time_days) values
  ('a5708f41-8532-4250-a8e2-31040f72e5d0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Chaen Midori (fictif)', 'JP', 'Matcha', 'commandes@chaenmidorifictif.example', 45),
  ('c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Cartonnages du Val (fictif)', 'FR', 'Emballages', 'commandes@cartonnagesduvalfictif.example', 5),
  ('b05d46f2-7f05-417f-80bc-16cc1c7c15df', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Verrerie Lumen (fictif)', 'FR', 'Verres', 'commandes@verrerielumenfictif.example', 21),
  ('fe4070b1-207f-4a6f-bc9d-c32b50796bc1', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Atelier Fouets & Co (fictif)', 'PT', 'Accessoires', 'commandes@atelierfouetscofictif.example', 18),
  ('14cbf397-36db-4c70-bc40-593be0817c57', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Imprimerie Clairval (fictif)', 'FR', 'Cartes et stickers', 'commandes@imprimerieclairvalfictif.example', 7);

insert into public.stock_items (id, org_id, catalog_item_id, supplier_id, reference, name, category, quantity, min_quantity, location, zone_id, unit_cost, on_order) values
  ('4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '954e7396-2d75-4ee8-8bcf-fc2046dc8a96', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-DB30', 'Daily Box 30 × 2 g', 'Produit fini', 1840, 600, 'A-01', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 14.2, false),
  ('5182d40d-fa81-4c0d-8185-514ddec95495', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '89b17144-958d-4821-8e79-0d522b04e28f', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-DB10', 'Discovery Box 10 × 2 g', 'Produit fini', 160, 300, 'A-02', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 5.4, false),
  ('463cee85-02be-48b8-926e-c39c0f35ac23', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4aee711f-cb26-4d28-bdaa-e5580475c48e', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-DB60', 'Value Box 60 × 2 g', 'Produit fini', 420, 150, 'A-03', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 27.1, false),
  ('8b976842-9c87-4924-a518-c92cc00d54ff', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3ae3d2c9-70e9-4aff-ab5f-60503d422f1d', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-VR250', 'Matcha cérémonie vrac 250 g', 'Produit fini', 64, 30, 'A-04', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 34, false),
  ('8743b396-3a2e-4194-9964-b754e5200ad6', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '29a518c5-19ac-45cb-acda-58c8a944dd82', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-VR1K', 'Matcha barista vrac 1 kg', 'Produit fini', 22, 10, 'A-05', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 61, false),
  ('65490877-c834-4d15-97a7-457b792a16b0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'MT-STK', 'Sticks 2 g (vrac pour coffrets)', 'Semi-fini', 5200, 2000, 'B-01', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 0.42, false),
  ('bd3302b7-58b6-418f-b035-d49d4492c695', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dc4f7459-ac01-4744-936e-61e897620690', 'b05d46f2-7f05-417f-80bc-16cc1c7c15df', 'ACC-VERRE', 'Verre MATOCHA', 'Accessoire', 380, 150, 'B-02', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 3.1, false),
  ('101c7092-f4fd-426b-9d92-830a04a4a655', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3ef36525-b4e6-4b1c-8e3e-9bd942b12963', 'fe4070b1-207f-4a6f-bc9d-c32b50796bc1', 'ACC-FOUET', 'Fouet électrique', 'Accessoire', 45, 80, 'B-03', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 5.8, true),
  ('5dc0e638-d562-4ef1-8168-8a23a6db0373', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'ACC-COFFRET', 'Coffret cadeau (vide)', 'Accessoire', 120, 60, 'B-04', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 4.2, false),
  ('f68b5b9b-caa9-4622-a31c-84033e304b3b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'EMB-CART-S', 'Carton d''expédition S', 'Emballage', 310, 400, 'C-01', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 0.38, false),
  ('6ea67a29-ffac-4805-aada-0af3834f8d95', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'EMB-CART-M', 'Carton d''expédition M', 'Emballage', 900, 300, 'C-02', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 0.52, false),
  ('0439b0e0-d66f-4b3b-b97a-eda0e132c17e', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'EMB-CALAGE', 'Calage papier (rouleau)', 'Emballage', 18, 6, 'C-03', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 21, false),
  ('bb641604-a0fb-4d4e-85f6-937cdd8e2567', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, '14cbf397-36db-4c70-bc40-593be0817c57', 'EMB-CARTE', 'Carte manuscrite', 'Emballage', 2400, 500, 'C-04', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 0.09, false),
  ('c1555090-bf94-4f32-879b-8779803cda55', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, '14cbf397-36db-4c70-bc40-593be0817c57', 'EMB-STICKER', 'Sticker verre MATOCHA', 'Emballage', 3100, 800, 'D-01', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 0.04, false),
  ('2db0e4b5-04c6-4b5f-bf3d-bf9328f31ce5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', null, '14cbf397-36db-4c70-bc40-593be0817c57', 'EMB-ETIQ', 'Étiquettes transporteur (rouleau)', 'Emballage', 14, 8, 'D-02', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 11.5, false),
  ('2cb84041-dcfc-40ce-9c0e-c3698e3a0cd2', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '660f375c-14b3-47d3-a0ac-a37d1ef64d5c', 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'PLV-PRES', 'Présentoir comptoir', 'PLV', 34, 10, 'D-03', 'c11707ce-11b8-4237-99a8-0614dfb2e6f9', 12, false);

insert into public.lots (id, org_id, stock_item_id, supplier_id, number, quantity, received_at, best_before, status, coa_ok, retained_samples) values
  ('dd4e7b96-c007-4c9c-84c5-fc62a2d9a2af', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-05A', 0, app.local_ts(-150, '10:15'), app.local_date(300), 'epuise', true, 3),
  ('ca0561ec-890e-4de0-af8d-b79cdc2f34b6', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-07A', 1240, app.local_ts(-88, '10:15'), app.local_date(430), 'libere', true, 3),
  ('f17baf34-1d48-430e-b764-b8e65216c5c0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-09B', 600, app.local_ts(-27, '10:15'), app.local_date(495), 'libere', true, 3),
  ('6aaa14d6-c11c-427c-b37d-7928ca90c0bf', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5182d40d-fa81-4c0d-8185-514ddec95495', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-09C', 160, app.local_ts(-27, '10:15'), app.local_date(495), 'libere', true, 3),
  ('4e198395-cfed-4e1a-a0a9-e8a68190a669', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '8743b396-3a2e-4194-9964-b754e5200ad6', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-08V', 22, app.local_ts(-60, '10:15'), app.local_date(300), 'libere', true, 2),
  ('fb7a901d-6001-452b-be85-c8c684f0f1a2', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'L2026-10C', 2400, null, app.local_date(540), 'attendu', null, 0);

insert into public.stock_movements (org_id, stock_item_id, lot_id, kind, quantity, reason, at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'ca0561ec-890e-4de0-af8d-b79cdc2f34b6', 'sortie', 95, 'Commandes du jour', app.local_ts(-29, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'ca0561ec-890e-4de0-af8d-b79cdc2f34b6', 'sortie', 63, 'Commandes du jour', app.local_ts(-28, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 67, 'Commandes du jour', app.local_ts(-27, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 201, 'Consommation expédition', app.local_ts(-27, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 68, 'Commandes du jour', app.local_ts(-26, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 74, 'Commandes du jour', app.local_ts(-25, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 74, 'Commandes du jour', app.local_ts(-24, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 214, 'Consommation expédition', app.local_ts(-24, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 84, 'Commandes du jour', app.local_ts(-23, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 79, 'Commandes du jour', app.local_ts(-22, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 80, 'Commandes du jour', app.local_ts(-21, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 210, 'Consommation expédition', app.local_ts(-21, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 83, 'Commandes du jour', app.local_ts(-20, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 72, 'Commandes du jour', app.local_ts(-19, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 75, 'Commandes du jour', app.local_ts(-18, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 179, 'Consommation expédition', app.local_ts(-18, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 72, 'Commandes du jour', app.local_ts(-17, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 76, 'Commandes du jour', app.local_ts(-16, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 75, 'Commandes du jour', app.local_ts(-15, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 170, 'Consommation expédition', app.local_ts(-15, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 80, 'Commandes du jour', app.local_ts(-14, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 73, 'Commandes du jour', app.local_ts(-13, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 84, 'Commandes du jour', app.local_ts(-12, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 163, 'Consommation expédition', app.local_ts(-12, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 91, 'Commandes du jour', app.local_ts(-11, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 61, 'Commandes du jour', app.local_ts(-10, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 88, 'Commandes du jour', app.local_ts(-9, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 190, 'Consommation expédition', app.local_ts(-9, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 76, 'Commandes du jour', app.local_ts(-8, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 65, 'Commandes du jour', app.local_ts(-7, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 76, 'Commandes du jour', app.local_ts(-6, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 210, 'Consommation expédition', app.local_ts(-6, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 64, 'Commandes du jour', app.local_ts(-5, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 62, 'Commandes du jour', app.local_ts(-4, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 81, 'Commandes du jour', app.local_ts(-3, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'sortie', 171, 'Consommation expédition', app.local_ts(-3, '15:10')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 68, 'Commandes du jour', app.local_ts(-2, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'sortie', 66, 'Commandes du jour', app.local_ts(-1, '15:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'entree', 2400, 'Réception lot L2026-09B', app.local_ts(-27, '10:15')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', default, 'entree', 1500, 'Réception commande cartons', app.local_ts(-12, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '4876cf83-a8c5-4466-96e2-6edf69e49ebb', default, 'inventaire', 1840, 'Inventaire tournant allée A', app.local_ts(-1, '17:30'));

insert into public.purchase_orders (org_id, supplier_id, number, status, lines, total_ht, expected_on, received_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'a5708f41-8532-4250-a8e2-31040f72e5d0', 'PO-2026-031', 'in_transit', '[{"stock_item_id":"4876cf83-a8c5-4466-96e2-6edf69e49ebb","label":"Daily Box 30 × 2 g — lot L2026-10C","quantity":2400,"unit_cost":14.2}]'::jsonb, 34080, app.local_date(0), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fe4070b1-207f-4a6f-bc9d-c32b50796bc1', 'PO-2026-032', 'confirmed', '[{"stock_item_id":"101c7092-f4fd-426b-9d92-830a04a4a655","label":"Fouet électrique","quantity":300,"unit_cost":5.8}]'::jsonb, 1740, app.local_date(6), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c159b5ff-b8d5-4bf1-b063-acab97352bfe', 'PO-2026-033', 'sent', '[{"stock_item_id":"f68b5b9b-caa9-4622-a31c-84033e304b3b","label":"Carton d''expédition S","quantity":2000,"unit_cost":0.38}]'::jsonb, 760, app.local_date(1), default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b05d46f2-7f05-417f-80bc-16cc1c7c15df', 'PO-2026-028', 'received', '[{"stock_item_id":"bd3302b7-58b6-418f-b035-d49d4492c695","label":"Verre MATOCHA","quantity":500,"unit_cost":3.1}]'::jsonb, 1550, app.local_date(-20), app.local_ts(-19, '10:30'));

insert into public.invoices (id, org_id, number, client_id, work_order_id, quote_id, status, issued_on, due_on, total_ht, total_vat, total_ttc, paid_amount) values
  ('fe2a538b-a938-421e-b045-c9169c5ce4e0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0418', 'fefc675c-0584-4c08-af0a-b0f89f283f56', '81cda6a9-60e5-4389-a848-6a5eb27d84bc', null, 'sent', app.local_date(-27), app.local_date(3), 1680, 92.4, 1772.4, 0),
  ('934bd792-a29e-4f2f-aa19-fab1d5c195ce', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0421', '7ca02feb-f82e-4e38-b939-c87e00416d7e', 'c2262234-8968-4086-b421-caf3035d575a', 'd1f9747d-cbec-4fbb-835e-fc0845639fa3', 'sent', app.local_date(-9), app.local_date(21), 1526.4, 83.95, 1610.35, 0),
  ('abe34239-172e-484b-9e64-f9dade17d537', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0422', 'ff9babee-e7bd-4c08-a345-79648d7aadb1', 'feaf270f-4f5a-4722-98fa-fe4e3bf5d8ef', 'f2d66dc7-1df3-47e6-b5d1-7f92a2b984be', 'paid', app.local_date(-15), app.local_date(15), 701.4, 38.58, 739.98, 739.98),
  ('2f901b55-0aaa-40fb-a4ce-ae65b4b4f22b', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0409', '191dc1cb-584d-4b40-aa23-ffbf57d06080', null, null, 'overdue', app.local_date(-52), app.local_date(-22), 1240, 68.2, 1308.2, 0),
  ('e5fe8498-777b-4d50-9679-6048737fafe5', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0411', '7d288bff-b5a0-46ae-a53e-db12e29a8279', null, null, 'overdue', app.local_date(-45), app.local_date(-15), 2310, 127.05, 2437.05, 0),
  ('dcb0cfd0-6df2-4c4d-b6eb-e6f678f5eed3', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0414', '4eabdaea-c8ce-4b37-9a01-4d9e57da8e0c', null, null, 'overdue', app.local_date(-38), app.local_date(-8), 980, 53.9, 1033.9, 0),
  ('fe7048e1-d500-414c-a546-85318f234ac0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0415', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', null, null, 'partial', app.local_date(-34), app.local_date(-4), 3150, 173.25, 3323.25, 1500),
  ('974c0fb2-8cfa-4413-a8aa-1712fa29a908', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0401', '94b65127-0743-4653-adb2-e03ea5cbe445', null, null, 'paid', app.local_date(-70), app.local_date(-40), 860, 47.3, 907.3, 907.3),
  ('d021d4e1-9c00-4464-b60c-023100678fc0', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0403', 'a7a9fea8-04a5-4842-ae7e-cb059b38d1eb', null, null, 'paid', app.local_date(-66), app.local_date(-36), 1420, 78.1, 1498.1, 1498.1),
  ('06046248-6c13-48d4-ac08-bd9f891bbc31', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0405', '134f7a81-56d2-456a-9dec-f594e6b49081', null, null, 'paid', app.local_date(-60), app.local_date(-30), 2140, 117.7, 2257.7, 2257.7),
  ('21a405da-4688-4d0d-bccd-2732cf599acc', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0407', 'fefc675c-0584-4c08-af0a-b0f89f283f56', null, null, 'paid', app.local_date(-57), app.local_date(-27), 1590, 87.45, 1677.45, 1677.45),
  ('b365bb8f-1226-4f9f-a6a5-f5c5f1d659e9', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0412', '5298333f-f85d-4c01-ab7a-c5a82d66ccc5', null, null, 'paid', app.local_date(-41), app.local_date(-11), 4380, 240.9, 4620.9, 4620.9),
  ('0e27b2e5-a59a-4f35-8a04-22af8e29bd10', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'F-2026-0416', '7ca02feb-f82e-4e38-b939-c87e00416d7e', null, null, 'paid', app.local_date(-31), app.local_date(-1), 720, 39.6, 759.6, 759.6);

insert into public.invoice_lines (org_id, invoice_id, label, quantity, unit_price, vat_rate) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fe2a538b-a938-421e-b045-c9169c5ce4e0', 'Commande CP-24-0590', 1, 1680, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '934bd792-a29e-4f2f-aa19-fab1d5c195ce', 'Commande CP-24-0601', 1, 1526.4, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'abe34239-172e-484b-9e64-f9dade17d537', 'Commande CP-24-0598', 1, 701.4, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2f901b55-0aaa-40fb-a4ce-ae65b4b4f22b', 'Commande pro — produits MATOCHA', 1, 1240, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e5fe8498-777b-4d50-9679-6048737fafe5', 'Commande pro — produits MATOCHA', 1, 2310, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dcb0cfd0-6df2-4c4d-b6eb-e6f678f5eed3', 'Commande pro — produits MATOCHA', 1, 980, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fe7048e1-d500-414c-a546-85318f234ac0', 'Commande pro — produits MATOCHA', 1, 3150, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '974c0fb2-8cfa-4413-a8aa-1712fa29a908', 'Commande pro — produits MATOCHA', 1, 860, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd021d4e1-9c00-4464-b60c-023100678fc0', 'Commande pro — produits MATOCHA', 1, 1420, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '06046248-6c13-48d4-ac08-bd9f891bbc31', 'Commande pro — produits MATOCHA', 1, 2140, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '21a405da-4688-4d0d-bccd-2732cf599acc', 'Commande pro — produits MATOCHA', 1, 1590, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b365bb8f-1226-4f9f-a6a5-f5c5f1d659e9', 'Commande pro — produits MATOCHA', 1, 4380, 0.055),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0e27b2e5-a59a-4f35-8a04-22af8e29bd10', 'Commande pro — produits MATOCHA', 1, 720, 0.055);

insert into public.payments (org_id, invoice_id, amount, received_on, method, reference) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'abe34239-172e-484b-9e64-f9dade17d537', 739.98, app.local_date(-1), 'virement', 'VIR F-2026-0422'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'fe7048e1-d500-414c-a546-85318f234ac0', 1500, app.local_date(-7), 'virement', 'VIR F-2026-0415'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '974c0fb2-8cfa-4413-a8aa-1712fa29a908', 907.3, app.local_date(-43), 'virement', 'VIR F-2026-0401'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd021d4e1-9c00-4464-b60c-023100678fc0', 1498.1, app.local_date(-39), 'virement', 'VIR F-2026-0403'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '06046248-6c13-48d4-ac08-bd9f891bbc31', 2257.7, app.local_date(-33), 'virement', 'VIR F-2026-0405'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '21a405da-4688-4d0d-bccd-2732cf599acc', 1677.45, app.local_date(-30), 'virement', 'VIR F-2026-0407'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b365bb8f-1226-4f9f-a6a5-f5c5f1d659e9', 4620.9, app.local_date(-14), 'virement', 'VIR F-2026-0412'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '0e27b2e5-a59a-4f35-8a04-22af8e29bd10', 759.6, app.local_date(-4), 'virement', 'VIR F-2026-0416');

insert into public.dunning_steps (org_id, invoice_id, level, sent_at, due_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2f901b55-0aaa-40fb-a4ce-ae65b4b4f22b', 1, app.local_ts(-15, '09:00'), app.local_ts(-15, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2f901b55-0aaa-40fb-a4ce-ae65b4b4f22b', 2, app.local_ts(-5, '09:00'), app.local_ts(-5, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '2f901b55-0aaa-40fb-a4ce-ae65b4b4f22b', 3, default, app.local_ts(0, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e5fe8498-777b-4d50-9679-6048737fafe5', 1, app.local_ts(-8, '09:00'), app.local_ts(-8, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e5fe8498-777b-4d50-9679-6048737fafe5', 2, default, app.local_ts(0, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dcb0cfd0-6df2-4c4d-b6eb-e6f678f5eed3', 1, default, app.local_ts(0, '09:00'));

insert into public.expenses (org_id, employee_id, spent_on, category, label, amount_ttc, vat_amount, status, approver_id) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9f2ed51d-5298-4fb5-acf5-5a31dbfb6c41', app.local_date(-1), 'Transport', 'Train Paris–Lyon (salon)', 118.4, 10.76, 'submitted', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '00a93219-9541-4aaf-a937-4f10626b787b', app.local_date(-3), 'Repas client', 'Déjeuner Kissa Mori', 64.5, 5.86, 'submitted', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', app.local_date(-6), 'Accessoires tournage', 'Fond papier ivoire', 89, 14.83, 'approved', '8450f908-aefc-44e1-9c57-809a590462f3'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '54372e8d-a51b-4a16-b51d-7ee323109ad8', app.local_date(-12), 'Transport', 'Taxi rendez-vous Hôtel des Tilleuls', 32.2, 2.93, 'reimbursed', '4197e349-3a73-4c60-af89-f528a198e011'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '3fff2701-e274-487e-adf3-0a816c15f823', app.local_date(-2), 'Fournitures', 'Lait d''avoine (tests recettes)', 24.6, 1.28, 'submitted', default);

insert into public.cash_forecast (org_id, week_start, inflow, outflow, note) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(0))::date, 56100, 49711, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(7))::date, 62726, 83273, 'Paiement lot L2026-10C'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(14))::date, 56682, 51541, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(21))::date, 56127, 56468, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(28))::date, 48931, 56136, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(35))::date, 57537, 49207, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(42))::date, 64936, 46262, null),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', date_trunc('week', app.local_date(49))::date, 53340, 45474, null);

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('5f731868-ee2c-4478-a560-50b79b599587', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'email', 'Re: Devis carte hiver — quantités', 'bc3c88c3-e7f2-4ec5-8bc3-4956ba914a2b', null, 'awaiting_reply', app.local_ts(-3, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5f731868-ee2c-4478-a560-50b79b599587', 'in', 'Laura Steiner', 'Bonjour, pourriez-vous ajuster le devis à 8 kg de vrac barista et ajouter 2 sessions de formation ? Merci !', 'fr', app.local_ts(-3, '09:00'));

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('dd56f608-8ba3-4cf7-9040-14eae5e56980', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'email', 'Facture F-2026-0409 — relance', '191dc1cb-584d-4b40-aa23-ffbf57d06080', null, 'open', app.local_ts(-5, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'dd56f608-8ba3-4cf7-9040-14eae5e56980', 'out', 'Nathalie Blanc', 'Bonjour, sauf erreur de notre part la facture F-2026-0409 reste impayée…', 'fr', app.local_ts(-5, '09:00'));

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('9e5fdb44-9ce2-4a75-a606-55158e242a73', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'email', 'Livraison de cet après-midi', '94b65127-0743-4653-adb2-e03ea5cbe445', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', 'answered', app.local_ts(0, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9e5fdb44-9ce2-4a75-a606-55158e242a73', 'in', 'Mathilde Aubry', 'On vous attend vers 14 h, l''entrée de service est rue de la Roquette.', 'fr', app.local_ts(0, '09:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '9e5fdb44-9ce2-4a75-a606-55158e242a73', 'out', 'Karim Saïdi', 'Parfait, le colis part du contrôle qualité dans l''heure.', 'fr', app.local_ts(0, '09:40'));

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('7b69e06f-6ce1-4b58-adcd-806fad66dd30', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'email', 'Matcha workshop for our students', '407cdb1b-ff2f-4a3a-be88-b43646722e01', null, 'awaiting_reply', app.local_ts(-41, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '7b69e06f-6ce1-4b58-adcd-806fad66dd30', 'in', 'Priya Morin', 'Hi! We''d love to host a matcha tasting for our yoga students. Do you offer that?', 'en', app.local_ts(-41, '09:00'));

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('b4335331-76c8-430d-843b-754aa4bfd9fb', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'email', 'Photos du corner Discovery Box', '134f7a81-56d2-456a-9dec-f594e6b49081', null, 'awaiting_reply', app.local_ts(-1, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b4335331-76c8-430d-843b-754aa4bfd9fb', 'in', 'Aiko Bernard', 'Voici les photos du corner, pouvez-vous nous envoyer 2 présentoirs supplémentaires ?', 'fr', app.local_ts(-1, '09:00'));

insert into public.threads (id, org_id, channel, subject, client_id, work_order_id, status, last_message_at) values
  ('77bbf04d-7909-42df-97ff-c463efc0fbc2', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'interne', 'Lot L2026-10C — arrivée aujourd''hui', null, null, 'open', app.local_ts(0, '10:30'));

insert into public.messages (org_id, thread_id, direction, from_name, body, language, sent_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '77bbf04d-7909-42df-97ff-c463efc0fbc2', 'in', 'Hélène Roussel', 'Le porteur est annoncé ce matin. Quarantaine prévue, dégustation à 16 h.', 'fr', app.local_ts(0, '09:00'));

insert into public.messages (org_id, thread_id, direction, from_name, body, is_ai_draft) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '5f731868-ee2c-4478-a560-50b79b599587', 'out', 'Brouillon IA', 'Bonjour Laura, merci pour votre retour. Je vous envoie le devis ajusté : 8 kg de vrac barista et 2 sessions de formation…', true);

insert into public.documents (org_id, entity_type, entity_id, name, kind) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'lots', 'f17baf34-1d48-430e-b764-b8e65216c5c0', 'Certificat d''analyse L2026-09B.pdf', 'coa'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'quotes', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', 'Devis Q-2026-0141.pdf', 'devis'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'clients', 'fefc675c-0584-4c08-af0a-b0f89f283f56', 'Contrat cadre Hôtel des Tilleuls.pdf', 'contrat'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'employees', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'Contrat CDD.pdf', 'contrat');

insert into public.notifications (org_id, kind, title, body, entity_type, entity_id, created_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'stock_bas', 'Stock bas : Carton d''expédition S', '310 en stock pour un minimum de 400.', 'stock_items', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', now() + interval '-90 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'conges', '3 demandes de congés à valider', default, 'leave_requests', default, now() + interval '-60 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'relance', '3 factures échues à relancer', default, 'invoices', default, now() + interval '-45 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'devis', 'Hôtel Belvédère a ouvert le devis Q-2026-0141', default, 'quotes', '69ac8d42-a71a-4b4f-b6e3-e1c052e9b479', now() + interval '-30 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'avis', 'Avis client 5★ : « enfin un matcha qui se prépare au bureau »', default, default, default, now() + interval '-12 minutes');

insert into public.reviews (org_id, employee_id, reviewer_id, scheduled_on, status, objectives, summary) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '601e64df-026e-48e0-8f61-92c62f5c4bd6', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', app.local_date(12), 'planned', '[{"titre":"Taux d''erreur de préparation < 0,5 %","poids":0.5}]'::jsonb, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', '8450f908-aefc-44e1-9c57-809a590462f3', app.local_date(-40), 'done', '[{"titre":"30 vidéos / mois","atteint":true}]'::jsonb, 'Très bonne progression sur le format court ; viser plus de tests d''accroche.');

insert into public.trainings (org_id, employee_id, title, provider, starts_on, hours, cost, status) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', 'Recyclage CACES 1', 'Organisme fictif', app.local_date(18), 7, 390, default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', 'HACCP — mise à jour', 'Organisme fictif', app.local_date(-60), 14, 650, 'done');

insert into public.job_openings (id, org_id, title, department_id, criteria, status, opened_on) values
  ('d9a36e86-ce03-429a-8dd6-84a4d4697b7c', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Préparateur·rice de commandes (CDD 6 mois)', '03a6616e-66e4-4a30-bab6-da423f1a0558', '["Expérience entrepôt","Rigueur","Disponible 7 h"]'::jsonb, 'open', app.local_date(-18)),
  ('81a345f8-1cc9-48b7-9725-adf7540a2102', 'af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Chargé·e de comptes pros — Lyon', '2eb9a8ca-8a8d-43a0-bf28-a0c3a5fd5f2e', '["Réseau CHR","Dégustation","Permis B"]'::jsonb, 'open', app.local_date(-9));

insert into public.candidates (org_id, job_opening_id, full_name, source, score, stage, ai_summary) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd9a36e86-ce03-429a-8dd6-84a4d4697b7c', 'Kevin Marchetti', 'Indeed', 'A', 'entretien_2', '{"forts":["3 ans en e-commerce"],"faibles":[],"a_verifier":["Disponibilité 7 h"]}'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd9a36e86-ce03-429a-8dd6-84a4d4697b7c', 'Laura Pinto', 'Candidature spontanée', 'B', 'entretien_1', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'd9a36e86-ce03-429a-8dd6-84a4d4697b7c', 'Ibrahim Sow', 'France Travail', 'B', 'nouveau', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81a345f8-1cc9-48b7-9725-adf7540a2102', 'Margaux Delorme', 'LinkedIn', 'A', 'entretien_1', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81a345f8-1cc9-48b7-9725-adf7540a2102', 'Hugo Bailly', 'Cooptation', 'C', 'refuse', default),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', '81a345f8-1cc9-48b7-9725-adf7540a2102', 'Selma Aït', 'LinkedIn', 'B', 'nouveau', default);

insert into public.onboarding_tasks (org_id, employee_id, title, due_on, done_at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'Remise du badge et du tablier', app.local_date(-20), app.local_ts(-20, '17:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'Formation sécurité entrepôt', app.local_date(-11), app.local_ts(-11, '17:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'Binôme 3 jours avec un préparateur', app.local_date(-2), app.local_ts(-2, '17:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', 'Point à 1 mois', app.local_date(7), null);

insert into public.automations (org_id, name, enabled, trigger, actions) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Stock sous le minimum → bon de commande brouillon', true, '{"type":"threshold","table":"stock_items","field":"quantity","below":"min_quantity"}'::jsonb, '[{"type":"create_purchase_order_draft"},{"type":"notify","role":"operations"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Lot reçu → quarantaine + tâche de contrôle', true, '{"type":"event","event":"lot.quarantaine"}'::jsonb, '[{"type":"create_task","assignee_role":"qualite","title":"Contrôler le lot"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'DDM < 90 jours → alerte qualité', true, '{"type":"date","table":"lots","field":"best_before","within_days":90}'::jsonb, '[{"type":"notify","role":"operations"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Devis ouvert sans réponse 3 j → relance pré-rédigée', true, '{"type":"date","table":"quotes","field":"opened_at","after_days":3}'::jsonb, '[{"type":"ai_draft_email","template":"relance_devis"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Devis accepté → commande pro créée', true, '{"type":"event","event":"quote.accepted"}'::jsonb, '[{"type":"create_work_order"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Commande livrée → facture brouillon', true, '{"type":"event","event":"work_order.stage","to":"livree"}'::jsonb, '[{"type":"create_invoice_draft"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Facture échue → relance niveau suivant', true, '{"type":"date","table":"invoices","field":"due_on","after_days":1}'::jsonb, '[{"type":"dunning_next_level"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Compte pro sans contact 30 j → rappel relation', true, '{"type":"date","table":"clients","field":"last_contact_at","after_days":30}'::jsonb, '[{"type":"create_task","assignee":"owner"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Commande en ligne non expédiée à 15 h → alerte', true, '{"type":"date","table":"shop_orders","field":"ship_deadline","after_minutes":0}'::jsonb, '[{"type":"notify","role":"operations"}]'::jsonb),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Demande de congé → notification au manager', true, '{"type":"event","event":"leave.pending"}'::jsonb, '[{"type":"notify","target":"manager"}]'::jsonb);

insert into public.reports (org_id, name, schedule, recipients, definition) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'Rapport hebdomadaire de direction', '0 7 * * 1', array['claire.ostrowski@matocha.demo','hugo.marchal@matocha.demo']::text[], '{"kpis":["commandes_jour","expedie_avant_15h","ca_jour"]}'::jsonb);

insert into public.activity_events (org_id, type, entity, entity_id, payload, at) values
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'e299d35e-e668-441c-92de-5d926c18a842', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:39')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '31b317c4-f360-471d-be77-6b994d2d46f5', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '09:18')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '8450f908-aefc-44e1-9c57-809a590462f3', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:59')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'b806d19f-8aaf-45b3-a031-b8bd9d055028', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:06')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '3d39b499-a3b5-41a0-b30d-0a0281e36614', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '09:35')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '07244853-26b8-4246-bca2-88eb372772a5', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:24')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'eaeb7a28-0a05-4d42-adca-61652b663f76', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '09:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '2e9bff21-61bb-4804-be86-567c86112536', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:53')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '79df8327-dc68-45af-91ca-eb123b1e0800', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:30')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'f6810c8e-0c82-4158-a3b4-ef30696a3635', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:15')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '54372e8d-a51b-4a16-b51d-7ee323109ad8', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:40')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '00a93219-9541-4aaf-a937-4f10626b787b', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:09')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '684f1aef-fe42-4a07-a090-caabf27681bb', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:11')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'f6e71f88-bfdb-4d48-8220-5c8dc6e7180b', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:11')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '1a5069b7-38ae-4145-8a6c-3224105b9282', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '09:01')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'e6d85a29-2fbb-4ef1-bfa5-143cf808ff8b', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '06:50')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '3fff2701-e274-487e-adf3-0a816c15f823', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '2d5fddf7-d60a-4061-8aca-bedc0ccb6849', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:16')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:00')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '601e64df-026e-48e0-8f61-92c62f5c4bd6', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:05')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', 'c72b2403-bb4a-4b94-9f4a-052810718b0f', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:06')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '03a1ca78-3b43-4d30-b55e-7ab858b975ad', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:15')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '4197e349-3a73-4c60-af89-f528a198e011', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:16')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '8737ca5b-9296-4260-8c81-5d0d9ef3644f', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:47')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '8cd6d988-2dc2-4f7b-8ed3-f65c0952b30f', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '08:09')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '2aa2466d-8726-4fa9-86f8-5f1cfd379d8d', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:43')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.in', 'employees', '6d146678-5d87-4c3f-94b8-7d5ae9453b9d', '{"reader":"accueil"}'::jsonb, app.local_ts(0, '07:41')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'quote.accepted', 'quotes', 'c58eb12d-ee37-472e-8ef3-3be541aae10d', '{"number":"Q-2026-0144","client":"Hôtel des Tilleuls"}'::jsonb, app.local_ts(0, '08:40')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'work_order.created', 'work_orders', '129438d1-c195-4153-80f1-25fd131fb188', '{"number":"CP-24-0612"}'::jsonb, app.local_ts(0, '08:41')),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'work_order.stage', 'work_orders', '257f30fd-4578-4bb7-926e-4c09ef3cd83c', '{"number":"CP-24-0607","from":"preparation","to":"controle"}'::jsonb, now() + interval '-35 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'stock.low', 'stock_items', 'f68b5b9b-caa9-4622-a31c-84033e304b3b', '{"quantity":310,"min":400}'::jsonb, now() + interval '-90 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.pause_start', 'employees', '1a5069b7-38ae-4145-8a6c-3224105b9282', '{"reader":"detente"}'::jsonb, now() + interval '-8 minutes'),
  ('af42ec17-371d-4e1a-91bd-e0c06be6ab01', 'badge.pause_start', 'employees', '0dfa6efc-2640-4e37-8e12-fda790dfcf75', '{"reader":"detente"}'::jsonb, now() + interval '-8 minutes');

select set_config('app.seeding', 'off', false);
