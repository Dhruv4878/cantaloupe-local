const axios = require('axios');
const nodemailer = require('nodemailer');

// Initialize Brevo configuration
let brevoApiKey = process.env.BREVO_API_KEY;
let brevoSmtpKey = process.env.BREVO_SMTP_KEY;

// Auto-detect keys logic (copied from authController to ensure consistency)
if (brevoSmtpKey && brevoSmtpKey.trim().startsWith('xkeysib-')) {
  if (!brevoApiKey) {
    brevoApiKey = brevoSmtpKey.trim();
  }
}

if (brevoApiKey && brevoApiKey.trim().startsWith('xsmtpsib-')) {
  if (!brevoSmtpKey) {
    brevoSmtpKey = brevoApiKey.trim();
    brevoApiKey = null;
  }
}

const USE_REST_API = !!brevoApiKey && brevoApiKey.trim().startsWith('xkeysib-');
const USE_SMTP = !USE_REST_API && !!brevoSmtpKey && brevoSmtpKey.trim().startsWith('xsmtpsib-');

let smtpTransporter = null;

if (USE_SMTP) {
  smtpTransporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "apikey",
      pass: brevoSmtpKey?.trim(),
    },
  });
}

/**
 * Parses the EMAIL_FROM environment variable.
 * @returns {object} { name, email }
 */
const getSenderInfo = () => {
  const emailFrom = process.env.EMAIL_FROM;
  let senderName = "Generation Next";
  let senderEmail = emailFrom;

  if (emailFrom) {
    const match = emailFrom.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      senderName = match[1].trim().replace(/^["']|["']$/g, '');
      senderEmail = match[2].trim();
    } else if (emailFrom.includes('@')) {
      senderEmail = emailFrom.trim();
    }
  }
  return { name: senderName, email: senderEmail };
};

/**
 * Sends an email using Brevo (REST API or SMTP).
 * @param {string} toEmail - Recipient email address.
 * @param {string} subject - Email subject.
 * @param {string} htmlContent - HTML content of the email.
 * @param {string} textContent - Plain text content of the email.
 * @returns {Promise<object>} Response data.
 */
const sendEmail = async (toEmail, subject, htmlContent, textContent) => {
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  if (!USE_REST_API && !USE_SMTP) {
    throw new Error("No email service configured (BREVO_API_KEY or BREVO_SMTP_KEY missing)");
  }

  const { name: senderName, email: senderEmail } = getSenderInfo();

  if (USE_REST_API) {
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: toEmail }],
          subject: subject,
          htmlContent: htmlContent,
          textContent: textContent || htmlContent.replace(/<[^>]*>/g, '') // Fallback text generation
        },
        {
          headers: {
            'api-key': brevoApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Email sent via REST API to: ${toEmail}`);
      return response.data;
    } catch (error) {
      console.error("❌ Failed to send email via REST API:", error.response?.data || error.message);
      throw error;
    }
  } else if (USE_SMTP && smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''),
      });
      console.log(`✅ Email sent via SMTP to: ${toEmail}`);
      return info;
    } catch (error) {
      console.error("❌ Failed to send email via SMTP:", error.message);
      throw error;
    }
  }
};

/**
 * Sends a welcome email (optional/future use).
 */
const sendWelcomeEmail = async (user) => {
  // Implementation for welcome email
};

/**
 * Sends a subscription success email.
 * @param {object} user - User object.
 * @param {object} plan - Plan object.
 * @param {string} endDate - Formatted end date string.
 * @param {string} orderId - Order ID.
 */
const sendSubscriptionSuccessEmail = async (user, plan, endDate, orderId) => {
  const subject = `Welcome to the ${plan.name} Plan!`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">Subscription Confirmed</h2>
        <p>Hi ${user.firstName},</p>
        <p>Thank you for subscribing to the <strong>${plan.name}</strong> plan.</p>
        <p>Your subscription is now active and valid until <strong>${endDate}</strong>.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p>Plan Details:</p>
        <ul>
          <li><strong>Plan:</strong> ${plan.name}</li>
          <li><strong>Price:</strong> ${plan.price_monthly ? plan.price_monthly + '/month' : 'custom'}</li>
        </ul>
        <p>Enjoy creating amazing content!</p>
        <p>Best regards,<br>Generation Next Team</p>
      </body>
    </html>
  `;
  const textContent = `Hi ${user.firstName}, Thank you for subscribing to the ${plan.name} plan. Order ID: ${orderId}. Valid until ${endDate}. Enjoy!`;

  return sendEmail(user.email, subject, htmlContent, textContent);
};

/**
 * Sends a credit purchase success email.
 * @param {object} user - User object.
 * @param {number} credits - Number of credits purchased.
 * @param {number} amount - Amount paid.
 * @param {string} orderId - Order ID.
 */
const sendCreditPurchaseSuccessEmail = async (user, credits, amount, orderId) => {
  const subject = `Credits Purchased Successfully`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2c3e50;">Payment Successful</h2>
        <p>Hi ${user.firstName},</p>
        <p>We have received your payment of <strong>₹${amount}</strong>.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>${credits} credits</strong> have been added to your account.</p>
        <p>Total Credits Available: ${user.creditLimit}</p>
        <p>Best regards,<br>Generation Next Team</p>
      </body>
    </html>
  `;
  const textContent = `Hi ${user.firstName}, Payment of ₹${amount} received. Order ID: ${orderId}. ${credits} credits added. Total: ${user.creditLimit}.`;

  return sendEmail(user.email, subject, htmlContent, textContent);
};

/**
 * Sends a subscription expiration warning email.
 * @param {object} user - User object.
 * @param {object} plan - Plan object.
 * @param {string} expiryDate - Formatted expiry date string.
 */
const sendSubscriptionExpiringEmail = async (user, plan, expiryDate) => {
  const subject = `Your ${plan.name} Plan is Expiring Soon`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #e67e22;">Action Required: Subscription Expiring</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your <strong>${plan.name}</strong> plan is scheduled to expire on <strong>${expiryDate}</strong>.</p>
        <p>Please renew your subscription to avoid interruption of services.</p>
        <p><a href="https://your-app-url.com/pricing" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Now</a></p>
        <p>Best regards,<br>Generation Next Team</p>
      </body>
    </html>
  `;
  const textContent = `Hi ${user.firstName}, Your ${plan.name} plan expires on ${expiryDate}. Please renew soon.`;

  return sendEmail(user.email, subject, htmlContent, textContent);
};

/**
 * Sends a low credit warning email.
 * @param {object} user - User object.
 * @param {number} currentCredits - Current credit balance.
 */
const sendLowCreditsEmail = async (user, currentCredits) => {
  const subject = `Low Credit Balance Alert`;
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #c0392b;">Low Credits Alert</h2>
        <p>Hi ${user.firstName},</p>
        <p>You are running low on credits. You currently have <strong>${currentCredits} credits</strong> remaining.</p>
        <p>Top up now to continue generating content without interruption.</p>
        <p><a href="https://your-app-url.com/credits" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Buy Credits</a></p>
        <p>Best regards,<br>Generation Next Team</p>
      </body>
    </html>
  `;
  const textContent = `Hi ${user.firstName}, You have ${currentCredits} credits remaining. Top up to continue.`;

  return sendEmail(user.email, subject, htmlContent, textContent);
};

module.exports = {
  sendEmail,
  sendSubscriptionSuccessEmail,
  sendCreditPurchaseSuccessEmail,
  sendSubscriptionExpiringEmail,
  sendLowCreditsEmail
};
