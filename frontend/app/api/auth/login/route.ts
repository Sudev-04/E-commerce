import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendFetch, backendUnavailable, setSessionCookies } from "@/lib/bff";

export const dynamic = "force-dynamic";

// POST /api/auth/login — signs in via the backend and stores tokens in httpOnly cookies.
// Only the user profile is returned to the browser; tokens never reach client JavaScript.
export async function POST(req: NextRequest) {
  let res: Response;
  try {
    res = await backendFetch(req, "/api/auth/login", {
      method: "POST",
      body: await req.text(),
    });
  } catch {
    return backendUnavailable();
  }

  const data = await res.json().catch(() => ({ success: false, message: "Sign-in failed." }));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ success: true, user: data.user });
  return setSessionCookies(response, data);
}
