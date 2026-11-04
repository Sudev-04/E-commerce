const store = require("../models/store");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorMiddleware");
const { calcTotals } = require("../utils/pricing");

const PAYMENT_METHODS = ["cod", "upi", "card"];

// POST /api/orders — place an order from the current cart
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return sendError(res, "Choose a valid payment method.", 422);
  }

  const cart = store.cart.get(req.user.id);
  if (cart.items.length === 0) {
    return sendError(res, "Your cart is empty.", 400);
  }

  // Re-price every line from the catalog and check stock before committing anything
  const items = [];
  for (const line of cart.items) {
    const product = store.products.findById(line.productId);
    if (!product) {
      return sendError(res, `"${line.name}" is no longer available. Remove it from your cart to continue.`, 409);
    }
    if (product.stock < line.quantity) {
      return sendError(res, `Only ${product.stock} of "${product.name}" left in stock. Update the quantity to continue.`, 409);
    }
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
      quantity: line.quantity,
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

  store.cart.clear(req.user.id);
  return sendSuccess(res, { data: order }, "Order placed.", 201);
});

// GET /api/orders — the signed-in user's orders
const getMyOrders = asyncHandler(async (req, res) => {
  return sendSuccess(res, { data: store.orders.findByUser(req.user.id) }, "Orders fetched.");
});

// GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = store.orders.findById(req.params.id);
  if (!order || (order.userId !== req.user.id && req.user.role !== "admin")) {
    throw new AppError("Order not found.", 404);
  }
  return sendSuccess(res, { data: order }, "Order fetched.");
});

module.exports = { createOrder, getMyOrders, getOrder };
