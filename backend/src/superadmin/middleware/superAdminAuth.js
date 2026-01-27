const jwt = require("jsonwebtoken");
const SuperAdmin = require("../../models/superAdminModel");

module.exports = async function superAdminAuth(req, res, next) {
  try {
    const token = req.cookies?.super_admin_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized. No token provided." });
    }

    // Verify token
    let decoded;
    try {
decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);

    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Validate role
    if (decoded.role !== "super_admin") {
      return res.status(403).json({ error: "Access denied. Not a super admin." });
    }

    // Fetch super admin from DB
    const superAdmin = await SuperAdmin.findById(decoded.id).select("-password_hash");

    if (!superAdmin) {
      return res.status(404).json({ error: "Super admin not found." });
    }

    // Check if blocked
    if (superAdmin.status === "disabled") {
      return res.status(403).json({ error: "Super admin account is disabled." });
    }

    // Attach to request object
    req.superAdmin = superAdmin;

    next();
  } catch (err) {
    console.error("Super-admin Auth Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
