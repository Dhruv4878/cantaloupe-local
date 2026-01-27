const Razorpay = require('razorpay');

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  // Amount expected in smallest currency unit for Razorpay (paise)
  const rzAmount = Math.round(amount * 100);

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    // Development fallback (no real gateway)
    return {
      id: `mock_order_${Date.now()}`,
      amount: rzAmount,
      currency,
      receipt,
      status: 'created',
      notes,
      mock: true,
    };
  }

  const razor = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

  const order = await razor.orders.create({ amount: rzAmount, currency, receipt, notes });
  return order;
};

const verifyRazorpaySignature = (payload, signature) => {
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');
  return expected === signature;
};

module.exports = { createOrder, verifyRazorpaySignature };
