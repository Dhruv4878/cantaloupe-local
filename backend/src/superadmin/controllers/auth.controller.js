const SuperAdminService = require("../services/superAdmin.service");

exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";

    // Call service
    const result = await SuperAdminService.loginSuperAdmin(
      email,
      password,
      ip,
      userAgent
    );

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    // Set secure httpOnly cookie
    res.cookie("super_admin_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",

    });

    return res.status(200).json({
      message: "Login successful",
      superAdmin: result.superAdmin,
    });
  } catch (err) {
    console.error("SuperAdmin Login Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.logoutSuperAdmin = async (req, res) => {
    res.clearCookie("super_admin_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    return res.json({ message: "Logged out successfully" });
  };
  
