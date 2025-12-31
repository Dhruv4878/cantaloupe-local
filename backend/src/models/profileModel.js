const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  // Step 1
  businessName: { type: String, trim: true },
  website: { type: String, trim: true },

  // Step 2
  businessDescription: { type: String },
  industry: { type: String },
  companySize: { type: String },

  // Step 3
  // Store uploaded logo URL
  businessLogo: { type: String },
  primaryBrandColor: { type: String, trim: true },

  onboardingComplete: {
    type: Boolean,
    default: false,
  },

  // Social connections
  social: {
    facebook: {
      pageId: { type: String },
      accessToken: { type: String }, // Page access token (long-lived)
      connectedAt: { type: Date },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    },
    instagram: {
      igBusinessId: { type: String }, // Instagram business account id
      accessToken: { type: String }, // Same Graph token with required scopes
      connectedAt: { type: Date },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    },
    linkedin: {
      memberId: { type: String }, // LinkedIn member ID
      accessToken: { type: String }, // LinkedIn access token
      connectedAt: { type: Date },
      organizationId: { type: String }, // LinkedIn organization (company page) ID
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    },
    twitter: {
      userId: { type: String }, // Twitter user id
      username: { type: String }, // Twitter handle
      accessToken: { type: String }, // OAuth2 user access token with tweet.write
      oauthToken: { type: String }, // OAuth1 token (for media upload)
      oauthTokenSecret: { type: String }, // OAuth1 token secret
      refreshToken: { type: String }, // Optional refresh token if offline.access granted
      expiresAt: { type: Date }, // Token expiry (optional)
      connectedAt: { type: Date },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    },
  },
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;