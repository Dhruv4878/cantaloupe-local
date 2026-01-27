const UserSubscription = require('../models/UserSubscription');
const Post = require('../models/postModel');

/**
 * Get current subscription cycle for a user
 * @param {String} userId 
 * @returns {Object} { startDate, endDate, isActive }
 */
async function getCurrentSubscriptionCycle(userId) {
  const subscription = await UserSubscription.findOne({
    user_id: userId,
    is_active: true
  }).populate('plan_id');

  if (!subscription) {
    return { startDate: null, endDate: null, isActive: false };
  }

  return {
    startDate: subscription.start_date,
    endDate: subscription.end_date,
    isActive: subscription.is_active,
    subscription: subscription
  };
}

/**
 * Get monthly posts used in current subscription cycle
 * @param {String} userId 
 * @returns {Number} Number of posts used in current cycle
 */
async function getMonthlyPostsUsed(userId) {
  const cycle = await getCurrentSubscriptionCycle(userId);

  if (!cycle.isActive || !cycle.startDate) {
    return 0;
  }

  // Count posts that used monthly plan (usedCredits: false or not set) 
  // within the current subscription cycle
  const monthlyPostsUsed = await Post.countDocuments({
    userId,
    createdAt: {
      $gte: cycle.startDate,
      $lte: cycle.endDate
    },
    $or: [
      { usedCredits: false },
      { usedCredits: { $exists: false } }
    ]
  });

  return monthlyPostsUsed;
}

/**
 * Get monthly posts limit for user's current plan
 * @param {String} userId 
 * @returns {Number} Monthly posts limit
 */
async function getMonthlyPostsLimit(userId) {
  const cycle = await getCurrentSubscriptionCycle(userId);

  if (!cycle.isActive || !cycle.subscription) {
    return 0;
  }

  const plan = cycle.subscription.plan_id;
  return Number(
    plan.posts_per_month ||
    plan.postsPerMonth ||
    plan.features?.posts_per_month ||
    plan.features?.postsPerMonth ||
    0
  );
}

/**
 * Check if user has remaining monthly posts in current cycle
 * @param {String} userId 
 * @returns {Object} { hasRemaining, used, limit, remaining }
 */
async function checkMonthlyPostsAvailability(userId) {
  const used = await getMonthlyPostsUsed(userId);
  const limit = await getMonthlyPostsLimit(userId);

  return {
    hasRemaining: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used)
  };
}

/**
 * Get subscription cycle info for display
 * @param {String} userId 
 * @returns {Object} Subscription cycle information
 */
async function getSubscriptionCycleInfo(userId) {
  const cycle = await getCurrentSubscriptionCycle(userId);
  const monthlyInfo = await checkMonthlyPostsAvailability(userId);

  return {
    isActive: cycle.isActive,
    startDate: cycle.startDate,
    endDate: cycle.endDate,
    daysRemaining: cycle.endDate ? Math.max(0, Math.ceil((cycle.endDate - new Date()) / (1000 * 60 * 60 * 24))) : 0,
    monthlyPosts: monthlyInfo
  };
}

module.exports = {
  getCurrentSubscriptionCycle,
  getMonthlyPostsUsed,
  getMonthlyPostsLimit,
  checkMonthlyPostsAvailability,
  getSubscriptionCycleInfo
};