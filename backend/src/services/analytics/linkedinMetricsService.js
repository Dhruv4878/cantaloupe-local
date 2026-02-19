const axios = require('axios');
const Post = require('../../models/postModel');

/**
 * Fetch LinkedIn Share Statistics
 * Uses LinkedIn Share Statistics API
 * https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api
 */
async function fetchLinkedInMetrics(postId, accessToken, shareUrn) {
  try {
    if (!shareUrn) {
      console.log(`No LinkedIn share URN for post ${postId}`);
      return null;
    }

    // LinkedIn uses URN format: urn:li:share:{id}
    // Encode the URN for the API call
    const encodedShareUrn = encodeURIComponent(shareUrn);

    const url = `https://api.linkedin.com/v2/organizationalEntityShareStatistics`;

    const response = await axios.get(url, {
      params: {
        q: 'organizationalEntity',
        shares: `List(${encodedShareUrn})`,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    if (!response.data || !response.data.elements || response.data.elements.length === 0) {
      console.log(`No statistics data returned for LinkedIn share ${shareUrn}`);
      return null;
    }

    const stats = response.data.elements[0];
    const totalStats = stats.totalShareStatistics || {};

    const metricsData = {
      postId: shareUrn,
      impressions: totalStats.impressionCount || 0,
      clicks: totalStats.clickCount || 0,
      engagement: totalStats.engagement || 0,
      likes: totalStats.likeCount || 0,
      comments: totalStats.commentCount || 0,
      shares: totalStats.shareCount || 0,
      clickthroughRate: totalStats.clickCount && totalStats.impressionCount
        ? (totalStats.clickCount / totalStats.impressionCount) * 100
        : 0,
      fetchedAt: new Date(),
    };

    return metricsData;
  } catch (error) {
    if (error.response) {
      console.error(`LinkedIn API error for share ${shareUrn}:`, error.response.data);

      if (error.response.status === 400) {
        console.log('Invalid share URN or metrics not available');
      } else if (error.response.status === 401 || error.response.status === 403) {
        console.log('Access token may have expired or lacks required scopes');
      }
    } else {
      console.error(`Error fetching LinkedIn metrics:`, error.message);
    }
    return null;
  }
}

/**
 * Sync all LinkedIn metrics for a user's published posts
 */
async function syncAllLinkedInMetrics(userId) {
  try {
    const Profile = require('../../models/profileModel');
    const profile = await Profile.findOne({ user: userId });

    if (!profile || !profile.social?.linkedin?.accessToken) {
      console.log(`No LinkedIn connection for user ${userId}`);
      return { success: false, message: 'LinkedIn not connected' };
    }

    const accessToken = profile.social.linkedin.accessToken;

    // Find all published posts with LinkedIn platform
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'lifecycle.publish.platforms': 'linkedin',
    });

    console.log(`Found ${posts.length} LinkedIn posts for user ${userId}`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      const shareUrn =
        post.metrics?.linkedin?.postId ||
        post.content?.platforms?.linkedin?.shareUrn ||
        post.content?.linkedin?.shareUrn;

      if (!shareUrn) {
        console.log(`No LinkedIn share URN found for post ${post._id}`);
        errorCount++;
        continue;
      }

      const metricsData = await fetchLinkedInMetrics(post._id, accessToken, shareUrn);

      if (metricsData) {
        post.metrics = post.metrics || {};
        post.metrics.linkedin = metricsData;
        post.metrics.lastSyncedAt = new Date();
        await post.save();
        successCount++;
        console.log(`Updated LinkedIn metrics for post ${post._id}`);
      } else {
        errorCount++;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return {
      success: true,
      synced: successCount,
      errors: errorCount,
      total: posts.length,
    };
  } catch (error) {
    console.error('Error syncing LinkedIn metrics:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  fetchLinkedInMetrics,
  syncAllLinkedInMetrics,
};
