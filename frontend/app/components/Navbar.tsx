"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Search, Menu, X, Package, LogOut, LayoutDashboard, ClipboardList, Shield } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "All Products" },
  { href: "/products?category=electronics", label: "Electronics" },
  { href: "/products?category=fashion", label: "Fashion" },
  { href: "/products?category=home", label: "Home & Kitchen" },
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
        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-3 pr-10 text-sm placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-gray-500 hover:text-primary-600"
      >
        <Search className="w-4 h-4" />
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 flex-shrink-0">
            <Package className="w-7 h-7" aria-hidden="true" />
            <span>ShopNext</span>
          </Link>

          {/* Desktop Nav */}
          <nav aria-label="Main" className="hidden xl:flex items-center gap-5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-gray-600 hover:text-primary-600 font-medium text-sm transition-colors whitespace-nowrap">
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop search */}
          <div className="hidden md:block flex-1 max-w-sm">
            <SearchForm />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="icon-btn md:hidden"
              aria-label={searchOpen ? "Close search" : "Search products"}
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="icon-btn relative" aria-label={cartLabel}>
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span aria-hidden="true" className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center font-bold">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isLoading ? (
              <div className="w-8 h-8 rounded-full skeleton" aria-hidden="true" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={`Account menu for ${user?.name}`}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm" aria-hidden="true">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name?.split(" ")[0]}</span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                    <div role="menu" className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        {user?.role === "admin" && (
                          <span className="badge bg-primary-100 text-primary-700 mt-1">Admin</span>
                        )}
                      </div>
                      <Link role="menuitem" href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <LayoutDashboard className="w-4 h-4" aria-hidden="true" /> Dashboard
                      </Link>
                      <Link role="menuitem" href="/orders" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <ClipboardList className="w-4 h-4" aria-hidden="true" /> My Orders
                      </Link>
                      {user?.role === "admin" && (
                        <Link role="menuitem" href="/dashboard/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Shield className="w-4 h-4" aria-hidden="true" /> Admin Panel
                        </Link>
                      )}
                      <button
                        role="menuitem"
                        onClick={() => { setUserMenuOpen(false); logout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
                <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="icon-btn xl:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3">
            <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav aria-label="Mobile" className="xl:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {[...NAV_LINKS, { href: "/products?category=sports", label: "Sports & Fitness" }, { href: "/products?category=furniture", label: "Furniture" }].map(({ href, label }) => (
            <Link key={href} href={href} className="block py-2 text-gray-700 hover:text-primary-600 font-medium">
              {label}
            </Link>
          ))}
          {!isAuthenticated && !isLoading && (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Link href="/auth/login" className="btn-secondary text-sm flex-1 text-center">Sign In</Link>
              <Link href="/auth/register" className="btn-primary text-sm flex-1 text-center">Sign Up</Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
