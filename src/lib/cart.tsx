"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { dailyBox, subscriptionPrice, type Product } from "@/data/product";

export type PurchaseMode = "one-time" | "subscription";

export type CartLine = {
  /** `${slug}:${mode}` — one-time and subscription are distinct lines. */
  id: string;
  slug: string;
  name: string;
  mode: PurchaseMode;
  /** Unit price in cents, already discounted for subscriptions. */
  unitPrice: number;
  quantity: number;
};

type CartState = { lines: CartLine[] };

type CartAction =
  | { type: "add"; product: Product; mode: PurchaseMode; quantity: number }
  | { type: "setQuantity"; id: string; quantity: number }
  | { type: "remove"; id: string }
  | { type: "hydrate"; lines: CartLine[] };

const STORAGE_KEY = "matocha-cart-v1";
const MAX_QUANTITY = 12;

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };

    case "add": {
      const id = `${action.product.slug}:${action.mode}`;
      const existing = state.lines.find((line) => line.id === id);
      if (existing) {
        return {
          lines: state.lines.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: Math.min(
                    line.quantity + action.quantity,
                    MAX_QUANTITY,
                  ),
                }
              : line,
          ),
        };
      }
      return {
        lines: [
          ...state.lines,
          {
            id,
            slug: action.product.slug,
            name: action.product.name,
            mode: action.mode,
            unitPrice:
              action.mode === "subscription"
                ? subscriptionPrice
                : action.product.price,
            quantity: Math.min(action.quantity, MAX_QUANTITY),
          },
        ],
      };
    }

    case "setQuantity": {
      if (action.quantity <= 0) {
        return { lines: state.lines.filter((line) => line.id !== action.id) };
      }
      return {
        lines: state.lines.map((line) =>
          line.id === action.id
            ? { ...line, quantity: Math.min(action.quantity, MAX_QUANTITY) }
            : line,
        ),
      };
    }

    case "remove":
      return { lines: state.lines.filter((line) => line.id !== action.id) };
  }
}

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (product: Product, mode?: PurchaseMode, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setIsOpen] = useState(false);
  /* Skips the write that would otherwise fire before the stored cart is read. */
  const firstWrite = useRef(true);

  // Restore a previous cart on mount. The server and the first client render
  // both start empty, so hydration always matches.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
      }
    } catch {
      // Corrupt or unavailable storage — start with an empty cart.
    }
  }, []);

  useEffect(() => {
    if (firstWrite.current) {
      firstWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // Quota or private mode — the cart simply will not persist.
    }
  }, [state.lines]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const add = useCallback(
    (product: Product, mode: PurchaseMode = "one-time", quantity = 1) => {
      dispatch({ type: "add", product, mode, quantity });
      setIsOpen(true);
    },
    [],
  );

  const value = useMemo<CartContextValue>(() => {
    const count = state.lines.reduce((total, line) => total + line.quantity, 0);
    const subtotal = state.lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice,
      0,
    );
    return {
      lines: state.lines,
      count,
      subtotal,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      setQuantity: (id, quantity) =>
        dispatch({ type: "setQuantity", id, quantity }),
      remove: (id) => dispatch({ type: "remove", id }),
    };
  }, [state.lines, isOpen, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}

/** Convenience for CTAs that always mean "the hero product". */
export const heroProduct = dailyBox;
