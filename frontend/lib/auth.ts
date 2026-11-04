"use client";

import type { User } from "@/types";
import { ApiError } from "./api";

// All auth calls go to same-origin Next.js route handlers, which keep the
// tokens in httpOnly cookies. Nothing auth-related is stored in localStorage.

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldErrors = Array.isArray(data.errors) ? data.errors.map((e: { message: string }) => e.message).join(" ") : "";
    throw new ApiError(fieldErrors || data.message || "Something went wrong. Please try again.", res.status);
  }
  return data as T;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const data = await post<{ user: User }>("/api/auth/login", { email, password });
  return data.user;
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const data = await post<{ user: User }>("/api/auth/register", { name, email, password });
  return data.user;
}

export async function logoutUser() {
  try {
    await post("/api/auth/logout");
  } catch {
    // Ignore — the cookies are cleared server-side on a best-effort basis
  }
}

export async function fetchSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Clean up tokens left in localStorage by older versions of the site
export function clearLegacyStorage() {
  try {
    ["accessToken", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable (private mode) — nothing to clean
  }
  // Old readable cookies are ignored by the server now; remove them anyway
  ["accessToken", "userRole"].forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/`;
  });
}
