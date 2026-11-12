import Link from "next/link";

const SECTIONS = [
  {
    title: "Shop",
    links: [
      ["All Products", "/products"],
      ["Electronics", "/products?category=electronics"],
      ["Fashion", "/products?category=fashion"],
      ["Home & Kitchen", "/products?category=home"],
      ["Furniture", "/products?category=furniture"],
      ["Sports & Fitness", "/products?category=sports"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Sign In", "/auth/login"],
      ["Create Account", "/auth/register"],
      ["My Orders", "/orders"],
      ["Cart", "/cart"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/about"],
      ["Contact", "/contact"],
      ["Privacy Policy", "/privacy"],
      ["Terms of Use", "/terms"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-primary-300 mt-20">
      <div className="page-container py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block font-display text-xl uppercase tracking-[0.3em] text-white mb-4">
              Northlane
            </Link>
            <p className="text-sm leading-relaxed">
              Electronics, fashion, home essentials and more, delivered across India. Free delivery on orders over ₹499.
            </p>
          </div>
          {SECTIONS.map(({ title, links }) => (
            <div key={title}>
              <h2 className="!font-sans text-[11px] uppercase tracking-[0.22em] text-white mb-4">{title}</h2>
              <ul className="space-y-2 text-sm">
                {links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-xs tracking-wide text-center">
          © {new Date().getFullYear()} Northlane. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
