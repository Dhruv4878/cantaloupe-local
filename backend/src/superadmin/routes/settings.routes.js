const express = require('express');
const router = express.Router();
const superAdminAuth = require('../middleware/superAdminAuth');
const settingsController = require('../controllers/settings.controller');

// Get global discount
router.get('/discount', superAdminAuth, settingsController.getGlobalDiscount);

// Set global discount
router.post('/discount', superAdminAuth, settingsController.setGlobalDiscount);

module.exports = router;
