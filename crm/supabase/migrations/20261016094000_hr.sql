-- RH : annulation d'une validation de congé, masse salariale agrégée, embauche d'un candidat.

-- Un congé validé qui repasse « en attente » (annulation de la validation) est recrédité
create or replace function app.leave_balance() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.type not in ('conges', 'rtt') then return new; end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.employees set leave_balance_days = leave_balance_days - new.days where id = new.employee_id;
  elsif old.status = 'approved' and new.status <> 'approved' then
    update public.employees set leave_balance_days = leave_balance_days + new.days where id = new.employee_id;
  end if;
  return new;
end $$;

/**
 * Masse salariale agrégée par département, sans aucun salaire individuel.
 * Les départements de moins de 3 personnes sont regroupés (« Autres ») pour
 * qu'aucun montant individuel ne puisse être déduit. Accessible à la finance.
 */
create or replace function public.payroll_summary() returns table (department text, headcount int, fte numeric, gross_annual numeric, employer_cost numeric)
language sql stable security definer set search_path = public as $$
  with cur as (
    select distinct on (s.employee_id) s.employee_id, s.gross_annual, s.bonus_target
      from public.employee_salaries s
     where s.org_id = app.current_org_id()
     order by s.employee_id, s.effective_from desc
  ), d as (
    select coalesce(dep.name, 'Sans département') as name, e.work_rate, cur.gross_annual + cur.bonus_target as gross
      from public.employees e
      join cur on cur.employee_id = e.id
      left join public.departments dep on dep.id = e.department_id
     where e.org_id = app.current_org_id() and e.left_on is null
  ), g as (
    select name, count(*) over (partition by name) as n, work_rate, gross from d
  )
  select case when n < 3 then 'Autres (regroupés)' else name end, count(*)::int, round(sum(work_rate), 1), round(sum(gross), 0),
         round(sum(gross) * (1 + coalesce((select (settings ->> 'employer_charges')::numeric from public.orgs where id = app.current_org_id()), 0.42)), 0)
    from g
   where app.has_perm('finance', 'read') or (app.can_see_salaries() and app.has_perm('salaires', 'read'))
   group by 1
   order by 4 desc
$$;
revoke execute on function public.payroll_summary() from public, anon;
grant execute on function public.payroll_summary() to authenticated;

/** Candidat embauché → fiche collaborateur + tâches d'intégration (aucune ressaisie). */
create or replace function public.hire_candidate(cand uuid, job_key text, job_title text, start_on date, contract text default 'CDI') returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  o uuid := app.current_org_id();
  c public.candidates;
  j public.job_openings;
  emp uuid;
begin
  select * into c from public.candidates where id = cand;
  if c.id is null then raise exception 'candidat introuvable' using errcode = 'P0002'; end if;
  select * into j from public.job_openings where id = c.job_opening_id;
  insert into public.employees (org_id, site_id, department_id, first_name, last_name, job_key, job_title, email, contract_type, hired_on, leave_balance_days)
  values (o, (select id from public.sites where org_id = o order by created_at limit 1), j.department_id,
          split_part(c.full_name, ' ', 1), coalesce(nullif(substr(c.full_name, length(split_part(c.full_name, ' ', 1)) + 2), ''), '—'),
          job_key, job_title, c.email, contract, start_on, 0)
  returning id into emp;
  update public.candidates set stage = 'embauche' where id = cand;
  insert into public.onboarding_tasks (org_id, employee_id, kind, title, due_on)
  select o, emp, 'onboarding', t.title, start_on + t.offset_days
    from (values ('Contrat signé et DPAE', -7), ('Badge et accès créés', -1), ('Poste de travail prêt (map : poste attribué)', -1),
                 ('Mot d''accueil et parrain désigné', 0), ('Visite des locaux et sécurité', 0), ('Point d''étonnement à 1 mois', 30)) as t(title, offset_days);
  return emp;
end $$;
revoke execute on function public.hire_candidate(uuid, text, text, date, text) from public, anon;
grant execute on function public.hire_candidate(uuid, text, text, date, text) to authenticated;
