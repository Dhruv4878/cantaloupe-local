const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middlewares/authMiddleware');
require('dotenv').config();

/* ======================================================
   CONFIGURATION
====================================================== */

const geminiApiKey = process.env.GEMINI_API_KEY;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Gemini 2.5 Flash – text intelligence
const textModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ======================================================
   GEMINI TEXT HELPER
====================================================== */

const generateWithGemini = async (prompt) => {
  const result = await textModel.generateContent({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const response = await result.response;
  return JSON.parse(response.text());
};

/* ======================================================
   IMAGE GENERATION (IMAGEN 4.0 STANDARD)
====================================================== */

const callImageAI = async (prompt) => {
  try {
    console.log("Generating image with Imagen 4.0...");

    const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${geminiApiKey}`;

    const response = await axios.post(
      imagenUrl,
      {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    const prediction = response?.data?.predictions?.[0];
    const base64 =
      prediction?.bytesBase64Encoded || prediction?.b64 || null;

    if (!base64) throw new Error("Invalid Imagen response");

    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error("Imagen Error:", err.response?.data || err.message);

    return (
      "data:image/svg+xml;base64," +
      Buffer.from(`
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-size="32" text-anchor="middle" fill="#111">
          IMAGE GENERATION FAILED
        </text>
      </svg>
    `).toString("base64")
    );
  }
};

const uploadImageToCloudinary = async (imageSource) => {
  const result = await cloudinary.uploader.upload(imageSource, {
    folder: "social-agency-posts",
  });
  return result.secure_url;
};

/* ======================================================
   HASHTAGS (ENGAGEMENT ONLY)
====================================================== */

const callHashtagAI = async (platform, postContent) => {
  const year = new Date().getFullYear();

  const prompt = `
Act as a Social Media Growth Expert.
Generate 7–10 relevant engagement hashtags for a ${platform} post.

Topic:
"${postContent}"

Rules:
- Mix niche + broad
- No spam
- Include #${year} only if relevant

Output JSON:
{ "hashtags": ["#tag"] }
`;

  try {
    const parsed = await generateWithGemini(prompt);
    return {
      hashtags: (parsed.hashtags || [])
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .slice(0, 10),
    };
  } catch {
    return { hashtags: [] };
  }
};

/* ======================================================
   PLATFORM-SPECIFIC CAPTIONS
====================================================== */

const callPlatformContentAI = async (platform, postContent) => {
  const prompt = `
Act as a professional copywriter for ${platform}.

Adapt this content:
"${postContent}"

Rules:
- Hook → Value → CTA
- Match platform tone
- Clear and human

Return JSON:
{
  "caption": "string",
  "hashtags": ["string"]
}
`;

  try {
    const parsed = await generateWithGemini(prompt);
    return {
      caption: parsed.caption || postContent,
      hashtags: parsed.hashtags || [],
    };
  } catch {
    return { caption: postContent, hashtags: [] };
  }
};

/* ======================================================
   🔥 CENTRAL INTELLIGENT PROMPT (IMAGE + TEXT)
====================================================== */

const generateMainContentPrompt = (brief) => {
  return `
You are a Senior Visual Content Strategist at a professional social media agency.

USER BRIEF:
"${brief}"

--------------------------------------------------
INTELLIGENCE RULES
--------------------------------------------------

- If the brief is detailed → follow it exactly
- If vague → intelligently structure the topic
- Never assume industry unless implied
- Image must VISUALLY EXPLAIN the topic

--------------------------------------------------
IMAGE STRUCTURE LOGIC
--------------------------------------------------

Choose ONE automatically:
• STEP FLOW
• PILLAR GRID
• COMPARISON
• FRAMEWORK

--------------------------------------------------
TEXT RULES (IMAGE)
--------------------------------------------------

- Keywords only (max 3 words)
- ALL CAPS
- No sentences
- No punctuation

--------------------------------------------------
STYLE
--------------------------------------------------

- Canva / Figma style
- Flat vector
- Professional
- Mobile readable
- No watermark

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return JSON ONLY:

{
  "postContent": "string",
  "aiImagePrompt": "string"
}

--------------------------------------------------
aiImagePrompt FORMAT
--------------------------------------------------

"A clean, professional Canva-style infographic.
Topic: [REFINED USER TOPIC].

Layout:
[CHOSEN STRUCTURE] with balanced spacing.

Title:
[SHORT TITLE IN ALL CAPS]

Sections:
Each includes:
- Simple flat icon
- Bold uppercase keyword (max 3 words)

Design Style:
Flat vector, minimal, modern.
Bold sans-serif typography.
High contrast.

Background:
Solid or subtle gradient.

Rules:
No sentences.
No small text.
No clutter.
No watermark."

--------------------------------------------------
postContent RULES
--------------------------------------------------

- Explain what the image shows
- Expand each section in 1–2 lines
- Clear flow
- Soft CTA at end

Return JSON ONLY.
`;
};

/* ======================================================
   API ROUTES
====================================================== */

// 1. TEXT PLAN ONLY
router.post("/create-text-plan", authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;
  if (!brief || !platforms?.length)
    return res.status(400).json({ error: "Brief required" });

  try {
    const { postContent, aiImagePrompt } =
      await generateWithGemini(generateMainContentPrompt(brief));

    const platformResults = await Promise.all(
      platforms.map((p) => callPlatformContentAI(p, postContent))
    );

    const response = {
      postContent,
      aiImagePrompt,
      imageUrl: null,
      platforms: {},
    };

    platforms.forEach((p, i) => {
      response.platforms[p] = platformResults[i];
    });

    res.json(response);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate text plan" });
  }
});

// 2. IMAGE ONLY
router.post("/generate-image", authMiddleware, async (req, res) => {
  const { aiImagePrompt } = req.body;
  if (!aiImagePrompt)
    return res.status(400).json({ error: "Prompt required" });

  try {
    const img = await callImageAI(aiImagePrompt);
    const url = await uploadImageToCloudinary(img);
    res.json({ imageUrl: url });
  } catch {
    res.status(500).json({ error: "Image generation failed" });
  }
});

// 3. FULL PIPELINE
router.post("/create-content-plan", authMiddleware, async (req, res) => {
  const { brief, platforms } = req.body;
  if (!brief || !platforms)
    return res.status(400).json({ error: "Brief required" });

  try {
    const { postContent, aiImagePrompt } =
      await generateWithGemini(generateMainContentPrompt(brief));

    const img = await callImageAI(aiImagePrompt);
    const imageUrl = await uploadImageToCloudinary(img);

    const hashtagResults = await Promise.all(
      platforms.map((p) => callHashtagAI(p, postContent))
    );

    const response = {
      postContent,
      imageUrl,
      platforms: {},
    };

    platforms.forEach((p, i) => {
      response.platforms[p] = hashtagResults[i];
    });

    res.json(response);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Content generation failed" });
  }
});

// 4. REGENERATE CAPTIONS
router.post("/regenerate-captions", authMiddleware, async (req, res) => {
  const { postContent, platforms } = req.body;

  const results = await Promise.all(
    platforms.map((p) => callPlatformContentAI(p, postContent))
  );

  const out = { platforms: {} };
  platforms.forEach((p, i) => (out.platforms[p] = results[i]));
  res.json(out);
});

// 5. REGENERATE HASHTAGS
router.post("/regenerate-hashtags", authMiddleware, async (req, res) => {
  const { postContent, platforms } = req.body;

  const results = await Promise.all(
    platforms.map((p) => callHashtagAI(p, postContent))
  );

  const out = { platforms: {} };
  platforms.forEach((p, i) => (out.platforms[p] = results[i]));
  res.json(out);
});

module.exports = router;
