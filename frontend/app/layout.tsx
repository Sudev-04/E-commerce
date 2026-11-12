import type { Metadata } from "next";
import { Jost, Marcellus } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { CartProvider } from "./components/CartProvider";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const body = Jost({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const display = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: { default: "IndiBazaar | Electronics, Fashion, Home & More", template: "%s | IndiBazaar" },
  description:
    "Shop electronics, fashion, furniture, home & kitchen, sports and accessories at great prices. Free delivery on orders over ₹499 and easy 30-day returns.",
  keywords: ["online shopping", "electronics", "fashion", "home and kitchen", "furniture", "india"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className={`${body.variable} ${display.variable} bg-surface min-h-screen flex flex-col`}>
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
