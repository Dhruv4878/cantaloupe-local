const subscriptionService = require('../../services/subscriptionService');

module.exports = async function (req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const subscription = await subscriptionService.getActiveSubscriptionByUser(userId);
    if (!subscription || !subscription.is_active) return res.status(403).json({ message: 'No active subscription' });

    next();
  } catch (err) {
    console.error('Subscription active check failed:', err);
    return res.status(500).json({ message: 'Subscription check failed' });
  }
};