const jwt = require("jsonwebtoken");

// Secrets must come from the environment in production. A fixed development
// fallback keeps `npm run dev` working out of the box (see backend/.env.example).
const DEV_FALLBACK = "dev-only-secret-change-me";
const getSecret = (name) => {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} is not set. Add it to the backend environment.`);
  }
  return `${DEV_FALLBACK}-${name}`;
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, getSecret("JWT_SECRET"), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: "ecommerce-api",
    audience: "ecommerce-client",
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    issuer: "ecommerce-api",
    audience: "ecommerce-client",
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, getSecret("JWT_SECRET"), {
    issuer: "ecommerce-api",
    audience: "ecommerce-client",
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, getSecret("JWT_REFRESH_SECRET"), {
    issuer: "ecommerce-api",
    audience: "ecommerce-client",
  });
};

const decodeToken = (token) => jwt.decode(token);

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
