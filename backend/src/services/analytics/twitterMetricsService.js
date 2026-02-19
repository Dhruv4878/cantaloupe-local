const axios = require('axios');
const Post = require('../../models/postModel');

/**
 * Fetch Twitter/X Tweet Metrics
 * Uses Twitter API v2: https://developer.twitter.com/en/docs/twitter-api/metrics
 * Note: Requires elevated or premium access for full metrics
 */
async function fetchTwitterMetrics(postId, accessToken, tweetId) {
  try {
    if (!tweetId) {
      console.log(`No Twitter tweet ID for post ${postId}`);
      return null;
    }

    const url = `https://api.twitter.com/2/tweets/${tweetId}`;

    // Request both public and non-public metrics (non-public requires elevated access)
    const tweetFields = [
      'public_metrics',
      'non_public_metrics', // impressions, url clicks, profile clicks (requires elevated access)
      'organic_metrics', // organic impressions and engagement (requires elevated access)
    ].join(',');

    const response = await axios.get(url, {
      params: {
        'tweet.fields': tweetFields,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.data || !response.data.data) {
      console.log(`No tweet data returned for ${tweetId}`);
      return null;
    }

    const tweetData = response.data.data;
    const publicMetrics = tweetData.public_metrics || {};
    const nonPublicMetrics = tweetData.non_public_metrics || {};
    const organicMetrics = tweetData.organic_metrics || {};

    const metricsData = {
      postId: tweetId,
      // Public metrics (always available)
      likes: publicMetrics.like_count || 0,
      retweets: publicMetrics.retweet_count || 0,
      replies: publicMetrics.reply_count || 0,
      quoteTweets: publicMetrics.quote_count || 0,
      // Non-public metrics (requires elevated access)
      impressions: nonPublicMetrics.impression_count || organicMetrics.impression_count || 0,
      profileClicks: nonPublicMetrics.user_profile_clicks || 0,
      urlClicks: nonPublicMetrics.url_link_clicks || 0,
      videoViews: publicMetrics.video_view_count || 0,
      // Calculate total engagements
      engagements: (publicMetrics.like_count || 0) +
        (publicMetrics.retweet_count || 0) +
        (publicMetrics.reply_count || 0) +
        (publicMetrics.quote_count || 0),
      fetchedAt: new Date(),
    };

    return metricsData;
  } catch (error) {
    if (error.response) {
      console.error(`Twitter API error for tweet ${tweetId}:`, error.response.data);

      if (error.response.status === 400) {
        console.log('Tweet may have been deleted or is not accessible');
      } else if (error.response.status === 401 || error.response.status === 403) {
        console.log('Access token may have expired or lacks required scopes');
        console.log('Note: non_public_metrics requires elevated API access');
      } else if (error.response.status === 429) {
        console.log('Rate limit exceeded - please try again later');
      }
    } else {
      console.error(`Error fetching Twitter metrics:`, error.message);
    }
    return null;
  }
}

/**
 * Sync all Twitter metrics for a user's published posts
 */
async function syncAllTwitterMetrics(userId) {
  try {
    const Profile = require('../../models/profileModel');
    const profile = await Profile.findOne({ user: userId });

    if (!profile || !profile.social?.twitter?.accessToken) {
      console.log(`No Twitter connection for user ${userId}`);
      return { success: false, message: 'Twitter not connected' };
    }

    const accessToken = profile.social.twitter.accessToken;

    // Find all published posts with Twitter platform
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      $or: [
        { 'lifecycle.publish.platforms': 'twitter' },
        { 'lifecycle.publish.platforms': 'x' },
      ],
    });

    console.log(`Found ${posts.length} Twitter posts for user ${userId}`);

    let successCount = 0;
    let errorCount = 0;

    for (const post of posts) {
      const tweetId =
        post.metrics?.twitter?.postId ||
        post.content?.platforms?.twitter?.tweetId ||
        post.content?.platforms?.x?.tweetId ||
        post.content?.twitter?.tweetId ||
        post.content?.x?.tweetId;

      if (!tweetId) {
        console.log(`No Twitter tweet ID found for post ${post._id}`);
        errorCount++;
        continue;
      }

      const metricsData = await fetchTwitterMetrics(post._id, accessToken, tweetId);

      if (metricsData) {
        post.metrics = post.metrics || {};
        post.metrics.twitter = metricsData;
        post.metrics.lastSyncedAt = new Date();
        await post.save();
        successCount++;
        console.log(`Updated Twitter metrics for post ${post._id}`);
      } else {
        errorCount++;
      }

      // Add delay to avoid rate limiting (Twitter has strict rate limits)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return {
      success: true,
      synced: successCount,
      errors: errorCount,
      total: posts.length,
    };
  } catch (error) {
    console.error('Error syncing Twitter metrics:', error);
    return { success: false, message: error.message };
  }
}

module.exports = {
  fetchTwitterMetrics,
  syncAllTwitterMetrics,
};
