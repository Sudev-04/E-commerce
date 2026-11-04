const express = require("express");
const { body } = require("express-validator");
const { createOrder, getMyOrders, getOrder } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/loggerMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyOrders);
router.get("/:id", getOrder);
router.post(
  "/",
  [
    body("shippingAddress.fullName").trim().notEmpty().withMessage("Full name is required"),
    body("shippingAddress.phone")
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage("Enter a valid 10-digit mobile number"),
    body("shippingAddress.line1").trim().notEmpty().withMessage("Address is required"),
    body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
    body("shippingAddress.state").trim().notEmpty().withMessage("State is required"),
    body("shippingAddress.pincode")
      .trim()
      .matches(/^[1-9]\d{5}$/)
      .withMessage("Enter a valid 6-digit PIN code"),
    body("paymentMethod").isIn(["cod", "upi", "card"]).withMessage("Choose a valid payment method"),
  ],
  validate,
  createOrder
);

module.exports = router;
