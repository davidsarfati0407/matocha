import { requireAdmin } from "@/lib/admin-auth";
import { saleChecklist } from "@/lib/ops/checklist";
import { getSetting } from "@/lib/ops/settings";
import { getSiteMode } from "@/lib/mode";
import { proposeModeAction, setFlagAction } from "../actions";
import { AdminShell } from "../_ui";

export default async function ModePage() {
  const admin = await requireAdmin();
  const [mode, checklist, legal, shipping] = await Promise.all([
    getSiteMode(),
    saleChecklist(),
    getSetting<boolean>("legal_pages_complete"),
    getSetting<boolean>("shipping_configured"),
  ]);
  const unlock = process.env.SITE_MODE_SALE_UNLOCK === "true";

  return (
    <AdminShell email={admin.email} title="Mode du site">
      <p className="text-lg">
        Mode actuel : <strong>{mode === "sale" ? "Vente" : "Pré-lancement"}</strong>
      </p>
      <p className="mt-2 max-w-[70ch] text-sm opacity-75">
        Le mode vente exige deux verrous : la variable de déploiement <code>SITE_MODE_SALE_UNLOCK=true</code> (
        {unlock ? "présente" : "absente"}) et une demande approuvée dont la checklist ci-dessous passe au moment de
        l&apos;approbation.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Checklist bloquante</h2>
      <ul className="mt-3 space-y-2">
        {checklist.items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span aria-hidden="true">{item.ok ? "✓" : "✗"}</span>
            <span>
              <span className="sr-only">{item.ok ? "Validé : " : "Non validé : "}</span>
              {item.label}
              {item.detail && <span className="block text-sm opacity-70">{item.detail}</span>}
            </span>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-semibold">Déclarations manuelles</h2>
      <div className="mt-3 space-y-3">
        {(
          [
            ["legal_pages_complete", "Pages légales relues et complètes", legal === true],
            ["shipping_configured", "Livraison configurée (transporteur, tarifs, délais)", shipping === true],
          ] as const
        ).map(([key, label, on]) => (
          <form key={key} action={setFlagAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="key" value={key} />
            <input type="hidden" name="value" value={on ? "false" : "true"} />
            <span>
              {label} : <strong>{on ? "oui" : "non"}</strong>
            </span>
            <button className="border border-current/40 px-3 py-1 text-sm">{on ? "Marquer non" : "Marquer oui"}</button>
          </form>
        ))}
      </div>

      <h2 className="mt-10 text-lg font-semibold">Proposer un changement</h2>
      <form action={proposeModeAction} className="mt-3 flex flex-wrap gap-3">
        <input type="hidden" name="mode" value={mode === "sale" ? "prelaunch" : "sale"} />
        <button className="bg-[#1E3A2A] px-5 py-2.5 font-semibold text-[#EEEDE0]">
          {mode === "sale" ? "Proposer le retour en pré-lancement" : "Proposer le passage en vente"}
        </button>
      </form>
      <p className="mt-2 text-sm opacity-70">La demande apparaît dans « Demandes » et doit être approuvée.</p>
    </AdminShell>
  );
}
