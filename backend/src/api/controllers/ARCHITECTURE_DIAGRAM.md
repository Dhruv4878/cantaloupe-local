# AI Content Generation Architecture

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    aiContentRoutes.js                           │
│                    (Route Definitions)                          │
│                                                                 │
│  POST /generate-content                                         │
│  POST /customize-template                                       │
│  POST /generate-caption-hashtags                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MIDDLEWARE CHAIN                             │
│                                                                 │
│  1. authMiddleware          → Verify JWT token                 │
│  2. checkFeatureAccess      → Check plan features              │
│  3. checkPostLimits         → Validate credits/monthly limits  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLERS                               │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  generateFromScratchController.js                     │    │
│  │  • Validate input                                     │    │
│  │  • Generate content strategy                          │    │
│  │  • Create image with AI                               │    │
│  │  • Generate platform content                          │    │
│  │  • Save to database                                   │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  generateFromTemplateController.js                    │    │
│  │  • Validate template                                  │    │
│  │  • Analyze template with Vision AI                    │    │
│  │  • Generate modified image                            │    │
│  │  • Generate platform content                          │    │
│  │  • Save to database                                   │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  generateCaptionHashtagController.js                  │    │
│  │  • Validate user image                                │    │
│  │  • Upload to Cloudinary                               │    │
│  │  • Generate captions & hashtags                       │    │
│  │  • Save to database                                   │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    aiContentHelpers.js                          │
│                    (Shared Utilities)                           │
│                                                                 │
│  • generateWithGemini()      → Text generation                 │
│  • callImageAI()             → Image generation                │
│  • uploadImageToCloudinary() → Image storage                   │
│  • callPlatformContentAI()   → Platform-specific content       │
│  • downloadImageAsBase64()   → Image processing                │
│  • COST_TRACKING             → Cost calculation                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Gemini AI  │  │  Imagen AI   │  │  Cloudinary  │        │
│  │              │  │              │  │              │        │
│  │ Text Gen     │  │ Image Gen    │  │ Image Store  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE                                  │
│                                                                 │
│  Post Model:                                                    │
│  • userId                                                       │
│  • content (imageUrl, platforms, metadata)                     │
│  • usedCredits (boolean)                                       │
│  • createdAt                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      JSON RESPONSE                              │
│                                                                 │
│  {                                                              │
│    success: true,                                               │
│    data: {                                                      │
│      postId: "...",                                             │
│      imageUrl: "...",                                           │
│      platforms: { ... },                                        │
│      metadata: { ... }                                          │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Module Dependencies

```
aiContentRoutes.js
├── authMiddleware.js
├── checkFeatureAccess.js
├── checkPostLimits.js
│   ├── subscriptionService.js
│   ├── subscriptionUsageService.js
│   ├── Post.js (model)
│   └── User.js (model)
├── generateFromScratchController.js
│   ├── aiContentHelpers.js
│   └── Post.js (model)
├── generateFromTemplateController.js
│   ├── aiContentHelpers.js
│   └── Post.js (model)
└── generateCaptionHashtagController.js
    ├── aiContentHelpers.js
    └── Post.js (model)

aiContentHelpers.js
├── @google/generative-ai
├── cloudinary
└── axios
```

## Data Flow: Generate From Scratch

```
1. User Request
   └─> { brief, platforms, brandAssets, ... }

2. Middleware Chain
   ├─> authMiddleware: Verify user
   ├─> checkFeatureAccess: Check plan allows AI generation
   └─> checkPostLimits: Check credits/monthly limits
       └─> Sets req.usedCredits = true/false

3. Controller: generateFromScratch
   ├─> Build strategy prompt
   ├─> Call Gemini AI → Get content strategy
   ├─> Build image prompt
   ├─> Call Imagen AI → Get image (base64)
   ├─> Upload to Cloudinary → Get permanent URL
   ├─> For each platform:
   │   └─> Call Gemini AI → Get caption & hashtags
   ├─> Calculate costs
   └─> Save to database

4. Response
   └─> { postId, imageUrl, platforms, metadata }
```

## Data Flow: Customize Template

```
1. User Request
   └─> { template, customizationPrompt, platforms, ... }

2. Middleware Chain
   ├─> authMiddleware: Verify user
   ├─> checkFeatureAccess: Check plan allows AI generation
   └─> checkPostLimits: Check credits/monthly limits

3. Controller: generateFromTemplate
   ├─> Validate template (URL or base64)
   ├─> Download/extract template image
   ├─> Call Gemini Vision → Analyze template
   ├─> Call Imagen AI → Generate modified image
   ├─> Upload to Cloudinary → Get permanent URL
   ├─> For each platform:
   │   └─> Call Gemini AI → Get caption & hashtags
   ├─> Calculate costs
   └─> Save to database

4. Response
   └─> { postId, imageUrl, platforms, template, metadata }
```

## Data Flow: Generate Caption & Hashtags

```
1. User Request
   └─> { imageUrl (base64), contentBrief, platforms }

2. Middleware Chain
   ├─> authMiddleware: Verify user
   ├─> checkFeatureAccess: Check plan allows AI generation
   └─> checkPostLimits: Check credits/monthly limits

3. Controller: generateCaptionHashtag
   ├─> Validate base64 image
   ├─> Upload to Cloudinary → Get permanent URL
   ├─> For each platform:
   │   └─> Call Gemini AI → Get caption & hashtags
   ├─> Calculate costs
   └─> Save to database

4. Response
   └─> { postId, imageUrl, platforms, metadata }
```

## Error Handling Flow

```
┌─────────────────┐
│  Any Error      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Try-Catch      │
│  Block          │
└────────┬────────┘
         │
         ├─> Log error details
         │   (console.error)
         │
         ├─> Return JSON error
         │   { success: false, message, error }
         │
         └─> Include stack trace
             (development mode only)
```

## File Size Comparison

### Before Refactoring
```
aiContentRoutes.js: 1129 lines (monolithic)
```

### After Refactoring
```
aiContentRoutes.js:                    ~180 lines (routes only)
aiContentHelpers.js:                   ~280 lines (utilities)
generateFromScratchController.js:      ~320 lines (controller)
generateFromTemplateController.js:     ~220 lines (controller)
generateCaptionHashtagController.js:   ~150 lines (controller)
checkPostLimits.js:                    ~140 lines (middleware)
─────────────────────────────────────────────────────────
Total:                                 ~1290 lines
```

**Result**: Similar total lines, but organized into 6 focused, maintainable files instead of 1 massive file.

## Benefits Summary

### Maintainability ✅
- Each file has single responsibility
- Easy to locate specific functionality
- Clear separation of concerns

### Testability ✅
- Controllers can be unit tested
- Helpers can be tested in isolation
- Middleware can be tested separately

### Scalability ✅
- Easy to add new generation methods
- Simple to extend existing features
- Modular structure supports team work

### Reusability ✅
- Shared helpers eliminate duplication
- Common middleware for all routes
- Consistent patterns across controllers

### Production-Grade ✅
- Comprehensive error handling
- Detailed logging
- Input validation
- Cost tracking
- Performance monitoring
