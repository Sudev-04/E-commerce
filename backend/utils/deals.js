// Today's Deals: a small set of products that get an EXTRA discount on top of
// their usual price, plus free delivery. The picks change every day at midnight
// India time and are the same for every shopper (chosen from the date).

const DEALS_PER_DAY = 8;
const EXTRA_PERCENTS = [10, 12, 15, 20];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** "2026-11-04" for the current day in India. */
const istDay = (now = new Date()) => new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

/** When today's deals end: the next midnight in India, as an ISO timestamp. */
const dealsEndAt = (now = new Date()) => {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const nextMidnightIstAsUtc = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + 1);
  return new Date(nextMidnightIstAsUtc - IST_OFFSET_MS).toISOString();
};

// Small deterministic pseudo-random generator seeded from the date
function seededRandom(seedText) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

let cache = { key: null, deals: new Map() };

/**
 * Map of productId → { extraPercent, endsAt } for today's deals.
 * Recomputed when the day changes or the set of in-stock products changes.
 */
function todaysDeals(products, now = new Date()) {
  const day = istDay(now);
  const eligible = products.filter((p) => p.stock > 0).map((p) => p.id).sort();
  const key = `${day}|${eligible.join(",")}`;
  if (cache.key === key) return cache.deals;

  const random = seededRandom(day);
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const endsAt = dealsEndAt(now);
  const deals = new Map();
  for (const id of shuffled.slice(0, DEALS_PER_DAY)) {
    deals.set(id, { extraPercent: EXTRA_PERCENTS[Math.floor(random() * EXTRA_PERCENTS.length)], endsAt });
  }
  cache = { key, deals };
  return deals;
}

/**
 * The product as shoppers see it: deal products get the extra discount applied
 * to `price` and a `deal` object. The stored product is never modified.
 */
function withDeal(product, deals) {
  const deal = deals.get(product.id);
  if (!deal) return product;
  const dealPrice = Math.round(product.price * (1 - deal.extraPercent / 100));
  return {
    ...product,
    price: dealPrice,
    deal: { extraPercent: deal.extraPercent, basePrice: product.price, freeDelivery: true, endsAt: deal.endsAt },
  };
}

module.exports = { todaysDeals, withDeal, DEALS_PER_DAY };
