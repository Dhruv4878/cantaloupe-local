console.log("SUPER ADMIN SECRET =", process.env.SUPER_ADMIN_JWT_SECRET);

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../../models/superAdminModel");

class SuperAdminService {
  /**
   * Login super admin
   * @param {String} email
   * @param {String} password
   * @param {String} ip
   * @param {String} userAgent
   */
  static async loginSuperAdmin(email, password, ip, userAgent) {
    const superAdmin = await SuperAdmin.findOne({ email });

    if (!superAdmin) {
      return { error: "Invalid email or password" };
    }

    // Check account status
    if (superAdmin.status === "disabled") {
      return { error: "Account disabled. Contact system owner." };
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, superAdmin.password_hash);
    if (!passwordMatch) {
      // Increase login attempts
      superAdmin.loginAttempts += 1;
      await superAdmin.save();

      return { error: "Invalid email or password" };
    }

    // Reset login attempts on success
    superAdmin.loginAttempts = 0;

    // Update last login and add login history
    superAdmin.lastLogin = new Date();
    superAdmin.loginHistory.push({
      ip,
      userAgent,
      time: new Date()
    });

    await superAdmin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: superAdmin._id,
        email: superAdmin.email,
        role: superAdmin.role,
      },
      process.env.SUPER_ADMIN_JWT_SECRET,
      { expiresIn: "1d" }
    );


    return {
      token,
      superAdmin: {
        id: superAdmin._id,
        email: superAdmin.email,
        role: superAdmin.role,
        lastLogin: superAdmin.lastLogin,
      }
    };
  }

  /**
   * Fetch all users
   * @param {Object} options
   * @param {String} options.sortBy - 'name' | 'lastUsed' | 'postsGenerated'
   * @param {String} options.order - 'asc' | 'desc'
   */
  static async getAllUsers(options = {}) {
    const { sortBy, order } = options;
    // Pagination options
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 20;
    // normalize
    page = page < 1 ? 1 : page;
    limit = limit < 1 ? 20 : limit;

    // Return users with a postsGenerated count using a post-group aggregation
    // First fetch users, then compute counts per user and merge — this avoids
    // type-mismatch issues with $lookup across ObjectId/string fields.
    const User = require("../../models/userModel");
    const Post = require("../../models/postModel");

    // Fetch users as plain objects
    const users = await User.find({}).select("-password").lean();

    // Aggregate counts grouped by userId — coerce the key to string to avoid
    // mismatches when userId is stored as ObjectId vs string
    const counts = await Post.aggregate([
      { $group: { _id: { $toString: "$userId" }, count: { $sum: 1 } } }
    ]);

    const countsMap = counts.reduce((acc, c) => {
      acc[c._id] = c.count; // c._id already a string because of $toString
      return acc;
    }, {});

    // Compute lastUsedAt (latest post createdAt) per user
    const lastUsedAgg = await Post.aggregate([
      { $group: { _id: { $toString: "$userId" }, lastUsedAt: { $max: "$createdAt" } } }
    ]);
    const lastUsedMap = lastUsedAgg.reduce((acc, l) => {
      acc[l._id] = l.lastUsedAt;
      return acc;
    }, {});

    // Fetch profiles for these users and compute connected platforms
    const Profile = require("../../models/profileModel");
    const UserSubscription = require("../../models/UserSubscription");
    const profiles = await Profile.find({ user: { $in: users.map((u) => u._id) } }).lean();

    const profileMap = profiles.reduce((acc, p) => {
      acc[String(p.user)] = p;
      return acc;
    }, {});

    // Fetch active subscriptions for all users (including suspended paid plans)
    const subscriptions = await UserSubscription.find({
      user_id: { $in: users.map((u) => u._id) },
      $or: [
        { is_active: true },
        { is_active: false } // Include suspended subscriptions to show correct plan names
      ]
    }).populate('plan_id').lean();

    const subscriptionMap = subscriptions.reduce((acc, s) => {
      const userId = String(s.user_id);
      // Keep the most recent subscription (active or suspended)
      if (!acc[userId] || new Date(s.createdAt) > new Date(acc[userId].createdAt)) {
        acc[userId] = s;
      }
      return acc;
    }, {});

    // Calculate monthly posts for ALL users (both free and paid, active and suspended)
    // Use calendar month for overall monthly tracking
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPostsAgg = await Post.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: { $toString: "$userId" }, monthlyCount: { $sum: 1 } } }
    ]);

    const monthlyPostsMap = monthlyPostsAgg.reduce((acc, m) => {
      acc[m._id] = m.monthlyCount;
      return acc;
    }, {});

    // Calculate current plan usage (subscription-based tracking)
    const subscriptionUsageService = require('../../services/subscriptionUsageService');
    const currentPlanUsageMap = {};

    // Process each user to get their current plan usage
    for (const user of users) {
      const uid = String(user._id);
      const subscription = subscriptionMap[uid];

      if (subscription && subscription.is_active &&
        (subscription.plan_id?.posts_per_month > 0 || subscription.plan_id?.features?.posts_per_month > 0)) {
        // User has active monthly plan - use subscription-based tracking
        try {
          const cycleInfo = await subscriptionUsageService.getSubscriptionCycleInfo(user._id);
          currentPlanUsageMap[uid] = cycleInfo.monthlyPosts.used;
        } catch (error) {
          console.error(`Error getting subscription cycle for user ${uid}:`, error);
          currentPlanUsageMap[uid] = 0;
        }
      } else {
        // User doesn't have active monthly plan - no current plan usage
        currentPlanUsageMap[uid] = 0;
      }
    }

    // Calculate credit usage from posts marked with usedCredits: true for all users
    const creditsUsedAgg = await Post.aggregate([
      { $match: { usedCredits: true } },
      { $group: { _id: { $toString: "$userId" }, count: { $sum: 1 } } }
    ]);

    const creditsUsedMap = creditsUsedAgg.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const usersWithCounts = users.map((u) => {
      const uid = String(u._id);
      const p = profileMap[uid];
      const subscription = subscriptionMap[uid];

      // Determine which platforms are connected based on profile.social
      const connectedPlatforms = [];
      if (p?.social?.facebook && (p.social.facebook.accessToken || p.social.facebook.pageId)) connectedPlatforms.push("facebook");
      if (p?.social?.instagram && (p.social.instagram.accessToken || p.social.instagram.igBusinessId)) connectedPlatforms.push("instagram");
      if (p?.social?.linkedin && (p.social.linkedin.accessToken || p.social.linkedin.memberId)) connectedPlatforms.push("linkedin");
      if (p?.social?.twitter && (p.social.twitter.accessToken || p.social.twitter.userId || p.social.twitter.oauthToken)) connectedPlatforms.push("twitter");

      // Get actual credit usage from the map
      const creditsUsed = creditsUsedMap[uid] ?? 0;

      // Smart credit calculation logic (same as subscription controller)
      const totalPosts = countsMap[uid] ?? 0;
      const overallMonthlyPosts = monthlyPostsMap[uid] ?? 0; // Calendar month posts
      const currentPlanUsage = currentPlanUsageMap[uid] ?? 0; // Subscription-based posts
      const creditLimit = u.creditLimit ?? 0;

      // Check if user has a monthly plan subscription (regardless of active status)
      const hasMonthlyPlan = subscription &&
        (subscription.plan_id?.posts_per_month > 0 ||
          subscription.plan_id?.features?.posts_per_month > 0);

      // Check if user has active monthly plan (must be both subscribed AND active)
      const hasActiveMonthlyPlan = subscription && subscription.is_active &&
        (subscription.plan_id?.posts_per_month > 0 ||
          subscription.plan_id?.features?.posts_per_month > 0);

      let planInfo = null;

      if (subscription) {
        const monthlyLimit = subscription.plan_id.posts_per_month ||
          subscription.plan_id.features?.posts_per_month || 0;

        planInfo = {
          planName: subscription.plan_id.name || 'Unknown',
          monthlyLimit: monthlyLimit,
          monthlyUsed: overallMonthlyPosts, // Overall calendar month posts
          currentPlanUsed: currentPlanUsage, // Current plan subscription-based posts
          isActive: subscription.is_active // This will be false for suspended plans
        };
      } else {
        // No subscription found - treat as free user
        planInfo = {
          planName: 'Free',
          monthlyLimit: 0, // Free users have no monthly limit
          monthlyUsed: overallMonthlyPosts, // Overall calendar month posts
          currentPlanUsed: overallMonthlyPosts, // For free users, same as overall
          isActive: true // Free plans are always "active"
        };
      }

      return {
        ...u,
        postsGenerated: totalPosts, // Total posts for reference
        monthlyPosts: overallMonthlyPosts, // Overall calendar month posts
        currentPlanPosts: currentPlanUsage, // Current plan subscription-based posts
        creditsUsed: creditsUsed,   // Smart credit calculation
        connectedPlatforms,
        creditLimit: creditLimit,
        lastUsedAt: lastUsedMap[uid] ?? null,
        planInfo: planInfo,         // Subscription plan information
        hasActiveMonthlyPlan: hasActiveMonthlyPlan,
        hasMonthlyPlan: hasMonthlyPlan // Whether user has a monthly plan (even if suspended)
      };
    });

    // Apply sorting if requested
    if (sortBy) {
      // sortBy may be an array (multiple query params) or a comma-separated string
      let fields = [];
      if (Array.isArray(sortBy)) fields = sortBy;
      else fields = String(sortBy).split(",").map((s) => s.trim()).filter(Boolean);

      if (fields.length > 0) {
        const dir = order === "asc" ? 1 : -1;

        usersWithCounts.sort((a, b) => {
          for (const f of fields) {
            if (f === "name") {
              const getName = (u) => {
                const fn = u.firstName ?? u.first_name ?? "";
                const ln = u.lastName ?? u.last_name ?? "";
                const name = fn || ln ? `${fn} ${ln}`.trim() : u.name ?? "";
                return name.toLowerCase();
              };
              const cmp = getName(a).localeCompare(getName(b));
              if (cmp !== 0) return dir * cmp;
            } else if (f === "postsGenerated") {
              const cmp = (a.postsGenerated ?? 0) - (b.postsGenerated ?? 0);
              if (cmp !== 0) return dir * cmp;
            } else if (f === "creditsUsed") {
              const cmp = (a.creditsUsed ?? 0) - (b.creditsUsed ?? 0);
              if (cmp !== 0) return dir * cmp;
            } else if (f === "monthlyPosts") {
              const cmp = (a.monthlyPosts ?? 0) - (b.monthlyPosts ?? 0);
              if (cmp !== 0) return dir * cmp;
            } else if (f === "currentPlanPosts") {
              const cmp = (a.currentPlanPosts ?? 0) - (b.currentPlanPosts ?? 0);
              if (cmp !== 0) return dir * cmp;
            } else if (f === "lastUsed") {
              const da = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
              const db = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
              const cmp = da - db;
              if (cmp !== 0) return dir * cmp;
            }
          }
          return 0;
        });
      }
    }

    // Pagination: compute total then slice the results
    const total = usersWithCounts.length;
    const start = (page - 1) * limit;
    const paginated = usersWithCounts.slice(start, start + limit);

    return {
      users: paginated,
      total,
      page,
      limit,
    };
  }

  /**
   * Get system stats
   */
  static async getStats() {
    const User = require("../../models/userModel");
    const Post = require("../../models/postModel");

    const userCount = await User.countDocuments();
    const postCount = await Post.countDocuments();

    // Active users = users who have signed in (have a lastLogin recorded)
    const activeUsers = await User.countDocuments({ lastLogin: { $exists: true, $ne: null } });

    // Weekly active users: users who either logged in within the last 7 days
    // or have created a post within the last 7 days. We collect unique user ids
    // from both sets to avoid double-counting.
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Users with recent login
    const recentLogins = await User.find({ lastLogin: { $gte: sevenDaysAgo } }).select("_id").lean();
    const recentLoginIds = new Set(recentLogins.map((u) => String(u._id)));

    // Users who posted recently
    const recentPosts = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $toString: "$userId" } } },
    ]);

    const recentPostIds = new Set(recentPosts.map((p) => String(p._id)));

    // Union of both sets
    const weeklyActiveSet = new Set([...recentLoginIds, ...recentPostIds]);
    const weeklyActiveUsers = weeklyActiveSet.size;

    return {
      users: userCount,
      posts: postCount,
      activeUsers,
      weeklyActiveUsers,
    };
  }

  /**
   * Fetch system logs (AI, posting errors etc.)
   * Placeholder — integrate real logs later
   */
  static async getLogs() {
    return [
      { type: "info", message: "System operational", timestamp: new Date() },
      { type: "warning", message: "High AI usage detected", timestamp: new Date() },
    ];
  }

  /**
   * Update a user's active status (suspend/reactivate)
   * @param {String} userId
   * @param {Boolean} active
   */
  static async updateUserActive(userId, active) {
    const User = require("../../models/userModel");
    if (!userId) throw new Error("userId required");

    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    user.active = !!active;
    await user.save();

    return user.toObject();
  }

  /**
   * Update user plan active status (suspend/reactivate subscription)
   * @param {String} userId
   * @param {Boolean} planActive
   */
  static async updateUserPlanActive(userId, planActive) {
    const UserSubscription = require("../../models/UserSubscription");
    const Plan = require("../../models/Plan");
    if (!userId) throw new Error("userId required");

    if (planActive) {
      // REACTIVATING: Find the most recent paid subscription (even if suspended)
      const subscription = await UserSubscription.findOne({
        user_id: userId
      }).populate('plan_id').sort({ createdAt: -1 }); // Get the most recent subscription

      if (!subscription) {
        throw new Error("No subscription found for this user");
      }

      // Don't allow reactivating Free plans (they're always active)
      if (subscription.plan_id?.name === 'Free') {
        throw new Error("Free plans cannot be reactivated (they're always active)");
      }

      // Reactivate the existing paid subscription
      subscription.is_active = true;
      await subscription.save();

      return {
        subscriptionId: subscription._id,
        planName: subscription.plan_id?.name,
        isActive: subscription.is_active,
        userId: userId
      };
    } else {
      // DEACTIVATING: Find user's currently active subscription
      const subscription = await UserSubscription.findOne({
        user_id: userId,
        is_active: true
      }).populate('plan_id');

      if (!subscription) {
        throw new Error("No active subscription found for this user");
      }

      // Don't allow deactivating Free plans
      if (subscription.plan_id?.name === 'Free') {
        throw new Error("Cannot deactivate Free plan");
      }

      // Suspend the paid subscription (don't delete it)
      subscription.is_active = false;
      await subscription.save();

      // DO NOT auto-assign Free plan - let the subscription controller handle it when needed

      return {
        subscriptionId: subscription._id,
        planName: subscription.plan_id?.name,
        isActive: subscription.is_active,
        userId: userId
      };
    }
  }

  /**
   * Update user credit limit
   * @param {String} userId
   * @param {Number} creditLimit
   */
  static async updateUserCredit(userId, creditLimit) {
    const User = require("../../models/userModel");
    if (!userId) throw new Error("userId required");

    const user = await User.findById(userId).select("-password");
    if (!user) throw new Error("User not found");

    const cl = Number(creditLimit);
    if (isNaN(cl) || cl < 0) throw new Error("creditLimit must be a non-negative number");

    user.creditLimit = cl;
    await user.save();

    return user.toObject();
  }

  /**
   * Get user transactions with pagination and filtering
   * @param {String} userId
   * @param {Object} options - { page, limit, type }
   */
  static async getUserTransactions(userId, options = {}) {
    const Transaction = require("../../models/Transaction");
    const User = require("../../models/userModel");
    const { CREDIT_PACKS } = require("../../api/controllers/creditController");

    if (!userId) throw new Error("userId required");

    // Verify user exists
    const user = await User.findById(userId).select("firstName lastName email");
    if (!user) throw new Error("User not found");

    const { page = 1, limit = 20, type } = options;

    // Build query
    const query = { user_id: userId };
    if (type && type !== 'all') {
      query.transaction_type = type;
    }

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Get paginated transactions
    const transactions = await Transaction.find(query)
      .populate('plan_id', 'name price_monthly price_yearly')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Format transactions for display
    const formattedTransactions = transactions.map(tx => {
      let planName, planPrice;

      if (tx.transaction_type === 'credit_purchase') {
        // Handle credit purchase transactions
        const packId = tx.gateway_response?.pack_id;
        const credits = tx.gateway_response?.credits;

        if (packId && CREDIT_PACKS[packId]) {
          const pack = CREDIT_PACKS[packId];
          // Create proper pack labels
          const packLabels = {
            starter: 'Starter Pack',
            growth: 'Growth Pack',
            power: 'Power Pack',
            agency: 'Agency Pack'
          };
          planName = `${packLabels[packId] || 'Credit Pack'} - ${pack.credits} Credits`;
          planPrice = pack.price;
        } else if (credits) {
          // Fallback: use credits from gateway_response
          planName = `Credit Pack - ${credits} Credits`;
          planPrice = tx.amount;
        } else {
          planName = 'Credit Purchase';
          planPrice = tx.amount;
        }
      } else {
        // Handle subscription transactions
        planName = tx.plan_id?.name || 'Unknown Plan';
        planPrice = tx.payment_mode === 'yearly'
          ? tx.plan_id?.price_yearly
          : tx.plan_id?.price_monthly;
      }

      return {
        _id: tx._id,
        type: tx.transaction_type || 'subscription',
        amount: tx.amount,
        currency: tx.currency || 'INR',
        status: tx.status,
        gateway: tx.gateway || 'razorpay',
        paymentMode: tx.payment_mode,
        planName,
        planPrice,
        gatewayTransactionId: tx.payment_id || tx.gateway_response?.razorpay_payment_id || tx.gateway_response?.id,
        gatewayOrderId: tx.gateway_response?.order_id || tx.gateway_response?.razorpay_order_id || tx.gateway_response?.id,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        notes: tx.notes || {},
        failureReason: tx.failure_reason
      };
    });

    return {
      transactions: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      },
      user: {
        id: user._id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
        email: user.email
      }
    };
  }
}

module.exports = SuperAdminService;
