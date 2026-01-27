const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  globalDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
