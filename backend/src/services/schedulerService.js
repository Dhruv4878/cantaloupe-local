const cron = require('node-cron');
const User = require('../models/userModel');
const UserSubscription = require('../models/UserSubscription');
const Plan = require('../models/Plan');
const emailService = require('./emailService');

// Check for subscriptions expiring in 3 days
async function checkExpiringSubscriptions() {
  console.log('⏰ Scheduler: Checking for expiring subscriptions...');
  try {
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);

    // Set time to start of day for comparison matching
    const startOfTargetDay = new Date(threeDaysLater.setHours(0, 0, 0, 0));
    const endOfTargetDay = new Date(threeDaysLater.setHours(23, 59, 59, 999));

    const expiringSubscriptions = await UserSubscription.find({
      is_active: true,
      end_date: {
        $gte: startOfTargetDay,
        $lte: endOfTargetDay
      }
    }).populate('plan_id');

    console.log(`⏰ Scheduler: Found ${expiringSubscriptions.length} subscriptions expiring on ${startOfTargetDay.toLocaleDateString()}`);

    for (const sub of expiringSubscriptions) {
      if (!sub.plan_id) continue;

      const user = await User.findById(sub.user_id);
      if (user) {
        try {
          const formattedDate = new Date(sub.end_date).toLocaleDateString();
          await emailService.sendSubscriptionExpiringEmail(user, sub.plan_id, formattedDate);
          console.log(`✅ Sent expiration warning to ${user.email}`);
        } catch (err) {
          console.error(`❌ Failed to send expiration email to user ${sub.user_id}:`, err.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Scheduler Error (Expiring Subscriptions):', error);
  }
}

// Check for low credits
async function checkLowCredits() {
  console.log('⏰ Scheduler: Checking for low credits...');
  try {
    const LOW_CREDIT_THRESHOLD = 5;

    // Find users with low credits who haven't been notified in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lowCreditUsers = await User.find({
      creditLimit: { $gt: 0, $lte: LOW_CREDIT_THRESHOLD },
      active: true,
      $or: [
        { lastLowCreditNotificationDate: { $lt: sevenDaysAgo } },
        { lastLowCreditNotificationDate: null }
      ]
    });

    console.log(`⏰ Scheduler: Found ${lowCreditUsers.length} users with low credits`);

    for (const user of lowCreditUsers) {
      try {
        await emailService.sendLowCreditsEmail(user, user.creditLimit);

        // Update notification date
        user.lastLowCreditNotificationDate = new Date();
        await user.save();

        console.log(`✅ Sent low credit warning to ${user.email}`);
      } catch (err) {
        console.error(`❌ Failed to send low credit email to user ${user._id}:`, err.message);
      }
    }

  } catch (error) {
    console.error('❌ Scheduler Error (Low Credits):', error);
  }
}

function initScheduler() {
  console.log('🚀 Scheduler Service Initialized');

  // Schedule daily check at 10:00 AM
  cron.schedule('0 10 * * *', () => {
    checkExpiringSubscriptions();
    checkLowCredits();
  }, {
    timezone: "Asia/Kolkata"
  });

  // Run checks immediately on startup (for testing purposes only - remove in production or use a flag)
  // setTimeout(() => {
  //   checkExpiringSubscriptions();
  //   checkLowCredits();
  // }, 10000);
}

module.exports = {
  initScheduler,
  checkExpiringSubscriptions, // Exported for testing/manual triggering
  checkLowCredits
};
