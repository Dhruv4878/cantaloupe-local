const axios = require('axios');

async function testAPIEndpoint() {
  const apiUrl = 'http://localhost:5000/api';

  // Test data
  const testData = {
    brief: "generate a post as I'm a gym trainer",
    platforms: ["instagram"],
    brandAssets: {
      businessName: "FitLife Gym",
      businessType: "Fitness",
      brandVoice: "Professional yet approachable"
    },
    generationOptions: {
      contentStrategy: "promotional"
    },
    audienceTargeting: {
      primaryAudience: "Fitness enthusiasts"
    },
    campaignContext: {
      campaignType: "brand_awareness",
      primaryGoal: "engagement"
    },
    visualPreferences: {
      imageStyle: "professional"
    }
  };

  try {
    console.log("🚀 TESTING API ENDPOINT...");
    console.log("📝 REQUEST DATA:", JSON.stringify(testData, null, 2));

    const response = await axios.post(`${apiUrl}/ai-content/create-content-plan`, testData, {
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need an auth token
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      },
      timeout: 60000 // 60 second timeout
    });

    console.log("✅ API RESPONSE RECEIVED");
    console.log("📊 STATUS:", response.status);
    console.log("📝 RESPONSE DATA:", JSON.stringify(response.data, null, 2));

    // Check if response has expected structure
    if (response.data.postContent) {
      console.log("✅ POST CONTENT:", response.data.postContent);
    }

    if (response.data.imageUrl) {
      console.log("✅ IMAGE URL:", response.data.imageUrl);
    }

    if (response.data.platforms) {
      console.log("✅ PLATFORMS:", Object.keys(response.data.platforms));
    }

  } catch (error) {
    console.error("❌ API TEST FAILED:");
    if (error.response) {
      console.error("📊 STATUS:", error.response.status);
      console.error("📝 ERROR DATA:", error.response.data);
    } else {
      console.error("🔍 ERROR:", error.message);
    }
  }
}

testAPIEndpoint();