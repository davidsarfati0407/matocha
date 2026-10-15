-- Ressources : réapprovisionnement en un clic, réception fournisseur (lot + entrée de stock), décision qualité.
-- Fonctions en security invoker : la RLS et la matrice de droits de l'appelant s'appliquent.

/** Crée un bon de commande brouillon par fournisseur. items = [{stock_item_id, quantity}] (quantités calculées côté domaine). */
create or replace function public.reorder_stock(items jsonb) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  o uuid := app.current_org_id();
  sup record;
  pos jsonb := '[]';
  po_id uuid;
  num text;
begin
  if not app.has_perm('ressources', 'create') then
    raise exception 'acces refuse' using errcode = '42501';
  end if;
  for sup in
    select s.supplier_id,
           jsonb_agg(jsonb_build_object('stock_item_id', s.id, 'label', s.name, 'quantity', (i ->> 'quantity')::numeric, 'unit_cost', s.unit_cost)) as lines,
           sum((i ->> 'quantity')::numeric * s.unit_cost) as total
      from jsonb_array_elements(items) i
      join public.stock_items s on s.id = (i ->> 'stock_item_id')::uuid
     where s.supplier_id is not null and (i ->> 'quantity')::numeric > 0
     group by s.supplier_id
  loop
    num := app.next_number(o, 'purchase_orders', 'PO', 3);
    insert into public.purchase_orders (org_id, supplier_id, number, status, lines, total_ht, expected_on)
    values (o, sup.supplier_id, num, 'draft', sup.lines, round(sup.total, 2),
            app.local_date(coalesce((select lead_time_days from public.suppliers where id = sup.supplier_id), 7)))
    returning id into po_id;
    update public.stock_items set on_order = true
     where id in (select (l ->> 'stock_item_id')::uuid from jsonb_array_elements(sup.lines) l);
    pos := pos || jsonb_build_object('id', po_id, 'number', num);
  end loop;
  return pos;
end $$;
grant execute on function public.reorder_stock(jsonb) to authenticated;

/** Réception : chaque ligne crée (ou complète le lot attendu) en quarantaine et une entrée de stock. */
create or replace function public.receive_purchase_order(po uuid) returns jsonb
language plpgsql security invoker set search_path = public as $$
declare
  o uuid := app.current_org_id();
  p public.purchase_orders;
  l jsonb;
  lot_id uuid;
  lot_num text;
  prefix text := 'L' || to_char(now() at time zone 'Europe/Paris', 'YYYY-MM');
  out jsonb := '[]';
begin
  select * into p from public.purchase_orders where id = po for update;
  if p.id is null then raise exception 'bon introuvable' using errcode = 'P0002'; end if;
  if p.status in ('received', 'cancelled') then raise exception 'bon déjà soldé' using errcode = '22023'; end if;
  for l in select * from jsonb_array_elements(p.lines) loop
    select id, number into lot_id, lot_num from public.lots
     where stock_item_id = (l ->> 'stock_item_id')::uuid and status = 'attendu' order by created_at limit 1;
    if lot_id is null then
      lot_num := prefix || chr(65 + (select count(*)::int from public.lots where org_id = o and number like prefix || '%'));
      while exists (select 1 from public.lots where org_id = o and number = lot_num) loop
        lot_num := prefix || chr(ascii(right(lot_num, 1)) + 1);
      end loop;
      insert into public.lots (org_id, stock_item_id, supplier_id, number, quantity, received_at, best_before, status)
      values (o, (l ->> 'stock_item_id')::uuid, p.supplier_id, lot_num, (l ->> 'quantity')::numeric, now(), app.local_date(540), 'quarantaine')
      returning id into lot_id;
    else
      update public.lots set status = 'quarantaine', received_at = now(), quantity = (l ->> 'quantity')::numeric where id = lot_id;
    end if;
    insert into public.stock_movements (org_id, stock_item_id, lot_id, kind, quantity, reason)
    values (o, (l ->> 'stock_item_id')::uuid, lot_id, 'entree', (l ->> 'quantity')::numeric, 'Réception ' || p.number);
    update public.stock_items set on_order = false where id = (l ->> 'stock_item_id')::uuid;
    out := out || jsonb_build_object('lot_id', lot_id, 'number', lot_num);
  end loop;
  update public.purchase_orders set status = 'received', received_at = now() where id = po;
  return out;
end $$;
grant execute on function public.receive_purchase_order(uuid) to authenticated;
