// src/workers/queueWorker.js
require('dotenv').config();
const { connection } = require('.');

// Exit early if no Redis connection
if (!connection) {
  console.log('[queueWorker] No Redis connection available. Queue worker disabled.');
  process.exit(0);
}

const { Worker } = require('bullmq');
const Post = require('../models/postModel');
const Profile = require('../models/profileModel');
const { publishToPlatform, SocialPublishError } = require('../services/socialPublisher');

// Helper function to update schedule entry in either location
const updateScheduleEntryStatus = async (postId, platform, scheduledAt, updates) => {
  const jobScheduledAt = new Date(scheduledAt);
  const oneMinute = 60 * 1000; // 1 minute in milliseconds

  // Helper to try updating at a specific path
  const tryUpdateAtPath = async (path) => {
    // Try exact date match first
    let updateResult = await Post.updateOne(
      {
        _id: postId,
        [path]: {
          $elemMatch: {
            platform,
            scheduledAt: jobScheduledAt
          }
        }
      },
      {
        $set: Object.keys(updates.set || {}).reduce((acc, key) => {
          acc[`${path}.$[target].${key}`] = updates.set[key];
          return acc;
        }, {}),
        $push: updates.push ? {
          [`${path}.$[target].results`]: updates.push
        } : undefined,
      },
      {
        arrayFilters: [{
          'target.platform': platform,
          'target.scheduledAt': jobScheduledAt
        }],
      }
    );

    // If exact match failed, try approximate match (within 1 minute)
    if (updateResult.matchedCount === 0) {
      const postDoc = await Post.findById(postId);
      if (postDoc) {
        const entriesPath = path.split('.');
        let entries = postDoc;
        for (const key of entriesPath) {
          entries = entries?.[key];
        }

        if (Array.isArray(entries)) {
          const matchingEntry = entries.find(entry => {
            if (entry.platform !== platform) return false;
            const entryTime = new Date(entry.scheduledAt).getTime();
            const jobTime = jobScheduledAt.getTime();
            return Math.abs(entryTime - jobTime) < oneMinute;
          });

          if (matchingEntry) {
            const entryTime = new Date(matchingEntry.scheduledAt);
            updateResult = await Post.updateOne(
              {
                _id: postId,
                [path]: {
                  $elemMatch: {
                    platform,
                    scheduledAt: entryTime
                  }
                }
              },
              {
                $set: Object.keys(updates.set || {}).reduce((acc, key) => {
                  acc[`${path}.$[target].${key}`] = updates.set[key];
                  return acc;
                }, {}),
                $push: updates.push ? {
                  [`${path}.$[target].results`]: updates.push
                } : undefined,
              },
              {
                arrayFilters: [{
                  'target.platform': platform,
                  'target.scheduledAt': entryTime
                }],
              }
            );
          }
        }
      }
    }

    return updateResult.matchedCount > 0;
  };

  // Try top-level schedule first
  let updated = await tryUpdateAtPath('schedule.entries');

  // If not found, try content.schedule.entries
  if (!updated) {
    updated = await tryUpdateAtPath('content.schedule.entries');
  }

  return updated;
};

const worker = new Worker(
  'post-publish-queue',
  async (job) => {
    const { postId, userId, platform, scheduledAt } = job.data;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const profile = await Profile.findOne({ user: userId });
    if (!profile) throw new Error('Profile not found');

    try {
      const result = await publishToPlatform({ post, profile, platform });

      // Update schedule entry status to 'posted'
      const updated = await updateScheduleEntryStatus(postId, platform, scheduledAt, {
        set: {
          status: 'posted',
          postedAt: new Date(),
          lastAttemptAt: new Date(),
          error: null,
        },
        push: {
          status: 'posted',
          attemptedAt: new Date(),
          responseId: result?.response?.id || null,
          message: 'Posted',
        },
      });

      if (!updated) {
        console.warn(`[queueWorker] Could not find schedule entry for post ${postId}, platform ${platform}, scheduledAt ${scheduledAt}`);
      } else {
        console.log(`[queueWorker] Successfully updated schedule entry for post ${postId}, platform ${platform}`);
      }

      return result;
    } catch (err) {
      const errMsg = err?.message || 'Publish failed';

      // Update schedule entry status to 'failed'
      await updateScheduleEntryStatus(postId, platform, scheduledAt, {
        set: {
          status: 'failed',
          lastAttemptAt: new Date(),
          error: errMsg,
        },
        push: {
          status: 'failed',
          attemptedAt: new Date(),
          message: errMsg,
          details: err.details || null,
        },
      });

      // rethrow so BullMQ applies attempts/backoff
      throw err;
    }
  },
  { connection, concurrency: 2 }
);

worker.on('completed', (job) => {
  console.log(`[queueWorker] completed job ${job.id}`, job.data);
});
worker.on('failed', (job, err) => {
  console.error(`[queueWorker] failed job ${job?.id}:`, err?.message);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

module.exports = worker;
