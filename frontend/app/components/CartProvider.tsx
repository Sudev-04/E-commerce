"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import type { Cart, CartItem, Product } from "@/types";
import { clientFetch } from "@/lib/api";
import { useAuth } from "./AuthProvider";

interface CartContextType {
  cart: Cart;
  itemCount: number;
  /** True until the cart has been loaded for the current visitor. */
  isReady: boolean;
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  resetCart: () => void;
}

type Notice = { type: "success" | "error"; message: string; showCartLink?: boolean };

const GUEST_KEY = "sn_guest_cart";
const emptyCart: Cart = { items: [], total: 0, updatedAt: null };

const CartContext = createContext<CartContextType>({
  cart: emptyCart,
  itemCount: 0,
  isReady: false,
  isLoading: false,
  addToCart: async () => false,
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  fetchCart: async () => {},
  resetCart: () => {},
});

// ─── Guest cart (browser storage; holds only public product info) ───────────
function readGuestItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function writeGuestItems(items: CartItem[]) {
  try {
    if (items.length) localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    // storage unavailable — the guest cart simply won't persist across reloads
  }
}

const toCart = (items: CartItem[]): Cart => ({
  items,
  total: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
  updatedAt: new Date().toISOString(),
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();

  const notify = useCallback((n: Notice) => {
    setNotice(n);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(toCart(readGuestItems()));
      return;
    }
    try {
      const res = await clientFetch<{ data: Cart }>("/api/cart");
      setCart(res.data);
    } catch {
      // keep the current cart; the next action will retry
    }
  }, [isAuthenticated]);

  // Load the cart on every page as soon as we know who the visitor is, so the
  // header badge is correct everywhere. Merge any guest cart after sign-in.
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    (async () => {
      if (!isAuthenticated) {
        if (!cancelled) setCart(toCart(readGuestItems()));
      } else {
        const guestItems = readGuestItems();
        // Take the guest cart out of storage *before* sending it, so a second
        // run (e.g. a page load while this request is in flight) can't merge
        // the same items twice. It is put back if the merge fails.
        if (guestItems.length) writeGuestItems([]);
        try {
          const res = guestItems.length
            ? await clientFetch<{ data: Cart }>("/api/cart/merge", {
                method: "POST",
                body: JSON.stringify({
                  items: guestItems.map(({ productId, quantity }) => ({ productId, quantity })),
                }),
              })
            : await clientFetch<{ data: Cart }>("/api/cart");
          if (!cancelled) setCart(res.data);
        } catch {
          if (guestItems.length) writeGuestItems(guestItems);
          if (!cancelled) setCart(emptyCart);
        }
      }
      if (!cancelled) setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user?.id]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1) => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const res = await clientFetch<{ data: Cart }>("/api/cart/add", {
            method: "POST",
            body: JSON.stringify({ productId: product.id, quantity }),
          });
          setCart(res.data);
        } else {
          const items = readGuestItems();
          const existing = items.find((i) => i.productId === product.id);
          const newQty = (existing?.quantity ?? 0) + quantity;
          if (newQty > product.stock) {
            throw new Error(`Only ${product.stock} in stock.`);
          }
          const next = existing
            ? items.map((i) => (i.productId === product.id ? { ...i, quantity: newQty } : i))
            : [
                ...items,
                {
                  productId: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  quantity,
                  stock: product.stock,
                },
              ];
          writeGuestItems(next);
          setCart(toCart(next));
        }
        notify({ type: "success", message: `${product.name} added to cart`, showCartLink: true });
        return true;
      } catch (err) {
        notify({ type: "error", message: err instanceof Error ? err.message : "Could not add to cart." });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, notify]
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const res = await clientFetch<{ data: Cart }>(`/api/cart/remove/${encodeURIComponent(productId)}`, {
            method: "DELETE",
          });
          setCart(res.data);
        } else {
          const next = readGuestItems().filter((i) => i.productId !== productId);
          writeGuestItems(next);
          setCart(toCart(next));
        }
      } catch (err) {
        notify({ type: "error", message: err instanceof Error ? err.message : "Could not remove item." });
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, notify]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) return;
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          const res = await clientFetch<{ data: Cart }>("/api/cart/update", {
            method: "PUT",
            body: JSON.stringify({ productId, quantity }),
          });
          setCart(res.data);
        } else {
          const items = readGuestItems();
          const item = items.find((i) => i.productId === productId);
          if (item?.stock !== undefined && quantity > item.stock) {
            throw new Error(`Only ${item.stock} in stock.`);
          }
          const next = items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
          writeGuestItems(next);
          setCart(toCart(next));
        }
      } catch (err) {
        notify({ type: "error", message: err instanceof Error ? err.message : "Could not update quantity." });
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, notify]
  );

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        await clientFetch("/api/cart/clear", { method: "DELETE" });
      } else {
        writeGuestItems([]);
      }
      setCart(emptyCart);
    } catch (err) {
      notify({ type: "error", message: err instanceof Error ? err.message : "Could not clear the cart." });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, notify]);

  /** Local reset after an order is placed (the server already emptied the cart). */
  const resetCart = useCallback(() => setCart(emptyCart), []);

  const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ cart, itemCount, isReady, isLoading, addToCart, removeFromCart, updateQuantity, clearCart, fetchCart, resetCart }}
    >
      {children}

      {/* Toast */}
      <div aria-live="polite" className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 z-[60] flex justify-center sm:justify-end pointer-events-none">
        {notice && (
          <div
            role="status"
            className={`pointer-events-auto flex items-center gap-3 rounded-xl shadow-lg border px-4 py-3 text-sm max-w-sm w-full sm:w-auto page-transition ${
              notice.type === "success"
                ? "bg-white border-gray-200 text-gray-900"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {notice.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" aria-hidden="true" />
            )}
            <span className="flex-1 line-clamp-2">{notice.message}</span>
            {notice.showCartLink && (
              <Link href="/cart" className="font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap" onClick={() => setNotice(null)}>
                View cart
              </Link>
            )}
            <button onClick={() => setNotice(null)} aria-label="Dismiss notification" className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
