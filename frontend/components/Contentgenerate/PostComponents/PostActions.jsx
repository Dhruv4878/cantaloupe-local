
import React from "react";
import { Calendar, Send, Sparkles } from "lucide-react";
import { GlassCard } from "./Shared/GlassCard";

export const PostActions = ({
  onSchedule,
  onPostNow,
  isPosting,
  isScheduleOpen,
  setIsScheduleOpen,
  isPostMenuOpen,
  setIsPostMenuOpen,
  handlePublishNow,
  handlePublishAllConnected,
  activeTab,
  platformIcons,
  uiDisabled,
  checkFeatureAccess,
  setShowUpgradeModal,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={() => {
          if (checkFeatureAccess && !checkFeatureAccess("smart_scheduling")) {
            setShowUpgradeModal(true);
            return;
          }
          setIsScheduleOpen((v) => !v);
        }}
        disabled={uiDisabled}
        className={`py-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all group ${
          isScheduleOpen
            ? "bg-white/10 border-white/20 text-white"
            : "bg-[#0f121e] border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Calendar
          size={20}
          className={
            isScheduleOpen
              ? "text-orange-400"
              : "group-hover:text-orange-400 transition-colors"
          }
        />
        <span className="font-semibold text-sm">Schedule</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setIsPostMenuOpen((v) => !v)}
          disabled={uiDisabled || isPosting}
          className="w-full h-full py-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-lg shadow-orange-900/40 flex flex-col items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
          <span className="font-bold text-sm tracking-wide">
            {isPosting ? "Posting..." : "Post Now"}
          </span>
        </button>

        {/* Dropup Menu for Post */}
        {isPostMenuOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-full bg-[#161b2c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <button
              onClick={handlePublishNow}
              className="w-full text-left px-5 py-3 text-sm text-gray-200 hover:bg-white/5 border-b border-white/5 flex items-center gap-3 transition-colors"
            >
              <div className="p-1.5 bg-white/10 rounded-full">
                {platformIcons[activeTab]}
              </div>
              <span>
                Post to{" "}
                <span className="font-semibold text-white capitalize">
                  {activeTab}
                </span>{" "}
                only
              </span>
            </button>
            <button
              onClick={handlePublishAllConnected}
              className="w-full text-left px-5 py-3 text-sm text-gray-200 hover:bg-white/5 flex items-center gap-3 transition-colors"
            >
              <div className="p-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full text-white">
                <Sparkles size={12} />
              </div>
              <span>
                Post to <span className="font-semibold text-white">All Connected</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
