const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const superAdminAuth = require("../middleware/superAdminAuth");

// Apply authentication middleware to all routes
router.use(superAdminAuth);

router.get("/stats", analyticsController.getDashboardStats);
router.get("/graph", analyticsController.getTransactionAnalytics);
router.get("/recent", analyticsController.getRecentTransactions);

module.exports = router;
