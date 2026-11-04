const express = require("express");
const store = require("../models/store");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/authMiddleware");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const router = express.Router();

// GET /api/users (Admin only)
router.get(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const users = store.users.findAll();
    return sendSuccess(res, { data: users }, "Users fetched.");
  })
);

// GET /api/users/profile
router.get(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const user = store.users.findById(req.user.id);
    if (!user) return sendError(res, "User not found.", 404);
    const { password: _, ...safeUser } = user;
    return sendSuccess(res, { data: safeUser }, "Profile fetched.");
  })
);

// PUT /api/users/profile
router.put(
  "/profile",
  protect,
  asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;
    const updated = store.users.update(req.user.id, { name, avatar });
    if (!updated) return sendError(res, "User not found.", 404);
    const { password: _, ...safeUser } = updated;
    return sendSuccess(res, { data: safeUser }, "Profile updated.");
  })
);

module.exports = router;
