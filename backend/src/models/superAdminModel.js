const mongoose = require("mongoose");

const superAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password_hash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "super_admin",
      enum: ["super_admin"], // locked role for highest security
    },

    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    loginHistory: [
      {
        ip: { type: String },
        userAgent: { type: String },
        time: { type: Date, default: Date.now },
      }
    ],
  },
  {
    timestamps: true,   // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
