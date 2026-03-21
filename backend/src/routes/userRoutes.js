const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const {
  adsgramKeyMiddleware,
  adminKeyMiddleware,
  limiter,
  userAdRateLimiter,
} = require("../middleware/auth");

router.use(limiter);

router.get("/user/:telegramId", userController.getUserByTelegramId);
router.post("/user/create", userController.createUser);
router.put("/user/update", userController.updateUser);
router.post("/user/add-bones", userAdRateLimiter, userController.addBones);
router.post("/user/withdraw", userController.withdraw);
router.post("/user/claim-daily", userController.claimDaily);
router.post("/user/referral", userController.processReferral);
router.get("/leaderboard", userController.leaderboard);
router.post("/reward", adsgramKeyMiddleware, userController.rewardCallback);
router.get("/stats/:telegramId", userController.getStats);
router.post(
  "/admin/withdrawals",
  adminKeyMiddleware,
  userController.adminProcessWithdrawal,
);

module.exports = router;
