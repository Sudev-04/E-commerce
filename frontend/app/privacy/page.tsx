import type { Metadata } from "next";
import InfoPage from "../components/InfoPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How ShopNext collects, uses and protects your personal information.",
};

export default function Page() {
  return (
    <InfoPage title="Privacy Policy">
      <p className="text-sm text-gray-500">Last updated: 4 November 2026</p>
      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address and a securely hashed password.</li>
        <li><strong>Order details:</strong> delivery address, mobile number and the items you buy.</li>
        <li><strong>Cart:</strong> items you add to your cart. As a guest, your cart is stored only in your browser.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use your information only to run your account, process and deliver orders, and provide support. We do not sell your data.</p>
      <h2>Cookies</h2>
      <p>
        We use essential, secure (httpOnly) cookies to keep you signed in. They cannot be read by scripts on
        the page and are removed when you sign out.
      </p>
      <h2>Your choices</h2>
      <p>You can sign out at any time, and you can contact us to ask for your account to be deleted.</p>
    </InfoPage>
  );
}
