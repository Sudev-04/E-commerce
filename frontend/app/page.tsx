// Server Component — sections are fetched on the server and streamed in
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Shield, Truck, RefreshCw, Headphones } from "lucide-react";
import ProductCard from "./components/ProductCard";
import { getFeaturedProductsSSR, getCategoriesSSR, getProductsSSR } from "@/lib/api";
import { CATEGORY_META, formatCategory } from "@/lib/format";
import type { Product } from "@/types";

export const revalidate = 120;

const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4";

function SectionSkeleton() {
  return (
    <section className="py-10">
      <div className="page-container">
        <div className="h-8 w-48 skeleton rounded mb-6" />
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[3/4] skeleton rounded-xl" />)}
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  title,
  subtitle,
  href,
  products,
  priority = false,
  tinted = false,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
  priority?: boolean;
  tinted?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section className={`py-10 ${tinted ? "bg-white" : ""}`}>
      <div className="page-container">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="section-title">{title}</h2>
            <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
          </div>
          <Link href={href} className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 text-sm whitespace-nowrap">
            View all <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
        <div className={GRID}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={priority && i < 4} />
          ))}
        </div>
      </div>
    </section>
  );
}

async function FeaturedProducts() {
  let products: Product[] = [];
  try {
    const res = (await getFeaturedProductsSSR()) as { data: Product[] };
    products = res.data || [];
  } catch {}
  return (
    <ProductSection
      title="Featured Products"
      subtitle="Hand-picked favourites from every department"
      href="/products?featured=true"
      products={products}
      priority
    />
  );
}

async function TodaysDeals() {
  let products: Product[] = [];
  try {
    const res = (await getProductsSSR({ deals: "true", limit: "8" })) as { data: Product[] };
    products = res.data || [];
  } catch {}
  return (
    <ProductSection
      title="Today's Deals"
      subtitle="Extra 10–20% off and free delivery. Today only, new deals at midnight."
      href="/products?deals=true"
      products={products}
      tinted
    />
  );
}

async function SortedSection({ sort, title, subtitle }: { sort: string; title: string; subtitle: string }) {
  let products: Product[] = [];
  try {
    const res = (await getProductsSSR({ sort, limit: "8" })) as { data: Product[] };
    products = res.data || [];
  } catch {}
  return (
    <ProductSection title={title} subtitle={subtitle} href={sort === "discount" ? "/products?deals=true" : `/products?sort=${sort}`} products={products} tinted={sort === "discount"} />
  );
}

async function CategorySection() {
  let categories: string[] = [];
  try {
    const res = (await getCategoriesSSR()) as { data: string[] };
    categories = res.data || [];
  } catch {}

  if (categories.length === 0) return null;

  return (
    <section className="py-8 bg-white">
      <div className="page-container">
        <h2 className="section-title mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/products?category=${cat}`}
              className="flex flex-col items-center justify-center gap-2 px-3 py-5 rounded-xl border border-primary-100 bg-primary-50/50 text-primary-900 font-medium text-sm text-center hover:border-primary-300 hover:shadow-md transition-all duration-200"
            >
              <span className="text-3xl" aria-hidden="true">{CATEGORY_META[cat]?.emoji ?? "📦"}</span>
              {formatCategory(cat)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over ₹499" },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: Shield, title: "Secure Payments", desc: "UPI, cards & cash on delivery" },
  { icon: Headphones, title: "Customer Support", desc: "7 days a week" },
];

export default function HomePage() {
  return (
    <div className="page-transition">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-ink text-white">
        <div className="page-container py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="badge bg-accent-400 text-ink mb-4 text-sm px-3 py-1 font-semibold">
              New arrivals every week
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Shop Smarter,<br />
              <span className="text-accent-300">Live Better</span>
            </h1>
            <p className="text-lg text-primary-100 mb-8 max-w-xl">
              Great prices on electronics, fashion, furniture, home &amp; kitchen and more, delivered to your door.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-primary-50 transition-colors shadow-lg">
                Shop Now
              </Link>
              <Link href="/products?deals=true" className="border-2 border-white text-white font-bold py-3 px-8 rounded-xl hover:bg-white hover:text-primary-700 transition-all">
                Today&apos;s Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-b border-gray-100">
        <div className="page-container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="py-8 bg-white"><div className="page-container"><div className="h-24 skeleton rounded-xl" /></div></div>}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TodaysDeals />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SortedSection sort="newest" title="New Arrivals" subtitle="Fresh additions to the store" />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SortedSection sort="rating" title="Top Rated" subtitle="Loved by our customers" />
      </Suspense>

      {/* CTA Banner */}
      <section className="bg-primary-50 py-14">
        <div className="page-container text-center">
          <h2 className="text-3xl font-bold mb-3 text-ink">Ready to start shopping?</h2>
          <p className="text-gray-600 mb-8">Create a free account to track your orders and check out faster.</p>
          <Link href="/auth/register" className="btn-primary text-base px-10 py-3.5 inline-block">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
