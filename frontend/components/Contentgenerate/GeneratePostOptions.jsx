'use client';

import { Sparkles, Layout, Zap, ChevronRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import UpgradeModal from '../UpgradeModal';

// Production Note: Converted to a semantic 'button' for accessibility (Tab navigation + Screen readers)
const GlassCard = ({ 
  children, 
  className = "", 
  onClick, 
  interactive = false, 
  disabled = false 
}) => (
  <button
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    className={`
      relative text-left w-full h-full p-8 rounded-3xl overflow-hidden 
      border border-white/10 transition-all duration-500 ease-out
      backdrop-blur-xl bg-white/[0.03] shadow-[0_20px_40px_rgba(0,0,0,0.3)]
      ${interactive && !disabled 
        ? 'cursor-pointer hover:border-white/20 hover:bg-white/[0.07] hover:scale-[1.02] hover:shadow-2xl' 
        : ''}
      ${disabled ? 'opacity-60 grayscale-[0.5] cursor-not-allowed' : ''}
      ${className}
    `}
  >
    {children}
  </button>
);

const GeneratePostOptions = () => {
  const router = useRouter();
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');

  useEffect(() => {
    const fetchPlanStatus = async () => {
      try {
        const token = sessionStorage.getItem("authToken");
        if (!token) return;

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
      }
    };

    fetchPlanStatus();
  }, []);

  const options = [
    {
      id: 'scratch',
      title: 'Generate from Scratch',
      description: 'Create unique posts with AI assistance. Customize every detail from content to visuals.',
      icon: Sparkles,
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-400',
      features: ['AI-powered content', 'Custom visuals', 'Full customization', 'Multiple platforms'],
      route: '/generate-scratch',
      disabled: false
    },
    {
      id: 'template',
      title: 'Generate from Templates',
      description: 'Choose from our curated template library and customize with AI to match your brand.',
      icon: Layout,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
      features: ['Pre-designed templates', 'AI customization', 'Category-based', 'Customize your own template'],
      route: '/generate-templates',
      disabled: false // isFreePlan - Unlocked for free users to view
    },
    {
      id: 'caption-hashtags',
      title: 'Generate Caption & Hashtags',
      description: 'Upload your own image and let AI generate engaging captions and hashtags for your post.',
      icon: Zap,
      gradient: 'from-orange-500/10 to-red-500/10',
      iconColor: 'text-orange-400',
      features: ['Upload your image', 'AI-generated captions', 'Smart hashtags', 'Multi-platform support'],
      route: '/generate-caption-hashtags',
      disabled: false // isFreePlan - Unlocked for free users to view
    }
  ];

  const handleOptionClick = (option) => {
    if (option.disabled) {
      if (option.id === 'template' || option.id === 'caption-hashtags') {
        setUpgradeFeature(option.title);
        setShowUpgradeModal(true);
      }
      return;
    }
    router.push(option.route);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-10 px-4 sm:px-6">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-600">Magic</span>
        </h1>
        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Select your preferred workflow. Whether you want total creative control or a lightning-fast start, we've got you covered.
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {options.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <GlassCard
              key={option.id}
              interactive={!option.disabled}
              disabled={option.disabled}
              onClick={() => handleOptionClick(option)}
              className="group flex flex-col"
            >
              {/* Animated Background Gradient */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} 
              />
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Header: Icon & Badge */}
                <div className="flex items-start justify-between mb-8">
                  <div className={`
                    p-4 rounded-2xl bg-white/5 border border-white/10 
                    ${option.iconColor} 
                    group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500
                  `}>
                    <IconComponent size={28} />
                  </div>
                  
                  {option.disabled && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                      <Lock size={10} className="text-white/50" />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">
                        Locked
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">
                  {option.title}
                </h3>
                
                <p className="text-white/70 text-sm leading-relaxed mb-8 flex-grow">
                  {option.description}
                </p>

                {/* Features List */}
                <ul className="space-y-4 mb-10">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-white/80 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-3 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div
                  className={`
                    w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300
                    ${option.disabled
                      ? 'bg-white/5 text-white/20'
                      : 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/30'
                    }
                  `}
                >
                  {option.disabled ? 'Locked For Free Users' : 'Get Started'}
                  {!option.disabled && (
                    <ChevronRight 
                      size={18} 
                      className="group-hover:translate-x-1 transition-transform" 
                    />
                  )}
                </div>
              </div>

              {/* Decorative Large Background Icon */}
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.07] transition-all duration-500 rotate-12 group-hover:rotate-6 group-hover:scale-110 pointer-events-none">
                <IconComponent size={140} className="text-white" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Footer Suggestion */}
      <div className="pt-6 flex justify-center">
        <div className="inline-flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 text-sm">
          <span className="text-white/40">Need a jumpstart?</span>
          <button 
            onClick={() => router.push('/generate-templates')}
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors focus:outline-none focus:underline"
          >
            Explore Library →
          </button>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature}
        description="Unlock this feature with our premium plans."
        currentPlan="Free"
      />
    </div>
  );
};

export default GeneratePostOptions;