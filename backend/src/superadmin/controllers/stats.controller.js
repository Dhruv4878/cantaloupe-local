const SuperAdminService = require("../services/superAdmin.service");

exports.getStats = async (req, res) => {
  try {
    const stats = await SuperAdminService.getStats();

    return res.status(200).json({
      message: "Stats retrieved successfully",
      stats,
    });
  } catch (err) {
    console.error("Super Admin - Get Stats Error:", err);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
};
