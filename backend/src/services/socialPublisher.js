// backend/src/services/socialPublisher.js

// ---------------------------------------------------------
// 1. UPDATED IMPORTS (Added twitter-api-v2)
// ---------------------------------------------------------
const { TwitterApi } = require('twitter-api-v2'); // <--- NEW LIBRARY
const axios = require('axios');
const FormData = require('form-data');
const OAuth = require('oauth-1.0a'); // Kept for legacy or other uses if needed
const crypto = require('crypto');
const Post = require('../models/postModel');
const Profile = require('../models/profileModel');

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';
const LINKEDIN_UGC_POSTS_URL = 'https://api.linkedin.com/v2/ugcPosts';

// Custom error for clearer responses
class SocialPublishError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'SocialPublishError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// DB key mapping: backend platform -> platforms key in DB
const platformDbKey = (backendPlatform) => {
  if (!backendPlatform) return backendPlatform;
  if (backendPlatform === 'twitter') return 'x';
  return backendPlatform;
};

/**
 * Strict caption builder:
 * - reads ONLY from content.platforms[dbKey].caption and hashtags
 * - never falls back to content.postContent
 * - returns { mergedCaption, imageUrl }
 */
const buildMergedCaption = (post, backendPlatform) => {
  const content = post?.content || {};
  const dbKey = platformDbKey(backendPlatform);

  // platform-specific object
  const platformData = content?.platforms?.[dbKey];

  // Logging for debugging
  console.log('[socialPublisher] buildMergedCaption - backendPlatform:', backendPlatform, 'dbKey:', dbKey);
  // console.log('[socialPublisher] platformData:', JSON.stringify(platformData || null));

  if (!platformData) {
    throw new SocialPublishError(
      `No platform-specific content found for platform '${backendPlatform}' (expected content.platforms.${dbKey})`,
      400
    );
  }

  // use strict platform caption & hashtags only
  const caption = typeof platformData.caption === 'string' ? platformData.caption.trim() : '';

  const hashtagsArray = Array.isArray(platformData.hashtags) ? platformData.hashtags : [];

  const hashtagsText = hashtagsArray
    .map((h) => {
      if (!h) return null;
      const cleaned = String(h).trim().replace(/\s+/g, '');
      if (!cleaned) return null;
      return cleaned.startsWith('#') ? cleaned : `#${cleaned.replace(/^#+/, '')}`;
    })
    .filter(Boolean)
    .join(' ');

  const mergedCaption = `${caption} ${hashtagsText}`.trim();

  // prefer platform-specific imageUrl, else generic imageUrl if present
  const imageUrl = platformData.imageUrl || content.imageUrl || null;

  return { mergedCaption, imageUrl };
};

// Check profile social connections
const ensureProfileForPlatform = (profile, platform) => {
  if (!profile) throw new SocialPublishError('Profile not found', 404);
  const social = profile.social || {};

  if (platform === 'facebook') {
    const pageId = social.facebook?.pageId;
    const accessToken = social.facebook?.accessToken;
    if (!pageId || !accessToken) throw new SocialPublishError('Facebook not connected', 400);
    return { pageId, accessToken };
  }

  if (platform === 'instagram') {
    const igBusinessId = social.instagram?.igBusinessId;
    const accessToken = social.instagram?.accessToken;
    if (!igBusinessId || !accessToken) throw new SocialPublishError('Instagram not connected', 400);
    return { igBusinessId, accessToken };
  }

  if (platform === 'linkedin') {
    const memberId = social.linkedin?.memberId;
    const accessToken = social.linkedin?.accessToken;
    if (!memberId || !accessToken) throw new SocialPublishError('LinkedIn not connected', 400);
    return { memberId, accessToken };
  }

  // ---------------------------------------------------------
  // 2. UPDATED TWITTER CHECK (OAuth 2.0)
  // ---------------------------------------------------------
  if (platform === 'twitter') {
    // We strictly look for the REFRESH TOKEN now
    const refreshToken = social.twitter?.refreshToken;

    if (!refreshToken) {
      throw new SocialPublishError(
        'Twitter not connected via OAuth 2.0 (Missing refresh token). Please reconnect X.',
        400
      );
    }
    // Return only what we need for the new flow
    return { refreshToken };
  }

  throw new SocialPublishError('Unsupported platform', 400);
};

// Post to external platform
const publishToPlatform = async ({ post, profile, platform }) => {
  if (!post || !platform) throw new SocialPublishError('post and platform required', 400);

  // platform should be 'twitter' | 'facebook' | 'instagram' | 'linkedin'
  const normalized = platform;
  // Build caption strictly from platform-specific content
  const { mergedCaption, imageUrl } = buildMergedCaption(post, normalized);

  // If platform demands caption, enforce it
  if ((normalized === 'twitter' || normalized === 'linkedin') && !mergedCaption) {
    throw new SocialPublishError(`${normalized} requires a platform-specific caption`, 400);
  }

  const creds = ensureProfileForPlatform(profile, normalized);

  // ---- Facebook (page photo upload) ----
  if (normalized === 'facebook') {
    const fbUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.pageId}/photos`;
    const fbParams = new URLSearchParams();
    if (imageUrl) fbParams.append('url', imageUrl);
    if (mergedCaption) fbParams.append('caption', mergedCaption);
    fbParams.append('access_token', creds.accessToken);

    const fbResp = await axios.post(fbUrl, fbParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { success: true, platform: 'facebook', response: fbResp.data };
  }

  // ---- Instagram (FB graph flow) ----
  if (normalized === 'instagram') {
    const containerUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.igBusinessId}/media`;
    const containerParams = new URLSearchParams();
    if (imageUrl) containerParams.append('image_url', imageUrl);
    if (mergedCaption) containerParams.append('caption', mergedCaption);
    containerParams.append('access_token', creds.accessToken);

    const containerResp = await axios.post(containerUrl, containerParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const containerId = containerResp.data?.id;
    if (!containerId) throw new SocialPublishError('Failed creating Instagram container', 500, containerResp.data);

    const publishUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.igBusinessId}/media_publish`;
    const publishParams = new URLSearchParams();
    publishParams.append('creation_id', containerId);
    publishParams.append('access_token', creds.accessToken);
    const publishResp = await axios.post(publishUrl, publishParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return { success: true, platform: 'instagram', response: publishResp.data };
  }

  // ---- LinkedIn ----
  if (normalized === 'linkedin') {
    let shareMediaCategory = 'NONE';
    let mediaArray;
    if (imageUrl) {
      try {
        const registerBody = {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:person:${creds.memberId}`,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
          },
        };
        const registerResp = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', registerBody, {
          headers: { Authorization: `Bearer ${creds.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
        });
        const uploadMechanism = registerResp.data?.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
        const uploadUrl = uploadMechanism?.uploadUrl;
        const assetUrn = registerResp.data?.value?.asset;
        if (uploadUrl && assetUrn) {
          const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          const contentType = imgResp.headers['content-type'] || 'image/jpeg';
          await axios.put(uploadUrl, imgResp.data, { headers: { 'Content-Type': contentType }, maxBodyLength: Infinity, maxContentLength: Infinity });
          shareMediaCategory = 'IMAGE';
          mediaArray = [{ status: 'READY', media: assetUrn }];
        }
      } catch (err) {
        console.error('LinkedIn image upload failed; continuing text-only post:', err?.response?.data || err.message);
      }
    }

    const ugcPost = {
      author: `urn:li:person:${creds.memberId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: mergedCaption },
          shareMediaCategory,
          ...(mediaArray ? { media: mediaArray } : {}),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    const linkedinResp = await axios.post(LINKEDIN_UGC_POSTS_URL, ugcPost, {
      headers: { Authorization: `Bearer ${creds.accessToken}`, 'X-Restli-Protocol-Version': '2.0.0', 'Content-Type': 'application/json' },
    });
    return { success: true, platform: 'linkedin', response: linkedinResp.data };
  }

  // ---------------------------------------------------------
  // 3. UPDATED TWITTER (X) LOGIC - OAUTH 2.0 + REFRESH
  // ---------------------------------------------------------
  if (normalized === 'twitter') {
    console.log('[socialPublisher] Starting Twitter OAuth 2.0 publish flow');

    // Setup the Client with Client ID (Not Consumer Key)
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    try {
      // A. REFRESH THE TOKEN
      // We use the refresh token from DB to get a new Access Token
      const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = 
        await client.refreshOAuth2Token(creds.refreshToken);

      // B. UPDATE DB WITH NEW TOKEN (CRITICAL)
      // This ensures the next post works. We update the 'profile' object directly.
      if (profile && profile.social && profile.social.twitter) {
        profile.social.twitter.accessToken = accessToken;
        profile.social.twitter.refreshToken = newRefreshToken;
        await profile.save(); 
        console.log('[socialPublisher] Twitter tokens refreshed and saved.');
      }

      // C. MEDIA UPLOAD (Optional, try/catch block)
      // let mediaId = null;
      // if (imageUrl) {
      //   try {
      //     const imgResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      //     const buffer = Buffer.from(imgResp.data);
      //     const contentType = imgResp.headers['content-type'] || 'image/jpeg';
          
      //     // Use the refreshed client to upload media (v1.1 wrapped)
      //     mediaId = await refreshedClient.v1.uploadMedia(buffer, { mimeType: contentType });
      //     console.log('[socialPublisher] Media uploaded, ID:', mediaId);
      //   } catch (mediaError) {
      //     console.error('[socialPublisher] Media upload warning:', mediaError.message);
      //     // We continue to post text-only if media fails
      //   }
      // }

      // D. POST THE TWEET (v2 Endpoint)
      const tweetPayload = { text: mergedCaption };
      // if (mediaId) {
      //   tweetPayload.media = { media_ids: [mediaId] };
      // }

      const tweetResponse = await refreshedClient.v2.tweet(tweetPayload);
      
      return { success: true, platform: 'twitter', response: tweetResponse.data };

    } catch (err) {
      // Detailed error logging
      console.error('[socialPublisher] Twitter OAuth 2.0 Error:', err);
      const details = err.data || err.message;
      throw new SocialPublishError('Twitter publish failed', 500, details);
    }
  }

  throw new SocialPublishError('Unsupported platform', 400);
};

const publishPostById = async ({ userId, postId, platform }) => {
  if (!userId || !postId || !platform) {
    throw new SocialPublishError('userId, postId and platform required', 400);
  }

  const post = await Post.findOne({ _id: postId, userId });
  if (!post) throw new SocialPublishError('Post not found', 404);

  const profile = await Profile.findOne({ user: userId });
  const result = await publishToPlatform({ post, profile, platform });
  return result;
};

module.exports = { publishPostById, publishToPlatform, SocialPublishError };