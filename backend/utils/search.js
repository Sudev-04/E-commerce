// Product search.
// - Ignores letter case, spaces, hyphens and simple plurals:
//   "tshirt", "T Shirt" and "t-shirts" all find "T-Shirt"; "WATCHES" finds "Watch".
// - Category names match: "fashion" or "clothes" finds the Fashion category.
// - Similar words match: "headset" also finds headphones and earbuds,
//   "mobile" finds phones, "couch" finds sofas (see SYNONYMS).
// - Every word typed must match somewhere in the product.
// - If nothing matches, correctQuery() fixes small typos ("heasdet" → "headset").

const CATEGORY_WORDS = {
  electronics: "electronics electronic gadgets",
  fashion: "fashion clothing clothes apparel wear",
  sports: "sports sport fitness gym",
  home: "home kitchen kitchenware homeware",
  furniture: "furniture",
  accessories: "accessories accessory",
};

// Words in the same group find each other.
const SYNONYM_GROUPS = [
  ["headphone", "headset", "earphone", "earbud", "headphones"],
  ["phone", "mobile", "smartphone", "cellphone"],
  ["tv", "television"],
  ["laptop", "notebook", "ultrabook"],
  ["shoe", "sneaker", "trainer", "footwear"],
  ["tshirt", "tee"],
  ["sofa", "couch", "settee"],
  ["sunglass", "glasses", "shade", "spec", "eyewear", "goggle"],
  ["bag", "handbag", "purse"],
  ["backpack", "rucksack", "schoolbag"],
  ["watch", "smartwatch", "wristwatch"],
  ["bicycle", "cycle", "bike"],
  ["cup", "mug"],
  ["bottle", "flask"],
  ["jacket", "coat"],
  ["jean", "denim"],
  ["lamp", "lighting"],
  ["desk", "table"],
  ["chair", "armchair"],
  ["dumbbell", "weight"],
  ["football", "soccer"],
  ["tablet", "ipad"],
  ["pillow", "cushion"],
  ["speaker", "soundbar"],
];

const normalize = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

// watches → watch, glasses → glass, boxes → box; shoes → shoe, sofas → sofa
const stem = (w) =>
  /(ch|sh|ss|x|z)es$/.test(w) && w.length > 4
    ? w.slice(0, -2)
    : w.length > 3 && w.endsWith("s") && !w.endsWith("ss")
    ? w.slice(0, -1)
    : w;

// Filler words that would otherwise match half the catalogue
const STOPWORDS = new Set(["a", "an", "the", "for", "and", "or", "with", "of", "in", "on", "to", "my", "me", "i", "is", "it", "best", "buy", "new", "good", "nice", "cheap", "online", "under", "below", "item", "items", "product", "products"]);

const words = (q) => {
  const all = normalize(q).split(" ").filter(Boolean);
  const meaningful = all.filter((w) => !STOPWORDS.has(w));
  return (meaningful.length ? meaningful : all).map(stem);
};

const SYNONYMS = new Map();
for (const group of SYNONYM_GROUPS) {
  const stems = [...new Set(group.map(stem))];
  for (const w of stems) SYNONYMS.set(w, stems);
}
const alternatives = (w) => SYNONYMS.get(w) || [w];

const fieldText = (s) => {
  const text = normalize(s);
  return { words: text.split(" ").filter(Boolean).map(stem), compact: text.replace(/ /g, "") };
};

const searchText = (p) => {
  const text = normalize([p.name, p.brand, p.description, p.category, CATEGORY_WORDS[p.category] || "", ...p.tags].join(" "));
  return { text, ...fieldText(text) };
};

// A word matches when it starts one of the product's words ("watch" → "watches",
// but "phone" does not match inside "headphones"). Longer words may also match
// across spaces/hyphens ("tshirt" → "t-shirt", "coffeemaker" → "coffee maker").
const hit = (field, alt) =>
  field.words.some((x) => x === alt) ? 2 : field.words.some((x) => x.startsWith(alt)) || (alt.length >= 6 && field.compact.includes(alt)) ? 1 : 0;

/** Relevance of a product for the query words: name and whole-word matches rank highest. */
function score(product, qWords) {
  const all = searchText(product);
  const name = fieldText(product.name);
  let matched = 0;
  let nameHits = 0;
  let exactHits = 0;
  for (const w of qWords) {
    const alts = alternatives(w);
    const best = Math.max(...alts.map((alt) => hit(all, alt)));
    if (best > 0) matched++;
    if (best === 2) exactHits++;
    if (alts.some((alt) => hit(name, alt) > 0)) nameHits++;
  }
  return { matched, nameHits, exactHits };
}

const byRelevance = (a, b) => b.matched - a.matched || b.nameHits - a.nameHits || b.exactHits - a.exactHits;

/** Products matching every word, best (name) matches first. */
function exactMatches(list, qWords) {
  return list
    .map((p) => ({ p, ...score(p, qWords) }))
    .filter((s) => s.matched === qWords.length)
    .sort(byRelevance)
    .map((s) => s.p);
}

/**
 * Search a product list. Always tries to return something suitable:
 * 1. products matching every word (similar words count), name matches first;
 * 2. otherwise the same after fixing typos ("heasdet" → "headset");
 * 3. otherwise products matching the most words ("related items").
 * `note` tells the shopper when step 2 or 3 was used.
 */
function searchProducts(list, query, allProducts) {
  const qWords = words(query);
  if (qWords.length === 0) return { results: list, note: null };

  const exact = exactMatches(list, qWords);
  if (exact.length) return { results: exact, note: null };

  const corrected = correctQuery(query, allProducts);
  const bestWords = corrected ? words(corrected) : qWords;
  if (corrected) {
    const fixed = exactMatches(list, bestWords);
    if (fixed.length) return { results: fixed, note: { type: "corrected", query: corrected } };
  }

  const related = list
    .map((p) => ({ p, ...score(p, bestWords) }))
    .filter((s) => s.matched > 0)
    .sort(byRelevance)
    .map((s) => s.p);
  return { results: related, note: related.length ? { type: "related", query: corrected || null } : null };
}

// ─── Typo correction ─────────────────────────────────────────────────────────
// Optimal string alignment distance: like Levenshtein, but swapping two
// neighbouring letters ("heasdet" ↔ "headset") counts as one edit.
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * Suggest a corrected query when a search found nothing, e.g. "heasdet" → "headset".
 * Returns null when no word could be improved.
 */
function correctQuery(query, products) {
  const vocab = new Set(SYNONYMS.keys());
  for (const p of products) {
    for (const w of searchText(p).text.split(" ")) if (w.length >= 3) vocab.add(stem(w));
  }

  let changed = false;
  const corrected = words(query).map((w) => {
    if (w.length < 3 || vocab.has(w)) return w;
    const maxDistance = w.length <= 4 ? 1 : 2;
    let best = null;
    let bestDistance = maxDistance + 1;
    for (const v of vocab) {
      if (Math.abs(v.length - w.length) > maxDistance) continue;
      const dist = editDistance(w, v);
      if (dist < bestDistance) {
        best = v;
        bestDistance = dist;
      }
    }
    if (best) {
      changed = true;
      return best;
    }
    return w;
  });

  return changed ? corrected.join(" ") : null;
}

/**
 * If the whole query names a category ("fashion", "frashion", "clothes",
 * "home and kitchen"), return that category's slug so the shopper can be sent
 * straight to the category page. Mixed queries ("fashion jacket") return null.
 */
function matchCategory(query, allProducts) {
  const tryWords = (qWords) => {
    const hits = Object.entries(CATEGORY_WORDS).filter(([, text]) => {
      const catWords = text.split(" ").map(stem);
      return qWords.every((w) => catWords.includes(w));
    });
    return hits.length === 1 ? hits[0][0] : null;
  };
  const qWords = words(query);
  if (qWords.length === 0) return null;
  const exact = tryWords(qWords);
  if (exact) return exact;
  const corrected = correctQuery(query, allProducts);
  return corrected ? tryWords(words(corrected)) : null;
}

module.exports = { searchProducts, correctQuery, matchCategory, normalize };
