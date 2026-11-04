"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Check, Zap } from "lucide-react";
import Link from "next/link";
import { useCart } from "../../components/CartProvider";
import { buyNowUrl, formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { cart, addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stock === 0;

  // Read from the cart so "Added to cart" stays for as long as the item is there
  const inCartQty = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const inCart = inCartQty > 0;
  const maxQty = Math.max(1, product.stock);

  const handleAdd = async () => {
    if (outOfStock) return;
    setAdding(true);
    await addToCart(product, qty);
    setAdding(false);
  };

  if (outOfStock) {
    return (
      <button disabled className="py-3.5 px-8 rounded-xl font-bold text-base bg-gray-200 text-gray-500 cursor-not-allowed">
        Out of Stock
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
            onClick={() => setQty(Math.min(maxQty, qty + 1))}
            className="p-2.5 hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-40"
            disabled={qty >= maxQty}
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <span className="text-sm text-gray-500">{product.stock} available</span>
      </div>

      {inCart && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <Check className="w-4 h-4" aria-hidden="true" />
          Added to cart: {inCartQty} in your cart
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inCart ? (
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base border-2 border-green-600 text-green-700 hover:bg-green-50 transition-colors"
          >
            <Check className="w-5 h-5" aria-hidden="true" /> Go to Cart
          </Link>
        ) : (
          <button
            onClick={handleAdd}
            disabled={adding}
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base border-2 border-primary-600 text-primary-700 hover:bg-primary-50 transition-colors disabled:opacity-60"
          >
            {adding ? (
              <><div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" /> Adding…</>
            ) : (
              <><ShoppingCart className="w-5 h-5" aria-hidden="true" /> Add to Cart</>
            )}
          </button>
        )}

        <button
          onClick={() => router.push(buyNowUrl(product.id, qty))}
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-lg shadow-primary-200 transition-all"
        >
          <Zap className="w-5 h-5" aria-hidden="true" /> Buy Now · {formatPrice(product.price * qty)}
        </button>
      </div>

      {inCart && (
        <button onClick={handleAdd} disabled={adding} className="text-sm text-primary-600 hover:underline font-medium w-fit">
          + Add {qty} more to cart
        </button>
      )}
    </div>
  );
}
