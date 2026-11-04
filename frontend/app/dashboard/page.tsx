"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Package, User, LogOut, ClipboardList, Star, Shield } from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import { useCart } from "../components/CartProvider";
import { clientFetch } from "@/lib/api";
import { formatPrice, pluralize, ORDER_STATUS } from "@/lib/format";
import type { Order } from "@/types";

function DeniedNotice() {
  const denied = useSearchParams().get("denied") === "admin";
  if (!denied) return null;
  return (
    <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-6 text-sm">
      The admin panel is only available to administrator accounts.
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { cart, itemCount } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  // If the session turned out to be invalid, go to sign-in instead of rendering blank
  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth/login?callbackUrl=/dashboard");
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    clientFetch<{ data: Order[] }>("/api/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="page-container py-12">
        <div className="space-y-4">
          <div className="h-10 w-64 skeleton rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const stats = [
    { label: "Cart", value: pluralize(itemCount, "item"), icon: ShoppingCart, link: "/cart" },
    { label: "Orders", value: orders ? String(orders.length) : "…", icon: ClipboardList, link: "/orders" },
    { label: "Account Type", value: isAdmin ? "Admin" : "Member", icon: isAdmin ? Shield : User, link: isAdmin ? "/dashboard/admin" : "/dashboard" },
  ];

  return (
    <div className="page-container py-8 page-transition">
      <Suspense fallback={null}><DeniedNotice /></Suspense>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-gray-500 mt-1">{user.email}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, link }) => (
          <Link key={label} href={link} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-50 text-primary-700">
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { href: "/products", icon: Package, label: "Browse Products", desc: "Explore the catalogue" },
              { href: "/cart", icon: ShoppingCart, label: `View Cart (${pluralize(itemCount, "item")})`, desc: `Subtotal: ${formatPrice(cart.total)}` },
              { href: "/orders", icon: ClipboardList, label: "My Orders", desc: "Track and review your orders" },
              { href: "/products?featured=true", icon: Star, label: "Featured Products", desc: "Hand-picked favourites" },
              ...(isAdmin ? [{ href: "/dashboard/admin", icon: Shield, label: "Admin Panel", desc: "Manage products and users" }] : []),
            ].map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-primary-600 hover:underline">View all</Link>
          </div>
          {!orders ? (
            <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-12 skeleton rounded-lg" />)}</div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500">You haven&apos;t placed any orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {orders.slice(0, 4).map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${o.id}`} className="flex justify-between items-center py-3 hover:text-primary-600">
                    <span className="text-sm">
                      <span className="font-medium text-gray-900">{o.id}</span>
                      <span className="block text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-sm font-semibold">{formatPrice(o.total)}</span>
                      <span className={`badge ${ORDER_STATUS[o.status]?.className ?? ""}`}>{ORDER_STATUS[o.status]?.label ?? o.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mt-4">
            <span className="font-medium">Member since:</span>{" "}
            {new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}
