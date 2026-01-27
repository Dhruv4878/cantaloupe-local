const planService = require('../../services/planService');
const paymentService = require('../../services/paymentService');
const subscriptionService = require('../../services/subscriptionService');
const Transaction = require('../../models/Transaction');
const User = require('../../models/userModel');
const UserUsage = require('../../models/UserUsage');
const Plan = require('../../models/Plan');
const Post = require('../../models/postModel');
const UserSubscription = require('../../models/UserSubscription');

// POST /api/user/subscribe
async function subscribe(req, res) {
  try {
    const userId = req.user?.id;
    const { plan_id, payment_mode } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!plan_id || !payment_mode) return res.status(400).json({ message: 'plan_id and payment_mode required' });

    const plan = await planService.getPlans({ activeOnly: true }).then(pls => pls.find(p => String(p._id) === String(plan_id)));
    if (!plan) return res.status(404).json({ message: 'Plan not found or not active' });

    // Amount determination
    let amount = payment_mode === 'yearly' ? (plan.price_yearly || plan.price_monthly * 12) : plan.price_monthly;

    // Create pending subscription
    const subscription = await subscriptionService.createPendingSubscription({ user_id: userId, plan_id, payment_mode, gateway: 'razorpay' });

    // Create payment order with gateway
    const receipt = `sub_${subscription._id}`;

    const order = await paymentService.createOrder({ amount, currency: 'INR', receipt, notes: { userId, planId: plan_id, subscriptionId: subscription._id.toString(), payment_mode } });

    // Create transaction record
    const tx = await subscriptionService.recordTransaction({
      user_id: userId,
      plan_id,
      amount,
      currency: 'INR',
      gateway_response: {
        id: order.id, // Store order ID for webhook matching
        ...order
      },
      status: 'pending'
    });

    return res.json({ subscriptionId: subscription._id, order, transaction: tx });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/user/subscription
async function getCurrentSubscription(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const sub = await subscriptionService.getActiveSubscriptionByUser(userId);
    if (!sub) return res.status(500).json({ message: 'Unable to retrieve subscription' });

    // Return plan's features and subscription meta
    const plan = sub.plan_id;
    return res.json({ subscription: sub, plan });
  } catch (err) {
    console.error('Get subscription error:', err);
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/subscription/current
async function getCurrentPlanDetails(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Get user data
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Get subscription (including suspended ones for paid plans)
    let activeSubscription = await UserSubscription.findOne({
      user_id: userId
    }).populate('plan_id').sort({ createdAt: -1 }); // Get most recent subscription

    // If no subscription found, auto-assign Free plan ONLY if user never had a paid plan
    if (!activeSubscription) {
      const freePlan = await Plan.findOne({ name: 'Free', status: 'active' });

      if (freePlan) {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setFullYear(endDate.getFullYear() + 100);

        activeSubscription = await UserSubscription.create({
          user_id: userId,
          plan_id: freePlan._id,
          payment_mode: 'monthly',
          payment_status: 'completed',
          gateway: 'system',
          is_active: true,
          start_date: now,
          end_date: endDate,
        });

        activeSubscription = await activeSubscription.populate('plan_id');
      } else {
        return res.status(500).json({ message: 'No subscription found and default Free plan not available.' });
      }
    }

    const plan = activeSubscription.plan_id;
    const postsPerMonth = Number(
      plan.posts_per_month ||
      plan.postsPerMonth ||
      plan.features?.posts_per_month ||
      plan.features?.postsPerMonth ||
      0
    );

    // 2. Calculate Monthly Usage (For Plan Stats) - Use subscription-based tracking
    const subscriptionUsageService = require('../../services/subscriptionUsageService');
    const subscriptionCycleInfo = await subscriptionUsageService.getSubscriptionCycleInfo(userId);

    let monthlyPostsUsed = 0;
    if (subscriptionCycleInfo.isActive && subscriptionCycleInfo.monthlyPosts.limit > 0) {
      // Use subscription-based monthly tracking
      monthlyPostsUsed = subscriptionCycleInfo.monthlyPosts.used;
    } else {
      // Fallback to calendar month for Free plans or users without active subscriptions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      monthlyPostsUsed = await Post.countDocuments({
        userId,
        createdAt: { $gte: startOfMonth },
        $or: [
          { usedCredits: false },
          { usedCredits: { $exists: false } }
        ]
      });
    }

    // 3. Calculate Credit Usage (Actual credit-based posts)
    // Count only posts that were actually generated using credits (usedCredits: true)
    const creditsUsed = await Post.countDocuments({
      userId,
      usedCredits: true
    });

    const hasActiveMonthlyPlan = activeSubscription && activeSubscription.is_active && postsPerMonth > 0;

    console.log(`User - Monthly: ${monthlyPostsUsed}/${postsPerMonth}, Credits used (actual): ${creditsUsed}`);

    // Credit limit logic: Use nullish coalescing to preserve 0 credits for new users
    const creditLimit = user.creditLimit ?? 0;

    const planData = {
      planId: plan._id,
      planName: plan.name,
      planPrice: activeSubscription.payment_mode === 'yearly' ? plan.price_yearly : plan.price_monthly,
      paymentMode: activeSubscription.payment_mode,
      startDate: activeSubscription.start_date,
      endDate: activeSubscription.end_date,
      isActive: activeSubscription.is_active,
      postsPerMonth: postsPerMonth,
      monthlyPostsUsed: monthlyPostsUsed, // New field for plan card
      platformsAllowed: plan.features?.platforms_allowed || 2,
      aiPostGeneration: plan.features?.ai_post_generation || true,
      captionGenerator: plan.features?.caption_generator || true,
      hashtagGenerator: plan.features?.hashtag_generator || true,
      contentCalendar: plan.features?.content_calendar || false,
      smartScheduling: plan.features?.smart_scheduling || false,
      prioritySupport: plan.features?.priority_support || false,
    };

    return res.json({
      plan: planData,
      subscription: {
        id: activeSubscription._id,
        is_active: activeSubscription.is_active,
        payment_mode: activeSubscription.payment_mode,
        start_date: activeSubscription.start_date,
        end_date: activeSubscription.end_date
      },
      usage: {
        creditsUsed: creditsUsed, // Smart credit usage calculation
        creditLimit: creditLimit,      // Lifetime/Manual limit for credit card
      },
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        creditLimit: creditLimit,
      },
    });
  } catch (err) {
    console.error('Get current plan details error:', err);
    return res.status(500).json({ message: err.message });
  }
}

module.exports = { subscribe, getCurrentSubscription, getCurrentPlanDetails };