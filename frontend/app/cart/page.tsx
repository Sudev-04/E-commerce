"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { calcTotals, formatPrice, pluralize, FREE_SHIPPING_THRESHOLD } from "@/lib/format";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { cart, itemCount, isReady, removeFromCart, updateQuantity, clearCart, isLoading } = useCart();
  const router = useRouter();

  if (!isReady) {
    return (
      <div className="page-container py-12">
        <div className="h-96 skeleton rounded-xl" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="page-container py-20 text-center page-transition">
        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add some products to your cart and they&apos;ll appear here.</p>
        <Link href="/products" className="btn-primary inline-block">Start Shopping</Link>
      </div>
    );
  }

  const hasDealItem = cart.items.some((i) => i.freeDelivery);
  const { subtotal, shipping, gstIncluded, total } = calcTotals(cart.total, cart.items.length, hasDealItem);
  const toFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push("/checkout");
    } else {
      // The guest cart is merged into the account automatically after sign-in
      router.push(`/auth/login?callbackUrl=${encodeURIComponent("/checkout")}&message=${encodeURIComponent("Sign in to check out. Your cart will be saved.")}`);
    }
  };

  return (
    <div className="page-container py-8 page-transition">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/products" className="icon-btn" aria-label="Continue shopping">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
        <span className="badge bg-primary-100 text-primary-700">{pluralize(itemCount, "item")}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => (
            <div key={item.productId} className="card p-4 flex flex-wrap sm:flex-nowrap gap-4 items-center">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt="" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl" aria-hidden="true">📦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 text-sm">
                  {item.name}
                </Link>
                <p className="text-gray-600 text-sm mt-0.5">{formatPrice(item.price)} each</p>
              </div>

              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden" role="group" aria-label={`Quantity for ${item.name}`}>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1 || isLoading}
                  className="p-2 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
                  aria-label={`Decrease quantity of ${item.name}`}
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="w-10 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  disabled={isLoading || (item.stock !== undefined && item.quantity >= item.stock)}
                  className="p-2 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
                  aria-label={`Increase quantity of ${item.name}`}
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <div className="text-right min-w-[5.5rem]">
                <p className="font-bold text-gray-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  disabled={isLoading}
                  className="mt-1 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => { if (confirm("Remove all items from your cart?")) clearCart(); }}
              disabled={isLoading}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1.5 font-medium"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" /> Clear Cart
            </button>
            <Link href="/products" className="text-sm text-primary-600 hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>

            <dl className="space-y-3 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal ({pluralize(itemCount, "item")})</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Delivery</dt>
                <dd className={shipping === 0 ? "text-green-600 font-medium" : "text-gray-900"}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </dd>
              </div>
              {hasDealItem && (
                <p className="text-xs text-green-700 bg-green-50 rounded-lg p-2">
                  Free delivery: your cart has a Today&apos;s Deal item.
                </p>
              )}
              {toFreeShipping > 0 && !hasDealItem && (
                <p className="text-xs text-primary-700 bg-primary-50 rounded-lg p-2">
                  Add {formatPrice(toFreeShipping)} more for free delivery.
                </p>
              )}
              <div className="flex justify-between text-gray-500 text-xs">
                <dt>Includes GST (18%)</dt>
                <dd>{formatPrice(gstIncluded)}</dd>
              </div>
            </dl>

            <div className="border-t border-gray-200 pt-4 mb-5 flex justify-between">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-bold text-primary-700 text-xl">{formatPrice(total)}</span>
            </div>

            <button onClick={handleCheckout} disabled={isLoading} className="btn-primary w-full py-3.5 text-base">
              {isAuthenticated ? "Proceed to Checkout" : "Sign In to Checkout"}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" aria-hidden="true" /> Secure checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
