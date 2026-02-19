const Post = require('../../models/postModel');

/**
 * Calculate average engagement rate across all published posts
 * Formula: (Total Engagements / Total Impressions) × 100
 */
async function calculateEngagementRate(userId) {
  try {
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'metrics': { $ne: null },
    });

    if (posts.length === 0) {
      return {
        engagementRate: 0,
        totalPosts: 0,
        totalEngagements: 0,
        totalImpressions: 0,
        message: 'No published posts with metrics found',
      };
    }

    let totalEngagements = 0;
    let totalImpressions = 0;
    let postsWithMetrics = 0;

    for (const post of posts) {
      const metrics = post.metrics;

      // Instagram
      if (metrics.instagram) {
        const ig = metrics.instagram;
        const igEngagements = (ig.likes || 0) + (ig.comments || 0) + (ig.shares || 0) + (ig.saves || 0);
        totalEngagements += igEngagements;
        totalImpressions += ig.impressions || 0;
        if (ig.impressions > 0) postsWithMetrics++;
      }

      // Facebook
      if (metrics.facebook) {
        const fb = metrics.facebook;
        const fbEngagements = (fb.reactions || 0) + (fb.comments || 0) + (fb.shares || 0);
        totalEngagements += fbEngagements;
        totalImpressions += fb.impressions || 0;
        if (fb.impressions > 0) postsWithMetrics++;
      }

      // LinkedIn
      if (metrics.linkedin) {
        const li = metrics.linkedin;
        const liEngagements = (li.likes || 0) + (li.comments || 0) + (li.shares || 0);
        totalEngagements += liEngagements;
        totalImpressions += li.impressions || 0;
        if (li.impressions > 0) postsWithMetrics++;
      }

      // Twitter
      if (metrics.twitter) {
        const tw = metrics.twitter;
        const twEngagements = (tw.likes || 0) + (tw.retweets || 0) + (tw.replies || 0);
        totalEngagements += twEngagements;
        totalImpressions += tw.impressions || 0;
        if (tw.impressions > 0) postsWithMetrics++;
      }
    }

    const engagementRate = totalImpressions > 0
      ? (totalEngagements / totalImpressions) * 100
      : 0;

    return {
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      totalPosts: postsWithMetrics,
      totalEngagements,
      totalImpressions,
    };
  } catch (error) {
    console.error('Error calculating engagement rate:', error);
    throw error;
  }
}

/**
 * Get monthly engagement trend for the last N months
 */
async function getMonthlyTrend(userId, months = 6) {
  try {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'lifecycle.publish.publishedAt': { $gte: monthsAgo },
      'metrics': { $ne: null },
    }).sort({ 'lifecycle.publish.publishedAt': 1 });

    if (posts.length === 0) {
      return [];
    }

    // Group posts by month
    const monthlyData = {};

    for (const post of posts) {
      const publishedAt = post.lifecycle.publish.publishedAt;
      if (!publishedAt) continue;

      const monthKey = `${publishedAt.getFullYear()}-${String(publishedAt.getMonth() + 1).padStart(2, '0')}`;
      const monthName = publishedAt.toLocaleDateString('en-US', { month: 'short' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          year: publishedAt.getFullYear(),
          engagements: 0,
          impressions: 0,
          posts: 0,
        };
      }

      const metrics = post.metrics;

      // Aggregate Instagram
      if (metrics.instagram) {
        const ig = metrics.instagram;
        monthlyData[monthKey].engagements += (ig.likes || 0) + (ig.comments || 0) + (ig.shares || 0) + (ig.saves || 0);
        monthlyData[monthKey].impressions += ig.impressions || 0;
        monthlyData[monthKey].posts++;
      }

      // Aggregate Facebook
      if (metrics.facebook) {
        const fb = metrics.facebook;
        monthlyData[monthKey].engagements += (fb.reactions || 0) + (fb.comments || 0) + (fb.shares || 0);
        monthlyData[monthKey].impressions += fb.impressions || 0;
        monthlyData[monthKey].posts++;
      }

      // Aggregate LinkedIn
      if (metrics.linkedin) {
        const li = metrics.linkedin;
        monthlyData[monthKey].engagements += (li.likes || 0) + (li.comments || 0) + (li.shares || 0);
        monthlyData[monthKey].impressions += li.impressions || 0;
        monthlyData[monthKey].posts++;
      }

      // Aggregate Twitter
      if (metrics.twitter) {
        const tw = metrics.twitter;
        monthlyData[monthKey].engagements += (tw.likes || 0) + (tw.retweets || 0) + (tw.replies || 0);
        monthlyData[monthKey].impressions += tw.impressions || 0;
        monthlyData[monthKey].posts++;
      }
    }

    // Convert to array and sort by date
    const trendData = Object.keys(monthlyData)
      .sort()
      .map(key => ({
        month: monthlyData[key].month,
        value: monthlyData[key].engagements, // Use engagements as the main metric
        impressions: monthlyData[key].impressions,
        posts: monthlyData[key].posts,
      }));

    return trendData;
  } catch (error) {
    console.error('Error getting monthly trend:', error);
    throw error;
  }
}

/**
 * Get the top performing platform by engagement rate
 */
async function getTopPlatform(userId) {
  try {
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'metrics': { $ne: null },
    });

    if (posts.length === 0) {
      return null;
    }

    const platformStats = {
      instagram: { engagements: 0, impressions: 0, posts: 0 },
      facebook: { engagements: 0, impressions: 0, posts: 0 },
      linkedin: { engagements: 0, impressions: 0, posts: 0 },
      twitter: { engagements: 0, impressions: 0, posts: 0 },
    };

    for (const post of posts) {
      const metrics = post.metrics;

      if (metrics.instagram) {
        const ig = metrics.instagram;
        platformStats.instagram.engagements += (ig.likes || 0) + (ig.comments || 0) + (ig.shares || 0) + (ig.saves || 0);
        platformStats.instagram.impressions += ig.impressions || 0;
        platformStats.instagram.posts++;
      }

      if (metrics.facebook) {
        const fb = metrics.facebook;
        platformStats.facebook.engagements += (fb.reactions || 0) + (fb.comments || 0) + (fb.shares || 0);
        platformStats.facebook.impressions += fb.impressions || 0;
        platformStats.facebook.posts++;
      }

      if (metrics.linkedin) {
        const li = metrics.linkedin;
        platformStats.linkedin.engagements += (li.likes || 0) + (li.comments || 0) + (li.shares || 0);
        platformStats.linkedin.impressions += li.impressions || 0;
        platformStats.linkedin.posts++;
      }

      if (metrics.twitter) {
        const tw = metrics.twitter;
        platformStats.twitter.engagements += (tw.likes || 0) + (tw.retweets || 0) + (tw.replies || 0);
        platformStats.twitter.impressions += tw.impressions || 0;
        platformStats.twitter.posts++;
      }
    }

    // Calculate engagement rate for each platform
    let topPlatform = null;
    let highestRate = 0;

    for (const [platform, stats] of Object.entries(platformStats)) {
      if (stats.posts > 0 && stats.impressions > 0) {
        const rate = (stats.engagements / stats.impressions) * 100;
        if (rate > highestRate) {
          highestRate = rate;
          topPlatform = {
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            engagementRate: parseFloat(rate.toFixed(2)),
            totalEngagements: stats.engagements,
            totalImpressions: stats.impressions,
            totalPosts: stats.posts,
          };
        }
      }
    }

    return topPlatform;
  } catch (error) {
    console.error('Error getting top platform:', error);
    throw error;
  }
}

/**
 * Get the top engaging post
 */
async function getTopPost(userId) {
  try {
    const posts = await Post.find({
      userId,
      'lifecycle.publish.isPublished': true,
      'metrics': { $ne: null },
    }).limit(100); // Limit to recent 100 posts for performance

    if (posts.length === 0) {
      return null;
    }

    let topPost = null;
    let highestEngagement = 0;

    for (const post of posts) {
      const metrics = post.metrics;
      let totalEngagement = 0;
      let totalImpressions = 0;
      let platform = null;
      let platformMetrics = {};

      // Calculate engagement for each platform
      const platforms = [];

      if (metrics.instagram) {
        const ig = metrics.instagram;
        const igEng = (ig.likes || 0) + (ig.comments || 0) + (ig.shares || 0) + (ig.saves || 0);
        if (igEng > totalEngagement) {
          totalEngagement = igEng;
          totalImpressions = ig.impressions || 0;
          platform = 'Instagram';
          platformMetrics = {
            likes: ig.likes || 0,
            comments: ig.comments || 0,
            shares: ig.shares || 0,
            saves: ig.saves || 0,
            impressions: ig.impressions || 0,
          };
        }
        platforms.push('Instagram');
      }

      if (metrics.facebook) {
        const fb = metrics.facebook;
        const fbEng = (fb.reactions || 0) + (fb.comments || 0) + (fb.shares || 0);
        if (fbEng > totalEngagement) {
          totalEngagement = fbEng;
          totalImpressions = fb.impressions || 0;
          platform = 'Facebook';
          platformMetrics = {
            reactions: fb.reactions || 0,
            comments: fb.comments || 0,
            shares: fb.shares || 0,
            impressions: fb.impressions || 0,
          };
        }
        platforms.push('Facebook');
      }

      if (metrics.linkedin) {
        const li = metrics.linkedin;
        const liEng = (li.likes || 0) + (li.comments || 0) + (li.shares || 0);
        if (liEng > totalEngagement) {
          totalEngagement = liEng;
          totalImpressions = li.impressions || 0;
          platform = 'LinkedIn';
          platformMetrics = {
            likes: li.likes || 0,
            comments: li.comments || 0,
            shares: li.shares || 0,
            impressions: li.impressions || 0,
          };
        }
        platforms.push('LinkedIn');
      }

      if (metrics.twitter) {
        const tw = metrics.twitter;
        const twEng = (tw.likes || 0) + (tw.retweets || 0) + (tw.replies || 0);
        if (twEng > totalEngagement) {
          totalEngagement = twEng;
          totalImpressions = tw.impressions || 0;
          platform = 'Twitter';
          platformMetrics = {
            likes: tw.likes || 0,
            retweets: tw.retweets || 0,
            replies: tw.replies || 0,
            impressions: tw.impressions || 0,
          };
        }
        platforms.push('Twitter');
      }

      if (totalEngagement > highestEngagement) {
        highestEngagement = totalEngagement;

        // Extract content preview
        const content = post.content;
        let contentPreview = '';

        if (content.platforms) {
          const platformsObj = content.platforms;
          const captionKeys = ['instagram', 'facebook', 'linkedin', 'x', 'twitter'];

          for (const key of captionKeys) {
            if (platformsObj[key]?.caption) {
              contentPreview = platformsObj[key].caption;
              break;
            }
          }
        }

        if (!contentPreview) {
          contentPreview = content.postContent || content.title || content.caption || 'Post content';
        }

        topPost = {
          postId: post._id,
          platform,
          platforms,
          content: contentPreview.slice(0, 150) + (contentPreview.length > 150 ? '...' : ''),
          totalEngagements: totalEngagement,
          totalImpressions,
          engagementRate: totalImpressions > 0 ? parseFloat(((totalEngagement / totalImpressions) * 100).toFixed(2)) : 0,
          metrics: platformMetrics,
          publishedAt: post.lifecycle.publish.publishedAt,
        };
      }
    }

    return topPost;
  } catch (error) {
    console.error('Error getting top post:', error);
    throw error;
  }
}

/**
 * Generate AI insights based on analytics data
 */
async function generateInsights(userId) {
  try {
    const [engagementData, topPlatformData, monthlyTrend] = await Promise.all([
      calculateEngagementRate(userId),
      getTopPlatform(userId),
      getMonthlyTrend(userId, 2),
    ]);

    const insights = [];

    // Insight about engagement rate
    if (engagementData.totalPosts > 0) {
      insights.push(`Your average engagement rate is ${engagementData.engagementRate}% across ${engagementData.totalPosts} posts.`);
    }

    // Insight about top platform
    if (topPlatformData) {
      insights.push(`${topPlatformData.platform} is your top-performing platform with a ${topPlatformData.engagementRate}% engagement rate.`);
    }

    // Insight about monthly trend
    if (monthlyTrend.length >= 2) {
      const lastMonth = monthlyTrend[monthlyTrend.length - 1];
      const previousMonth = monthlyTrend[monthlyTrend.length - 2];

      if (lastMonth.value > previousMonth.value) {
        const increase = ((lastMonth.value - previousMonth.value) / previousMonth.value) * 100;
        insights.push(`Your engagement increased by ${increase.toFixed(1)}% from last month. Keep up the great work!`);
      } else if (lastMonth.value < previousMonth.value) {
        insights.push(`Engagement dipped slightly this month. Consider posting during peak hours or trying new content formats.`);
      }
    }

    // Default insight if no data
    if (insights.length === 0) {
      insights.push('Start publishing posts to see engagement insights and analytics across your social media platforms.');
    }

    return insights.join(' ');
  } catch (error) {
    console.error('Error generating insights:', error);
    return 'Unable to generate insights at this time.';
  }
}

module.exports = {
  calculateEngagementRate,
  getMonthlyTrend,
  getTopPlatform,
  getTopPost,
  generateInsights,
};
