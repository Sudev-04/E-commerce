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
  deals?: string;
  page?: string;
};

interface PageProps {
  searchParams: SearchParams;
}

const isDeals = (sp: SearchParams) => sp.deals === "true";

const pageTitle = (sp: SearchParams) => {
  if (isDeals(sp)) return sp.category ? `${formatCategory(sp.category)} Deals` : "Today's Deals";
  if (sp.category) return formatCategory(sp.category);
  if (sp.featured === "true") return "Featured Products";
  if (sp.search) return `Results for "${sp.search}"`;
  return "All Products";
};

export function generateMetadata({ searchParams }: PageProps): Metadata {
  return {
    title: pageTitle(searchParams),
    description: isDeals(searchParams)
      ? "Today's Deals at ShopNext: extra 10–20% off and free delivery on hand-picked products. New deals every day."
      : searchParams.category
      ? `Shop ${formatCategory(searchParams.category)} at ShopNext. Free delivery on orders over ₹499.`
      : "Browse the full ShopNext catalogue: electronics, fashion, home & kitchen, furniture, sports and accessories.",
  };
}

const LIMIT = 12;

function buildParams(sp: SearchParams, page: number): Record<string, string> {
  const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
  for (const key of ["category", "search", "sort", "minPrice", "maxPrice", "featured", "deals"] as const) {
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
      {data.searchNote && searchParams.search && (
        <div role="status" className="bg-primary-50 border border-primary-100 text-primary-900 rounded-lg px-3 py-2 mb-3 text-sm">
          {data.searchNote.type === "corrected" && data.searchNote.query ? (
            <>
              Showing results for <span className="font-semibold">&ldquo;{data.searchNote.query}&rdquo;</span>.
              {" "}No exact matches for &ldquo;{searchParams.search}&rdquo;.
            </>
          ) : (
            <>
              No exact matches for &ldquo;{searchParams.search}&rdquo;. Showing related items
              {data.searchNote.query ? <> for <span className="font-semibold">&ldquo;{data.searchNote.query}&rdquo;</span></> : null}.
            </>
          )}
        </div>
      )}
      <p className="text-gray-500 text-sm mb-4" aria-live="polite">
        {pluralize(pagination?.total ?? 0, "product")} found
        {searchParams.search && !data.searchNote && ` for "${searchParams.search}"`}
        {priceNote}
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4" aria-hidden="true">🔍</p>
          <p className="text-xl font-semibold text-gray-900">No products found</p>
          {searchParams.search && (searchParams.category || searchParams.deals || searchParams.featured || searchParams.minPrice || searchParams.maxPrice) ? (
            <>
              <p className="text-gray-500 mt-2">
                Nothing matched &ldquo;{searchParams.search}&rdquo; with the current filters.
              </p>
              <Link href={`/products?search=${encodeURIComponent(searchParams.search)}`} className="btn-primary mt-6 inline-block">
                Search all products for &ldquo;{searchParams.search}&rdquo;
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-500 mt-2">Try a different search or fewer filters.</p>
              <Link href="/products" className="btn-primary mt-6 inline-block">Clear Filters</Link>
            </>
          )}
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
        {searchParams.category || isDeals(searchParams) ? (
          <>
            <Link href="/products" className="hover:text-primary-600">Products</Link>
            <span aria-hidden="true">/</span>
            <span className="text-gray-900 font-medium">{pageTitle(searchParams)}</span>
          </>
        ) : (
          <span className="text-gray-900 font-medium">Products</span>
        )}
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{pageTitle(searchParams)}</h1>
      {isDeals(searchParams) && (
        <p className="text-sm text-gray-600">
          Today only: <span className="font-semibold text-sale">extra 10–20% off</span> on top of the usual price,
          plus <span className="font-semibold text-green-700">free delivery</span>. New deals every day at midnight.
        </p>
      )}

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
