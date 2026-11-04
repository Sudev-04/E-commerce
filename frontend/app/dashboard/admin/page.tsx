"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Package, Users, Trash2, Plus, Pencil, Star, ExternalLink } from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import { clientFetch } from "@/lib/api";
import { formatCategory, formatPrice } from "@/lib/format";
import type { Product, User } from "@/types";
import ProductForm, { type ProductInput } from "./ProductForm";

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [featuredCount, setFeaturedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"products" | "users">("products");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const isAdmin = user?.role === "admin";

  // The server middleware already blocks non-admins; this covers a session
  // that expires while the page is open.
  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace(user ? "/dashboard?denied=admin" : "/auth/login?callbackUrl=/dashboard/admin");
  }, [isLoading, isAdmin, user, router]);

  const load = useCallback(async () => {
    try {
      const [pRes, uRes, fRes] = await Promise.all([
        clientFetch<{ data: Product[] }>("/api/products?limit=100&sort=newest"),
        clientFetch<{ data: User[] }>("/api/users"),
        clientFetch<{ data: Product[] }>("/api/products/featured"),
      ]);
      setProducts(pRes.data || []);
      setUsers(uRes.data || []);
      setFeaturedCount((fRes.data || []).length);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setDeleting(p.id);
    try {
      await clientFetch(`/api/products/${p.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async (data: ProductInput) => {
    if (editing === "new") {
      await clientFetch("/api/products", { method: "POST", body: JSON.stringify(data) });
    } else if (editing) {
      await clientFetch(`/api/products/${editing.id}`, { method: "PUT", body: JSON.stringify(data) });
    }
    setEditing(null);
    await load();
  };

  const closeForm = useCallback(() => setEditing(null), []);

  if (isLoading || !isAdmin || loading) {
    return <div className="page-container py-12"><div className="h-96 skeleton rounded-xl" /></div>;
  }

  return (
    <div className="page-container py-8 page-transition">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-700" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Manage products and users</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: products.length, icon: Package },
          { label: "Total Users", value: users.length, icon: Users },
          { label: "In Stock", value: products.filter((p) => p.stock > 0).length, icon: Package },
          { label: "Featured on Homepage", value: featuredCount, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              <span className="w-9 h-9 rounded-lg flex items-center justify-center text-primary-700 bg-primary-50">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4 border-b border-gray-200" role="tablist">
        {(["products", "users"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === tab ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab} ({tab === "products" ? products.length : users.length})
          </button>
        ))}
      </div>

      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {activeTab === "products" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Products</h2>
            <button onClick={() => setEditing("new")} className="flex items-center gap-1.5 text-sm btn-primary py-2 px-4">
              <Plus className="w-4 h-4" aria-hidden="true" /> Add Product
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Product", "Category", "Price", "Stock", "Rating", "Actions"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1 max-w-xs">
                        {p.name} {p.featured && <span className="badge bg-accent-100 text-accent-800 ml-1">Featured</span>}
                      </p>
                      <p className="text-xs text-gray-500">{p.brand}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="badge bg-gray-100 text-gray-600">{formatCategory(p.category)}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{formatPrice(p.deal?.basePrice ?? p.price)}</span>
                      {p.deal && <span className="block text-xs text-sale">Deal today: {formatPrice(p.price)}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.stock > 10 ? "bg-green-100 text-green-700" : p.stock > 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-amber-700 whitespace-nowrap">★ {p.rating}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link href={`/products/${p.id}`} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" aria-label={`View ${p.name}`} title="View">
                          <ExternalLink className="w-4 h-4" aria-hidden="true" />
                        </Link>
                        <button onClick={() => setEditing(p)} className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg" aria-label={`Edit ${p.name}`} title="Edit">
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          disabled={deleting === p.id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40"
                          aria-label={`Delete ${p.name}`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["User", "Email", "Role", "Joined"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0" aria-hidden="true">
                          {u.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize ${u.role === "admin" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700"}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && <ProductForm product={editing === "new" ? null : editing} onCancel={closeForm} onSave={handleSave} />}
    </div>
  );
}
