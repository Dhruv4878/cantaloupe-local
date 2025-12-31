// backend/src/services/socialPublisher.js

const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const FormData = require("form-data");
const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

const Post = require("../models/postModel");
const Profile = require("../models/profileModel");

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v19.0";
const LINKEDIN_UGC_POSTS_URL = "https://api.linkedin.com/v2/ugcPosts";

/* ======================================================
   Custom Error
====================================================== */
class SocialPublishError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "SocialPublishError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/* ======================================================
   Helpers
====================================================== */
const platformDbKey = (backendPlatform) => {
  if (!backendPlatform) return backendPlatform;
  if (backendPlatform === "twitter") return "x";
  return backendPlatform;
};

const buildMergedCaption = (post, backendPlatform) => {
  const content = post?.content || {};
  const dbKey = platformDbKey(backendPlatform);
  const platformData = content?.platforms?.[dbKey];

  if (!platformData) {
    throw new SocialPublishError(
      `No platform-specific content for '${backendPlatform}'`,
      400
    );
  }

  const caption =
    typeof platformData.caption === "string"
      ? platformData.caption.trim()
      : "";

  const hashtagsText = Array.isArray(platformData.hashtags)
    ? platformData.hashtags
        .map((h) =>
          h
            ? `#${String(h).replace(/^#+/, "").replace(/\s+/g, "")}`
            : null
        )
        .filter(Boolean)
        .join(" ")
    : "";

  const mergedCaption = `${caption} ${hashtagsText}`.trim();
  const imageUrl = platformData.imageUrl || content.imageUrl || null;

  return { mergedCaption, imageUrl };
};

const ensureProfileForPlatform = (profile, platform) => {
  if (!profile) throw new SocialPublishError("Profile not found", 404);
  const social = profile.social || {};

  if (platform === "facebook") {
    if (!social.facebook?.pageId || !social.facebook?.accessToken) {
      throw new SocialPublishError("Facebook not connected", 400);
    }
    return social.facebook;
  }

  if (platform === "instagram") {
    if (!social.instagram?.igBusinessId || !social.instagram?.accessToken) {
      throw new SocialPublishError("Instagram not connected", 400);
    }
    return social.instagram;
  }

  if (platform === "linkedin") {
    if (!social.linkedin?.memberId || !social.linkedin?.accessToken) {
      throw new SocialPublishError("LinkedIn not connected", 400);
    }
    return social.linkedin;
  }

  if (platform === "twitter") {
    if (!social.twitter?.refreshToken) {
      throw new SocialPublishError("Twitter not connected", 400);
    }
    return social.twitter;
  }

  throw new SocialPublishError("Unsupported platform", 400);
};

/* ======================================================
   🔥 LIFECYCLE HELPERS
====================================================== */
const markScheduleEntryPosted = async (postId, platform) => {
  const post = await Post.findById(postId);
  if (!post) return;

  // Try to find an entry in either top-level schedule or content.schedule
  let entry = post.schedule?.entries?.find((e) => e.platform === platform);
  let mode = 'direct';

  if (entry) {
    entry.status = "posted";
    entry.postedAt = new Date();
    mode = 'scheduled';
  } else if (post.content?.schedule?.entries) {
    entry = post.content.schedule.entries.find((e) => e.platform === platform);
    if (entry) {
      // Update the content.schedule entry copy (best-effort)
      entry.status = 'posted';
      entry.postedAt = new Date();
      mode = 'scheduled';
    }
  }

  await post.save();

  // If there was no schedule entry, treat this as a direct publish
  await Post.updateLifecycleOnPublish(post._id, platform, mode);
};

const markScheduleEntryFailed = async (postId, platform, error, mode = 'scheduled') => {
  const post = await Post.findById(postId);
  if (!post) return;

  // Update schedule entry if present
  const entry = post.schedule?.entries?.find((e) => e.platform === platform);

  if (entry) {
    entry.status = "failed";
    entry.error = error?.message || "Publish failed";
    entry.lastAttemptAt = new Date();
  }

  // Update lifecycle.schedule.failedPlatforms if schedule exists
  if (post.lifecycle?.schedule) {
    post.lifecycle.schedule.failedPlatforms = post.lifecycle.schedule.failedPlatforms || [];
    if (!post.lifecycle.schedule.failedPlatforms.includes(platform)) {
      post.lifecycle.schedule.failedPlatforms.push(platform);
    }
  }

  // Also update publish-level failure summary so UI can show publish failures
  await Post.updateLifecycleOnPublishFailure(post._id, platform, mode, error?.message || null);

  await post.save();
};

/* ======================================================
   Publish to Platform
====================================================== */
const publishToPlatform = async ({ post, profile, platform }) => {
  const normalized = platform;
  const { mergedCaption, imageUrl } = buildMergedCaption(
    post,
    normalized
  );
  const creds = ensureProfileForPlatform(profile, normalized);

  try {
    /* ---------------- FACEBOOK ---------------- */
    if (normalized === "facebook") {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.pageId}/photos`;
      const params = new URLSearchParams({
        url: imageUrl,
        caption: mergedCaption,
        access_token: creds.accessToken,
      });

      await axios.post(url, params);
      await markScheduleEntryPosted(post._id, "facebook");
      return { success: true, platform: "facebook" };
    }

    /* ---------------- INSTAGRAM ---------------- */
    if (normalized === "instagram") {
      const containerUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.igBusinessId}/media`;
      const containerResp = await axios.post(
        containerUrl,
        new URLSearchParams({
          image_url: imageUrl,
          caption: mergedCaption,
          access_token: creds.accessToken,
        })
      );

      const publishUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${creds.igBusinessId}/media_publish`;
      await axios.post(
        publishUrl,
        new URLSearchParams({
          creation_id: containerResp.data.id,
          access_token: creds.accessToken,
        })
      );

      await markScheduleEntryPosted(post._id, "instagram");
      return { success: true, platform: "instagram" };
    }

    /* ---------------- LINKEDIN ---------------- */
    if (normalized === "linkedin") {
      await axios.post(
        LINKEDIN_UGC_POSTS_URL,
        {
          author: `urn:li:person:${creds.memberId}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: mergedCaption },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      await markScheduleEntryPosted(post._id, "linkedin");
      return { success: true, platform: "linkedin" };
    }

    /* ---------------- TWITTER (X) ---------------- */
    if (normalized === "twitter") {
      const client = new TwitterApi({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
      });

      const {
        client: refreshedClient,
        accessToken,
        refreshToken,
      } = await client.refreshOAuth2Token(creds.refreshToken);

      profile.social.twitter.accessToken = accessToken;
      profile.social.twitter.refreshToken = refreshToken;
      await profile.save();

      await refreshedClient.v2.tweet({ text: mergedCaption });

      await markScheduleEntryPosted(post._id, "twitter");
      return { success: true, platform: "twitter" };
    }

    throw new SocialPublishError("Unsupported platform", 400);
  } catch (err) {
    // Determine whether this was for a scheduled entry or a direct publish
    const mode = post.schedule?.entries?.some((e) => e.platform === platform)
      ? 'scheduled'
      : 'direct';

    await markScheduleEntryFailed(post._id, platform, err, mode);
    throw err;
  }
};

/* ======================================================
   Public API
====================================================== */
const publishPostById = async ({ userId, postId, platform }) => {
  const post = await Post.findOne({ _id: postId, userId });
  if (!post) throw new SocialPublishError("Post not found", 404);

  const profile = await Profile.findOne({ user: userId });
  return publishToPlatform({ post, profile, platform });
};

module.exports = {
  publishPostById,
  publishToPlatform,
  SocialPublishError,
};
