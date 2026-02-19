const subscriptionService = require('../../services/subscriptionService');
const subscriptionUsageService = require('../../services/subscriptionUsageService');
const Post = require('../../models/postModel');
const User = require('../../models/userModel');

/**
 * Middleware to check if user has available post credits or monthly posts
 * Attaches usedCredits flag to req object for use in controllers
 */
const checkPostLimits = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID missing'
      });
    }

    const user = await User.findById(userId).select("creditLimit");
    const creditLimit = user?.creditLimit ?? 0;
    const sub = await subscriptionService.getActiveSubscriptionByUser(userId);

    let usedCredits = false;

    // Check if user has active subscription
    if (sub && sub.is_active) {
      const postsLimit = Number(
        sub.plan_id?.posts_per_month ||
        sub.plan_id?.postsPerMonth ||
        sub.plan_id?.features?.posts_per_month ||
        sub.plan_id?.features?.postsPerMonth ||
        0
      );

      // If subscription has monthly post limit
      if (postsLimit && postsLimit > 0) {
        const monthlyAvailability = await subscriptionUsageService.checkMonthlyPostsAvailability(userId);

        console.log(`[Post Limits] Subscription check: ${monthlyAvailability.used}/${monthlyAvailability.limit} (${monthlyAvailability.remaining} remaining)`);

        // Monthly limit reached, check credits
        if (!monthlyAvailability.hasRemaining) {
          if (creditLimit > 0) {
            const creditsUsed = await Post.countDocuments({
              userId,
              usedCredits: true
            });

            if (creditsUsed >= creditLimit) {
              return res.status(403).json({
                success: false,
                message: 'Both monthly and credit limits reached',
                limitType: 'both',
                limit: creditLimit,
                used: creditsUsed,
                monthlyLimit: postsLimit,
                monthlyUsed: monthlyAvailability.used
              });
            }

            usedCredits = true;
            console.log(`[Post Limits] Monthly limit reached, using credits: ${creditsUsed + 1}/${creditLimit}`);
          } else {
            return res.status(403).json({
              success: false,
              message: 'Monthly post limit reached for your plan',
              limitType: 'monthly',
              limit: postsLimit,
              used: monthlyAvailability.used
            });
          }
        } else {
          usedCredits = false;
          console.log(`[Post Limits] Using monthly plan: ${monthlyAvailability.used + 1}/${monthlyAvailability.limit}`);
        }
      } else {
        // No monthly limit, use credits
        if (creditLimit > 0) {
          const creditsUsed = await Post.countDocuments({
            userId,
            usedCredits: true
          });

          if (creditsUsed >= creditLimit) {
            return res.status(403).json({
              success: false,
              message: "Credit limit reached. Please upgrade your plan.",
              limitType: 'credit',
              limit: creditLimit,
              used: creditsUsed
            });
          }

          usedCredits = true;
        } else {
          return res.status(403).json({
            success: false,
            message: "Your plan does not allow post generation. Please upgrade.",
            limitType: 'no_limits'
          });
        }
      }
    } else {
      // No active subscription, use credits only
      if (creditLimit > 0) {
        const creditsUsed = await Post.countDocuments({
          userId,
          usedCredits: true
        });

        if (creditsUsed >= creditLimit) {
          return res.status(403).json({
            success: false,
            message: "Credit limit reached. Please upgrade your plan.",
            limitType: 'credit',
            limit: creditLimit,
            used: creditsUsed
          });
        }

        usedCredits = true;
      } else {
        return res.status(403).json({
          success: false,
          message: "Your plan does not allow post generation. Please upgrade.",
          limitType: 'no_limits'
        });
      }
    }

    // Attach usedCredits flag and user plan to request for use in controllers
    req.usedCredits = usedCredits;
    // Attach plan details for conditional logic in controllers
    req.userPlan = sub && sub.is_active && sub.plan_id ? sub.plan_id : { name: 'Free', features: {} };
    next();

  } catch (error) {
    console.error('[Post Limits] Error checking limits:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check post limits',
      error: error.message
    });
  }
};

module.exports = checkPostLimits;
