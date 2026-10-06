import type { Proof } from "@/content/catalog/types";
import { requireAdmin } from "@/lib/admin-auth";
import { getCatalog } from "@/lib/catalog";
import { AdminShell, StatusBadge, Table } from "../_ui";

const show = (p: Proof<unknown>) => (p.value === null ? "—" : typeof p.value === "object" ? JSON.stringify(p.value) : String(p.value));

const RECIPE_FIELDS = [
  ["denomination", "Dénomination"],
  ["ingredients", "Ingrédients"],
  ["allergens", "Allergènes"],
  ["matchaPerServingG", "Matcha / portion (g)"],
  ["servingTotal", "Portion totale"],
  ["origin", "Origine"],
  ["preparation", "Préparation"],
  ["storage", "Conservation"],
  ["nutrition", "Nutrition"],
  ["caffeineMg", "Caféine (mg)"],
] as const;

export default async function CatalogPage() {
  const admin = await requireAdmin();
  const catalog = await getCatalog();
  return (
    <AdminShell email={admin.email} title="Catalogue et preuves">
      <p className="max-w-[70ch] opacity-80">
        Lecture seule. Les modifications passent par l&apos;API Ops (l&apos;agent) et les confirmations par une demande
        de validation.
      </p>

      <h2 className="mt-10 text-lg font-semibold">Packs</h2>
      <Table>
        <thead>
          <tr>
            <th>Clé</th>
            <th>Doses</th>
            <th>Prix TTC</th>
            <th>Quantité nette</th>
            <th>Statut commercial</th>
          </tr>
        </thead>
        <tbody>
          {catalog.packs.map((p) => (
            <tr key={p.key}>
              <td className="font-mono text-xs">{p.key}</td>
              <td>
                {p.doses} <StatusBadge status={p.dosesStatus} />
              </td>
              <td>
                {show(p.price)} <StatusBadge status={p.price.status} />
              </td>
              <td>
                {show(p.netQuantity)} <StatusBadge status={p.netQuantity.status} />
              </td>
              <td>{p.commercialStatus}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {catalog.recipes.map((r) => (
        <section key={r.key} className="mt-10">
          <h2 className="text-lg font-semibold">
            {r.key} <span className="text-sm font-normal opacity-70">({r.status})</span>
          </h2>
          <Table>
            <tbody>
              {RECIPE_FIELDS.map(([field, label]) => {
                const proof = r[field] as Proof<unknown>;
                return (
                  <tr key={field}>
                    <td className="w-56">{label}</td>
                    <td>
                      <StatusBadge status={proof.status} />
                    </td>
                    <td className="font-mono text-xs">{show(proof)}</td>
                    <td className="text-xs opacity-70">{proof.target ?? ""}</td>
                    <td className="text-xs opacity-70">{proof.source ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </section>
      ))}

      <h2 className="mt-10 text-lg font-semibold">Société</h2>
      <Table>
        <tbody>
          {Object.entries(catalog.company).map(([field, proof]) => (
            <tr key={field}>
              <td className="w-56">{field}</td>
              <td>
                <StatusBadge status={proof.status} />
              </td>
              <td>{show(proof)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </AdminShell>
  );
}
