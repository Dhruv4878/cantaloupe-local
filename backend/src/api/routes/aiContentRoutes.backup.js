const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middlewares/authMiddleware');
require('dotenv').config();

// --- Configurations ---
const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(geminiApiKey);
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const imageModel = genAI.getGenerativeModel({ model: "imagen-4.0-generate-001" });

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
 * Returns a Data URI string (Base64) which Cloudinary accepts just like a URL.
 */
const callImageAI = async (prompt) => {
  try {
    // For now, use placeholder since Imagen integration requires more complex setup
    // You can implement actual image generation later with proper Imagen SDK
    console.log("Image generation requested for prompt:", prompt);

    // Return a placeholder image URL
    const placeholderImageUrl = "https://via.placeholder.com/512x512/4285f4/ffffff?text=Generated+Image";
    return placeholderImageUrl;
  } catch (error) {
    console.error("Image generation error:", error.message);
    throw new Error("Failed to generate image.");
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
 * A specialized helper to get only hashtags for a specific platform.
 */
const callHashtagAI = async (platform, postContent) => {
  const currentYear = new Date().getFullYear();
  const prompt = `
    Based on the following social media post, generate a JSON object with a single key "hashtags".
    The value should be an array of 5-7 viral and trending hashtags tailored specifically for the ${platform} platform.
    Prefer up-to-date, currently trending tags. If you include year-specific tags, use ${currentYear}, not any past year.
    Avoid outdated or stale years.
    
    Post Content: """${postContent}"""
    
    Your final output must be only the JSON object.
  `;

  try {
    // Use Gemini SDK for text generation
    const result = await textModel.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    // Parse Gemini response
    const response = await result.response;
    let parsedResult = JSON.parse(response.text());

    // Data cleaning for hashtags (Logic preserved from your code)
    const sanitizeHashtags = (list) => {
      const yearRegex = /(19|20)\d{2}/g;
      const targetYear = String(currentYear);
      const normalized = (list || [])
        .map(tag => tag?.toString()?.trim())
        .filter(Boolean)
        .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
        .map(tag => tag.replace(yearRegex, targetYear))
        .map(tag => tag.replace(/\s+/g, ''));
      const seen = new Set();
      const unique = [];
      for (const tag of normalized) {
        const lower = tag.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          unique.push(tag);
        }
      }
      return unique;
    };

    if (parsedResult.hashtags && typeof parsedResult.hashtags === 'string') {
      parsedResult.hashtags = parsedResult.hashtags.split(',');
    }
    parsedResult.hashtags = sanitizeHashtags(parsedResult.hashtags);
    return parsedResult;
  } catch (error) {
    console.error(`Error in callHashtagAI for ${platform}:`, error.response?.data || error.message);
    return { hashtags: [] }; // Fallback
  }
};

/**
 * Generate a platform-specific caption and hashtags from a universal postContent.
 */
const callPlatformContentAI = async (platform, postContent) => {
  const currentYear = new Date().getFullYear();
  const prompt = `Generate a JSON object for a ${platform} post with keys "caption" and "hashtags".
  - caption: Rewrite the post for ${platform} tone, length, and style.
  - hashtags: 5-7 viral, platform-appropriate tags as an array. Prefer current/trending tags; if you include year-specific tags, use ${currentYear}.
  Only return JSON.

  Post Content: """${postContent}"""`;

  try {
    // Use Gemini SDK for text generation
    const result = await textModel.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    // Parse Gemini response
    const response = await result.response;
    const parsedResult = JSON.parse(response.text());

    const normalized = { caption: parsedResult.caption || postContent, hashtags: [] };
    const yearRegex = /(19|20)\d{2}/g;
    const targetYear = String(currentYear);
    const toList = (val) => Array.isArray(val) ? val : typeof val === 'string' ? val.split(',') : [];

    normalized.hashtags = toList(parsedResult.hashtags)
      .map(h => h?.toString()?.trim())
      .filter(Boolean)
      .map(h => h.startsWith('#') ? h : `#${h}`)
      .map(h => h.replace(yearRegex, targetYear))
      .map(h => h.replace(/\s+/g, ''));

    const uniqueSet = new Set();
    normalized.hashtags = normalized.hashtags.filter(h => {
      const key = h.toLowerCase();
      if (uniqueSet.has(key)) return false;
      uniqueSet.add(key);
      return true;
    });
    return normalized;
  } catch (error) {
    console.error(`Error in callPlatformContentAI for ${platform}:`, error.response?.data || error.message);
    return { caption: postContent, hashtags: [] }; // Fallback
  }
};


// =================================================================
// --- SPLIT API ENDPOINTS ---
// =================================================================
// Apply auth per-route so this router doesn't block unrelated /api/* paths

// Text-first endpoint: returns postContent, aiImagePrompt, and per-platform hashtags (no image generation)
router.post('/create-text-plan', authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;

  if (!brief || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'A brief and at least one platform are required.' });
  }

  try {
    // --- Step 1: Generate the main content and image prompt ONCE ---
    const mainContentPrompt = `
      Based on the following creative brief, generate a JSON object with two keys: "postContent" and "aiImagePrompt".
      The "postContent" should be a universally engaging caption suitable for multiple social media platforms.
      The "aiImagePrompt" should be a detailed prompt for generating an AI image.
      Creative Brief: "${brief}"
      Your final output must be only the JSON object.
    `;

    const mainContentResponse = await axios.post(geminiTextUrl, {
      contents: [{ parts: [{ text: mainContentPrompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    }, { headers: { 'Content-Type': 'application/json' } });

    const { postContent, aiImagePrompt } = JSON.parse(mainContentResponse.data.candidates[0].content.parts[0].text);

    // --- Step 2: For each platform, generate tailored caption + hashtags ---
    const platformPromises = platforms.map(platform => callPlatformContentAI(platform, postContent));
    const platformResults = await Promise.all(platformPromises);

    // --- Step 3: Combine everything into the response (no image yet) ---
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

// Image generation endpoint: accepts aiImagePrompt and returns a hosted imageUrl
router.post('/generate-image', authMiddleware, async (req, res) => {
  const { aiImagePrompt } = req.body;
  if (!aiImagePrompt || typeof aiImagePrompt !== 'string') {
    return res.status(400).json({ error: 'aiImagePrompt is required.' });
  }
  try {
    const tempImageSource = await callImageAI(aiImagePrompt); // Now returns Data URI
    const finalImageUrl = await uploadImageToCloudinary(tempImageSource);
    return res.status(200).json({ imageUrl: finalImageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Failed to generate image.' });
  }
});

// Regenerate platform captions from a base postContent
router.post('/regenerate-captions', authMiddleware, async (req, res) => {
  const { postContent, platforms } = req.body || {};
  if (!postContent || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
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

// Regenerate platform hashtags from either a base postContent or a provided caption per platform
router.post('/regenerate-hashtags', authMiddleware, async (req, res) => {
  const { postContent, platforms, caption } = req.body || {};
  if ((!postContent && !caption) || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'platforms[] and postContent or caption are required.' });
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

// Backward-compatible endpoint: keeps old behavior (text + image together)
router.post('/create-content-plan', authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;

  if (!brief || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return res.status(400).json({ error: 'A brief and at least one platform are required.' });
  }

  try {
    // --- Step 1: Generate the main content and image prompt ONCE ---
    const mainContentPrompt = `
      Based on the following creative brief, generate a JSON object with two keys: "postContent" and "aiImagePrompt".
      The "postContent" should be a universally engaging caption suitable for multiple social media platforms.
      The "aiImagePrompt" should be a highly detailed description for an AI image generator to create a visual for this post.
      Creative Brief: "${brief}"
      Your final output must be only the JSON object.
    `;

    const mainContentResponse = await axios.post(geminiTextUrl, {
      contents: [{ parts: [{ text: mainContentPrompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    }, { headers: { 'Content-Type': 'application/json' } });

    const { postContent, aiImagePrompt } = JSON.parse(mainContentResponse.data.candidates[0].content.parts[0].text);

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