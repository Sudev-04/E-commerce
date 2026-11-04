"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { clientFetch } from "@/lib/api";
import { formatPrice, pluralize, ORDER_STATUS } from "@/lib/format";
import type { Order } from "@/types";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    clientFetch<{ data: Order[] }>("/api/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message || "Could not load your orders."));
  }, []);

  return (
    <div className="page-container py-8 page-transition max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {!orders && !error && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-xl" />)}</div>}

      {orders && orders.length === 0 && (
        <div className="card p-10 text-center">
          <Package className="w-14 h-14 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900">No orders yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">When you place an order it will show up here.</p>
          <Link href="/products" className="btn-primary inline-block">Start Shopping</Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => {
            const count = order.items.reduce((a, i) => a + i.quantity, 0);
            return (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">Order {order.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {pluralize(count, "item")}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">{order.items.map((i) => i.name).join(", ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`badge ${ORDER_STATUS[order.status]?.className ?? "bg-gray-100 text-gray-700"}`}>{ORDER_STATUS[order.status]?.label ?? order.status}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
