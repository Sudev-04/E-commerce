const store = require("../models/store");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorMiddleware");
const { calcTotals } = require("../utils/pricing");

const PAYMENT_METHODS = ["cod", "upi", "card"];

// POST /api/orders — place an order.
// Normal checkout orders everything in the cart (and empties it).
// "Buy Now" sends { buyNow: { productId, quantity } } and orders only that item,
// leaving the cart untouched.
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, buyNow } = req.body;

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return sendError(res, "Choose a valid payment method.", 422);
  }

  let lines;
  if (buyNow) {
    lines = [{ productId: buyNow.productId, quantity: parseInt(buyNow.quantity, 10), name: "This item" }];
  } else {
    lines = store.cart.get(req.user.id).items;
    if (lines.length === 0) {
      return sendError(res, "Your cart is empty.", 400);
    }
  }

  // Re-price every line from the catalog and check stock before committing anything
  const items = [];
  for (const line of lines) {
    const product = store.products.findById(line.productId);
    if (!product) {
      return sendError(
        res,
        buyNow ? "This product is no longer available." : `"${line.name}" is no longer available. Remove it from your cart to continue.`,
        409
      );
    }
    if (product.stock < line.quantity) {
      return sendError(res, `Only ${product.stock} of "${product.name}" left in stock. Update the quantity to continue.`, 409);
    }
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price, // today's deal price when the product is on deal
      image: product.images[0] || "",
      quantity: line.quantity,
      freeDelivery: Boolean(product.deal),
    });
  }

  for (const item of items) {
    const product = store.products.findById(item.productId);
    store.products.update(product.id, { stock: product.stock - item.quantity });
  }

  const order = store.orders.create({
    userId: req.user.id,
    items,
    ...calcTotals(items),
    shippingAddress,
    paymentMethod,
  });

  if (!buyNow) store.cart.clear(req.user.id);
  return sendSuccess(res, { data: order }, "Order placed.", 201);
});

// GET /api/orders — the signed-in user's orders
const getMyOrders = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: store.orders.findByUser(req.user.id) }, "Orders fetched.");
});

const findOwnOrder = (req) => {
  const order = store.orders.findById(req.params.id);
  if (!order || (order.userId !== req.user.id && req.user.role !== "admin")) {
    throw new AppError("Order not found.", 404);
  }
  return order;
};

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: findOwnOrder(req) }, "Order fetched.");
});

// POST /api/orders/:id/cancel — allowed until the order ships; restocks the items
const cancelOrder = asyncHandler(async (req, res) => {
  const order = findOwnOrder(req);

  if (order.status !== "confirmed") {
    return sendError(res, `This order is already ${order.status} and can no longer be cancelled.`, 409);
  }

  for (const item of order.items) {
    const product = store.products.findById(item.productId);
    if (product) store.products.update(product.id, { stock: product.stock + item.quantity });
  }

  order.status = "cancelled";
  order.cancelledAt = new Date().toISOString();
  return sendSuccess(res, { data: order }, "Order cancelled.");
});

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder };
