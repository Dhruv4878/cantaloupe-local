"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, Instagram, Linkedin, Facebook, Twitter } from "lucide-react";
import { useRouter } from "next/navigation";
import UnusualActivityModal from "../UnusualActivityModal";

/* ---------- Shared UI Components ---------- */

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative overflow-hidden text-white ${className}`}
    style={{
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.2)",
    }}
  >
    {children}
  </div>
);

/* ---------- Platform Data ---------- */

const socialPlatforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram size={18} className="text-pink-400" />,
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: <Twitter size={18} className="text-sky-400" />,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin size={18} className="text-blue-400" />,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook size={18} className="text-blue-500" />,
  },
];

/* ---------- Main Component ---------- */

const GenerateAIContent = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  /* ---------- Enhanced State Management ---------- */

  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [brief, setBrief] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [brandAssets, setBrandAssets] = useState({
    businessType: "",
    targetAudience: "",
    brandPersonality: ""
  });
  
  // Advanced generation options
  const [generationOptions, setGenerationOptions] = useState({
    contentStrategy: "educational", // educational, promotional, entertaining, inspirational
    visualStyle: "professional", // professional, creative, minimalist, bold
    aspectRatios: ["1:1"], // Default square, can add 16:9, 4:5, 9:16
    optimizeForPlatforms: true
  });

  // Advanced targeting and audience
  const [audienceTargeting, setAudienceTargeting] = useState({
    primaryAudience: "",
    location: ""
  });

  // Campaign context
  const [campaignContext, setCampaignContext] = useState({
    campaignType: "brand_awareness", // product_launch, brand_awareness, lead_generation, sales
    campaignGoal: "engagement", // awareness, engagement, conversion, retention
    seasonality: "", // holiday, back_to_school, summer, etc.
  });

  // Visual preferences
  const [visualPreferences, setVisualPreferences] = useState({
    imageStyle: "photography", // photography, illustration, 3d_render, minimalist
    colorMood: "professional", // calm, energetic, professional, playful
    includeHumanFaces: false,
    includeProducts: true,
    visualComplexity: "simple" // simple, moderate, complex
  });

  // Performance goals
  const [performanceGoals, setPerformanceGoals] = useState({
    businessObjective: "brand_awareness", // brand_awareness, lead_generation, sales, traffic
    ctaType: "learn_more" // shop_now, learn_more, sign_up, download, contact
  });
  
  // Results state
  const [generatedContent, setGeneratedContent] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([]);
  
  const [showUnusualActivityModal, setShowUnusualActivityModal] = useState(false);
  const router = useRouter();

  /* ---------- Helpers ---------- */

  const readJsonSafely = async (response) => {
    const contentType = response.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (_) {
        return null;
      }
    }
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  };

  const buildHttpError = async (response, defaultMessage) => {
    const body = await readJsonSafely(response);
    const messageFromBody = body?.message || body?.error || body?.detail;
    const statusInfo = `(${response.status}${
      response.statusText ? " " + response.statusText : ""
    })`;
    const err = new Error(
      messageFromBody || `${defaultMessage} ${statusInfo}`.trim()
    );
    err.status = response.status;
    return err;
  };

  const handlePlatformChange = (platformId) => {
    setSelectedPlatforms((prevSelected) => ({
      ...prevSelected,
      [platformId]: !prevSelected[platformId],
    }));
  };

  /* ---------- Effects ---------- */

  useEffect(() => {
    try {
      const storedBrief = sessionStorage.getItem("creativeBrief");
      const storedPlatforms = sessionStorage.getItem("targetPlatforms");
      if (storedBrief) setBrief(storedBrief);
      if (storedPlatforms) {
        const parsed = JSON.parse(storedPlatforms);
        if (parsed && typeof parsed === "object") {
          setSelectedPlatforms(parsed);
        }
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("creativeBrief", brief || "");
      sessionStorage.setItem(
        "targetPlatforms",
        JSON.stringify(selectedPlatforms || {})
      );
    } catch (_) {}
  }, [brief, selectedPlatforms]);

  useEffect(() => {
    // Load brand assets from onboarding data
    const loadBrandAssets = () => {
      try {
        const onboardingData = JSON.parse(sessionStorage.getItem("onboardingStep2") || "{}");
        if (onboardingData.businessType || onboardingData.targetAudience || onboardingData.brandPersonality) {
          setBrandAssets({
            businessType: onboardingData.businessType || "",
            targetAudience: onboardingData.targetAudience || "",
            brandPersonality: onboardingData.brandPersonality === "Professional & Trustworthy" 
              ? "Professional, trustworthy, innovative"
              : onboardingData.brandPersonality === "Creative & Bold"
              ? "Creative, bold, disruptive"
              : onboardingData.brandPersonality === "Friendly & Approachable"
              ? "Friendly, approachable, community-focused"
              : onboardingData.brandPersonality === "Luxury & Premium"
              ? "Luxury, premium, exclusive"
              : onboardingData.brandPersonality === "Fun & Energetic"
              ? "Fun, energetic, youthful"
              : onboardingData.brandPersonality === "Expert & Educational"
              ? "Expert, authoritative, educational"
              : "Professional, trustworthy, innovative"
          });
        }
      } catch (err) {
        console.error("Error loading brand assets from onboarding:", err);
      }
    };

    loadBrandAssets();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          setError("Please log in to view your generated posts.");
          router.push("/login");
          return;
        }

        const response = await fetch(`${apiUrl}/posts`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw await buildHttpError(response, "Failed to fetch history.");
        }

        const postsFromDb = await readJsonSafely(response);
        if (!postsFromDb) {
          throw new Error("History response was not valid JSON.");
        }
        setHistory(postsFromDb);
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err?.status === 401 || err?.status === 403) {
          try {
            sessionStorage.removeItem("authToken");
          } catch (_) {}
          setError("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }
      }
    };

    fetchHistory();
  }, [apiUrl, router]);

  /* ---------- Handlers ---------- */

  const saveContentToDb = async (generatedData, token) => {
    try {
      const response = await fetch(`${apiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(generatedData),
      });

      if (!response.ok) {
        throw new Error("Failed to save the post to the database.");
      }
      const saved = await readJsonSafely(response);
      console.log("Content saved to database successfully!", saved);
      return saved?.post?._id;
    } catch (error) {
      console.error("Error saving to DB:", error.message);
      setError(
        "Content was generated but failed to save. You can try saving it manually later."
      );
      return null;
    }
  };

  const checkPlanStatus = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        return true; // Allow if no token (will be caught by auth check)
      }

      const response = await fetch(`${apiUrl}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if user has a paid subscription that's been suspended by admin
        const hasActiveSubscription = data?.plan?.planName && data.plan.planName !== "Free";
        const isSubscriptionActive = data?.subscription?.is_active;
        
        // If user has a paid plan but it's been deactivated by admin, block API call
        if (hasActiveSubscription && isSubscriptionActive === false) {
          console.log("Plan suspended by admin - blocking API call and showing modal");
          setShowUnusualActivityModal(true);
          return false; // Plan is suspended
        }
      }
      
      return true; // Plan is active or user is on free plan
    } catch (error) {
      console.error("Error checking plan status:", error);
      return true; // Allow on error to avoid blocking legitimate users
    }
  };

  /* ---------- Enhanced Handlers ---------- */

  const handleGenerateContent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("Your session has ended. Please log in again.");
        router.push("/login");
        return;
      }

      // Check if plan is suspended before making API call
      const isPlanActive = await checkPlanStatus();
      if (!isPlanActive) {
        setIsLoading(false);
        return;
      }

      // Use brand assets from onboarding (no profile enhancement needed)
      const generateResponse = await fetch(`${apiUrl}/create-content-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brief,
          platforms: Object.keys(selectedPlatforms).filter(
            (key) => selectedPlatforms[key]
          ),
          brandAssets,
          generationOptions,
          audienceTargeting,
          campaignContext,
          visualPreferences,
          performanceGoals
        }),
      });

      if (!generateResponse.ok) {
        // Check for suspended plan error first
        if (generateResponse.status === 403) {
          try {
            const errorData = await generateResponse.json();
            if (errorData.suspendedPlan) {
              setShowUnusualActivityModal(true);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {
            // Continue with normal error handling if JSON parsing fails
          }
        }
        
        const err = await buildHttpError(
          generateResponse,
          "Failed to generate content."
        );
        
        if (err?.status === 401 || err?.status === 403) {
          try {
            sessionStorage.removeItem("authToken");
          } catch (_) {}
          setError("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }
        throw err;
      }

      console.log("=== FRONTEND DEBUG ===");
      console.log("Raw response status:", generateResponse.status);
      console.log("Raw response ok:", generateResponse.ok);
      console.log("Raw response headers:", generateResponse.headers);
      console.log("Response content-type:", generateResponse.headers?.get?.("content-type"));
      
      // Read the response as JSON directly
      let contentPlan;
      try {
        // Clone the response to read it as text for debugging if needed
        const responseClone = generateResponse.clone();
        const responseText = await responseClone.text();
        console.log("Raw response text:", responseText);
        console.log("Response text length:", responseText.length);
        
        // Parse the original response as JSON
        contentPlan = await generateResponse.json();
        console.log("Parsed contentPlan:", contentPlan);
        console.log("contentPlan type:", typeof contentPlan);
        console.log("contentPlan keys:", contentPlan ? Object.keys(contentPlan) : "null/undefined");
        console.log("contentPlan.success:", contentPlan?.success);
      } catch (parseError) {
        console.error("Response parsing failed:", parseError);
        console.error("Parse error details:", {
          message: parseError.message,
          stack: parseError.stack
        });
        
        // Try to get error details from response if available
        try {
          const errorText = await generateResponse.text();
          console.error("Error response body:", errorText);
          if (errorText) {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || errorData.message || "Failed to parse response");
          }
        } catch (e) {
          // Ignore secondary parse errors
        }
        
        throw new Error("Failed to parse API response. Please try again.");
      }
      
      // Validate the response structure
      if (!contentPlan) {
        console.error("Content plan is null or undefined");
        throw new Error("Generate response was empty or invalid.");
      }
      
      // Check if response has success flag or if it's an error response
      if (contentPlan.error) {
        console.error("API returned error:", contentPlan.error);
        throw new Error(contentPlan.error || "Content generation failed");
      }
      
      // Accept response with success: true OR response with platforms (backward compatibility)
      const hasSuccess = contentPlan.success === true;
      const hasPlatforms = contentPlan.platforms && typeof contentPlan.platforms === 'object' && Object.keys(contentPlan.platforms).length > 0;
      
      if (!hasSuccess && !hasPlatforms) {
        console.error("Content plan validation failed:", { 
          contentPlan, 
          success: contentPlan?.success,
          hasPlatforms,
          platforms: contentPlan?.platforms,
          type: typeof contentPlan,
          keys: Object.keys(contentPlan || {})
        });
        throw new Error("Generate response was not valid or failed.");
      }
      
      // Ensure success flag is set for consistency
      if (!contentPlan.success) {
        contentPlan.success = true;
      }

      // Store generated content with enhanced metadata
      setGeneratedContent(contentPlan);
      setQualityScore(contentPlan.metadata?.qualityScore || null);
      setOptimizationSuggestions(contentPlan.metadata?.optimizationSuggestions || []);

      // Save to database and navigate
      const newPostId = await saveContentToDb(contentPlan, token);
      if (newPostId) {
        router.push(`/generatepost?id=${newPostId}`);
      } else {
        console.error("Could not get a new post ID, staying on page.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = (post) => {
    router.push(`/generatepost?id=${post._id}`);
  };

  const handleClear = () => {
    setBrief("");
    setSelectedPlatforms({});
    setError(null);
    try {
      sessionStorage.removeItem("creativeBrief");
      sessionStorage.removeItem("targetPlatforms");
    } catch (_) {}
  };

  /* ---------- UI Render ---------- */

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* GRID LAYOUT:
         The 'items-stretch' (default) ensures both columns are equal height.
         We add 'h-full' to the GlassCards so they fill that available height.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Brief + Platforms + Generate */}
        <div className="lg:col-span-2">
          {/* Added 'h-full' to stretch this card to match the neighbor */}
          <GlassCard className="h-full flex flex-col">
            <form onSubmit={handleGenerateContent} className="space-y-6 flex-grow">
              
              {/* Step 1: Creative Brief */}
              <div>
                <h2 className="text-xl font-bold mb-2">1. Creative Brief</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Describe the topic or idea for your social media post. The more
                  detail, the better the result.
                </p>
                <textarea
                  className="w-full h-32 p-3 rounded-lg bg-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 border border-transparent"
                  placeholder="e.g., A post about the top 5 benefits of using our new productivity app..."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </div>

              {/* Step 2: Content Strategy */}
              <div>
                <h2 className="text-xl font-bold mb-2">2. Content Strategy</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Choose your content approach and visual style for maximum impact.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Content Strategy
                    </label>
                    <CustomSelect
                      value={generationOptions.contentStrategy}
                      onChange={(value) => setGenerationOptions(prev => ({ ...prev, contentStrategy: value }))}
                      options={[
                        { value: "educational", label: "Educational (How-to, Tips)" },
                        { value: "promotional", label: "Promotional (Product/Service)" },
                        { value: "entertaining", label: "Entertaining (Engaging, Fun)" },
                        { value: "inspirational", label: "Inspirational (Motivational)" },
                        { value: "behind-the-scenes", label: "Behind the Scenes" },
                        { value: "user-generated", label: "User Generated Content" }
                      ]}
                      placeholder="Select content strategy..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Visual Style
                    </label>
                    <CustomSelect
                      value={generationOptions.visualStyle}
                      onChange={(value) => setGenerationOptions(prev => ({ ...prev, visualStyle: value }))}
                      options={[
                        { value: "professional", label: "Professional & Clean" },
                        { value: "creative", label: "Creative & Artistic" },
                        { value: "minimalist", label: "Minimalist & Modern" },
                        { value: "bold", label: "Bold & Eye-catching" },
                        { value: "lifestyle", label: "Lifestyle & Authentic" },
                        { value: "corporate", label: "Corporate & Formal" }
                      ]}
                      placeholder="Select visual style..."
                    />
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Aspect Ratio Preference
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: '1:1', label: 'Square (1:1)', desc: 'Instagram posts' },
                        { value: '16:9', label: 'Landscape (16:9)', desc: 'YouTube thumbnails' },
                        { value: '4:5', label: 'Portrait (4:5)', desc: 'Instagram stories' },
                        { value: '9:16', label: 'Vertical (9:16)', desc: 'TikTok, Reels' }
                      ].map(({ value, label, desc }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setGenerationOptions(prev => ({ 
                            ...prev, 
                            aspectRatios: [value] 
                          }))}
                          className={`p-3 rounded-lg border text-xs transition-all text-center
                            ${generationOptions.aspectRatios?.[0] === value
                              ? "bg-orange-400/20 border-orange-400 text-orange-300"
                              : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                        >
                          <div className="font-medium">{label}</div>
                          <div className="text-[10px] text-gray-400 mt-1">{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Platform Optimization</p>
                      <p className="text-xs text-gray-400">Customize content for each platform's best practices</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGenerationOptions(prev => ({ ...prev, optimizeForPlatforms: !prev.optimizeForPlatforms }))}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                        ${generationOptions.optimizeForPlatforms
                          ? "bg-orange-400 border-orange-300"
                          : "border-white/30 bg-transparent"
                        }`}
                    >
                      {generationOptions.optimizeForPlatforms && (
                        <span className="text-[10px] text-white">✓</span>
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Step 3: Audience & Campaign Strategy */}
              <div>
                <h2 className="text-xl font-bold mb-2">3. Audience & Campaign Strategy</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Define your target audience and campaign objectives for better content optimization.
                </p>
                
                <div className="space-y-4">
                  {/* Audience Targeting */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Primary Audience
                      </label>
                      <input
                        type="text"
                        value={audienceTargeting.primaryAudience}
                        onChange={(e) => setAudienceTargeting(prev => ({ ...prev, primaryAudience: e.target.value }))}
                        placeholder="e.g., Young professionals 25-35"
                        className="w-full p-2 rounded-lg bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Location/Market
                      </label>
                      <input
                        type="text"
                        value={audienceTargeting.location}
                        onChange={(e) => setAudienceTargeting(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., United States, India, Global"
                        className="w-full p-2 rounded-lg bg-white/10 text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Campaign Context */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Campaign Type
                      </label>
                      <CustomSelect
                        value={campaignContext.campaignType}
                        onChange={(value) => setCampaignContext(prev => ({ ...prev, campaignType: value }))}
                        options={[
                          { value: "brand_awareness", label: "Brand Awareness" },
                          { value: "product_launch", label: "Product Launch" },
                          { value: "lead_generation", label: "Lead Generation" },
                          { value: "sales_promotion", label: "Sales Promotion" },
                          { value: "event_promotion", label: "Event Promotion" },
                          { value: "customer_retention", label: "Customer Retention" }
                        ]}
                        placeholder="Select campaign type..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Primary Goal
                      </label>
                      <CustomSelect
                        value={campaignContext.campaignGoal}
                        onChange={(value) => setCampaignContext(prev => ({ ...prev, campaignGoal: value }))}
                        options={[
                          { value: "awareness", label: "Increase Awareness" },
                          { value: "engagement", label: "Drive Engagement" },
                          { value: "conversion", label: "Generate Conversions" },
                          { value: "retention", label: "Retain Customers" },
                          { value: "traffic", label: "Drive Website Traffic" },
                          { value: "community", label: "Build Community" }
                        ]}
                        placeholder="Select primary goal..."
                      />
                    </div>
                  </div>

                  {/* Seasonality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Seasonality/Context
                    </label>
                    <CustomSelect
                      value={campaignContext.seasonality}
                      onChange={(value) => setCampaignContext(prev => ({ ...prev, seasonality: value }))}
                      options={[
                        { value: "", label: "No specific season" },
                        { value: "holiday", label: "Holiday Season" },
                        { value: "summer", label: "Summer" },
                        { value: "back_to_school", label: "Back to School" },
                        { value: "new_year", label: "New Year" },
                        { value: "valentine", label: "Valentine's Day" },
                        { value: "black_friday", label: "Black Friday/Sales" },
                        { value: "spring", label: "Spring" },
                        { value: "winter", label: "Winter" }
                      ]}
                      placeholder="Select seasonality..."
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Visual Style & Performance Goals */}
              <div>
                <h2 className="text-xl font-bold mb-2">4. Visual Style & Performance Goals</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Customize visual preferences and set performance expectations.
                </p>
                
                <div className="space-y-4">
                  {/* Visual Preferences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Image Style
                      </label>
                      <CustomSelect
                        value={visualPreferences.imageStyle}
                        onChange={(value) => setVisualPreferences(prev => ({ ...prev, imageStyle: value }))}
                        options={[
                          { value: "photography", label: "Photography (Realistic)" },
                          { value: "illustration", label: "Illustration (Artistic)" },
                          { value: "3d_render", label: "3D Render (Modern)" },
                          { value: "minimalist", label: "Minimalist (Clean)" },
                          { value: "infographic", label: "Infographic (Data)" },
                          { value: "collage", label: "Collage (Mixed)" }
                        ]}
                        placeholder="Select image style..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Color Mood
                      </label>
                      <CustomSelect
                        value={visualPreferences.colorMood}
                        onChange={(value) => setVisualPreferences(prev => ({ ...prev, colorMood: value }))}
                        options={[
                          { value: "professional", label: "Professional (Blues/Grays)" },
                          { value: "energetic", label: "Energetic (Bright/Bold)" },
                          { value: "calm", label: "Calm (Soft/Muted)" },
                          { value: "playful", label: "Playful (Vibrant/Fun)" },
                          { value: "luxury", label: "Luxury (Gold/Black)" },
                          { value: "natural", label: "Natural (Earth Tones)" }
                        ]}
                        placeholder="Select color mood..."
                      />
                    </div>
                  </div>

                  {/* Visual Elements Toggles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Visual Elements to Include
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'includeHumanFaces', label: 'Human Faces' },
                        { key: 'includeProducts', label: 'Products' },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 bg-white/5">
                          <span className="text-sm text-white">{label}</span>
                          <button
                            type="button"
                            onClick={() => setVisualPreferences(prev => ({ ...prev, [key]: !prev[key] }))}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                              ${visualPreferences[key]
                                ? "bg-orange-400 border-orange-300"
                                : "border-white/30 bg-transparent"
                              }`}
                          >
                            {visualPreferences[key] && (
                              <span className="text-[10px] text-white">✓</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Goals */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Call-to-Action Type
                    </label>
                    <CustomSelect
                      value={performanceGoals.ctaType}
                      onChange={(value) => setPerformanceGoals(prev => ({ ...prev, ctaType: value }))}
                      options={[
                        { value: "learn_more", label: "Learn More" },
                        { value: "shop_now", label: "Shop Now" },
                        { value: "sign_up", label: "Sign Up" },
                        { value: "download", label: "Download" },
                        { value: "contact", label: "Contact Us" },
                        { value: "visit", label: "Visit Website" },
                        { value: "follow", label: "Follow Us" }
                      ]}
                      placeholder="Select CTA type..."
                    />
                  </div>
                </div>
              </div>

              {/* Step 5: Target Platforms */}
              <div>
                <h2 className="text-xl font-bold mb-2">5. Target Platforms</h2>
                <p className="text-sm text-gray-300 mb-3">
                  Select the social media platforms you want to target.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {socialPlatforms.map((platform) => {
                    const selected = !!selectedPlatforms[platform.id];
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePlatformChange(platform.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border text-sm transition-all
                          ${
                            selected
                              ? "bg-white/15 border-orange-400 shadow-lg shadow-orange-500/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {platform.icon}
                          <span className="font-medium">{platform.name}</span>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px]
                            ${
                              selected
                                ? "bg-orange-400 border-orange-300"
                                : "border-white/30"
                            }`}
                        >
                          {selected ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions (Pushed to bottom via flex-grow on form if needed, but here just standard flow) */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2 mt-auto">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-2 rounded-full border border-white/20 text-sm text-gray-200 hover:bg-white/10 transition"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    !brief.trim() ||
                    Object.values(selectedPlatforms).every((v) => !v)
                  }
                  className="
                    inline-flex
                    items-center justify-center
                    rounded-full
                    text-[14px] font-semibold text-white
                    whitespace-nowrap
                    px-4 py-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition
                    hover:scale-[1.03]
                  "
                  style={{
                    background:
                      "linear-gradient(119.02deg, #FCAC00 -22.94%, #FF6E00 83.73%)",
                  }}
                >
                  {isLoading ? "Generating..." : "Generate Content"}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 mt-2">{error}</p>
              )}

              {/* Quality Score & Optimization Suggestions */}
              {generatedContent && (
                <div className="mt-4 space-y-3">
                  {/* Template Information */}
                  {generatedContent.metadata?.templateUsed && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">Template Used</h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            generatedContent.metadata.templateUsed.score >= 80 ? 'bg-green-400' : 
                            generatedContent.metadata.templateUsed.score >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <span className="text-sm font-bold text-white">{generatedContent.metadata.templateUsed.score}/100</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-white font-medium">{generatedContent.metadata.templateUsed.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.metadata.templateUsed.industry?.map((industry, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              {industry}
                            </span>
                          ))}
                          {generatedContent.metadata.templateUsed.contentType?.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Performance Metrics */}
                  {generatedContent.metadata?.performance && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Performance Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Total Time</p>
                          <p className="text-sm font-semibold text-white">
                            {(generatedContent.metadata.performance.totalTime / 1000).toFixed(2)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Estimated Cost</p>
                          <p className="text-sm font-semibold text-green-400">
                            ${generatedContent.metadata.performance.estimatedCost?.toFixed(4) || '0.0000'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Image Generation</p>
                          <p className="text-sm font-semibold text-white">
                            {(generatedContent.metadata.performance.imageGenerationTime / 1000).toFixed(2)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Platform Content</p>
                          <p className="text-sm font-semibold text-white">
                            {(generatedContent.metadata.performance.platformGenerationTime / 1000).toFixed(2)}s
                          </p>
                        </div>
                      </div>
                      
                      {/* Model Usage Details */}
                      {generatedContent.metadata.modelUsage && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-gray-400 mb-2">Model Usage</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">Text Model:</span>
                              <span className="text-white">{generatedContent.metadata.modelUsage.textModel}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">Image Model:</span>
                              <span className="text-white">{generatedContent.metadata.modelUsage.imageModel}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-300">Total Tokens:</span>
                              <span className="text-white">{generatedContent.metadata.modelUsage.totalTokens?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {qualityScore && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-white">Content Quality Score</h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            qualityScore >= 80 ? 'bg-green-400' : 
                            qualityScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <span className="text-lg font-bold text-white">{qualityScore}/100</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            qualityScore >= 80 ? 'bg-green-400' : 
                            qualityScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${qualityScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {qualityScore >= 80 ? 'Excellent! Ready for professional use.' :
                         qualityScore >= 60 ? 'Good quality. Consider the suggestions below.' :
                         'Needs improvement. Please review suggestions.'}
                      </p>
                    </div>
                  )}

                  {optimizationSuggestions.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-2">Optimization Suggestions</h3>
                      <ul className="space-y-1">
                        {optimizationSuggestions.map((suggestion, index) => (
                          <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedContent.metadata?.estimatedReach && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-2">Estimated Reach</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-orange-400">
                          {generatedContent.metadata.estimatedReach.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400">potential impressions</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Based on platform algorithms and engagement predictions
                      </p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </GlassCard>
        </div>

        {/* RIGHT: Recent AI Generations (history) + Guidelines */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recent Generations */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Generations</h2>
            </div>

            {history && history.length > 0 ? (
              <div className="space-y-3">
                {history.slice(0, 3).map((h) => (
                  <div
                    key={h._id}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3"
                  >
                    <div className="pr-2 min-w-0">
                      <h3 className="font-medium text-sm text-white mb-1 line-clamp-2">
                        {(h.content?.postContent || "Generated Post").slice(0, 60)}
                      </h3>
                      <p className="text-xs text-gray-300 line-clamp-1">
                        {h.content?.platforms
                          ? Object.keys(h.content.platforms).join(", ")
                          : ""}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewHistory(h)}
                      className="text-xs font-semibold text-orange-300 hover:text-orange-200 whitespace-nowrap mt-1"
                    >
                      View →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-300 py-4">
                <p className="font-medium">No generated content yet</p>
                <p className="text-xs mt-1 text-gray-500">
                  Generate a post to see it appear here.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Content Generation Guidelines */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Content Generation Tips</h2>
            </div>

            <div className="space-y-4">
              {/* Creative Brief Tips */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-blue-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">1</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Write Detailed Creative Briefs</h3>
                </div>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Include specific details about your product/service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Mention key benefits and unique selling points</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Add context like promotions, events, or seasonal relevance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Example: "Launch post for our new eco-friendly yoga mats with 30% off for Earth Day"</span>
                  </li>
                </ul>
              </div>

              {/* Field Completion Tips */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Complete All Fields for Best Results</h3>
                </div>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Fill out audience targeting for personalized content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Choose specific visual preferences (style, colors, elements)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Select campaign type and goals for better optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>More fields = higher quality score (aim for 80%+)</span>
                  </li>
                </ul>
              </div>

              {/* AI Model Tips */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-purple-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">3</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Optimize for AI Models</h3>
                </div>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Use specific keywords related to your industry</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Mention emotions you want to evoke (excitement, trust, urgency)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span>Include target demographics for better image generation</span>
                  </li>
                </ul>
              </div>

              {/* Platform Optimization */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-pink-400 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">4</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">Platform-Specific Tips</h3>
                </div>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span><strong>Instagram:</strong> Visual-first, lifestyle content works best</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span><strong>LinkedIn:</strong> Professional insights and industry expertise</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span><strong>X (Twitter):</strong> Concise, trending topics and conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">•</span>
                    <span><strong>Facebook:</strong> Community-focused, storytelling content</span>
                  </li>
                </ul>
              </div>

              {/* Quality Indicators - Commented out for future implementation */}
              {/* 
              <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-orange-300">Quality Indicators</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-1"></div>
                    <span className="text-green-300">80%+ Score</span>
                    <p className="text-gray-400 text-[10px]">Agency Level</p>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto mb-1"></div>
                    <span className="text-yellow-300">60-79% Score</span>
                    <p className="text-gray-400 text-[10px]">Professional</p>
                  </div>
                  <div className="text-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mb-1"></div>
                    <span className="text-red-300">Below 60%</span>
                    <p className="text-gray-400 text-[10px]">Needs Work</p>
                  </div>
                </div>
              </div>
              */}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Unusual Activity Modal */}
      <UnusualActivityModal 
        isOpen={showUnusualActivityModal}
        onClose={() => setShowUnusualActivityModal(false)}
      />
    </div>
  );
};

/* ----------------- CustomSelect Component ----------------- */

function CustomSelect({ value, onChange, options = [], placeholder = "" }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (!btnRef.current) return;
      if (btnRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (open && panelRef.current) {
      const node = panelRef.current.children[highlighted];
      if (node) node.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted, open]);

  function toggle() {
    setOpen((v) => !v);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlighted];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className="appearance-none w-full text-left rounded-xl border border-white/10 px-3.5 py-2.5 pr-9 bg-black/50 text-sm text-white shadow-sm hover:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/80 transition"
      >
        <span className="flex items-center gap-2">
          <span className={value ? "text-white" : "text-slate-500 truncate"}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg
            className={
              "w-4 h-4 transition-transform " + (open ? "rotate-180" : "")
            }
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8l4 4 4-4" />
          </svg>
        </div>
      </button>

      {open && (
        <ul
          role="listbox"
          ref={panelRef}
          tabIndex={-1}
          className="absolute z-40 mt-2 w-full bg-[#05040F] border border-white/10 rounded-xl shadow-xl max-h-44 overflow-auto"
          onKeyDown={onKeyDown}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value + i}
              role="option"
              aria-selected={value === opt.value}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={
                "px-3.5 py-2 text-sm cursor-pointer flex items-center gap-2 " +
                (highlighted === i
                  ? "bg-white/10 text-white"
                  : "text-slate-200") +
                (value === opt.value ? " font-semibold" : "")
              }
            >
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GenerateAIContent;