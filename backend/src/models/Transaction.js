const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: false }, // Make optional for credit purchases
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  gateway_response: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  transaction_type: { type: String, enum: ['subscription', 'credit_purchase'], default: 'subscription' }, // Add transaction type
  payment_id: { type: String }, // Razorpay payment ID for successful transactions
  failure_reason: { type: String }, // Reason for failed/cancelled transactions
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
