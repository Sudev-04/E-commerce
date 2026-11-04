const store = require("../models/store");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorMiddleware");
const { calcSubtotal } = require("../utils/pricing");

// `total` is the items subtotal (prices include GST). Shipping is added at checkout.
const withTotal = (cart) => ({ ...cart, total: calcSubtotal(cart.items) });

const snapshot = (product, quantity) => ({
  productId: product.id,
  name: product.name,
  price: product.price,
  image: product.images[0] || "",
  quantity,
});

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = store.cart.get(req.user.id);
  return sendSuccess(res, { data: withTotal(cart) }, "Cart fetched.");
});

// POST /api/cart/add
const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = parseInt(req.body.quantity ?? 1, 10);

  const product = store.products.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  const cart = store.cart.get(req.user.id);
  const existing = cart.items.find((i) => i.productId === productId);
  const newQty = (existing ? existing.quantity : 0) + quantity;

  if (newQty > product.stock) {
    return sendError(res, `Only ${product.stock} in stock.`, 400);
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.items.push(snapshot(product, quantity));
  }

  const updated = store.cart.set(req.user.id, cart);
  return sendSuccess(res, { data: withTotal(updated) }, "Item added to cart.");
});

// POST /api/cart/merge — merge a guest cart into the signed-in user's cart
const mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  const cart = store.cart.get(req.user.id);

  for (const item of incoming) {
    const product = store.products.findById(item.productId);
    const qty = parseInt(item.quantity, 10);
    if (!product || !qty || qty < 1 || product.stock === 0) continue;

    const existing = cart.items.find((i) => i.productId === product.id);
    if (existing) {
      existing.quantity = Math.min(product.stock, existing.quantity + qty);
    } else {
      cart.items.push(snapshot(product, Math.min(product.stock, qty)));
    }
  }

  const updated = store.cart.set(req.user.id, cart);
  return sendSuccess(res, { data: withTotal(updated) }, "Cart merged.");
});

// PUT /api/cart/update
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = parseInt(req.body.quantity, 10);

  if (quantity < 1) {
    return sendError(res, "Quantity must be at least 1.", 400);
  }

  const product = store.products.findById(productId);
  if (!product) throw new AppError("Product not found.", 404);

  if (product.stock < quantity) {
    return sendError(res, `Only ${product.stock} in stock.`, 400);
  }

  const cart = store.cart.get(req.user.id);
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) throw new AppError("Item not in cart.", 404);

  item.quantity = quantity;
  const updated = store.cart.set(req.user.id, cart);
  return sendSuccess(res, { data: withTotal(updated) }, "Cart updated.");
});

// DELETE /api/cart/remove/:productId
const removeFromCart = asyncHandler(async (req, res) => {
  const cart = store.cart.get(req.user.id);
  cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
  const updated = store.cart.set(req.user.id, cart);
  return sendSuccess(res, { data: withTotal(updated) }, "Item removed.");
});

// DELETE /api/cart/clear
const clearCart = asyncHandler(async (req, res) => {
  const cleared = store.cart.clear(req.user.id);
  return sendSuccess(res, { data: withTotal(cleared) }, "Cart cleared.");
});

module.exports = { getCart, addToCart, mergeCart, updateCartItem, removeFromCart, clearCart };
