"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Lock, Banknote, Smartphone, CreditCard } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { clientFetch } from "@/lib/api";
import { calcTotals, formatPrice, pluralize } from "@/lib/format";
import type { Order, PaymentMethod, ShippingAddress } from "@/types";

const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; desc: string; icon: typeof Banknote }[] = [
  { value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Banknote },
  { value: "upi", label: "UPI", desc: "Google Pay, PhonePe, Paytm and more", icon: Smartphone },
  { value: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: CreditCard },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, itemCount, isReady, resetCart } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setAddress((a) => ({ ...a, [field]: e.target.value }));

  if (!isReady) {
    return <div className="page-container py-12"><div className="h-96 skeleton rounded-xl" /></div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Add something to your cart before checking out.</p>
        <Link href="/products" className="btn-primary inline-block">Browse Products</Link>
      </div>
    );
  }

  const { subtotal, shipping, gstIncluded, total } = calcTotals(cart.total, cart.items.length);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPlacing(true);
    try {
      const res = await clientFetch<{ data: Order }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: { ...address, fullName: address.fullName || user?.name || "" },
          paymentMethod: payment,
        }),
      });
      resetCart();
      router.push(`/orders/${res.data.id}?placed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="page-container py-8 page-transition">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={placeOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <section className="card p-6" aria-labelledby="address-heading">
            <h2 id="address-heading" className="font-bold text-gray-900 text-lg mb-4">Delivery Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
                <input id="fullName" className="input-field" value={address.fullName} onChange={set("fullName")} placeholder={user?.name || "Your name"} required autoComplete="name" />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-gray-700 block mb-1.5">Mobile number</label>
                <input id="phone" className="input-field" value={address.phone} onChange={set("phone")} placeholder="10-digit mobile number" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} title="Enter a valid 10-digit Indian mobile number" autoComplete="tel-national" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line1" className="text-sm font-medium text-gray-700 block mb-1.5">Address</label>
                <input id="line1" className="input-field" value={address.line1} onChange={set("line1")} placeholder="House no., building, street" required autoComplete="address-line1" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="line2" className="text-sm font-medium text-gray-700 block mb-1.5">Landmark / Area <span className="text-gray-400 font-normal">(optional)</span></label>
                <input id="line2" className="input-field" value={address.line2} onChange={set("line2")} autoComplete="address-line2" />
              </div>
              <div>
                <label htmlFor="city" className="text-sm font-medium text-gray-700 block mb-1.5">City</label>
                <input id="city" className="input-field" value={address.city} onChange={set("city")} required autoComplete="address-level2" />
              </div>
              <div>
                <label htmlFor="pincode" className="text-sm font-medium text-gray-700 block mb-1.5">PIN code</label>
                <input id="pincode" className="input-field" value={address.pincode} onChange={set("pincode")} required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} title="Enter a valid 6-digit PIN code" autoComplete="postal-code" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="state" className="text-sm font-medium text-gray-700 block mb-1.5">State</label>
                <select id="state" className="input-field" value={address.state} onChange={set("state")} required autoComplete="address-level1">
                  <option value="" disabled>Select state</option>
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Payment */}
          <fieldset className="card p-6">
            <legend className="sr-only">Payment method</legend>
            <h2 className="font-bold text-gray-900 text-lg mb-1" aria-hidden="true">Payment Method</h2>
            <p className="text-xs text-gray-500 mb-4">Demo store: no real payment is taken.</p>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    payment === value ? "border-primary-600 bg-primary-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input type="radio" name="payment" value={value} checked={payment === value} onChange={() => setPayment(value)} className="accent-primary-600" />
                  <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{label}</span>
                    <span className="block text-xs text-gray-500">{desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-20">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Order Summary</h2>
            <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image && <Image src={item.image} alt="" fill className="object-cover" sizes="48px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600"><dt>Subtotal ({pluralize(itemCount, "item")})</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between text-gray-600"><dt>Delivery</dt><dd className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</dd></div>
              <div className="flex justify-between text-gray-500 text-xs"><dt>Includes GST (18%)</dt><dd>{formatPrice(gstIncluded)}</dd></div>
            </dl>
            <div className="border-t border-gray-200 mt-4 pt-4 mb-5 flex justify-between">
              <span className="font-bold text-gray-900 text-lg">Total</span>
              <span className="font-bold text-primary-700 text-xl">{formatPrice(total)}</span>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {error} {error.includes("stock") || error.includes("available") ? <Link href="/cart" className="underline font-medium">Review cart</Link> : null}
              </div>
            )}

            <button type="submit" disabled={placing} className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2">
              {placing ? <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Placing order…</> : <>Place Order · {formatPrice(total)}</>}
            </button>
            <p className="text-xs text-center text-gray-500 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" aria-hidden="true" /> Your details are sent securely
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
