// Pricing rules shared by cart and order endpoints.
// Prices are in INR and already include GST, so no tax is added on top.
// Keep these values in sync with frontend/lib/format.ts.
const FREE_SHIPPING_THRESHOLD = 499;
const SHIPPING_FEE = 49;
const GST_RATE = 0.18;

const roundRupees = (n) => Math.round(n * 100) / 100;

const calcSubtotal = (items) => items.reduce((acc, item) => acc + item.price * item.quantity, 0);

const calcTotals = (items) => {
  const subtotal = roundRupees(calcSubtotal(items));
  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  // GST portion already included in the item prices (for display on invoices)
  const gstIncluded = roundRupees(subtotal - subtotal / (1 + GST_RATE));
  return { subtotal, shipping, gstIncluded, total: roundRupees(subtotal + shipping) };
};

module.exports = { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GST_RATE, calcSubtotal, calcTotals };
