
// =====================
// PASSWORD RESET (OTP)
// =====================

exports.sendPasswordResetOtp = async (req, res) => {
  let { email } = req.body;
  email = email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if user exists or not, but for now we might want to be explicit for UX?
      // Standard practice: "If an account exists, an email has been sent."
      // BUT, user asked: "if user wants to reset passwrod ... provide a a field forgot password"
      // The requirement implies they initiate this. 
      // If user is logged in (Settings), we KNOW the email.
      // If user is logged out (Forgot Password), we don't.
      // For SettingsView, we pass the email.
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt, attempts: 0 },
      { upsert: true }
    );

    // Send Email (Reuse logic from sendSignupOtp - abstracted if possible, but copy-paste for now to ensure isolation)
    if (USE_REST_API) {
      const emailFrom = process.env.EMAIL_FROM;
      let senderName = "Generation Next";
      let senderEmail = emailFrom;

      const match = emailFrom.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        senderName = match[1].trim().replace(/^["']|["']$/g, '');
        senderEmail = match[2].trim();
      } else if (emailFrom.includes('@')) {
        senderEmail = emailFrom.trim();
      }

      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email }],
          subject: "Reset Your Password - OTP",
          htmlContent: `<html><body>
              <h1>Password Reset Request</h1>
              <p>You requested to reset your password.</p>
              <p>Your OTP is: <strong>${otp}</strong></p>
              <p>This code will expire in 10 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            </body></html>`,
          textContent: `Your password reset OTP is ${otp}. Expires in 10 minutes.`
        },
        {
          headers: {
            'api-key': brevoApiKey || process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
    } else if (USE_SMTP && smtpTransporter) {
      await smtpTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Reset Your Password - OTP",
        text: `Your password reset OTP is ${otp}. Expires in 10 minutes.`,
      });
    } else {
      // Should have been caught by startup checks, but safe fallback
      return res.status(500).json({ message: "Email service not configured" });
    }

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Error sending reset OTP:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

exports.resetPasswordWithOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const record = await EmailOtp.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (record.expiresAt < new Date()) {
      await EmailOtp.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.attempts >= 5) {
      await EmailOtp.deleteOne({ email });
      return res.status(400).json({ message: "Too many attempts. Request a new OTP." });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP Verified - Reset Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    // Cleanup
    await EmailOtp.deleteOne({ email });

    res.json({ message: "Password reset successfully. You can now login with your new password." });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};
