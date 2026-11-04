import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendFetch, clearSessionCookies, refreshSession, setSessionCookies, type TokenPair } from "@/lib/bff";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// GET /api/auth/session — the single source of truth for "who is signed in".
// If the cookies are stale (expired, revoked, or the user no longer exists),
// they are cleared here, so the browser can never get stuck half signed-in.
export async function GET(req: NextRequest) {
  const hasSession = req.cookies.has(ACCESS_COOKIE) || req.cookies.has(REFRESH_COOKIE);
  if (!hasSession) return NextResponse.json({ user: null });

  let token = req.cookies.get(ACCESS_COOKIE)?.value;
  let refreshed: TokenPair | null = null;

  try {
    let res = token ? await backendFetch(req, "/api/auth/me", { token }) : null;

    if (!res || res.status === 401) {
      refreshed = await refreshSession(req);
      if (refreshed) {
        token = refreshed.accessToken;
        res = await backendFetch(req, "/api/auth/me", { token });
      }
    }

    if (!res || !res.ok) {
      return clearSessionCookies(NextResponse.json({ user: null }));
    }

    const data = await res.json();
    const response = NextResponse.json({ user: data.user });
    return refreshed ? setSessionCookies(response, refreshed) : response;
  } catch {
    // Backend unreachable: report signed-out for now but keep the cookies,
    // so the session resumes once the server is back.
    return NextResponse.json({ user: null, offline: true }, { status: 503 });
  }
}
