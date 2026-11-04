// Server components talk to the backend directly; the browser goes through
// the same-origin proxy (app/api/proxy) so auth tokens stay in httpOnly cookies.
const API_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const buildApiUrl = (path: string) => `${API_URL}/${path.replace(/^\/+/, "")}`;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

// ─── Server-side fetch (SSR / SSG) ──────────────────────────────────────────
export async function serverFetch<T>(
  path: string,
  options: RequestInit & { next?: NextFetchRequestConfig } = {}
): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new ApiError(error.message || `HTTP ${res.status}`, res.status);
  }

  return res.json();
}

// ─── Client-side fetch (cookie session via the proxy) ───────────────────────
/** clientFetch("/api/cart") → GET /api/proxy/cart, which forwards to the backend. */
export async function clientFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const proxied = path.replace(/^\/?api\//, "/api/proxy/");
  const res = await fetch(proxied, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
  });

  const data = await res.json().catch(() => ({ message: "Unexpected response from the server." }));

  if (!res.ok) {
    const fieldErrors = Array.isArray(data.errors) ? data.errors.map((e: { message: string }) => e.message).join(" ") : "";
    throw new ApiError(fieldErrors || data.message || `HTTP ${res.status}`, res.status);
  }

  return data;
}

// ─── SSR Product Fetchers ────────────────────────────────────────────────────
export async function getProductsSSR(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return serverFetch(`/api/products${qs ? `?${qs}` : ""}`, {
    next: { revalidate: 60 },
  });
}

export async function getProductSSR(id: string) {
  return serverFetch(`/api/products/${encodeURIComponent(id)}`, {
    next: { revalidate: 300 },
  });
}

export async function getFeaturedProductsSSR() {
  return serverFetch("/api/products/featured", {
    next: { revalidate: 120 },
  });
}

export async function getCategoriesSSR() {
  return serverFetch("/api/products/categories", {
    next: { revalidate: 3600 },
  });
}

type NextFetchRequestConfig = {
  revalidate?: number | false;
  tags?: string[];
};
