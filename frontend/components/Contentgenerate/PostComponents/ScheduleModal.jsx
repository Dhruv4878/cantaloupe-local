
import React from "react";
import { GlassCard } from "./Shared/GlassCard";
import { OrangeButton } from "./Shared/OrangeButton";

export const ScheduleModal = ({
  isOpen,
  onClose,
  onConfirm,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  scheduleAll,
  setScheduleAll,
  isScheduling,
}) => {
  if (!isOpen) return null;

  return (
    <GlassCard className="animate-in fade-in slide-in-from-top-4 border-t-4 border-t-orange-500 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-bold text-white">Schedule Post</h4>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white"
        >
          <span className="sr-only">Close</span>✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">
            Date
          </label>
          <input
            type="date"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase">
            Time
          </label>
          <input
            type="time"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors mb-6">
        <input
          type="checkbox"
          checked={scheduleAll}
          onChange={(e) => setScheduleAll(e.target.checked)}
          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500"
        />
        <span className="text-sm font-medium text-gray-200">
          Apply schedule to all connected platforms
        </span>
      </label>

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <OrangeButton
          onClick={onConfirm}
          disabled={isScheduling}
          className="px-8 py-2.5 rounded-xl shadow-lg shadow-orange-900/20"
        >
          {isScheduling ? "Scheduling..." : "Confirm Schedule"}
        </OrangeButton>
      </div>
    </GlassCard>
  );
};
