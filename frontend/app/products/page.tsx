// Server Component — SSR with dynamic search params
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductsSSR, getCategoriesSSR } from "@/lib/api";
import { formatCategory, formatPrice, pluralize } from "@/lib/format";
import type { Product, PaginatedResponse } from "@/types";
import ProductCard from "../components/ProductCard";
import ProductFiltersClient from "./ProductFiltersClient";

type SearchParams = {
  category?: string;
  search?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  featured?: string;
  page?: string;
};

interface PageProps {
  searchParams: SearchParams;
}

const pageTitle = (sp: SearchParams) =>
  sp.category ? formatCategory(sp.category) : sp.featured === "true" ? "Featured Products" : sp.search ? `Results for "${sp.search}"` : "All Products";

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: pageTitle(searchParams),
    description: searchParams.category
      ? `Shop ${formatCategory(searchParams.category)} at ShopNext. Free delivery on orders over ₹499.`
      : "Browse the full ShopNext catalogue: electronics, fashion, home & kitchen, furniture, sports and accessories.",
  };
}

const LIMIT = 12;

function buildParams(sp: SearchParams, page: number): Record<string, string> {
  const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
  for (const key of ["category", "search", "sort", "minPrice", "maxPrice", "featured"] as const) {
    if (sp[key]) params[key] = sp[key]!;
  }
  return params;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-xl" />)}
    </div>
  );
}

async function ProductResults({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const params = buildParams(searchParams, page);

  let data: PaginatedResponse<Product>;
  try {
    data = (await getProductsSSR(params)) as PaginatedResponse<Product>;
  } catch {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 text-lg font-medium">We couldn&apos;t load products right now.</p>
        <p className="text-gray-500 mt-2 text-sm">Please refresh the page in a moment.</p>
      </div>
    );
  }

  const products = data.data || [];
  const pagination = data.pagination;
  const buildPageUrl = (p: number) => `/products?${new URLSearchParams({ ...params, page: String(p) }).toString()}`;

  const priceNote =
    searchParams.minPrice || searchParams.maxPrice
      ? ` priced ${searchParams.minPrice ? `from ${formatPrice(+searchParams.minPrice)}` : ""}${
          searchParams.minPrice && searchParams.maxPrice ? " " : ""
        }${searchParams.maxPrice ? `up to ${formatPrice(+searchParams.maxPrice)}` : ""}`
      : "";

  // Show a window of up to 5 page numbers around the current page
  const totalPages = pagination?.totalPages ?? 1;
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <>
      <p className="text-gray-500 text-sm mb-4" aria-live="polite">
        {pluralize(pagination?.total ?? 0, "product")} found
        {searchParams.search && ` for "${searchParams.search}"`}
        {priceNote}
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
          <p className="text-xl font-semibold text-gray-900">No products found</p>
          <p className="text-gray-500 mt-2">Try a different search or fewer filters.</p>
          <Link href="/products" className="btn-primary mt-6 inline-block">Clear Filters</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>

          {pagination && totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 mt-10">
              {pagination.hasPrev && (
                <Link href={buildPageUrl(page - 1)} className="flex items-center gap-1 btn-secondary py-2 px-4 text-sm">
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Prev
                </Link>
              )}
              <div className="flex gap-1">
                {pages.map((p) => (
                  <Link
                    key={p}
                    href={buildPageUrl(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                      p === page ? "bg-primary-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
              {pagination.hasNext && (
                <Link href={buildPageUrl(page + 1)} className="flex items-center gap-1 btn-secondary py-2 px-4 text-sm">
                  Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </>
  );
}

export default async function ProductsPage({ searchParams }: PageProps) {
  let categories: string[] = [];
  try {
    categories = ((await getCategoriesSSR()) as { data: string[] }).data || [];
  } catch {}

  return (
    <div className="page-container py-8 page-transition">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span aria-hidden="true">/</span>
        {searchParams.category ? (
          <>
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <span aria-hidden="true">/</span>
            <span className="text-gray-900 font-medium">{formatCategory(searchParams.category)}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">Products</span>
        )}
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{pageTitle(searchParams)}</h1>

      <div className="flex gap-6 mt-4">
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <ProductFiltersClient categories={categories} currentFilters={searchParams} />
        </aside>

        <div className="flex-1 min-w-0">
          <div className="lg:hidden mb-4">
            <ProductFiltersClient categories={categories} currentFilters={searchParams} mobile />
          </div>

          <Suspense key={JSON.stringify(searchParams)} fallback={<GridSkeleton />}>
            <ProductResults searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
