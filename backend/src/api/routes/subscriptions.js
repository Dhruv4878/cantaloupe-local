const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/user/subscribe', authMiddleware, subscriptionController.subscribe);
router.get('/user/subscription', authMiddleware, subscriptionController.getCurrentSubscription);
router.get('/subscription/current', authMiddleware, subscriptionController.getCurrentPlanDetails);

module.exports = router;
