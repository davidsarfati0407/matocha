/**
 * Navigation du back-office, groupée par domaine. Le droit « read » du module conditionne l'affichage.
 * Libellés : clé « nav.* » (traduite) ou vocabulaire de la fiche secteur (donnée, non traduite).
 * « clé|valeur » : clé avec paramètre {lots}.
 */
import { sectorConfig } from "@/config/sector.config";
import type { Module } from "./context";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  module: Module;
  counter?: string;
  requiresSalaries?: boolean;
  /** Visible aussi pour ce module (ex. la finance voit la masse salariale agrégée). */
  alsoFor?: Module;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const V = sectorConfig.vocabulaire;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const NAV: NavGroup[] = [
  { label: "nav.group.pilotage", items: [{ href: "/dashboard", label: "nav.item.dashboard", icon: "home", module: "pilotage", counter: "todo" }] },
  {
    label: "nav.group.communication",
    items: [
      { href: "/comms/inbox", label: "nav.item.inbox", icon: "mail", module: "communication", counter: "to_answer" },
      { href: "/comms/documents", label: "nav.item.documents", icon: "layers", module: "communication" },
    ],
  },
  {
    label: "nav.group.commercial",
    items: [
      { href: "/crm/clients", label: cap(V.client.pluriel), icon: "users", module: "commercial" },
      { href: "/crm/pipeline", label: "nav.item.pipeline", icon: "chart", module: "commercial" },
      { href: "/crm/quotes", label: "nav.item.quotes", icon: "file", module: "commercial", counter: "quotes_to_send" },
      { href: "/crm/calendar", label: "nav.item.calendar", icon: "calendar", module: "pilotage", counter: "events_today" },
    ],
  },
  {
    label: "nav.group.operations",
    items: [
      { href: "/ops/work-orders", label: cap(V.workOrder.pluriel), icon: "box", module: "operations", counter: "wo_alerts" },
      { href: "/ops/shop-orders", label: "nav.item.shopOrders", icon: "cart", module: "operations" },
      { href: "/ops/planning", label: "nav.item.planning", icon: "clock", module: "operations" },
      { href: "/ops/time", label: "nav.item.time", icon: "timer", module: "operations" },
    ],
  },
  {
    label: "nav.group.rh",
    items: [
      { href: "/hr/employees", label: cap(V.employe.pluriel), icon: "users", module: "pilotage" } /* annuaire pour tous ; détail RH filtré */,
      { href: "/hr/presence", label: "nav.item.presence", icon: "badge", module: "rh" },
      { href: "/hr/leaves", label: "nav.item.leaves", icon: "sun", module: "pilotage", counter: "leaves_pending" } /* chacun pose ses congés */,
      { href: "/hr/salaries", label: "nav.item.salaries", icon: "lock", module: "salaires", requiresSalaries: true, alsoFor: "finance" },
      { href: "/hr/reviews", label: "nav.item.reviews", icon: "check", module: "rh" },
      { href: "/hr/recruitment", label: "nav.item.recruitment", icon: "user-plus", module: "rh" },
    ],
  },
  {
    label: "nav.group.finance",
    items: [
      { href: "/finance/invoices", label: "nav.item.invoices", icon: "file", module: "finance", counter: "invoices_overdue" },
      { href: "/finance/payments", label: "nav.item.payments", icon: "bank", module: "finance" },
      { href: "/finance/dunning", label: "nav.item.dunning", icon: "bell", module: "finance", counter: "dunning_due" },
      { href: "/finance/expenses", label: "nav.item.expenses", icon: "receipt", module: "pilotage", counter: "expenses_pending" } /* chacun voit les siennes (RLS) */,
      { href: "/finance/treasury", label: "nav.item.treasury", icon: "chart", module: "finance" },
    ],
  },
  {
    label: "nav.group.ressources",
    items: [
      { href: "/resources/stock", label: "nav.item.stock", icon: "layers", module: "ressources", counter: "stock_low" },
      { href: "/resources/lots", label: `nav.item.lotsTrace|${cap(V.lot.pluriel)}`, icon: "box", module: "ressources" },
      { href: "/resources/purchase-orders", label: "nav.item.purchaseOrders", icon: "truck", module: "ressources" },
      { href: "/resources/assets", label: "nav.item.assets", icon: "tool", module: "ressources" },
    ],
  },
  {
    label: "nav.group.ia",
    items: [
      { href: "/ai", label: "nav.item.ai", icon: "sparkles", module: "ia" },
      { href: "/settings/automations", label: "nav.item.automations", icon: "zap", module: "pilotage" },
    ],
  },
  {
    label: "nav.group.organisation",
    items: [
      { href: "/settings", label: "nav.item.settings", icon: "settings", module: "organisation" },
      { href: "/settings/roles", label: "nav.item.roles", icon: "lock", module: "organisation" },
      { href: "/settings/integrations", label: "nav.item.integrations", icon: "plug", module: "organisation" },
      { href: "/settings/audit", label: "nav.item.audit", icon: "list", module: "organisation" },
      { href: "/settings/privacy", label: "nav.item.privacy", icon: "shield", module: "organisation" },
      { href: "/settings/security", label: "nav.item.security", icon: "lock", module: "pilotage" } /* chacun gère sa 2FA */,
    ],
  },
];

/** Fil d'Ariane par segment : clé de traduction « nav.seg.* » ou vocabulaire de la fiche secteur. */
export const SEGMENTS: Record<string, string> = {
  dashboard: "nav.seg.dashboard",
  comms: "nav.seg.comms",
  inbox: "nav.seg.inbox",
  documents: "nav.seg.documents",
  crm: "nav.seg.crm",
  clients: cap(V.client.pluriel),
  pipeline: "nav.seg.pipeline",
  quotes: "nav.seg.quotes",
  calendar: "nav.seg.calendar",
  ops: "nav.seg.ops",
  "work-orders": cap(V.workOrder.pluriel),
  "shop-orders": "nav.seg.shop-orders",
  planning: "nav.seg.planning",
  time: "nav.seg.time",
  hr: "nav.seg.hr",
  employees: cap(V.employe.pluriel),
  presence: "nav.seg.presence",
  leaves: "nav.seg.leaves",
  salaries: "nav.seg.salaries",
  reviews: "nav.seg.reviews",
  recruitment: "nav.seg.recruitment",
  finance: "nav.seg.finance",
  invoices: "nav.seg.invoices",
  payments: "nav.seg.payments",
  dunning: "nav.seg.dunning",
  expenses: "nav.seg.expenses",
  treasury: "nav.seg.treasury",
  resources: "nav.seg.resources",
  stock: "nav.seg.stock",
  lots: "nav.seg.lots",
  "purchase-orders": "nav.seg.purchase-orders",
  assets: "nav.seg.assets",
  racks: "nav.seg.racks",
  ai: "nav.seg.ai",
  settings: "nav.seg.settings",
  automations: "nav.seg.automations",
  roles: "nav.seg.roles",
  integrations: "nav.seg.integrations",
  audit: "nav.seg.audit",
  privacy: "nav.seg.privacy",
  zones: "nav.seg.zones",
  new: "nav.seg.new",
  security: "nav.seg.security",
};

/** Traduit un libellé de navigation (clé « nav.* », éventuellement « clé|valeur », ou texte de la fiche secteur). */
export function navLabel(t: (k: string, v?: Record<string, string>) => string, label: string) {
  if (!label.startsWith("nav.")) return label;
  const [key, value] = label.split("|");
  return t(key, value ? { lots: value } : undefined);
}
