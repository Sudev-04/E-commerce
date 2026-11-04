"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { CATEGORY_META } from "@/lib/format";
import type { Product } from "@/types";

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  tags: string[];
  featured: boolean;
}

interface Props {
  product: Product | null; // null = create
  onCancel: () => void;
  onSave: (data: ProductInput) => Promise<void>;
}

export default function ProductForm({ product, onCancel, onSave }: Props) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    // Edit the regular price; today's deal discount is applied automatically
    price: product ? String(product.deal?.basePrice ?? product.price) : "",
    originalPrice: product ? String(product.originalPrice) : "",
    category: product?.category ?? "electronics",
    brand: product?.brand ?? "",
    stock: product ? String(product.stock) : "",
    images: product?.images.join("\n") ?? "",
    tags: product?.tags.join(", ") ?? "",
    featured: product?.featured ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const price = Number(form.price);
    const originalPrice = form.originalPrice ? Number(form.originalPrice) : price;
    if (originalPrice < price) {
      setError("MRP must be the same as or higher than the selling price.");
      return;
    }
    const images = form.images.split(/\s+/).map((s) => s.trim()).filter(Boolean);
    if (images.some((url) => !url.startsWith("https://images.unsplash.com/"))) {
      setError("Image URLs must start with https://images.unsplash.com/ (the only image host the site allows).");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        originalPrice,
        category: form.category,
        brand: form.brand.trim(),
        stock: Number(form.stock),
        images,
        tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        featured: form.featured,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the product.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 id="product-form-title" className="font-bold text-lg text-gray-900">{product ? "Edit product" : "Add product"}</h2>
          <button onClick={onCancel} aria-label="Close" className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
            <input ref={firstField} id="pf-name" className="input-field" value={form.name} onChange={set("name")} required />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-desc" className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea id="pf-desc" className="input-field min-h-[90px]" value={form.description} onChange={set("description")} required />
          </div>
          <div>
            <label htmlFor="pf-price" className="text-sm font-medium text-gray-700 block mb-1.5">Selling price (₹)</label>
            <input id="pf-price" type="number" min={0} step="1" className="input-field" value={form.price} onChange={set("price")} required />
          </div>
          <div>
            <label htmlFor="pf-mrp" className="text-sm font-medium text-gray-700 block mb-1.5">MRP (₹) <span className="text-gray-400 font-normal">optional</span></label>
            <input id="pf-mrp" type="number" min={0} step="1" className="input-field" value={form.originalPrice} onChange={set("originalPrice")} />
          </div>
          <div>
            <label htmlFor="pf-category" className="text-sm font-medium text-gray-700 block mb-1.5">Category</label>
            <select id="pf-category" className="input-field" value={form.category} onChange={set("category")}>
              {Object.entries(CATEGORY_META).map(([slug, { label }]) => <option key={slug} value={slug}>{label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-brand" className="text-sm font-medium text-gray-700 block mb-1.5">Brand</label>
            <input id="pf-brand" className="input-field" value={form.brand} onChange={set("brand")} required />
          </div>
          <div>
            <label htmlFor="pf-stock" className="text-sm font-medium text-gray-700 block mb-1.5">Stock</label>
            <input id="pf-stock" type="number" min={0} step="1" className="input-field" value={form.stock} onChange={set("stock")} required />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 pb-2.5">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-primary-600" />
              Featured on homepage
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-images" className="text-sm font-medium text-gray-700 block mb-1.5">Image URLs <span className="text-gray-400 font-normal">(one per line, images.unsplash.com)</span></label>
            <textarea id="pf-images" className="input-field min-h-[70px] font-mono text-xs" value={form.images} onChange={set("images")} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-tags" className="text-sm font-medium text-gray-700 block mb-1.5">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input id="pf-tags" className="input-field" value={form.tags} onChange={set("tags")} />
          </div>

          {error && <div role="alert" className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {product ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
