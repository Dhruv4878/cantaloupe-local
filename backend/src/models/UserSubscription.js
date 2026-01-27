const mongoose = require('mongoose');

const userSubscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date, default: null },
  is_active: { type: Boolean, default: false },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  payment_mode: { type: String, enum: ['monthly', 'yearly'], required: true },
  // Added 'system' to the enum below so the auto-assignment works
  gateway: { type: String, enum: ['razorpay', 'stripe', 'manual', 'system'], default: 'razorpay' },
}, { timestamps: true });

module.exports = mongoose.model('UserSubscription', userSubscriptionSchema);