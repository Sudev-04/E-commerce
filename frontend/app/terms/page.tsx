import type { Metadata } from "next";
import InfoPage from "../components/InfoPage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use the ShopNext website.",
};

export default function Page() {
  return (
    <InfoPage title="Terms of Use">
      <p className="text-sm text-gray-500">Last updated: 4 November 2026</p>
      <h2>Using ShopNext</h2>
      <p>By using this website you agree to these terms. You must provide accurate information when creating an account or placing an order.</p>
      <h2>Prices and payment</h2>
      <p>All prices are in Indian Rupees (₹) and include GST. Delivery is free on orders of ₹499 or more; a ₹49 fee applies below that.</p>
      <h2>Returns</h2>
      <p>Most items can be returned within 30 days of delivery in their original condition.</p>
      <h2>Demo notice</h2>
      <p>ShopNext is a demonstration store. Orders are not shipped and no payment is collected.</p>
    </InfoPage>
  );
}
