require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/orders");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { requestLogger } = require("./middleware/loggerMiddleware");
const persist = require("./models/persist");

const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Saving to MongoDB ──────────────────────────────────────────────────────
// Any successful change (sign-up, cart, order, admin edit…) triggers a save.
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    res.on("finish", () => {
      if (res.statusCode < 400) persist.scheduleSave();
    });
  }
  next();
});

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// Browser traffic reaches this API through the Next.js server (BFF proxy), so every
// request shares the frontend server's IP. The proxy forwards the shopper's IP in
// X-Client-IP so limits apply per shopper rather than to the whole site.
const clientKey = (req) => req.get("x-client-ip") || req.ip;

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  keyGenerator: clientKey,
  // Public catalog reads are cached by Next.js (ISR) and are not rate limited
  skip: (req) => req.method === "GET" && req.path.startsWith("/api/products"),
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: clientKey,
  // Only count credential attempts; session refreshes and logouts are not limited here
  skip: (req) => !["/login", "/register"].includes(req.path),
  message: { success: false, message: "Too many sign-in attempts. Please wait a few minutes and try again." },
});

app.use(globalLimiter);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(requestLogger);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// ─── Error Handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
persist
  .connect()
  .catch((err) => console.error("💾 Could not connect to MongoDB, running from memory only:", err.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`📦 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}\n`);
    });
  });

// Save any last changes before Render stops the server
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    await persist.flush();
    process.exit(0);
  });
}

module.exports = app;
