
import React from "react";
import { GlassCard } from "./Shared/GlassCard";
import { OrangeButton } from "./Shared/OrangeButton";
import { Plus, Edit, Check } from "lucide-react";

export const PostEditorSection = ({
  activeTab,
  setActiveTab,
  platformNames,
  platformIcons,
  platformColors,
  isAddPlatformsOpen,
  setIsAddPlatformsOpen,
  addPlatformsContainerRef,
  addPlatformsSelection,
  setAddPlatformsSelection,
  addPlatformsLoading,
  handleAddPlatforms,
  uiDisabled,
  isEditing,
  startEditing,
  handleCancelEdit,
  saveEdits,
  hasChanges,
  isSaving,
  captionLoading,
  hashtagsLoading,
  editedText,
  setEditedText,
  editedHashtags,
  setEditedHashtags,
  activeTabData,
}) => {
  return (
    <div className="lg:col-span-7 flex flex-col gap-6">
      {/* Platform Selector Tabs */}
      <GlassCard
        className="p-1.5 flex gap-1 overflow-x-auto no-scrollbar"
        noPadding
      >
        {platformNames.map((platform) => {
          const isActive = activeTab === platform;
          return (
            <button
              key={platform}
              onClick={() => !uiDisabled && setActiveTab(platform)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden min-w-[100px] ${
                isActive
                  ? `bg-gradient-to-r ${
                      platformColors[platform] || "from-gray-700 to-gray-600"
                    } text-white shadow-lg`
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {platformIcons[platform]}
              <span className="capitalize relative z-10">{platform}</span>
            </button>
          );
        })}
        <button
          onClick={() => !uiDisabled && setIsAddPlatformsOpen((v) => !v)}
          className="px-4 py-2 rounded-xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center min-w-[50px]"
          title="Add Platform"
        >
          <Plus size={18} />
        </button>
      </GlassCard>

      {/* Add Platform Dropdown logic */}
      {isAddPlatformsOpen && (
        <div
          ref={addPlatformsContainerRef}
          className="bg-[#1a1f30] border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-2"
        >
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Add Platform Variant
          </h3>
          <div className="space-y-2">
            {["instagram", "x", "linkedin", "facebook"]
              .filter((p) => !platformNames.includes(p))
              .map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!addPlatformsSelection[p]}
                    onChange={() =>
                      setAddPlatformsSelection((prev) => ({
                        ...prev,
                        [p]: !prev[p],
                      }))
                    }
                    className="rounded bg-gray-700 border-gray-600 text-orange-500"
                  />
                  <div className="flex items-center gap-2 text-gray-200 capitalize">
                    {platformIcons[p]} {p}
                  </div>
                </label>
              ))}
          </div>
          <div className="mt-4 flex justify-end">
            <OrangeButton
              onClick={handleAddPlatforms}
              disabled={addPlatformsLoading}
              className="text-sm px-6"
            >
              {addPlatformsLoading ? "Adding..." : "Add Selected"}
            </OrangeButton>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <GlassCard className="flex-1 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
          <Edit size={100} className="text-white/5" />
        </div>

        {/* Mode Toggle (Edit / View) */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            Content Editor
          </h2>
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Edit size={14} /> Edit Text
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={!hasChanges || isSaving}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/50 hover:bg-orange-500/30 flex items-center gap-1.5"
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Check size={12} /> Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Input Fields */}
        <div className="space-y-6">
          {/* Caption */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
              <span>Caption</span>
              <span
                className={`${
                  (
                    isEditing
                      ? editedText.length
                      : (activeTabData?.caption || "").length
                  ) > 2200
                    ? "text-red-400"
                    : "text-gray-600"
                }`}
              >
                {isEditing
                  ? editedText.length
                  : (activeTabData?.caption || "").length}{" "}
                / 2200
              </span>
            </label>

            <div className="relative">
              {captionLoading && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              <textarea
                className={`w-full min-h-[160px] bg-black/20 border ${
                  isEditing
                    ? "border-orange-500/50 focus:ring-1 focus:ring-orange-500"
                    : "border-white/10"
                } rounded-xl p-4 text-sm text-gray-200 leading-relaxed resize-y transition-all`}
                value={isEditing ? editedText : activeTabData?.caption}
                onChange={(e) => isEditing && setEditedText(e.target.value)}
                readOnly={!isEditing}
                placeholder="Write your caption here..."
              />
            </div>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Hashtags
            </label>
            <div className="relative">
              {hashtagsLoading && (
                <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              <textarea
                className={`w-full bg-black/20 border ${
                  isEditing
                    ? "border-orange-500/50 focus:ring-1 focus:ring-orange-500"
                    : "border-white/10"
                } rounded-xl p-4 text-sm text-blue-400 leading-relaxed resize-none transition-all h-24`}
                value={
                  isEditing
                    ? editedHashtags
                    : (activeTabData?.hashtags || []).join(" ")
                }
                onChange={(e) => isEditing && setEditedHashtags(e.target.value)}
                readOnly={!isEditing}
                placeholder="#tags"
              />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
