"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/Button";
import { formatEur } from "@/lib/proof";

/**
 * Cart drawer (sale mode only). Checkout is a hosted Stripe session created
 * server-side; the server re-validates every line. The success animation lives
 * on /commande/merci and plays only after the server has read a paid session.
 */
export function CartDrawer() {
  const { isOpen, close, lines, doses, subtotal, setQuantity } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const idem = useRef<string>("");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  async function checkout() {
    if (state === "loading") return;
    setState("loading");
    /* One idempotency key per attempt: a double click cannot create two sessions. */
    idem.current ||= crypto.randomUUID();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": idem.current },
        body: JSON.stringify({ lines: lines.map((l) => ({ packKey: l.packKey, recipeKey: l.recipeKey, quantity: l.quantity })) }),
      });
      const data = (await res.json()) as { url?: string; message?: string };
      if (!res.ok || !data.url) throw new Error(data.message ?? "Le paiement n'a pas pu démarrer.");
      window.location.assign(data.url);
    } catch (error) {
      idem.current = "";
      setState("error");
      setMessage(error instanceof Error ? error.message : "Le paiement n'a pas pu démarrer.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Panier">
      <button type="button" aria-label="Fermer le panier" onClick={close} className="absolute inset-0 bg-encre/45" />
      <div ref={panel} tabIndex={-1} className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-lait outline-none">
        <header className="flex items-center justify-between border-b border-encre/15 px-5 py-4">
          <h2 className="font-semibold">Panier · {doses} doses</h2>
          <button type="button" onClick={close} className="h-11 px-2 underline">Fermer</button>
        </header>
        <ul className="flex-1 overflow-y-auto px-5">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 border-b border-encre/10 py-4">
              <div>
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm">{l.dosesPerUnit} doses · {formatEur(l.unitPrice)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" aria-label={`Retirer une boîte ${l.name}`} className="h-9 w-9 border" onClick={() => setQuantity(l.id, l.quantity - 1)}>−</button>
                <span className="w-6 text-center tabular-nums">{l.quantity}</span>
                <button type="button" aria-label={`Ajouter une boîte ${l.name}`} className="h-9 w-9 border" onClick={() => setQuantity(l.id, l.quantity + 1)}>+</button>
              </div>
            </li>
          ))}
        </ul>
        <footer className="border-t border-encre/15 px-5 py-5">
          <p className="flex justify-between font-semibold"><span>Total TTC</span><span>{formatEur(subtotal)}</span></p>
          <p className="mt-1 text-sm">Frais de livraison calculés à l&apos;étape suivante.</p>
          <Button full className="mt-4" onClick={checkout} disabled={lines.length === 0 || state === "loading"}>
            {state === "loading" ? <span className="flex items-center gap-2"><span className="spinner" aria-hidden="true" /> Redirection…</span> : "Passer au paiement"}
          </Button>
          {state === "error" && <p role="alert" className="mt-3 text-sm">{message}</p>}
        </footer>
      </div>
    </div>
  );
}
