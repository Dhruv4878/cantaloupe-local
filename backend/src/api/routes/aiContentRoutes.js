const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const checkFeatureAccess = require('../middlewares/checkFeatureAccess');
const checkPostLimits = require('../middlewares/checkPostLimits');

// Import controllers
const { generateFromScratch } = require('../controllers/generateFromScratchController');
const { generateFromTemplate } = require('../controllers/generateFromTemplateController');
const { generateCaptionHashtag } = require('../controllers/generateCaptionHashtagController');

// Import helpers for utility routes
const {
  generateWithGemini,
  callImageAI
} = require('../controllers/aiContentHelpers');

// Import template registry
const { getAllCategories } = require('../../utils/visualTemplateRegistry');

/* ======================================================
   MAIN CONTENT GENERATION ROUTES
====================================================== */

/**
 * Get all available infographic categories
 * Returns list of categories with their fields for frontend form
 */
router.get('/infographic-categories', (req, res) => {
  try {
    const categories = getAllCategories();
    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get categories.',
      error: error.message
    });
  }
});

/**
 * Generate content from scratch
 * Creates image and platform-specific content based on user brief
 */
router.post(
  '/generate-content',
  authMiddleware,
  checkFeatureAccess('ai_post_generation'),
  checkPostLimits,
  generateFromScratch
);

/**
 * Generate content from scratch (alias for backward compatibility)
 */
router.post(
  '/create-content-plan',
  authMiddleware,
  checkFeatureAccess('ai_post_generation'),
  checkPostLimits,
  generateFromScratch
);

/**
 * Customize template
 * Modifies existing template based on user requirements
 */
router.post(
  '/customize-template',
  authMiddleware,
  checkFeatureAccess('ai_post_generation'),
  checkPostLimits,
  generateFromTemplate
);

/**
 * Generate captions and hashtags for user-provided image
 * User uploads their own image and gets AI-generated content
 */
router.post(
  '/generate-caption-hashtags',
  authMiddleware,
  checkFeatureAccess('ai_post_generation'),
  checkPostLimits,
  generateCaptionHashtag
);

/* ======================================================
   UTILITY ROUTES (Regeneration & Single Operations)
====================================================== */

/**
 * Regenerate captions for existing post
 */
// In /regenerate-captions
router.post('/regenerate-captions', authMiddleware, async (req, res) => {
  try {
    const { postContent, platforms = ['instagram'], instruction, context } = req.body;

    if (!postContent) {
      return res.status(400).json({
        success: false,
        message: 'Post content is required.'
      });
    }

    const platformContent = {};

    for (const platform of platforms) {
      let prompt = `Generate ${platform} caption based on this content: ${JSON.stringify(postContent)}`;
      if (instruction) {
        prompt += `\n\nSpecific Instruction from user: ${instruction}\nPlease follow this specific instruction carefully when refining the caption.`;
      } else if (context) {
        prompt += `\n\nOriginal Creative Brief/Context: ${context}\nEnsure the caption aligns with this original goal.`;
      }

      prompt += `\n\nReturn JSON: { "caption": "string", "hashtags": ["string"] }`;
      const result = await generateWithGemini(prompt);
      platformContent[platform] = {
        caption: result.caption || 'New caption generated!',
        hashtags: result.hashtags || [`#${platform}`]
      };
    }

    return res.status(200).json({
      success: true,
      platforms: platformContent
    });
  } catch (error) {
    console.error('❌ Regenerate captions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate captions.',
      error: error.message
    });
  }
});

/**
 * Regenerate hashtags for existing caption
 */
router.post('/regenerate-hashtags', authMiddleware, async (req, res) => {
  try {
    const { platforms = ['instagram'], caption, instruction, context } = req.body;

    if (!caption) {
      return res.status(400).json({
        success: false,
        message: 'Caption is required.'
      });
    }

    const platformContent = {};

    for (const platform of platforms) {
      let prompt = `Generate hashtags for ${platform} based on: ${caption}`;

      if (instruction) {
        prompt += `\n\nSpecific Instruction from user: ${instruction}\nRefine the hashtags based on this instruction.`;
      } else if (context) {
        prompt += `\n\nOriginal Creative Brief/Context: ${context}\nGenerate a FRESH set of hashtags that are relevant to this original goal. Provide different hashtags than the ones implicitly associated with the caption if possible.`;
      }

      prompt += `\n\nReturn JSON: { "hashtags": ["string"] }`;
      const result = await generateWithGemini(prompt);
      platformContent[platform] = {
        hashtags: result.hashtags || [`#${platform}`, '#content']
      };
    }

    return res.status(200).json({
      success: true,
      platforms: platformContent
    });
  } catch (error) {
    console.error('❌ Regenerate hashtags error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate hashtags.',
      error: error.message
    });
  }
});

/**
 * Generate single image from prompt
 */
router.post('/generate-image', authMiddleware, async (req, res) => {
  try {
    const { aiImagePrompt, aspectRatio = '1:1', instruction, context } = req.body;

    if (!aiImagePrompt) {
      return res.status(400).json({
        success: false,
        message: 'Image prompt is required.'
      });
    }



    let finalPrompt = aiImagePrompt;
    if (instruction) {
      finalPrompt += `\n\nRefinement Instruction: ${instruction}\nApply this change to the image generation.`;
    } else if (context) {
      finalPrompt += `\n\nOriginal Creative Brief/Context: ${context}\nEnsure the image aligns with this original goal.`;
    }

    const imageDataUri = await callImageAI(finalPrompt, aspectRatio);

    return res.status(200).json({
      success: true,
      imageUrl: imageDataUri
    });
  } catch (error) {
    console.error('❌ Generate image error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate image.',
      error: error.message
    });
  }
});

module.exports = router;
