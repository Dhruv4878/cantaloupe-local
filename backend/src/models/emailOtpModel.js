const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
