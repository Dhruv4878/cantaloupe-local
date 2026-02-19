
import React from "react";
import {
  ArrowLeft,
  Trash2,
  BarChart2,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";

export const PostHeader = ({
  onBack,
  backLabel,
  onDelete,
  onToggleAnalytics,
  showAnalytics,
  isRegenerateMenuOpen,
  setIsRegenerateMenuOpen,
  regenerateOptions,
  toggleRegenerateOption,
  handleRegenerateSelected,
  uiDisabled,
  generatedData,
  isDeleting,
  regenerateMenuRef,
  applyToAllPlatforms,
  setApplyToAllPlatforms,
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-50">
      <div className="flex flex-col gap-1">
        {generatedData && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white font-medium text-sm transition-colors mb-1 group"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            {backLabel}
          </button>
        )}
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Post Editor
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Delete */}
        <button
          onClick={onDelete}
          disabled={isDeleting || uiDisabled}
          className="flex items-center justify-center p-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete Post"
        >
          <Trash2 size={18} />
        </button>

        {/* View Analytics Button (Toggle + Scroll) */}
        <button
          onClick={onToggleAnalytics}
          disabled={uiDisabled || !generatedData?.analytics}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 ${
            showAnalytics
              ? "bg-orange-500/10 border-orange-500/50 text-orange-400"
              : "bg-[#161b2c] hover:bg-[#1c2236] text-white"
          } transition-all text-sm font-medium ${
            !generatedData?.analytics ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <BarChart2
            size={16}
            className={showAnalytics ? "text-orange-400" : "text-blue-400"}
          />
          <span>
            {showAnalytics ? "Hide Performance" : "View Performance"}
          </span>
        </button>

        {/* Regenerate Menu */}
        <div className="relative" ref={regenerateMenuRef}>
          <button
            onClick={() => !uiDisabled && setIsRegenerateMenuOpen((v) => !v)}
            disabled={uiDisabled}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#161b2c] hover:bg-[#1c2236] text-white transition-all text-sm font-medium"
          >
            <RefreshCw size={16} />
            <span>Regenerate</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>

          {isRegenerateMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#121624] border border-white/10 rounded-xl shadow-2xl z-50 text-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-white/5">
                <span className="text-gray-400 font-medium">
                  Select elements to regenerate
                </span>
              </div>
              <div className="p-2">
                {[
                  { key: "text", label: "Caption Text" },
                  { key: "hashtags", label: "Hashtags" },
                  { key: "image", label: "Image" },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      regenerateOptions.post
                        ? "opacity-30 pointer-events-none"
                        : "hover:bg-white/5 cursor-pointer"
                    }`}
                  >
                    <span className="text-gray-200">{label}</span>
                    <input
                      type="checkbox"
                      checked={!!regenerateOptions[key]}
                      onChange={() => toggleRegenerateOption(key)}
                      className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                      disabled={regenerateOptions.post || uiDisabled}
                    />
                  </label>
                ))}

                <div className="h-px bg-white/10 my-1 mx-2"></div>
                
                {/* Apply to All Platforms Checkbox */}
                <label 
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    (regenerateOptions.post || regenerateOptions.image || uiDisabled)
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-white/5 cursor-pointer"
                  }`}
                >
                  <span className="text-gray-300 font-medium text-xs">
                    Apply to all platforms
                  </span>
                  <input
                    type="checkbox"
                    checked={applyToAllPlatforms}
                    onChange={(e) => setApplyToAllPlatforms(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    disabled={regenerateOptions.post || regenerateOptions.image || uiDisabled}
                  />
                </label>

                <div className="h-px bg-white/10 my-1 mx-2"></div>

                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <span className="text-orange-400 font-medium">
                    Regenerate Entire Post
                  </span>
                  <input
                    type="checkbox"
                    checked={!!regenerateOptions.post}
                    onChange={() => toggleRegenerateOption("post")}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
                    disabled={uiDisabled}
                  />
                </label>
              </div>
              <div className="p-3 bg-[#0d101b] border-t border-white/5 flex justify-end gap-2">
                <button
                  onClick={() => setIsRegenerateMenuOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateSelected}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium text-xs uppercase tracking-wide transition-colors"
                >
                  Run
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
