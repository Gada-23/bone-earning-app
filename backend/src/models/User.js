const mongoose = require("mongoose");
const { nanoid } = require("nanoid");

const withdrawalSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

const rewardEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  source: {
    type: String,
    enum: ["ad_watch", "daily_bonus", "referral", "reward_callback"],
    default: "reward_callback",
  },
  createdAt: { type: Date, default: Date.now },
  transactionId: { type: String },
});

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  adsWatched: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  lastClaimDate: { type: Date },
  referralCount: { type: Number, default: 0 },
  referralCode: {
    type: String,
    unique: true,
    default: () => `ref_${nanoid(8)}`,
  },
  referredBy: { type: String },
  withdrawals: [withdrawalSchema],
  rewardHistory: [rewardEntrySchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
