"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import Link from "next/link";
import { useCart } from "../../components/CartProvider";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock === 0;

  const handleAdd = async () => {
    if (outOfStock) return;
    setAdding(true);
    const ok = await addToCart(product, qty);
    setAdding(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {!outOfStock && (
        <div className="flex items-center gap-4">
          <span id="qty-label" className="text-sm font-medium text-gray-700">Quantity</span>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden" role="group" aria-labelledby="qty-label">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2.5 hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-40"
              disabled={qty <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </button>
            <span className="w-12 text-center font-semibold text-gray-900" aria-live="polite">{qty}</span>
            <button
              onClick={() => setQty(Math.min(product.stock, qty + 1))}
              className="p-2.5 hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-40"
              disabled={qty >= product.stock}
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <span className="text-sm text-gray-500">{product.stock} available</span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={adding || outOfStock}
        className={`flex items-center justify-center gap-3 py-3.5 px-8 rounded-xl font-bold text-base transition-all duration-300 ${
          added
            ? "bg-green-600 text-white"
            : outOfStock
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-200"
        }`}
      >
        {adding ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Adding…
          </>
        ) : added ? (
          <>
            <Check className="w-5 h-5" aria-hidden="true" />
            Added to Cart
          </>
        ) : outOfStock ? (
          "Out of Stock"
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            Add to Cart · {formatPrice(product.price * qty)}
          </>
        )}
      </button>

      {added && (
        <Link href="/cart" className="text-center text-sm text-primary-600 hover:underline font-medium">
          View cart and check out →
        </Link>
      )}
    </div>
  );
}
