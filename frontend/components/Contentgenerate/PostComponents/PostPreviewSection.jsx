
import React from "react";
import { SocialMediaPreview } from "../SocialPreviews/SocialMediaPreview";

export const PostPreviewSection = ({
  activeTab,
  content,
  imageUrl,
  hashtags,
  userLogoUrl,
  imageGenerating,
  generatedData,
  setGeneratedData,
  uiDisabled,
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col items-center lg:sticky lg:top-8">
      {/* Variant Selector (Dots above preview) */}
      {Array.isArray(generatedData.imageVariants) &&
        generatedData.imageVariants.length > 1 && (
          <div className="flex items-center gap-3 mb-6 bg-white/5 p-2 rounded-full backdrop-blur-sm border border-white/10 overflow-x-auto max-w-full">
            {generatedData.imageVariants.map((url, idx) => (
              <button
                key={idx}
                onClick={() =>
                  !uiDisabled &&
                  setGeneratedData((prev) => ({ ...prev, imageUrl: url }))
                }
                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                  generatedData.imageUrl === url
                    ? "border-orange-500 scale-110 shadow-lg shadow-orange-500/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={url}
                  alt={`Variant ${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

      <div className="w-full flex justify-center">
        <SocialMediaPreview
          platform={activeTab}
          content={content}
          imageUrl={imageUrl}
          hashtags={hashtags}
          brandName="Your Brand"
          userImage={userLogoUrl}
          isGenerating={imageGenerating}
        />
      </div>
    </div>
  );
};
