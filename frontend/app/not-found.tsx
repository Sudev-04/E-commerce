import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="page-container py-24 text-center page-transition">
      <p className="text-8xl mb-6" aria-hidden="true">🔍</p>
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 text-lg mb-8">The page or product you&apos;re looking for doesn&apos;t exist or is no longer available.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/" className="btn-primary">Go Home</Link>
        <Link href="/products" className="btn-secondary">Browse Products</Link>
      </div>
    </div>
  );
}
