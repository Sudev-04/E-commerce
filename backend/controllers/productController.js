const store = require("../models/store");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError, sendPaginated } = require("../utils/apiResponse");
const { AppError } = require("../middleware/errorMiddleware");

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, sort, minPrice, maxPrice, featured, page = 1, limit = 12 } = req.query;

  const filters = {
    ...(category && { category }),
    ...(search && { search }),
    ...(sort && { sort }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    ...(featured !== undefined && { featured: featured === "true" }),
    // Today's Deals: only well-discounted products, biggest saving first by default
    ...(req.query.deals === "true" && { deals: true, sort: sort || "discount" }),
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));

  const { result: allProducts, searchNote } = store.products.search(filters);
  const total = allProducts.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = allProducts.slice(startIndex, startIndex + limitNum);

  return sendPaginated(res, paginated, total, pageNum, limitNum, "Products fetched.", { searchNote });
});

// GET /api/products/featured
const getFeatured = asyncHandler(async (req, res) => {
  // Return every featured product so the homepage and the admin "Featured" count always agree
  const featured = store.products.findAll({ featured: true });
  return sendSuccess(res, { data: featured }, "Featured products fetched.");
});

// GET /api/products/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = store.products.getCategories();
  return sendSuccess(res, { data: categories }, "Categories fetched.");
});

// GET /api/products/:id
const getProduct = asyncHandler(async (req, res) => {
  const product = store.products.findById(req.params.id);
  if (!product) throw new AppError("Product not found.", 404);
  return sendSuccess(res, { data: product }, "Product fetched.");
});

// POST /api/products (Admin)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, category, brand, stock, images, tags, featured } = req.body;

  const product = store.products.create({
    name,
    description,
    price: parseFloat(price),
    originalPrice: Math.max(parseFloat(originalPrice || price), parseFloat(price)),
    category,
    brand,
    stock: parseInt(stock),
    images: images || [],
    tags: tags || [],
    featured: Boolean(featured),
    rating: 0,
    reviewCount: 0,
  });

  return sendSuccess(res, { data: product }, "Product created.", 201);
});

// PUT /api/products/:id (Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = store.products.findById(req.params.id);
  if (!product) throw new AppError("Product not found.", 404);

  const allowed = ["name", "description", "price", "originalPrice", "category", "brand", "stock", "images", "tags", "featured"];
  const changes = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) changes[key] = req.body[key];
  }
  if (changes.price !== undefined) changes.price = parseFloat(changes.price);
  if (changes.originalPrice !== undefined) changes.originalPrice = parseFloat(changes.originalPrice);
  if (changes.stock !== undefined) changes.stock = parseInt(changes.stock, 10);
  if (changes.featured !== undefined) changes.featured = Boolean(changes.featured);

  const updated = store.products.update(req.params.id, changes);
  return sendSuccess(res, { data: updated }, "Product updated.");
});

// DELETE /api/products/:id (Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = store.products.findById(req.params.id);
  if (!product) throw new AppError("Product not found.", 404);

  store.products.delete(req.params.id);
  return sendSuccess(res, {}, "Product deleted.");
});

module.exports = { getProducts, getFeatured, getCategories, getProduct, createProduct, updateProduct, deleteProduct };
