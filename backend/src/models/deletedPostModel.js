const mongoose = require('mongoose');

// Mirror Post schema and add deletion metadata
const DeletedPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  originalPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
  deletedAt: {
    type: Date,
    default: Date.now,
  },
});

const DeletedPost = mongoose.model('DeletedPost', DeletedPostSchema, 'deletedposts');

module.exports = DeletedPost;


