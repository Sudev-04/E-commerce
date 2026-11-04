"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { formatCategory } from "@/lib/format";

interface Props {
  categories: string[];
  currentFilters: Record<string, string | undefined>;
  mobile?: boolean;
}

const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rating" },
  { value: "discount", label: "Biggest Discount" },
  { value: "newest", label: "Newest" },
];

const FILTER_KEYS = ["category", "search", "sort", "minPrice", "maxPrice", "featured", "deals"];

export default function ProductFiltersClient({ categories, currentFilters, mobile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idPrefix = mobile ? "m-" : "d-";

  const [search, setSearch] = useState(currentFilters.search || "");
  const [minPrice, setMinPrice] = useState(currentFilters.minPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentFilters.maxPrice || "");
  const [showMobile, setShowMobile] = useState(false);

  // Keep inputs in sync when filters change via links (e.g. the header search)
  useEffect(() => {
    setSearch(currentFilters.search || "");
    setMinPrice(currentFilters.minPrice || "");
    setMaxPrice(currentFilters.maxPrice || "");
  }, [currentFilters.search, currentFilters.minPrice, currentFilters.maxPrice]);

  const pushParams = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  const clearAll = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ search: search.trim() });
  };

  const handlePrice = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ minPrice, maxPrice });
  };

  const hasFilters = FILTER_KEYS.some((k) => Boolean(currentFilters[k]));

  // Rendered as a plain function call (not <Component />) so the inputs keep
  // focus while typing — this is what makes the Enter key search work.
  const renderFilters = () => (
    <div className="space-y-5">
      {/* Search */}
      <div>
        <label htmlFor={`${idPrefix}search`} className="text-sm font-semibold text-gray-700 mb-2 block">Search</label>
        <form onSubmit={handleSearch} role="search" className="flex gap-2">
          <input
            id={`${idPrefix}search`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="input-field text-sm py-2"
            enterKeyHint="search"
          />
          <button type="submit" aria-label="Search" className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex-shrink-0">
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Deals */}
      <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={currentFilters.deals === "true"}
          onChange={(e) => pushParams({ deals: e.target.checked ? "true" : "" })}
          className="w-4 h-4 accent-primary-600"
        />
        Today&apos;s Deals only <span className="text-xs font-normal text-gray-500">(extra off + free delivery)</span>
      </label>

      {/* Category */}
      <fieldset>
        <legend className="text-sm font-semibold text-gray-700 mb-2 block">Category</legend>
        <div className="space-y-1">
          {[{ slug: "", label: "All Categories" }, ...categories.map((slug) => ({ slug, label: formatCategory(slug) }))].map(
            ({ slug, label }) => {
              const active = (currentFilters.category || "") === slug;
              return (
                <button
                  key={slug || "all"}
                  onClick={() => pushParams({ category: slug })}
                  aria-pressed={active}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-primary-50 text-primary-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>
      </fieldset>

      {/* Sort */}
      <div>
        <label htmlFor={`${idPrefix}sort`} className="text-sm font-semibold text-gray-700 mb-2 block">Sort By</label>
        <select
          id={`${idPrefix}sort`}
          value={currentFilters.sort || ""}
          onChange={(e) => pushParams({ sort: e.target.value })}
          className="input-field text-sm py-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <form onSubmit={handlePrice}>
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2 block">Price Range (₹)</legend>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor={`${idPrefix}min`}>Minimum price in rupees</label>
            <input
              id={`${idPrefix}min`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="input-field text-sm py-2 w-1/2"
            />
            <label className="sr-only" htmlFor={`${idPrefix}max`}>Maximum price in rupees</label>
            <input
              id={`${idPrefix}max`}
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="input-field text-sm py-2 w-1/2"
            />
          </div>
          <button type="submit" className="btn-secondary w-full text-sm py-2 mt-2">Apply price</button>
        </fieldset>
      </form>

      {hasFilters && (
        <button onClick={clearAll} className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
          <X className="w-4 h-4" aria-hidden="true" /> Clear All Filters
        </button>
      )}
    </div>
  );

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setShowMobile(!showMobile)}
          aria-expanded={showMobile}
          className="flex items-center gap-2 btn-secondary text-sm w-full justify-center"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filters &amp; Sort {hasFilters && <span className="badge bg-primary-100 text-primary-700">Active</span>}
        </button>
        {showMobile && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            {renderFilters()}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="card p-4 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-red-600 hover:underline">Clear all</button>
        )}
      </div>
      {renderFilters()}
    </div>
  );
}
