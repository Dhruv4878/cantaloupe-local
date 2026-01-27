# Google Imagen Integration Setup Guide

## Current Issue
The system is trying to use DALL-E for image generation and falling back to placeholder images. We need to integrate Google's Imagen API for proper AI image generation.

## Solution Options

### Option 1: Google Vertex AI Imagen (Recommended)
This is the proper way to use Google's Imagen for image generation.

#### Setup Steps:

1. **Enable Google Cloud Services**
   ```bash
   # Enable required APIs
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable compute.googleapis.com
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   npm install @google-cloud/vertexai google-auth-library
   ```

3. **Environment Variables**
   Add to `backend/.env`:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
   ```

4. **Service Account Setup**
   - Create a service account in Google Cloud Console
   - Grant "Vertex AI User" role
   - Download the JSON key file
   - Set the path in GOOGLE_APPLICATION_CREDENTIALS

#### Code Implementation:
```javascript
const { VertexAI } = require('@google-cloud/vertexai');

const vertex_ai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
});

const generativeModel = vertex_ai.getGenerativeModel({
  model: 'imagen-3.0-generate-001'
});

const request = {
  contents: [{
    role: 'user',
    parts: [{
      text: imagePrompt
    }]
  }]
};

const result = await generativeModel.generateContent(request);
```

### Option 2: Gemini API with Image Generation (Alternative)
Use the newer Gemini models that support multimodal generation.

#### Setup Steps:
1. Use Gemini 2.0 Flash which supports image generation
2. Update the model configuration

#### Code Implementation:
```javascript
const imageModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-1219"
});

const result = await imageModel.generateContent({
  contents: [{
    parts: [{
      text: `Generate an image: ${imagePrompt}`
    }]
  }],
  generationConfig: {
    temperature: 0.4,
  }
});
```

### Option 3: Enhanced Placeholder (Temporary)
Improve the current placeholder system while setting up proper image generation.

## Recommended Implementation

I recommend **Option 1 (Vertex AI Imagen)** as it's the most robust and officially supported method for Google's image generation capabilities.

## Quick Fix for Testing

For immediate testing, I can implement an enhanced placeholder system that creates more relevant images based on the content, while you set up the proper Vertex AI integration.

## Next Steps

1. Choose your preferred option
2. Set up the required Google Cloud services
3. Update the environment variables
4. Test the integration

Would you like me to implement any of these options?