// backend/src/api/routes/authRoutes.js

const express = require('express');
const router = express.Router();

// 1. Include auth handlers
const { registerUser, loginUser, googleLogin } = require('../controllers/authController');

// This is your existing route for email registration
router.post('/register', registerUser);

// This is your existing route for email login
router.post('/login', loginUser);

// 2. Add this new route for handling the Firebase Google Sign-In
router.post('/google-login', googleLogin);

module.exports = router;