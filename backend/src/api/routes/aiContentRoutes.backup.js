const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middlewares/authMiddleware');
const checkFeatureAccess = require('../middlewares/checkFeatureAccess');
require('dotenv').config();

/* ======================================================
   CONFIGURATION
====================================================== */

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

const textModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  safetySettings: [{
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  }],
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ======================================================
   COST TRACKING
====================================================== */

const COST_TRACKING = {
  models: {
    "gemini-2.5-pro": { inputCost: 0.00125, outputCost: 0.005 },
    "gemini-2.5-flash": { inputCost: 0.00015, outputCost: 0.0006 },
    "gemini-imagen": { cost: 0.04 },
    "cloudinary_upload": { cost: 0.001 }
  },

  calculateCost: (operations) => {
    let totalCost = 0;
    operations.forEach(op => {
      try {
        if (op.type === "text_generation") {
          const model = COST_TRACKING.models[op.model];
          if (model?.inputCost && model?.outputCost) {
            totalCost += (op.inputTokens / 1000) * model.inputCost;
            totalCost += (op.outputTokens / 1000) * model.outputCost;
          }
        } else if (op.type === "image_generation") {
          const model = COST_TRACKING.models[op.model];
          if (model?.cost) totalCost += model.cost;
        } else if (op.type === "upload") {
          totalCost += COST_TRACKING.models.cloudinary_upload.cost;
        }
      } catch (error) {
        console.warn(`Cost calculation error:`, error.message);
      }
    });
    return totalCost;
  }
};

/* ======================================================
   HELPER FUNCTIONS
====================================================== */

// Generate content with Gemini (reusable)
const generateWithGemini = async (prompt) => {
  try {
    console.log('🤖 Calling Gemini API...');

    const result = await textModel.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    console.log('📄 Raw Gemini response:', text.substring(0, 200));

    try {
      const parsed = JSON.parse(text);
      console.log('✅ Successfully parsed JSON response');
      return parsed;
    } catch (e) {
      console.error("❌ JSON Parse Error:", e.message);
      console.error("Raw text:", text.substring(0, 500));
      return {};
    }
  } catch (error) {
    console.error("❌ Gemini API Error:", error.message);
    console.error("Error stack:", error.stack);
    throw error;
  }
};

// Upload image to Cloudinary (reusable)
const uploadImageToCloudinary = async (dataUri) => {
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "social-media-posts",
    resource_type: "image",
  });
  return uploadResult.secure_url;
};

// Generate image with Imagen (reusable)
const callImageAI = async (prompt, aspectRatio = "1:1") => {
  try {
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${geminiApiKey}`;

    const response = await axios.post(
      imagenUrl,
      {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
          guidance_scale: 8.5,
          num_inference_steps: 50,
          safety_filter_level: "block_some",
          watermark: false,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 120000,
      }
    );

    const predictions = response?.data?.predictions || [];
    if (predictions.length === 0) throw new Error("No predictions returned");

    const base64 = predictions[0]?.bytesBase64Encoded || predictions[0]?.b64;
    if (!base64) throw new Error("Invalid Imagen response");

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    // Fallback to Imagen Fast
    try {
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${geminiApiKey}`;
      const fallbackResponse = await axios.post(
        fallbackUrl,
        {
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio },
        },
        { headers: { "Content-Type": "application/json" }, timeout: 60000 }
      );

      const fallbackBase64 = fallbackResponse?.data?.predictions?.[0]?.bytesBase64Encoded;
      if (fallbackBase64) return `data:image/png;base64,${fallbackBase64}`;
    } catch (fallbackError) {
      console.error("Image generation failed:", fallbackError.message);
    }

    // Final fallback: SVG placeholder
    return "data:image/svg+xml;base64," + Buffer.from(
      `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a2e"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#ffffff" font-size="24">
          Image Generation Unavailable
        </text>
      </svg>`
    ).toString("base64");
  }
};

// Generate platform-specific content (reusable)
const callPlatformContentAI = async (platform, contentStrategy, visualConcept) => {
  const platformLimits = {
    instagram: { caption: 2200, hashtags: 30 },
    facebook: { caption: 63206, hashtags: 30 },
    linkedin: { caption: 3000, hashtags: 30 },
    x: { caption: 280, hashtags: 10 }
  };

  const limits = platformLimits[platform] || platformLimits.instagram;

  const prompt = `Generate ${platform} content.

Content Strategy:
- Hook: ${contentStrategy.hook}
- Core Value: ${contentStrategy.coreValue}
- Proof Point: ${contentStrategy.proofPoint}
- CTA: ${contentStrategy.callToAction}

Visual Concept:
- Message: ${visualConcept.primaryMessage}
- Style: ${visualConcept.designStyle}

Platform: ${platform}
Caption limit: ${limits.caption} characters
Hashtag limit: ${limits.hashtags}

Generate JSON:
{
  "caption": "Engaging caption for ${platform}",
  "hashtags": ["relevant", "hashtags"]
}`;

  const result = await generateWithGemini(prompt);
  return {
    caption: result.caption || `${contentStrategy.hook}\n\n${contentStrategy.coreValue}\n\n${contentStrategy.callToAction}`,
    hashtags: result.hashtags || [`#${platform}`, '#socialmedia']
  };
};

// Download and convert image to base64 (reusable)
const downloadImageAsBase64 = async (imageUrl) => {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(response.data, 'binary').toString('base64');

  let mimeType = response.headers['content-type'] || 'image/jpeg';
  if (!mimeType.startsWith('image/')) {
    if (imageUrl.toLowerCase().includes('.png')) mimeType = 'image/png';
    else if (imageUrl.toLowerCase().includes('.webp')) mimeType = 'image/webp';
    else mimeType = 'image/jpeg';
  }

  return { base64, mimeType };
};

/* ======================================================
   ROUTES
====================================================== */

// Streamlined Template Customization
router.post('/customize-template', authMiddleware, checkFeatureAccess('ai_post_generation'), async (req, res) => {
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

    // Validate required fields
    if (!template || !customizationPrompt) {
      return res.status(400).json({
        success: false,
        message: 'Template and customization prompt are required.'
      });
    }

    // Validate template structure
    if (!template.imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Template must have an imageUrl.'
      });
    }

    // Validate template.imageUrl is either a URL or base64
    const isBase64 = template.imageUrl.startsWith('data:image/');
    const isUrl = template.imageUrl.startsWith('http://') || template.imageUrl.startsWith('https://');

    if (!isBase64 && !isUrl) {
      return res.status(400).json({
        success: false,
        message: 'Template imageUrl must be either a valid URL or base64 data URI.'
      });
    }

    console.log(`🎨 Template validation passed - Type: ${isBase64 ? 'Base64 Upload' : 'URL Template'}`);

    const userId = req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing' });
    }

    // ===== CREDIT & MONTHLY LIMIT CHECK (Same as generate-from-scratch) =====
    const subscriptionService = require('../../services/subscriptionService');
    const subscriptionUsageService = require('../../services/subscriptionUsageService');
    const Post = require('../../models/postModel');
    const User = require('../../models/userModel');

    const user = await User.findById(userId).select("creditLimit");
    const creditLimit = user?.creditLimit ?? 0;
    const sub = await subscriptionService.getActiveSubscriptionByUser(userId);

    let usedCredits = false;

    if (sub && sub.is_active) {
      const postsLimit = Number(
        sub.plan_id?.posts_per_month ||
        sub.plan_id?.postsPerMonth ||
        sub.plan_id?.features?.posts_per_month ||
        sub.plan_id?.features?.postsPerMonth ||
        0
      );

      if (postsLimit && postsLimit > 0) {
        const monthlyAvailability = await subscriptionUsageService.checkMonthlyPostsAvailability(userId);

        console.log(`[Template] Subscription-based monthly check: ${monthlyAvailability.used}/${monthlyAvailability.limit} (${monthlyAvailability.remaining} remaining)`);

        if (!monthlyAvailability.hasRemaining) {
          if (creditLimit > 0) {
            const creditsUsed = await Post.countDocuments({
              userId,
              usedCredits: true
            });

            if (creditsUsed >= creditLimit) {
              return res.status(403).json({
                success: false,
                message: 'Both monthly and credit limits reached',
                limitType: 'both',
                limit: creditLimit,
                used: creditsUsed,
                monthlyLimit: postsLimit,
                monthlyUsed: monthlyAvailability.used
              });
            }

            usedCredits = true;
            console.log(`[Template] Monthly limit reached, using credits: ${creditsUsed + 1}/${creditLimit}`);
          } else {
            return res.status(403).json({
              success: false,
              message: 'Monthly post limit reached for your plan',
              limitType: 'monthly',
              limit: postsLimit,
              used: monthlyAvailability.used
            });
          }
        } else {
          usedCredits = false;
          console.log(`[Template] Using monthly plan: ${monthlyAvailability.used + 1}/${monthlyAvailability.limit}`);
        }
      } else {
        if (creditLimit > 0) {
          const creditsUsed = await Post.countDocuments({
            userId,
            usedCredits: true
          });

          if (creditsUsed >= creditLimit) {
            return res.status(403).json({
              success: false,
              message: "Credit limit reached. Please upgrade your plan.",
              limitType: 'credit',
              limit: creditLimit,
              used: creditsUsed
            });
          }

          usedCredits = true;
        } else {
          return res.status(403).json({
            success: false,
            message: "Your plan does not allow post generation. Please upgrade.",
            limitType: 'no_limits'
          });
        }
      }
    } else {
      if (creditLimit > 0) {
        const creditsUsed = await Post.countDocuments({
          userId,
          usedCredits: true
        });

        if (creditsUsed >= creditLimit) {
          return res.status(403).json({
            success: false,
            message: "Credit limit reached. Please upgrade your plan.",
            limitType: 'credit',
            limit: creditLimit,
            used: creditsUsed
          });
        }

        usedCredits = true;
      } else {
        return res.status(403).json({
          success: false,
          message: "Your plan does not allow post generation. Please upgrade.",
          limitType: 'no_limits'
        });
      }
    }

    console.log(`🎨 Template customization: ${template.name} (${aspectRatio}) - usedCredits: ${usedCredits}`);

    // Step 1: Get template image as base64
    let templateImageBase64, mimeType;

    // Check if template.imageUrl is already base64 (custom upload)
    if (template.imageUrl && template.imageUrl.startsWith('data:image/')) {
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

    // Step 2: Send to Gemini 2.5 Flash with visual input
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.4 }
    });

    const imageModificationPrompt = `Analyze this template image and describe modifications.

Template: ${template.name} (${template.category})
User Request: ${customizationPrompt}
Aspect Ratio: ${aspectRatio}

Rules:
1. Preserve exact layout and structure
2. Only modify elements mentioned in request
3. Maintain professional quality
4. Keep same aspect ratio

Provide detailed modification instructions.`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: templateImageBase64 } },
      { text: imageModificationPrompt }
    ]);

    const modificationInstructions = result.response.text();

    // Step 3: Generate modified image
    const imageGenPrompt = `${modificationInstructions}

Create modified template:
- Template: ${template.name}
- Modifications: ${customizationPrompt}
- Aspect ratio: ${aspectRatio}
- Professional quality, clear text`;

    const modifiedImageDataUri = await callImageAI(imageGenPrompt, aspectRatio);
    const modifiedImageUrl = await uploadImageToCloudinary(modifiedImageDataUri);

    operations.push({ type: "image_generation", model: "gemini-2.5-flash" });

    // Step 4: Generate platform content
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

        const captionResult = await generateWithGemini(captionPrompt);

        platformContent[platform] = {
          caption: captionResult.caption || `${contentBrief || customizationPrompt}\n\nCheck out our latest! 🎉`,
          hashtags: captionResult.hashtags || [`#${platform}`, '#design']
        };

        operations.push({
          type: "text_generation",
          model: "gemini-2.5-pro",
          inputTokens: 300,
          outputTokens: 200
        });
      } catch (error) {
        platformContent[platform] = {
          caption: `${contentBrief || customizationPrompt}\n\nCustomized template! 🎨`,
          hashtags: [`#${platform}`, '#template']
        };
      }
    }

    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Template customized in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    // ===== SAVE POST TO DATABASE (Same as generate-from-scratch) =====
    const postContent = {
      imageUrl: modifiedImageUrl,
      platforms: platformContent,
      template: {
        id: template._id || 'custom-upload', // Handle custom uploads
        name: template.name,
        category: template.category,
        originalImageUrl: template.isCustomUpload ? 'custom-upload' : template.imageUrl, // Don't store base64 in DB
        customizationPrompt,
        contentBrief,
        aspectRatio,
        isCustomUpload: template.isCustomUpload || false
      },
      metadata: {
        processingTime,
        totalCost,
        model: 'gemini-2.5-flash',
        source: 'streamlined-template-customization'
      }
    };

    const post = new Post({
      userId,
      content: postContent,
      usedCredits: usedCredits
    });
    await post.save();

    console.log(`✅ Template post saved to database with ID: ${post._id}, usedCredits: ${usedCredits}`);

    return res.status(200).json({
      success: true,
      data: {
        postId: post._id, // Include post ID for navigation
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
          model: 'gemini-2.5-flash',
          source: 'streamlined-template-customization'
        }
      }
    });

  } catch (error) {
    console.error('❌ Template customization error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to customize template.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generate from Scratch (alias for backward compatibility)
router.post('/create-content-plan', authMiddleware, checkFeatureAccess('ai_post_generation'), async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      brief,
      platforms = ['instagram'],
      brandAssets = {},
      generationOptions = {},
      audienceTargeting = {},
      campaignContext = {},
      visualPreferences = {},
      performanceGoals = {}
    } = req.body;

    if (!brief) {
      return res.status(400).json({
        success: false,
        message: 'Content brief is required.'
      });
    }

    // Extract aspect ratio from generationOptions
    const aspectRatio = generationOptions.aspectRatios?.[0] || '1:1';

    console.log(`🚀 Generate from scratch: ${platforms.join(', ')} (${aspectRatio})`);

    // Step 1: Generate enhanced content strategy with ALL user inputs
    const strategyPrompt = `Create comprehensive social media content strategy using ALL provided details.

=== CONTENT BRIEF ===
${brief}

=== BRAND CONTEXT ===
Business Type: ${brandAssets.businessType || 'General business'}
Target Audience: ${brandAssets.targetAudience || 'General audience'}
Brand Personality: ${brandAssets.brandPersonality || 'Professional'}

=== CONTENT STRATEGY ===
Strategy Type: ${generationOptions.contentStrategy || 'educational'}
Visual Style: ${generationOptions.visualStyle || 'professional'}

=== AUDIENCE & CAMPAIGN ===
Primary Audience: ${audienceTargeting.primaryAudience || 'Not specified'}
Location: ${audienceTargeting.location || 'Global'}
Campaign Type: ${campaignContext.campaignType || 'brand_awareness'}
Campaign Goal: ${campaignContext.campaignGoal || 'engagement'}
Seasonality: ${campaignContext.seasonality || 'None'}

=== VISUAL PREFERENCES ===
Image Style: ${visualPreferences.imageStyle || 'photography'}
Color Mood: ${visualPreferences.colorMood || 'professional'}
Include Human Faces: ${visualPreferences.includeHumanFaces ? 'Yes' : 'No'}
Include Products: ${visualPreferences.includeProducts ? 'Yes' : 'No'}
Visual Complexity: ${visualPreferences.visualComplexity || 'simple'}

=== PERFORMANCE GOALS ===
Business Objective: ${performanceGoals.businessObjective || 'brand_awareness'}
CTA Type: ${performanceGoals.ctaType || 'learn_more'}

=== TARGET PLATFORMS ===
${platforms.join(', ')}

=== ASPECT RATIO ===
${aspectRatio}

Generate a comprehensive content plan in JSON format:
{
  "contentStrategy": {
    "hook": "Attention-grabbing opening aligned with ${generationOptions.contentStrategy} strategy",
    "coreValue": "Main value proposition for ${brandAssets.targetAudience}",
    "proofPoint": "Credibility element matching ${brandAssets.brandPersonality} personality",
    "callToAction": "Clear CTA for ${performanceGoals.ctaType}"
  },
  "visualConcept": {
    "primaryMessage": "Main headline text for the image",
    "designStyle": "Visual design approach matching ${generationOptions.visualStyle}",
    "colorPsychology": "Color mood: ${visualPreferences.colorMood}",
    "layoutType": "Layout type based on ${visualPreferences.imageStyle}"
  },
  "aiImagePrompt": "EXTREMELY DETAILED image generation prompt that MUST include:
    - Exact image style: ${visualPreferences.imageStyle}
    - Visual complexity: ${visualPreferences.visualComplexity}
    - Color mood: ${visualPreferences.colorMood}
    - Content strategy: ${generationOptions.contentStrategy}
    - Visual style: ${generationOptions.visualStyle}
    - Human faces: ${visualPreferences.includeHumanFaces ? 'include diverse people' : 'no people, focus on concepts/products'}
    - Products: ${visualPreferences.includeProducts ? 'prominently feature products/services' : 'abstract concepts'}
    - Campaign type: ${campaignContext.campaignType}
    - Seasonality: ${campaignContext.seasonality || 'timeless'}
    - Target audience: ${audienceTargeting.primaryAudience || brandAssets.targetAudience}
    - Brand personality: ${brandAssets.brandPersonality}
    - Aspect ratio: ${aspectRatio}
    - Platform optimization: ${platforms.join(', ')}
    
    For INFOGRAPHIC style: Include data visualization, charts, statistics, clean layout, professional typography, information hierarchy
    For PHOTOGRAPHY: High-quality photo, professional lighting, realistic
    For ILLUSTRATION: Vector art, artistic, creative, stylized
    For 3D_RENDER: Three-dimensional, modern, sleek, rendered
    For MINIMALIST: Clean, simple, lots of whitespace, focused
    
    Make it HIGHLY SPECIFIC and DETAILED (at least 100 words)"
}`;

    const contentPlan = await generateWithGemini(strategyPrompt);
    operations.push({ type: "text_generation", model: "gemini-2.5-pro", inputTokens: 800, outputTokens: 500 });

    // Step 2: Generate image with ENHANCED prompt
    let imagePrompt = contentPlan.aiImagePrompt || '';

    // If AI didn't generate a good prompt, create a comprehensive one manually
    if (!imagePrompt || imagePrompt.length < 100) {
      const styleDescriptions = {
        'photography': 'high-quality professional photograph, realistic lighting, sharp focus, professional camera',
        'illustration': 'vector illustration, artistic design, creative artwork, stylized graphics',
        '3d_render': 'three-dimensional rendered image, modern 3D graphics, sleek design, ray-traced lighting',
        'minimalist': 'minimalist design, clean layout, lots of whitespace, simple elegant composition',
        'infographic': 'professional infographic design, data visualization, charts and statistics, clean typography, information hierarchy, organized layout'
      };

      const complexityDescriptions = {
        'simple': 'clean and simple composition, focused on one main element',
        'moderate': 'balanced composition with multiple elements, organized layout',
        'complex': 'detailed composition with rich visual elements, layered design'
      };

      const moodDescriptions = {
        'calm': 'calm and peaceful colors, soft tones, serene atmosphere',
        'energetic': 'vibrant and energetic colors, dynamic composition, bold contrasts',
        'professional': 'professional color palette, corporate colors, trustworthy appearance',
        'playful': 'playful and fun colors, bright and cheerful, engaging atmosphere'
      };

      const strategyDescriptions = {
        'educational': 'educational and informative visual, clear information presentation',
        'promotional': 'promotional and eye-catching, product-focused, sales-oriented',
        'entertaining': 'entertaining and engaging, fun and creative',
        'inspirational': 'inspirational and motivational, uplifting imagery',
        'behind-the-scenes': 'authentic behind-the-scenes look, genuine and relatable',
        'user-generated': 'user-generated content style, authentic and real'
      };

      imagePrompt = `Create a ${aspectRatio} aspect ratio social media post image.

STYLE: ${styleDescriptions[visualPreferences.imageStyle] || styleDescriptions['photography']}

CONTENT STRATEGY: ${strategyDescriptions[generationOptions.contentStrategy] || 'professional and engaging'}

VISUAL COMPLEXITY: ${complexityDescriptions[visualPreferences.visualComplexity] || 'balanced and clear'}

COLOR MOOD: ${moodDescriptions[visualPreferences.colorMood] || 'professional and appealing'}

CONTENT: ${brief}

BRAND: ${brandAssets.businessType || 'modern business'} targeting ${brandAssets.targetAudience || 'general audience'}

BRAND PERSONALITY: ${brandAssets.brandPersonality || 'professional and trustworthy'}

${visualPreferences.includeHumanFaces ? 'INCLUDE: Diverse people, human faces, authentic expressions' : 'NO PEOPLE: Focus on products, concepts, or abstract elements'}

${visualPreferences.includeProducts ? 'PROMINENTLY FEATURE: Products or services in the image' : 'FOCUS ON: Abstract concepts and ideas'}

${campaignContext.seasonality ? `SEASONAL CONTEXT: ${campaignContext.seasonality} theme and elements` : ''}

CAMPAIGN TYPE: ${campaignContext.campaignType} campaign

TARGET AUDIENCE: ${audienceTargeting.primaryAudience || brandAssets.targetAudience || 'general audience'}

PLATFORMS: Optimized for ${platforms.join(', ')}

QUALITY: Professional, high-resolution, social media ready, eye-catching, scroll-stopping visual

${visualPreferences.imageStyle === 'infographic' ? 'INFOGRAPHIC ELEMENTS: Include data visualization, charts, statistics, clean typography, organized information hierarchy, professional layout with clear sections' : ''}

Make it visually stunning, on-brand, and perfectly aligned with the ${generationOptions.contentStrategy} content strategy.`;
    }

    console.log('📸 Enhanced image prompt length:', imagePrompt.length);

    const imageDataUri = await callImageAI(imagePrompt, aspectRatio);
    const imageUrl = await uploadImageToCloudinary(imageDataUri);
    operations.push({ type: "image_generation", model: "gemini-imagen" });

    // Step 3: Generate platform content
    const platformContent = {};

    for (const platform of platforms) {
      const platformResult = await callPlatformContentAI(
        platform,
        contentPlan.contentStrategy,
        contentPlan.visualConcept
      );
      platformContent[platform] = platformResult;
      operations.push({ type: "text_generation", model: "gemini-2.5-pro", inputTokens: 300, outputTokens: 200 });
    }

    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Content generated in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    return res.status(200).json({
      success: true,
      imageUrl,
      contentStrategy: contentPlan.contentStrategy,
      visualConcept: contentPlan.visualConcept,
      platforms: platformContent,
      metadata: {
        processingTime,
        totalCost,
        source: 'generate-from-scratch'
      }
    });

  } catch (error) {
    console.error('❌ Content generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate content.',
      error: error.message
    });
  }
});

// Generate from Scratch
router.post('/generate-content', authMiddleware, checkFeatureAccess('ai_post_generation'), async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      brief,
      platforms = ['instagram'],
      brandAssets = {},
      generationOptions = {},
      audienceTargeting = {},
      campaignContext = {},
      visualPreferences = {},
      performanceGoals = {}
    } = req.body;

    if (!brief) {
      return res.status(400).json({
        success: false,
        message: 'Content brief is required.'
      });
    }

    // Extract aspect ratio from generationOptions
    const aspectRatio = generationOptions.aspectRatios?.[0] || '1:1';

    console.log(`🚀 Generate from scratch: ${platforms.join(', ')} (${aspectRatio})`);

    // Step 1: Generate enhanced content strategy with ALL user inputs
    const strategyPrompt = `Create comprehensive social media content strategy using ALL provided details.

=== CONTENT BRIEF ===
${brief}

=== BRAND CONTEXT ===
Business Type: ${brandAssets.businessType || 'General business'}
Target Audience: ${brandAssets.targetAudience || 'General audience'}
Brand Personality: ${brandAssets.brandPersonality || 'Professional'}

=== CONTENT STRATEGY ===
Strategy Type: ${generationOptions.contentStrategy || 'educational'}
Visual Style: ${generationOptions.visualStyle || 'professional'}

=== AUDIENCE & CAMPAIGN ===
Primary Audience: ${audienceTargeting.primaryAudience || 'Not specified'}
Location: ${audienceTargeting.location || 'Global'}
Campaign Type: ${campaignContext.campaignType || 'brand_awareness'}
Campaign Goal: ${campaignContext.campaignGoal || 'engagement'}
Seasonality: ${campaignContext.seasonality || 'None'}

=== VISUAL PREFERENCES ===
Image Style: ${visualPreferences.imageStyle || 'photography'}
Color Mood: ${visualPreferences.colorMood || 'professional'}
Include Human Faces: ${visualPreferences.includeHumanFaces ? 'Yes' : 'No'}
Include Products: ${visualPreferences.includeProducts ? 'Yes' : 'No'}
Visual Complexity: ${visualPreferences.visualComplexity || 'simple'}

=== PERFORMANCE GOALS ===
Business Objective: ${performanceGoals.businessObjective || 'brand_awareness'}
CTA Type: ${performanceGoals.ctaType || 'learn_more'}

=== TARGET PLATFORMS ===
${platforms.join(', ')}

=== ASPECT RATIO ===
${aspectRatio}

Generate a comprehensive content plan in JSON format:
{
  "contentStrategy": {
    "hook": "Attention-grabbing opening aligned with ${generationOptions.contentStrategy} strategy",
    "coreValue": "Main value proposition for ${brandAssets.targetAudience}",
    "proofPoint": "Credibility element matching ${brandAssets.brandPersonality} personality",
    "callToAction": "Clear CTA for ${performanceGoals.ctaType}"
  },
  "visualConcept": {
    "primaryMessage": "Main headline text for the image",
    "designStyle": "Visual design approach matching ${generationOptions.visualStyle}",
    "colorPsychology": "Color mood: ${visualPreferences.colorMood}",
    "layoutType": "Layout type based on ${visualPreferences.imageStyle}"
  },
  "aiImagePrompt": "EXTREMELY DETAILED image generation prompt that MUST include:
    - Exact image style: ${visualPreferences.imageStyle}
    - Visual complexity: ${visualPreferences.visualComplexity}
    - Color mood: ${visualPreferences.colorMood}
    - Content strategy: ${generationOptions.contentStrategy}
    - Visual style: ${generationOptions.visualStyle}
    - Human faces: ${visualPreferences.includeHumanFaces ? 'include diverse people' : 'no people, focus on concepts/products'}
    - Products: ${visualPreferences.includeProducts ? 'prominently feature products/services' : 'abstract concepts'}
    - Campaign type: ${campaignContext.campaignType}
    - Seasonality: ${campaignContext.seasonality || 'timeless'}
    - Target audience: ${audienceTargeting.primaryAudience || brandAssets.targetAudience}
    - Brand personality: ${brandAssets.brandPersonality}
    - Aspect ratio: ${aspectRatio}
    - Platform optimization: ${platforms.join(', ')}
    
    For INFOGRAPHIC style: Include data visualization, charts, statistics, clean layout, professional typography, information hierarchy
    For PHOTOGRAPHY: High-quality photo, professional lighting, realistic
    For ILLUSTRATION: Vector art, artistic, creative, stylized
    For 3D_RENDER: Three-dimensional, modern, sleek, rendered
    For MINIMALIST: Clean, simple, lots of whitespace, focused
    
    Make it HIGHLY SPECIFIC and DETAILED (at least 100 words)"
}`;

    const contentPlan = await generateWithGemini(strategyPrompt);
    operations.push({ type: "text_generation", model: "gemini-2.5-pro", inputTokens: 800, outputTokens: 500 });

    // Step 2: Generate image with ENHANCED prompt
    let imagePrompt = contentPlan.aiImagePrompt || '';

    // If AI didn't generate a good prompt, create a comprehensive one manually
    if (!imagePrompt || imagePrompt.length < 100) {
      const styleDescriptions = {
        'photography': 'high-quality professional photograph, realistic lighting, sharp focus, professional camera',
        'illustration': 'vector illustration, artistic design, creative artwork, stylized graphics',
        '3d_render': 'three-dimensional rendered image, modern 3D graphics, sleek design, ray-traced lighting',
        'minimalist': 'minimalist design, clean layout, lots of whitespace, simple elegant composition',
        'infographic': 'professional infographic design, data visualization, charts and statistics, clean typography, information hierarchy, organized layout'
      };

      const complexityDescriptions = {
        'simple': 'clean and simple composition, focused on one main element',
        'moderate': 'balanced composition with multiple elements, organized layout',
        'complex': 'detailed composition with rich visual elements, layered design'
      };

      const moodDescriptions = {
        'calm': 'calm and peaceful colors, soft tones, serene atmosphere',
        'energetic': 'vibrant and energetic colors, dynamic composition, bold contrasts',
        'professional': 'professional color palette, corporate colors, trustworthy appearance',
        'playful': 'playful and fun colors, bright and cheerful, engaging atmosphere'
      };

      const strategyDescriptions = {
        'educational': 'educational and informative visual, clear information presentation',
        'promotional': 'promotional and eye-catching, product-focused, sales-oriented',
        'entertaining': 'entertaining and engaging, fun and creative',
        'inspirational': 'inspirational and motivational, uplifting imagery',
        'behind-the-scenes': 'authentic behind-the-scenes look, genuine and relatable',
        'user-generated': 'user-generated content style, authentic and real'
      };

      imagePrompt = `Create a ${aspectRatio} aspect ratio social media post image.

STYLE: ${styleDescriptions[visualPreferences.imageStyle] || styleDescriptions['photography']}

CONTENT STRATEGY: ${strategyDescriptions[generationOptions.contentStrategy] || 'professional and engaging'}

VISUAL COMPLEXITY: ${complexityDescriptions[visualPreferences.visualComplexity] || 'balanced and clear'}

COLOR MOOD: ${moodDescriptions[visualPreferences.colorMood] || 'professional and appealing'}

CONTENT: ${brief}

BRAND: ${brandAssets.businessType || 'modern business'} targeting ${brandAssets.targetAudience || 'general audience'}

BRAND PERSONALITY: ${brandAssets.brandPersonality || 'professional and trustworthy'}

${visualPreferences.includeHumanFaces ? 'INCLUDE: Diverse people, human faces, authentic expressions' : 'NO PEOPLE: Focus on products, concepts, or abstract elements'}

${visualPreferences.includeProducts ? 'PROMINENTLY FEATURE: Products or services in the image' : 'FOCUS ON: Abstract concepts and ideas'}

${campaignContext.seasonality ? `SEASONAL CONTEXT: ${campaignContext.seasonality} theme and elements` : ''}

CAMPAIGN TYPE: ${campaignContext.campaignType} campaign

TARGET AUDIENCE: ${audienceTargeting.primaryAudience || brandAssets.targetAudience || 'general audience'}

PLATFORMS: Optimized for ${platforms.join(', ')}

QUALITY: Professional, high-resolution, social media ready, eye-catching, scroll-stopping visual

${visualPreferences.imageStyle === 'infographic' ? 'INFOGRAPHIC ELEMENTS: Include data visualization, charts, statistics, clean typography, organized information hierarchy, professional layout with clear sections' : ''}

Make it visually stunning, on-brand, and perfectly aligned with the ${generationOptions.contentStrategy} content strategy.`;
    }

    console.log('📸 Enhanced image prompt length:', imagePrompt.length);

    const imageDataUri = await callImageAI(imagePrompt, aspectRatio);
    const imageUrl = await uploadImageToCloudinary(imageDataUri);
    operations.push({ type: "image_generation", model: "gemini-imagen" });

    // Step 3: Generate platform content
    const platformContent = {};

    for (const platform of platforms) {
      const platformResult = await callPlatformContentAI(
        platform,
        contentPlan.contentStrategy,
        contentPlan.visualConcept
      );
      platformContent[platform] = platformResult;
      operations.push({ type: "text_generation", model: "gemini-2.5-pro", inputTokens: 300, outputTokens: 200 });
    }

    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Content generated in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    return res.status(200).json({
      success: true,
      data: {
        imageUrl,
        contentStrategy: contentPlan.contentStrategy,
        visualConcept: contentPlan.visualConcept,
        platforms: platformContent,
        metadata: {
          processingTime,
          totalCost,
          source: 'generate-from-scratch'
        }
      }
    });

  } catch (error) {
    console.error('❌ Content generation error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate content.',
      error: error.message
    });
  }
});

// Regenerate captions
router.post('/regenerate-captions', authMiddleware, async (req, res) => {
  try {
    const { postContent, platforms = ['instagram'] } = req.body;

    const platformContent = {};

    for (const platform of platforms) {
      const prompt = `Generate new ${platform} caption.

Content: ${postContent}

JSON format:
{
  "caption": "Fresh engaging caption",
  "hashtags": ["relevant", "tags"]
}`;

      const result = await generateWithGemini(prompt);
      platformContent[platform] = result;
    }

    return res.status(200).json({ success: true, platforms: platformContent });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Regenerate hashtags
router.post('/regenerate-hashtags', authMiddleware, async (req, res) => {
  try {
    const { platforms = ['instagram'], caption } = req.body;

    const platformContent = {};

    for (const platform of platforms) {
      const prompt = `Generate hashtags for ${platform}.

Caption: ${caption}

JSON format:
{
  "hashtags": ["relevant", "trending", "tags"]
}`;

      const result = await generateWithGemini(prompt);
      platformContent[platform] = { hashtags: result.hashtags || [] };
    }

    return res.status(200).json({ success: true, platforms: platformContent });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Regenerate image
router.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { aiImagePrompt, aspectRatio = '1:1' } = req.body;

    if (!aiImagePrompt) {
      return res.status(400).json({ success: false, message: 'Image prompt required.' });
    }

    const imageDataUri = await callImageAI(aiImagePrompt, aspectRatio);
    const imageUrl = await uploadImageToCloudinary(imageDataUri);

    return res.status(200).json({ success: true, imageUrl });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Generate Caption & Hashtags for Existing Image
router.post('/generate-caption-hashtags', authMiddleware, checkFeatureAccess('ai_post_generation'), async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      imageUrl, // base64 image from user
      contentBrief,
      platforms = ['instagram', 'facebook', 'linkedin', 'x']
    } = req.body;

    // Validate required fields
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
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID missing' });
    }

    console.log(`📝 Caption & Hashtag generation for ${platforms.length} platforms`);

    // ===== CREDIT & MONTHLY LIMIT CHECK =====
    const subscriptionService = require('../../services/subscriptionService');
    const subscriptionUsageService = require('../../services/subscriptionUsageService');
    const Post = require('../../models/postModel');
    const User = require('../../models/userModel');

    const user = await User.findById(userId).select("creditLimit");
    const creditLimit = user?.creditLimit ?? 0;
    const sub = await subscriptionService.getActiveSubscriptionByUser(userId);

    let usedCredits = false;

    if (sub && sub.is_active) {
      const postsLimit = Number(
        sub.plan_id?.posts_per_month ||
        sub.plan_id?.postsPerMonth ||
        sub.plan_id?.features?.posts_per_month ||
        sub.plan_id?.features?.postsPerMonth ||
        0
      );

      if (postsLimit && postsLimit > 0) {
        const monthlyAvailability = await subscriptionUsageService.checkMonthlyPostsAvailability(userId);

        if (!monthlyAvailability.hasRemaining) {
          if (creditLimit > 0) {
            const creditsUsed = await Post.countDocuments({
              userId,
              usedCredits: true
            });

            if (creditsUsed >= creditLimit) {
              return res.status(403).json({
                success: false,
                message: 'Both monthly and credit limits reached',
                limitType: 'both',
                limit: creditLimit,
                used: creditsUsed,
                monthlyLimit: postsLimit,
                monthlyUsed: monthlyAvailability.used
              });
            }

            usedCredits = true;
          } else {
            return res.status(403).json({
              success: false,
              message: 'Monthly post limit reached for your plan',
              limitType: 'monthly',
              limit: postsLimit,
              used: monthlyAvailability.used
            });
          }
        } else {
          usedCredits = false;
        }
      } else {
        if (creditLimit > 0) {
          const creditsUsed = await Post.countDocuments({
            userId,
            usedCredits: true
          });

          if (creditsUsed >= creditLimit) {
            return res.status(403).json({
              success: false,
              message: "Credit limit reached. Please upgrade your plan.",
              limitType: 'credit',
              limit: creditLimit,
              used: creditsUsed
            });
          }

          usedCredits = true;
        } else {
          return res.status(403).json({
            success: false,
            message: "Your plan does not allow post generation. Please upgrade.",
            limitType: 'no_limits'
          });
        }
      }
    } else {
      if (creditLimit > 0) {
        const creditsUsed = await Post.countDocuments({
          userId,
          usedCredits: true
        });

        if (creditsUsed >= creditLimit) {
          return res.status(403).json({
            success: false,
            message: "Credit limit reached. Please upgrade your plan.",
            limitType: 'credit',
            limit: creditLimit,
            used: creditsUsed
          });
        }

        usedCredits = true;
      } else {
        return res.status(403).json({
          success: false,
          message: "Your plan does not allow post generation. Please upgrade.",
          limitType: 'no_limits'
        });
      }
    }

    // Step 1: Upload user's image to Cloudinary (permanent storage)
    console.log('📤 Uploading user image to Cloudinary...');
    const uploadedImageUrl = await uploadImageToCloudinary(imageUrl);
    operations.push({ type: "upload", model: "cloudinary_upload" });

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

        const result = await generateWithGemini(captionPrompt);

        console.log(`✅ Result for ${platform}:`, JSON.stringify(result).substring(0, 200));

        // Check if result has the expected structure
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
          model: "gemini-2.5-pro",
          inputTokens: 200,
          outputTokens: 150
        });
      } catch (error) {
        console.error(`❌ Error generating content for ${platform}:`, error);
        console.error(`Error details:`, error.message, error.stack);
        platformContent[platform] = {
          caption: `${contentBrief}\n\nShare your thoughts! 💬`,
          hashtags: [`#${platform}`, '#socialmedia']
        };
      }
    }

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
        model: 'gemini-2.5-pro',
        source: 'caption-hashtag-generator'
      }
    };

    const post = new Post({
      userId,
      content: postContent,
      usedCredits: usedCredits
    });
    await post.save();

    console.log(`✅ Post saved to database with ID: ${post._id}, usedCredits: ${usedCredits}`);

    return res.status(200).json({
      success: true,
      data: {
        postId: post._id,
        imageUrl: uploadedImageUrl,
        platforms: platformContent,
        metadata: {
          processingTime,
          totalCost,
          model: 'gemini-2.5-pro',
          source: 'caption-hashtag-generator'
        }
      }
    });

  } catch (error) {
    console.error('❌ Caption & hashtag generation error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate captions and hashtags.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
