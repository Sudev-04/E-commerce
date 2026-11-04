const bcrypt = require("bcryptjs");
const store = require("../models/store");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/apiResponse");

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = store.users.findByEmail(email);
  if (existing) {
    return sendError(res, "Email already registered.", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = store.users.create({
    name,
    email,
    password: hashedPassword,
    role: "user",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
  });

  const { password: _, ...safeUser } = user;
  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  const refreshToken = generateRefreshToken({ id: user.id });
  store.tokens.add(refreshToken);

  return sendSuccess(
    res,
    { user: safeUser, accessToken, refreshToken },
    "Registration successful.",
    201
  );
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = store.users.findByEmail(email);
  if (!user) {
    return sendError(res, "Invalid email or password.", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, "Invalid email or password.", 401);
  }

  const { password: _, ...safeUser } = user;
  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  const refreshToken = generateRefreshToken({ id: user.id });
  store.tokens.add(refreshToken);

  return sendSuccess(res, { user: safeUser, accessToken, refreshToken }, "Login successful.");
});

// POST /api/auth/refresh
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) return sendError(res, "Refresh token required.", 400);
  if (!store.tokens.has(token)) return sendError(res, "Invalid refresh token.", 401);

  const decoded = verifyRefreshToken(token);
  const user = store.users.findById(decoded.id);
  if (!user) return sendError(res, "User not found.", 401);

  store.tokens.delete(token);
  const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  const newRefreshToken = generateRefreshToken({ id: user.id });
  store.tokens.add(newRefreshToken);

  return sendSuccess(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, "Token refreshed.");
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (token) store.tokens.delete(token);
  return sendSuccess(res, {}, "Logged out successfully.");
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = store.users.findById(req.user.id);
  if (!user) return sendError(res, "User not found.", 404);
  const { password: _, ...safeUser } = user;
  return sendSuccess(res, { user: safeUser }, "User fetched.");
});

module.exports = { register, login, refreshToken, logout, getMe };
