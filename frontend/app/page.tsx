// Server Component — sections are fetched on the server and streamed in
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight, Shield, Truck, RefreshCw, Headphones } from "lucide-react";
import ProductCard from "./components/ProductCard";
import { getFeaturedProductsSSR, getCategoriesSSR, getProductsSSR } from "@/lib/api";
import { formatCategory, formatPrice } from "@/lib/format";
import type { Product } from "@/types";

export const revalidate = 120;

const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6";

function SectionSkeleton() {
  return (
    <section className="py-14">
      <div className="page-container">
        <div className="h-8 w-48 skeleton mb-8" />
        <div className={GRID}>
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="aspect-[4/5] skeleton" />)}
        </div>
      </div>
    </section>
  );
}

function ProductSection({
  eyebrow,
  title,
  subtitle,
  href,
  products,
  priority = false,
  tinted = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
  priority?: boolean;
  tinted?: boolean;
}) {
  if (products.length === 0) return null;
  return (
    <section className={`py-14 md:py-16 ${tinted ? "bg-primary-50" : ""}`}>
      <div className="page-container">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="eyebrow mb-2">{eyebrow}</p>
            <h2 className="section-title">{title}</h2>
            <p className="text-primary-400 mt-2 text-sm max-w-md">{subtitle}</p>
          </div>
          <Link
            href={href}
            className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink border-b border-ink pb-1 hover:text-primary-400 hover:border-primary-400 whitespace-nowrap transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
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

async function loadFeatured(): Promise<Product[]> {
  try {
    const res = (await getFeaturedProductsSSR()) as { data: Product[] };
    return res.data || [];
  } catch {
    return [];
  }
}

/** Opening panel: headline on the left, two featured pieces on the right. */
async function Hero() {
  const picks = (await loadFeatured()).filter((p) => p.images[0]).slice(0, 2);

  return (
    <section className="border-b border-primary-100">
      <div className="page-container grid md:grid-cols-2 gap-10 lg:gap-16 items-center py-12 md:py-20">
        <div>
          <p className="eyebrow mb-5">The IndiBazaar edit</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.08] text-ink">
            Well-made things for everyday living.
          </h1>
          <p className="text-primary-500 mt-6 max-w-md leading-relaxed">
            Electronics, clothing, furniture and pieces for the home, chosen with care and delivered across India.
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link href="/products" className="btn-primary px-9 py-4">Shop the collection</Link>
            <Link href="/products?deals=true" className="btn-secondary px-9 py-4">Today&apos;s deals</Link>
          </div>
        </div>

        {picks.length > 0 && (
          <div className={`grid gap-4 ${picks.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {picks.map((p, i) => (
              <Link key={p.id} href={`/products/${p.id}`} className={`group block ${i === 1 ? "mt-10 md:mt-16" : ""}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-primary-50">
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <p className="text-sm text-ink mt-3 line-clamp-1 group-hover:underline underline-offset-4">{p.name}</p>
                <p className="text-sm text-primary-400">{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

async function FeaturedProducts() {
  const products = await loadFeatured();
  return (
    <ProductSection
      eyebrow="Selected"
      title="Featured"
      subtitle="Favourites from every department."
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
      eyebrow="Until midnight"
      title="Today's Deals"
      subtitle="An extra 10–20% off and free delivery. New deals every day."
      href="/products?deals=true"
      products={products}
      tinted
    />
  );
}

async function SortedSection({ sort, eyebrow, title, subtitle }: { sort: string; eyebrow: string; title: string; subtitle: string }) {
  let products: Product[] = [];
  try {
    const res = (await getProductsSSR({ sort, limit: "8" })) as { data: Product[] };
    products = res.data || [];
  } catch {}
  return <ProductSection eyebrow={eyebrow} title={title} subtitle={subtitle} href={`/products?sort=${sort}`} products={products} />;
}

/** One tile per category, using the top-rated product's photo as the cover. */
async function CategorySection() {
  let categories: string[] = [];
  try {
    const res = (await getCategoriesSSR()) as { data: string[] };
    categories = res.data || [];
  } catch {}

  if (categories.length === 0) return null;

  const covers = await Promise.all(
    categories.map(async (cat) => {
      try {
        const res = (await getProductsSSR({ category: cat, sort: "rating", limit: "1" })) as { data: Product[] };
        return res.data?.[0]?.images?.[0] ?? null;
      } catch {
        return null;
      }
    })
  );

  return (
    <section className="py-14 md:py-16">
      <div className="page-container">
        <p className="eyebrow mb-2">Departments</p>
        <h2 className="section-title mb-8">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <Link key={cat} href={`/products?category=${cat}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-primary-50">
                {covers[i] && (
                  <Image
                    src={covers[i] as string}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <p className="text-[11px] uppercase tracking-label text-ink mt-3 group-hover:underline underline-offset-4">
                {formatCategory(cat)}
              </p>
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
      <Suspense fallback={<div className="page-container py-12 md:py-20"><div className="h-80 skeleton" /></div>}>
        <Hero />
      </Suspense>

      <Suspense fallback={<div className="py-14"><div className="page-container"><div className="h-40 skeleton" /></div></div>}>
        <CategorySection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TodaysDeals />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SortedSection sort="newest" eyebrow="Just in" title="New Arrivals" subtitle="The latest additions to the store." />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SortedSection sort="rating" eyebrow="Most loved" title="Top Rated" subtitle="The pieces our customers rate highest." />
      </Suspense>

      {/* Service promises */}
      <section className="border-y border-primary-100">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <Icon className="w-6 h-6 text-ink mx-auto mb-3" strokeWidth={1.25} aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-label text-ink">{title}</p>
                <p className="text-primary-400 text-sm mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account prompt */}
      <section className="py-20">
        <div className="page-container text-center">
          <p className="eyebrow mb-3">Join IndiBazaar</p>
          <h2 className="text-3xl md:text-4xl text-ink mb-4">Keep track of every order.</h2>
          <p className="text-primary-500 mb-9 max-w-md mx-auto">Create a free account to follow your orders and check out faster.</p>
          <Link href="/auth/register" className="btn-primary px-10 py-4 inline-block">Create an account</Link>
        </div>
      </section>
    </div>
  );
}
