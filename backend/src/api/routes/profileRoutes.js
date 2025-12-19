const express = require('express');
const router = express.Router();

// This is the line that was likely causing the error.
// The path must be exactly correct.
const authMiddleware = require('../middlewares/authMiddleware');

// We import the controller functions.
const { getMyProfile, createOrUpdateProfile } = require('../controllers/profileController');

// Define the route to GET the current user's profile.
// The authMiddleware runs first, then the controller function.
router.get('/me', authMiddleware, getMyProfile);

// Define the route to POST (create or update) the current user's profile.
router.post('/', authMiddleware, createOrUpdateProfile);

module.exports = router;