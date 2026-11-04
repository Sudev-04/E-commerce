import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendFetch, clearSessionCookies } from "@/lib/bff";
import { REFRESH_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/auth/logout — revokes the refresh token and clears both cookies.
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await backendFetch(req, "/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Clearing the cookies below still signs the user out of this browser.
    }
  }
  return clearSessionCookies(NextResponse.json({ success: true }));
}
