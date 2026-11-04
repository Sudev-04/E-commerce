// Server-only session helpers. Tokens live in httpOnly cookies on the frontend
// domain, so browser JavaScript can never read them. Every role check reads the
// role from the *signed* access token, never from a plain cookie.
import { jwtVerify } from "jose";

export const ACCESS_COOKIE = "sn_access";
export const REFRESH_COOKIE = "sn_refresh";

export const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/+$/, "");

const ACCESS_MAX_AGE = 60 * 60 * 24 * 7; // 7 days — matches JWT_EXPIRES_IN
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — matches JWT_REFRESH_EXPIRES_IN

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
export const accessCookie = (token: string) => ({ name: ACCESS_COOKIE, value: token, ...cookieOptions(ACCESS_MAX_AGE) });
export const refreshCookie = (token: string) => ({ name: REFRESH_COOKIE, value: token, ...cookieOptions(REFRESH_MAX_AGE) });

export interface SessionClaims {
  id: string;
  email: string;
  role: "user" | "admin";
  name: string;
}

// Must match the backend's secret. The dev fallback mirrors backend/utils/jwt.js.
let warnedMissingSecret = false;
function accessSecret() {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      if (!warnedMissingSecret) {
        warnedMissingSecret = true;
        console.error(
          "[auth] JWT_SECRET is not set in the frontend environment. Every protected page will redirect to sign-in. " +
            "Set it to the same value as the backend's JWT_SECRET."
        );
      }
      return null;
    }
    secret = "dev-only-secret-change-me-JWT_SECRET";
  }
  return new TextEncoder().encode(secret);
}

/** Verify the access token's signature, issuer, audience and expiry. Returns null if invalid. */
export async function verifyAccessToken(token: string | undefined): Promise<SessionClaims | null> {
  const secret = accessSecret();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "ecommerce-api",
      audience: "ecommerce-client",
    });
    if (typeof payload.id !== "string" || (payload.role !== "user" && payload.role !== "admin")) {
      return null;
    }
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

/** Shopper IP to forward to the backend so its rate limits apply per shopper. */
export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "";
}
