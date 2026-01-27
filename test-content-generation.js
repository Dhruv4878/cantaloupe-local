const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

const textModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
});

async function testContentGeneration() {
  const brief = "generate a post as I'm a gym trainer";
  const brandAssets = {
    businessName: 'FitLife Gym',
    businessType: 'Fitness',
    brandVoice: 'Professional yet approachable'
  };

  const contentPrompt = `
Based on the following creative brief and context, generate a JSON object with two keys: "postContent" and "aiImagePrompt".

CREATIVE BRIEF: "${brief}"

BRAND CONTEXT:
- Business: ${brandAssets.businessName || 'Professional Brand'}
- Industry: ${brandAssets.businessType || 'General'}
- Voice: ${brandAssets.brandVoice || 'Professional yet approachable'}

AUDIENCE: General audience
CAMPAIGN TYPE: Brand awareness
TEMPLATE: Fitness Challenge

REQUIREMENTS:
- "postContent": Create an engaging, professional social media caption (150-300 characters)
- "aiImagePrompt": Create a detailed visual description for image generation
- Use appropriate tone for the brand and audience
- Make it compelling and action-oriented
- Include relevant context from the brief

Your response must be ONLY a valid JSON object with these two keys.`;

  try {
    console.log("🤖 TESTING GEMINI CONTENT GENERATION...");
    console.log("📝 INPUT BRIEF:", brief);
    console.log("🏢 BRAND ASSETS:", brandAssets);

    const result = await textModel.generateContent(contentPrompt);
    const response = result.response;
    const contentText = response.text();

    console.log("📝 RAW GEMINI RESPONSE:", contentText);
    console.log("📏 RESPONSE LENGTH:", contentText.length);

    // Clean the response text
    let cleanedText = contentText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    console.log("🧹 CLEANED RESPONSE:", cleanedText);

    // Parse the JSON response
    const parsedContent = JSON.parse(cleanedText);

    console.log("✅ PARSED CONTENT:", parsedContent);
    console.log("📝 POST CONTENT:", parsedContent.postContent);
    console.log("🎨 IMAGE PROMPT:", parsedContent.aiImagePrompt);

  } catch (error) {
    console.error("❌ CONTENT GENERATION FAILED:", error.message);
    console.error("🔍 ERROR DETAILS:", error);
  }
}

testContentGeneration();