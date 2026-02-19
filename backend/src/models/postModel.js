const mongoose = require("mongoose");

/* ======================================================
   Schedule Entry (per platform) — SOURCE OF TRUTH
====================================================== */
const ScheduleEntrySchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "processing",
        "posted",
        "failed",
        "cancelled",
      ],
      default: "pending",
    },

    label: String,
    timezone: String,

    lastAttemptAt: Date,
    postedAt: Date,

    error: String,

    jobIds: {
      type: [String],
      default: [],
    },

    results: [
      {
        status: {
          type: String,
          enum: ["posted", "failed"],
        },
        attemptedAt: Date,
        responseId: String,
        message: String,
        details: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { _id: false }
);

/* ======================================================
   Post Schema
====================================================== */
const PostSchema = new mongoose.Schema({
  /* ---------- Ownership ---------- */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  /* ---------- Generated Content ---------- */
  content: {
    type: Object,
    required: true,
  },

  imageVariants: {
    type: [String],
    default: [],
  },

  /* ---------- Scheduling (TRUTH) ---------- */
  schedule: {
    type: {
      timezone: String,
      entries: {
        type: [ScheduleEntrySchema],
        default: [],
      },
    },
    default: null,
  },

  /* ---------- Lifecycle (READ-OPTIMIZED SUMMARY) ---------- */
  lifecycle: {
    type: {
      generatedAt: {
        type: Date,
        default: Date.now,
      },

      publish: {
        type: {
          isPublished: {
            type: Boolean,
            default: false,
          },
          platforms: {
            type: [String],
            default: [],
          },
          publishedAt: Date,
          mode: {
            type: String,
            enum: ["direct", "scheduled"],
          },
          failedPlatforms: {
            type: [String],
            default: [],
          },
          lastFailedAt: Date,
        },
        default: null,
      },

      schedule: {
        type: {
          isScheduled: {
            type: Boolean,
            default: false,
          },
          platforms: {
            type: [String],
            default: [],
          },
          nextRunAt: Date,
          completedPlatforms: {
            type: [String],
            default: [],
          },
          failedPlatforms: {
            type: [String],
            default: [],
          },
        },
        default: null,
      },
    },
    default: {},
  },

  /* ---------- Metadata ---------- */
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  /* ---------- Credit Tracking ---------- */
  usedCredits: {
    type: Boolean,
    default: false,
    index: true,
  },

  /* ---------- Social Media Engagement Metrics ---------- */
  metrics: {
    type: {
      lastSyncedAt: Date,

      instagram: {
        postId: String, // Instagram media ID
        impressions: Number,
        reach: Number,
        engagement: Number,
        likes: Number,
        comments: Number,
        saves: Number,
        shares: Number,
        videoViews: Number,
        profileVisits: Number,
        follows: Number,
        fetchedAt: Date,
      },

      facebook: {
        postId: String, // Facebook post ID
        impressions: Number,
        reach: Number,
        engagement: Number,
        reactions: Number, // Total reactions
        reactionBreakdown: {
          like: Number,
          love: Number,
          wow: Number,
          haha: Number,
          sad: Number,
          angry: Number,
        },
        comments: Number,
        shares: Number,
        clicks: Number,
        videoViews: Number,
        fetchedAt: Date,
      },

      linkedin: {
        postId: String, // LinkedIn share URN
        impressions: Number,
        clicks: Number,
        engagement: Number,
        likes: Number,
        comments: Number,
        shares: Number,
        clickthroughRate: Number,
        fetchedAt: Date,
      },

      twitter: {
        postId: String, // Twitter tweet ID
        impressions: Number,
        engagements: Number,
        likes: Number,
        retweets: Number,
        replies: Number,
        quoteTweets: Number,
        profileClicks: Number,
        urlClicks: Number,
        videoViews: Number,
        fetchedAt: Date,
      },
    },
    default: null,
  },
});

/* ======================================================
   INDEXES
====================================================== */
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ "lifecycle.publish.isPublished": 1 });
PostSchema.index({ "lifecycle.schedule.isScheduled": 1 });
PostSchema.index({ "lifecycle.publish.platforms": 1 });
PostSchema.index({ userId: 1, usedCredits: 1 });

/* ======================================================
   STATIC HELPERS (THIS IS THE KEY PART)
====================================================== */

/**
 * Call this AFTER a platform is successfully published
 */
PostSchema.statics.updateLifecycleOnPublish = async function (
  postId,
  platform,
  mode = "scheduled"
) {
  const post = await this.findById(postId);
  if (!post) return;

  post.lifecycle = post.lifecycle || {};

  /* ---------- Publish ---------- */
  if (!post.lifecycle.publish) {
    // No publish summary exists yet — create one with the incoming mode and timestamp
    post.lifecycle.publish = {
      isPublished: true,
      platforms: [platform],
      publishedAt: new Date(),
      mode,
    };
  } else {
    post.lifecycle.publish.isPublished = true;

    // Ensure platforms list includes this platform
    if (!post.lifecycle.publish.platforms.includes(platform)) {
      post.lifecycle.publish.platforms.push(platform);
    }

    // Preserve an existing direct publish timestamp/mode
    // - If this publish is a DIRECT publish, always record the time and set mode to 'direct'
    // - If this publish is SCHEDULED, only set publishedAt if it is not already set (i.e., first publish)
    //   and do not override a previous 'direct' mode
    if (mode === 'direct') {
      post.lifecycle.publish.publishedAt = new Date();
      post.lifecycle.publish.mode = 'direct';
    } else {
      // mode === 'scheduled'
      if (!post.lifecycle.publish.publishedAt) {
        post.lifecycle.publish.publishedAt = new Date();
      }
      // only set mode to scheduled if it hasn't already been marked 'direct'
      if (post.lifecycle.publish.mode !== 'direct') {
        post.lifecycle.publish.mode = 'scheduled';
      }
    }
  }

  /* ---------- Schedule Summary ---------- */
  if (post.lifecycle.schedule) {
    if (
      !post.lifecycle.schedule.completedPlatforms.includes(platform)
    ) {
      post.lifecycle.schedule.completedPlatforms.push(platform);
    }

    post.lifecycle.schedule.failedPlatforms =
      post.lifecycle.schedule.failedPlatforms?.filter(
        (p) => p !== platform
      ) || [];
  }

  await post.save();
};

/**
 * Call this when scheduling is created
 */
PostSchema.statics.updateLifecycleOnSchedule = async function (
  postId,
  platforms,
  nextRunAt
) {
  const post = await this.findById(postId);
  if (!post) return;

  post.lifecycle = post.lifecycle || {};

  post.lifecycle.schedule = {
    isScheduled: true,
    platforms,
    nextRunAt,
    completedPlatforms: [],
    failedPlatforms: [],
  };

  await post.save();
};

/**
 * Call this when a publish attempt fails (direct or scheduled)
 * - records failed platform in lifecycle.publish.failedPlatforms
 * - updates lastFailedAt and preserves mode
 */
PostSchema.statics.updateLifecycleOnPublishFailure = async function (
  postId,
  platform,
  mode = "direct",
  message = null
) {
  const post = await this.findById(postId);
  if (!post) return;

  post.lifecycle = post.lifecycle || {};

  if (!post.lifecycle.publish) {
    post.lifecycle.publish = {
      isPublished: false,
      platforms: [],
      publishedAt: null,
      mode,
      failedPlatforms: [platform],
      lastFailedAt: new Date(),
    };
  } else {
    post.lifecycle.publish.isPublished = false;
    post.lifecycle.publish.mode = mode;

    // add to failedPlatforms
    post.lifecycle.publish.failedPlatforms = post.lifecycle.publish.failedPlatforms || [];
    if (!post.lifecycle.publish.failedPlatforms.includes(platform)) {
      post.lifecycle.publish.failedPlatforms.push(platform);
    }

    post.lifecycle.publish.lastFailedAt = new Date();
  }

  await post.save();
};

/* ======================================================
   MODEL EXPORT
====================================================== */
const Post = mongoose.model("Post", PostSchema);

module.exports = Post; 