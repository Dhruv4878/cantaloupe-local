import { useState, useEffect } from 'react';
import { ArrowLeft, Wand2, Loader2, AlertCircle, Lightbulb, Sparkles, Info, Lock } from 'lucide-react';
import UnusualActivityModal from "../UnusualActivityModal";
import UpgradeModal from "../UpgradeModal";
import axios from 'axios';
import { usePostCount } from '@/lib/postCountContext';

// Refactored to use native Tailwind classes for better performance and consistent glassmorphism
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 md:p-8 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl relative text-white transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const TemplateCustomizer = ({ template, onBack }) => {
  const { triggerRefresh } = usePostCount();
  const [customizationPrompt, setCustomizationPrompt] = useState('');
  const [contentBrief, setContentBrief] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  // Removed pre-selected platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUnusualActivityModal, setShowUnusualActivityModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlanStatus = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) {
          setIsLoadingPlan(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/current`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.plan?.planName === "Free") {
            setIsFreePlan(true);
          }
        }
      } catch (error) {
        console.error("Error fetching plan status:", error);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchPlanStatus();
  }, []);

  const isCustomUpload = template?.isCustomUpload || false;

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const checkPlanStatus = async () => {
    try {
      const token = sessionStorage.getItem("authToken");
      if (!token) return true;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const planName = data?.plan?.planName;
        
        // Block Free plan users
        if (planName === "Free") {
          setShowUpgradeModal(true);
          return false;
        }

        const hasActiveSubscription = planName && planName !== "Free";
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

  const handleCustomize = async () => {
    if (isFreePlan) {
      setShowUpgradeModal(true);
      return;
    }

    if (!customizationPrompt.trim()) {
      setError('Please provide customization instructions');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    const isPlanActive = await checkPlanStatus();
    if (!isPlanActive) {
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/customize-template`, {
        template: template,
        customizationPrompt: customizationPrompt,
        contentBrief: contentBrief,
        aspectRatio: aspectRatio,
        platforms: selectedPlatforms
      }, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : ''}`
        }
      });

      if (response.data.success) {
        const customizedData = response.data.data;
        console.log('✅ Template customized successfully, postId:', customizedData.postId);
        triggerRefresh();

        if (typeof window !== 'undefined' && customizedData.postId) {
          window.location.href = `/post?id=${customizedData.postId}`;
        }
      } else {
        setError(response.data.message || 'Failed to customize template');
      }
    } catch (error) {
      console.error('Template customization error:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else if (error.response?.status === 403) {
        const errorData = error.response?.data;
        if (errorData?.suspendedPlan) {
           setShowUnusualActivityModal(true);
           setIsGenerating(false);
           return;
        }
        if (errorData?.limitType === 'monthly') {
          setError(`Monthly post limit reached (${errorData.used}/${errorData.limit}). Your limit will reset at the end of your billing cycle.`);
        } else if (errorData?.limitType === 'credit') {
          setError(`Credit limit reached (${errorData.used}/${errorData.limit}). Please upgrade your plan or purchase more credits.`);
        } else if (errorData?.limitType === 'both') {
          setError(`Both monthly (${errorData.monthlyUsed}/${errorData.monthlyLimit}) and credit limits (${errorData.used}/${errorData.limit}) reached. Please upgrade your plan.`);
        } else if (errorData?.limitType === 'no_limits') {
          setError('Your plan does not allow post generation. Please upgrade to access this feature.');
        } else {
          setError('This feature is not available in your current plan. Please upgrade to access template customization.');
        }
      } else {
        setError(error.response?.data?.message || 'Failed to customize template. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <GlassCard className="py-5">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Templates
          </button>
          <div className="h-8 w-px bg-white/10 hidden md:block" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{template.name}</h1>
            <p className="text-sm font-medium text-gray-400 mt-0.5 flex items-center gap-2">
              {isCustomUpload ? (
                <><Sparkles size={14} className="text-orange-400"/> Custom Upload</>
              ) : (
                <><Info size={14} /> {template.category}</>
              )}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Side - Template Preview (Takes up 5 columns on large screens) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              {isCustomUpload ? 'Your Uploaded Template' : 'Original Template'}
            </h2>
            <div className="relative aspect-square bg-gray-900/50 rounded-xl overflow-hidden border border-white/5 shadow-inner group">
              <img
                src={template.imageUrl}
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400/1f2937/ffffff?text=Template+Preview';
                }}
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl pointer-events-none" />
            </div>
            
            {template.description && (
              <p className="text-sm text-gray-300 mt-5 leading-relaxed">
                {template.description}
              </p>
            )}

            {isCustomUpload && (
              <div className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <Sparkles className="text-emerald-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-emerald-200/90 leading-relaxed">
                  This is your custom uploaded template. AI will analyze and modify it based strictly on your instructions below.
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Side - Customization Panel (Takes up 7 columns on large screens) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard>
            <h2 className="text-xl font-semibold text-white mb-6">Customize Template</h2>
            
            <div className="space-y-6">
              {/* Image Customization Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Image Customization Instructions <span className="text-orange-400">*</span>
                </label>
                <textarea
                  value={customizationPrompt}
                  onChange={(e) => setCustomizationPrompt(e.target.value)}
                  placeholder={isCustomUpload 
                    ? "Describe how to modify your design. Example: 'Change the main text to Summer Sale 2024, use blue and yellow colors, add a 30% OFF badge in the top right corner'"
                    : "Describe how to modify the template. Example: 'Change text to Valentine Day Sale, use Generation Next as brand, make it 20% off, use pink and red colors'"
                  }
                  rows={4}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 resize-none text-white placeholder-gray-500 shadow-inner"
                />
              </div>

              {/* Content Brief */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Content Brief <span className="text-gray-400 font-normal">(For Captions & Hashtags)</span>
                </label>
                <textarea
                  value={contentBrief}
                  onChange={(e) => setContentBrief(e.target.value)}
                  placeholder="Optional: Provide context for the caption. Example: 'Valentine's Day promotion for our new product line, targeting young couples...'"
                  rows={3}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 resize-none text-white placeholder-gray-500 shadow-inner"
                />
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                  <Info size={12} /> If left empty, captions will be generated based on your image instructions.
                </p>
              </div>

              {/* Aspect Ratio Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Target Aspect Ratio <span className="text-orange-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: '1:1', label: 'Square', desc: 'Instagram Post' },
                    { value: '4:5', label: 'Portrait', desc: 'Instagram Post' },
                    { value: '16:9', label: 'Landscape', desc: 'YouTube / Twitter' },
                    { value: '9:16', label: 'Story', desc: 'Reels / Stories' }
                  ].map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`p-3 rounded-xl border transition-all duration-200 flex flex-col items-center justify-center gap-1 group ${
                        aspectRatio === ratio.value
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:text-gray-200'
                      }`}
                    >
                      <div className="text-sm font-bold">{ratio.value}</div>
                      <div className="text-[11px] opacity-70 font-medium tracking-wide uppercase">{ratio.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Target Platforms <span className="text-orange-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'instagram', label: 'Instagram', icon: '📸' },
                    { value: 'facebook', label: 'Facebook', icon: '👥' },
                    { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
                    { value: 'x', label: 'X (Twitter)', icon: '🐦' }
                  ].map((platform) => (
                    <button
                      key={platform.value}
                      onClick={() => togglePlatform(platform.value)}
                      className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2.5 group ${
                        selectedPlatforms.includes(platform.value)
                          ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/30 hover:text-gray-200'
                      }`}
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm font-semibold">{platform.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleCustomize}
                  disabled={isGenerating || (isFreePlan ? false : (!customizationPrompt.trim() || selectedPlatforms.length === 0))}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:-translate-y-0 disabled:hover:shadow-none transition-all duration-200 ${
                    isFreePlan 
                      ? 'bg-gray-800 text-gray-400 cursor-pointer hover:bg-gray-700' 
                      : 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Modifying Template with AI...
                    </>
                  ) : isFreePlan ? (
                    <>
                      <Lock size={20} />
                      Unlock to Customize
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Customize Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassCard>

          {/* Info Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            <GlassCard className="!p-5 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/20">
              <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Sparkles size={16} /> 
                {isCustomUpload ? 'Custom Workflow' : 'Streamlined AI'}
              </h3>
              <ul className="text-sm text-emerald-200/80 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  Image sent securely as visual AI input
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  AI preserves original layout & styles
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  Platform-specific captions generated
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="!p-5 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
              <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <Lightbulb size={16} /> Best Practices
              </h3>
              <ul className="text-sm text-blue-200/80 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Be specific about text & color changes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Match aspect ratio to primary platform
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Use the brief for target audience context
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Unusual Activity Modal */}
      {showUnusualActivityModal && (
        <UnusualActivityModal
          isOpen={showUnusualActivityModal}
          onClose={() => setShowUnusualActivityModal(false)}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Template Customization"
        description="Unlock unlimited template customizations with our premium plans."
        currentPlan="Free"
      />
    </div>
  );
};

export default TemplateCustomizer;