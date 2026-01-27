// postRoutes.js

const express = require("express");
const router = express.Router();
const Post = require("../../models/postModel");
const authMiddleware = require("../middlewares/authMiddleware");
const checkFeatureAccess = require("../middlewares/checkFeatureAccess");
const subscriptionUsageService = require("../../services/subscriptionUsageService");

/* ======================================================
   GET: All posts (latest first)
====================================================== */
router.get("/posts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/* ======================================================
   GET: ENHANCED POST STATS (Lifetime, Monthly Overall, Current Plan Usage)
====================================================== */
router.get("/posts/stats", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const User = require("../../models/userModel");
    const subscriptionUsageService = require('../../services/subscriptionUsageService');

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 1. LIFETIME TOTAL POSTS
    const lifetimePosts = await Post.countDocuments({ userId });

    // 2. MONTHLY OVERALL POSTS (Calendar month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyOverallPosts = await Post.countDocuments({
      userId,
      createdAt: { $gte: startOfMonth }
    });

    // 3. CURRENT PLAN USAGE (Subscription-based)
    const subscriptionCycleInfo = await subscriptionUsageService.getSubscriptionCycleInfo(userId);
    const hasActiveMonthlyPlan = subscriptionCycleInfo.isActive && subscriptionCycleInfo.monthlyPosts.limit > 0;

    let currentPlanUsage = {
      used: 0,
      limit: 0,
      hasLimit: false,
      planName: 'Free'
    };

    if (hasActiveMonthlyPlan) {
      currentPlanUsage = {
        used: subscriptionCycleInfo.monthlyPosts.used,
        limit: subscriptionCycleInfo.monthlyPosts.limit,
        hasLimit: true,
        planName: 'Paid Plan',
        daysRemaining: subscriptionCycleInfo.daysRemaining
      };
    } else {
      // For free users or users without active plans, show credit usage
      const creditsUsed = await Post.countDocuments({
        userId,
        usedCredits: true
      });
      const creditLimit = user.creditLimit ?? 0;

      currentPlanUsage = {
        used: creditsUsed,
        limit: creditLimit,
        hasLimit: creditLimit > 0,
        planName: 'Free'
      };
    }

    return res.json({
      lifetime: lifetimePosts,
      monthlyOverall: monthlyOverallPosts,
      currentPlan: currentPlanUsage
    });
  } catch (err) {
    console.error("Post stats error:", err);
    return res.status(500).json({ error: "Failed to fetch post stats" });
  }
});

/* ======================================================
   GET: SMART POST COUNT (Monthly or Total based on active plan)
====================================================== */
router.get("/posts/count", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const User = require("../../models/userModel");
    const subscriptionUsageService = require('../../services/subscriptionUsageService');

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let count = 0;
    let limit = 0;
    let countType = 'credit'; // 'monthly' or 'credit'
    let cycleInfo = null;

    // Check if user has active monthly plan using subscription cycle
    const subscriptionCycleInfo = await subscriptionUsageService.getSubscriptionCycleInfo(userId);
    const hasActiveMonthlyPlan = subscriptionCycleInfo.isActive && subscriptionCycleInfo.monthlyPosts.limit > 0;

    if (hasActiveMonthlyPlan) {
      // User has active monthly plan - return monthly count based on subscription cycle
      count = subscriptionCycleInfo.monthlyPosts.used;
      limit = subscriptionCycleInfo.monthlyPosts.limit;
      countType = 'monthly';
      cycleInfo = {
        startDate: subscriptionCycleInfo.startDate,
        endDate: subscriptionCycleInfo.endDate,
        daysRemaining: subscriptionCycleInfo.daysRemaining
      };

      console.log(`Returning subscription-based monthly count: ${count}/${limit} (${cycleInfo.daysRemaining} days remaining)`);
    } else {
      // No active monthly plan - return credit count (only posts with usedCredits: true)
      const creditsUsed = await Post.countDocuments({
        userId,
        usedCredits: true
      });
      const creditLimit = user.creditLimit ?? 0;

      count = creditsUsed;
      limit = creditLimit;
      countType = 'credit';

      console.log(`Returning credit count: ${count}/${limit}`);
    }

    return res.json({
      count,
      limit,
      countType,
      hasActiveMonthlyPlan,
      ...(cycleInfo && { cycleInfo })
    });
  } catch (err) {
    console.error("Post count error:", err);
    return res.status(500).json({ error: "Failed to fetch post count" });
  }
});

/* ======================================================
   GET: calendar
====================================================== */
router.get('/posts/calendar', authMiddleware, checkFeatureAccess('content_calendar'), async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    // FIX: Added 'lifecycle' to the .select() string
    const posts = await Post.find({ userId: req.user.id })
      .select('createdAt schedule content lifecycle')
      .lean();

    // Logic to filter by date range
    const calendarPosts = posts.filter((post) => {
      let include = false;

      // 1. Created Date
      if (post.createdAt && post.createdAt >= fromDate && post.createdAt <= toDate) {
        include = true;
      }

      // 2. Scheduled Date
      if (post.schedule?.entries && Array.isArray(post.schedule.entries)) {
        for (const entry of post.schedule.entries) {
          if (
            entry.scheduledAt &&
            new Date(entry.scheduledAt) >= fromDate &&
            new Date(entry.scheduledAt) <= toDate
          ) {
            include = true;
            break;
          }
        }
      }

      // 3. Direct Publish/Fail Date (Lifecycle)
      if (!include && post.lifecycle?.publish) {
        const pubDate = post.lifecycle.publish.publishedAt || post.lifecycle.publish.lastFailedAt;
        if (pubDate) {
          const pDate = new Date(pubDate);
          if (pDate >= fromDate && pDate <= toDate) include = true;
        }
      }

      return include;
    });

    return res.json({ posts: calendarPosts });
  } catch (err) {
    console.error('Calendar API crash:', err);
    return res.status(500).json({
      error: 'Calendar fetch failed',
    });
  }
});

/* ======================================================
   GET: SINGLE POST
====================================================== */
router.get("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (err) {
    console.error("Fetch post error:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

/* ======================================================
   POST: CREATE POST (enforce credit limits)
====================================================== */
router.post("/posts", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "User ID missing" });
    }

    const subscriptionService = require('../../services/subscriptionService');
    const subscriptionUsageService = require('../../services/subscriptionUsageService');
    const UserUsage = require('../../models/UserUsage');
    const User = require("../../models/userModel");

    const user = await User.findById(userId).select("creditLimit");
    const creditLimit = user?.creditLimit ?? 0;
    const sub = await subscriptionService.getActiveSubscriptionByUser(userId);

    // Determine if this post is using credits or monthly plan
    // PRIORITY: Monthly Plan > Credits
    let usedCredits = false;

    if (sub && sub.is_active) {
      // Check multiple possible field names for posts per month
      const postsLimit = Number(
        sub.plan_id?.posts_per_month ||
        sub.plan_id?.postsPerMonth ||
        sub.plan_id?.features?.posts_per_month ||
        sub.plan_id?.features?.postsPerMonth ||
        0
      );

      if (postsLimit && postsLimit > 0) {
        // Use subscription-based monthly tracking instead of calendar months
        const monthlyAvailability = await subscriptionUsageService.checkMonthlyPostsAvailability(userId);

        console.log(`Subscription-based monthly check: ${monthlyAvailability.used}/${monthlyAvailability.limit} (${monthlyAvailability.remaining} remaining)`);

        // Check if monthly limit is reached
        if (!monthlyAvailability.hasRemaining) {
          // Monthly limit reached, check if credits are available
          if (creditLimit > 0) {
            // Count only posts that actually used credits
            const creditsUsed = await Post.countDocuments({
              userId,
              usedCredits: true
            });

            if (creditsUsed >= creditLimit) {
              // Both monthly and credits exhausted
              return res.status(403).json({
                message: 'Both monthly and credit limits reached',
                limitType: 'both',
                limit: creditLimit,
                used: creditsUsed,
                monthlyLimit: postsLimit,
                monthlyUsed: monthlyAvailability.used
              });
            }

            // Use credits
            usedCredits = true;
            console.log(`Monthly limit reached (${monthlyAvailability.used}/${monthlyAvailability.limit}), using credits: ${creditsUsed + 1}/${creditLimit}`);
          } else {
            // Monthly limit reached and no credits available
            return res.status(403).json({
              message: 'Monthly post limit reached for your plan',
              limitType: 'monthly',
              limit: postsLimit,
              used: monthlyAvailability.used
            });
          }
        } else {
          // Using monthly plan (monthly limit not reached)
          usedCredits = false;
          console.log(`Using monthly plan: ${monthlyAvailability.used + 1}/${monthlyAvailability.limit} (credits will NOT be used)`);
        }
      } else {
        // No monthly limit, check credits
        if (creditLimit > 0) {
          const creditsUsed = await Post.countDocuments({
            userId,
            usedCredits: true
          });

          if (creditsUsed >= creditLimit) {
            return res.status(403).json({
              message: "Credit limit reached. Please upgrade your plan.",
              limitType: 'credit',
              limit: creditLimit,
              used: creditsUsed
            });
          }

          usedCredits = true;
        } else {
          // No monthly limit and no credits
          return res.status(403).json({
            message: "Your plan does not allow post generation. Please upgrade.",
            limitType: 'no_limits'
          });
        }
      }
    } else {
      // No active subscription, check credits
      if (creditLimit > 0) {
        const creditsUsed = await Post.countDocuments({
          userId,
          usedCredits: true
        });

        if (creditsUsed >= creditLimit) {
          return res.status(403).json({
            message: "Credit limit reached. Please upgrade your plan.",
            limitType: 'credit',
            limit: creditLimit,
            used: creditsUsed
          });
        }

        usedCredits = true;
      } else {
        // No subscription and no credits
        return res.status(403).json({
          message: "Your plan does not allow post generation. Please upgrade.",
          limitType: 'no_limits'
        });
      }
    }

    // User can generate post - create it and track usage
    const content = req.body;
    const post = new Post({
      userId,
      content,
      schedule: content?.schedule || null,
      usedCredits: usedCredits
    });
    await post.save();

    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

/* ======================================================
   PUT: UPDATE POST (includes scheduling)
====================================================== */
router.put("/posts/:id", authMiddleware, async (req, res) => {
  try {
    // Check if this is a scheduling update
    if (req.body.schedule) {
      // Check for smart scheduling feature access
      const checkSchedulingAccess = checkFeatureAccess('smart_scheduling');
      return checkSchedulingAccess(req, res, async () => {
        await updatePostLogic(req, res);
      });
    } else {
      // Regular post update, no feature check needed
      await updatePostLogic(req, res);
    }
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// Helper function for post update logic
async function updatePostLogic(req, res) {
  const updated = await Post.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?.id },
    req.body,
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (updated.content?.schedule) {
    updated.schedule = updated.content.schedule;
    await updated.save();
  }

  res.json({
    message: "Post updated",
    post: updated,
  });
}

/* ======================================================
   DELETE: POST
====================================================== */
router.delete("/posts/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

module.exports = router;  