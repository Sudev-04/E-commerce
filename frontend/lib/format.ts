// Formatting helpers shared by server and client components.

// ─── Currency (INR) ─────────────────────────────────────────────────────────
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹14,999 — prices are whole rupees; paise are rounded. */
export const formatPrice = (amount: number) => inr.format(Math.round(amount));

// Pricing rules — keep in sync with backend/utils/pricing.js
export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 49;
export const GST_RATE = 0.18;

/** Delivery is free over ₹499, or when the order has a Today's Deal item. */
export function calcTotals(subtotal: number, itemCount: number, dealDelivery = false) {
  const shipping = itemCount === 0 || subtotal >= FREE_SHIPPING_THRESHOLD || dealDelivery ? 0 : SHIPPING_FEE;
  const gstIncluded = subtotal - subtotal / (1 + GST_RATE);
  return { subtotal, shipping, gstIncluded, total: subtotal + shipping };
}

// ─── Categories ─────────────────────────────────────────────────────────────
export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  electronics: { label: "Electronics", emoji: "💻" },
  fashion: { label: "Fashion", emoji: "👕" },
  sports: { label: "Sports & Fitness", emoji: "🏃" },
  home: { label: "Home & Kitchen", emoji: "🏠" },
  furniture: { label: "Furniture", emoji: "🛋️" },
  accessories: { label: "Accessories", emoji: "🎒" },
};

/** "home" → "Home & Kitchen"; unknown slugs are title-cased. */
export function formatCategory(slug: string) {
  return (
    CATEGORY_META[slug]?.label ??
    slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Text ───────────────────────────────────────────────────────────────────
/** pluralize(1, "item") → "1 item"; pluralize(3, "item") → "3 items" */
export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count.toLocaleString("en-IN")} ${count === 1 ? singular : plural}`;
}

// ─── Orders ─────────────────────────────────────────────────────────────────
export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700" },
  shipped: { label: "Shipped", className: "bg-primary-100 text-primary-700" },
  delivered: { label: "Delivered", className: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

/** Checkout URL for "Buy Now" (orders just this item; the cart is left alone). */
export const buyNowUrl = (productId: string, quantity = 1) =>
  `/checkout?buyNow=${encodeURIComponent(productId)}&qty=${quantity}`;

/** "Ends in 5h 20m" for a deal end time. */
export function timeLeft(endsAt: string, now = Date.now()) {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `Ends in ${h}h ${m}m` : `Ends in ${m}m`;
}

export const discountPercent = (price: number, originalPrice: number) =>
  originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
