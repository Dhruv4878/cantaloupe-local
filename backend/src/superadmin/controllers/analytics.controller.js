const Transaction = require("../../models/Transaction");
const UserSubscription = require("../../models/UserSubscription");
const User = require("../../models/userModel");
const mongoose = require("mongoose");

/**
 * Get aggregated dashboard stats
 * - Total Earnings
 * - Active Paid Users
 * - Free Users
 * - Repitors (Returning Users)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Earnings (Sum of completed transactions)
    const earningsResult = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalEarnings = earningsResult[0]?.total || 0;

    // 2. Active Paid Users
    const activePaidUsers = await UserSubscription.countDocuments({
      is_active: true,
      payment_status: "completed",
    });

    // 3. Total Users & Free Users
    const totalUsers = await User.countDocuments({});
    const freeUsers = Math.max(0, totalUsers - activePaidUsers);

    // 4. Repitors (Users with > 1 completed transaction)
    const repitorsResult = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$user_id", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "count" },
    ]);
    const repitors = repitorsResult[0]?.count || 0;

    return res.status(200).json({
      totalEarnings,
      activePaidUsers,
      freeUsers,
      repitors,
    });
  } catch (error) {
    console.error("Analytics Stats Error:", error);
    return res.status(500).json({ message: "Failed to fetch analytics stats" });
  }
};

/**
 * Get transaction analytics for graphs
 * - Group earnings by date (last 30 days)
 */
exports.getTransactionAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await Transaction.aggregate([
      {
        $match: {
          status: "completed",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json(analytics);
  } catch (error) {
    console.error("Transaction Analytics Error:", error);
    return res.status(500).json({ message: "Failed to fetch transaction analytics" });
  }
};

/**
 * Get recent transactions with user and plan details
 */
exports.getRecentTransactions = async (req, res) => {
  try {
    const { filter, search } = req.query;
    let query = {};

    // 0. Handle Search Query (if present)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");

      // Find users matching name or email
      const matchingUsers = await User.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }).select("_id");

      const matchingUserIds = matchingUsers.map(u => u._id);

      // Construct OR query for transactions
      query.$or = [
        { user_id: { $in: matchingUserIds } },
        { payment_id: searchRegex },
        { "gateway_response.id": searchRegex },
        { "gateway_response.order_id": searchRegex },
        { "gateway_response.razorpay_order_id": searchRegex }
      ];
    }

    // 1. Handle "Free Users" specifically (Fetch Users directly, not Transactions)
    // Note: Search within "free_users" filter might require different logic if we want to search ONLY free users.
    // However, usually search overrides filter or works with it. 
    // For simplicity, if search is present, we might want to search ALL transactions or ALL users.
    // But implementation plan focuses on Transactions search. 
    // If filter is explicitly 'free_users', we should apply search to that context if possible, 
    // or return mixed results? Let's stick to the current structure but be aware.
    // If filter is 'free_users' AND search is present, we should filter the Free Users list.

    if (filter === "free_users") {
      const paidUserIds = await UserSubscription.find({
        is_active: true,
      }).distinct("user_id");

      let freeUserQuery = { _id: { $nin: paidUserIds } };

      if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search, "i");
        freeUserQuery.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ];
      }

      const freeUsers = await User.find(freeUserQuery)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const formattedFreeUsers = freeUsers.map((user) => ({
        _id: user._id, // Use user ID as unique key
        user_id: user, // Populated-like structure
        plan_id: { name: "Free" },
        amount: 0,
        status: "free",
        transaction_type: "none",
        createdAt: user.createdAt, // User join date
        user_purchase_count: 0, // Assumption for free view
      }));

      return res.status(200).json(formattedFreeUsers);
    }

    // 2. Apply Filters for Transactions (if not overridden by search strictness)
    // We combine search query with filter query using $and key if necessary, but here we just built 'query' object.

    if (filter === "pending") {
      query.status = "pending";
    } else if (filter === "failed") {
      query.status = { $in: ["failed", "cancelled"] };
    } else if (filter === "paid_users") {
      // Users with active subscription
      const paidUserIds = await UserSubscription.find({
        is_active: true,
      }).distinct("user_id");

      // If we already have a user_id query from search, we need to intersect them
      if (query.$or) {
        // If search is active, we need to ensure we matched a PAID user or a transaction of a paid user.
        // This gets complex. Let's simplify: Filter applies AND Logic.
        // But query.user_id might already be set by search? No, search used $or at top level.
        // We need to be careful not to overwrite query properties.

        // We want: (Search Criteria) AND (Filter Criteria)
        // Since Search used $or at root, we can't easily append "query.user_id = ..." if it conflicts.
        // MongoDB $and is safer.

        const searchCriteria = { ...query }; // Copy search criteria
        query = { $and: [searchCriteria, { user_id: { $in: paidUserIds }, status: "completed" }] };
      } else {
        query.user_id = { $in: paidUserIds };
        query.status = "completed";
      }
    } else if (filter === "recurring") {
      // Recursive/Group Logic is tricky with Search. 
      // If search is ON, maybe just show matching transactions instead of grouping?
      // Or filter the groups? 
      // Given the complexity of the aggregation for "recurring", adding search inside the pipeline is best.

      // ... (Returning to original Aggregation) ...
      // If search is present, we should probably just return standard transaction list matches 
      // because "Recurring" view is a specific grouped view. 
      // User asked to "search by name/email/orderId". 
      // If I search "Order 123", I expect to see that transaction, not a group of users.
      // So if Search is active, I will bypass the "Recurring" grouping and show the hits from Transactions.

      if (search) {
        // Do nothing special here, let the standard Transaction.find below handle it.
        // effective query = search params
      } else {
        // Standard Recurring View (No Search)
        const recurringUsersAgg = await Transaction.aggregate([
          { $match: { status: "completed" } },
          {
            $group: {
              _id: "$user_id",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
              latestDate: { $max: "$createdAt" },
              latestPlanId: { $last: "$plan_id" }
            }
          },
          { $match: { count: { $gt: 1 } } },
          { $sort: { latestDate: -1 } },
          { $limit: 50 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user_info"
            }
          },
          { $unwind: "$user_info" },
          {
            $lookup: {
              from: "plans",
              localField: "latestPlanId",
              foreignField: "_id",
              as: "plan_info"
            }
          },
          { $unwind: { path: "$plan_info", preserveNullAndEmptyArrays: true } }
        ]);

        const formattedRecurringUsers = recurringUsersAgg.map(u => ({
          _id: u._id,
          user_id: u.user_info,
          plan_id: { name: u.plan_info ? u.plan_info.name : "Multiple Plans" },
          amount: u.totalAmount,
          status: "completed",
          transaction_type: "recurring_group",
          createdAt: u.latestDate,
          user_purchase_count: u.count,
          is_recurring_group: true
        }));

        return res.status(200).json(formattedRecurringUsers);
      }
    }

    // 3. Fetch Transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user_id", "firstName lastName email")
      .populate("plan_id", "name")
      .lean();

    // 4. Fetch Purchase Counts for displayed users
    const userIds = transactions.map((tx) => tx.user_id?._id).filter(Boolean);

    let countMap = {};
    if (userIds.length > 0) {
      const purchaseCounts = await Transaction.aggregate([
        {
          $match: {
            user_id: { $in: userIds },
            status: "completed"
          }
        },
        { $group: { _id: "$user_id", count: { $sum: 1 } } }
      ]);

      purchaseCounts.forEach((p) => {
        countMap[p._id.toString()] = p.count;
      });
    }

    // 5. Format Response
    const formattedTransactions = transactions.map((tx) => {
      let planName = "N/A";

      if (tx.plan_id && tx.plan_id.name) {
        planName = tx.plan_id.name;
      } else if (tx.transaction_type === "credit_purchase") {
        const credits = tx.gateway_response?.notes?.credits;
        planName = credits ? `Credit Pack (${credits})` : "Credit Top-up";
      }

      const userIdStr = tx.user_id?._id?.toString();

      // Better Order ID & Payment ID Mapping
      const gatewayOrderId = tx.gateway_response?.order_id || tx.gateway_response?.id || null;
      // Use stored payment_id if available (from webhook update), else fallback to gateway response
      const gatewayPaymentId = tx.payment_id || tx.gateway_response?.razorpay_payment_id || null;

      return {
        ...tx,
        plan_id: tx.plan_id || { name: planName },
        user_purchase_count: userIdStr ? (countMap[userIdStr] || 0) : 0,
        gatewayOrderId,      // Expose Order ID
        gatewayPaymentId,    // Expose Payment ID
      };
    });

    return res.status(200).json(formattedTransactions);
  } catch (error) {
    console.error("Recent Transactions Error:", error);
    return res.status(500).json({ message: "Failed to fetch recent transactions" });
  }
};
