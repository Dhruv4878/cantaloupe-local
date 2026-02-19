const axios = require('axios');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
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
    "gemini-2.5-flash": { inputCost: 0.0001, outputCost: 0.0004 }, // Updated flash pricing
    "gemini-3-pro-image-preview": { cost: 0.008 }, // Gemini 3 Pro Image Preview pricing
    "gemini-2.5-flash-image": { cost: 0.004 }, // Estimating lower cost for flash image
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

/**
 * Generate content with Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @param {string} modelName - The model to use (default: gemini-2.5-pro)
 * @returns {Promise<Object>} Parsed JSON response
 */
const generateWithGemini = async (prompt, modelName = "gemini-2.5-pro") => {
  try {
    console.log(`🤖 Calling Gemini API (${modelName})...`);

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [{
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      }],
    });

    const result = await model.generateContent({
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

/**
 * Upload image to Cloudinary
 * @param {string} dataUri - Base64 data URI of the image
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadImageToCloudinary = async (dataUri) => {
  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: "social-media-posts",
    resource_type: "image",
  });
  return uploadResult.secure_url;
};

/**
 * Generate image with Gemini 3.0 Pro Image Preview
 * @param {string} prompt - Image generation prompt
 * @param {string} aspectRatio - Aspect ratio (e.g., "1:1", "16:9")
 * @param {string} negativePrompt - Negative prompt for generation
 * @param {Object} inputImage - Optional input image for image-to-image generation { base64: string, mimeType: string }
 * @param {string} modelParam - The model to use (default: gemini-3-pro-image-preview)
 * @returns {Promise<string>} Base64 data URI of generated image
 */
const callImageAI = async (prompt, aspectRatio = "1:1", negativePrompt = "", inputImage = null, modelParam = "gemini-3-pro-image-preview") => {
  const startTime = Date.now();
  const modelName = modelParam;

  // Handle cost tracking - if model not in tracking, default to pro price or 0
  const estimatedCost = COST_TRACKING.models[modelName]?.cost || 0.008;

  console.log(`🎨 [IMAGE GENERATION] Starting...`);
  console.log(`   📊 Model: ${modelName}`);
  console.log(`   💰 Estimated Cost: $${estimatedCost.toFixed(4)}`);
  console.log(`   📐 Aspect Ratio: ${aspectRatio}`);
  console.log(`   📝 Prompt Length: ${prompt.length} chars`);
  console.log(`   🚫 Negative Prompt: ${negativePrompt ? 'Yes (' + negativePrompt.length + ' chars)' : 'No'}`);

  try {
    // Construct URL based on model
    // Note: 'gemini-2.5-flash' might need a different endpoint or suffix if it differs from standard generateContent
    // For now assuming same structure for both as they are both generateContent
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

    // Build the prompt with aspect ratio and negative prompt if provided
    let fullPrompt = prompt;

    // Add aspect ratio to the prompt text since generationConfig doesn't support it
    if (aspectRatio && aspectRatio !== "1:1") {
      fullPrompt += `\n\nAspect ratio: ${aspectRatio}`;
    }

    if (negativePrompt) {
      fullPrompt += `\n\nNegative prompt (avoid these): ${negativePrompt}`;
    }

    // Construct request body in Gemini format
    const requestParts = [];

    // Add input image if provided (for image-to-image generation)
    if (inputImage && inputImage.base64 && inputImage.mimeType) {
      requestParts.push({
        inlineData: {
          mimeType: inputImage.mimeType,
          data: inputImage.base64
        }
      });
      console.log(`   🖼️  Input Image: Yes (${inputImage.mimeType})`);
    }

    // Add text prompt
    requestParts.push({ text: fullPrompt });

    const requestBody = {
      contents: [{
        parts: requestParts
      }],
      generationConfig: {
        responseModalities: ["IMAGE"],
        temperature: 0.7,
      }
    };

    const response = await axios.post(
      geminiUrl,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey
        },
        timeout: 120000,
      }
    );

    // Extract image from response
    const candidates = response?.data?.candidates || [];
    if (candidates.length === 0) throw new Error("No candidates returned from API");

    const parts = candidates[0]?.content?.parts || [];
    if (parts.length === 0) throw new Error("No parts in response");

    // Find the image part
    const imagePart = parts.find(part => part.inlineData);
    if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
      throw new Error("No image data in response");
    }

    const base64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";

    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.log(`✅ [IMAGE GENERATION] Success!`);
    console.log(`   ⏱️  Generation Time: ${generationTime}ms (${(generationTime / 1000).toFixed(2)}s)`);
    console.log(`   💰 Actual Cost: $${estimatedCost.toFixed(4)}`);
    console.log(`   📦 Image Size: ${(base64.length / 1024).toFixed(2)} KB (base64)`);
    console.log(`   🖼️  MIME Type: ${mimeType}`);

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    const endTime = Date.now();
    const generationTime = endTime - startTime;

    console.error(`❌ [IMAGE GENERATION] Failed after ${generationTime}ms`);
    console.error(`   📛 Error: ${error.message}`);
    console.error(`   🔍 Response Status: ${error.response?.status || 'N/A'}`);
    console.error(`   🔍 Response Data: ${error.response?.data ? JSON.stringify(error.response.data) : 'No additional details'}`);

    // Final fallback: SVG placeholder
    console.log(`⚠️  [IMAGE GENERATION] Returning fallback SVG placeholder`);
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

/**
 * Generate platform-specific content (caption and hashtags)
 * @param {string} platform - Platform name (instagram, facebook, linkedin, x)
 * @param {Object} contentStrategy - Content strategy object
 * @param {Object} visualConcept - Visual concept object
 * @param {string} modelName - Model to use
 * @returns {Promise<Object>} Platform content with caption and hashtags
 */
const callPlatformContentAI = async (platform, contentStrategy, visualConcept, modelName = 'gemini-2.5-pro') => {
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
  "hashtags": ["relevant", "hashtags"]
}`;

  const result = await generateWithGemini(prompt, modelName);
  return {
    caption: result.caption || `${contentStrategy.hook}\n\n${contentStrategy.coreValue}\n\n${contentStrategy.callToAction}`,
    hashtags: result.hashtags || [`#${platform}`, '#socialmedia']
  };
};

/**
 * Download and convert image to base64
 * @param {string} imageUrl - URL of the image to download
 * @returns {Promise<Object>} Object with base64 and mimeType
 */
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

/**
 * Generate analytics for the created content
 * @param {string} prompt - The user's original prompt/brief
 * @param {string} generatedContent - A summary of what was generated
 * @param {string} modelName - Model to use
 * @returns {Promise<Object>} Analytics object
 */
const generateContentAnalytics = async (prompt, generatedContent, modelName = 'gemini-2.5-flash') => {
  const analyticsPrompt = `Analyze the interaction between a user's prompt and the AI-generated content.
  
  User Prompt: "${prompt}"
  
  Generated Content Summary: "${generatedContent}"
  
  Provide a JSON evaluation with the following metrics:
  1. rating: An overall score from 1-100 based on prompt clarity and result quality.
  2. accuracy: A percentage (0-100) representing how well the content matches the prompt's intent.
  3. understanding: A percentage (0-100) representing how well the AI grasped the nuances.
  4. tips: An array of 1-2 short, actionable tips for the user to improve their prompting next time.
  
  Return ONLY valid JSON:
  {
    "rating": 85,
    "accuracy": 90,
    "understanding": 88,
    "tips": ["Tip 1", "Tip 2"]
  }`;

  try {
    const result = await generateWithGemini(analyticsPrompt, modelName);
    return {
      rating: result.rating || 0,
      accuracy: result.accuracy || 0,
      understanding: result.understanding || 0,
      tips: result.tips || ["Try adding more specific details next time."]
    };
  } catch (error) {
    console.error("❌ Analytics Generation Error:", error.message);
    return {
      rating: 0,
      accuracy: 0,
      understanding: 0,
      tips: ["Could not generate analytics at this time."]
    };
  }
};

module.exports = {
  COST_TRACKING,
  generateWithGemini,
  uploadImageToCloudinary,
  callImageAI,
  callPlatformContentAI,
  downloadImageAsBase64,
  generateContentAnalytics, // Exporting the new function
  genAI
};
