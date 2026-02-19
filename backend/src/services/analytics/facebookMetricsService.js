const axios = require('axios');
const Post = require('../../models/postModel');

/**
 * Fetch Facebook Page Post Insights
 * Uses Facebook Graph API: https://developers.facebook.com/docs/graph-api/reference/v18.0/insights
 */
async function fetchFacebookMetrics(postId, accessToken, fbPostId) {
  try {
    if (!fbPostId) {
      console.log(`No Facebook post ID for post ${postId}`);
      return null;
    }

    // Fetch post insights
    const metricsToFetch = [
      'post_impressions',
      'post_impressions_unique', // Reach
      'post_engaged_users',
      'post_reactions_by_type_total',
      'post_clicks',
      'post_video_views', // Only for videos
    ];

    const url = `https://graph.facebook.com/v18.0/${fbPostId}/insights`;

    const response = await axios.get(url, {
      params: {
        metric: metricsToFetch.join(','),
        access_token: accessToken,
      },
    });

    // Also fetch basic post data for reactions, comments, shares
    const postDataUrl = `https://graph.facebook.com/v18.0/${fbPostId}`;
    const postResponse = await axios.get(postDataUrl, {
      params: {
        fields: 'reactions.summary(true),comments.summary(true),shares',
        access_token: accessToken,
      },
    });

    const metricsData = {
      postId: fbPostId,
      fetchedAt: new Date(),
      impressions: 0,
      reach: 0,
      engagement: 0,
      reactions: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      videoViews: 0,
      reactionBreakdown: {},
    };

    // Parse insights data
    if (response.data && response.data.data) {
      response.data.data.forEach((item) => {
        const metricName = item.name;
        const value = item.values && item.values[0] ? item.values[0].value : 0;

        switch (metricName) {
          case 'post_impressions':
            metricsData.impressions = value;
            break;
          case 'post_impressions_unique':
            metricsData.reach = value;
            break;
          case 'post_engaged_users':
            metricsData.engagement = value;
            break;
          case 'post_reactions_by_type_total':
            if (typeof value === 'object') {
              metricsData.reactionBreakdown = {
                like: value.like || 0,
                love: value.love || 0,
                wow: value.wow || 0,
                haha: value.haha || 0,
                sad: value.sad || 0,
                angry: value.angry || 0,
              };
            }
            break;
          case 'post_clicks':
            metricsData.clicks = value;
            break;
          case 'post_video_views':
            metricsData.videoViews = value;
            break;
        }
      });
    }

    // Parse basic post data
    if (postResponse.data) {
      const data = postResponse.data;

      if (data.reactions && data.reactions.summary) {
        metricsData.reactions = data.reactions.summary.total_count || 0;
      }

      if (data.comments && data.comments.summary) {
        metricsData.comments = data.comments.summary.total_count || 0;
      }

      if (data.shares) {
        metricsData.shares = data.shares.count || 0;
      }
    }

    return metricsData;
  } catch (error) {
    if (error.response) {
      console.error(`Facebook API error for post ${fbPostId}:`, error.response.data);

      if (error.response.status === 400) {
        console.log('Post may have been deleted or metrics not available');
      } else if (error.response.status === 403 || error.response.status === 190) {
        console.log('Access token may have expired or lacks permissions');
      }
    } else {
      console.error(`Error fetching Facebook metrics:`, error.message);
    }
    return null;
  }
}

/**
 * Sync all Facebook metrics for a user's published posts
 */
async function syncAllFacebookMetrics(userId) {
  try {
    const Profile = require('../../models/profileModel');
    const profile = await Profile.findOne({ user: userId });

    if (!profile || !profile.social?.facebook?.accessToken) {
      console.log(`No Facebook connection for user ${userId}`);
      return { success: false, message: 'Facebook not connected' };
    }

    const accessToken = profile.social.facebook.accessToken;

    // Find all published posts with Facebook platform
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'lifecycle.publish.platforms': 'facebook',
    });

    console.log(`Found ${posts.length} Facebook posts for user ${userId}`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      const fbPostId =
        post.metrics?.facebook?.postId ||
        post.content?.platforms?.facebook?.postId ||
        post.content?.facebook?.postId;

      if (!fbPostId) {
        console.log(`No Facebook post ID found for post ${post._id}`);
        errorCount++;
        continue;
      }

      const metricsData = await fetchFacebookMetrics(post._id, accessToken, fbPostId);

      if (metricsData) {
        post.metrics = post.metrics || {};
        post.metrics.facebook = metricsData;
        post.metrics.lastSyncedAt = new Date();
        await post.save();
        successCount++;
        console.log(`Updated Facebook metrics for post ${post._id}`);
      } else {
        errorCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: true,
      synced: successCount,
      errors: errorCount,
      total: posts.length,
    };
  } catch (error) {
    console.error('Error syncing Facebook metrics:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  fetchFacebookMetrics,
  syncAllFacebookMetrics,
};
