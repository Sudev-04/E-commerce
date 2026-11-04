const { verifyAccessToken } = require("../utils/jwt");
const store = require("../models/store");
const { sendError } = require("../utils/apiResponse");

/**
 * Protect routes — verifies JWT access token.
 * Attaches decoded user to req.user.
 */
const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Access denied. No token provided.", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(res, "Access denied. Invalid token format.", 401);
    }

    const decoded = verifyAccessToken(token);

    // Check user still exists
    const user = store.users.findById(decoded.id);
    if (!user) {
      return sendError(res, "User no longer exists.", 401);
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return sendError(res, "Token expired. Please log in again.", 401);
    }
    if (err.name === "JsonWebTokenError") {
      return sendError(res, "Invalid token.", 401);
    }
    return sendError(res, "Authentication failed.", 401);
  }
};

/**
 * Optional auth — attaches user if token present, continues otherwise.
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const user = store.users.findById(decoded.id);
      if (user) {
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
      }
    }
  } catch (_) {
    // silently ignore invalid tokens for optional routes
  }
  next();
};

/**
 * Role-based authorization middleware factory.
 * Usage: authorize("admin") or authorize("admin", "manager")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Authentication required.", 401);
    }
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
