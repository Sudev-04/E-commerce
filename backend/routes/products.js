const express = require("express");
const { body } = require("express-validator");
const {
  getProducts, getFeatured, getCategories,
  getProduct, createProduct, updateProduct, deleteProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/loggerMiddleware");

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeatured);
router.get("/categories", getCategories);
router.get("/:id", getProduct);

router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("name").trim().notEmpty().withMessage("Product name required"),
    body("price").isFloat({ min: 0 }).withMessage("Valid price required"),
    body("category").notEmpty().withMessage("Category required"),
    body("stock").isInt({ min: 0 }).withMessage("Valid stock required"),
  ],
  validate,
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
    body("price").optional().isFloat({ min: 0 }).withMessage("Valid price required"),
    body("originalPrice").optional().isFloat({ min: 0 }).withMessage("Valid original price required"),
    body("stock").optional().isInt({ min: 0 }).withMessage("Valid stock required"),
    body("images").optional().isArray().withMessage("Images must be a list"),
    body("tags").optional().isArray().withMessage("Tags must be a list"),
  ],
  validate,
  updateProduct
);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
