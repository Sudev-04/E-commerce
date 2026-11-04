import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { backendFetch, backendUnavailable, refreshSession, setSessionCookies, type TokenPair } from "@/lib/bff";
import { ACCESS_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// Only these backend areas may be reached through the proxy.
const ALLOWED_PREFIXES = ["products", "cart", "orders", "users"];

// /api/proxy/<path> → <backend>/api/<path>, with the access token from the
// httpOnly cookie attached as a Bearer header. Expired tokens are refreshed once.
async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.map(encodeURIComponent).join("/");
  if (!ALLOWED_PREFIXES.includes(params.path[0])) {
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const target = `/api/${path}${req.nextUrl.search}`;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  let token = req.cookies.get(ACCESS_COOKIE)?.value;
  let refreshed: TokenPair | null = null;

  let res: Response;
  try {
    res = await backendFetch(req, target, { method: req.method, body, token });

    if (res.status === 401) {
      refreshed = await refreshSession(req);
      if (refreshed) {
        token = refreshed.accessToken;
        res = await backendFetch(req, target, { method: req.method, body, token });
      }
    }
  } catch {
    return backendUnavailable();
  }

  // Admin changes to the catalog should show up on cached pages straight away
  if (res.ok && req.method !== "GET" && params.path[0] === "products") {
    revalidatePath("/", "layout");
  }

  const data = await res.text();
  const response = new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
  return refreshed ? setSessionCookies(response, refreshed) : response;
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
