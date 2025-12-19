const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  // This links the post to the user who created it
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assumes you have a 'User' model
    required: true,
  },
  // This will store the generated content for all platforms
  // e.g., { instagram: { postContent: '...', imageUrl: '...' }}
  content: {
    type: Object,
    required: true,
  },
  // Optional: store multiple generated image variants for the post
  imageVariants: {
    type: [String], // array of image URLs
    default: [],
  },
  schedule: {
    type: {
      timezone: { type: String },
      entries: [
        {
          platform: { type: String, required: true },
          scheduledAt: { type: Date, required: true },
          status: {
            type: String,
            enum: ['pending', 'queued', 'processing', 'posted', 'failed', 'cancelled'],
            default: 'pending',
          },
          label: { type: String },
          timezone: { type: String },
          lastAttemptAt: { type: Date },
          postedAt: { type: Date },
          error: { type: String },
          jobIds: { type: [String], default: [] }, // Store BullMQ job IDs for cancellation
          results: [
            {
              status: { type: String, enum: ['posted', 'failed'] },
              attemptedAt: { type: Date },
              responseId: { type: String },
              message: { type: String },
              details: { type: mongoose.Schema.Types.Mixed },
            },
          ],
        },
      ],
    },
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;