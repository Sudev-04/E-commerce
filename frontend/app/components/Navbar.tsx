"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, Search, Menu, X, User, LogOut, LayoutDashboard, ClipboardList, Shield } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";

const NAV_LINKS = [
  { href: "/products", label: "Shop All" },
  { href: "/products?category=electronics", label: "Electronics" },
  { href: "/products?category=fashion", label: "Fashion" },
  { href: "/products?category=home", label: "Home & Kitchen" },
  { href: "/products?category=furniture", label: "Furniture" },
  { href: "/products?category=sports", label: "Sports" },
  { href: "/products?category=accessories", label: "Accessories" },
  { href: "/products?deals=true", label: "Today's Deals" },
];

function SearchForm({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    onDone?.();
  };

  return (
    <form onSubmit={submit} role="search" className="relative w-full">
      <label htmlFor={autoFocus ? "mobile-search" : "header-search"} className="sr-only">
        Search products
      </label>
      <input
        id={autoFocus ? "mobile-search" : "header-search"}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products, brands…"
        autoFocus={autoFocus}
        className="w-full border-0 border-b border-ink bg-transparent py-2.5 pl-0 pr-10 text-sm placeholder-primary-300 focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-ink hover:text-primary-400"
      >
        <Search className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </form>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const cartLabel = itemCount > 0 ? `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}` : "Cart, empty";

  return (
    <header className="bg-surface sticky top-0 z-50 border-b border-primary-100">
      <p className="bg-ink text-white text-center text-[11px] uppercase tracking-[0.2em] py-2 px-4">
        Free delivery over ₹499 <span aria-hidden="true" className="mx-2">·</span> 30-day returns
      </p>

      <div className="page-container">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">
          {/* Left: menu (small screens) and search */}
          <div className="flex items-center gap-1 -ml-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="icon-btn lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
            </button>
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="icon-btn flex items-center gap-2"
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Search className="w-5 h-5" strokeWidth={1.5} />}
              <span className="hidden lg:inline text-[11px] uppercase tracking-label">Search</span>
            </button>
          </div>

          {/* Wordmark */}
          <Link href="/" className="font-display text-lg sm:text-2xl uppercase tracking-[0.22em] sm:tracking-[0.3em] text-ink pl-[0.22em] sm:pl-[0.3em]">
            IndiBazaar
          </Link>

          {/* Right: account and cart */}
          <div className="flex items-center justify-end gap-1 -mr-2">
            {isLoading ? (
              <div className="w-8 h-8 skeleton" aria-hidden="true" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="icon-btn flex items-center gap-2"
                  aria-label={`Account menu for ${user?.name}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <User className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden md:block text-[11px] uppercase tracking-label">{user?.name?.split(" ")[0]}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                    <div role="menu" className="absolute right-0 mt-2 w-56 bg-white border border-primary-200 z-20">
                      <div className="px-4 py-3 border-b border-primary-100">
                        <p className="text-sm font-medium text-ink">{user?.name}</p>
                        <p className="text-xs text-primary-400 truncate">{user?.email}</p>
                        {user?.role === "admin" && <span className="badge bg-ink text-white mt-2">Admin</span>}
                      </div>
                      <Link role="menuitem" href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-primary-50">
                        <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> Dashboard
                      </Link>
                      <Link role="menuitem" href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-primary-50">
                        <ClipboardList className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> My Orders
                      </Link>
                      {user?.role === "admin" && (
                        <Link role="menuitem" href="/dashboard/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink hover:bg-primary-50">
                          <Shield className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> Admin Panel
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sale hover:bg-primary-50 border-t border-primary-100"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="icon-btn flex items-center gap-2" aria-label="Sign in">
                <User className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden md:block text-[11px] uppercase tracking-label">Sign In</span>
              </Link>
            )}

            <Link href="/cart" className="icon-btn relative" aria-label={cartLabel}>
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
              {itemCount > 0 && (
                <span aria-hidden="true" className="absolute top-0 right-0 bg-ink text-white text-[10px] min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center font-medium">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Category links */}
        <nav aria-label="Main" className="hidden lg:flex items-center justify-center gap-7 xl:gap-9 pb-3.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-[11px] uppercase tracking-label whitespace-nowrap border-b border-transparent pb-0.5 hover:border-ink transition-colors ${
                href.includes("deals") ? "text-sale" : "text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {searchOpen && (
          <div className="pb-5 max-w-2xl mx-auto">
            <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Small-screen menu */}
      {menuOpen && (
        <nav aria-label="Mobile" className="lg:hidden border-t border-primary-100 bg-surface px-4 py-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="block py-3 text-xs uppercase tracking-label text-ink border-b border-primary-100 last:border-0">
              {label}
            </Link>
          ))}
          {!isAuthenticated && !isLoading && (
            <div className="flex gap-2 pt-4 pb-1">
              <Link href="/auth/login" className="btn-secondary flex-1 text-center">Sign In</Link>
              <Link href="/auth/register" className="btn-primary flex-1 text-center">Sign Up</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
