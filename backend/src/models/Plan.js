const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price_monthly: { type: Number, required: true },
  price_yearly: { type: Number, default: null },
  // Explicitly added per user request for monthly limits
  posts_per_month: { type: Number, default: null },
  features: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  recommended: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);