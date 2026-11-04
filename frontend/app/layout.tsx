import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { CartProvider } from "./components/CartProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "ShopNext — Electronics, Fashion, Home & More", template: "%s | ShopNext" },
  description:
    "Shop electronics, fashion, furniture, home & kitchen, sports and accessories at great prices. Free delivery on orders over ₹499 and easy 30-day returns.",
  keywords: ["online shopping", "electronics", "fashion", "home and kitchen", "furniture", "india"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${inter.className} bg-surface min-h-screen flex flex-col`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
