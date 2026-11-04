import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { backendFetch, backendUnavailable, setSessionCookies } from "@/lib/bff";

export const dynamic = "force-dynamic";

// POST /api/auth/register — creates the account and starts a cookie session.
export async function POST(req: NextRequest) {
  let res: Response;
  try {
    res = await backendFetch(req, "/api/auth/register", {
      method: "POST",
      body: await req.text(),
    });
  } catch {
    return backendUnavailable();
  }

  const data = await res.json().catch(() => ({ success: false, message: "Registration failed." }));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ success: true, user: data.user }, { status: 201 });
  return setSessionCookies(response, data);
}
