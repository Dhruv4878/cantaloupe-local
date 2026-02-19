require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found");
    return;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log(`Fetching models from ${url}...`);
    const response = await axios.get(url);

    const models = response.data.models;
    // Filter for just names and methods
    const simplified = models.map(m => ({
      name: m.name,
      methods: m.supportedGenerationMethods
    }));

    fs.writeFileSync('models_list.json', JSON.stringify(simplified, null, 2));
    console.log("Models written to models_list.json");

  } catch (error) {
    console.error("Error listing models:", error.message);
    if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
  }
}

listModels();
