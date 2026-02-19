# AI Content Generation - Quick Reference

## 🚀 Quick Start

### Adding a New Generation Method

1. **Create Controller** (`backend/src/api/controllers/yourNewController.js`)
```javascript
const Post = require('../../models/postModel');
const { generateWithGemini, uploadImageToCloudinary } = require('./aiContentHelpers');

const yourNewMethod = async (req, res) => {
  try {
    const userId = req.user?.id;
    const usedCredits = req.usedCredits; // From middleware
    
    // Your logic here
    
    const post = new Post({ userId, content, usedCredits });
    await post.save();
    
    return res.status(200).json({ success: true, data: post });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { yourNewMethod };
```

2. **Add Route** (`backend/src/api/routes/aiContentRoutes.js`)
```javascript
const { yourNewMethod } = require('../controllers/yourNewController');

router.post(
  '/your-new-endpoint',
  authMiddleware,
  checkFeatureAccess('ai_post_generation'),
  checkPostLimits,
  yourNewMethod
);
```

### Using Helper Functions

```javascript
const {
  generateWithGemini,      // Generate text with AI
  callImageAI,             // Generate image with AI
  uploadImageToCloudinary, // Upload image to cloud
  callPlatformContentAI,   // Generate platform content
  downloadImageAsBase64,   // Download image as base64
  COST_TRACKING           // Calculate costs
} = require('./aiContentHelpers');

// Generate text
const result = await generateWithGemini('Your prompt here');

// Generate image
const imageDataUri = await callImageAI('Image prompt', '1:1');

// Upload image
const cloudinaryUrl = await uploadImageToCloudinary(imageDataUri);

// Calculate costs
const totalCost = COST_TRACKING.calculateCost([
  { type: "text_generation", model: "gemini-2.5-pro", inputTokens: 100, outputTokens: 50 },
  { type: "image_generation", model: "gemini-imagen" }
]);
```

## 📋 Common Tasks

### Modify AI Prompt Strategy

**File**: Controller file (e.g., `generateFromScratchController.js`)
**Function**: `buildStrategyPrompt()` or inline prompt

```javascript
const strategyPrompt = `Your enhanced prompt here
Include all context needed
Format: JSON expected output`;

const result = await generateWithGemini(strategyPrompt);
```

### Add New Platform

**File**: `aiContentHelpers.js`
**Function**: `callPlatformContentAI()`

```javascript
const platformLimits = {
  instagram: { caption: 2200, hashtags: 30 },
  facebook: { caption: 63206, hashtags: 30 },
  linkedin: { caption: 3000, hashtags: 30 },
  x: { caption: 280, hashtags: 10 },
  tiktok: { caption: 2200, hashtags: 30 } // Add new platform
};
```

### Update AI Model

**File**: `aiContentHelpers.js`
**Configuration**: Top of file

```javascript
const textModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro", // Change model here
  safetySettings: [...]
});
```

### Modify Cost Tracking

**File**: `aiContentHelpers.js`
**Object**: `COST_TRACKING`

```javascript
const COST_TRACKING = {
  models: {
    "gemini-2.5-pro": { inputCost: 0.00125, outputCost: 0.005 },
    "your-new-model": { inputCost: 0.001, outputCost: 0.004 }
  }
};
```

### Change Limit Logic

**File**: `backend/src/api/middlewares/checkPostLimits.js`
**Function**: `checkPostLimits()`

Modify the logic for checking subscription limits, credit limits, or fallback behavior.

## 🔍 Debugging

### Enable Detailed Logging

Controllers already have comprehensive logging:
```javascript
console.log('🚀 Starting generation...');
console.log('📸 Image prompt:', prompt);
console.log('✅ Success:', result);
console.error('❌ Error:', error);
```

### Check Request Flow

1. **Route**: `aiContentRoutes.js` - Endpoint hit?
2. **Middleware**: `checkPostLimits.js` - Limits passed?
3. **Controller**: `generate*Controller.js` - Logic executed?
4. **Helper**: `aiContentHelpers.js` - AI calls successful?

### Common Issues

**Issue**: "Credit limit reached"
- **Check**: `checkPostLimits.js` middleware
- **Fix**: Verify user subscription and credit balance

**Issue**: "Image generation failed"
- **Check**: `aiContentHelpers.js` → `callImageAI()`
- **Fix**: Check API key, prompt length, aspect ratio

**Issue**: "JSON parse error"
- **Check**: `aiContentHelpers.js` → `generateWithGemini()`
- **Fix**: Improve prompt to ensure JSON output

## 📊 Monitoring

### Track Performance

```javascript
const startTime = Date.now();
// ... your code ...
const processingTime = Date.now() - startTime;
console.log(`⏱️ Processing time: ${processingTime}ms`);
```

### Track Costs

```javascript
const operations = [];
operations.push({ type: "text_generation", model: "gemini-2.5-pro", inputTokens: 100, outputTokens: 50 });
const totalCost = COST_TRACKING.calculateCost(operations);
console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
```

### Track Errors

```javascript
try {
  // Your code
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  // Log to monitoring service
}
```

## 🧪 Testing

### Test Controller

```javascript
const request = require('supertest');
const app = require('../../app');

describe('Generate From Scratch', () => {
  it('should generate content', async () => {
    const response = await request(app)
      .post('/api/ai-content/generate-content')
      .set('Authorization', 'Bearer YOUR_TOKEN')
      .send({
        brief: 'Test content',
        platforms: ['instagram']
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Test Helper

```javascript
const { generateWithGemini } = require('./aiContentHelpers');

describe('AI Helpers', () => {
  it('should generate text', async () => {
    const result = await generateWithGemini('Test prompt');
    expect(result).toBeDefined();
  });
});
```

## 🔐 Security

### Validate Input

```javascript
// Always validate user input
if (!brief || typeof brief !== 'string') {
  return res.status(400).json({ success: false, message: 'Invalid brief' });
}

// Validate base64 images
if (!imageUrl.startsWith('data:image/')) {
  return res.status(400).json({ success: false, message: 'Invalid image' });
}
```

### Sanitize Output

```javascript
// Sanitize AI-generated content before saving
const sanitizedCaption = caption.trim().substring(0, 5000);
```

### Rate Limiting

Consider adding rate limiting per user:
```javascript
// In middleware
const rateLimit = require('express-rate-limit');

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many AI requests, please try again later'
});

router.post('/generate-content', aiLimiter, ...);
```

## 📚 API Reference

### Generate From Scratch
```
POST /api/ai-content/generate-content

Body:
{
  "brief": "string (required)",
  "platforms": ["instagram", "facebook"],
  "brandAssets": { ... },
  "generationOptions": { ... },
  "visualPreferences": { ... }
}

Response:
{
  "success": true,
  "data": {
    "postId": "...",
    "imageUrl": "...",
    "platforms": { ... },
    "metadata": { ... }
  }
}
```

### Customize Template
```
POST /api/ai-content/customize-template

Body:
{
  "template": {
    "name": "string",
    "imageUrl": "string (URL or base64)",
    "category": "string"
  },
  "customizationPrompt": "string (required)",
  "platforms": ["instagram"]
}

Response:
{
  "success": true,
  "data": {
    "postId": "...",
    "imageUrl": "...",
    "platforms": { ... },
    "template": { ... }
  }
}
```

### Generate Caption & Hashtags
```
POST /api/ai-content/generate-caption-hashtags

Body:
{
  "imageUrl": "data:image/png;base64,... (required)",
  "contentBrief": "string (required)",
  "platforms": ["instagram", "facebook"]
}

Response:
{
  "success": true,
  "data": {
    "postId": "...",
    "imageUrl": "...",
    "platforms": {
      "instagram": {
        "caption": "...",
        "hashtags": ["..."]
      }
    }
  }
}
```

## 🎯 Best Practices

### 1. Always Use Middleware Chain
```javascript
router.post(
  '/endpoint',
  authMiddleware,           // Always authenticate
  checkFeatureAccess(...),  // Always check feature access
  checkPostLimits,          // Always check limits
  controller                // Then execute
);
```

### 2. Use Helper Functions
```javascript
// ✅ Good - Use helpers
const result = await generateWithGemini(prompt);

// ❌ Bad - Don't duplicate AI logic
const result = await textModel.generateContent(...);
```

### 3. Handle Errors Gracefully
```javascript
try {
  // Your code
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({
    success: false,
    message: 'User-friendly message',
    error: error.message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}
```

### 4. Track Costs
```javascript
const operations = [];
// ... add operations ...
const totalCost = COST_TRACKING.calculateCost(operations);
// Save to metadata for billing
```

### 5. Save to Database
```javascript
const post = new Post({
  userId,
  content: { imageUrl, platforms, metadata },
  usedCredits: req.usedCredits // From middleware
});
await post.save();
```

## 🔗 File Locations

```
backend/src/api/
├── controllers/
│   ├── aiContentHelpers.js                    ← Shared utilities
│   ├── generateFromScratchController.js       ← Generate from scratch
│   ├── generateFromTemplateController.js      ← Customize templates
│   └── generateCaptionHashtagController.js    ← Caption/hashtag gen
├── middlewares/
│   ├── authMiddleware.js                      ← Authentication
│   ├── checkFeatureAccess.js                  ← Feature access
│   └── checkPostLimits.js                     ← Limit checking
└── routes/
    ├── aiContentRoutes.js                     ← Route definitions
    └── aiContentRoutes.backup.js              ← Original backup
```

## 💡 Tips

1. **Start with helpers** - Check `aiContentHelpers.js` for reusable functions
2. **Follow patterns** - Look at existing controllers for structure
3. **Test incrementally** - Test each component separately
4. **Log everything** - Use console.log for debugging
5. **Handle errors** - Always wrap in try-catch
6. **Document changes** - Update this file when adding features

## 🆘 Need Help?

1. Check documentation files:
   - `AI_CONTENT_REFACTORING.md` - Full refactoring guide
   - `ARCHITECTURE_DIAGRAM.md` - Visual architecture
   - `REFACTORING_SUMMARY.md` - Summary of changes

2. Review existing code:
   - Controllers show complete examples
   - Helpers show utility patterns
   - Routes show middleware chains

3. Test in isolation:
   - Test helpers first
   - Then test controllers
   - Finally test complete flow
