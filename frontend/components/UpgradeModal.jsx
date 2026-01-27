"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { X, Crown, ArrowRight } from "lucide-react";

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  featureName, 
  description,
  currentPlan = "Free"
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-purple-600 rounded-full flex items-center justify-center">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-white mb-3">
            Upgrade Required
          </h3>
          <p className="text-white/70 mb-4">
            <span className="font-semibold text-[#FFC56E]">{featureName}</span> is not available in your current <span className="font-medium">{currentPlan}</span> plan.
          </p>
          {description && (
            <p className="text-white/60 text-sm">
              {description}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-orange-400 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            Upgrade Plan
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-white/5 text-white/80 font-medium py-3 px-6 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}