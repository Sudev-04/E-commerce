// Backend-for-frontend helpers used by the Next.js route handlers in app/api/*.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  BACKEND_URL,
  accessCookie,
  refreshCookie,
  clientIp,
} from "./session";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function backendFetch(
  req: NextRequest,
  path: string,
  init: RequestInit & { token?: string } = {}
) {
  const { token, headers, ...rest } = init;
  return fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-Client-IP": clientIp(req.headers),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });
}

/** Exchange the refresh cookie for a new token pair. Returns null if the session is gone. */
export async function refreshSession(req: NextRequest): Promise<TokenPair | null> {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  try {
    const res = await backendFetch(req, "/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  } catch {
    return null;
  }
}

export function setSessionCookies(res: NextResponse, tokens: TokenPair) {
  res.cookies.set(accessCookie(tokens.accessToken));
  res.cookies.set(refreshCookie(tokens.refreshToken));
  return res;
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.delete(ACCESS_COOKIE);
  res.cookies.delete(REFRESH_COOKIE);
  return res;
}

/** Turn an unreachable backend into a clear 503 instead of an unhandled error. */
export function backendUnavailable() {
  return NextResponse.json(
    { success: false, message: "The store server is not responding. Please try again in a moment." },
    { status: 503 }
  );
}
