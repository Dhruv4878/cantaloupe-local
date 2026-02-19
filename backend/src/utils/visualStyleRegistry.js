/**
 * Visual Style Registry - Premium Art Directions
 * These styles are layered ON TOP of the structural templates to cure "generic" AI generation.
 */

const VISUAL_STYLES = {
  // ========================================
  // 1. PHOTOREALISTIC & CINEMATIC
  // ========================================
  CINEMATIC_REALISM: {
    id: "CINEMATIC_REALISM",
    name: "Cinematic Realism",
    description: "High-end photography with dramatic lighting and depth",
    positivePrompt: "Award-winning photography, cinematic lighting, 8k resolution, highly detailed, depth of field, bokeh, golden hour lighting, photorealistic textures, professional color grading, sharp focus.",
    negativePrompt: "cartoon, illustration, painting, drawing, bad quality, grainy, low resolution, plastic looking, fake, oversaturated, distorted, text errors, missing spaces, formatting mistakes, typos."
  },

  MODERN_CORPORATE: {
    id: "MODERN_CORPORATE",
    name: "Modern Corporate",
    description: "Clean, trustworthy business aesthetic",
    positivePrompt: "Professional corporate photography, clean bright lighting, modern office atmosphere, high quality stock photography style, authentic look, trustworthy, premium quality, sharp details.",
    negativePrompt: "dark, gloomy, cartoon, illustration, chaotic, messy, amateur, blurry, distorted, weird faces, bad hands, text formatting errors, missing punctuation spaces, concatenated words."
  },

  LIFESTYLE_WARMTH: {
    id: "LIFESTYLE_WARMTH",
    name: "Lifestyle Warmth",
    description: "Inviting, human-centric, natural light",
    positivePrompt: "Natural lifestyle photography, warm sunlight, candid atmosphere, authentic emotions, soft natural lighting, cozy feel, high resolution, sharp focus, magazine quality.",
    negativePrompt: "studio lighting, harsh shadows, cold colors, fake smiles, staged looking, cartoon, 3d render, plastic skin."
  },

  // ========================================
  // 2. ILLUSTRATION & ART
  // ========================================
  MINIMALIST_VECTOR: {
    id: "MINIMALIST_VECTOR",
    name: "Minimalist Vector",
    description: "Clean flat design, modern tech look",
    positivePrompt: "High quality flat vector illustration, clean lines, solid colors, modern tech aesthetic, start-up style, minimal design, isometric elements, smooth gradients, dribbble style.",
    negativePrompt: "photorealistic, photograph, grainy, textured, messy, sketch, rough, 3d render, complex shading, noise, distortion, text spacing errors, missing punctuation, formatting mistakes."
  },

  NEO_BRUTALISM: {
    id: "NEO_BRUTALISM",
    name: "Neo-Brutalism",
    description: "Bold, high-contrast, trendy web style",
    positivePrompt: "Neo-brutalism design style, high contrast, bold black outlines, vibrant solid colors, retro-modern aesthetic, geometric shapes, raw look, pop art influence, trendy web design style.",
    negativePrompt: "soft, gradient, blurry, low contrast, pastel, realistic, 3d, shiny, glossy, bevel."
  },

  "3D_RENDER_GLOSS": {
    id: "3D_RENDER_GLOSS",
    name: "3D Glossy Render",
    description: "Cute, soft 3D shapes, claymorphism",
    positivePrompt: "High quality 3D render, claymorphism style, soft rounded shapes, glossy plastic textures, bright studio lighting, soft shadows, octane render, blender 3d, cute aesthetic, vibrant colors.",
    negativePrompt: "2d, flat, drawing, sketch, rough, grainy, low poly, jagged edges, dark, realism, photography."
  },

  // ========================================
  // 3. LUXURY & ELEGANCE
  // ========================================
  LUXURY_MINIMAL: {
    id: "LUXURY_MINIMAL",
    name: "Luxury Minimal",
    description: "High-end, black/white/gold, sophisticated",
    positivePrompt: "Luxury minimalist design, elegant composition, premium aesthetic, black and gold color palette, sophisticated typography, high fashion style, marble textures, sharp details, expensive look.",
    negativePrompt: "cluttered, cheap, cartoon, colorful, neon, messy, childish, low quality, blurry, pixelated."
  },

  GLASSMORPHISM: {
    id: "GLASSMORPHISM",
    name: "Glassmorphism",
    description: "Frosted glass, translucent layers, modern",
    positivePrompt: "Glassmorphism design style, frosted glass effects, translucent layers, soft background blur, vivid gradients, floating elements, modern UI aesthetic, clean sophisticated look, technological.",
    negativePrompt: "opaque, flat, solid colors, retro, vintage, grunge, dirty, noise, grainy, rough textures."
  },

  // ========================================
  // 4. CREATIVE & VIBRANT
  // ========================================
  NEON_CYBERPUNK: {
    id: "NEON_CYBERPUNK",
    name: "Neon Cyberpunk",
    description: "Dark background, glowing neon, futuristic",
    positivePrompt: "Cyberpunk aesthetic, neon glowing lights, dark background, futuristic vibes, vibrant pink and blue colors, high contrast, cinematic atmosphere, synthwave style, digital art.",
    negativePrompt: "daylight, bright, sunny, vintage, sepia, dull, low contrast, flat, pastel colors."
  },

  VIBRANT_POP: {
    id: "VIBRANT_POP",
    name: "Vibrant Pop",
    description: "Energetic, colorful, bold",
    positivePrompt: "Vibrant pop art style, bold saturated colors, energetic composition, dynamic shapes, fun and playful atmosphere, high impact, advertising style, clear commercial look.",
    negativePrompt: "dull, muted, grey, sad, dark, horror, blurry, low quality, grainy, sketch."
  }
};

/**
 * Get all available visual styles
 */
function getAllVisualStyles() {
  return Object.values(VISUAL_STYLES).map(style => ({
    id: style.id,
    name: style.name,
    description: style.description
  }));
}

/**
 * Get style by ID
 */
function getStyleById(styleId) {
  return VISUAL_STYLES[styleId] || VISUAL_STYLES.MODERN_CORPORATE;
}

/**
 * Build style selection prompt for AI
 */
function buildStyleSelectionPrompt(brief, category) {
  const styleList = Object.values(VISUAL_STYLES)
    .map(s => `- ${s.id}: ${s.description}`)
    .join('\n');

  return `Select the single best VISUAL STYLE for a social media post based on the brief and category.

BRIEF: ${brief}
CATEGORY: ${category}

AVAILABLE STYLES:
${styleList}

Return ONLY valid JSON:
{
  "selectedStyleId": "STYLE_ID",
  "reasoning": "Brief explanation"
}`;
}

module.exports = {
  VISUAL_STYLES,
  getAllVisualStyles,
  getStyleById,
  buildStyleSelectionPrompt
};
