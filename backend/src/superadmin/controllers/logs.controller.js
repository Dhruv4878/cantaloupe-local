const SuperAdminService = require("../services/superAdmin.service");

exports.getLogs = async (req, res) => {
  try {
    const logs = await SuperAdminService.getLogs();

    return res.status(200).json({
      message: "Logs retrieved successfully",
      count: logs.length,
      logs,
    });
  } catch (err) {
    console.error("Super Admin - Logs Fetch Error:", err);
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
};
