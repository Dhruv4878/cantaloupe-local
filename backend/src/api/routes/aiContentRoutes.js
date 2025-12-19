const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middlewares/authMiddleware');
require('dotenv').config();

// --- Configurations ---
const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(geminiApiKey);
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper function to generate content with Gemini SDK
const generateWithGemini = async (prompt) => {
  const result = await textModel.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7
    }
  });
  const response = await result.response;
  return JSON.parse(response.text());
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =================================================================
// --- HELPER FUNCTIONS ---
// =================================================================

/**
 * Calls the Gemini Imagen 4 API for image generation.
 * Returns a Data URI string (Base64).
 */
const callImageAI = async (prompt) => {
  try {
    console.log("Image generation requested for prompt:", prompt);

    // Use Gemini Imagen API
    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiApiKey}`;

    const response = await axios.post(
      imagenUrl,
      {
        instances: [{ prompt: prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_only_high",
          personGeneration: "allow_adult"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 60000 
      }
    );

    if (response.data && response.data.predictions && response.data.predictions[0]) {
      const base64String = response.data.predictions[0].bytesBase64Encoded;
      if (base64String) {
        return `data:image/png;base64,${base64String}`;
      }
    }

    throw new Error("No image data received from Imagen API");
  } catch (error) {
    console.error("Gemini Imagen API Error:", error.response?.data || error.message);
    
    // Fallback placeholder if generation fails
    const fallbackBase64 = "data:image/svg+xml;base64," + Buffer.from(`
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="#333"/>
        <text x="256" y="256" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">Image Generation Failed</text>
      </svg>
    `).toString('base64');
    return fallbackBase64;
  }
};

/**
 * Uploads an image from a URL or Base64 Data URI to Cloudinary.
 */
const uploadImageToCloudinary = async (imageSource) => {
  try {
    const result = await cloudinary.uploader.upload(imageSource, {
      folder: "post-generator-images",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary.");
  }
};

/**
 * Helper to get hashtags specific to a platform
 */
const callHashtagAI = async (platform, postContent) => {
  const currentYear = new Date().getFullYear();
  const prompt = `
    Act as a Social Media Growth Strategist.
    Analyze the following post content and generate 5-7 high-performing hashtags for ${platform}.
    
    Rules:
    1. Mix "Broad Reach" tags (for volume) with "Niche Specific" tags (for targeting).
    2. Tags must be strictly relevant to the content provided.
    3. If year-specific, use ${currentYear}.
    
    Post Content: """${postContent}"""
    
    Output JSON object: { "hashtags": ["#tag1", "#tag2", ...] }
  `;

  try {
    const parsedResult = await generateWithGemini(prompt);

    // Clean up hashtags
    const sanitizeHashtags = (list) => {
      const yearRegex = /(19|20)\d{2}/g;
      const targetYear = String(currentYear);
      const normalized = (list || [])
        .map(tag => tag?.toString()?.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .map(tag => tag.replace(yearRegex, targetYear))
        .map(tag => tag.replace(/\s+/g, ''));
      return [...new Set(normalized)]; // remove duplicates
    };

    let tags = parsedResult.hashtags;
    if (typeof tags === 'string') tags = tags.split(',');
    
    return { hashtags: sanitizeHashtags(tags) };
  } catch (error) {
    console.error(`Error in callHashtagAI for ${platform}:`, error);
    return { hashtags: [] };
  }
};

/**
 * Generate platform-specific caption + hashtags
 */
const callPlatformContentAI = async (platform, postContent) => {
  const currentYear = new Date().getFullYear();
  const prompt = `
    Act as a Senior Social Media Copywriter for ${platform}.
    Adapt the following master content into a native ${platform} post.

    Requirements:
    - **caption**: Rewrite to fit ${platform}'s vibe (e.g., LinkedIn = Professional/Storytelling; Instagram = Visual/Engaging; Twitter = Punchy/Thread).
    - **Structure**: Use a Hook -> Value -> Call to Action (CTA) structure.
    - **hashtags**: 5-7 optimized tags.
    
    Master Content: """${postContent}"""
    
    Output JSON: { "caption": "string", "hashtags": ["string"] }
  `;

  try {
    const parsedResult = await generateWithGemini(prompt);
    
    // Clean hashtags logic (same as above)
    const sanitizeHashtags = (list) => {
      const yearRegex = /(19|20)\d{2}/g;
      const targetYear = String(currentYear);
      const normalized = (list || [])
        .map(tag => tag?.toString()?.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .map(tag => tag.replace(yearRegex, targetYear))
        .map(tag => tag.replace(/\s+/g, ''));
      return [...new Set(normalized)];
    };

    let tags = parsedResult.hashtags;
    if (typeof tags === 'string') tags = tags.split(',');

    return { 
      caption: parsedResult.caption || postContent, 
      hashtags: sanitizeHashtags(tags) 
    };
  } catch (error) {
    console.error(`Error in callPlatformContentAI for ${platform}:`, error);
    return { caption: postContent, hashtags: [] };
  }
};


// =================================================================
// --- SPLIT API ENDPOINTS ---
// =================================================================

// 1. Text Plan (Content + Image Prompt, no Image Generation)
router.post('/create-text-plan', authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;

  if (!brief || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'A brief and at least one platform are required.' });
  }

  try {
    // --- Step 1: Generate Content & Dynamic Image Prompt ---
    // This prompt enforces "Agency Standards" on ANY brief provided by the user.
    const mainContentPrompt = `
      Act as a Creative Director at a top-tier Social Media Agency.
      Your task is to turn the following User Brief into a high-converting social media campaign.

      User Brief: "${brief}"

      Generate a JSON object with two keys: "postContent" and "aiImagePrompt".

      1. **postContent**: Write a master caption that is educational, engaging, and solves a problem.
         - Framework: Hook -> Value/Insight -> Call to Action.
         - Tone: Professional, authoritative, yet accessible.

      2. **aiImagePrompt**: Write a highly detailed text-to-image prompt.
         - **Dynamic Branding**: IF the user brief mentions a specific brand name, logo, or color, YOU MUST include instructions to place that logo/name on the image and use those colors. 
         - **No Branding Provided?**: If the brief implies no specific brand, choose a color palette and style that psychologically fits the topic (e.g., Blue for Tech, Green for Wellness, Orange for Energy) but keep it "High-End".
         - **Visual Metaphor**: Do not create generic "stock" images. create a sophisticated visual metaphor that explains the concept visually. 
         - **Quality Keywords**: Include keywords like: "Cinematic lighting, 8k resolution, editorial photography, shallow depth of field, premium texture, sharp focus, rule of thirds".
         - **Goal**: The image must look like a $5000 custom agency design, not a quick AI generation.

      Output JSON only.
    `;

    const { postContent, aiImagePrompt } = await generateWithGemini(mainContentPrompt);

    // --- Step 2: Tailor for Platforms ---
    const platformPromises = platforms.map(platform => callPlatformContentAI(platform, postContent));
    const platformResults = await Promise.all(platformPromises);

    // --- Step 3: Response ---
    const finalResponse = {
      postContent: postContent,
      aiImagePrompt,
      imageUrl: null,
      platforms: {},
    };

    platforms.forEach((platform, index) => {
      finalResponse.platforms[platform] = {
        caption: platformResults[index].caption,
        hashtags: platformResults[index].hashtags,
      };
    });

    res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Error in text plan generation:', error);
    res.status(500).json({ error: 'Failed to generate text content.' });
  }
});

// 2. Generate Image (Takes the prompt from step 1)
router.post('/generate-image', authMiddleware, async (req, res) => {
  const { aiImagePrompt } = req.body;
  if (!aiImagePrompt || typeof aiImagePrompt !== 'string') {
    return res.status(400).json({ error: 'aiImagePrompt is required.' });
  }
  try {
    const tempImageSource = await callImageAI(aiImagePrompt);
    const finalImageUrl = await uploadImageToCloudinary(tempImageSource);
    return res.status(200).json({ imageUrl: finalImageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image.' });
  }
});

// 3. Regenerate Captions
router.post('/regenerate-captions', authMiddleware, async (req, res) => {
  const { postContent, platforms } = req.body || {};
  if (!postContent || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({ error: 'postContent and platforms[] are required.' });
  }
  try {
    const results = await Promise.all(platforms.map(p => callPlatformContentAI(p, postContent)));
    const out = { platforms: {} };
    platforms.forEach((p, i) => {
      out.platforms[p] = { caption: results[i].caption, hashtags: results[i].hashtags };
    });
    return res.status(200).json(out);
  } catch (e) {
    console.error('Error regenerating captions:', e);
    return res.status(500).json({ error: 'Failed to regenerate captions.' });
  }
});

// 4. Regenerate Hashtags
router.post('/regenerate-hashtags', authMiddleware, async (req, res) => {
  const { postContent, platforms, caption } = req.body || {};
  if ((!postContent && !caption) || !platforms || !Array.isArray(platforms)) {
    return res.status(400).json({ error: 'platforms[] and postContent (or caption) are required.' });
  }
  try {
    const baseText = caption || postContent;
    const results = await Promise.all(platforms.map((p) => callHashtagAI(p, baseText)));
    const out = { platforms: {} };
    platforms.forEach((p, i) => {
      out.platforms[p] = { hashtags: results[i].hashtags };
    });
    return res.status(200).json(out);
  } catch (e) {
    console.error('Error regenerating hashtags:', e);
    return res.status(500).json({ error: 'Failed to regenerate hashtags.' });
  }
});

// 5. Full "One Step Solution" (Text + Image + Platforms)
router.post('/create-content-plan', authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;

  if (!brief || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'A brief and at least one platform are required.' });
  }

  try {
    // --- Step 1: Generate Content & Dynamic Image Prompt ---
    // Identical "Agency Standard" logic as above
    const mainContentPrompt = `
      Act as a Creative Director at a top-tier Social Media Agency.
      Your task is to turn the following User Brief into a high-converting social media campaign.

      User Brief: "${brief}"

      Generate a JSON object with two keys: "postContent" and "aiImagePrompt".

      1. **postContent**: Write a master caption that is educational, engaging, and solves a problem.
         - Framework: Hook -> Value/Insight -> Call to Action.
         - Tone: Professional, authoritative, yet accessible.

      2. **aiImagePrompt**: Write a highly detailed text-to-image prompt.
         - **Dynamic Branding**: IF the user brief mentions a specific brand name, logo, or color, YOU MUST include instructions to place that logo/name on the image and use those colors. 
         - **No Branding Provided?**: If the brief implies no specific brand, choose a color palette and style that psychologically fits the topic (e.g., Blue for Tech, Green for Wellness, Orange for Energy) but keep it "High-End".
         - **Visual Metaphor**: Do not create generic "stock" images. create a sophisticated visual metaphor that explains the concept visually. 
         - **Quality Keywords**: Include keywords like: "Cinematic lighting, 8k resolution, editorial photography, shallow depth of field, premium texture, sharp focus, rule of thirds".
         - **Goal**: The image must look like a $5000 custom agency design, not a quick AI generation.

      Output JSON only. 
    `;

    const { postContent, aiImagePrompt } = await generateWithGemini(mainContentPrompt);

    // --- Step 2: Generate and upload the single image ONCE ---
    const tempImageSource = await callImageAI(aiImagePrompt);
    const finalImageUrl = await uploadImageToCloudinary(tempImageSource);

    // --- Step 3: Loop through platforms to get unique hashtags ---
    const hashtagPromises = platforms.map(platform => callHashtagAI(platform, postContent));
    const hashtagResults = await Promise.all(hashtagPromises);

    // --- Step 4: Combine everything into the final response ---
    const finalResponse = {
      postContent: postContent,
      imageUrl: finalImageUrl,
      platforms: {},
    };

    platforms.forEach((platform, index) => {
      finalResponse.platforms[platform] = {
        hashtags: hashtagResults[index].hashtags,
      };
    });

    res.status(200).json(finalResponse);

  } catch (error) {
    console.error('Error in the full content pipeline:', error);
    res.status(500).json({ error: 'Failed to generate content.' });
  }
});

module.exports = router;