"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
import { loginUser } from "@/lib/auth";
import { useAuth } from "../../components/AuthProvider";

const safeCallback = (url: string | null) =>
  url && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState("");
  const slowTimer = useRef<ReturnType<typeof setTimeout>>();

  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));
  const message = searchParams.get("message");

  // Wake the API server while the user types (free hosting sleeps when idle,
  // which is what made the first sign-in hang for several seconds).
  useEffect(() => {
    fetch("/api/proxy/products/categories").catch(() => {});
    return () => clearTimeout(slowTimer.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    slowTimer.current = setTimeout(() => setSlow(true), 3000);
    try {
      const user = await loginUser(form.email, form.password);
      setUser(user);
      router.replace(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please check your email and password.");
      setLoading(false);
    } finally {
      clearTimeout(slowTimer.current);
      setSlow(false);
    }
  };

  const fillDemo = (role: "user" | "admin") => {
    setForm(role === "admin"
      ? { email: "admin@example.com", password: "admin123" }
      : { email: "john@example.com", password: "password123" });
  };

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-2xl mb-4">
          <Package className="w-8 h-8" aria-hidden="true" />
          ShopNext
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {message && (
        <div role="status" className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-4 text-sm">{message}</div>
      )}

      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-6">
        <p className="text-xs font-semibold text-primary-700 mb-2">Demo accounts</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => fillDemo("user")} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-md font-medium transition-colors">
            User account
          </button>
          <button type="button" onClick={() => fillDemo("admin")} className="text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-md font-medium transition-colors">
            Admin account
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field" placeholder="you@example.com" required autoComplete="email" />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? "text" : "password"} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-field pr-10" placeholder="••••••••" required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-80">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Signing in…</> : <><LogIn className="w-4 h-4" aria-hidden="true" /> Sign In</>}
        </button>
        {slow && (
          <p role="status" className="text-xs text-center text-gray-500">
            Waking up the server. The first sign-in can take a few extra seconds.
          </p>
        )}
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href={`/auth/register${callbackUrl !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`} className="text-primary-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="card h-[32rem] skeleton" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
