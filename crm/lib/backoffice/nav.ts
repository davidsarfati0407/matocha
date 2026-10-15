/** Navigation du back-office, groupée par domaine. Le droit « read » du module conditionne l'affichage. */
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
  { label: "Pilotage", items: [{ href: "/dashboard", label: "Aujourd'hui", icon: "home", module: "pilotage", counter: "todo" }] },
  {
    label: "Communication",
    items: [
      { href: "/comms/inbox", label: "Messagerie", icon: "mail", module: "communication", counter: "to_answer" },
      { href: "/comms/documents", label: "Documents", icon: "layers", module: "communication" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/crm/clients", label: cap(V.client.pluriel), icon: "users", module: "commercial" },
      { href: "/crm/pipeline", label: "Pipeline", icon: "chart", module: "commercial" },
      { href: "/crm/quotes", label: "Devis", icon: "file", module: "commercial", counter: "quotes_to_send" },
      { href: "/crm/calendar", label: "Calendrier", icon: "calendar", module: "pilotage", counter: "events_today" },
    ],
  },
  {
    label: "Opérations",
    items: [
      { href: "/ops/work-orders", label: cap(V.workOrder.pluriel), icon: "box", module: "operations", counter: "wo_alerts" },
      { href: "/ops/shop-orders", label: "Commandes en ligne", icon: "cart", module: "operations" },
      { href: "/ops/planning", label: "Planning", icon: "clock", module: "operations" },
      { href: "/ops/time", label: "Heures", icon: "timer", module: "operations" },
    ],
  },
  {
    label: "RH",
    items: [
      { href: "/hr/employees", label: cap(V.employe.pluriel), icon: "users", module: "pilotage" } /* annuaire pour tous ; détail RH filtré */,
      { href: "/hr/presence", label: "Présence", icon: "badge", module: "rh" },
      { href: "/hr/leaves", label: "Congés", icon: "sun", module: "pilotage", counter: "leaves_pending" } /* chacun pose ses congés */,
      { href: "/hr/salaries", label: "Salaires", icon: "lock", module: "salaires", requiresSalaries: true, alsoFor: "finance" },
      { href: "/hr/reviews", label: "Entretiens & formations", icon: "check", module: "rh" },
      { href: "/hr/recruitment", label: "Recrutement", icon: "user-plus", module: "rh" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/finance/invoices", label: "Factures", icon: "file", module: "finance", counter: "invoices_overdue" },
      { href: "/finance/payments", label: "Paiements", icon: "bank", module: "finance" },
      { href: "/finance/dunning", label: "Relances", icon: "bell", module: "finance", counter: "dunning_due" },
      { href: "/finance/expenses", label: "Notes de frais", icon: "receipt", module: "pilotage", counter: "expenses_pending" } /* chacun voit les siennes (RLS) */,
      { href: "/finance/treasury", label: "Trésorerie", icon: "chart", module: "finance" },
    ],
  },
  {
    label: "Ressources",
    items: [
      { href: "/resources/stock", label: "Stock", icon: "layers", module: "ressources", counter: "stock_low" },
      { href: "/resources/lots", label: `${cap(V.lot.pluriel)} & traçabilité`, icon: "box", module: "ressources" },
      { href: "/resources/purchase-orders", label: "Achats", icon: "truck", module: "ressources" },
      { href: "/resources/assets", label: "Équipements & salles", icon: "tool", module: "ressources" },
    ],
  },
  {
    label: "IA & automatisations",
    items: [
      { href: "/ai", label: "Assistant", icon: "sparkles", module: "ia" },
      { href: "/settings/automations", label: "Automatisations", icon: "zap", module: "pilotage" },
    ],
  },
  {
    label: "Organisation",
    items: [
      { href: "/settings", label: "Paramètres", icon: "settings", module: "organisation" },
      { href: "/settings/roles", label: "Rôles & droits", icon: "lock", module: "organisation" },
      { href: "/settings/integrations", label: "Intégrations", icon: "plug", module: "organisation" },
      { href: "/settings/audit", label: "Journal d'audit", icon: "list", module: "organisation" },
      { href: "/settings/privacy", label: "Données & RGPD", icon: "shield", module: "organisation" },
    ],
  },
];

/** Libellés du fil d'Ariane par segment. */
export const SEGMENTS: Record<string, string> = {
  dashboard: "Aujourd'hui",
  comms: "Communication",
  inbox: "Messagerie",
  documents: "Documents",
  crm: "Commercial",
  clients: cap(V.client.pluriel),
  pipeline: "Pipeline",
  quotes: "Devis",
  calendar: "Calendrier",
  ops: "Opérations",
  "work-orders": cap(V.workOrder.pluriel),
  "shop-orders": "Commandes en ligne",
  planning: "Planning",
  time: "Heures",
  hr: "RH",
  employees: cap(V.employe.pluriel),
  presence: "Présence",
  leaves: "Congés",
  salaries: "Salaires",
  reviews: "Entretiens & formations",
  recruitment: "Recrutement",
  finance: "Finance",
  invoices: "Factures",
  payments: "Paiements",
  dunning: "Relances",
  expenses: "Notes de frais",
  treasury: "Trésorerie",
  resources: "Ressources",
  stock: "Stock",
  lots: "Lots",
  "purchase-orders": "Achats",
  assets: "Équipements",
  racks: "Rayonnages",
  ai: "Assistant IA",
  settings: "Organisation",
  automations: "Automatisations",
  roles: "Rôles & droits",
  integrations: "Intégrations",
  audit: "Journal d'audit",
  privacy: "Données & RGPD",
  zones: "Espaces",
  new: "Nouveau",
};
