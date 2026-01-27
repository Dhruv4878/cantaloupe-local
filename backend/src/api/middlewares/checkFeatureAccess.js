const subscriptionService = require('../../services/subscriptionService');
const UserSubscription = require('../../models/UserSubscription');

module.exports = function checkFeatureAccess(featureKey) {
  return async function (req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Check for suspended paid plans first - BLOCK ALL API CALLS
      const anySubscription = await UserSubscription.findOne({
        user_id: userId
      }).populate('plan_id').sort({ createdAt: -1 }); // Get most recent subscription

      // If user has a paid plan that's been suspended by admin, block ALL access
      // BUT exclude cancelled/failed payments (payment_status: 'pending' with cancelled/failed transactions)
      if (anySubscription && anySubscription.plan_id?.name !== 'Free' && anySubscription.is_active === false) {
        // Check if this is a cancelled/failed payment vs admin suspension
        if (anySubscription.payment_status === 'pending') {
          // Check if there's a cancelled or failed transaction for this subscription
          const Transaction = require('../../models/Transaction');
          const relatedTransaction = await Transaction.findOne({
            user_id: userId,
            $or: [
              { 'gateway_response.notes.subscriptionId': anySubscription._id.toString() },
              { 'gateway_response.receipt': `sub_${anySubscription._id}` }
            ],
            status: { $in: ['cancelled', 'failed'] }
          });

          // If there's a cancelled/failed transaction, don't block access - this is not admin suspension
          if (relatedTransaction) {
            // Continue to normal subscription check
          } else {
            // This is likely an admin suspension, block access
            return res.status(403).json({
              message: 'Unusual activity detected. Your subscription has been temporarily suspended.',
              suspendedPlan: true
            });
          }
        } else {
          // This is a completed subscription that was later suspended by admin
          return res.status(403).json({
            message: 'Unusual activity detected. Your subscription has been temporarily suspended.',
            suspendedPlan: true
          });
        }
      }

      // Continue with normal subscription check for active plans only
      const subscription = await subscriptionService.getActiveSubscriptionByUser(userId);

      // For basic AI features, allow if user has any active subscription or credits
      const basicFeatures = ['ai_post_generation', 'caption_generator', 'hashtag_generator'];
      if (basicFeatures.includes(featureKey)) {
        // Allow if user has active subscription OR if they have credit limits (basic users)
        if (subscription?.is_active) {
          return next();
        }

        // Check if user has credit limits (basic users without subscription)
        const User = require('../../models/userModel');
        const user = await User.findById(userId);
        if (user && (user.creditLimit > 0)) {
          return next();
        }

        return res.status(403).json({ message: 'Your plan does not allow this feature (no active subscription or credits)' });
      }

      // For other features, check subscription and plan features
      if (!subscription || !subscription.is_active) {
        return res.status(403).json({ message: 'Your plan does not allow this feature (no active subscription)' });
      }

      const plan = subscription.plan_id;
      const features = plan?.features || {};

      // Check if feature is explicitly enabled in the plan
      if (features[featureKey] === true) {
        return next();
      }

      // If feature is not enabled, deny access
      return res.status(403).json({ message: 'Your plan does not allow this feature' });
    } catch (err) {
      console.error('Feature check error:', err);
      return res.status(500).json({ message: 'Feature check failed' });
    }
  };
};
