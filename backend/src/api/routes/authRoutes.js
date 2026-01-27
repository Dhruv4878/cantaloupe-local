// backend/src/api/routes/authRoutes.js

const express = require("express");
const router = express.Router();

// ✅ Import correct handlers (MATCH authController.js EXACTLY)
const {
  sendSignupOtp,
  verifySignupOtp,
  loginUser,
  googleLogin,
} = require("../controllers/authController");

// =====================
// SIGNUP (EMAIL + OTP)
// =====================
router.post("/send-otp", sendSignupOtp);
router.post("/verify-otp", verifySignupOtp);

// =====================
// LOGIN
// =====================
router.post("/login", loginUser);

// =====================
// GOOGLE LOGIN / SIGNUP
// =====================
router.post("/google-login", googleLogin);

module.exports = router;
