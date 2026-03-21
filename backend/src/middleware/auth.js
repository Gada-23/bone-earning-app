const rateLimit = require("express-rate-limit");

const adsgramKeyMiddleware = (req, res, next) => {
  const key = req.headers["x-adsgram-api-key"] || req.query.key;
  if (!key || key !== process.env.ADSGRAM_API_KEY) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid AdsGram API key" });
  }
  next();
};

const adminKeyMiddleware = (req, res, next) => {
  const key = req.headers["x-admin-api-key"];
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid admin API key" });
  }
  next();
};

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const userAdRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.body.telegramId || req.params.telegramId || req.ip,
  message: { success: false, message: "Ad limit reached for this hour." },
});

module.exports = {
  adsgramKeyMiddleware,
  adminKeyMiddleware,
  limiter,
  userAdRateLimiter,
};
