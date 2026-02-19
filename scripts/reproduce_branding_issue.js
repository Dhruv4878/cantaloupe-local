const { extractBrandingFromPrompt } = require('../backend/src/utils/brandingExtractor');

const testBriefs = [
  "enerate a post for a diwali wishes .my comapny name is generation next and we are web development agency",
  "my company name is Alpha Corp and we specialize in AI",
  "brand is Yoga Studio where peace meets power",
  "my business is called The Best Bakery that makes fresh bread"
];

console.log("=== TESTING BRANDING EXTRACTION FIX ===");

testBriefs.forEach((brief, index) => {
  console.log(`\nTest Case ${index + 1}:`);
  console.log(`Input: "${brief}"`);
  const branding = extractBrandingFromPrompt(brief);
  console.log(`Extracted Business Name: "${branding.businessName}"`);
});
