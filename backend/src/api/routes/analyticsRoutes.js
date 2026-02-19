const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

// Import analytics services
const instagramService = require('../../services/analytics/instagramMetricsService');
const facebookService = require('../../services/analytics/facebookMetricsService');
const linkedinService = require('../../services/analytics/linkedinMetricsService');
const twitterService = require('../../services/analytics/twitterMetricsService');
const aggregationService = require('../../services/analytics/analyticsAggregationService');

/* ======================================================
   POST: Sync metrics from all connected platforms
====================================================== */
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Starting analytics sync for user ${userId}`);

    // Sync metrics from all platforms in parallel
    const results = await Promise.allSettled([
      instagramService.syncAllInstagramMetrics(userId),
      facebookService.syncAllFacebookMetrics(userId),
      linkedinService.syncAllLinkedInMetrics(userId),
      twitterService.syncAllTwitterMetrics(userId),
    ]);

    const syncResults = {
      instagram: results[0].status === 'fulfilled' ? results[0].value : { success: false, message: results[0].reason?.message },
      facebook: results[1].status === 'fulfilled' ? results[1].value : { success: false, message: results[1].reason?.message },
      linkedin: results[2].status === 'fulfilled' ? results[2].value : { success: false, message: results[2].reason?.message },
      twitter: results[3].status === 'fulfilled' ? results[3].value : { success: false, message: results[3].reason?.message },
    };

    const totalSynced =
      (syncResults.instagram.synced || 0) +
      (syncResults.facebook.synced || 0) +
      (syncResults.linkedin.synced || 0) +
      (syncResults.twitter.synced || 0);

    const totalErrors =
      (syncResults.instagram.errors || 0) +
      (syncResults.facebook.errors || 0) +
      (syncResults.linkedin.errors || 0) +
      (syncResults.twitter.errors || 0);

    return res.json({
      success: true,
      message: `Synced metrics for ${totalSynced} posts with ${totalErrors} errors`,
      totalSynced,
      totalErrors,
      details: syncResults,
      syncedAt: new Date(),
    });
  } catch (error) {
    console.error('Analytics sync error:', error);
    return res.status(500).json({
      error: 'Failed to sync analytics',
      message: error.message
    });
  }
});

/* ======================================================
   GET: Engagement summary (average engagement rate)
====================================================== */
router.get('/engagement-summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await aggregationService.calculateEngagementRate(userId);

    return res.json(data);
  } catch (error) {
    console.error('Engagement summary error:', error);
    return res.status(500).json({
      error: 'Failed to calculate engagement rate',
      message: error.message
    });
  }
});

/* ======================================================
   GET: Monthly trend (last 6 months)
====================================================== */
router.get('/monthly-trend', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const months = parseInt(req.query.months) || 6;
    const data = await aggregationService.getMonthlyTrend(userId, months);

    return res.json(data);
  } catch (error) {
    console.error('Monthly trend error:', error);
    return res.status(500).json({
      error: 'Failed to get monthly trend',
      message: error.message
    });
  }
});

/* ======================================================
   GET: Top platform by engagement rate
====================================================== */
router.get('/top-platform', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await aggregationService.getTopPlatform(userId);

    if (!data) {
      return res.json({
        platform: null,
        message: 'No platform data available'
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Top platform error:', error);
    return res.status(500).json({
      error: 'Failed to get top platform',
      message: error.message
    });
  }
});

/* ======================================================
   GET: Top engaging post
====================================================== */
router.get('/top-post', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = await aggregationService.getTopPost(userId);

    if (!data) {
      return res.json({
        post: null,
        message: 'No post data available'
      });
    }

    return res.json(data);
  } catch (error) {
    console.error('Top post error:', error);
    return res.status(500).json({
      error: 'Failed to get top post',
      message: error.message
    });
  }
});

/* ======================================================
   GET: AI-generated insights
====================================================== */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const insights = await aggregationService.generateInsights(userId);

    return res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    return res.status(500).json({
      error: 'Failed to generate insights',
      message: error.message
    });
  }
});

module.exports = router;
