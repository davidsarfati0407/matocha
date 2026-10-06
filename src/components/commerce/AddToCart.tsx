"use client";

import { Button } from "@/components/ui/Button";
import { useOptionalCart, type CartLine } from "@/lib/cart";

/**
 * Rendered only when the server-side resolver returned `buy`. If, for any
 * reason, it renders without a cart (pre-launch shell), it renders nothing.
 */
export function AddToCart({
  line,
  label,
}: {
  line: Omit<CartLine, "id" | "quantity">;
  label: string;
}) {
  const cart = useOptionalCart();
  if (!cart) return null;
  return (
    <Button size="md" onClick={() => cart.add(line)}>
      {label}
    </Button>
  );
}
