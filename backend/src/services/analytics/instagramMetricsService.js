const axios = require('axios');
const Post = require('../../models/postModel');

/**
 * Fetch Instagram Insights for a specific media post
 * Uses Instagram Graph API: https://developers.facebook.com/docs/instagram-api/reference/ig-media/insights
 */
async function fetchInstagramMetrics(postId, accessToken, igMediaId) {
  try {
    if (!igMediaId) {
      console.log(`No Instagram media ID for post ${postId}`);
      return null;
    }

    // Metrics available for different media types
    const metrics = [
      'impressions',
      'reach',
      'engagement',
      'likes',
      'comments',
      'saves',
      'shares',
      'video_views', // Only for videos
      'profile_visits',
      'follows',
    ];

    const metricsQuery = metrics.join(',');
    const url = `https://graph.facebook.com/v18.0/${igMediaId}/insights`;

    const response = await axios.get(url, {
      params: {
        metric: metricsQuery,
        access_token: accessToken,
      },
    });

    if (!response.data || !response.data.data) {
      console.log(`No insights data returned for Instagram media ${igMediaId}`);
      return null;
    }

    // Parse the response data into a structured format
    const metricsData = {
      postId: igMediaId,
      fetchedAt: new Date(),
    };

    response.data.data.forEach((item) => {
      const metricName = item.name;
      const value = item.values && item.values[0] ? item.values[0].value : 0;

      switch (metricName) {
        case 'impressions':
          metricsData.impressions = value;
          break;
        case 'reach':
          metricsData.reach = value;
          break;
        case 'engagement':
          metricsData.engagement = value;
          break;
        case 'likes':
          metricsData.likes = value;
          break;
        case 'comments':
          metricsData.comments = value;
          break;
        case 'saves':
          metricsData.saves = value;
          break;
        case 'shares':
          metricsData.shares = value;
          break;
        case 'video_views':
          metricsData.videoViews = value;
          break;
        case 'profile_visits':
          metricsData.profileVisits = value;
          break;
        case 'follows':
          metricsData.follows = value;
          break;
      }
    });

    return metricsData;
  } catch (error) {
    if (error.response) {
      console.error(`Instagram API error for media ${igMediaId}:`, error.response.data);

      // Handle specific errors
      if (error.response.status === 400) {
        console.log('Possibly invalid metrics for this media type');
      } else if (error.response.status === 403) {
        console.log('Access token may have expired or lacks permissions');
      }
    } else {
      console.error(`Error fetching Instagram metrics:`, error.message);
    }
    return null;
  }
}

/**
 * Sync all Instagram metrics for a user's published posts
 */
async function syncAllInstagramMetrics(userId) {
  try {
    const Profile = require('../../models/profileModel');
    const profile = await Profile.findOne({ user: userId });

    if (!profile || !profile.social?.instagram?.accessToken) {
      console.log(`No Instagram connection for user ${userId}`);
      return { success: false, message: 'Instagram not connected' };
    }

    const accessToken = profile.social.instagram.accessToken;

    // Find all published posts with Instagram platform
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'lifecycle.publish.platforms': 'instagram',
    });

    console.log(`Found ${posts.length} Instagram posts for user ${userId}`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      // Try to find Instagram media ID from the post content
      // This assumes the Instagram media ID was stored when the post was published
      const igMediaId =
        post.metrics?.instagram?.postId ||
        post.content?.platforms?.instagram?.mediaId ||
        post.content?.instagram?.mediaId;

      if (!igMediaId) {
        console.log(`No Instagram media ID found for post ${post._id}`);
        errorCount++;
        continue;
      }

      const metricsData = await fetchInstagramMetrics(post._id, accessToken, igMediaId);

      if (metricsData) {
        // Update post with metrics
        post.metrics = post.metrics || {};
        post.metrics.instagram = metricsData;
        post.metrics.lastSyncedAt = new Date();
        await post.save();
        successCount++;
        console.log(`Updated Instagram metrics for post ${post._id}`);
      } else {
        errorCount++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: true,
      synced: successCount,
      errors: errorCount,
      total: posts.length,
    };
  } catch (error) {
    console.error('Error syncing Instagram metrics:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  fetchInstagramMetrics,
  syncAllInstagramMetrics,
};
