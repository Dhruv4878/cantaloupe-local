/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../models/postModel');
const Profile = require('../models/profileModel');
const { publishToPlatform, SocialPublishError } = require('../services/socialPublisher');

const POLL_INTERVAL_MS = parseInt(process.env.SCHEDULE_POLL_INTERVAL_MS || '30000', 10);
const BATCH_SIZE = parseInt(process.env.SCHEDULE_BATCH_SIZE || '10', 10);
const ELIGIBLE_STATUSES = ['pending', 'queued', 'failed'];

const summarizeEntryError = (attempts = []) => {
  const failed = attempts.filter((r) => r.status === 'failed');
  if (!failed.length) return null;
  return failed.map((entry) => entry.message).join(' | ').slice(0, 500);
};

const lockScheduleEntry = async (postId, platform, scheduledAt) => {
  const now = new Date();
  return Post.findOneAndUpdate(
    {
      _id: postId,
      'schedule.entries': {
        $elemMatch: {
          platform,
          status: { $in: ELIGIBLE_STATUSES },
          scheduledAt,
        },
      },
    },
    {
      $set: {
        'schedule.entries.$[target].status': 'processing',
        'schedule.entries.$[target].lastAttemptAt': now,
        'schedule.entries.$[target].error': null,
      },
    },
    {
      new: true,
      arrayFilters: [
        {
          'target.platform': platform,
          'target.scheduledAt': scheduledAt,
          'target.status': { $in: ELIGIBLE_STATUSES },
        },
      ],
    },
  );
};

const updateScheduleEntry = async (postId, platform, scheduledAt, updates) => {
  const setOps = {};
  Object.entries(updates).forEach(([key, value]) => {
    setOps[`schedule.entries.$[target].${key}`] = value;
  });
  return Post.updateOne(
    { _id: postId },
    {
      $set: setOps,
    },
    {
      arrayFilters: [
        {
          'target.platform': platform,
          'target.scheduledAt': scheduledAt,
        },
      ],
    },
  );
};

const processEntry = async (post, entry) => {
  const profile = await Profile.findOne({ user: post.userId });
  const attemptMetadata = {
    status: 'failed',
    attemptedAt: new Date(),
  };

  try {
    const result = await publishToPlatform({ post, profile, platform: entry.platform });
    attemptMetadata.status = 'posted';
    attemptMetadata.responseId =
      result?.response?.id ||
      result?.response?.post_id ||
      result?.response?.media?.[0]?.media ||
      null;

    await updateScheduleEntry(post._id, entry.platform, entry.scheduledAt, {
      status: 'posted',
      postedAt: new Date(),
      results: [attemptMetadata],
      error: null,
    });
    console.log(`[Scheduler] Posted ${post._id} to ${entry.platform}`);
  } catch (err) {
    attemptMetadata.message = err?.message || 'Failed to publish';
    if (err instanceof SocialPublishError && err.details) {
      attemptMetadata.details = err.details;
    }
    await updateScheduleEntry(post._id, entry.platform, entry.scheduledAt, {
      status: 'failed',
      error: summarizeEntryError([attemptMetadata]),
      results: [attemptMetadata],
    });
    console.error(`[Scheduler] Failed to post ${post._id} to ${entry.platform}:`, attemptMetadata.message);
  }
};

const pollDueSchedules = async () => {
  const now = new Date();
  const candidates = await Post.find({
    'schedule.entries': {
      $elemMatch: {
        status: { $in: ELIGIBLE_STATUSES },
        scheduledAt: { $lte: now },
      },
    },
  })
    .sort({ 'schedule.entries.scheduledAt': 1 })
    .limit(BATCH_SIZE)
    .lean(false);

  for (const candidate of candidates) {
    const entries = candidate?.schedule?.entries || [];
    for (const entry of entries) {
      if (!ELIGIBLE_STATUSES.includes(entry.status)) continue;
      if (entry.scheduledAt > now) continue;

      const locked = await lockScheduleEntry(candidate._id, entry.platform, entry.scheduledAt);
      if (!locked) continue;
      const freshEntry = locked.schedule?.entries?.find(
        (item) =>
          item.platform === entry.platform &&
          new Date(item.scheduledAt).getTime() === new Date(entry.scheduledAt).getTime(),
      );
      if (!freshEntry) continue;
      try {
        await processEntry(locked, freshEntry);
      } catch (err) {
        console.error(`[Scheduler] Unexpected error posting ${locked._id} (${entry.platform}):`, err);
        await updateScheduleEntry(locked._id, entry.platform, entry.scheduledAt, {
          status: 'failed',
          error: err.message || 'Unexpected scheduler error',
          results: [
            {
              status: 'failed',
              attemptedAt: new Date(),
              message: err.message || 'Unexpected scheduler error',
            },
          ],
        });
      }
    }
  }
};

const startWorker = async () => {
  if (!process.env.MONGO_URI) {
    console.error('SCHEDULE WORKER: MONGO_URI is required.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Scheduler] Connected to Mongo. Starting poll loop…');

  let polling = false;
  const runner = async () => {
    if (polling) return;
    polling = true;
    try {
      await pollDueSchedules();
    } finally {
      polling = false;
    }
  };

  runner();
  setInterval(runner, POLL_INTERVAL_MS);
};

startWorker().catch((err) => {
  console.error('[Scheduler] Fatal error:', err);
  process.exit(1);
});

