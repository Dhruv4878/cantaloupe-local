// check-models.js
require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const models = response.data.models;
    
    console.log("\n=== AVAILABLE MODELS FOR YOUR KEY ===");
    models.forEach(model => {
      // We are looking for anything with "image" or "vision"
      if (model.name.includes("image") || model.name.includes("gemini")) {
        console.log(`- ${model.name}`);
        console.log(`  Description: ${model.description.substring(0, 60)}...`);
      }
    });
    console.log("=====================================\n");
    
  } catch (error) {
    console.error("Error fetching models:", error.response ? error.response.data : error.message);
  }
}

listModels();