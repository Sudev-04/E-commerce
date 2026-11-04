const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color =
      status >= 500 ? "\x1b[31m" : // red
      status >= 400 ? "\x1b[33m" : // yellow
      status >= 300 ? "\x1b[36m" : // cyan
      "\x1b[32m"; // green

    if (process.env.NODE_ENV === "development") {
      console.log(
        `${color}[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${status} ${duration}ms\x1b[0m`
      );
    }
  });

  next();
};

/**
 * Validation middleware factory using express-validator.
 */
const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

module.exports = { requestLogger, validate };
