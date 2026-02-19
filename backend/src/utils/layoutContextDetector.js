/**
 * Layout Context Detector - Context-Aware Design System
 * Analyzes brief for context keywords and returns appropriate layout modifiers
 */

// Context definitions with keywords and design patterns
const LAYOUT_CONTEXTS = {
  FITNESS_GYM: {
    id: 'FITNESS_GYM',
    name: 'Fitness & Gym',
    keywords: ['gym', 'fitness', 'workout', 'exercise', 'muscle', 'strength', 'training', 'bodybuilding', 'crossfit', 'cardio', 'weightlifting'],
    layoutModifiers: {
      positivePrompt: `Dynamic fitness aesthetic with energy and movement. Bold impactful typography suggesting strength and determination. Vibrant motivational colors like energetic orange, powerful red, or electric blue. Clean modern design with athletic visual elements. High-energy composition with dynamic angles and powerful visual hierarchy.`,
      negativePrompt: `weak, passive, static, dull colors, boring layout, corporate stiffness, low energy`
    }
  },

  FOOD_RESTAURANT: {
    id: 'FOOD_RESTAURANT',
    name: 'Food & Restaurant',
    keywords: ['food', 'restaurant', 'menu', 'cuisine', 'dining', 'chef', 'recipe', 'meal', 'cafe', 'brunch', 'dinner', 'lunch', 'appetizer', 'dessert'],
    layoutModifiers: {
      positivePrompt: `Appetizing food photography style with warm inviting atmosphere. Rich warm color palette with golden tones and natural lighting. Elegant yet approachable typography. Cozy inviting composition with focus on warmth and hospitality. Professional food presentation aesthetic.`,
      negativePrompt: `cold colors, unappetizing, clinical, sterile, harsh lighting, uninviting`
    }
  },

  BUSINESS_CORPORATE: {
    id: 'BUSINESS_CORPORATE',
    name: 'Business & Corporate',
    keywords: ['business', 'corporate', 'professional', 'company', 'enterprise', 'quarterly', 'revenue', 'growth', 'strategy', 'meeting', 'executive', 'management'],
    layoutModifiers: {
      positivePrompt: `Clean professional corporate aesthetic conveying trust and authority. Sophisticated color palette with corporate blues, professional grays, and premium accents. Modern business typography with clear hierarchy. Trustworthy polished composition with balanced professional layout.`,
      negativePrompt: `casual, unprofessional, chaotic, messy, childish, playful, informal`
    }
  },

  TECH_STARTUP: {
    id: 'TECH_STARTUP',
    name: 'Tech & Startup',
    keywords: ['tech', 'technology', 'startup', 'innovation', 'app', 'software', 'digital', 'ai', 'saas', 'platform', 'developer', 'coding', 'launch'],
    layoutModifiers: {
      positivePrompt: `Modern sleek tech aesthetic with innovative forward-thinking vibe. Contemporary color scheme with gradients and vibrant tech colors. Clean geometric shapes and minimalist modern design. Futuristic yet approachable composition with smart use of negative space.`,
      negativePrompt: `outdated, traditional, vintage, analog, old-fashioned, dull, conservative`
    }
  },

  WELLNESS_HEALTH: {
    id: 'WELLNESS_HEALTH',
    name: 'Wellness & Health',
    keywords: ['wellness', 'health', 'medical', 'healthcare', 'doctor', 'therapy', 'meditation', 'yoga', 'mindfulness', 'mental health', 'wellbeing'],
    layoutModifiers: {
      positivePrompt: `Calming trustworthy health aesthetic with professional medical credibility. Soothing color palette with healing greens, calming blues, and clean whites. Clear readable typography conveying trust. Balanced serene composition with clean professional medical design.`,
      negativePrompt: `alarming, chaotic, unprofessional, scary, harsh, aggressive, untrustworthy`
    }
  },

  CREATIVE_ARTS: {
    id: 'CREATIVE_ARTS',
    name: 'Creative & Arts',
    keywords: ['creative', 'art', 'design', 'artist', 'photography', 'illustration', 'graphic', 'portfolio', 'studio', 'gallery', 'exhibition'],
    layoutModifiers: {
      positivePrompt: `Bold creative artistic aesthetic with unique visual personality. Vibrant expressive color palette with artistic flair. Innovative typography with creative freedom. Dynamic compositional layout showcasing artistic confidence and creative energy.`,
      negativePrompt: `boring, generic, corporate rigid, conventional, safe, predictable, formulaic`
    }
  },

  EDUCATION_LEARNING: {
    id: 'EDUCATION_LEARNING',
    name: 'Education & Learning',
    keywords: ['education', 'learning', 'course', 'training', 'tutorial', 'lesson', 'teaching', 'study', 'school', 'university', 'academy', 'knowledge'],
    layoutModifiers: {
      positivePrompt: `Clear educational design optimized for information clarity and learning. Organized color scheme with educational blues and friendly accents. Highly readable typography with excellent information hierarchy. Structured logical composition making complex information accessible.`,
      negativePrompt: `confusing, cluttered, hard to read, overwhelming, disorganized, chaotic`
    }
  },

  LUXURY_PREMIUM: {
    id: 'LUXURY_PREMIUM',
    name: 'Luxury & Premium',
    keywords: ['luxury', 'premium', 'exclusive', 'elite', 'high-end', 'prestige', 'sophisticated', 'elegant', 'upscale', 'boutique', 'vip'],
    layoutModifiers: {
      positivePrompt: `Luxurious premium aesthetic conveying exclusivity and sophistication. Elegant color palette with black, gold, white, and rich jewel tones. Refined typography with sophisticated elegance. Upscale minimalist composition with generous white space and premium feel.`,
      negativePrompt: `cheap, cluttered, garish, tacky, low-quality, mass-market, basic`
    }
  },

  FASHION_APPAREL: {
    id: 'FASHION_APPAREL',
    name: 'Fashion & Apparel',
    keywords: ['fashion', 'clothing', 'apparel', 'outfit', 'style', 'wear', 'collection', 'wardrobe', 'boutique', 'dress', 'shirt', 'pants', 'accessories', 'trendy', 'garment', 'textile', 'chic', 'vogue'],
    layoutModifiers: {
      positivePrompt: `Stylish fashion-forward aesthetic with trendy contemporary appeal. Include fashionable clothing items like dresses, shirts, accessories displayed elegantly. Modern fashion photography style with stylish models or clothing displays. Vibrant trendy color palette with fashion-forward combinations. Clean sophisticated layout with emphasis on style and elegance. High-fashion magazine aesthetic with beautiful clothing presentation.`,
      negativePrompt: `outdated fashion, unfashionable, bland clothing, generic backgrounds without fashion elements, no clothing visible, boring style, unfashionable colors`
    }
  }
};

/**
 * Detect layout context from brief
 * @param {string} brief - User's creative brief
 * @returns {Object} Detected context with confidence score
 */
function detectLayoutContext(brief) {
  const briefLower = brief.toLowerCase();
  let bestMatch = null;
  let highestScore = 0;

  for (const [contextId, context] of Object.entries(LAYOUT_CONTEXTS)) {
    let score = 0;

    // Count keyword matches
    for (const keyword of context.keywords) {
      if (briefLower.includes(keyword)) {
        score += 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = context;
    }
  }

  // If no strong match, return null
  if (highestScore === 0) {
    return {
      detected: false,
      context: null,
      confidence: 0
    };
  }

  return {
    detected: true,
    context: bestMatch,
    confidence: Math.min(highestScore / 3, 1.0) // Normalize to 0-1
  };
}

/**
 * Get layout modifiers for a detected context
 * @param {Object} context - Detected context object
 * @returns {Object} Layout modifiers (positive and negative prompts)
 */
function getLayoutModifiers(context) {
  if (!context) {
    return {
      positivePrompt: '',
      negativePrompt: ''
    };
  }

  return context.layoutModifiers;
}

/**
 * Enhance base prompt with context-aware layout modifiers
 * @param {string} basePrompt - Base image generation prompt
 * @param {Object} contextResult - Result from detectLayoutContext()
 * @returns {Object} Enhanced prompt with context
 */
function enhancePromptWithContext(basePrompt, contextResult) {
  if (!contextResult.detected || contextResult.confidence < 0.3) {
    // Low confidence or no detection - return original
    return {
      positivePrompt: basePrompt,
      contextApplied: false
    };
  }

  const modifiers = getLayoutModifiers(contextResult.context);

  // Inject context modifiers at the beginning for strong influence
  const enhancedPrompt = `${modifiers.positivePrompt}\n\n${basePrompt}`;

  return {
    positivePrompt: enhancedPrompt,
    negativePrompt: modifiers.negativePrompt,
    contextApplied: true,
    contextName: contextResult.context.name
  };
}

/**
 * Get all available contexts (for debugging/testing)
 * @returns {Array} List of all context definitions
 */
function getAllContexts() {
  return Object.values(LAYOUT_CONTEXTS).map(ctx => ({
    id: ctx.id,
    name: ctx.name,
    keywords: ctx.keywords
  }));
}

module.exports = {
  detectLayoutContext,
  getLayoutModifiers,
  enhancePromptWithContext,
  getAllContexts
};
