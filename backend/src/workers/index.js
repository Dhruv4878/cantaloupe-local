// src/workers/index.js
const { connection } = require('./connection');

const QUEUE_NAME = 'post-publish-queue';

let postQueue = null;

// Only create queue if Redis connection is available
if (connection) {
  const { Queue } = require('bullmq');
  postQueue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });
  console.log('[workers] Queue initialized with Redis connection');
} else {
  console.warn('[workers] Queue disabled - no Redis connection available');
}

module.exports = {
  postQueue,
  connection,
};
