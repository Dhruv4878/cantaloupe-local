const Post = require('../../models/postModel');
const {
  COST_TRACKING,
  generateWithGemini,
  uploadImageToCloudinary,
  callImageAI,
  callPlatformContentAI,
  generateContentAnalytics
} = require('./aiContentHelpers');
const {
  getTemplateByCategory,
  buildVariableExtractionPrompt,
  assembleImagePrompt,
  getTemplateMetadata
} = require('../../utils/visualTemplateRegistry');
const {
  getStyleById,
  buildStyleSelectionPrompt
} = require('../../utils/visualStyleRegistry');
const {
  extractBrandingFromPrompt,
  assembleBrandingPrompt,
  hasBranding
} = require('../../utils/brandingExtractor');
const {
  detectLayoutContext,
  enhancePromptWithContext
} = require('../../utils/layoutContextDetector');

/**
 * Generate social media content from scratch using Industry-Standard Infographic Templates
 * User selects category and fills 4 fields → generates professional infographic
 */
const generateFromScratch = async (req, res) => {
  const startTime = Date.now();
  const operations = [];

  try {
    const {
      brief,
      category, // OPTIONAL: User-selected category (e.g., "Quotes & Motivation")
      fieldValues = {}, // OPTIONAL: User-filled field values
      platforms = ['instagram'],
      brandAssets = {},
      generationOptions = {}
    } = req.body;

    // Validation - only brief is required now
    if (!brief || brief.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Creative brief is required.'
      });
    }

    const userId = req.user?.id;
    const usedCredits = req.usedCredits;
    const aspectRatio = generationOptions.aspectRatios?.[0] || '1:1';

    console.log(`🎨 Content Generation: Brief="${brief.substring(0, 50)}...", Category=${category || 'AI-selected'}, Platform=${platforms.join(', ')}, Ratio=${aspectRatio}`);

    // Determine model based on user plan
    const userPlan = req.userPlan || { name: 'Free' };
    const isFreePlan = userPlan.name === 'Free';

    // Use gemini-2.5-flash for free users for EVERYTHING
    const imageModel = isFreePlan ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';
    const textModel = isFreePlan ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    console.log(`🤖 Using models for ${userPlan.name} plan: Image=${imageModel}, Text=${textModel}`);

    // Step 1: Determine template (from category or AI selection based on brief)
    let selectedTemplate;

    if (category) {
      // User selected a category - use it
      selectedTemplate = getTemplateByCategory(category);
      console.log(`📋 User Selected Template: ${selectedTemplate.name} (${selectedTemplate.id})`);
    } else {
      // No category selected - AI will choose best template based on brief
      const categorySelectionPrompt = buildCategorySelectionPrompt(brief);
      const categoryResult = await generateWithGemini(categorySelectionPrompt, textModel);
      operations.push({
        type: "text_generation",
        model: textModel,
        inputTokens: 400,
        outputTokens: 100
      });

      const aiSelectedCategory = categoryResult.selectedCategory || 'QUOTES_MOTIVATION';
      selectedTemplate = getTemplateByCategory(aiSelectedCategory);
      console.log(`🤖 AI Selected Template: ${selectedTemplate.name} (${selectedTemplate.id})`);
    }

    // Step 1.5: Determine Visual Style (The "Agency" Touch)
    let selectedStyle;

    // AI selects the best artistic style for this content
    const styleSelectionPrompt = buildStyleSelectionPrompt(brief, selectedTemplate.category);
    const styleResult = await generateWithGemini(styleSelectionPrompt, textModel);
    operations.push({
      type: "text_generation",
      model: textModel,
      inputTokens: 500,
      outputTokens: 100
    });

    const styleId = styleResult.selectedStyleId || 'MODERN_CORPORATE';
    selectedStyle = getStyleById(styleId);
    console.log(`🎨 AI Selected Style: ${selectedStyle.name} (${selectedStyle.id})`);

    // Step 1.6: Detect Layout Context (for context-aware design)
    const contextResult = detectLayoutContext(brief);
    let contextPrompt = '';

    if (contextResult.detected && contextResult.confidence > 0.3) {
      console.log(`🎯 Context Detected: ${contextResult.context.name} (confidence: ${contextResult.confidence.toFixed(2)})`);
      contextPrompt = contextResult.context.layoutModifiers.positivePrompt;
    } else {
      console.log('ℹ️  No strong context detected - using default layout');
    }

    // Step 1.7: Extract Branding Information
    const brandingInfo = extractBrandingFromPrompt(brief, brandAssets);
    const brandingPrompt = hasBranding(brandingInfo) ? assembleBrandingPrompt(brandingInfo) : '';

    if (hasBranding(brandingInfo)) {
      console.log('🏢 Branding Detected:', brandingInfo);
    } else {
      console.log('ℹ️  No branding information found');
    }

    // Step 2: Get field values (from frontend or extract from brief using AI)
    let templateVariables = fieldValues;

    if (!fieldValues || Object.keys(fieldValues).length === 0) {
      // Extract from brief using AI if fields not provided
      const variablePrompt = buildVariableExtractionPrompt(selectedTemplate, brief, fieldValues);

      if (variablePrompt) {
        const variableResult = await generateWithGemini(variablePrompt, textModel);
        operations.push({
          type: "text_generation",
          model: textModel,
          inputTokens: 600,
          outputTokens: 200
        });
        templateVariables = variableResult.variables || {};
      }
    } else {
      // User provided field values - use them directly
      console.log('✅ Using user-provided field values');
    }

    console.log('🔧 Template Variables:', templateVariables);

    // Step 3: Assemble deterministic image prompt with Visual Style, Context, and Branding
    const promptData = assembleImagePrompt(
      selectedTemplate,
      templateVariables,
      aspectRatio,
      selectedStyle,
      brandingPrompt,
      contextPrompt
    );
    const imagePrompt = promptData.positivePrompt;
    const negativePrompt = promptData.negativePrompt;

    console.log('📸 Assembled Image Prompt Length:', imagePrompt.length);
    console.log('🚫 Negative Prompt:', negativePrompt.substring(0, 50) + '...');

    // Step 4: Generate content strategy using Gemini
    const strategyPrompt = buildContentStrategyPrompt({
      brief,
      brandAssets,
      platforms,
      template: selectedTemplate,
      variables: templateVariables
    });

    const contentPlan = await generateWithGemini(strategyPrompt, textModel);
    operations.push({
      type: "text_generation",
      model: textModel,
      inputTokens: 1000,
      outputTokens: 600
    });

    console.log('📝 Content Strategy Generated');

    // Step 5: Generate infographic image with AI
    const imageDataUri = await callImageAI(imagePrompt, aspectRatio, negativePrompt, null, imageModel);
    const imageUrl = await uploadImageToCloudinary(imageDataUri);
    operations.push({ type: "image_generation", model: imageModel });

    console.log('✅ Infographic Image Generated:', imageUrl);

    // Step 6: Generate platform-specific content
    const platformContent = {};

    for (const platform of platforms) {
      const platformResult = await callPlatformContentAI(
        platform,
        contentPlan.contentStrategy,
        {
          templateName: selectedTemplate.name,
          templateCategory: selectedTemplate.category,
          templateVariables: templateVariables
        },
        textModel
      );
      platformContent[platform] = platformResult;
      operations.push({
        type: "text_generation",
        model: textModel,
        inputTokens: 300,
        outputTokens: 200
      });
    }

    // Calculate costs and timing
    const totalCost = COST_TRACKING.calculateCost(operations);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Infographic content generated in ${processingTime}ms ($${totalCost.toFixed(4)})`);

    // Step 6.5: Generate Analytics
    let analyticsData = {};
    try {
      console.log('📊 Generating Content Analytics...');
      analyticsData = await generateContentAnalytics(
        brief,
        `Template: ${selectedTemplate.name}, Strategy: ${contentPlan.contentStrategy.hook}`,
        textModel
      );
      operations.push({
        type: "text_generation",
        model: textModel,
        inputTokens: 300,
        outputTokens: 100
      });
      console.log('✅ Analytics Generated:', analyticsData);
    } catch (analyticsError) {
      console.error('⚠️ Failed to generate analytics:', analyticsError.message);
    }

    // Step 7: Get template metadata
    const templateMetadata = getTemplateMetadata(selectedTemplate, templateVariables);

    // Step 8: Save post to database
    const postContent = {
      imageUrl,
      platforms: platformContent,
      contentStrategy: contentPlan.contentStrategy,
      visualArchetype: 'INFOGRAPHIC', // All are infographics now
      visualTemplate: templateMetadata,
      analytics: analyticsData, // Added analytics field
      metadata: {
        processingTime,
        totalCost,
        models: {
          image: imageModel,
          text: textModel
        },
        plan: userPlan.name,
        source: 'generate-from-scratch',
        mode: 'infographic-template-system',
        brief,
        brandAssets,
        aspectRatio,
        imageGenerationPrompt: imagePrompt
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
        imageUrl,
        contentStrategy: contentPlan.contentStrategy,
        visualArchetype: 'INFOGRAPHIC',
        visualTemplate: templateMetadata,
        platforms: platformContent,
        metadata: {
          processingTime,
          totalCost,
          models: {
            image: imageModel,
            text: textModel
          },
          plan: userPlan.name,
          source: 'generate-from-scratch',
          mode: 'infographic-template-system'
        }
      }
    });

  } catch (error) {
    console.error('❌ Generate from scratch error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate content.',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Build category selection prompt for AI to choose best template
 */
function buildCategorySelectionPrompt(brief) {
  return `You are an expert content strategist. Based on the creative brief, select the MOST APPROPRIATE infographic category.

=== CREATIVE BRIEF ===
${brief}

=== AVAILABLE CATEGORIES ===
1. QUOTES_MOTIVATION - Inspirational quotes and motivational content
2. BUSINESS_CORPORATE - Business announcements, corporate updates, statistics
3. PRODUCT_PROMOTION - Product launches, features, promotions
4. OFFERS_SALES - Sales, discounts, special offers, deals
5. FESTIVALS - Festival greetings, seasonal celebrations
6. EDUCATIONAL - Tips, how-tos, educational content, tutorials
7. TESTIMONIALS - Customer reviews, testimonials, social proof
8. PERSONAL_BRAND - Personal branding, professional identity
9. REAL_ESTATE - Property listings, real estate promotions
10. HOSPITALITY - Hotels, restaurants, food, hospitality services
11. HEALTHCARE - Health tips, medical information, wellness
12. EVENTS - Event announcements, invitations, conferences
13. HIRING - Job openings, recruitment, career opportunities

=== YOUR TASK ===
Analyze the brief and select the SINGLE BEST category that matches the content intent.

Return ONLY valid JSON:
{
  "selectedCategory": "CATEGORY_ID",
  "reasoning": "Brief explanation why this category fits best"
}`;
}

/**
 * Build content strategy prompt for Gemini 2.5 Pro
 */
function buildContentStrategyPrompt(params) {
  const {
    brief,
    brandAssets,
    platforms,
    template,
    variables
  } = params;

  return `You are an expert social media content strategist. Create a compelling content strategy for a ${template.name} infographic.

=== CREATIVE BRIEF ===
${brief || 'Create engaging content for ' + template.category}

=== BRAND CONTEXT ===
Business Type: ${brandAssets.businessType || 'Modern business'}
Target Audience: ${brandAssets.targetAudience || 'General audience'}
Brand Personality: ${brandAssets.brandPersonality || 'Professional, trustworthy, innovative'}

=== TARGET PLATFORMS ===
${platforms.join(', ')}

=== INFOGRAPHIC TEMPLATE ===
Category: ${template.category}
Template: ${template.name}
Description: ${template.description}

=== INFOGRAPHIC CONTENT ===
${JSON.stringify(variables, null, 2)}

=== YOUR TASK ===
Create a content strategy that complements the infographic. The image will contain the visual elements and text from the template, so your content strategy should:
- Build on the visual message
- Provide context and storytelling
- Drive engagement and action
- Match the ${template.category} tone

Return ONLY valid JSON in this exact structure:

{
  "contentStrategy": {
    "hook": "Scroll-stopping opening line that creates curiosity or emotion (1-2 sentences)",
    "coreValue": "The main benefit or transformation promised (1-2 sentences)",
    "proofPoint": "Credibility element like a statistic, testimonial concept, or authority signal (1 sentence)",
    "callToAction": "Clear, action-oriented CTA aligned with the goal (1 sentence)"
  }
}

IMPORTANT:
- Keep each field concise and impactful
- Match the tone to the ${template.category} category
- Ensure the strategy complements (not repeats) the infographic content
- Make it platform-appropriate for ${platforms.join(', ')}`;
}

module.exports = {
  generateFromScratch
};
