// Static Site Generation with ISR for product pages
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, ArrowLeft, Shield, Truck, RefreshCw, Zap } from "lucide-react";
import { ApiError, getProductSSR, getProductsSSR } from "@/lib/api";
import { discountPercent, formatCategory, formatPrice } from "@/lib/format";
import type { Product, PaginatedResponse } from "@/types";
import AddToCartButton from "./AddToCartButton";
import ProductGallery from "./ProductGallery";
import ProductCard from "../../components/ProductCard";
import DealCountdown from "../../components/DealCountdown";

interface PageProps {
  params: { id: string };
}

// ISR: revalidate every 5 minutes
export const revalidate = 300;

// Pre-render every product at build time (SSG)
export async function generateStaticParams() {
  try {
    const data = (await getProductsSSR({ limit: "100" })) as PaginatedResponse<Product>;
    return (data.data || []).map((p) => ({ id: p.id }));
  } catch {
    return [];
  }
}

/** Fetch a product; a missing product becomes a real HTTP 404. */
async function loadProduct(id: string): Promise<Product> {
  try {
    const res = (await getProductSSR(id)) as { data: Product };
    return res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err; // other failures go to the error boundary instead of a fake 404
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const p = await loadProduct(params.id);
  return {
    title: p.name,
    description: `${formatPrice(p.price)} · ${p.description}`.slice(0, 160),
    openGraph: { title: p.name, description: p.description, images: p.images },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product = await loadProduct(params.id);

  let related: Product[] = [];
  try {
    const res = (await getProductsSSR({ category: product.category, sort: "rating", limit: "5" })) as PaginatedResponse<Product>;
    related = (res.data || []).filter((p) => p.id !== product.id).slice(0, 4);
  } catch {}

  const discount = discountPercent(product.price, product.originalPrice);
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating));
  const category = formatCategory(product.category);

  return (
    <div className="page-container py-8 page-transition">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 mb-6 min-w-0">
        <Link href="/" className="hover:text-primary-600">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/products" className="hover:text-primary-600">Products</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/products?category=${product.category}`} className="hover:text-primary-600 whitespace-nowrap">
          {category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} discount={discount} />

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-primary-600 text-sm font-medium">
              {product.brand} ·{" "}
              <Link href={`/products?category=${product.category}`} className="hover:underline">{category}</Link>
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2 leading-tight">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-0.5" role="img" aria-label={`Rated ${product.rating} out of 5`}>
              {stars.map((filled, i) => (
                <Star key={i} aria-hidden="true" className={`w-5 h-5 ${filled ? "star-filled fill-current" : "star-empty"}`} />
              ))}
            </div>
            <span className="font-semibold text-gray-900">{product.rating}</span>
            <span className="text-gray-500 text-sm">({product.reviewCount.toLocaleString("en-IN")} reviews)</span>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-extrabold text-gray-900">{formatPrice(product.price)}</span>
              {discount > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through"><span className="sr-only">MRP </span>{formatPrice(product.originalPrice)}</span>
                  <span className="badge bg-green-100 text-green-700 text-sm">You save {formatPrice(product.originalPrice - product.price)}</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Inclusive of all taxes</p>
          </div>

          {product.deal && (
            <div className="rounded-xl border border-accent-300 bg-accent-50 p-4">
              <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                <Zap className="w-5 h-5 text-accent-600" aria-hidden="true" />
                Today&apos;s Deal: extra {product.deal.extraPercent}% off + free delivery
                <DealCountdown endsAt={product.deal.endsAt} className="badge bg-ink text-white font-medium" />
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Usual price {formatPrice(product.deal.basePrice)}, today {formatPrice(product.price)}: you save an extra{" "}
                {formatPrice(product.deal.basePrice - product.price)}. Any order with this item ships free.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${product.stock > 10 ? "bg-green-500" : product.stock > 0 ? "bg-orange-500" : "bg-red-500"}`} />
            <span className={`text-sm font-medium ${product.stock > 10 ? "text-green-700" : product.stock > 0 ? "text-orange-700" : "text-red-700"}`}>
              {product.stock > 10 ? "In stock" : product.stock > 0 ? `Only ${product.stock} left` : "Out of stock"}
            </span>
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Link key={tag} href={`/products?search=${encodeURIComponent(tag)}`} className="badge bg-gray-100 text-gray-600 text-xs px-3 py-1 hover:bg-gray-200">
                #{tag}
              </Link>
            ))}
          </div>

          <AddToCartButton product={product} />

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[
              { icon: Shield, text: "Secure Checkout" },
              { icon: Truck, text: "Free Delivery over ₹499" },
              { icon: RefreshCw, text: "30-Day Returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-lg text-center">
                <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                <span className="text-xs text-gray-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="section-title mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <div className="mt-10">
        <Link href="/products" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium w-fit">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Products
        </Link>
      </div>
    </div>
  );
}
