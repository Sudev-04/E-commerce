import Link from "next/link";
import { Package } from "lucide-react";

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
    <footer className="bg-ink text-primary-200 mt-16">
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl mb-3">
              <Package className="w-6 h-6 text-accent-400" aria-hidden="true" />
              ShopNext
            </Link>
            <p className="text-sm leading-relaxed">
              Electronics, fashion, home essentials and more, delivered across India. Free delivery on orders over ₹499.
            </p>
          </div>
          {SECTIONS.map(({ title, links }) => (
            <div key={title}>
              <h2 className="text-white font-semibold mb-3">{title}</h2>
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
        <div className="border-t border-white/10 mt-10 pt-6 text-sm text-center">
          © {new Date().getFullYear()} ShopNext. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
