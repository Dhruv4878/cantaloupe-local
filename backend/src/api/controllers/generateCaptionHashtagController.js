const Post = require('../../models/postModel');
const {
  COST_TRACKING,
  generateWithGemini,
  uploadImageToCloudinary
} = require('./aiContentHelpers');

/**
 * Generate captions and hashtags for user-provided image
 * User uploads their own image and gets AI-generated content
 */
const generateCaptionHashtag = async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      imageUrl, // base64 image from user
      contentBrief,
      platforms = ['instagram', 'facebook', 'linkedin', 'x']
    } = req.body;

    // Validation
    if (!imageUrl || !contentBrief) {
      return res.status(400).json({
        success: false,
        message: 'Image and content brief are required.'
      });
    }

    // Validate imageUrl is base64
    if (!imageUrl.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Image must be a valid base64 data URI.'
      });
    }

    const userId = req.user?.id;
    const usedCredits = req.usedCredits; // Set by checkPostLimits middleware

    console.log(`📝 Caption & Hashtag generation for ${platforms.length} platforms`);

    // Step 1: Upload user's image to Cloudinary (permanent storage)
    console.log('📤 Uploading user image to Cloudinary...');
    const uploadedImageUrl = await uploadImageToCloudinary(imageUrl);
    operations.push({ type: "upload", model: "cloudinary_upload" });

    // Determine model based on user plan
    const userPlan = req.userPlan || { name: 'Free' };
    const isFreePlan = userPlan.name === 'Free';

    // Use gemini-2.5-flash for free users
    const textModel = isFreePlan ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    console.log(`🤖 Using model for ${userPlan.name} plan: Text=${textModel}`);

    // Step 2: Generate platform-specific captions and hashtags
    const platformContent = {};

    for (const platform of platforms) {
      try {
        console.log(`🤖 Generating content for ${platform}...`);

        const captionPrompt = `Generate ${platform} caption and hashtags.

Content Brief: ${contentBrief}

Platform: ${platform}

Generate engaging, platform-appropriate content in JSON format:
{
  "caption": "Engaging caption for ${platform}",
  "hashtags": ["relevant", "trending", "hashtags"]
}`;

        console.log(`📝 Prompt for ${platform}:`, captionPrompt.substring(0, 100) + '...');

        const result = await generateWithGemini(captionPrompt, textModel);

        console.log(`✅ Result for ${platform}:`, JSON.stringify(result).substring(0, 200));

        // Validate result structure
        if (result && result.caption && Array.isArray(result.hashtags)) {
          platformContent[platform] = {
            caption: result.caption,
            hashtags: result.hashtags
          };
          console.log(`✅ Successfully generated content for ${platform}`);
        } else {
          console.warn(`⚠️ Invalid result structure for ${platform}, using fallback`);
          platformContent[platform] = {
            caption: `${contentBrief}\n\nCheck out our latest! 🎉`,
            hashtags: [`#${platform}`, '#content']
          };
        }

        operations.push({
          type: "text_generation",
          model: textModel,
          inputTokens: 200,
          outputTokens: 150
        });
      } catch (error) {
        console.error(`❌ Error generating content for ${platform}:`, error);
        platformContent[platform] = {
          caption: `${contentBrief}\n\nShare your thoughts! 💬`,
          hashtags: [`#${platform}`, '#socialmedia']
        };
      }
    }

    // Calculate costs and timing
    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Caption & hashtags generated in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    // Step 3: Save post to database
    const postContent = {
      imageUrl: uploadedImageUrl, // User's uploaded image (Cloudinary URL)
      platforms: platformContent,
      contentBrief: contentBrief,
      metadata: {
        processingTime,
        totalCost,
        models: {
          text: textModel
        },
        plan: userPlan.name,
        source: 'caption-hashtag-generator'
      }
    };

    const post = new Post({
      userId,
      content: postContent,
      usedCredits
    });
    await post.save();

    console.log(`✅ Post saved with ID: ${post._id}, usedCredits: ${usedCredits}, Plan: ${userPlan.name}, Cost: $${totalCost.toFixed(4)}`);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        imageUrl: uploadedImageUrl,
        platforms: platformContent,
        metadata: {
          processingTime,
          totalCost,
          models: {
            text: textModel
          },
          plan: userPlan.name,
          source: 'caption-hashtag-generator'
        }
      }
    });

  } catch (error) {
    console.error('❌ Caption & hashtag generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate captions and hashtags.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  generateCaptionHashtag
};
