 /**
 * Visual Template Registry - Industry Standard Infographic Templates
 * Each template has 4 input fields that are ALWAYS used in image generation
 * Categories: Quotes, Business, Product, Offers, Festivals, Educational, Testimonials, Personal Brand, Real Estate, Hospitality, Healthcare, Events
 */

const VISUAL_TEMPLATES = {
  // ========================================
  // 1. QUOTES & MOTIVATION
  // ========================================
  QUOTES_MOTIVATION: {
    id: "QUOTES_MOTIVATION",
    name: "Quotes & Motivation",
    category: "Quotes & Motivation",
    description: "Inspirational quotes with elegant typography and visual appeal",

    // 4 Required Fields (always used)
    fields: {
      quoteText: {
        label: "Quote Text",
        type: "textarea",
        placeholder: "Enter your inspirational quote (max 100 characters)",
        maxLength: 100,
        required: true,
        example: "Success is not final, failure is not fatal"
      },
      author: {
        label: "Author Name",
        type: "text",
        placeholder: "Author or source (optional)",
        maxLength: 30,
        required: false,
        example: "Winston Churchill"
      },
      accentColor: {
        label: "Accent Color",
        type: "text",
        placeholder: "Color theme (e.g., blue, orange, purple)",
        maxLength: 20,
        required: true,
        example: "vibrant orange"
      },
      backgroundStyle: {
        label: "Background Style",
        type: "text",
        placeholder: "Background description (e.g., gradient, minimal, nature)",
        maxLength: 50,
        required: true,
        example: "soft gradient from blue to purple"
      }
    },

    promptTemplate: `Clean inspirational quote card design.
Display the quote "{{quoteText}}" in large elegant serif typography as the main focus.
Show "{{author}}" in smaller italic text below the quote.
Use {{backgroundStyle}} as the background.
Add {{accentColor}} decorative quotation marks or accent elements.
Center-aligned composition with generous white space.
Modern minimalist aesthetic with high readability.
Professional typography with proper spacing.
High quality 8K resolution with sharp text.
Negative prompt: No font size labels, no px measurements, no technical annotations, no cluttered design, no messy text, no distracting elements, no UI mockup elements.`
  },


  // ========================================
  // 2. BUSINESS & CORPORATE
  // ========================================
  BUSINESS_CORPORATE: {
    id: "BUSINESS_CORPORATE",
    name: "Business & Corporate",
    category: "Business & Corporate",
    description: "Professional business announcements and corporate updates",

    fields: {
      headline: {
        label: "Headline",
        type: "text",
        placeholder: "Main headline (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Q4 Results Announced"
      },
      statistic: {
        label: "Key Statistic",
        type: "text",
        placeholder: "Key number or metric (e.g., +150%, $1M, 10K users)",
        maxLength: 20,
        required: true,
        example: "+150%"
      },
      subheading: {
        label: "Subheading",
        type: "text",
        placeholder: "Supporting text (max 60 characters)",
        maxLength: 60,
        required: true,
        example: "Revenue Growth This Quarter"
      },
      brandColor: {
        label: "Brand Color",
        type: "text",
        placeholder: "Primary brand color (e.g., corporate blue, professional gray)",
        maxLength: 30,
        required: true,
        example: "corporate blue"
      }
    },

    promptTemplate: `Clean professional business infographic.
Display "{{headline}}" in bold text at the top.
Show large "{{statistic}}" as the centerpiece with {{brandColor}} styling.
Include "{{subheading}}" below the statistic.
Use simple upward arrow or chart graphic in {{brandColor}}.
Clean white or light gray background with subtle gradient.
Minimal modern corporate design with clear hierarchy.
Professional business aesthetic with balanced layout.
High quality with sharp typography.
Negative prompt: No font size labels, no px measurements, no technical annotations, no cluttered UI, no messy text, no complex graphics, no design artifacts.`
  },


  // ========================================
  // 3. PRODUCT & PROMOTION
  // ========================================
  PRODUCT_PROMOTION: {
    id: "PRODUCT_PROMOTION",
    name: "Product & Promotion",
    category: "Product & Promotion",
    description: "Product launches and promotional announcements",

    fields: {
      productName: {
        label: "Product Name",
        type: "text",
        placeholder: "Product or service name (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Premium Wireless Headphones"
      },
      keyFeature: {
        label: "Key Feature",
        type: "text",
        placeholder: "Main selling point (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "48-Hour Battery Life"
      },
      callToAction: {
        label: "Call to Action",
        type: "text",
        placeholder: "CTA text (max 30 characters)",
        maxLength: 30,
        required: true,
        example: "Shop Now"
      },
      visualStyle: {
        label: "Visual Style",
        type: "text",
        placeholder: "Product visualization (e.g., floating product, lifestyle shot)",
        maxLength: 50,
        required: true,
        example: "floating product with glow effect"
      }
    },

    promptTemplate: `Clean professional product promotion infographic.
Display "{{productName}}" in large bold text at the top.
Show {{visualStyle}} as the main focal point in the center with soft shadow.
Highlight "{{keyFeature}}" in a simple text callout below the product.
Include "{{callToAction}}" as a gradient button at the bottom.
Use a clean white to light gradient background.
Minimal modern design with plenty of white space.
Professional product photography aesthetic.
High quality, sharp, and clean composition.
Negative prompt: No font size labels, no px measurements, no technical annotations, no random icons, no quality badges, no UI mockup elements, no design artifacts, no cluttered elements.`
  },


  // ========================================
  // 4. OFFERS & SALES
  // ========================================
  OFFERS_SALES: {
    id: "OFFERS_SALES",
    name: "Offers & Sales",
    category: "Offers & Sales",
    description: "Sales promotions and special offers",

    fields: {
      discountAmount: {
        label: "Discount Amount",
        type: "text",
        placeholder: "Discount percentage or amount (e.g., 50% OFF, $100 OFF)",
        maxLength: 20,
        required: true,
        example: "50% OFF"
      },
      offerTitle: {
        label: "Offer Title",
        type: "text",
        placeholder: "Sale title (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Flash Sale"
      },
      urgency: {
        label: "Urgency Text",
        type: "text",
        placeholder: "Time-limited text (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Limited Time Only"
      },
      saleColor: {
        label: "Sale Color",
        type: "text",
        placeholder: "Vibrant color for urgency (e.g., red, orange, yellow)",
        maxLength: 20,
        required: true,
        example: "vibrant red"
      }
    },

    promptTemplate: `Bold sales promotion design with high impact and contextual product representation.
Display massive "{{discountAmount}}" in huge bold typography as the dominant element with eye-catching styling.
Show "{{offerTitle}}" in bold uppercase letters with strong visual presence.
Include "{{urgency}}" in a prominent banner or badge creating urgency.

CONTEXTUAL VISUAL ELEMENTS:
- For Valentine's Day: Include romantic couple imagery, hearts, roses, or romantic atmosphere
- For Fashion/Clothing sales: Display stylish clothing items, fashion accessories, or models wearing trendy outfits
- For Product sales: Show the relevant product category visually (electronics, accessories, etc.)
- Use appropriate imagery that matches the sale occasion and product type

Use dynamic {{saleColor}} gradient background with high energy and excitement.
Add sale badges, limited time stamps, or star burst elements for promotional impact.
Bold promotional design with dramatic visual impact and strong call to action.
High energy sales aesthetic with clear visual hierarchy.
Sharp high quality rendering with professional polish.
Negative prompt: No font size labels, no px measurements, no technical annotations, no cluttered design, no hard-to-read text, no weak visual hierarchy, no design artifacts, no generic backgrounds without context.`
  },


  // ========================================
  // 5. FESTIVALS
  // ========================================
  FESTIVALS: {
    id: "FESTIVALS",
    name: "Festivals",
    category: "Festivals",
    description: "Festival greetings and seasonal celebrations",

    fields: {
      festivalName: {
        label: "Festival Name",
        type: "text",
        placeholder: "Festival or holiday name (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Happy Diwali"
      },
      greeting: {
        label: "Greeting Message",
        type: "text",
        placeholder: "Warm wishes message (max 60 characters)",
        maxLength: 60,
        required: true,
        example: "Wishing you joy and prosperity"
      },
      festivalTheme: {
        label: "Festival Theme",
        type: "text",
        placeholder: "Cultural elements (e.g., diyas, fireworks, decorations)",
        maxLength: 50,
        required: true,
        example: "traditional diyas and rangoli patterns"
      },
      colorPalette: {
        label: "Color Palette",
        type: "text",
        placeholder: "Festival colors (e.g., gold and red, green and red)",
        maxLength: 30,
        required: true,
        example: "gold and deep red"
      }
    },

    promptTemplate: `Warm festive celebration design.
Display "{{festivalName}}" in decorative festive typography.
Show "{{greeting}}" in elegant welcoming text.
Include {{festivalTheme}} illustrated respectfully around the text.
Use rich {{colorPalette}} creating festive atmosphere.
Warm inviting background with cultural elements.
Balanced composition with festival name as focal point.
Joyful celebration aesthetic with cultural respect.
High quality with vibrant colors and harmonious design.
Negative prompt: No font size labels, no technical annotations, no culturally insensitive elements, no cluttered design, no messy text, no inappropriate imagery, no design artifacts.`
  },


  // ========================================
  // 6. EDUCATIONAL
  // ========================================
  EDUCATIONAL: {
    id: "EDUCATIONAL",
    name: "Educational",
    category: "Educational",
    description: "Educational tips, how-tos, and informative content",

    fields: {
      title: {
        label: "Title",
        type: "text",
        placeholder: "Educational title (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "5 Tips for Better Sleep"
      },
      tipsList: {
        label: "Tips/Points",
        type: "textarea",
        placeholder: "List 3-5 key points separated by commas",
        maxLength: 200,
        required: true,
        example: "Consistent schedule, Dark room, No screens, Cool temperature, Relaxation routine"
      },
      category: {
        label: "Category",
        type: "text",
        placeholder: "Topic category (max 30 characters)",
        maxLength: 30,
        required: true,
        example: "Health & Wellness"
      },
      iconStyle: {
        label: "Icon Style",
        type: "text",
        placeholder: "Visual representation (e.g., icons, illustrations, diagrams)",
        maxLength: 40,
        required: true,
        example: "simple line icons"
      }
    },

    promptTemplate: `Clean educational infographic with clear information hierarchy.
Display "{{title}}" in bold clear text at top with "{{category}}" label.
Show each point from "{{tipsList}}" as WELL-FORMATTED numbered list items.
CRITICAL TEXT FORMATTING: Each numbered item MUST have proper spacing like "1. Item Text" with space after period.
NEVER format as "1.Item" or "2.Caloric" - ALWAYS include space after number and period.
Use {{iconStyle}} next to each numbered item for visual interest.
Use vertical list or grid layout with generous spacing between items.
Clean light background for easy reading and focus.
Educational blue or green as primary color with neutral backgrounds.
Simple numbered circles (1, 2, 3, 4, 5) with clean section dividers.
Professional typography with excellent readability and proper text spacing.
High quality 8K resolution with sharp crisp text rendering.
Negative prompt: No font size labels, no px measurements, no technical annotations, no cluttered layout, no hard-to-read fonts, no text formatting errors, no missing spaces after punctuation, no concatenated text, no messy typography, no overwhelming information, no distracting graphics, no design artifacts.`
  },


  // ========================================
  // 7. TESTIMONIALS
  // ========================================
  TESTIMONIALS: {
    id: "TESTIMONIALS",
    name: "Testimonials",
    category: "Testimonials",
    description: "Customer testimonials and reviews",

    fields: {
      testimonialText: {
        label: "Testimonial Text",
        type: "textarea",
        placeholder: "Customer quote (max 150 characters)",
        maxLength: 150,
        required: true,
        example: "This product changed my life! Best purchase ever."
      },
      customerName: {
        label: "Customer Name",
        type: "text",
        placeholder: "Customer name (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Sarah Johnson"
      },
      rating: {
        label: "Rating",
        type: "text",
        placeholder: "Star rating (e.g., 5 stars, 5/5, ⭐⭐⭐⭐⭐)",
        maxLength: 20,
        required: true,
        example: "5 stars"
      },
      customerTitle: {
        label: "Customer Title",
        type: "text",
        placeholder: "Job title or description (max 40 characters)",
        maxLength: 40,
        required: false,
        example: "Marketing Manager"
      }
    },

    promptTemplate: `Clean professional testimonial card design.
Display "{{testimonialText}}" in large readable quote format with elegant quotation marks.
Show "{{customerName}}" in bold text below testimonial.
Include "{{customerTitle}}" in lighter text for context.
Display "{{rating}}" as visual star icons prominently.
Clean trustworthy design with soft gradient background.
Trust-building blue or green colors with professional neutrals.
Center-aligned testimonial card aesthetic with balanced layout.
Professional credibility-focused design.
Negative prompt: No font size labels, no technical annotations, no fake-looking elements, no cluttered design, no hard-to-read text, no unprofessional appearance, no design artifacts.`
  },


  // ========================================
  // 8. PERSONAL BRAND
  // ========================================
  PERSONAL_BRAND: {
    id: "PERSONAL_BRAND",
    name: "Personal Brand",
    category: "Personal Brand",
    description: "Personal branding and professional identity",

    fields: {
      name: {
        label: "Name",
        type: "text",
        placeholder: "Your name or brand name (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "John Smith"
      },
      title: {
        label: "Professional Title",
        type: "text",
        placeholder: "Your title or expertise (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Digital Marketing Strategist"
      },
      tagline: {
        label: "Tagline",
        type: "text",
        placeholder: "Personal tagline or value proposition (max 60 characters)",
        maxLength: 60,
        required: true,
        example: "Helping brands grow through data-driven strategies"
      },
      brandStyle: {
        label: "Brand Style",
        type: "text",
        placeholder: "Visual style (e.g., modern, minimalist, bold, creative)",
        maxLength: 30,
        required: true,
        example: "modern and professional"
      }
    },

    promptTemplate: `Clean professional personal brand design.
Display "{{name}}" in bold confident typography establishing identity.
Show "{{title}}" in professional text defining expertise.
Include "{{tagline}}" in supporting text communicating value.
Use {{brandStyle}} aesthetic with clean lines and professional appearance.
Sophisticated gradient or solid color reflecting personal brand.
Minimal geometric shapes and professional modern elements.
Hierarchical layout with name → title → tagline flow.
Modern professional identity design with authority-building aesthetic.
Negative prompt: No font size labels, no technical annotations, no cluttered design, no unprofessional elements, no messy text, no distracting graphics, no design artifacts.`
  },


  // ========================================
  // 9. REAL ESTATE
  // ========================================
  REAL_ESTATE: {
    id: "REAL_ESTATE",
    name: "Real Estate",
    category: "Real Estate",
    description: "Property listings and real estate promotions",

    fields: {
      propertyType: {
        label: "Property Type",
        type: "text",
        placeholder: "Type of property (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Luxury 3BHK Apartment"
      },
      location: {
        label: "Location",
        type: "text",
        placeholder: "Property location (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Downtown Manhattan"
      },
      price: {
        label: "Price",
        type: "text",
        placeholder: "Price or price range (max 30 characters)",
        maxLength: 30,
        required: true,
        example: "$850,000"
      },
      keyFeature: {
        label: "Key Feature",
        type: "text",
        placeholder: "Standout feature (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Ocean View | Modern Kitchen | Pool"
      }
    },

    promptTemplate: `Clean professional real estate listing design.
Display "{{propertyType}}" in bold prominent text at top.
Show "{{location}}" with location pin icon establishing context.
Display "{{price}}" in large eye-catching text as primary focus.
Include "{{keyFeature}}" as bullet points highlighting selling points.
Professional gradient background with upscale appearance.
Real estate professional colors conveying trust and luxury.
Property card layout with clear information hierarchy.
Modern professional property listing design with upscale aesthetic.
Negative prompt: No font size labels, no technical annotations, no cluttered design, no unprofessional appearance, no hard-to-read text, no low-quality graphics, no design artifacts.`
  },


  // ========================================
  // 10. HOSPITALITY
  // ========================================
  HOSPITALITY: {
    id: "HOSPITALITY",
    name: "Hospitality",
    category: "Hospitality",
    description: "Hotels, restaurants, and hospitality services",

    fields: {
      offerTitle: {
        label: "Offer Title",
        type: "text",
        placeholder: "Special offer or menu item (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Weekend Brunch Special"
      },
      description: {
        label: "Description",
        type: "text",
        placeholder: "Brief description (max 80 characters)",
        maxLength: 80,
        required: true,
        example: "Unlimited mimosas & gourmet breakfast buffet"
      },
      priceOrTime: {
        label: "Price or Time",
        type: "text",
        placeholder: "Price or timing details (max 30 characters)",
        maxLength: 30,
        required: true,
        example: "$29 per person"
      },
      ambiance: {
        label: "Ambiance",
        type: "text",
        placeholder: "Atmosphere description (e.g., cozy, elegant, vibrant)",
        maxLength: 30,
        required: true,
        example: "elegant and cozy"
      }
    },

    promptTemplate: `Inviting hospitality design with warmth and appeal.
Display "{{offerTitle}}" in elegant appetizing typography creating desire.
Show "{{description}}" in readable enticing text describing the experience.
Include "{{priceOrTime}}" prominently displayed with clear information.
Use {{ambiance}} visual style with warm inviting colors and welcoming atmosphere.
Warm gradient or texture creating inviting feel.
Appetizing warm colors with sophisticated neutrals.
Menu-card style layout with elegant hospitality design.
Warm and inviting composition with professional hospitality branding.
Negative prompt: No font size labels, no technical annotations, no unappetizing colors, no cluttered design, no hard-to-read text, no cold or uninviting appearance, no design artifacts.`
  },


  // ========================================
  // 11. HEALTHCARE
  // ========================================
  HEALTHCARE: {
    id: "HEALTHCARE",
    name: "Healthcare",
    category: "Healthcare",
    description: "Healthcare tips, medical information, and wellness",

    fields: {
      healthTopic: {
        label: "Health Topic",
        type: "text",
        placeholder: "Health topic or tip (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Heart Health Awareness"
      },
      keyMessage: {
        label: "Key Message",
        type: "textarea",
        placeholder: "Main health message or tips (max 120 characters)",
        maxLength: 120,
        required: true,
        example: "Regular exercise reduces heart disease risk by 30%"
      },
      callToAction: {
        label: "Call to Action",
        type: "text",
        placeholder: "Action step (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Schedule Your Checkup Today"
      },
      medicalIcon: {
        label: "Medical Icon",
        type: "text",
        placeholder: "Relevant medical symbol (e.g., heart, stethoscope, wellness)",
        maxLength: 30,
        required: true,
        example: "heart with pulse line"
      }
    },

    promptTemplate: `Clean professional healthcare information design.
Display "{{healthTopic}}" in clear authoritative text establishing credibility.
Show "{{keyMessage}}" in readable informative text communicating health information clearly.
Include "{{callToAction}}" in button or banner format encouraging health action.
Use {{medicalIcon}} illustrated in clean professional medical style.
Clean trustworthy design with medical-grade cleanliness.
Healthcare colors conveying trust and professionalism.
Clear information hierarchy with easy to understand layout.
Professional medical aesthetic with trustworthy and authoritative design.
Negative prompt: No font size labels, no technical annotations, no alarming imagery, no cluttered design, no hard-to-read medical jargon, no unprofessional appearance, no design artifacts.`
  },


  // ========================================
  // 12. EVENTS
  // ========================================
  EVENTS: {
    id: "EVENTS",
    name: "Events",
    category: "Events",
    description: "Event announcements and invitations",

    fields: {
      eventName: {
        label: "Event Name",
        type: "text",
        placeholder: "Event title (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Annual Tech Conference 2026"
      },
      dateTime: {
        label: "Date & Time",
        type: "text",
        placeholder: "When (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "March 15, 2026 | 9:00 AM"
      },
      location: {
        label: "Location",
        type: "text",
        placeholder: "Where (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Convention Center, NYC"
      },
      eventType: {
        label: "Event Type",
        type: "text",
        placeholder: "Type of event (e.g., conference, workshop, webinar, party)",
        maxLength: 30,
        required: true,
        example: "professional conference"
      }
    },

    promptTemplate: `Clean professional event announcement design.
Display "{{eventName}}" in bold exciting typography creating anticipation.
Show "{{dateTime}}" with calendar icon with clear timing information.
Include "{{location}}" with location pin icon establishing venue.
Use {{eventType}} visual style with appropriate tone.
Event-appropriate gradient or design with professional appearance.
Event-type appropriate colors with clear information flow.
Event poster layout with clear hierarchy and excitement-building composition.
Modern event marketing design with professional polish.
Negative prompt: No font size labels, no technical annotations, no cluttered information, no hard-to-read details, no confusing layout, no unprofessional appearance, no design artifacts.`
  },


  // ========================================
  // 13. HIRING
  // ========================================
  HIRING: {
    id: "HIRING",
    name: "Hiring",
    category: "Hiring",
    description: "Job openings and recruitment announcements",

    fields: {
      jobTitle: {
        label: "Job Title",
        type: "text",
        placeholder: "Position title (max 50 characters)",
        maxLength: 50,
        required: true,
        example: "Senior Software Engineer"
      },
      companyName: {
        label: "Company Name",
        type: "text",
        placeholder: "Your company name (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "TechCorp Inc."
      },
      keyRequirement: {
        label: "Key Requirement",
        type: "text",
        placeholder: "Main qualification or experience (max 60 characters)",
        maxLength: 60,
        required: true,
        example: "5+ years experience in React & Node.js"
      },
      callToAction: {
        label: "Call to Action",
        type: "text",
        placeholder: "Application instruction (max 40 characters)",
        maxLength: 40,
        required: true,
        example: "Apply Now | careers@techcorp.com"
      }
    },

    promptTemplate: `Clean professional job posting design.
Display "We're Hiring!" or "Join Our Team" in bold attention-grabbing text at top.
Show "{{jobTitle}}" in large prominent typography as the main focus.
Include "{{companyName}}" in professional branding text.
Display "{{keyRequirement}}" in clear readable text highlighting qualifications.
Show "{{callToAction}}" in a prominent button or banner at bottom.
Use professional corporate colors with modern gradient background.
Clean recruitment poster layout with clear information hierarchy.
Modern professional hiring aesthetic with welcoming and opportunity-focused design.
Add subtle professional icons like briefcase or team symbols.
Negative prompt: No font size labels, no technical annotations, no cluttered design, no unprofessional appearance, no hard-to-read text, no overwhelming information, no design artifacts.`
  }
};

/**
 * Get template by category name
 */
function getTemplateByCategory(categoryName) {
  const template = Object.values(VISUAL_TEMPLATES).find(
    t => t.category === categoryName || t.id === categoryName
  );
  return template || VISUAL_TEMPLATES.QUOTES_MOTIVATION; // Default fallback
}

/**
 * Get all template categories for frontend selection
 */
function getAllCategories() {
  return Object.values(VISUAL_TEMPLATES).map(template => ({
    id: template.id,
    name: template.name,
    category: template.category,
    description: template.description,
    fields: template.fields
  }));
}

/**
 * Build variable extraction prompt (simplified - fields come from frontend)
 */
function buildVariableExtractionPrompt(template, brief, fieldValues) {
  // If field values are provided from frontend, use them directly
  if (fieldValues && Object.keys(fieldValues).length > 0) {
    return null; // No need for AI extraction
  }

  // Otherwise, extract from brief using AI
  const fieldDescriptions = Object.entries(template.fields)
    .map(([key, config]) => `- ${key} (${config.type}): ${config.example}`)
    .join('\n');

  return `Extract values for these fields from the brief:

BRIEF: ${brief}

FIELDS:
${fieldDescriptions}


IMPORTANT RULES:
1. Extract ONLY information explicitly present in the brief.
2. If a field value is not found, leave it empty or use a generic default if appropriate for the context.
3. DO NOT interpret the TOPIC of the post as a BRAND NAME or COMPANY NAME.
   - Example: "Post for coffee" -> Topic is Coffee, Brand Name is NOT Coffee.
   - Example: "Post for Starbucks" -> Brand Name is Starbucks.
4. Distinguish between the SUBJECT (what the post is about) and the ENTITY (who is posting).
   - "My company is Generation Next" -> Sender is "Generation Next". The post content should NOT be "Generation Next" unless it's a "Personal Brand" or "Hiring" template.
   - "We are a web development agency" -> Context about sender. The post might be about "Web Development Services", but the text shouldn't just say "We are a web development agency" unless it fits the template field.
5. NEVER include instructions or meta-data in the fields.
   - Bad: "Make sure to mention we are the best"
   - Good: "We are the best" (if it fits a testimonial/quote field)

Return ONLY valid JSON:
{
  "variables": {
    "field1": "value1",
    "field2": "value2"
  }
}`;
}

/**
 * Assemble final image prompt by replacing template variables
 */
/**
 * Assemble final image prompt by replacing template variables and injecting style
 */
function assembleImagePrompt(template, variables, aspectRatio, style = null, brandingPrompt = '', contextPrompt = '') {
  let prompt = template.promptTemplate;

  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    prompt = prompt.replace(new RegExp(placeholder, 'g'), value || '');
  }

  // Inject Context-Aware Layout Modifiers FIRST (highest priority for aesthetic)
  if (contextPrompt) {
    prompt = `${contextPrompt}\n\nCONTENT DESCRIPTION:\n${prompt}`;
  }

  // Inject Visual Style if provided (The "Secret Sauce" for better images)
  if (style) {
    prompt = `${style.positivePrompt}\n\n${prompt}`;
  } else {
    // Default fallback style if none selected (Clean Professional)
    prompt = `Professional high-quality design, sharp details, clean composition.\n\n${prompt}`;
  }

  // Add branding information if provided
  if (brandingPrompt) {
    prompt += brandingPrompt;
  }

  // Add aspect ratio guidance
  if (aspectRatio === '4:5') {
    prompt += '\n\nAspect Ratio: Vertical 4:5 portrait orientation, optimized for Instagram and social feeds.';
  } else if (aspectRatio === '16:9') {
    prompt += '\n\nAspect Ratio: Wide 16:9 landscape orientation, optimized for LinkedIn and presentations.';
  } else {
    prompt += '\n\nAspect Ratio: Square 1:1 composition, balanced and centered for all platforms.';
  }

  // Enhanced negative prompt for text quality
  const baseNegativePrompt = style ? style.negativePrompt : "blurry, low quality, distorted, ugly, messy, amateur, pixelated, grainy";
  const typographyNegativePrompt = "text formatting errors, missing spaces, concatenated text, typos, misspellings, font size labels, px measurements, technical annotations";

  return {
    positivePrompt: prompt,
    negativePrompt: `${baseNegativePrompt}, ${typographyNegativePrompt}`
  };
}

/**
 * Get template metadata for response
 */
function getTemplateMetadata(template, variables) {
  return {
    templateId: template.id,
    templateName: template.name,
    category: template.category,
    description: template.description,
    variables: variables
  };
}

module.exports = {
  VISUAL_TEMPLATES,
  getTemplateByCategory,
  getAllCategories,
  buildVariableExtractionPrompt,
  assembleImagePrompt,
  getTemplateMetadata
};
