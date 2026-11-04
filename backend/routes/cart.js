const express = require("express");
const { body } = require("express-validator");
const { getCart, addToCart, mergeCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/loggerMiddleware");

const router = express.Router();

router.use(protect); // All cart routes require auth

router.get("/", getCart);
router.post(
  "/add",
  [
    body("productId").notEmpty().withMessage("Product ID required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  ],
  validate,
  addToCart
);
router.post(
  "/merge",
  [body("items").isArray({ max: 100 }).withMessage("Items must be an array")],
  validate,
  mergeCart
);
router.put(
  "/update",
  [
    body("productId").notEmpty().withMessage("Product ID required"),
    body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1"),
  ],
  validate,
  updateCartItem
);
router.delete("/remove/:productId", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;
