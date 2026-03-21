const User = require("../models/User");
const logger = require("../utils/logger");

const getUserByTelegramId = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createUser = async (req, res) => {
  const { telegramId, username, firstName, lastName, referralCode } = req.body;
  if (!telegramId)
    return res
      .status(400)
      .json({ success: false, message: "telegramId is required" });
  try {
    let user = await User.findOne({ telegramId });
    if (user) return res.status(200).json({ success: true, user });

    const data = { telegramId, username, firstName, lastName };
    if (referralCode) data.referredBy = referralCode;

    user = new User(data);

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer && referrer.telegramId !== telegramId) {
        referrer.balance += 10;
        referrer.totalEarned += 10;
        referrer.referralCount += 1;
        await referrer.save();
        user.referredBy = referrer.telegramId;
      }
    }

    await user.save();
    res.status(201).json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateUser = async (req, res) => {
  const { telegramId, ...updates } = req.body;
  if (!telegramId)
    return res
      .status(400)
      .json({ success: false, message: "telegramId is required" });
  try {
    const user = await User.findOneAndUpdate(
      { telegramId },
      { ...updates, updatedAt: Date.now() },
      { new: true },
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addBones = async (req, res) => {
  const { telegramId, amount, source = "ad_watch" } = req.body;
  if (!telegramId || !amount)
    return res
      .status(400)
      .json({ success: false, message: "telegramId and amount are required" });
  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    user.balance += amount;
    user.totalEarned += amount;
    user.adsWatched += source === "ad_watch" ? 1 : 0;
    user.rewardHistory.push({
      amount,
      source,
      transactionId: req.body.transactionId || null,
    });

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const claimDaily = async (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId)
    return res
      .status(400)
      .json({ success: false, message: "telegramId is required" });

  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const today = new Date().toDateString();
    if (
      user.lastClaimDate &&
      new Date(user.lastClaimDate).toDateString() === today
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Daily bonus already claimed" });
    }

    let lastDate = user.lastClaimDate
      ? new Date(user.lastClaimDate).toDateString()
      : null;
    let streak = 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastDate === yesterday.toDateString()) {
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 1;
      }
    } else {
      user.dailyStreak = 1;
    }

    let bonus;
    if (user.dailyStreak === 1) bonus = 5;
    else if (user.dailyStreak >= 2 && user.dailyStreak <= 6)
      bonus = 4 + user.dailyStreak;
    else if (user.dailyStreak === 7) bonus = 15;
    else if (user.dailyStreak >= 30) bonus = 50;
    else bonus = 10;

    user.balance += bonus;
    user.totalEarned += bonus;
    user.lastClaimDate = new Date();
    user.rewardHistory.push({ amount: bonus, source: "daily_bonus" });
    await user.save();

    res.json({ success: true, user, bonus });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const processReferral = async (req, res) => {
  const { telegramId, referralCode } = req.body;
  if (!telegramId || !referralCode)
    return res
      .status(400)
      .json({
        success: false,
        message: "telegramId and referralCode are required",
      });

  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.referredBy)
      return res
        .status(400)
        .json({ success: false, message: "Referral already applied" });
    if (user.referralCode === referralCode)
      return res
        .status(400)
        .json({ success: false, message: "Cannot refer yourself" });

    const referrer = await User.findOne({ referralCode });
    if (!referrer)
      return res
        .status(404)
        .json({ success: false, message: "Referral code invalid" });

    user.referredBy = referrer.telegramId;
    user.balance += 10;
    user.totalEarned += 10;
    user.rewardHistory.push({ amount: 10, source: "referral" });
    await user.save();

    referrer.balance += 10;
    referrer.totalEarned += 10;
    referrer.referralCount += 1;
    referrer.rewardHistory.push({ amount: 10, source: "referral" });
    await referrer.save();

    res.json({ success: true, user, referrer });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const leaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ balance: -1 })
      .limit(20)
      .select("telegramId username balance totalEarned");
    res.json({ success: true, leaderboard: users });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const withdraw = async (req, res) => {
  const { telegramId, amount } = req.body;
  const min = 1000;
  if (!telegramId || !amount)
    return res
      .status(400)
      .json({ success: false, message: "telegramId and amount are required" });
  if (amount < min)
    return res
      .status(400)
      .json({ success: false, message: `Minimum withdrawal is ${min} bones` });

  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const pendingCount = user.withdrawals.filter(
      (w) => w.status === "pending",
    ).length;
    if (pendingCount >= 1)
      return res
        .status(400)
        .json({ success: false, message: "Existing pending withdrawal" });
    if (user.balance < amount)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });

    user.balance -= amount;
    user.withdrawals.push({ amount, status: "pending" });
    await user.save();

    res.json({ success: true, message: "Withdrawal requested", user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminProcessWithdrawal = async (req, res) => {
  const { telegramId, withdrawalId, action } = req.body;
  if (!telegramId || !withdrawalId || !["approve", "reject"].includes(action)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid parameters" });
  }
  try {
    const user = await User.findOne({ telegramId });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const withdrawal = user.withdrawals.id(withdrawalId);
    if (!withdrawal)
      return res
        .status(404)
        .json({ success: false, message: "Withdrawal not found" });

    if (withdrawal.status !== "pending")
      return res
        .status(400)
        .json({ success: false, message: "Already processed" });
    withdrawal.status = action === "approve" ? "approved" : "rejected";
    withdrawal.processedAt = Date.now();

    if (action === "reject") {
      user.balance += withdrawal.amount;
    }

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const rewardCallback = async (req, res) => {
  const apiKey = req.headers["x-adsgram-api-key"] || req.query.key;
  if (!apiKey || apiKey !== process.env.ADSGRAM_API_KEY) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid API key." });
  }

  const { user_id, amount, transaction_id } = req.body;
  if (!user_id || !amount) {
    return res
      .status(400)
      .json({ success: false, message: "user_id and amount required." });
  }

  try {
    const user = await User.findOne({ telegramId: user_id });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (
      transaction_id &&
      user.rewardHistory.some((x) => x.transactionId === transaction_id)
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Duplicate reward transaction." });
    }

    user.balance += amount;
    user.totalEarned += amount;
    user.adsWatched += 1;

    const now = new Date();
    const todayStr = now.toDateString();
    const lastClaimStr = user.lastClaimDate
      ? new Date(user.lastClaimDate).toDateString()
      : null;

    if (lastClaimStr === todayStr) {
      // no streak change
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastClaimStr === yesterday.toDateString()) {
        user.dailyStreak += 1;
      } else {
        user.dailyStreak = 1;
      }
    }
    user.lastClaimDate = now;

    user.rewardHistory.push({
      amount,
      source: "reward_callback",
      transactionId: transaction_id || null,
    });
    await user.save();

    logger.info(`Reward added: ${amount} bones to ${user_id} via AdsGram`);
    res.json({ success: true, user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getStats = async (req, res) => {
  const { telegramId } = req.params;
  try {
    const user = await User.findOne({ telegramId }).select("-rewardHistory");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, stats: user });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getUserByTelegramId,
  createUser,
  updateUser,
  addBones,
  withdraw,
  claimDaily,
  processReferral,
  leaderboard,
  rewardCallback,
  getStats,
  adminProcessWithdrawal,
};
