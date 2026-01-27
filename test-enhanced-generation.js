// Test script for enhanced social media generation
// Run this to test the new industry-standard features

const testEnhancedGeneration = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  // Test data that showcases the enhanced features
  const testRequest = {
    brief: "Create a post about the benefits of using AI for small business automation. Focus on time savings, cost reduction, and improved efficiency. Target audience is small business owners who are hesitant about technology.",
    platforms: ["instagram", "linkedin", "facebook", "x"],
    brandAssets: {
      useLogo: true,
      usePrimaryColor: true,
      businessType: "Technology",
      targetAudience: "Small business owners, 25-55, tech-hesitant",
      brandPersonality: "Professional, trustworthy, innovative",
      primaryColor: "#007bff"
    },
    generationOptions: {
      contentStrategy: "educational",
      visualStyle: "professional",
      optimizeForPlatforms: true,
      generateVariants: false
    }
  };

  try {
    console.log("🚀 Testing Enhanced Social Media Generation...");
    console.log("📝 Brief:", testRequest.brief.substring(0, 100) + "...");
    console.log("🎯 Platforms:", testRequest.platforms.join(", "));
    console.log("🎨 Strategy:", testRequest.generationOptions.contentStrategy);
    console.log("✨ Visual Style:", testRequest.generationOptions.visualStyle);

    const response = await fetch(`${apiUrl}/ai/create-content-plan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.TEST_TOKEN}` // Add your test token
      },
      body: JSON.stringify(testRequest)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("\n✅ Generation Successful!");
    console.log("📊 Quality Score:", result.metadata?.qualityScore || "N/A");
    console.log("📈 Estimated Reach:", result.metadata?.estimatedReach?.toLocaleString() || "N/A");
    console.log("🎯 Content Strategy:");
    console.log("  - Hook:", result.contentStrategy?.hook?.substring(0, 80) + "...");
    console.log("  - Core Value:", result.contentStrategy?.coreValue?.substring(0, 80) + "...");
    console.log("  - CTA:", result.contentStrategy?.callToAction?.substring(0, 50) + "...");

    console.log("\n🎨 Visual Concept:");
    console.log("  - Primary Message:", result.visualConcept?.primaryMessage?.substring(0, 60) + "...");
    console.log("  - Design Style:", result.visualConcept?.designStyle);
    console.log("  - Color Psychology:", result.visualConcept?.colorPsychology?.substring(0, 60) + "...");

    console.log("\n📱 Platform Content:");
    Object.keys(result.platforms || {}).forEach(platform => {
      const content = result.platforms[platform];
      console.log(`  ${platform.toUpperCase()}:`);
      console.log(`    - Caption: ${content.caption?.substring(0, 100) + "..."}`);
      console.log(`    - Hashtags: ${content.hashtags?.length || 0} hashtags`);
      console.log(`    - Engagement Score: ${content.performancePrediction?.engagement_score || "N/A"}/10`);
      console.log(`    - Viral Potential: ${content.performancePrediction?.viral_potential || "N/A"}`);
    });

    console.log("\n💡 Optimization Suggestions:");
    (result.metadata?.optimizationSuggestions || []).forEach((suggestion, i) => {
      console.log(`  ${i + 1}. ${suggestion}`);
    });

    console.log("\n🖼️ Image Generated:", result.imageUrl ? "✅ Yes" : "❌ No");

    return result;

  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    return null;
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testEnhancedGeneration };
}

// Run test if called directly
if (require.main === module) {
  testEnhancedGeneration();
}