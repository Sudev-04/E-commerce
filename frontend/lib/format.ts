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

export function calcTotals(subtotal: number, itemCount: number) {
  const shipping = itemCount === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
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

export const discountPercent = (price: number, originalPrice: number) =>
  originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
