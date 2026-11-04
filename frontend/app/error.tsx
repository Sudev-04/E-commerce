"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-container py-24 text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-8">We couldn&apos;t load this page. Please try again in a moment.</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-secondary">Go Home</Link>
      </div>
    </div>
  );
}
