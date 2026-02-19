"use client";

import React, { useEffect, useState } from "react";
import { 
  Instagram, Linkedin, Facebook, Twitter, ArrowLeft, 
  Sparkles, Info, Loader2, AlertCircle, LayoutTemplate, Brush
} from "lucide-react";
import { useRouter } from "next/navigation";
import UnusualActivityModal from "../UnusualActivityModal";
import { usePostCount } from "@/lib/postCountContext";

/* ---------- Shared UI Components ---------- */

const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative overflow-hidden text-white bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ${className}`}
  >
    {children}
  </div>
);

/* ---------- Platform Data ---------- */

const socialPlatforms = [
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram size={18} className="group-hover:text-pink-400 transition-colors" />,
  },
  {
    id: "x",
    name: "X (Twitter)",
    icon: <Twitter size={18} className="group-hover:text-sky-400 transition-colors" />,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin size={18} className="group-hover:text-blue-400 transition-colors" />,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook size={18} className="group-hover:text-blue-500 transition-colors" />,
  },
];

/* ---------- Main Component ---------- */

const GenerateAIContent = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const { triggerRefresh } = usePostCount();
  const router = useRouter();

  /* ---------- State Management ---------- */

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [fieldValues, setFieldValues] = useState({});
  const [brief, setBrief] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brandAssets, setBrandAssets] = useState({
    businessType: "",
    targetAudience: "",
    brandPersonality: ""
  });
  
  const [generationOptions, setGenerationOptions] = useState({
    aspectRatios: ["1:1"]
  });
  
  const [showUnusualActivityModal, setShowUnusualActivityModal] = useState(false);

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

  const handleFieldChange = (fieldName, value) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setFieldValues({});
  };

  /* ---------- Effects ---------- */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const endpoint = `${apiUrl}/infographic-categories`;
        const response = await fetch(endpoint);
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          setError("Failed to load infographic categories. Please refresh the page.");
        }
      } catch (err) {
        setError("Failed to load infographic categories. Please check your connection.");
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [apiUrl]);

  useEffect(() => {
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
    try {
      const savedBrief = localStorage.getItem('generatePostView_brief');
      if (savedBrief) {
        setBrief(savedBrief);
      }
    } catch (err) {
      console.error('Error loading persisted brief:', err);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (brief) {
          localStorage.setItem('generatePostView_brief', brief);
        } else {
          localStorage.removeItem('generatePostView_brief');
        }
      } catch (err) {
        console.error('Error saving brief to localStorage:', err);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [brief]);

  /* ---------- Handlers ---------- */

  const checkPlanStatus = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) return true;

      const response = await fetch(`${apiUrl}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const hasActiveSubscription = data?.plan?.planName && data.plan.planName !== "Free";
        const isSubscriptionActive = data?.subscription?.is_active;
        
        if (hasActiveSubscription && isSubscriptionActive === false) {
          setShowUnusualActivityModal(true);
          return false;
        }
      }
      return true;
    } catch (error) {
      return true;
    }
  };

  const handleGenerateContent = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setError("Your session has ended. Please log in again.");
        router.push("/login");
        return;
      }

      const isPlanActive = await checkPlanStatus();
      if (!isPlanActive) {
        setIsLoading(false);
        return;
      }

      if (!brief || brief.trim() === '') {
        setError('Please enter a creative brief to generate content.');
        setIsLoading(false);
        return;
      }

      const generateResponse = await fetch(`${apiUrl}/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brief: brief,
          category: selectedCategory || undefined,
          fieldValues: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
          platforms: Object.keys(selectedPlatforms).filter((key) => selectedPlatforms[key]),
          brandAssets,
          generationOptions
        }),
      });

      if (!generateResponse.ok) {
        if (generateResponse.status === 403) {
          try {
            const errorData = await generateResponse.json();
            if (errorData.suspendedPlan) {
              setShowUnusualActivityModal(true);
              setIsLoading(false);
              return;
            }
          } catch (parseError) {}
        }
        
        const err = await buildHttpError(generateResponse, "Failed to generate content.");
        
        if (err?.status === 401 || err?.status === 403) {
          try { sessionStorage.removeItem("authToken"); } catch (_) {}
          setError("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }
        throw err;
      }

      const contentPlan = await generateResponse.json();
      
      if (!contentPlan || contentPlan.error) {
        throw new Error(contentPlan?.error || "Content generation failed");
      }

      if (contentPlan.data?.postId) {
        triggerRefresh();
        try {
          localStorage.removeItem('generatePostView_brief');
        } catch (err) {}
        router.push(`/post?id=${contentPlan.data.postId}`);
      } else {
        throw new Error("No post ID returned from server");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setBrief("");
    setSelectedCategory("");
    setFieldValues({});
    setSelectedPlatforms({});
    setError(null);
  };

  /* ---------- Get Selected Category Data ---------- */
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  /* ---------- UI Render ---------- */

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* LEFT: Category + Fields + Platforms + Generate */}
        <div className="lg:col-span-2">
          <GlassCard className="h-full flex flex-col">
            {/* Header / Back Button */}
            <div className="mb-6 pb-6 border-b border-white/10 flex items-center gap-4">
              <button
                onClick={() => router.push('/generatepost')}
                className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
              >
                <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                Back to Options
              </button>
              <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">AI Content Studio</h1>
              </div>
            </div>

            <form onSubmit={handleGenerateContent} className="space-y-8 flex-grow">
              
              {/* Step 1: Creative Brief (Required) */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Brush size={18} className="text-orange-400" />
                  Creative Brief <span className="text-orange-400">*</span>
                </h2>
                <p className="text-sm text-gray-400">
                  Describe your post idea. This is the primary input - AI will use this to craft your content and visuals.
                </p>
                <textarea
                  className="w-full h-32 px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none text-white placeholder-gray-500 text-sm leading-relaxed"
                  placeholder="e.g., Create a motivational quote about success with an orange theme, targeted at young entrepreneurs. Include a call to action to visit the link in bio."
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  required
                />
                <div className="text-xs text-orange-400/80 flex items-center gap-1.5">
                  <Sparkles size={14} /> Tip: Be specific about your message, tone, and visual style for best results.
                </div>
              </div>
              
              {/* Step 2: Category Selection (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutTemplate size={18} className="text-purple-400" />
                    Template Category <span className="text-gray-500 text-sm font-normal">(advance)</span>
                  </h2>
                </div>
                <p className="text-sm text-gray-400">
                  Choose a category to refine specific details, or leave it empty to let AI decide based on your brief.
                </p>
                
                {isCategoriesLoading ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                    <Loader2 size={16} className="animate-spin" /> Loading templates...
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    Failed to load categories. Please refresh the page.
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="appearance-none w-full px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-sm text-white shadow-sm hover:border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20' fill='none' stroke='%23cbd5e1' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1rem'
                      }}
                    >
                      <option value="" className="bg-[#050816] text-white">Auto-detect based on brief</option>
                      {[...categories]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => (
                          <option 
                            key={category.id} 
                            value={category.id}
                            className="bg-[#050816] text-white py-2"
                          >
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                
                {selectedCategoryData && (
                  <div className="text-sm text-purple-300 bg-purple-500/10 border border-purple-500/20 p-3 rounded-lg">
                    {selectedCategoryData.description}
                  </div>
                )}
              </div>

              {/* Step 3: Dynamic Fields Based on Category (Optional) */}
              {selectedCategoryData && (
                <div className="space-y-5 p-6 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">
                      Refine Details
                    </h2>
                    <p className="text-sm text-gray-400">
                      Fill these for precise control, or leave empty to let AI extract details from your brief.
                    </p>
                  </div>
                  
                  {Object.entries(selectedCategoryData.fields).map(([fieldName, fieldConfig]) => (
                    <div key={fieldName} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        {fieldConfig.label}
                        {fieldConfig.required && <span className="text-orange-400 ml-1.5 text-xs">(recommended)</span>}
                      </label>
                      
                      {fieldConfig.type === 'textarea' ? (
                        <textarea
                          className="w-full px-4 py-3 rounded-xl bg-black/20 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 resize-none text-sm transition-all"
                          placeholder={fieldConfig.placeholder}
                          maxLength={fieldConfig.maxLength}
                          value={fieldValues[fieldName] || ''}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                          rows={3}
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-xl bg-black/20 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 border border-white/10 text-sm transition-all"
                          placeholder={fieldConfig.placeholder}
                          maxLength={fieldConfig.maxLength}
                          value={fieldValues[fieldName] || ''}
                          onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                        />
                      )}
                      
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">
                          e.g., {fieldConfig.example}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {(fieldValues[fieldName] || '').length}/{fieldConfig.maxLength}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Layout Divider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
                {/* Step 4: Platform Selection */}
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-300">Target Platforms</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {socialPlatforms.map((platform) => {
                      const isSelected = selectedPlatforms[platform.id];
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => handlePlatformChange(platform.id)}
                          className={`group p-3 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2
                            ${isSelected
                              ? "bg-orange-500/20 border-orange-500/50 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-gray-200"
                            }`}
                        >
                          {platform.icon}
                          <span className="text-sm font-medium">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 5: Aspect Ratio */}
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-300">Aspect Ratio</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: '1:1', label: 'Square', desc: 'Feed' },
                      { value: '16:9', label: 'Landscape', desc: 'Video' },
                      { value: '4:5', label: 'Portrait', desc: 'Standard' },
                      { value: '9:16', label: 'Vertical', desc: 'Reels' }
                    ].map(({ value, label, desc }) => {
                      const isSelected = generationOptions.aspectRatios?.[0] === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setGenerationOptions({ aspectRatios: [value] })}
                          className={`p-3 rounded-xl border text-center transition-all duration-200 flex flex-col items-center justify-center
                            ${isSelected
                              ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                              : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-gray-200"
                            }`}
                        >
                          <div className="font-medium text-sm">{label} <span className="text-xs opacity-70">({value})</span></div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Brand Context Display */}
              {(brandAssets.businessType || brandAssets.targetAudience) && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace Context Appended</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                    {brandAssets.businessType && <span className="px-2 py-1 bg-white/10 rounded-md">Business: {brandAssets.businessType}</span>}
                    {brandAssets.targetAudience && <span className="px-2 py-1 bg-white/10 rounded-md">Audience: {brandAssets.targetAudience}</span>}
                    {brandAssets.brandPersonality && <span className="px-2 py-1 bg-white/10 rounded-md">Tone: {brandAssets.brandPersonality}</span>}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all duration-300 font-medium"
                >
                  Clear Fields
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !brief || brief.trim() === '' || Object.keys(selectedPlatforms).filter(k => selectedPlatforms[k]).length === 0}
                  className="flex-1 relative overflow-hidden group flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-600 text-white font-medium rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <span className="relative flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Crafting Content...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Generate AI Content
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* RIGHT: Info Panel */}
        <div className="lg:col-span-1 h-fit space-y-6">
          <GlassCard className="bg-blue-500/5 border-blue-500/20">
            <h3 className="text-lg font-bold text-blue-100 mb-4 flex items-center gap-2">
              <Info size={20} className="text-blue-400" />
              How It Works
            </h3>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-blue-200/80 leading-relaxed">
                  Our AI engine acts as your personal marketing agency. It analyzes your brief to generate high-converting copy and stunning visual layouts simultaneously.
                </p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-300 uppercase text-xs tracking-wider">Two Ways to Generate</h4>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="font-medium text-white block mb-1">1. Auto-Pilot (Recommended)</span>
                  <span className="text-blue-200/70 text-xs">Write your brief and hit generate. AI handles the layout selection and content extraction.</span>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <span className="font-medium text-white block mb-1">2. Precision Mode</span>
                  <span className="text-blue-200/70 text-xs">Select a specific template category and explicitly fill out the text fields for exact control.</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-emerald-500/5 border-emerald-500/20">
            <h3 className="font-bold text-emerald-100 mb-4 text-sm uppercase tracking-wider">Supported Frameworks</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-200/70">
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Quotes & Motivation</div>
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Business & Corp</div>
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Product Promos</div>
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Offers & Sales</div>
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Testimonials</div>
              <div className="flex items-center gap-2"><span className="text-emerald-500">•</span> Real Estate</div>
            </div>
            <div className="mt-5 pt-4 border-t border-emerald-500/20">
              <p className="text-xs text-emerald-400/60 font-mono text-center">
                Powered by Gemini & Imagen Models
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Unusual Activity Modal */}
      {showUnusualActivityModal && (
        <UnusualActivityModal
          isOpen={showUnusualActivityModal}
          onClose={() => setShowUnusualActivityModal(false)}
        />
      )}
    </div>
  );
};

export default GenerateAIContent;