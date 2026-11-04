"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import { registerUser } from "@/lib/auth";
import { useAuth } from "../../components/AuthProvider";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cb = searchParams.get("callbackUrl");
  const callbackUrl = cb && cb.startsWith("/") && !cb.startsWith("//") ? cb : "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser(form.name, form.email, form.password);
      setUser(user);
      // Navigate only: a refresh here raced the navigation and could leave the
      // browser on the sign-in URL, dropping the callback's query (e.g. Buy Now).
      router.replace(callbackUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  };

  return (
    <div className="card p-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-2xl mb-4">
          <Package className="w-8 h-8" aria-hidden="true" />
          ShopNext
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-500 mt-1">Track orders and check out faster</p>
      </div>

      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1.5">Full name</label>
          <input id="name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field" placeholder="Priya Sharma" required minLength={2} maxLength={50} autoComplete="name" />
        </div>
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
              className="input-field pr-10" placeholder="At least 6 characters" required minLength={6} autoComplete="new-password" />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-1.5">Confirm password</label>
          <input id="confirmPassword" type="password" value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="input-field" placeholder="Repeat password" required autoComplete="new-password" />
        </div>

        <button type="submit" disabled={loading} aria-busy={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2 disabled:opacity-80">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Creating account…</> : <><UserPlus className="w-4 h-4" aria-hidden="true" /> Create Account</>}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="card h-[36rem] skeleton" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
