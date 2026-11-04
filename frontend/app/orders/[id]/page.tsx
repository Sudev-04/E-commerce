"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { clientFetch } from "@/lib/api";
import { formatPrice, pluralize } from "@/lib/format";
import type { Order } from "@/types";

const PAYMENT_LABELS = { cod: "Cash on Delivery", upi: "UPI", card: "Credit / Debit Card" } as const;

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const justPlaced = useSearchParams().get("placed") === "1";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clientFetch<{ data: Order }>(`/api/orders/${encodeURIComponent(params.id)}`)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.status === 404 ? "We couldn't find that order." : err.message));
  }, [params.id]);

  if (error) {
    return (
      <div className="page-container py-20 text-center">
        <p className="text-lg font-semibold text-gray-900">{error}</p>
        <Link href="/orders" className="btn-primary inline-block mt-6">View My Orders</Link>
      </div>
    );
  }

  if (!order) {
    return <div className="page-container py-12 max-w-3xl"><div className="h-96 skeleton rounded-xl" /></div>;
  }

  const count = order.items.reduce((a, i) => a + i.quantity, 0);
  const a = order.shippingAddress;

  return (
    <div className="page-container py-8 page-transition max-w-3xl">
      {justPlaced && (
        <div className="card p-6 mb-6 text-center border-green-200 bg-green-50">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900">Thank you! Your order is confirmed.</h1>
          <p className="text-gray-600 mt-1">Order <span className="font-semibold">{order.id}</span> will be delivered to {a.city} in 3–5 business days.</p>
        </div>
      )}

      {!justPlaced && <h1 className="text-2xl font-bold text-gray-900 mb-6">Order {order.id}</h1>}

      <div className="card p-6 mb-4">
        <div className="flex flex-wrap justify-between gap-2 mb-4">
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          <span className="badge bg-green-100 text-green-700 capitalize">{order.status}</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center gap-3 py-3">
              <div className="relative w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image && <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`} className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1">{item.name}</Link>
                <p className="text-xs text-gray-500">{formatPrice(item.price)} × {item.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 text-sm border-t border-gray-100 pt-4 mt-2">
          <div className="flex justify-between text-gray-600"><dt>Subtotal ({pluralize(count, "item")})</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between text-gray-600"><dt>Delivery</dt><dd>{order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}</dd></div>
          <div className="flex justify-between text-gray-500 text-xs"><dt>Includes GST (18%)</dt><dd>{formatPrice(order.gstIncluded)}</dd></div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Delivery address</h2>
          <address className="not-italic text-sm text-gray-600 leading-relaxed">
            {a.fullName}<br />{a.line1}{a.line2 ? <>, {a.line2}</> : null}<br />{a.city}, {a.state} {a.pincode}<br />Phone: {a.phone}
          </address>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Payment</h2>
          <p className="text-sm text-gray-600">{PAYMENT_LABELS[order.paymentMethod]}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Link href="/orders" className="btn-secondary">All Orders</Link>
        <Link href="/products" className="btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}
