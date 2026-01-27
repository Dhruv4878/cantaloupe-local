"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

const UnusualActivityModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0f0e24] border border-red-500/30 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">
            Unusual Activity Detected
          </h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            We've detected unusual activity on your account. Your subscription has been temporarily suspended for security reasons. 
            Please contact our support team to resolve this issue.
          </p>
          
          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.open('mailto:support@contentflow.com', '_blank')}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
            >
              Contact Support
            </button>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnusualActivityModal;