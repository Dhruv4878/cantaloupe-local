const Post = require('../../models/postModel');
const {
  COST_TRACKING,
  generateWithGemini,
  uploadImageToCloudinary,
  callImageAI,
  downloadImageAsBase64,
  generateContentAnalytics,
  genAI
} = require('./aiContentHelpers');

/**
 * Generate social media content from template
 * Customizes existing template based on user requirements
 */
const generateFromTemplate = async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      template,
      customizationPrompt,
      contentBrief = '',
      aspectRatio = '1:1',
      platforms = ['instagram', 'facebook', 'linkedin', 'x']
    } = req.body;

    // Validation
    if (!template || !customizationPrompt) {
      return res.status(400).json({
        success: false,
        message: 'Template and customization prompt are required.'
      });
    }

    if (!template.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Template must have an imageUrl.'
      });
    }

    // Validate template.imageUrl format
    const isBase64 = template.imageUrl.startsWith('data:image/');
    const isUrl = template.imageUrl.startsWith('http://') || template.imageUrl.startsWith('https://');

    if (!isBase64 && !isUrl) {
      return res.status(400).json({
        success: false,
        message: 'Template imageUrl must be either a valid URL or base64 data URI.'
      });
    }

    const userId = req.user?.id;
    const usedCredits = req.usedCredits; // Set by checkPostLimits middleware

    console.log(`🎨 Template customization: ${template.name} (${aspectRatio}) - Type: ${isBase64 ? 'Base64 Upload' : 'URL Template'}`);

    // Step 1: Get template image as base64
    let templateImageBase64, mimeType;

    if (isBase64) {
      // Extract base64 and mime type from data URI
      const matches = template.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        templateImageBase64 = matches[2];
        console.log('📤 Using uploaded template (base64)');
      } else {
        throw new Error('Invalid base64 image format');
      }
    } else {
      // Download from URL
      const result = await downloadImageAsBase64(template.imageUrl);
      templateImageBase64 = result.base64;
      mimeType = result.mimeType;
      console.log('📥 Downloaded template from URL');
    }

    // Determine model based on user plan
    const userPlan = req.userPlan || { name: 'Free' };
    const isFreePlan = userPlan.name === 'Free';

    // Use gemini-2.5-flash for free users, implementation specific to user request
    const imageModel = isFreePlan ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
    const textModel = isFreePlan ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    console.log(`🤖 Using models for ${userPlan.name} plan: Image=${imageModel}, Text=${textModel}`);

    // Step 2: Generate customized image with AI
    // Using a single model to analyze template and apply customizations
    const customizationInstructions = `You are given a template image. Your task is to create a customized version of this template based on the user's requirements.

Template Information:
- Name: ${template.name}
- Category: ${template.category}
- Target Aspect Ratio: ${aspectRatio}

User's Customization Request:
${customizationPrompt}

Instructions:
1. Analyze the template image carefully to understand its layout, design elements, colors, and structure
2. Preserve the exact layout and visual structure of the template
3. Apply ONLY the modifications mentioned in the user's customization request
4. Maintain professional quality and ensure all text is clear and readable
5. Keep the same aspect ratio as specified
6. Match the design style and aesthetic of the original template

Generate the customized template image now.`;

    const modifiedImageDataUri = await callImageAI(
      customizationInstructions,
      aspectRatio,
      "", // no negative prompt
      { base64: templateImageBase64, mimeType }, // pass template image for customization
      imageModel
    );
    const modifiedImageUrl = await uploadImageToCloudinary(modifiedImageDataUri);

    operations.push({ type: "image_generation", model: imageModel });

    // Step 4: Generate platform-specific content
    const platformContent = {};

    for (const platform of platforms) {
      try {
        const captionPrompt = `Generate ${platform} caption and hashtags.

Template: ${template.name}
Modifications: ${customizationPrompt}
Content Brief: ${contentBrief || customizationPrompt}

JSON format:
{
  "caption": "Engaging caption",
  "hashtags": ["relevant", "tags"]
}`;

        const captionResult = await generateWithGemini(captionPrompt, textModel);

        platformContent[platform] = {
          caption: captionResult.caption || `${contentBrief || customizationPrompt}\n\nCheck out our latest! 🎉`,
          hashtags: captionResult.hashtags || [`#${platform}`, '#design']
        };

        operations.push({
          type: "text_generation",
          model: textModel,
          inputTokens: 300,
          outputTokens: 200
        });
      } catch (error) {
        console.error(`❌ Error generating content for ${platform}:`, error);
        platformContent[platform] = {
          caption: `${contentBrief || customizationPrompt}\n\nCustomized template! 🎨`,
          hashtags: [`#${platform}`, '#template']
        };
      }
    }

    // Calculate costs and timing
    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Template customized in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    // Step 4.5: Generate Analytics
    let analyticsData = {};
    try {
      console.log('📊 Generating Content Analytics...');
      analyticsData = await generateContentAnalytics(
        customizationPrompt,
        `Customized Template: ${template.name}, Brief: ${contentBrief || customizationPrompt}`,
        textModel
      );
      operations.push({
        type: "text_generation",
        model: textModel,
        inputTokens: 300,
        outputTokens: 100
      });
    } catch (analyticsError) {
      console.error('⚠️ Failed to generate analytics:', analyticsError.message);
    }

    // Step 5: Save post to database
    const postContent = {
      imageUrl: modifiedImageUrl,
      platforms: platformContent,
      template: {
        id: template._id || 'custom-upload',
        name: template.name,
        category: template.category,
        originalImageUrl: template.isCustomUpload ? 'custom-upload' : template.imageUrl,
        customizationPrompt,
        contentBrief,
        aspectRatio,
        isCustomUpload: template.isCustomUpload || false
      },
      analytics: analyticsData, // Added analytics field
      metadata: {
        processingTime,
        totalCost,
        models: {
          image: imageModel,
          text: textModel
        },
        plan: userPlan.name,
        source: 'template-customization'
      }
    };

    const post = new Post({
      userId,
      content: postContent,
      usedCredits
    });
    await post.save();

    console.log(`✅ Template post saved with ID: ${post._id}, usedCredits: ${usedCredits}, Plan: ${userPlan.name}, Cost: $${totalCost.toFixed(4)}`);

    // Return response
    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        imageUrl: modifiedImageUrl,
        platforms: platformContent,
        template: {
          id: template._id || 'custom-upload',
          name: template.name,
          category: template.category,
          originalImageUrl: template.isCustomUpload ? 'custom-upload' : template.imageUrl,
          customizationPrompt,
          contentBrief,
          aspectRatio,
          isCustomUpload: template.isCustomUpload || false
        },
        metadata: {
          processingTime,
          totalCost,
          models: {
            image: imageModel,
            text: textModel
          },
          plan: userPlan.name,
          source: 'template-customization'
        }
      }
    });

  } catch (error) {
    console.error('❌ Template customization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to customize template.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  generateFromTemplate
};
