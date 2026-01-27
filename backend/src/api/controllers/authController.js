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

// Check which Brevo authentication method is available
// Smart detection: If key starts with 'xkeysib-', it's a REST API key
// If key starts with 'xsmtpsib-', it's an SMTP key

let brevoApiKey = process.env.BREVO_API_KEY;
let brevoSmtpKey = process.env.BREVO_SMTP_KEY;

// Auto-detect: If BREVO_SMTP_KEY contains a REST API key, use it as BREVO_API_KEY
if (brevoSmtpKey && brevoSmtpKey.trim().startsWith('xkeysib-')) {
  console.warn("⚠️  WARNING: BREVO_SMTP_KEY contains a REST API key (starts with 'xkeysib-')");
  console.warn("⚠️  Consider renaming it to BREVO_API_KEY in your .env file");
  if (!brevoApiKey) {
    brevoApiKey = brevoSmtpKey.trim();
    console.log("✅ Auto-detected REST API key from BREVO_SMTP_KEY, using REST API method");
  }
}

// Auto-detect: If BREVO_API_KEY contains an SMTP key, use it as BREVO_SMTP_KEY
if (brevoApiKey && brevoApiKey.trim().startsWith('xsmtpsib-')) {
  console.warn("⚠️  WARNING: BREVO_API_KEY contains an SMTP key (starts with 'xsmtpsib-')");
  console.warn("⚠️  Consider renaming it to BREVO_SMTP_KEY in your .env file");
  if (!brevoSmtpKey) {
    brevoSmtpKey = brevoApiKey.trim();
    brevoApiKey = null;
    console.log("✅ Auto-detected SMTP key from BREVO_API_KEY, using SMTP method");
  }
}

const USE_REST_API = !!brevoApiKey && brevoApiKey.trim().startsWith('xkeysib-');
const USE_SMTP = !USE_REST_API && !!brevoSmtpKey && brevoSmtpKey.trim().startsWith('xsmtpsib-');

// Create SMTP transporter if using SMTP method
let smtpTransporter = null;

if (USE_REST_API) {
  const keyLength = brevoApiKey.length;
  const keyPrefix = brevoApiKey.substring(0, 10);
  console.log(`📧 Using Brevo REST API - Key loaded: Length=${keyLength}, Starts with: ${keyPrefix}...`);
  console.log("✅ Brevo REST API ready (this is the recommended method)");
} else if (USE_SMTP) {
  const keyLength = brevoSmtpKey.length;
  const keyPrefix = brevoSmtpKey.substring(0, 10);
  console.log(`📧 Using Brevo SMTP - Key loaded: Length=${keyLength}, Starts with: ${keyPrefix}...`);

  // Check for common issues
  if (brevoSmtpKey.trim() !== brevoSmtpKey) {
    console.warn("⚠️  WARNING: BREVO_SMTP_KEY has leading/trailing spaces! This will cause authentication to fail.");
  }
  if (brevoSmtpKey.includes('\n') || brevoSmtpKey.includes('\r')) {
    console.warn("⚠️  WARNING: BREVO_SMTP_KEY contains newlines! This will cause authentication to fail.");
  }

  smtpTransporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "apikey", // 🔥 MUST BE EXACT - do not change this
      pass: brevoSmtpKey?.trim(), // Trim whitespace
    },
  });

  // Verify SMTP connection on startup
  smtpTransporter.verify((error, success) => {
    if (error) {
      console.error("❌ BREVO SMTP VERIFY FAILED:", error.message);
      console.error("❌ Error code:", error.code);
      if (error.code === 'EAUTH') {
        console.error("❌ AUTHENTICATION FAILED - Consider using BREVO_API_KEY instead:");
        console.error("   1. Go to https://app.brevo.com → Settings → SMTP & API");
        console.error("   2. Click 'API Keys' tab");
        console.error("   3. Copy the API key (starts with 'xkeysib-')");
        console.error("   4. Add to .env: BREVO_API_KEY=xkeysib-...");
      }
    } else {
      console.log("✅ BREVO SMTP READY - Connection verified successfully");
    }
  });
} else {
  if (process.env.BREVO_SMTP_KEY && !process.env.BREVO_SMTP_KEY.trim().startsWith('xsmtpsib-') && !process.env.BREVO_SMTP_KEY.trim().startsWith('xkeysib-')) {
    console.error("❌ BREVO_SMTP_KEY format is invalid!");
    console.error("   SMTP keys should start with 'xsmtpsib-'");
    console.error("   REST API keys should start with 'xkeysib-'");
    console.error(`   Your key starts with: ${process.env.BREVO_SMTP_KEY.trim().substring(0, 10)}...`);
  } else if (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.trim().startsWith('xkeysib-') && !process.env.BREVO_API_KEY.trim().startsWith('xsmtpsib-')) {
    console.error("❌ BREVO_API_KEY format is invalid!");
    console.error("   REST API keys should start with 'xkeysib-'");
    console.error("   SMTP keys should start with 'xsmtpsib-'");
    console.error(`   Your key starts with: ${process.env.BREVO_API_KEY.trim().substring(0, 10)}...`);
  } else {
    console.error("❌ Neither BREVO_API_KEY nor BREVO_SMTP_KEY is set!");
    console.error("   Add BREVO_API_KEY to .env (recommended) or BREVO_SMTP_KEY");
  }
}


exports.sendSignupOtp = async (req, res) => {
  let { email } = req.body;
  email = email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Validate EMAIL_FROM is set
  if (!process.env.EMAIL_FROM) {
    console.error("❌ EMAIL_FROM environment variable is not set");
    return res.status(500).json({ message: "Email configuration error" });
  }

  // Validate at least one Brevo key is set
  if (!USE_REST_API && !USE_SMTP) {
    console.error("❌ Neither BREVO_API_KEY nor BREVO_SMTP_KEY is set");
    return res.status(500).json({ message: "Email service configuration error" });
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
      console.log(`📧 From: ${process.env.EMAIL_FROM}`);

      if (USE_REST_API) {
        // Use Brevo REST API (recommended - works like Postman)
        const emailFrom = process.env.EMAIL_FROM;

        // Parse EMAIL_FROM format: "Name <email@domain.com>" or "email@domain.com"
        let senderName = "Generation Next";
        let senderEmail = emailFrom;

        const match = emailFrom.match(/^(.+?)\s*<(.+?)>$/);
        if (match) {
          senderName = match[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
          senderEmail = match[2].trim();
        } else if (emailFrom.includes('@')) {
          senderEmail = emailFrom.trim();
        }

        const response = await axios.post(
          'https://api.brevo.com/v3/smtp/email',
          {
            sender: {
              name: senderName,
              email: senderEmail
            },
            to: [
              {
                email: email
              }
            ],
            subject: "Your OTP Code",
            htmlContent: `<html><body><h1>Your OTP Code</h1><p>Your OTP is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p></body></html>`,
            textContent: `Your OTP is ${otp}. This code will expire in 5 minutes.`
          },
          {
            headers: {
              'api-key': brevoApiKey || process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log(`✅ OTP email sent successfully via REST API to: ${email}`);
        console.log(`✅ Message ID: ${response.data.messageId}`);
      } else if (USE_SMTP && smtpTransporter) {
        // Fallback to SMTP method
        await smtpTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP is ${otp}`,
        });

        console.log(`✅ OTP email sent successfully via SMTP to: ${email}`);
      } else {
        throw new Error("No email service configured");
      }
    } catch (mailErr) {
      console.error("❌ BREVO ERROR FULL:", mailErr);
      console.error("❌ BREVO ERROR MESSAGE:", mailErr.message);
      if (mailErr.response) {
        console.error("❌ BREVO ERROR RESPONSE:", mailErr.response.data);
        console.error("❌ BREVO ERROR STATUS:", mailErr.response.status);
      }
      if (mailErr.code) {
        console.error("❌ BREVO ERROR CODE:", mailErr.code);
      }
      console.error("❌ EMAIL_FROM used:", process.env.EMAIL_FROM);
      console.error("❌ Email send failed:", mailErr);
      return res.status(500).json({
        message: "Email service unavailable",
        error: process.env.NODE_ENV !== 'production' ? mailErr.message : undefined
      });
    }

    // ✅ THIS WAS MISSING
    return res.json({ message: "OTP sent successfully" });

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
    res.status(500).send('Server Error');
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