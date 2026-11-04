import type { Metadata } from "next";
import InfoPage from "../components/InfoPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the ShopNext support team.",
};

export default function Page() {
  return (
    <InfoPage title="Contact Us">
      <p>We&apos;re happy to help with orders, returns, payments or anything else.</p>
      <h2>Customer support</h2>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:support@shopnext.example">support@shopnext.example</a></li>
        <li><strong>Hours:</strong> Monday to Sunday, 9:00 AM to 9:00 PM IST</li>
        <li><strong>Typical reply time:</strong> within one business day</li>
      </ul>
      <h2>Before you write</h2>
      <p>
        If your question is about an order, include the order number (for example <code>ORD-…</code>) from
        the <a href="/orders">My Orders</a> page so we can find it quickly.
      </p>
    </InfoPage>
  );
}
