const mongoose = require('mongoose');

const userUsageSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  posts_generated: { type: Number, default: 0 },
  credits_used: { type: Number, default: 0 }, // Posts generated using credits (not monthly plan)
}, { timestamps: true });

userUsageSchema.index({ user_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('UserUsage', userUsageSchema);
