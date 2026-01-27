const SuperAdminService = require("../services/superAdmin.service");

exports.getAllUsers = async (req, res) => {
  try {
    const { sortBy, order, page, limit } = req.query;
    const result = await SuperAdminService.getAllUsers({ sortBy, order, page, limit });

    return res.status(200).json({
      message: "Users retrieved successfully",
      count: result.total,
      page: result.page,
      limit: result.limit,
      users: result.users,
    });
  } catch (err) {
    console.error("Super Admin - Get All Users Error:", err);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

exports.updateUserActive = async (req, res) => {
  try {
    const userId = req.params.id;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ message: "'active' must be a boolean" });
    }

    const updated = await SuperAdminService.updateUserActive(userId, active);

    return res.status(200).json({ message: "User updated", user: updated });
  } catch (err) {
    console.error("Super Admin - Update User Active Error:", err);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

exports.updateUserPlanActive = async (req, res) => {
  try {
    const userId = req.params.id;
    const { planActive } = req.body;

    if (typeof planActive !== "boolean") {
      return res.status(400).json({ message: "'planActive' must be a boolean" });
    }

    const updated = await SuperAdminService.updateUserPlanActive(userId, planActive);

    return res.status(200).json({
      message: `User plan ${planActive ? 'activated' : 'deactivated'}`,
      user: updated
    });
  } catch (err) {
    console.error("Super Admin - Update User Plan Active Error:", err);
    return res.status(500).json({ message: err.message || "Failed to update user plan status" });
  }
};

exports.updateUserCredit = async (req, res) => {
  try {
    const userId = req.params.id;
    const { creditLimit } = req.body;

    const parsed = Number(creditLimit);
    if (isNaN(parsed) || parsed < 0) {
      return res.status(400).json({ message: "'creditLimit' must be a non-negative number" });
    }

    const updated = await SuperAdminService.updateUserCredit(userId, parsed);

    return res.status(200).json({ message: "User credit updated", user: updated });
  } catch (err) {
    console.error("Super Admin - Update User Credit Error:", err);
    return res.status(500).json({ message: "Failed to update user credit" });
  }
};

exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 20, type } = req.query;

    const transactions = await SuperAdminService.getUserTransactions(userId, {
      page: Number(page),
      limit: Number(limit),
      type
    });

    return res.status(200).json({
      message: "User transactions retrieved successfully",
      ...transactions
    });
  } catch (err) {
    console.error("Super Admin - Get User Transactions Error:", err);
    return res.status(500).json({ message: err.message || "Failed to fetch user transactions" });
  }
};
