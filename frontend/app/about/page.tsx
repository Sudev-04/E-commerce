import type { Metadata } from "next";
import InfoPage from "../components/InfoPage";

export const metadata: Metadata = {
  title: "About Us",
  description: "ShopNext is an online store for electronics, fashion, home & kitchen, furniture, sports and accessories.",
};

export default function Page() {
  return (
    <InfoPage title="About Us">
      <p>
        ShopNext is an online store for everyday essentials and things you&apos;ll love: electronics, fashion,
        home &amp; kitchen, furniture, sports gear and accessories, all in one place.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li><strong>Fair prices.</strong> Every price includes GST, and we show the MRP so you can see what you save.</li>
        <li><strong>Fast, free delivery</strong> on orders over ₹499, with a simple ₹49 delivery fee below that.</li>
        <li><strong>Easy returns</strong> within 30 days of delivery.</li>
        <li><strong>Flexible payment:</strong> UPI, cards or cash on delivery.</li>
      </ul>
      <p>
        ShopNext is a demonstration project built as a full-stack e-commerce application. Orders placed
        here are not fulfilled and no payment is taken.
      </p>
    </InfoPage>
  );
}
