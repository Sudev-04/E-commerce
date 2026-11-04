import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_URL,
  accessCookie,
  refreshCookie,
  clientIp,
  verifyAccessToken,
  type SessionClaims,
} from "@/lib/session";

// Routes that require a signed-in user. The cart itself is open to guests.
const PROTECTED_ROUTES = ["/dashboard", "/checkout", "/orders"];
// Routes only for guests (signed-in users are sent to their dashboard)
const AUTH_ROUTES = ["/auth/login", "/auth/register"];
// Admin-only routes
const ADMIN_ROUTES = ["/dashboard/admin"];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

/**
 * Resolve the session from the signed access token. If it has expired but a
 * refresh token exists, rotate the pair so the user is not bounced to sign-in.
 */
async function resolveSession(request: NextRequest): Promise<{
  claims: SessionClaims | null;
  rotated?: { accessToken: string; refreshToken: string };
}> {
  const claims = await verifyAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  if (claims) return { claims };

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return { claims: null };

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Client-IP": clientIp(request.headers) },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return { claims: null };
    const data = await res.json();
    const refreshed = await verifyAccessToken(data.accessToken);
    return refreshed
      ? { claims: refreshed, rotated: { accessToken: data.accessToken, refreshToken: data.refreshToken } }
      : { claims: null };
  } catch {
    return { claims: null };
  }
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  return response;
}

function redirectToLogin(request: NextRequest, message?: string) {
  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  if (message) loginUrl.searchParams.set("message", message);
  const response = NextResponse.redirect(loginUrl);
  // Drop any stale/forged cookies so the login page renders normally
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = matches(pathname, PROTECTED_ROUTES);
  const isAuthRoute = matches(pathname, AUTH_ROUTES);
  const hasCookies = request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);

  // Public pages without session cookies need no token work at all
  if (!needsAuth && !(isAuthRoute && hasCookies)) {
    return withSecurityHeaders(NextResponse.next());
  }

  const { claims, rotated } = await resolveSession(request);

  let response: NextResponse;
  if (needsAuth && !claims) {
    response = redirectToLogin(
      request,
      matches(pathname, ADMIN_ROUTES) ? "Admin access required" : undefined
    );
  } else if (matches(pathname, ADMIN_ROUTES) && claims?.role !== "admin") {
    // Role comes from the signed JWT — editing cookies cannot change it
    response = NextResponse.redirect(new URL("/dashboard?denied=admin", request.url));
  } else if (isAuthRoute && claims) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const target = callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";
    response = NextResponse.redirect(new URL(target, request.url));
  } else {
    response = NextResponse.next();
    // Cookies exist but are invalid on an auth page: clear them so sign-in works
    if (isAuthRoute && !claims) {
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
    }
  }

  if (rotated && claims) {
    response.cookies.set(accessCookie(rotated.accessToken));
    response.cookies.set(refreshCookie(rotated.refreshToken));
  }

  return withSecurityHeaders(response);
}

export const config = {
  matcher: [
    // Pages only: skip API routes, static files and Next.js internals
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
