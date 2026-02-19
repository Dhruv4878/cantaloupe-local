/**
 * Branding Extractor - Intelligent Business Branding Detection
 * Extracts and formats branding information for image generation
 */

/**
 * Extract branding information from brief and brand assets
 * @param {string} brief - User's creative brief
 * @param {Object} brandAssets - Brand assets object from request
 * @returns {Object} Extracted branding information
 */
function extractBrandingFromPrompt(brief, brandAssets = {}) {
  const branding = {
    businessName: null,
    instagramHandle: null,
    website: null,
    phone: null,
    email: null
  };

  // Extract business name from brandAssets or brief
  if (brandAssets.businessName) {
    branding.businessName = brandAssets.businessName;
  } else {
    // Enhanced patterns to catch business names in natural language
    const businessPatterns = [
      // CRITICAL: Brand/business naming patterns - "named as X", "called X", "brand is X"
      // REQUIRED: Must have "brand", "business", or "company" context before "named/called"
      /(?:brand|business|company)\s+(?:named|called|is called|known as)\s+([A-Z][A-Za-z0-9\s&'-]{2,40})/i,

      // Explicit declarations: "my business is X", "company is X", "brand is X"
      /(?:my business is|business name is|company is|company name is|comapny is|comapny name is|brand is|our brand is)\s+([A-Z][A-Za-z0-9\s&'-]{2,40})/i,

      // Work-related: "trainer at X", "working at X", "work at X", "employed at X"
      /(?:trainer at|working at|work at|employed at|coach at|instructor at)\s+([A-Z][A-Za-z0-9\s&'-]{2,40})/i,

      // Service providers: "from X business/company/gym/studio"
      /(?:from|representing)\s+([A-Z][A-Za-z0-9\s&'-]{2,40})\s+(?:business|company|gym|fitness|studio|center|services)/i,

      // Possessive: "X's gym", "X fitness", "X studio"
      /\b([A-Z][A-Za-z0-9&'-]+(?:\s+[A-Z][A-Za-z0-9&'-]+)?)\s+(?:gym|fitness|studio|center|wellness|training|health|club)/i,

      // REMOVED: Generic "for X" pattern - too aggressive (matches "for Coffee", "for Summer", etc.)

      // X + business descriptor: "X business", "X company"
      /\b([A-Z][A-Za-z0-9\s&'-]{2,40})\s+(?:business|company|comapny|brand|studio|agency|services|gym|fitness)/i
    ];

    for (const pattern of businessPatterns) {
      const match = brief.match(pattern);
      if (match && match[1]) {
        // Clean up the extracted name
        let name = match[1].trim();

        // Remove trailing common words that might be captured
        name = name.replace(/\s+(and|or|the|a|an|in|on|at|by|with)$/i, '');

        // Filter out common false positives
        const falsePositives = ['a', 'an', 'the', 'my', 'our', 'your', 'her', 'his', 'summer', 'winter', 'spring', 'autumn', 'sale', 'offer', 'discount', 'promotion', 'new', 'old', 'best', 'top'];
        if (falsePositives.includes(name.toLowerCase())) {
          continue;
        }

        // STOP WORD TRUNCATION: Cut off name if it includes sentence connectors
        // Example: "Generation Next and we are..." -> "Generation Next"
        const stopWords = [' and ', ' we ', ' they ', ' who ', ' which ', ' where ', ' that ', ' but ', ' or ', '. ', ', '];
        for (const word of stopWords) {
          const index = name.toLowerCase().indexOf(word);
          if (index !== -1) {
            name = name.substring(0, index).trim();
          }
        }

        // Only accept if it's reasonable length and has actual content
        if (name.length >= 3 && name.length <= 40) {
          branding.businessName = name;
          break;
        }
      }
    }
  }

  // Extract Instagram handle
  const instagramPatterns = [
    /@([a-zA-Z0-9._]{1,30})/g,
    /instagram[:\s]+([a-zA-Z0-9._]{1,30})/gi,
    /ig[:\s]+([a-zA-Z0-9._]{1,30})/gi
  ];

  for (const pattern of instagramPatterns) {
    const match = brief.match(pattern);
    if (match && match[1]) {
      branding.instagramHandle = match[1].replace(/^@/, '');
      break;
    }
  }

  // Extract website
  const websitePatterns = [
    /((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,}(?:\/[^\s]*)?)/gi,
    /website[:\s]+((?:www\.)?[a-zA-Z0-9-]+\.[a-z]{2,})/gi
  ];

  for (const pattern of websitePatterns) {
    const match = brief.match(pattern);
    if (match && match[1]) {
      branding.website = match[1].replace(/^https?:\/\//, '').replace(/^www\./, '');
      break;
    }
  }

  // Extract phone number
  const phonePattern = /(?:phone|call|contact)[:\s]*([\d\s\-\(\)]{10,})/gi;
  const phoneMatch = brief.match(phonePattern);
  if (phoneMatch && phoneMatch[1]) {
    branding.phone = phoneMatch[1].trim();
  }

  // Extract email
  const emailPattern = /([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emailMatch = brief.match(emailPattern);
  if (emailMatch && emailMatch[0]) {
    branding.email = emailMatch[0];
  }

  return branding;
}

/**
 * Assemble branding prompt segment for image generation
 * @param {Object} brandingInfo - Extracted branding information
 * @returns {string} Prompt segment for branding
 */
function assembleBrandingPrompt(brandingInfo) {
  const brandingElements = [];

  if (brandingInfo.businessName) {
    brandingElements.push(`Business name "${brandingInfo.businessName}" MUST be displayed in the BOTTOM-RIGHT CORNER with PERFECT SPELLING and clear readable typography - spell it EXACTLY as "${brandingInfo.businessName}" with no errors or variations`);
  }

  if (brandingInfo.instagramHandle) {
    brandingElements.push(`Instagram handle "@${brandingInfo.instagramHandle}" shown elegantly below or near the business name`);
  }

  if (brandingInfo.website) {
    brandingElements.push(`Website "${brandingInfo.website}" displayed clearly in the branding area`);
  }

  if (brandingInfo.phone) {
    brandingElements.push(`Phone number "${brandingInfo.phone}" included in the branding section`);
  }

  if (brandingInfo.email) {
    brandingElements.push(`Email "${brandingInfo.email}" visible in the branding area`);
  }

  if (brandingElements.length === 0) {
    return '';
  }

  // Create professional branding section with explicit placement instructions
  const brandingPrompt = `\n\n=== CRITICAL BRANDING REQUIREMENTS ===
${brandingElements.join('.\n')}.

PLACEMENT INSTRUCTIONS:
- Position all branding information in the BOTTOM-RIGHT CORNER of the image
- Use clean professional sans-serif typography for branding text
- Ensure branding text is clearly visible but not overwhelming (readable size)
- Maintain proper spacing between branding elements
- Use subtle background or slight transparency if needed for readability
- NEVER misspell, alter, or incorrectly render the brand name
- Brand name must be spelled EXACTLY as provided character-by-character`;

  return brandingPrompt;
}

/**
 * Check if branding information exists
 * @param {Object} brandingInfo - Branding information object
 * @returns {boolean} True if any branding info exists
 */
function hasBranding(brandingInfo) {
  return !!(
    brandingInfo.businessName ||
    brandingInfo.instagramHandle ||
    brandingInfo.website ||
    brandingInfo.phone ||
    brandingInfo.email
  );
}

module.exports = {
  extractBrandingFromPrompt,
  assembleBrandingPrompt,
  hasBranding
};
