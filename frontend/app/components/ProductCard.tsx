"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, ShoppingCart, Check, Zap } from "lucide-react";
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

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(product.rating));

  return (
    <Link href={`/products/${product.id}`} className="product-card card group flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 300px"
            className="product-image object-cover transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl" aria-hidden="true">📦</div>
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {discount > 0 && <span className="badge bg-sale text-white">{discount}% off</span>}
          {product.featured && <span className="badge bg-accent-400 text-ink">Featured</span>}
        </div>

        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 badge bg-orange-100 text-orange-700">Only {product.stock} left</span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2">
        <div className="flex-1">
          <p className="text-xs text-primary-600 font-medium uppercase tracking-wide">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 line-clamp-2 mt-0.5 leading-snug text-sm sm:text-base">{product.name}</h3>

          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex gap-0.5" role="img" aria-label={`Rated ${product.rating} out of 5`}>
              {stars.map((filled, i) => (
                <Star key={i} aria-hidden="true" className={`w-3.5 h-3.5 ${filled ? "star-filled fill-current" : "star-empty"}`} />
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount.toLocaleString("en-IN")})</span>
          </div>
        </div>

        {/* Price + Cart */}
        <div className="flex items-end justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
          <div className="min-w-0">
            <span className="block text-base sm:text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <span className="block text-xs sm:text-sm text-gray-400 line-through">
                <span className="sr-only">Was </span>{formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleCartClick}
            disabled={adding || outOfStock}
            className={`p-2.5 rounded-lg transition-all duration-200 flex-shrink-0 ${
              inCart
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-primary-50 text-primary-700 hover:bg-primary-600 hover:text-white"
            }`}
            aria-label={
              outOfStock ? `${product.name} is out of stock` : inCart ? `${product.name} is in your cart. Go to cart` : `Add ${product.name} to cart`
            }
            title={inCart ? "In cart: go to cart" : "Add to cart"}
          >
            {adding ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : inCart ? (
              <Check className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {inCart && (
          <p className="text-xs font-medium text-green-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" aria-hidden="true" /> Added to cart{inCartQty > 1 ? ` (${inCartQty})` : ""}
          </p>
        )}

        {outOfStock ? (
          <p className="text-xs text-red-600 font-medium text-center py-2">Out of stock</p>
        ) : (
          <button
            onClick={handleBuyNow}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 text-white text-sm font-semibold py-2 hover:bg-primary-700 transition-colors"
            aria-label={`Buy ${product.name} now`}
          >
            <Zap className="w-4 h-4" aria-hidden="true" /> Buy Now
          </button>
        )}
      </div>
    </Link>
  );
}
