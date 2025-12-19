// src/admin/bullBoard.js
const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { postQueue } = require('../workers');

const router = express.Router();
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

let bullBoardReady = false;

try {
  // Bull Board only supports real BullMQ queues; our in-memory dev queue should skip this.
  if (postQueue && typeof postQueue.waitUntilReady === 'function') {
    createBullBoard({
      queues: [new BullMQAdapter(postQueue)],
      serverAdapter,
    });
    bullBoardReady = true;
  } else {
    console.warn('[bull-board] disabled: no queue available');
  }
} catch (err) {
  console.warn('[bull-board] disabled:', err.message);
}

if (bullBoardReady) {
  router.use('/admin/queues', serverAdapter.getRouter());
} else {
  router.get('/admin/queues', (_req, res) =>
    res
      .status(503)
      .json({ error: 'Bull Board unavailable: no BullMQ queue configured.' })
  );
}

module.exports = router;
