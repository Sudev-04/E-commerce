"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, ShoppingBag, Check } from "lucide-react";
import type { Product } from "@/types";
import { useCart } from "./CartProvider";
import { useState } from "react";
import { buyNowUrl, formatPrice, discountPercent } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { cart, addToCart } = useCart();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const discount = discountPercent(product.price, product.originalPrice);
  const outOfStock = product.stock === 0;
  // "In cart" is read from the cart itself, so it stays visible for as long
  // as the item is in the cart (not just for a moment after clicking).
  const inCartQty = cart.items.find((i) => i.productId === product.id)?.quantity ?? 0;
  const inCart = inCartQty > 0;

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      router.push("/cart");
      return;
    }
    setAdding(true);
    await addToCart(product, 1);
    setAdding(false);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(buyNowUrl(product.id, 1));
  };

  return (
    <Link href={`/products/${product.id}`} className="product-card group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-primary-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 300px"
            className="product-image object-cover transition-transform duration-500 ease-out"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-primary-300" aria-hidden="true">
            <ShoppingBag className="w-10 h-10" strokeWidth={1} />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
          {discount > 0 && <span className="badge bg-white text-sale">−{discount}%</span>}
          {product.deal ? (
            <span className="badge bg-ink text-white">Today&apos;s Deal</span>
          ) : (
            product.featured && <span className="badge bg-white text-ink">Featured</span>
          )}
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2.5 left-2.5 badge bg-white text-accent-700">Only {product.stock} left</span>
        )}
        {outOfStock && <span className="absolute bottom-2.5 left-2.5 badge bg-white text-primary-500">Sold out</span>}
      </div>

      <div className="flex flex-col flex-1 pt-3 gap-2">
        <div className="flex-1">
          <p className="eyebrow">{product.brand}</p>
          <h3 className="text-sm text-ink line-clamp-2 mt-1 leading-snug group-hover:underline underline-offset-4">{product.name}</h3>

          <div className="flex items-center gap-1 mt-1.5 text-xs text-primary-400" role="img" aria-label={`Rated ${product.rating} out of 5`}>
            <Star aria-hidden="true" className="w-3 h-3 star-filled fill-current" />
            <span className="text-ink">{product.rating}</span>
            <span>({product.reviewCount.toLocaleString("en-IN")})</span>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className={`text-sm sm:text-base font-medium ${discount > 0 ? "text-sale" : "text-ink"}`}>{formatPrice(product.price)}</span>
          {discount > 0 && (
            <span className="text-xs sm:text-sm text-primary-300 line-through">
              <span className="sr-only">Was </span>{formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {product.deal && (
          <p className="text-[11px] uppercase tracking-wider text-accent-700">
            Extra {product.deal.extraPercent}% off today · Free delivery
          </p>
        )}

        {inCart && (
          <p className="text-xs text-green-800 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" aria-hidden="true" /> Added to cart{inCartQty > 1 ? ` (${inCartQty})` : ""}
          </p>
        )}

        <div className="flex gap-2 mt-1">
          <button
            onClick={handleCartClick}
            disabled={adding || outOfStock}
            className={`w-10 h-10 flex items-center justify-center flex-shrink-0 border transition-colors duration-200 ${
              inCart
                ? "border-green-800 text-green-800 hover:bg-green-50"
                : outOfStock
                ? "border-primary-200 text-primary-300 cursor-not-allowed"
                : "border-ink text-ink hover:bg-ink hover:text-white"
            }`}
            aria-label={
              outOfStock ? `${product.name} is out of stock` : inCart ? `${product.name} is in your cart. Go to cart` : `Add ${product.name} to cart`
            }
            title={inCart ? "In cart: go to cart" : "Add to cart"}
          >
            {adding ? (
              <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : inCart ? (
              <Check className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>

          {outOfStock ? (
            <span className="flex-1 h-10 flex items-center justify-center border border-primary-200 text-[11px] uppercase tracking-label text-primary-400">
              Out of stock
            </span>
          ) : (
            <button
              onClick={handleBuyNow}
              className="flex-1 h-10 bg-ink text-white border border-ink text-[11px] font-medium uppercase tracking-label hover:bg-white hover:text-ink transition-colors duration-200"
              aria-label={`Buy ${product.name} now`}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
