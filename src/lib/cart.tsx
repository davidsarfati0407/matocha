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

/**
 * Cart (sale mode only — mounted by <SaleShell>).
 *
 * Lines are keyed by pack + recipe and counted in DOSES as well as items. The
 * unit price shown here is only a display copy; the server recomputes every
 * total from the catalogue at checkout and refuses anything that is not
 * purchasable (src/lib/commerce/cta.ts).
 */

export type CartLine = {
  id: string;
  packKey: string;
  recipeKey: string;
  name: string;
  dosesPerUnit: number;
  /** TTC euros, confirmed price at the time of adding. */
  unitPrice: number;
  quantity: number;
};

type State = { lines: CartLine[] };
type Action =
  | { type: "add"; line: Omit<CartLine, "id" | "quantity">; quantity: number }
  | { type: "set"; id: string; quantity: number }
  | { type: "hydrate"; lines: CartLine[] };

const KEY = "matocha-cart-v2";
const MAX = 12;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines };
    case "add": {
      const id = `${action.line.packKey}:${action.line.recipeKey}`;
      const found = state.lines.find((l) => l.id === id);
      if (found)
        return {
          lines: state.lines.map((l) =>
            l.id === id ? { ...l, quantity: Math.min(MAX, l.quantity + action.quantity) } : l,
          ),
        };
      return { lines: [...state.lines, { ...action.line, id, quantity: Math.min(MAX, action.quantity) }] };
    }
    case "set":
      return {
        lines:
          action.quantity <= 0
            ? state.lines.filter((l) => l.id !== action.id)
            : state.lines.map((l) => (l.id === action.id ? { ...l, quantity: Math.min(MAX, action.quantity) } : l)),
      };
  }
}

type Ctx = {
  lines: CartLine[];
  doses: number;
  subtotal: number;
  isOpen: boolean;
  /** Increments on each add — drives the M11 "fly to cart" animation. */
  pulse: number;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "id" | "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
};

const CartContext = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { lines: [] });
  const [isOpen, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as CartLine[]) : null;
      if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed });
    } catch {
      /* empty cart */
    }
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(state.lines));
    } catch {
      /* not persisted */
    }
  }, [state.lines]);

  const add = useCallback((line: Omit<CartLine, "id" | "quantity">, quantity = 1) => {
    dispatch({ type: "add", line, quantity });
    setPulse((p) => p + 1);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lines: state.lines,
      doses: state.lines.reduce((n, l) => n + l.quantity * l.dosesPerUnit, 0),
      subtotal: state.lines.reduce((n, l) => n + l.quantity * l.unitPrice, 0),
      isOpen,
      pulse,
      open: () => setOpen(true),
      close: () => setOpen(false),
      add,
      setQuantity: (id, quantity) => dispatch({ type: "set", id, quantity }),
    }),
    [state.lines, isOpen, pulse, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** For components that may render outside sale mode. */
export function useOptionalCart() {
  return useContext(CartContext);
}
