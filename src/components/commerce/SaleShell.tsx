import { CartProvider } from "@/lib/cart";
import { CartButton } from "./CartButton";
import { CartDrawer } from "./CartDrawer";

/**
 * Server component. In pre-launch the cart code is not rendered at all, so it
 * is never shipped to the browser and no purchase control can appear by
 * accident. In sale mode it wraps the page with the cart context.
 */
export function SaleShell({
  enabled,
  header,
  children,
}: {
  enabled: boolean;
  header: (cart: React.ReactNode) => React.ReactNode;
  children: React.ReactNode;
}) {
  if (!enabled) {
    return (
      <>
        {header(null)}
        {children}
      </>
    );
  }
  return (
    <CartProvider>
      {header(<CartButton />)}
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
