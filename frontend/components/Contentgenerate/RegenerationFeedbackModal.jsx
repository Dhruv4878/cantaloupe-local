
import React, { useState } from "react";
import { X, Sparkles, MessageSquare } from "lucide-react";

export const RegenerationFeedbackModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Refine Generation",
  loading = false,
  placeholder = "E.g., Make it more professional, add more emojis, focus on product benefits...",
}) => {
  const [instruction, setInstruction] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(instruction);
    setInstruction(""); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!loading ? onClose : undefined}
      />
      
      <div className="relative bg-[#161b2c] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl transform transition-all scale-100 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#1c2236]/50">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-400" />
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* content */}
        <div className="p-6 space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-3">
                <MessageSquare size={18} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-200">
                    Optional: Provide specific instructions to guide the AI, or leave blank to regenerate based on the original brief.
                </p>
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Your Instructions
                </label>
                <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-32 bg-[#0f121e] border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none resize-none transition-all placeholder:text-gray-600"
                    disabled={loading}
                />
            </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 bg-[#1c2236]/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg font-medium text-sm transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Regenerating...</span>
                </>
            ) : (
                <>
                    <Sparkles size={16} />
                    <span>Regenerate</span>
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
