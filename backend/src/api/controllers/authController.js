const User = require('../../models/userModel.js');
const Profile = require('../../models/profileModel');
const Plan = require('../../models/Plan');
const UserSubscription = require('../../models/UserSubscription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const serviceAccount = require('../../utils/serviceAccountKey.js');
const EmailOtp = require('../../models/emailOtpModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');

// Standard suspended message used across API responses when an account is inactive
const SUSPENDED_MSG = "you are suspended by admin if its a mistake contact us on email postgen@gmail.com";


// Initialize Firebase Admin SDK (only if it hasn't been already)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const emailService = require('../../services/emailService');

exports.sendSignupOtp = async (req, res) => {
  let { email } = req.body;
  email = email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    // prevent duplicate signup
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailOtp.findOneAndUpdate(
      { email },
      { otpHash, expiresAt, attempts: 0 },
      { upsert: true }
    );

    try {
      console.log(`📧 Attempting to send OTP to: ${email}`);
      const subject = "Your OTP Code";
      const htmlContent = `<html><body><h1>Your OTP Code</h1><p>Your OTP is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p></body></html>`;
      const textContent = `Your OTP is ${otp}. This code will expire in 5 minutes.`;

      await emailService.sendEmail(email, subject, htmlContent, textContent);
      return res.json({ message: "OTP sent successfully" });

    } catch (mailErr) {
      console.error("❌ Email send failed:", mailErr);
      return res.status(500).json({
        message: "Email service unavailable",
        error: process.env.NODE_ENV !== 'production' ? mailErr.message : undefined
      });
    }

  } catch (err) {
    console.error("❌ General error in sendSignupOtp:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};


exports.verifySignupOtp = async (req, res) => {
  const { firstName, lastName, email, password, otp } = req.body;

  try {
    const record = await EmailOtp.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: "OTP expired or invalid" });
    }

    if (record.expiresAt < new Date()) {
      await EmailOtp.deleteOne({ email });
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.attempts >= 5) {
      await EmailOtp.deleteOne({ email });
      return res.status(400).json({
        message: "Too many invalid attempts. Please request a new OTP."
      });
    }

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    if (otpHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // create user AFTER OTP verification
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      authProvider: "email",
      isEmailVerified: true,
    });

    // Assign free plan to new user
    const freePlan = await Plan.findOne({ name: 'Free', status: 'active' });
    if (freePlan) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setFullYear(endDate.getFullYear() + 100); // Set to a far future date for "lifetime" free

      await UserSubscription.create({
        user_id: user._id,
        plan_id: freePlan._id,
        payment_mode: 'monthly',
        payment_status: 'completed',
        gateway: 'system',
        is_active: true,
        start_date: now,
        end_date: endDate,
      });
    }

    await EmailOtp.deleteOne({ email });

    // ❌ NO JWT here
    res.json({ message: "Signup successful. Please login." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

//Login a user and get a token
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Block suspended users
    if (user.active === false) {
      return res.status(403).json({ message: SUSPENDED_MSG });
    }

    // 2. Compare the submitted password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // if (!user.isEmailVerified) {
    //   return res.status(403).json({
    //     message: 'Please verify your email before login'
    //   });
    // }

    // 3. Determine whether the user has a completed profile
    let hasProfile = false;
    try {
      const profile = await Profile.findOne({ user: user.id });
      hasProfile = Boolean(profile && (profile.onboardingComplete === true));
    } catch (_) { /* ignore */ }

    // Record last successful login time
    user.lastLogin = new Date();
    await user.save();

    // 4. If they match, create a JSON Web Token (JWT)
    const payload = { user: { id: user.id } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Your secret key
      { expiresIn: '1h' },   // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token, hasProfile }); // Include profile flag for frontend routing
      }
    );

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Google sign-in: issue JWT directly
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Missing Google token" });
    }

    // 1. Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decoded;

    if (!email) {
      return res.status(400).json({ message: "Google account has no email" });
    }

    // 2. FIND USER (googleId OR email) - prioritize googleId
    let user = await User.findOne({ googleId: uid });

    // If not found by googleId, try email
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    // 3. CREATE USER IF NOT EXISTS
    if (!user) {
      const [firstName = "", lastName = ""] = (name || "").split(" ");

      try {
        user = await User.create({
          email: email.toLowerCase(),
          firstName,
          lastName,
          googleId: uid,
          authProvider: "google",
          isEmailVerified: true,
        });

        // Assign free plan to new Google user
        const freePlan = await Plan.findOne({ name: 'Free', status: 'active' });
        if (freePlan) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setFullYear(endDate.getFullYear() + 100); // Set to a far future date for "lifetime" free

          await UserSubscription.create({
            user_id: user._id,
            plan_id: freePlan._id,
            payment_mode: 'monthly',
            payment_status: 'completed',
            gateway: 'system',
            is_active: true,
            start_date: now,
            end_date: endDate,
          });
        }
      } catch (createErr) {
        // If duplicate key error, user was created between checks - find them
        if (createErr.code === 11000) {
          user = await User.findOne({ email: email.toLowerCase() });
          if (!user) {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // 4. LINK GOOGLE ID IF USER EXISTS BUT GOOGLE ID MISSING
    if (user && !user.googleId) {
      user.googleId = uid;
      if (!user.authProvider) {
        user.authProvider = "google";
      }
      user.isEmailVerified = true;
      await user.save();
    }

    // Prevent suspended users from logging in via Google
    if (user && user.active === false) {
      return res.status(403).json({ message: SUSPENDED_MSG });
    }

    // 5. UPDATE GOOGLE ID IF IT'S DIFFERENT (shouldn't happen, but safety check)
    if (user && user.googleId && user.googleId !== uid) {
      // This means same email but different Google ID - update it
      user.googleId = uid;
      await user.save();
    }

    // 6. ENSURE PROFILE EXISTS
    let profile = await Profile.findOne({ user: user._id });

    if (!profile) {
      profile = await Profile.create({
        user: user._id,
        onboardingComplete: false,
      });
    }

    // 7. Record last login and ISSUE JWT
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { user: { id: user._id } },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      hasProfile: profile.onboardingComplete === true,
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

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

    // Send Email
    try {
      const subject = "Reset Your Password - OTP";
      const htmlContent = `<html><body>
              <h1>Password Reset Request</h1>
              <p>You requested to reset your password.</p>
              <p>Your OTP is: <strong>${otp}</strong></p>
              <p>This code will expire in 10 minutes.</p>
              <p>If you did not request this, please ignore this email.</p>
            </body></html>`;
      const textContent = `Your password reset OTP is ${otp}. Expires in 10 minutes.`;

      await emailService.sendEmail(email, subject, htmlContent, textContent);
      res.json({ message: "OTP sent successfully" });

    } catch (mailErr) {
      console.error("❌ Error sending reset OTP:", mailErr);
      return res.status(500).json({ message: "Failed to send OTP" });
    }

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

    // Check if user exists and prevent reusing old password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new password is same as old password (only if user has a password)
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ message: "New password cannot be the same as your old password" });
      }
    }

    // OTP Verified - Reset Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    await EmailOtp.deleteOne({ email });

    res.json({ message: "Password reset successfully. You can now login with your new password." });

  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
};