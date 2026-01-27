const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const usersController = require("../controllers/users.controller");
const statsController = require("../controllers/stats.controller");
const logsController = require("../controllers/logs.controller");
const adminPlansRoutes = require('./adminPlans');
const settingsRoutes = require('./settings.routes');

const superAdminAuth = require("../middleware/superAdminAuth");

/* ================================
   AUTH ROUTES (Public)
================================ */
router.post("/auth/login", authController.loginSuperAdmin);
// Logout super admin
router.post("/auth/logout", authController.logoutSuperAdmin);


/* ================================
   PROTECTED ROUTES (Using Middleware)
================================ */

// Get all users
router.get("/users", superAdminAuth, usersController.getAllUsers);

// Update user active/suspended state
router.put("/users/:id/active", superAdminAuth, usersController.updateUserActive);

// Update user plan active state
router.put("/users/:id/plan-active", superAdminAuth, usersController.updateUserPlanActive);

// Update user credit limit
router.put("/users/:id/credit", superAdminAuth, usersController.updateUserCredit);

// Get user transactions
router.get("/users/:id/transactions", superAdminAuth, usersController.getUserTransactions);

// Get platform stats
router.get("/stats", superAdminAuth, statsController.getStats);

// Get system logs
router.get("/logs", superAdminAuth, logsController.getLogs);

// Admin plans (manage subscription plans)
router.use('/', adminPlansRoutes);

// Settings routes (manage global discount)
router.use('/', settingsRoutes);

// TEMP check (optional)
router.get("/me", superAdminAuth, (req, res) => {
   return res.json({ superAdmin: req.superAdmin });
});

module.exports = router;
