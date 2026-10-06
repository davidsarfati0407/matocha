import Link from "next/link";
import type { ProofStatus } from "@/content/catalog/types";

export const NAV = [
  { href: "/admin", label: "Demandes" },
  { href: "/admin/inscrits", label: "Liste d'attente" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/jetons", label: "Jetons API" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/mode", label: "Mode du site" },
];

export function AdminShell({ email, children, title }: { email: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-28 pb-24 text-[15px] sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-current/15 pb-4">
        <p className="font-semibold">Back-office Matocha</p>
        <form action="/admin/deconnexion" method="post" className="flex items-center gap-3 text-sm">
          <span className="opacity-70">{email}</span>
          <button className="underline underline-offset-4" type="submit">
            Se déconnecter
          </button>
        </form>
      </div>
      <nav aria-label="Back-office" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="underline-offset-4 hover:underline">
            {item.label}
          </Link>
        ))}
      </nav>
      <h1 className="mt-10 text-2xl font-semibold">{title}</h1>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function StatusBadge({ status }: { status: ProofStatus | string }) {
  const label: Record<string, string> = {
    confirmed: "Confirmé",
    to_confirm: "À confirmer",
    unknown: "Inconnu",
    pending: "En attente",
    approved: "Approuvée",
    rejected: "Refusée",
    applied: "Appliquée",
    failed: "Échec",
  };
  const tone =
    status === "confirmed" || status === "applied"
      ? "bg-[#1E3A2A] text-[#EEEDE0]"
      : status === "failed" || status === "rejected"
        ? "bg-[#7a2a2a] text-white"
        : "border border-current/30";
  return <span className={`inline-block px-2 py-0.5 text-xs font-semibold ${tone}`}>{label[status] ?? status}</span>;
}

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" }) : "—";

export const Table = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-left text-sm [&_td]:border-t [&_td]:border-current/10 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_th]:pb-2 [&_th]:pr-4 [&_th]:font-semibold">
      {children}
    </table>
  </div>
);
