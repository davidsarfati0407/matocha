/** Liens profonds map ↔ back-office : /{module}/{entité}/{id} et /map/{site}?focus={type}:{id}. */
const ROUTES: Record<string, [module: string, entity: string]> = {
  employees: ["hr", "employees"],
  work_orders: ["ops", "work-orders"],
  clients: ["crm", "clients"],
  quotes: ["crm", "quotes"],
  invoices: ["finance", "invoices"],
  assets: ["resources", "assets"],
  lots: ["resources", "lots"],
  stock_items: ["resources", "stock"],
  stock_rack: ["resources", "racks"],
  zones: ["settings", "zones"],
  vehicles: ["resources", "assets"],
};

export function backOfficeHref(entityType: string, id: string) {
  const r = ROUTES[entityType];
  return r ? `/${r[0]}/${r[1]}/${encodeURIComponent(id.replace(/^rack:/, ""))}` : null;
}

export function entityFromRoute(module: string, entity: string): string | null {
  for (const [type, [m, e]] of Object.entries(ROUTES)) if (m === module && e === entity) return type;
  return null;
}

export const mapHref = (siteSlug: string, entityType: string, id: string) => `/map/${siteSlug}?focus=${entityType}:${encodeURIComponent(id)}`;
