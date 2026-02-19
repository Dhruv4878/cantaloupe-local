const { extractBrandingFromPrompt } = require('../src/utils/brandingExtractor');

const testCases = [
  { brief: "Post for Coffee Shop", expected: { businessName: null } }, // Generic
  { brief: "Post for Starbucks", expected: { businessName: "Starbucks" } }, // Specific brand (might be hard to distinguish without NLP, but regex shouldn't be too aggressive on "Coffee")
  { brief: "Create a post for my business called TechCorp", expected: { businessName: "TechCorp" } },
  { brief: "Summer sale for high quality shoes", expected: { businessName: null } },
  { brief: "New arrivals at Zara", expected: { businessName: "Zara" } },
  { brief: "Discount on all items", expected: { businessName: null } },
  { brief: "Visit our website www.example.com", expected: { website: "example.com" } },
  { brief: "Contact us at 123-456-7890", expected: { phone: "123-456-7890" } },
  { brief: "Follow @mybrand on instagram", expected: { instagramHandle: "mybrand" } },
  { brief: "Post about productivity tips", expected: { businessName: null } },
  { brief: "Marketing strategy for small businesses", expected: { businessName: null } }
];

console.log("Running Branding Extraction Tests...\n");

testCases.forEach((test, index) => {
  const result = extractBrandingFromPrompt(test.brief);
  console.log(`Test Case ${index + 1}: "${test.brief}"`);

  let passed = true;
  for (const key in test.expected) {
    if (test.expected[key] === null) {
      if (result[key] !== null && result[key] !== undefined) {
        console.log(`  FAILED: Expected ${key} to be null, got "${result[key]}"`);
        passed = false;
      }
    } else if (result[key] !== test.expected[key]) {
      console.log(`  FAILED: Expected ${key} to be "${test.expected[key]}", got "${result[key]}"`);
      passed = false;
    }
  }

  if (passed) {
    console.log("  PASSED");
  } else {
    console.log("  FULL RESULT:", result);
  }
  console.log("--------------------------------------------------");
});
