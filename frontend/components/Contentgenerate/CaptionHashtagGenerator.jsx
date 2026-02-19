'use client';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Upload, Wand2, Loader2, Image as ImageIcon, 
  Instagram, Facebook, Linkedin, Twitter, AlertCircle, Info, Lightbulb, Lock
} from 'lucide-react';
import UnusualActivityModal from "../UnusualActivityModal";
import UpgradeModal from "../UpgradeModal";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { usePostCount } from '@/lib/postCountContext';

// Upgraded to native Tailwind classes for production-grade glassmorphism
const GlassCard = ({ children, className = "" }) => (
  <div
    className={`p-6 rounded-2xl relative text-white bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl ${className}`}
  >
    {children}
  </div>
);

const CaptionHashtagGenerator = () => {
  const router = useRouter();
  const { triggerRefresh } = usePostCount();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [contentBrief, setContentBrief] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showUnusualActivityModal, setShowUnusualActivityModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const fetchPlanStatus = async () => {
      try {
        /*
          We need to fetch the plan status on mount to determine if the user is on the Free plan.
          This allows us to show the lock UI immediately.
        */
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

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
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
      // In case of error, we default to allowing (or you could block, but typically fail open is better for UX unless critical)
      // However, for strict gating, maybe better to block. But sticking to existing pattern of returning true on error 
      // or we can log it. 
      return true;
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPG, PNG, or WebP)');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result;
      setImagePreview(base64Data);
      setUploadedImage(base64Data);
    };

    reader.onerror = () => {
      setUploadError('Failed to read file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (isFreePlan) {
      setShowUpgradeModal(true);
      return;
    }

    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    if (!contentBrief.trim()) {
      setError('Please provide a content brief for caption generation');
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/generate-caption-hashtags`, {
        imageUrl: uploadedImage,
        contentBrief: contentBrief,
        platforms: selectedPlatforms
      }, {
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : ''}`
        }
      });

      if (response.data.success) {
        const generatedData = response.data.data;
        triggerRefresh();

        if (typeof window !== 'undefined' && generatedData.postId) {
          window.location.href = `/post?id=${generatedData.postId}`;
        }
      } else {
        setError(response.data.message || 'Failed to generate captions and hashtags');
      }
    } catch (error) {
      console.error('Caption generation error:', error);
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
          setError('This feature is not available in your current plan. Please upgrade.');
        }
      } else {
        setError(error.response?.data?.message || 'Failed to generate captions and hashtags. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const platforms = [
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'facebook', label: 'Facebook', icon: Facebook },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { value: 'x', label: 'X (Twitter)', icon: Twitter }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <GlassCard>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/generatepost')}
            className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            Back to Options
          </button>
          <div className="h-8 w-px bg-white/20 mx-2 hidden sm:block"></div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Generate Caption & Hashtags</h1>
            <p className="text-sm text-gray-400 mt-1">Upload your image and let AI create engaging, platform-specific content</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Image Upload */}
        <div className="space-y-6 flex flex-col">
          <GlassCard className="flex-grow">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-orange-400" />
              Upload Source Image
            </h2>
            
            {!imagePreview ? (
              <div className="group border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-orange-400/50 hover:bg-white/[0.02] transition-all duration-300">
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400/80 to-purple-600/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload size={28} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1 text-lg">Click to browse or drag & drop</p>
                      <p className="text-sm text-gray-400">Supports JPG, PNG, or WebP (Max 10MB)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group">
                  <img
                    src={imagePreview}
                    alt="Uploaded preview"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setUploadedImage(null);
                      }}
                      className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-full transition-all"
                    >
                      Replace Image
                    </button>
                  </div>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm leading-relaxed">{uploadError}</p>
              </div>
            )}
          </GlassCard>

          {/* Info Card */}
          <GlassCard className="bg-blue-500/5 border-blue-500/20">
            <h3 className="font-medium text-blue-300 mb-3 flex items-center gap-2">
              <Info size={18} />
              How It Works
            </h3>
            <ul className="text-sm text-blue-100/80 space-y-2">
              <li className="flex gap-2"><span className="text-blue-400">•</span> Upload your own image (no AI image generation occurs here).</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Provide a detailed brief of your target message and audience.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> AI generates highly-optimized, platform-specific captions.</li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> Relevant, trending hashtags are automatically appended.</li>
            </ul>
          </GlassCard>
        </div>

        {/* Right Side - Content Brief & Options */}
        <div className="space-y-6 flex flex-col">
          <GlassCard className="flex-grow">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Wand2 size={20} className="text-purple-400" />
              Content Details
            </h2>
            
            <div className="space-y-6">
              {/* Content Brief */}
              <div>
                <label htmlFor="content-brief" className="block text-sm font-medium text-gray-300 mb-2">
                  Content Brief <span className="text-orange-400">*</span>
                </label>
                <textarea
                  id="content-brief"
                  value={contentBrief}
                  onChange={(e) => setContentBrief(e.target.value)}
                  placeholder="e.g., 'New product launch - eco-friendly water bottle, targeting health-conscious millennials. Emphasize sustainability, sleek style, and our 20% off launch discount.'"
                  rows={5}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none text-white placeholder-gray-500 text-sm leading-relaxed"
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Generate Content For <span className="text-orange-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.value);
                    const Icon = platform.icon;
                    return (
                      <button
                        key={platform.value}
                        onClick={() => togglePlatform(platform.value)}
                        className={`p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-gray-200'
                        }`}
                      >
                        <Icon size={18} className={isSelected ? 'text-purple-400' : ''} />
                        <span className="text-sm font-medium">{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || (isFreePlan ? false : (!uploadedImage || !contentBrief.trim() || selectedPlatforms.length === 0))}
                className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 px-6 py-4 font-medium rounded-xl hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 ${
                  isFreePlan
                    ?('bg-gray-800 text-gray-400 cursor-pointer hover:bg-gray-700')
                    :('bg-gradient-to-r from-orange-500 to-purple-600 text-white')
                }`}
              >
                {/* Button highlight effect */}
                {!isFreePlan && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                
                <span className="relative flex items-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Crafting your content...
                    </>
                  ) : isFreePlan ? (
                    <>
                      <Lock size={20} />
                      Unlock to Generate
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Generate Captions & Hashtags
                    </>
                  )}
                </span>
              </button>
            </div>
          </GlassCard>

          {/* Tips Card */}
          <GlassCard className="bg-emerald-500/5 border-emerald-500/20">
            <h3 className="font-medium text-emerald-400 mb-3 flex items-center gap-2">
              <Lightbulb size={18} />
              Tips for Best Results
            </h3>
            <ul className="text-sm text-emerald-100/80 space-y-2">
              <li className="flex gap-2"><span className="text-emerald-500/50">•</span> <span><strong>Be specific:</strong> Include product names, events, or themes.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500/50">•</span> <span><strong>Tone matters:</strong> Specify if you want it professional, witty, or casual.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500/50">•</span> <span><strong>Call-to-action:</strong> Tell the AI what you want users to do (e.g., "Link in bio").</span></li>
            </ul>
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Caption & Hashtag Generation"
        description="Unlock AI-powered captions and hashtags with our premium plans."
        currentPlan="Free"
      />
    </div>
  );
};

export default CaptionHashtagGenerator;