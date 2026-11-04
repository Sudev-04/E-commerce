import Link from "next/link";

// Shared layout for simple content pages (About, Contact, Privacy, Terms)
export default function InfoPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="page-container py-10 page-transition">
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-4">
        <Link href="/" className="hover:text-primary-600">Home</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>
      <article className="card p-6 sm:p-10 max-w-3xl prose-info">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
        {children}
      </article>
    </div>
  );
}
