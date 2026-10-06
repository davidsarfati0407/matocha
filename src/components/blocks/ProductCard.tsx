import { ButtonLink } from "@/components/ui/Button";
import { AddToCart } from "@/components/commerce/AddToCart";
import { ProofValue } from "./ProofValue";
import { fr } from "@/content/i18n/fr";
import type { productView } from "@/lib/view";
import { cn } from "@/lib/utils";

/** One product, one price, one CTA. */
export function ProductCard({ product, className }: { product: ReturnType<typeof productView>; className?: string }) {
  return (
    <article id="acheter" className={cn("scroll-mt-24 border-2 border-foret bg-lait p-6", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="concept-tag">{product.statusLabel}</span>
        {product.devLabel && <span className="concept-tag">{product.devLabel}</span>}
      </div>
      <h3 className="mt-4 text-3xl u-caps">{product.packName}</h3>
      <p className="mt-1 text-lg">{product.recipeName}</p>
      <dl className="mt-5 grid gap-3 border-t border-encre/15 pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-semibold">{fr.product.contents}</dt>
          <dd className="mt-1">{product.contents}</dd>
          <dd className="text-sm">
            <ProofValue value={product.netQuantity} />
          </dd>
        </div>
        <div>
          <dt className="text-sm font-semibold">{fr.product.price}</dt>
          <dd className={cn("mt-1", product.price ? "text-2xl" : "pending")}>{product.price ?? fr.status.priceAbsent}</dd>
          {product.perDrink && (
            <dd className="text-sm">
              {product.perDrink} {fr.product.perDrink}
            </dd>
          )}
        </div>
      </dl>
      <div className="mt-6">
        {product.cta.kind === "interest" && <ButtonLink href={product.cta.href}>{product.cta.label}</ButtonLink>}
        {product.cta.kind === "buy" && <AddToCart line={product.cta.line} label={product.cta.label} />}
      </div>
    </article>
  );
}
